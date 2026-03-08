import { error, redirect } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

const BACKEND_URL = env.BACKEND_URL || "http://localhost:3002";

export async function GET({ url }) {
	const code = url.searchParams.get("code");

	if (!code) throw error(400, "Missing code");

	// Forward all query params (code, state, etc.) to backend callback
	throw redirect(302, `${BACKEND_URL}/api/auth/github/callback${url.search}`);
}
