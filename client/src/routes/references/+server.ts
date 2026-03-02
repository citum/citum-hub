import { json } from "@sveltejs/kit";
import fs from "fs";
import yaml from "js-yaml";
import path from "path";

export async function GET() {
	try {
		const fileContents = fs.readFileSync(
			path.join(process.cwd(), "resources/comprehensive.yaml"),
			"utf8",
		);
		const data = yaml.load(fileContents);
		return json(data);
	} catch (e) {
		console.error("Failed to load references:", e);
		return json({}, { status: 500 });
	}
}
