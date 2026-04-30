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
export function renderCitation(
	style_yaml: string,
	refs_json: string,
	citation_json: string,
	mode?: string | null
): string;

/**
 * Render a citation to HTML directly from a style intent.
 */
export function render_intent_citation(
	intent_json: string,
	refs_json: string,
	citation_json: string,
	mode?: string | null
): string;

/**
 * Validate a Citum style string.
 *
 * # Errors
 *
 * Returns a string error describing the parse or schema validation failure.
 */
export function validateStyle(style_yaml: string): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
	readonly memory: WebAssembly.Memory;
	readonly decide: (a: number, b: number) => [number, number, number, number];
	readonly generate_style: (a: number, b: number) => [number, number, number, number];
	readonly render_intent_citation: (
		a: number,
		b: number,
		c: number,
		d: number,
		e: number,
		f: number,
		g: number,
		h: number
	) => [number, number, number, number];
	readonly getStyleMetadata: (a: number, b: number) => [number, number, number, number];
	readonly materializeStyle: (a: number, b: number) => [number, number, number, number];
	readonly renderBibliography: (
		a: number,
		b: number,
		c: number,
		d: number
	) => [number, number, number, number];
	readonly renderCitation: (
		a: number,
		b: number,
		c: number,
		d: number,
		e: number,
		f: number,
		g: number,
		h: number
	) => [number, number, number, number];
	readonly validateStyle: (a: number, b: number) => [number, number];
	readonly __wbindgen_externrefs: WebAssembly.Table;
	readonly __wbindgen_malloc: (a: number, b: number) => number;
	readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
	readonly __externref_table_dealloc: (a: number) => void;
	readonly __wbindgen_free: (a: number, b: number, c: number) => void;
	readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init(
	module_or_path?:
		| { module_or_path: InitInput | Promise<InitInput> }
		| InitInput
		| Promise<InitInput>
): Promise<InitOutput>;
