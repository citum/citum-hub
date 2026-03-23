import { j as json } from './index-Bm9GE3r4.js';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import './index-DyD4Z1FP.js';

//#region src/routes/references/+server.ts
async function GET() {
	try {
		const fileContents = fs.readFileSync(path.join(process.cwd(), "resources/comprehensive.yaml"), "utf8");
		return json(yaml.load(fileContents));
	} catch (e) {
		console.error("Failed to load references:", e);
		return json({}, { status: 500 });
	}
}

export { GET };
//# sourceMappingURL=_server.ts-CKAQhCxH.js.map
