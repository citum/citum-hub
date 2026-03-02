import { error, redirect } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

const BACKEND_URL = env.BACKEND_URL || "http://localhost:3000";

export async function GET() {
	// We redirect the user directly to the Rust server's auth endpoint
	throw redirect(302, `${BACKEND_URL}/api/auth/github`);
}
