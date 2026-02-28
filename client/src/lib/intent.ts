/* 
 * This file previously contained the wizard logic in TypeScript.
 * That logic has been moved to the Rust intent-engine for consistency
 * and to support fragment previews that require the full Citum engine.
 * 
 * The frontend now primarily uses the /api/v1/decide endpoint.
 */

import type { StyleIntent } from './types/bindings';

export function isEmptyIntent(intent: StyleIntent): boolean {
    return !intent.field && !intent.class && !intent.contributor_preset;
}
