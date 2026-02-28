import { json, error } from '@sveltejs/kit';
import { pool } from '$lib/server/db';
import { requireAuth } from '$lib/server/auth';

export async function POST({ request, params }) {
    const user = await requireAuth(request);
    if (!user) throw error(401, 'Unauthorized');

    const client = await pool.connect();
    try {
        const original = await client.query(
            `SELECT title, intent, csln FROM styles 
             WHERE id = $1 AND (is_public = true OR user_id = $2)`,
            [params.id, user.id]
        );

        if (original.rows.length === 0) {
            throw error(404, 'Source style not found');
        }

        const source = original.rows[0];
        const forkedTitle = `${source.title} (Fork)`;

        const result = await client.query(
            `INSERT INTO styles (user_id, title, intent, csln, is_public)
             VALUES ($1, $2, $3, $4, false)
             RETURNING *`,
            [user.id, forkedTitle, source.intent, source.csln]
        );

        return json(result.rows[0]);
    } finally {
        client.release();
    }
}
