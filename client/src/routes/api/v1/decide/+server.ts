import { error, json, type NumericRange } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const BACKEND_URL =
	process.env.BACKEND_INTERNAL_URL || process.env.BACKEND_URL || "http://localhost:3002";

export const POST: RequestHandler = async ({ request, fetch, url }) => {
	try {
		const intent = await request.json();
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};
		const authHeader = request.headers.get("Authorization");
		if (authHeader) headers["Authorization"] = authHeader;

		const res = await fetch(`${BACKEND_URL}/api/v1/decide${url.search}`, {
			method: "POST",
			headers,
			body: JSON.stringify(intent),
		});

		if (!res.ok) {
			const errorText = await res.text();
			throw error(
				res.status as NumericRange<400, 599>,
				errorText || `Backend error: ${res.status}`
			);
		}

		const decision = await res.json();
		return json(decision);
	} catch (e: unknown) {
		console.error("Failed to proxy decide request to Backend API:", e);
		const message = e instanceof Error ? e.message : "Unknown error";
		throw error(500, `Backend communication failed: ${message}`);
	}
};
