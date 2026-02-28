import { json, error } from '@sveltejs/kit';
import { pool } from '$lib/server/db';

export async function GET() {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT id, user_id, title, intent, citum, is_public, created_at, updated_at 
             FROM styles WHERE is_public = true ORDER BY updated_at DESC`
        );
        return json(result.rows);
    } catch (err: any) {
        console.error('Database error in /api/hub:', err);
        throw error(500, `Database error: ${err.message}`);
    } finally {
        client.release();
    }
}
