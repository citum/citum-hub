import { e as error } from './index-Bm9GE3r4.js';
import './index-DyD4Z1FP.js';

//#region src/routes/api/styles/[id]/bookmark/+server.ts
var BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3002";
var POST = async ({ params, fetch, request, url }) => {
	try {
		const headers = { "Content-Type": "application/json" };
		const authHeader = request.headers.get("Authorization");
		if (authHeader) headers["Authorization"] = authHeader;
		const res = await fetch(`${BACKEND_URL}/api/styles/${params.id}/bookmark${url.search}`, {
			method: "POST",
			headers
		});
		if (!res.ok) throw error(res.status, "Backend error");
		return new Response(null, { status: 201 });
	} catch (e) {
		throw error(500, `Backend error: ${e instanceof Error ? e.message : "Unknown error"}`);
	}
};
var DELETE = async ({ params, fetch, request, url }) => {
	try {
		const headers = { "Content-Type": "application/json" };
		const authHeader = request.headers.get("Authorization");
		if (authHeader) headers["Authorization"] = authHeader;
		const res = await fetch(`${BACKEND_URL}/api/styles/${params.id}/bookmark${url.search}`, {
			method: "DELETE",
			headers
		});
		if (!res.ok) throw error(res.status, "Backend error");
		return new Response(null, { status: 204 });
	} catch (e) {
		throw error(500, `Backend error: ${e instanceof Error ? e.message : "Unknown error"}`);
	}
};

export { DELETE, POST };
//# sourceMappingURL=_server.ts-Bh2rIWYv.js.map
