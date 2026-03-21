import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3002";

export const POST: RequestHandler = async ({ fetch, request, url }) => {
	try {
		const body = await request.text();
		const headers: Record<string, string> = {
			"Content-Type": request.headers.get("Content-Type") || "application/x-yaml",
		};
		const authHeader = request.headers.get("Authorization");
		if (authHeader) headers["Authorization"] = authHeader;

		const res = await fetch(`${BACKEND_URL}/api/admin/registry/import${url.search}`, {
			method: "POST",
			headers,
			body,
		});
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
