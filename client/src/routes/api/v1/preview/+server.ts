import { error, json } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

const BACKEND_URL = env.BACKEND_URL || "http://localhost:3000";

export async function POST({ request, fetch }) {
	try {
		const payload = await request.json();
		const res = await fetch(`${BACKEND_URL}/api/v1/preview`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		if (!res.ok) {
			const errorText = await res.text();
			throw error(
				res.status as any,
				errorText || `Backend error: ${res.status}`,
			);
		}

		const data = await res.json();
		return json(data);
	} catch (e: any) {
		console.error("Failed to proxy preview request to Rust backend:", e);
		throw error(500, `Backend communication failed: ${e.message}`);
	}
}
