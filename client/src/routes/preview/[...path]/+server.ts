import { error, type NumericRange } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

export const GET: RequestHandler = async ({ params, fetch }) => {
	try {
		const res = await fetch(`${BACKEND_URL}/preview/${params.path}`);

		if (!res.ok) {
			const errorText = await res.text();
			throw error(
				res.status as NumericRange<400, 599>,
				errorText || `Backend error: ${res.status}`
			);
		}

		// Pass through the response (image, etc)
		return new Response(res.body, {
			headers: {
				"Content-Type": res.headers.get("Content-Type") || "application/octet-stream",
			},
		});
	} catch (e: unknown) {
		console.error(`[Proxy] Preview ${params.path} Error:`, e);
		const message = e instanceof Error ? e.message : "Unknown error";
		throw error(500, `Preview failed: ${message}`);
	}
};
