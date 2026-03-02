import { error } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

const BACKEND_URL = env.BACKEND_URL || "http://localhost:3000";

export async function POST({ request, fetch }) {
	try {
		const intent = await request.json();
		const res = await fetch(`${BACKEND_URL}/api/v1/generate`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(intent),
		});

		if (!res.ok) {
			const errorText = await res.text();
			throw error(
				res.status as any,
				errorText || `Backend error: ${res.status}`,
			);
		}

		const citum = await res.text();
		return new Response(citum, {
			headers: {
				"Content-Type": "application/x-yaml",
				"Content-Disposition": 'attachment; filename="custom-style.yaml"',
			},
		});
	} catch (e: any) {
		console.error("Failed to proxy generate request to Rust backend:", e);
		throw error(500, `Backend communication failed: ${e.message}`);
	}
}
