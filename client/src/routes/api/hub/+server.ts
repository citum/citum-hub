import { error, json } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

const BACKEND_URL = env.BACKEND_URL || "http://localhost:3000";

export async function GET({ fetch }) {
	try {
		const res = await fetch(`${BACKEND_URL}/api/hub`);
		if (!res.ok) throw error(res.status as any, "Backend error");
		const data = await res.json();
		return json(data);
	} catch (e: any) {
		console.error("Failed to proxy hub request:", e);
		throw error(500, `Backend error: ${e.message}`);
	}
}
