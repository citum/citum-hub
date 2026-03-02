import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { pool } from "./db";

const REPO_OWNER = "citum";
const REPO_NAME = "citum-core";
const STYLES_DIR = "styles";

// Path to local styles in this workspace
const LOCAL_STYLES_DIR = path.resolve("../citum-core-main/styles");

function shouldSyncStyle(name: string) {
	return !name.startsWith("experimental/");
}

export async function syncStylesFromGitHub() {
	// Check if we should use local files instead
	if (fs.existsSync(LOCAL_STYLES_DIR)) {
		console.log(
			`Found local styles at ${LOCAL_STYLES_DIR}. Using local sync...`,
		);
		return syncStylesLocally();
	}

	console.log("Starting style sync from GitHub...");

	try {
		const response = await fetch(
			`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${STYLES_DIR}`,
			{
				headers: { "User-Agent": "citum-hub-sync" },
			},
		);

		if (!response.ok) {
			throw new Error(`Failed to fetch style list: ${response.statusText}`);
		}

		const files = await response.json();
		if (!Array.isArray(files)) {
			throw new Error(
				"Unexpected response from GitHub API: expected an array of files",
			);
		}

		const yamlFiles = (
			files as { name: string; download_url: string }[]
		).filter((f) => f.name.endsWith(".yaml") || f.name.endsWith(".yml"));
		await processSync(
			yamlFiles
				.map((f) => ({ name: f.name, download_url: f.download_url }))
				.filter((file) => shouldSyncStyle(file.name)),
		);

		console.log("Sync complete.");
	} catch (e) {
		console.error("Sync failed:", e);
	}
}

async function syncStylesLocally() {
	try {
		const files = fs.readdirSync(LOCAL_STYLES_DIR);
		const yamlFiles = files
			.filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
			.map((f) => ({
				name: f,
				content: fs.readFileSync(path.join(LOCAL_STYLES_DIR, f), "utf-8"),
			}))
			.filter((file) => shouldSyncStyle(file.name));

		await processSync(yamlFiles);
		console.log("Local sync complete.");
	} catch (e) {
		console.error("Local sync failed:", e);
	}
}

interface SyncFile {
	name: string;
	content?: string;
	download_url?: string;
}

async function processSync(files: SyncFile[]) {
	const client = await pool.connect();
	try {
		let systemUserId: string;
		const userRes = await client.query(
			"SELECT id FROM users WHERE email = 'system@citum.org'",
		);
		if (userRes.rows.length === 0) {
			const newUser = await client.query(
				"INSERT INTO users (email, role) VALUES ('system@citum.org', 'admin') RETURNING id",
			);
			systemUserId = newUser.rows[0].id;
		} else {
			systemUserId = userRes.rows[0].id;
		}

		for (const file of files) {
			try {
				console.log(`Syncing ${file.name}...`);

				let content = file.content;
				if (!content && file.download_url) {
					const contentRes = await fetch(file.download_url);
					content = await contentRes.text();
				}

				if (!content) continue;

				const styleData = yaml.load(content) as { info?: { title?: string } };
				const title =
					styleData.info?.title || file.name.replace(/\.yaml$|\.yml$/, "");

				// Note: 'citum' column stores the raw YAML string
				await client.query(
					`
                    INSERT INTO styles (user_id, title, filename, intent, citum, is_public, updated_at)
                    VALUES ($1, $2, $3, $4, $5, true, NOW())
                    ON CONFLICT (filename) DO UPDATE SET 
                        title = EXCLUDED.title,
                        intent = EXCLUDED.intent,
                        citum = EXCLUDED.citum,
                        updated_at = NOW()
                `,
					[systemUserId, title, file.name, {}, content],
				);
			} catch (err) {
				console.error(`Failed to sync ${file.name}:`, err);
			}
		}
	} finally {
		client.release();
	}
}
