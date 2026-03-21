import path from "node:path";
import fs from "node:fs";
import { file, sql } from "bun";

const MIGRATIONS_DIR = path.join(process.cwd(), "migrations");

// Arbitrary stable lock ID — prevents concurrent migration runs across replicas.
const MIGRATION_LOCK_ID = 987654321;

async function migrate() {
	console.log("🚀 Starting database migrations with Bun.sql...");

	try {
		// Acquire session-level advisory lock so only one replica runs migrations at a time.
		await sql`SELECT pg_advisory_lock(${MIGRATION_LOCK_ID})`;

		// 1. Ensure migrations tracking table exists
		await sql`
            CREATE TABLE IF NOT EXISTS _migrations (
                id SERIAL PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `;

		// 2. Read existing migrations from DB
		const appliedMigrations = await sql`SELECT name FROM _migrations`;
		const appliedSet = new Set(appliedMigrations.map((m) => m.name));

		// 3. Find all .sql files in migrations directory
		if (!fs.existsSync(MIGRATIONS_DIR)) {
			console.error(`❌ Migrations directory not found: ${MIGRATIONS_DIR}`);
			process.exit(1);
		}

		const glob = new Bun.Glob("*.sql");
		const migrationFiles = [];
		for await (const f of glob.scan(MIGRATIONS_DIR)) {
			migrationFiles.push(f);
		}

		// Sort migrations by filename to ensure correct order
		migrationFiles.sort();

		let count = 0;
		for (const filename of migrationFiles) {
			if (appliedSet.has(filename)) {
				continue;
			}

			console.log(`⏳ Applying migration: ${filename}...`);
			const filePath = path.join(MIGRATIONS_DIR, filename);
			const content = await file(filePath).text();

			// Run migration in a transaction
			await sql.begin(async (sql) => {
				await sql.unsafe(content);
				await sql`INSERT INTO _migrations (name) VALUES (${filename})`;
			});

			console.log(`✅ Applied ${filename}`);
			count++;
		}

		if (count === 0) {
			console.log("✨ Database is already up to date.");
		} else {
			console.log(`🏁 Successfully applied ${count} migrations.`);
		}
	} catch (error) {
		console.error("❌ Migration failed:", error);
		process.exit(1);
	} finally {
		await sql`SELECT pg_advisory_unlock(${MIGRATION_LOCK_ID})`;
	}
}

migrate();
