import { json } from '@sveltejs/kit';
import { decide, toStyle } from '$lib/intent';
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
            
            // For citation preview, let's just use the first reference to show a clean example
            const firstRef = [Object.entries(refsData)[0]].map(([id, ref]: [string, any]) => ({ ...ref, id }));
            // For bibliography, use a few more
            const multiRefs = Object.entries(refsData)
                .slice(0, 3)
                .map(([id, ref]: [string, any]) => ({ ...ref, id }));

            const [citRes, bibRes] = await Promise.all([
                fetch('/preview/citation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ style, references: firstRef })
                }),
                fetch('/preview/bibliography', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ style, references: multiRefs })
                })
            ]);

            if (citRes.ok) {
                const data = await citRes.json();
                
                // If it's a footnote style, Citum-Server returns the note content.
                // We should put it in note_preview for the UI to display it in the "Footnote Body" area.
                if (intent.class === 'footnote' || intent.class === 'endnote') {
                    decision.note_preview = data.result;
                    decision.in_text_preview = '<sup class="text-primary font-bold">1</sup>'; // Placeholder marker
                } else {
                    decision.in_text_preview = data.result;
                }
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
