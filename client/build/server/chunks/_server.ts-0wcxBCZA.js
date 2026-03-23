import { b as private_env } from './shared-server-9-2j12mp.js';
import { j as json } from './index-Bm9GE3r4.js';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import pg from 'pg';
import './index-DyD4Z1FP.js';

//#region src/lib/server/db.ts
var { Pool } = pg;
var connectionString = private_env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/stylehub";
var maskedUrl = connectionString.replace(/:([^@]+)@/, ":****@");
console.log(`Connecting to DB: ${maskedUrl}`);
var pool = new Pool({ connectionString });
//#endregion
//#region src/lib/server/sync_styles.ts
var REPO_OWNER = "citum";
var REPO_NAME = "citum-core";
var STYLES_DIR = "styles";
var LOCAL_STYLES_DIR = path.resolve("../citum-core-main/styles");
function shouldSyncStyle(name) {
	return !name.startsWith("experimental/");
}
async function syncStylesFromGitHub() {
	if (fs.existsSync(LOCAL_STYLES_DIR)) {
		console.log(`Found local styles at ${LOCAL_STYLES_DIR}. Using local sync...`);
		return syncStylesLocally();
	}
	console.log("Starting style sync from GitHub...");
	try {
		const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${STYLES_DIR}`, { headers: { "User-Agent": "citum-hub-sync" } });
		if (!response.ok) throw new Error(`Failed to fetch style list: ${response.statusText}`);
		const files = await response.json();
		if (!Array.isArray(files)) throw new Error("Unexpected response from GitHub API: expected an array of files");
		await processSync(files.filter((f) => f.name.endsWith(".yaml") || f.name.endsWith(".yml")).map((f) => ({
			name: f.name,
			download_url: f.download_url
		})).filter((file) => shouldSyncStyle(file.name)));
		console.log("Sync complete.");
	} catch (e) {
		console.error("Sync failed:", e);
	}
}
async function syncStylesLocally() {
	try {
		await processSync(fs.readdirSync(LOCAL_STYLES_DIR).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml")).map((f) => ({
			name: f,
			content: fs.readFileSync(path.join(LOCAL_STYLES_DIR, f), "utf-8")
		})).filter((file) => shouldSyncStyle(file.name)));
		console.log("Local sync complete.");
	} catch (e) {
		console.error("Local sync failed:", e);
	}
}
async function processSync(files) {
	const client = await pool.connect();
	try {
		let systemUserId;
		const userRes = await client.query("SELECT id FROM users WHERE email = 'system@citum.org'");
		if (userRes.rows.length === 0) systemUserId = (await client.query("INSERT INTO users (email, role) VALUES ('system@citum.org', 'admin') RETURNING id")).rows[0].id;
		else systemUserId = userRes.rows[0].id;
		for (const file of files) try {
			console.log(`Syncing ${file.name}...`);
			let content = file.content;
			if (!content && file.download_url) content = await (await fetch(file.download_url)).text();
			if (!content) continue;
			const title = yaml.load(content).info?.title || file.name.replace(/\.yaml$|\.yml$/, "");
			await client.query(`
                    INSERT INTO styles (user_id, title, filename, intent, citum, is_public, updated_at)
                    VALUES ($1, $2, $3, $4, $5, true, NOW())
                    ON CONFLICT (filename) DO UPDATE SET 
                        title = EXCLUDED.title,
                        intent = EXCLUDED.intent,
                        citum = EXCLUDED.citum,
                        updated_at = NOW()
                `, [
				systemUserId,
				title,
				file.name,
				{},
				content
			]);
		} catch (err) {
			console.error(`Failed to sync ${file.name}:`, err);
		}
	} finally {
		client.release();
	}
}
//#endregion
//#region src/routes/api/admin/sync-styles/+server.ts
async function POST() {
	await syncStylesFromGitHub();
	return json({ message: "Sync triggered" });
}

export { POST };
//# sourceMappingURL=_server.ts-0wcxBCZA.js.map
