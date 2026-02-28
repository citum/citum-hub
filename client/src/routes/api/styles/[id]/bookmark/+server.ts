import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const BACKEND_URL = env.BACKEND_URL || 'http://localhost:3000';

export async function POST({ request, params, fetch }) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/styles/${params.id}/bookmark`, {
            method: 'POST',
            headers: {
                'Authorization': request.headers.get('Authorization') || ''
            }
        });
        if (!res.ok) throw error(res.status as any, 'Backend error');
        return new Response(null, { status: 201 });
    } catch (e: any) {
        throw error(500, `Backend error: ${e.message}`);
    }
}

export async function DELETE({ request, params, fetch }) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/styles/${params.id}/bookmark`, {
            method: 'DELETE',
            headers: {
                'Authorization': request.headers.get('Authorization') || ''
            }
        });
        if (!res.ok) throw error(res.status as any, 'Backend error');
        return new Response(null, { status: 204 });
    } catch (e: any) {
        throw error(500, `Backend error: ${e.message}`);
    }
}
