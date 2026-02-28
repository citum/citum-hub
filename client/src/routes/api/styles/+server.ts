import { json, error } from '@sveltejs/kit';
import { pool } from '$lib/server/db';
import { requireAuth } from '$lib/server/auth';

export async function GET({ request }) {
    const user = await requireAuth(request);
    if (!user) throw error(401, 'Unauthorized');

    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT id, user_id, title, intent, csln, is_public, created_at, updated_at 
             FROM styles WHERE user_id = $1 ORDER BY updated_at DESC`,
            [user.id]
        );
        return json(result.rows);
    } finally {
        client.release();
    }
}

export async function POST({ request }) {
    const user = await requireAuth(request);
    if (!user) throw error(401, 'Unauthorized');

    const payload = await request.json();
    const { id, title, intent, csln, is_public } = payload;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        let style;
        if (id) {
            const result = await client.query(
                `UPDATE styles 
                 SET title = $1, intent = $2, csln = $3, is_public = $4
                 WHERE id = $5 AND user_id = $6
                 RETURNING *`,
                [title, intent, csln, is_public || false, id, user.id]
            );
            style = result.rows[0];
        } else {
            const result = await client.query(
                `INSERT INTO styles (user_id, title, intent, csln, is_public)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [user.id, title, intent, csln, is_public || false]
            );
            style = result.rows[0];
        }

        if (style) {
            await client.query(
                `INSERT INTO history (style_id, intent_snapshot) VALUES ($1, $2)`,
                [style.id, style.intent]
            );
        }

        await client.query('COMMIT');
        return json(style);
    } catch (e) {
        await client.query('ROLLBACK');
        throw error(500, 'Database error');
    } finally {
        client.release();
    }
}
