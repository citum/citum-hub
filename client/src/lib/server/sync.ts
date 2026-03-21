import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { pool } from "$lib/server/db";
import { env } from "$env/dynamic/private";

export async function syncStyles({ onlyIfEmpty = false } = {}) {
	const coreDir = env.CITUM_CORE_PATH || "/app/citum-core";
	const stylesDir = path.join(coreDir, "styles");

	if (!fs.existsSync(stylesDir)) {
		console.warn(`syncStyles: styles directory not found at ${stylesDir}`);
		return;
	}

	const client = await pool.connect();
	try {
		if (onlyIfEmpty) {
			const { rows } = await client.query("SELECT COUNT(*)::int AS count FROM styles");
			if (rows[0].count > 0) {
				console.log("syncStyles: styles table already populated, skipping.");
				return;
			}
		}

		// Ensure system user exists
		const { rows: userRows } = await client.query(`
			INSERT INTO users (email, role)
			VALUES ('system@citum.org', 'admin')
			ON CONFLICT (email) DO UPDATE SET role = 'admin'
			RETURNING id
		`);
		const systemUserId = userRows[0].id;

		// Collect all yaml files recursively
		const yamlFiles = collectYamlFiles(stylesDir);
		console.log(`syncStyles: syncing ${yamlFiles.length} styles from ${stylesDir}`);

		for (const filePath of yamlFiles) {
			const filename = path.relative(stylesDir, filePath);
			if (filename.startsWith("experimental/")) continue;

			try {
				const content = fs.readFileSync(filePath, "utf8");
				const styleData = yaml.load(content) as { info?: { title?: string } };
				const title = styleData?.info?.title || filename.replace(/\.ya?ml$/, "");

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
					[systemUserId, title, filename, JSON.stringify({}), content]
				);
			} catch (err) {
				console.error(`syncStyles: failed to sync ${filename}:`, err);
			}
		}

		console.log("syncStyles: sync complete.");
	} finally {
		client.release();
	}
}

function collectYamlFiles(dir: string): string[] {
	const results: string[] = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			results.push(...collectYamlFiles(full));
		} else if (entry.name.endsWith(".yaml") || entry.name.endsWith(".yml")) {
			results.push(full);
		}
	}
	return results;
}
