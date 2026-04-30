/* @ts-self-types="./wasm_bridge.d.ts" */

/**
 * Process a style intent and return the next decision or completed state.
 * @param {string} intent_json
 * @returns {string}
 */
export function decide(intent_json) {
	let deferred3_0;
	let deferred3_1;
	try {
		const ptr0 = passStringToWasm0(intent_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN;
		const ret = wasm.decide(ptr0, len0);
		var ptr2 = ret[0];
		var len2 = ret[1];
		if (ret[3]) {
			ptr2 = 0;
			len2 = 0;
			throw takeFromExternrefTable0(ret[2]);
		}
		deferred3_0 = ptr2;
		deferred3_1 = len2;
		return getStringFromWasm0(ptr2, len2);
	} finally {
		wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
	}
}

/**
 * Convert a style intent into a complete YAML style string.
 * @param {string} intent_json
 * @returns {string}
 */
export function generate_style(intent_json) {
	let deferred3_0;
	let deferred3_1;
	try {
		const ptr0 = passStringToWasm0(intent_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN;
		const ret = wasm.generate_style(ptr0, len0);
		var ptr2 = ret[0];
		var len2 = ret[1];
		if (ret[3]) {
			ptr2 = 0;
			len2 = 0;
			throw takeFromExternrefTable0(ret[2]);
		}
		deferred3_0 = ptr2;
		deferred3_1 = len2;
		return getStringFromWasm0(ptr2, len2);
	} finally {
		wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
	}
}

/**
 * Extract the `info` block from a YAML style string as JSON.
 *
 * # Errors
 *
 * Returns a string error if the YAML fails to parse or the info block cannot
 * be serialized to JSON.
 * @param {string} style_yaml
 * @returns {string}
 */
export function getStyleMetadata(style_yaml) {
	let deferred3_0;
	let deferred3_1;
	try {
		const ptr0 = passStringToWasm0(style_yaml, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN;
		const ret = wasm.getStyleMetadata(ptr0, len0);
		var ptr2 = ret[0];
		var len2 = ret[1];
		if (ret[3]) {
			ptr2 = 0;
			len2 = 0;
			throw takeFromExternrefTable0(ret[2]);
		}
		deferred3_0 = ptr2;
		deferred3_1 = len2;
		return getStringFromWasm0(ptr2, len2);
	} finally {
		wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
	}
}

/**
 * Materialize all template presets in a style and return the updated YAML.
 *
 * # Errors
 *
 * Returns a string error if the input YAML fails to parse or the materialized
 * style cannot be serialized back to YAML.
 * @param {string} style_yaml
 * @returns {string}
 */
export function materializeStyle(style_yaml) {
	let deferred3_0;
	let deferred3_1;
	try {
		const ptr0 = passStringToWasm0(style_yaml, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN;
		const ret = wasm.materializeStyle(ptr0, len0);
		var ptr2 = ret[0];
		var len2 = ret[1];
		if (ret[3]) {
			ptr2 = 0;
			len2 = 0;
			throw takeFromExternrefTable0(ret[2]);
		}
		deferred3_0 = ptr2;
		deferred3_1 = len2;
		return getStringFromWasm0(ptr2, len2);
	} finally {
		wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
	}
}

/**
 * Render a full bibliography to HTML.
 *
 * - `style_yaml` — Citum style as YAML
 * - `refs_json` — bibliography as JSON object or CSL-JSON array
 *
 * # Errors
 *
 * Returns a string error on style or reference parse failure.
 * @param {string} style_yaml
 * @param {string} refs_json
 * @returns {string}
 */
export function renderBibliography(style_yaml, refs_json) {
	let deferred4_0;
	let deferred4_1;
	try {
		const ptr0 = passStringToWasm0(style_yaml, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN;
		const ptr1 = passStringToWasm0(refs_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len1 = WASM_VECTOR_LEN;
		const ret = wasm.renderBibliography(ptr0, len0, ptr1, len1);
		var ptr3 = ret[0];
		var len3 = ret[1];
		if (ret[3]) {
			ptr3 = 0;
			len3 = 0;
			throw takeFromExternrefTable0(ret[2]);
		}
		deferred4_0 = ptr3;
		deferred4_1 = len3;
		return getStringFromWasm0(ptr3, len3);
	} finally {
		wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
	}
}

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
 * @param {string} style_yaml
 * @param {string} refs_json
 * @param {string} citation_json
 * @param {string | null} [mode]
 * @returns {string}
 */
export function renderCitation(style_yaml, refs_json, citation_json, mode) {
	let deferred6_0;
	let deferred6_1;
	try {
		const ptr0 = passStringToWasm0(style_yaml, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN;
		const ptr1 = passStringToWasm0(refs_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len1 = WASM_VECTOR_LEN;
		const ptr2 = passStringToWasm0(citation_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len2 = WASM_VECTOR_LEN;
		var ptr3 = isLikeNone(mode)
			? 0
			: passStringToWasm0(mode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		var len3 = WASM_VECTOR_LEN;
		const ret = wasm.renderCitation(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
		var ptr5 = ret[0];
		var len5 = ret[1];
		if (ret[3]) {
			ptr5 = 0;
			len5 = 0;
			throw takeFromExternrefTable0(ret[2]);
		}
		deferred6_0 = ptr5;
		deferred6_1 = len5;
		return getStringFromWasm0(ptr5, len5);
	} finally {
		wasm.__wbindgen_free(deferred6_0, deferred6_1, 1);
	}
}

/**
 * Render a citation to HTML directly from a style intent.
 * @param {string} intent_json
 * @param {string} refs_json
 * @param {string} citation_json
 * @param {string | null} [mode]
 * @returns {string}
 */
export function render_intent_citation(intent_json, refs_json, citation_json, mode) {
	let deferred6_0;
	let deferred6_1;
	try {
		const ptr0 = passStringToWasm0(intent_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN;
		const ptr1 = passStringToWasm0(refs_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len1 = WASM_VECTOR_LEN;
		const ptr2 = passStringToWasm0(citation_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len2 = WASM_VECTOR_LEN;
		var ptr3 = isLikeNone(mode)
			? 0
			: passStringToWasm0(mode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		var len3 = WASM_VECTOR_LEN;
		const ret = wasm.render_intent_citation(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
		var ptr5 = ret[0];
		var len5 = ret[1];
		if (ret[3]) {
			ptr5 = 0;
			len5 = 0;
			throw takeFromExternrefTable0(ret[2]);
		}
		deferred6_0 = ptr5;
		deferred6_1 = len5;
		return getStringFromWasm0(ptr5, len5);
	} finally {
		wasm.__wbindgen_free(deferred6_0, deferred6_1, 1);
	}
}

/**
 * Validate a Citum style string.
 *
 * # Errors
 *
 * Returns a string error describing the parse or schema validation failure.
 * @param {string} style_yaml
 */
export function validateStyle(style_yaml) {
	const ptr0 = passStringToWasm0(style_yaml, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
	const len0 = WASM_VECTOR_LEN;
	const ret = wasm.validateStyle(ptr0, len0);
	if (ret[1]) {
		throw takeFromExternrefTable0(ret[0]);
	}
}

function __wbg_get_imports() {
	const import0 = {
		__proto__: null,
		__wbindgen_cast_0000000000000001: function (arg0, arg1) {
			// Cast intrinsic for `Ref(String) -> Externref`.
			const ret = getStringFromWasm0(arg0, arg1);
			return ret;
		},
		__wbindgen_init_externref_table: function () {
			const table = wasm.__wbindgen_externrefs;
			const offset = table.grow(4);
			table.set(0, undefined);
			table.set(offset + 0, undefined);
			table.set(offset + 1, null);
			table.set(offset + 2, true);
			table.set(offset + 3, false);
		},
	};
	return {
		__proto__: null,
		"./wasm_bridge_bg.js": import0,
	};
}

function getStringFromWasm0(ptr, len) {
	ptr = ptr >>> 0;
	return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
	if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
		cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
	}
	return cachedUint8ArrayMemory0;
}

function isLikeNone(x) {
	return x === undefined || x === null;
}

function passStringToWasm0(arg, malloc, realloc) {
	if (realloc === undefined) {
		const buf = cachedTextEncoder.encode(arg);
		const ptr = malloc(buf.length, 1) >>> 0;
		getUint8ArrayMemory0()
			.subarray(ptr, ptr + buf.length)
			.set(buf);
		WASM_VECTOR_LEN = buf.length;
		return ptr;
	}

	let len = arg.length;
	let ptr = malloc(len, 1) >>> 0;

	const mem = getUint8ArrayMemory0();

	let offset = 0;

	for (; offset < len; offset++) {
		const code = arg.charCodeAt(offset);
		if (code > 0x7f) break;
		mem[ptr + offset] = code;
	}
	if (offset !== len) {
		if (offset !== 0) {
			arg = arg.slice(offset);
		}
		ptr = realloc(ptr, len, (len = offset + arg.length * 3), 1) >>> 0;
		const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
		const ret = cachedTextEncoder.encodeInto(arg, view);

		offset += ret.written;
		ptr = realloc(ptr, len, offset, 1) >>> 0;
	}

	WASM_VECTOR_LEN = offset;
	return ptr;
}

function takeFromExternrefTable0(idx) {
	const value = wasm.__wbindgen_externrefs.get(idx);
	wasm.__externref_table_dealloc(idx);
	return value;
}

let cachedTextDecoder = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
	numBytesDecoded += len;
	if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
		cachedTextDecoder = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
		cachedTextDecoder.decode();
		numBytesDecoded = len;
	}
	return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!("encodeInto" in cachedTextEncoder)) {
	cachedTextEncoder.encodeInto = function (arg, view) {
		const buf = cachedTextEncoder.encode(arg);
		view.set(buf);
		return {
			read: arg.length,
			written: buf.length,
		};
	};
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasm;
function __wbg_finalize_init(instance, module) {
	wasm = instance.exports;
	wasmModule = module;
	cachedUint8ArrayMemory0 = null;
	wasm.__wbindgen_start();
	return wasm;
}

async function __wbg_load(module, imports) {
	if (typeof Response === "function" && module instanceof Response) {
		if (typeof WebAssembly.instantiateStreaming === "function") {
			try {
				return await WebAssembly.instantiateStreaming(module, imports);
			} catch (e) {
				const validResponse = module.ok && expectedResponseType(module.type);

				if (validResponse && module.headers.get("Content-Type") !== "application/wasm") {
					console.warn(
						"`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n",
						e
					);
				} else {
					throw e;
				}
			}
		}

		const bytes = await module.arrayBuffer();
		return await WebAssembly.instantiate(bytes, imports);
	} else {
		const instance = await WebAssembly.instantiate(module, imports);

		if (instance instanceof WebAssembly.Instance) {
			return { instance, module };
		} else {
			return instance;
		}
	}

	function expectedResponseType(type) {
		switch (type) {
			case "basic":
			case "cors":
			case "default":
				return true;
		}
		return false;
	}
}

function initSync(module) {
	if (wasm !== undefined) return wasm;

	if (module !== undefined) {
		if (Object.getPrototypeOf(module) === Object.prototype) {
			({ module } = module);
		} else {
			console.warn("using deprecated parameters for `initSync()`; pass a single object instead");
		}
	}

	const imports = __wbg_get_imports();
	if (!(module instanceof WebAssembly.Module)) {
		module = new WebAssembly.Module(module);
	}
	const instance = new WebAssembly.Instance(module, imports);
	return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
	if (wasm !== undefined) return wasm;

	if (module_or_path !== undefined) {
		if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
			({ module_or_path } = module_or_path);
		} else {
			console.warn(
				"using deprecated parameters for the initialization function; pass a single object instead"
			);
		}
	}

	if (module_or_path === undefined) {
		module_or_path = new URL("wasm_bridge_bg.wasm", import.meta.url);
	}
	const imports = __wbg_get_imports();

	if (
		typeof module_or_path === "string" ||
		(typeof Request === "function" && module_or_path instanceof Request) ||
		(typeof URL === "function" && module_or_path instanceof URL)
	) {
		module_or_path = fetch(module_or_path);
	}

	const { instance, module } = await __wbg_load(await module_or_path, imports);

	return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
