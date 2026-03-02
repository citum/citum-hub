import { error, redirect } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

const BACKEND_URL = env.BACKEND_URL || "http://localhost:3000";

export async function GET({ url }) {
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");

	if (!code || !state) throw error(400, "Missing code or state");

	// Redirect to backend callback
	throw redirect(
		302,
		`${BACKEND_URL}/api/auth/github/callback?code=${code}&state=${state}`,
	);
}
