import { e as error } from './index-Bm9GE3r4.js';
import './index-DyD4Z1FP.js';

//#region src/routes/api/admin/registry/export/+server.ts
var BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3002";
var GET = async ({ fetch, request, url }) => {
	try {
		const headers = {};
		const authHeader = request.headers.get("Authorization");
		if (authHeader) headers["Authorization"] = authHeader;
		const res = await fetch(`${BACKEND_URL}/api/admin/registry/export${url.search}`, { headers });
		if (!res.ok) throw error(res.status, "Backend error");
		const responseHeaders = new Headers();
		const contentType = res.headers.get("Content-Type");
		const contentDisposition = res.headers.get("Content-Disposition");
		if (contentType) responseHeaders.set("Content-Type", contentType);
		if (contentDisposition) responseHeaders.set("Content-Disposition", contentDisposition);
		return new Response(await res.text(), {
			status: res.status,
			headers: responseHeaders
		});
	} catch (e) {
		throw error(500, `Backend error: ${e instanceof Error ? e.message : "Unknown error"}`);
	}
};

export { GET };
//# sourceMappingURL=_server.ts-Oww7ctaM.js.map
