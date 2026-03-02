import { error, json, type NumericRange } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

export const GET: RequestHandler = async ({ params, fetch }) => {
	try {
		const res = await fetch(`${BACKEND_URL}/api/styles/${params.id}`, {
			headers: { "Content-Type": "application/json" },
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

export const PATCH: RequestHandler = async ({ params, request, fetch }) => {
	try {
		const body = await request.json();
		const res = await fetch(`${BACKEND_URL}/api/styles/${params.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
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
