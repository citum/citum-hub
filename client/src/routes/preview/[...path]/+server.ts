import { error } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

const BACKEND_URL = env.BACKEND_URL || "http://localhost:3000";

export async function POST({ request, params, fetch }) {
	try {
		const body = await request.json();
		const endpoint =
			params.path === "citation"
				? "/preview/citation"
				: "/preview/bibliography";

		const res = await fetch(`${BACKEND_URL}${endpoint}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});

		if (!res.ok) {
			const errorText = await res.text();
			throw error(
				res.status as any,
				errorText || `Backend error: ${res.status}`,
			);
		}

		const data = await res.json();
		return new Response(JSON.stringify(data), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (e: any) {
		console.error(`[Proxy] Preview ${params.path} Error:`, e);
		throw error(500, `Preview failed: ${e.message}`);
	}
}
