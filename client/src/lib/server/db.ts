import pg from 'pg';
import { env } from '$env/dynamic/private';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

const connectionString = env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/stylehub';

// Mask password for logging
const maskedUrl = connectionString.replace(/:([^@]+)@/, ':****@');
console.log(`Connecting to DB: ${maskedUrl}`);

export const pool = new Pool({
    connectionString
});

/**
 * Very simple migration runner to ensure the database schema is up to date.
 */
export async function runMigrations() {
    console.log('Checking database migrations...');
    let client;
    try {
        client = await pool.connect();
        // Create a migrations table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS _migrations (
                name TEXT PRIMARY KEY,
                applied_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        const migrationsDir = path.join(process.cwd(), 'migrations');
        if (!fs.existsSync(migrationsDir)) {
            console.warn('Migrations directory not found at', migrationsDir);
            return;
        }

        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        for (const file of files) {
            const { rows } = await client.query('SELECT name FROM _migrations WHERE name = $1', [file]);
            if (rows.length === 0) {
                console.log(`Applying migration: ${file}`);
                const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
                
                await client.query('BEGIN');
                try {
                    await client.query(sql);
                    await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
                    await client.query('COMMIT');
                } catch (err) {
                    await client.query('ROLLBACK');
                    console.error(`Failed to apply migration ${file}:`, err);
                    throw err;
                }
            }
        }
        console.log('Database migrations complete.');
    } catch (err) {
        console.error('Migration connection error:', err);
        throw err;
    } finally {
        if (client) client.release();
    }
}
