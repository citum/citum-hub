import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const BACKEND_URL = env.BACKEND_URL || 'http://localhost:3000';

export async function GET({ request, params, fetch }) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/styles/${params.id}`, {
            headers: {
                'Authorization': request.headers.get('Authorization') || ''
            }
        });
        if (!res.ok) throw error(res.status as any, 'Backend error');
        const data = await res.json();
        return json(data);
    } catch (e: any) {
        throw error(500, `Backend error: ${e.message}`);
    }
}

export async function PUT({ request, params, fetch }) {
    try {
        const body = await request.json();
        const res = await fetch(`${BACKEND_URL}/api/styles/${params.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': request.headers.get('Authorization') || ''
            },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw error(res.status as any, 'Backend error');
        const data = await res.json();
        return json(data);
    } catch (e: any) {
        throw error(500, `Backend error: ${e.message}`);
    }
}
