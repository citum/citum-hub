import { e as error, j as json } from './index-Bm9GE3r4.js';
import './index-DyD4Z1FP.js';

//#region src/routes/api/hub/+server.ts
var BACKEND_URL = process.env.BACKEND_INTERNAL_URL || process.env.BACKEND_URL || "http://localhost:3002";
var GET = async ({ fetch, url, request }) => {
	try {
		const headers = {};
		const authHeader = request.headers.get("Authorization");
		if (authHeader) headers["Authorization"] = authHeader;
		const res = await fetch(`${BACKEND_URL}/api/hub${url.search}`, { headers });
		if (!res.ok) throw error(res.status, "Backend error");
		return json(await res.json());
	} catch (e) {
		console.error("Failed to proxy hub request:", e);
		throw error(500, `Backend error: ${e instanceof Error ? e.message : "Unknown error"}`);
	}
};

export { GET };
//# sourceMappingURL=_server.ts-DGtGQOdN.js.map
