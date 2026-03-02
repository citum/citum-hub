import { error, json } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

const BACKEND_URL = env.BACKEND_URL || "http://localhost:3000";

export async function GET({ request, fetch }) {
	try {
		const res = await fetch(`${BACKEND_URL}/api/styles`, {
			headers: {
				Authorization: request.headers.get("Authorization") || "",
			},
		});
		if (!res.ok) throw error(res.status as any, "Backend error");
		const data = await res.json();
		return json(data);
	} catch (e: any) {
		throw error(500, `Backend error: ${e.message}`);
	}
}

export async function POST({ request, fetch }) {
	try {
		const body = await request.json();
		const res = await fetch(`${BACKEND_URL}/api/styles`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: request.headers.get("Authorization") || "",
			},
			body: JSON.stringify(body),
		});
		if (!res.ok) throw error(res.status as any, "Backend error");
		const data = await res.json();
		return json(data);
	} catch (e: any) {
		throw error(500, `Backend error: ${e.message}`);
	}
}
