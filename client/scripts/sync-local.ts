import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import yaml from "js-yaml";
import { Pool } from "pg";

// Load .env from the client directory
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const connectionString =
	process.env.DATABASE_URL ||
	"postgresql://postgres:password@localhost:5432/stylehub";
const LOCAL_STYLES_DIR = "/Users/brucedarcus/Code/citum/citum-core/styles";

function shouldSyncStyle(filename: string) {
	return !filename.startsWith("experimental/");
}

async function sync() {
	console.log("Connecting to DB...");
	const pool = new Pool({ connectionString });

	if (!fs.existsSync(LOCAL_STYLES_DIR)) {
		console.error(
			`Error: Local styles directory not found at ${LOCAL_STYLES_DIR}`,
		);
		process.exit(1);
	}

	try {
		const client = await pool.connect();

		// Helper to get all yaml files recursively
		function getYamlFiles(dir: string): string[] {
			let results: string[] = [];
			const list = fs.readdirSync(dir);
			for (let file of list) {
				file = path.join(dir, file);
				const stat = fs.statSync(file);
				if (stat?.isDirectory()) {
					results = results.concat(getYamlFiles(file));
				} else if (file.endsWith(".yaml") || file.endsWith(".yml")) {
					results.push(file);
				}
			}
			return results;
		}

		// 1. Ensure system user exists
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

		// 2. Read local styles recursively
		const allFiles = getYamlFiles(LOCAL_STYLES_DIR);

		console.log(`Found ${allFiles.length} local styles. Syncing...`);

		for (const filePath of allFiles) {
			const filename = path.relative(LOCAL_STYLES_DIR, filePath);
			if (!shouldSyncStyle(filename)) {
				continue;
			}
			try {
				const content = fs.readFileSync(filePath, "utf-8");
				const styleData = yaml.load(content) as { info?: { title?: string } };
				const title =
					styleData.info?.title || filename.replace(/\.yaml$|\.yml$/, "");

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
					[systemUserId, title, filename, {}, content],
				);

				console.log(`✓ ${filename}`);
			} catch (err) {
				console.error(`✗ Failed to sync ${filename}:`, err);
			}
		}

		client.release();
		console.log("Sync complete.");
	} catch (e) {
		console.error("Database connection failed:", e);
	} finally {
		await pool.end();
	}
}

sync();
