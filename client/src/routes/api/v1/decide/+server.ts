import { json } from '@sveltejs/kit';
import { decide, toStyle } from '$lib/server/intent';
import type { StyleIntent } from '$lib/types/bindings';

export async function POST({ request, fetch }) {
    const intent: StyleIntent = await request.json();
    const decision = decide(intent);
    
    // Only generate previews if enough intent is present
    if (intent.class) {
        try {
            const style = toStyle(intent);
            const refsResponse = await fetch('/references');
            const refsData = await refsResponse.json();
            const references = Object.entries(refsData)
                .slice(0, 3)
                .map(([id, ref]: [string, any]) => ({ ...ref, id }));

            const [citRes, bibRes] = await Promise.all([
                fetch('/preview/citation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ style, references })
                }),
                fetch('/preview/bibliography', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ style, references })
                })
            ]);

            if (citRes.ok) {
                const data = await citRes.json();
                decision.in_text_preview = data.result;
            }
            if (bibRes.ok) {
                const data = await bibRes.json();
                decision.bibliography_preview = data.result;
            }
        } catch (e) {
            console.error('Failed to generate previews in decide', e);
        }
    }

    return json(decision);
}
