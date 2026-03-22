/* tslint:disable */
/* eslint-disable */

/**
 * Processes a user's style intent JSON and returns a JSON string representing
 * the next required decision or the completed style state.
 */
export function decide(intent_json: string): string;

/**
 * Converts a style intent JSON into a complete YAML style definition string.
 */
export function generate_style(intent_json: string): string;

/**
 * Extracts the `info` block from a YAML style string and returns it as a JSON string.
 */
export function get_style_metadata(style_yaml: string): string;

/**
 * Ensures a given YAML style definition has all required templates materialized
 * (expanding presets if needed) and returns the updated YAML string.
 */
export function materialize_style(style_yaml: string): string;

/**
 * Renders a full bibliography to HTML based on the provided style and references.
 */
export function render_bibliography(style_yaml: string, refs_json: string): string;

/**
 * Renders a single citation to HTML.
 *
 * * `style_yaml` - The citation style definition in YAML format.
 * * `refs_json` - A JSON map of reference data.
 * * `citation_json` - A JSON string representing the `Citation` object to render.
 * * `mode` - Optional mode override (e.g. "Integral").
 */
export function render_citation(style_yaml: string, refs_json: string, citation_json: string, mode?: string | null): string;

/**
 * Renders a single citation to HTML directly from a style intent, bypassing
 * the intermediate step of generating a YAML style.
 */
export function render_intent_citation(intent_json: string, refs_json: string, citation_json: string, mode?: string | null): string;
