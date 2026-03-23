import { e as error } from './index-Bm9GE3r4.js';
import './index-DyD4Z1FP.js';

//#region src/routes/api/admin/registry/runs/+server.ts
var BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3002";
var GET = async ({ fetch, request, url }) => {
	try {
		const headers = {};
		const authHeader = request.headers.get("Authorization");
		if (authHeader) headers["Authorization"] = authHeader;
		const res = await fetch(`${BACKEND_URL}/api/admin/registry/runs${url.search}`, { headers });
		if (!res.ok) throw error(res.status, "Backend error");
		return new Response(await res.text(), {
			status: res.status,
			headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" }
		});
	} catch (e) {
		throw error(500, `Backend error: ${e instanceof Error ? e.message : "Unknown error"}`);
	}
};

export { GET };
//# sourceMappingURL=_server.ts-CWRq5puu.js.map
