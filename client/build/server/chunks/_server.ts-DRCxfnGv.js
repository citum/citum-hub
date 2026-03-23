import { e as error } from './index-Bm9GE3r4.js';
import './index-DyD4Z1FP.js';

//#region src/routes/preview/[...path]/+server.ts
var BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";
var GET = async ({ params, fetch }) => {
	try {
		const res = await fetch(`${BACKEND_URL}/preview/${params.path}`);
		if (!res.ok) {
			const errorText = await res.text();
			throw error(res.status, errorText || `Backend error: ${res.status}`);
		}
		return new Response(res.body, { headers: { "Content-Type": res.headers.get("Content-Type") || "application/octet-stream" } });
	} catch (e) {
		console.error(`[Proxy] Preview ${params.path} Error:`, e);
		throw error(500, `Preview failed: ${e instanceof Error ? e.message : "Unknown error"}`);
	}
};

export { GET };
//# sourceMappingURL=_server.ts-DRCxfnGv.js.map
