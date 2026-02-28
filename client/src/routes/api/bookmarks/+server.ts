import { json, error } from '@sveltejs/kit';
import { pool } from '$lib/server/db';
import { requireAuth } from '$lib/server/auth';

export async function GET({ request }) {
    const user = await requireAuth(request);
    if (!user) throw error(401, 'Unauthorized');

    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT s.id, s.user_id, s.title, s.intent, s.citum, s.is_public, s.created_at, s.updated_at 
             FROM styles s
             JOIN bookmarks b ON s.id = b.style_id
             WHERE b.user_id = $1
             ORDER BY b.created_at DESC`,
            [user.id]
        );
        return json(result.rows);
    } finally {
        client.release();
    }
}
