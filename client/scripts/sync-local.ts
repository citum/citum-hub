import path from "node:path";
import { exists, file, sql } from "bun";
import yaml from "js-yaml";

const LOCAL_STYLES_DIR = "/Users/brucedarcus/Code/citum/citum-core/styles";

function shouldSyncStyle(filename: string) {
	return !filename.startsWith("experimental/");
}

async function sync() {
	console.log("Connecting to DB with Bun.sql...");

	if (!(await exists(LOCAL_STYLES_DIR))) {
		console.error(`Error: Local styles directory not found at ${LOCAL_STYLES_DIR}`);
		process.exit(1);
	}

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

		console.log(`Found ${allFiles.length} local styles. Syncing...`);

		for (const filePath of allFiles) {
			const filename = path.relative(LOCAL_STYLES_DIR, filePath);
			if (!shouldSyncStyle(filename)) {
				continue;
			}
			try {
				// Use Bun.file for high-performance reading
				const content = await file(filePath).text();
				const styleData = yaml.load(content) as { info?: { title?: string } };
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
	} catch (e) {
		console.error("Sync failed:", e);
	}
}

sync();
