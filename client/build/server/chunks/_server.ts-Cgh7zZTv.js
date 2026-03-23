import { b as private_env } from './shared-server-9-2j12mp.js';
import { r as redirect } from './index-Bm9GE3r4.js';
import './index-DyD4Z1FP.js';

//#region src/routes/api/auth/github/+server.ts
var BACKEND_URL = private_env.BACKEND_URL || "http://localhost:3002";
async function GET({ url }) {
	throw redirect(302, `${BACKEND_URL}/api/auth/github${url.search}`);
}

export { GET };
//# sourceMappingURL=_server.ts-Cgh7zZTv.js.map
