import type { RequestEvent } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

const BACKEND_URL = env.BACKEND_URL || "http://localhost:3002";

export async function GET({ url }: RequestEvent) {
	// We redirect the user directly to the Backend API auth endpoint
	throw redirect(302, `${BACKEND_URL}/api/auth/github${url.search}`);
}
