import { json, error } from '@sveltejs/kit';
import { pool } from '$lib/server/db';
import { requireAuth } from '$lib/server/auth';

export async function POST({ request, params }) {
    const user = await requireAuth(request);
    if (!user) throw error(401, 'Unauthorized');

    const client = await pool.connect();
    try {
        await client.query(
            `INSERT INTO bookmarks (user_id, style_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [user.id, params.id]
        );
        return new Response(null, { status: 201 });
    } catch (e) {
        throw error(500, 'Database error');
    } finally {
        client.release();
    }
}

export async function DELETE({ request, params }) {
    const user = await requireAuth(request);
    if (!user) throw error(401, 'Unauthorized');

    const client = await pool.connect();
    try {
        await client.query(
            `DELETE FROM bookmarks WHERE user_id = $1 AND style_id = $2`,
            [user.id, params.id]
        );
        return new Response(null, { status: 204 });
    } finally {
        client.release();
    }
}
