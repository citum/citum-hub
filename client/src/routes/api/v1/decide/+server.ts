import { json } from '@sveltejs/kit';
import { decide, toStyle } from '$lib/intent';
import type { StyleIntent } from '$lib/types/bindings';

export async function POST({ request, fetch }) {
    const intent: StyleIntent = await request.json();
    const decision = decide(intent);
    
    // Only generate previews if enough intent is present
    if (intent.class) {
        console.log(`[Decide] Generating previews for class: ${intent.class}`);
        try {
            const style = toStyle(intent);
            const refsResponse = await fetch('/references');
            const refsData = await refsResponse.json();
            const references = Object.entries(refsData)
                .slice(0, 3)
                .map(([id, ref]: [string, any]) => ({ ...ref, id }));

            console.log(`[Decide] Fetching citation preview...`);
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
                console.log(`[Decide] Citation preview success`);
                decision.in_text_preview = data.result;
            } else {
                console.error(`[Decide] Citation preview failed: ${citRes.status}`);
            }

            if (bibRes.ok) {
                const data = await bibRes.json();
                console.log(`[Decide] Bibliography preview success`);
                decision.bibliography_preview = data.result;
            } else {
                console.error(`[Decide] Bibliography preview failed: ${bibRes.status}`);
            }
        } catch (e) {
            console.error('[Decide] Failed to generate previews in decide', e);
        }
    }

    return json(decision);
}
