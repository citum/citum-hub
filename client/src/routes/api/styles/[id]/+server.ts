import { json, error } from '@sveltejs/kit';
import { pool } from '$lib/server/db';
import { requireAuth } from '$lib/server/auth';

export async function GET({ request, params }) {
    const user = await requireAuth(request);
    if (!user) throw error(401, 'Unauthorized');

    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT id, user_id, title, intent, csln, is_public, created_at, updated_at 
             FROM styles WHERE id = $1 AND (user_id = $2 OR is_public = true)`,
            [params.id, user.id]
        );
        
        if (result.rows.length === 0) {
            throw error(404, 'Not found');
        }
        
        return json(result.rows[0]);
    } finally {
        client.release();
    }
}
