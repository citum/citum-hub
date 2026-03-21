// Migration ownership moved to hub-api startup (Dockerfile.hub-api CMD).
// hub-api runs migrations once before binding the Hono server.
// hub-web does not run migrations to prevent race conditions in multi-service deployments.

export async function handle({ event, resolve }) {
	const response = await resolve(event);
	return response;
}
