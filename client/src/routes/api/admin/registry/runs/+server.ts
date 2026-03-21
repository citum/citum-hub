import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3002";

export const GET: RequestHandler = async ({ fetch, request, url }) => {
	try {
		const headers: Record<string, string> = {};
		const authHeader = request.headers.get("Authorization");
		if (authHeader) headers["Authorization"] = authHeader;

		const res = await fetch(`${BACKEND_URL}/api/admin/registry/runs${url.search}`, { headers });
		if (!res.ok) {
			throw error(res.status, "Backend error");
		}
		return new Response(await res.text(), {
			status: res.status,
			headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
		});
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : "Unknown error";
		throw error(500, `Backend error: ${message}`);
	}
};
