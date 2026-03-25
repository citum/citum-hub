/* tslint:disable */
/* eslint-disable */

/**
 * Process a style intent and return the next decision or completed state.
 */
export function decide(intent_json: string): string;

/**
 * Convert a style intent into a complete YAML style string.
 */
export function generate_style(intent_json: string): string;

/**
 * Extract the `info` block from a YAML style string as JSON.
 *
 * # Errors
 *
 * Returns a string error if the YAML fails to parse or the info block cannot
 * be serialized to JSON.
 */
export function getStyleMetadata(style_yaml: string): string;

/**
 * Materialize all template presets in a style and return the updated YAML.
 *
 * # Errors
 *
 * Returns a string error if the input YAML fails to parse or the materialized
 * style cannot be serialized back to YAML.
 */
export function materializeStyle(style_yaml: string): string;

/**
 * Render a full bibliography to HTML.
 *
 * - `style_yaml` — Citum style as YAML
 * - `refs_json` — bibliography as JSON object or CSL-JSON array
 *
 * # Errors
 *
 * Returns a string error on style or reference parse failure.
 */
export function renderBibliography(style_yaml: string, refs_json: string): string;

/**
 * Render a single citation to HTML.
 *
 * - `style_yaml` — Citum style as YAML
 * - `refs_json` — bibliography as JSON object (`{id: Reference}`) or CSL-JSON array
 * - `citation_json` — a single [`Citation`] as JSON
 * - `mode` — optional mode override (e.g. `"Integral"`)
 *
 * # Errors
 *
 * Returns a string error on style/reference/citation parse failure, invalid
 * mode string, or engine rendering error.
 */
export function renderCitation(style_yaml: string, refs_json: string, citation_json: string, mode?: string | null): string;

/**
 * Render a citation to HTML directly from a style intent.
 */
export function render_intent_citation(intent_json: string, refs_json: string, citation_json: string, mode?: string | null): string;

/**
 * Validate a Citum style string.
 *
 * # Errors
 *
 * Returns a string error describing the parse or schema validation failure.
 */
export function validateStyle(style_yaml: string): void;
