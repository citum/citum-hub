import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

export async function POST({ request, params, fetch }) {
    const citumUrl = env.CITUM_URL || 'http://127.0.0.1:3001';
    
    try {
        const payload = await request.text();
        const response = await fetch(`${citumUrl}/preview/${params.path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload
        });
        
        const data = await response.json();
        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        console.error(e);
        throw error(500, 'Error communicating with citum-server');
    }
}
