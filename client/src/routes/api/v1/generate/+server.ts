import { generateCSLN } from '$lib/server/intent';
import type { StyleIntent } from '$lib/types/bindings';

export async function POST({ request }) {
    const intent: StyleIntent = await request.json();
    const csln = generateCSLN(intent);
    
    return new Response(csln, {
        headers: {
            'Content-Type': 'application/x-yaml',
            'Content-Disposition': 'attachment; filename="custom-style.yaml"'
        }
    });
}
