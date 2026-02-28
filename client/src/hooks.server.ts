import { runMigrations } from '$lib/server/db';

// Run migrations on startup
// In SvelteKit, this code runs when the server starts up.
runMigrations().catch(err => {
    console.error('Failed to run database migrations on startup:', err);
});

export async function handle({ event, resolve }) {
    const response = await resolve(event);
    return response;
}
