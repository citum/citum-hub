import { generateCitum } from '$lib/server/intent';
import type { StyleIntent } from '$lib/types/bindings';

export async function POST({ request }) {
    const intent: StyleIntent = await request.json();
    const citum = generateCitum(intent);
    
    return new Response(citum, {
        headers: {
            'Content-Type': 'application/x-yaml',
            'Content-Disposition': 'attachment; filename="custom-style.yaml"'
        }
    });
}
