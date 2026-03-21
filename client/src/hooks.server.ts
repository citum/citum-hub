import { runMigrations } from "$lib/server/db";
import { syncStyles } from "$lib/server/sync";

runMigrations()
	.then(() => syncStyles({ onlyIfEmpty: true }))
	.catch((err) => console.error("Startup error:", err));

export async function handle({ event, resolve }) {
	const response = await resolve(event);
	return response;
}
