import { json } from '@sveltejs/kit';
import { decide } from '$lib/server/intent';
import type { StyleIntent } from '$lib/types/bindings';

export async function POST({ request }) {
    const intent: StyleIntent = await request.json();
    const decision = decide(intent);
    return json(decision);
}
