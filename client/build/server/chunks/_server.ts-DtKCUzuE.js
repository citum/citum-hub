import { e as error, j as json } from './index-Bm9GE3r4.js';
import './index-DyD4Z1FP.js';

//#region src/routes/api/styles/[id]/fork/+server.ts
var BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3002";
var POST = async ({ params, fetch, request, url }) => {
	try {
		const headers = { "Content-Type": "application/json" };
		const authHeader = request.headers.get("Authorization");
		if (authHeader) headers["Authorization"] = authHeader;
		const res = await fetch(`${BACKEND_URL}/api/styles/${params.id}/fork${url.search}`, {
			method: "POST",
			headers
		});
		if (!res.ok) throw error(res.status, "Backend error");
		return json(await res.json());
	} catch (e) {
		throw error(500, `Backend error: ${e instanceof Error ? e.message : "Unknown error"}`);
	}
};

export { POST };
//# sourceMappingURL=_server.ts-DtKCUzuE.js.map
