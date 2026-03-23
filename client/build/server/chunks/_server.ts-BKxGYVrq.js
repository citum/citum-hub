import { e as error, j as json } from './index-Bm9GE3r4.js';
import './index-DyD4Z1FP.js';

//#region src/routes/api/v1/decide/+server.ts
var BACKEND_URL = process.env.BACKEND_INTERNAL_URL || process.env.BACKEND_URL || "http://localhost:3002";
var POST = async ({ request, fetch, url }) => {
	try {
		const intent = await request.json();
		const headers = { "Content-Type": "application/json" };
		const authHeader = request.headers.get("Authorization");
		if (authHeader) headers["Authorization"] = authHeader;
		const res = await fetch(`${BACKEND_URL}/api/v1/decide${url.search}`, {
			method: "POST",
			headers,
			body: JSON.stringify(intent)
		});
		if (!res.ok) {
			const errorText = await res.text();
			throw error(res.status, errorText || `Backend error: ${res.status}`);
		}
		return json(await res.json());
	} catch (e) {
		console.error("Failed to proxy decide request to Backend API:", e);
		throw error(500, `Backend communication failed: ${e instanceof Error ? e.message : "Unknown error"}`);
	}
};

export { POST };
//# sourceMappingURL=_server.ts-BKxGYVrq.js.map
