import { pool } from './db';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Note: This script is intended to be run manually or triggered by an admin
// It expects a local clone of citum-core at a specific path, OR it can fetch from GitHub
// Since we are in a container/restricted environment, we'll implement a GitHub fetcher.

const REPO_OWNER = 'citum';
const REPO_NAME = 'citum-core';
const STYLES_DIR = 'styles';

export async function syncStylesFromGitHub() {
    console.log('Starting style sync from GitHub...');
    
    try {
        // 1. Get list of styles from GitHub API
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${STYLES_DIR}`, {
            headers: { 'User-Agent': 'citum-hub-sync' }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch style list: ${response.statusText}`);
        }

        const files = await response.json();
        const yamlFiles = files.filter((f: any) => f.name.endsWith('.yaml') || f.name.endsWith('.yml'));

        console.log(`Found ${yamlFiles.length} styles to sync.`);

        const client = await pool.connect();
        try {
            // Get a system user ID (create one if not exists)
            let systemUserId;
            const userRes = await client.query("SELECT id FROM users WHERE email = 'system@citum.org'");
            if (userRes.rows.length === 0) {
                const newUser = await client.query(
                    "INSERT INTO users (email, role) VALUES ('system@citum.org', 'admin') RETURNING id"
                );
                systemUserId = newUser.rows[0].id;
            } else {
                systemUserId = userRes.rows[0].id;
            }

            for (const file of yamlFiles) {
                console.log(`Syncing ${file.name}...`);
                
                const contentRes = await fetch(file.download_url);
                const content = await contentRes.text();
                const styleData = yaml.load(content) as any;
                
                const title = styleData.info?.title || file.name.replace('.yaml', '');
                
                // Upsert into styles table
                await client.query(`
                    INSERT INTO styles (user_id, title, intent, citum, is_public, updated_at)
                    VALUES ($1, $2, $3, $4, true, NOW())
                    ON CONFLICT (id) DO UPDATE SET 
                        title = EXCLUDED.title,
                        intent = EXCLUDED.intent,
                        citum = EXCLUDED.citum,
                        updated_at = NOW()
                `, [systemUserId, title, {}, content]);
            }
        } finally {
            client.release();
        }

        console.log('Sync complete.');
    } catch (e) {
        console.error('Sync failed:', e);
    }
}
