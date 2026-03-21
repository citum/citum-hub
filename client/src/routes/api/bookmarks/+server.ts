import { error, json, type NumericRange } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3002";

export const GET: RequestHandler = async ({ fetch, request, url }) => {
	try {
		// In demo mode, return empty bookmarks array
		const demoMode = process.env.PUBLIC_DEMO_MODE === "true";
		if (demoMode) {
			return json([]);
		}

		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};
		const authHeader = request.headers.get("Authorization");
		if (authHeader) headers["Authorization"] = authHeader;

		const res = await fetch(`${BACKEND_URL}/api/bookmarks${url.search}`, {
			headers,
		});
		if (!res.ok) {
			throw error(res.status as NumericRange<400, 599>, "Backend error");
		}
		const data = await res.json();
		return json(data);
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : "Unknown error";
		throw error(500, `Backend error: ${message}`);
	}
};
