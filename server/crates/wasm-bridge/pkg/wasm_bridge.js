/* @ts-self-types="./wasm_bridge.d.ts" */

import * as wasm from "./wasm_bridge_bg.wasm";
import { __wbg_set_wasm } from "./wasm_bridge_bg.js";
__wbg_set_wasm(wasm);

export {
    decide, generate_style, render_bibliography, render_citation, render_intent_citation
} from "./wasm_bridge_bg.js";
