import { error, type NumericRange } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

export const POST: RequestHandler = async ({ params, fetch }) => {
	try {
		const res = await fetch(`${BACKEND_URL}/api/styles/${params.id}/bookmark`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
		});
		if (!res.ok) {
			throw error(res.status as NumericRange<400, 599>, "Backend error");
		}
		return new Response(null, { status: 201 });
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : "Unknown error";
		throw error(500, `Backend error: ${message}`);
	}
};

export const DELETE: RequestHandler = async ({ params, fetch }) => {
	try {
		const res = await fetch(`${BACKEND_URL}/api/styles/${params.id}/bookmark`, {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
		});
		if (!res.ok) {
			throw error(res.status as NumericRange<400, 599>, "Backend error");
		}
		return new Response(null, { status: 204 });
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : "Unknown error";
		throw error(500, `Backend error: ${message}`);
	}
};
