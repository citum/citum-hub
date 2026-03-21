import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const BACKEND_URL =
	process.env.BACKEND_INTERNAL_URL || process.env.BACKEND_URL || "http://localhost:3002";

export const GET: RequestHandler = async ({ params, fetch, request, url }) => {
	try {
		const headers: Record<string, string> = {};
		const authHeader = request.headers.get("Authorization");
		if (authHeader) headers["Authorization"] = authHeader;

		const res = await fetch(
			`${BACKEND_URL}/api/hub/${encodeURIComponent(params.styleKey)}/download${url.search}`,
			{ headers }
		);
		if (!res.ok) {
			throw error(res.status, "Backend error");
		}

		const responseHeaders = new Headers();
		const contentType = res.headers.get("Content-Type");
		const contentDisposition = res.headers.get("Content-Disposition");
		if (contentType) responseHeaders.set("Content-Type", contentType);
		if (contentDisposition) responseHeaders.set("Content-Disposition", contentDisposition);

		return new Response(await res.text(), {
			status: res.status,
			headers: responseHeaders,
		});
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : "Unknown error";
		throw error(500, `Backend error: ${message}`);
	}
};
