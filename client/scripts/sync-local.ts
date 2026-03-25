import path from "node:path";
import fs from "node:fs";
import { file, sql } from "bun";
import yaml from "js-yaml";
import { syncRegistryData } from "../src/lib/server/registry.ts";

const PROJECT_ROOT = path.resolve(process.cwd(), "..");
const configuredResourceRoot = process.env.CITUM_CORE_PATH;

// Look for citum-core in sibling directory if not explicitly configured
const siblingCorePath = path.resolve(PROJECT_ROOT, "..", "citum-core");
const actualCorePath =
	configuredResourceRoot || (fs.existsSync(siblingCorePath) ? siblingCorePath : null);

const LOCAL_STYLES_DIR =
	actualCorePath && fs.existsSync(path.join(actualCorePath, "styles"))
		? path.join(actualCorePath, "styles")
		: actualCorePath && fs.existsSync(path.join(actualCorePath, "resources", "styles"))
			? path.join(actualCorePath, "resources", "styles")
			: path.join(PROJECT_ROOT, "resources", "styles");

function shouldSyncStyle(filename: string) {
	return !filename.startsWith("experimental/");
}

async function sync() {
	console.log("Connecting to DB with Bun.sql...");

	if (!LOCAL_STYLES_DIR || !fs.existsSync(LOCAL_STYLES_DIR)) {
		console.error(`Error: Local styles directory not found at ${LOCAL_STYLES_DIR || "undefined"}.`);
		console.error("Please set CITUM_CORE_PATH to the path of your citum-core repository.");
		process.exit(1);
	}

	// Define a custom schema to handle !custom tags
	const CUSTOM_TAG = new yaml.Type("!custom", {
		kind: "mapping",
		construct: (data) => data,
	});
	const CITUM_SCHEMA = yaml.DEFAULT_SCHEMA.extend([CUSTOM_TAG]);

	try {
		// Helper to get all yaml files recursively using Bun.file and Bun.Glob
		async function getYamlFiles(dir: string): Promise<string[]> {
			const results: string[] = [];
			const glob = new Bun.Glob("**/*.{yaml,yml}");

			for await (const f of glob.scan(dir)) {
				results.push(path.join(dir, f));
			}
			return results;
		}

		// 1. Ensure system user exists using Bun.sql
		const [systemUser] = await sql`
            INSERT INTO users (email, role) 
            VALUES ('system@citum.org', 'admin') 
            ON CONFLICT (email) DO UPDATE SET role = 'admin'
            RETURNING id
        `;

		const systemUserId = systemUser.id;

		// 2. Read local styles recursively
		const allFiles = await getYamlFiles(LOCAL_STYLES_DIR);

		if (allFiles.length === 0) {
			console.error(`Error: No styles found in ${LOCAL_STYLES_DIR}.`);
			console.error("Aborting sync to prevent accidental deletion of existing database records.");
			process.exit(1);
		}

		console.log(`Found ${allFiles.length} local styles. Syncing...`);

		for (const filePath of allFiles) {
			const filename = path.relative(LOCAL_STYLES_DIR, filePath);
			if (!shouldSyncStyle(filename)) {
				continue;
			}
			try {
				// Use Bun.file for high-performance reading
				const content = await file(filePath).text();
				// Use custom schema to handle tags like !custom
				const styleData = yaml.load(content, { schema: CITUM_SCHEMA }) as {
					info?: { title?: string };
				};
				const title = styleData.info?.title || filename.replace(/\.yaml$|\.yml$/, "");

				await sql`
                    INSERT INTO styles (user_id, title, filename, intent, citum, is_public, updated_at)
                    VALUES (${systemUserId}, ${title}, ${filename}, ${JSON.stringify({})}, ${content}, true, NOW())
                    ON CONFLICT (filename) DO UPDATE SET 
                        title = EXCLUDED.title,
                        intent = EXCLUDED.intent,
                        citum = EXCLUDED.citum,
                        updated_at = NOW()
                `;

				console.log(`✓ ${filename}`);
			} catch (err) {
				console.error(`✗ Failed to sync ${filename}:`, err);
			}
		}

		console.log("Sync complete.");

		// 3. Cleanup stale styles (optional but recommended to avoid "no preview data" errors)
		const syncedFilenames = allFiles
			.map((f) => path.relative(LOCAL_STYLES_DIR, f))
			.filter(shouldSyncStyle);
		const deleted = await sql`
			DELETE FROM styles 
			WHERE filename IS NOT NULL 
			AND filename NOT IN ${sql(syncedFilenames)}
		`;
		const deletedNull = await sql`DELETE FROM styles WHERE filename IS NULL`;
		console.log(`Cleaned up ${deleted.length + deletedNull.length} stale styles.`);

		console.log("Syncing registry and aliases...");
		const summary = await syncRegistryData();
		console.log("Registry sync complete:", summary);
	} catch (e) {
		console.error("Sync failed:", e);
	}
}

sync();
