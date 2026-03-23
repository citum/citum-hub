import { b as private_env } from './shared-server-9-2j12mp.js';
import { e as error, r as redirect } from './index-Bm9GE3r4.js';
import './index-DyD4Z1FP.js';

//#region src/routes/api/auth/github/callback/+server.ts
var BACKEND_URL = private_env.BACKEND_URL || "http://localhost:3002";
async function GET({ url }) {
	if (!url.searchParams.get("code")) throw error(400, "Missing code");
	throw redirect(302, `${BACKEND_URL}/api/auth/github/callback${url.search}`);
}

export { GET };
//# sourceMappingURL=_server.ts-Q6RNgjeT.js.map
