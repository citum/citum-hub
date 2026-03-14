import { error, type NumericRange } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3002";

export const POST: RequestHandler = async ({ params, fetch, request, url }) => {
	try {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};
		const authHeader = request.headers.get("Authorization");
		if (authHeader) headers["Authorization"] = authHeader;

		const res = await fetch(
			`${BACKEND_URL}/api/styles/${params.id}/bookmark${url.search}`,
			{
				method: "POST",
				headers,
			},
		);
		if (!res.ok) {
			throw error(res.status as NumericRange<400, 599>, "Backend error");
		}
		return new Response(null, { status: 201 });
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : "Unknown error";
		throw error(500, `Backend error: ${message}`);
	}
};

export const DELETE: RequestHandler = async ({
	params,
	fetch,
	request,
	url,
}) => {
	try {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};
		const authHeader = request.headers.get("Authorization");
		if (authHeader) headers["Authorization"] = authHeader;

		const res = await fetch(
			`${BACKEND_URL}/api/styles/${params.id}/bookmark${url.search}`,
			{
				method: "DELETE",
				headers,
			},
		);
		if (!res.ok) {
			throw error(res.status as NumericRange<400, 599>, "Backend error");
		}
		return new Response(null, { status: 204 });
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : "Unknown error";
		throw error(500, `Backend error: ${message}`);
	}
};
