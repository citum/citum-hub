#![warn(missing_docs)]

//! WASM bridge: thin layer over `citum-bindings` plus intent-engine functions.
//!
//! Intent-agnostic functions (`render_citation`, `render_bibliography`,
//! `get_style_metadata`, `materialize_style`, `validate_style`) are provided
//! by `citum-bindings`. Only the three functions that depend on `intent-engine`
//! are implemented here.

use citum_bindings::ensure_style_has_templates;
use citum_engine::{processor::Processor, render::html::Html as HtmlRenderer, Citation, Reference};
use citum_schema::citation::CitationMode;
use indexmap::IndexMap;
use intent_engine::StyleIntent;
use serde_json::Value;
use wasm_bindgen::prelude::*;

/// Parse a map of references, automatically upgrading legacy CSL-JSON.
fn parse_references(refs_json: &str) -> Result<IndexMap<String, Reference>, String> {
    let raw: IndexMap<String, Value> =
        serde_json::from_str(refs_json).map_err(|e| format!("Invalid JSON for references: {e}"))?;

    let mut mapped = IndexMap::new();
    for (key, val) in raw {
        if let Ok(r) =
            serde_json::from_value::<citum_schema::reference::InputReference>(val.clone())
        {
            mapped.insert(key, r);
            continue;
        }
        if let Ok(legacy) = serde_json::from_value::<csl_legacy::csl_json::Reference>(val) {
            let r: citum_schema::reference::InputReference = legacy.into();
            mapped.insert(key, r);
            continue;
        }
        return Err(format!(
            "Failed to parse reference '{key}' as InputReference or CSL-JSON"
        ));
    }
    Ok(mapped)
}

/// Process a style intent and return the next decision or completed state.
#[wasm_bindgen]
pub fn decide(intent_json: &str) -> Result<String, JsValue> {
    let intent: StyleIntent = serde_json::from_str(intent_json)
        .map_err(|e| JsValue::from_str(&format!("Intent parse error: {e}")))?;
    let decision = intent.decide();
    serde_json::to_string(&decision)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {e}")))
}

/// Convert a style intent into a complete YAML style string.
#[wasm_bindgen]
pub fn generate_style(intent_json: &str) -> Result<String, JsValue> {
    let intent: StyleIntent = serde_json::from_str(intent_json)
        .map_err(|e| JsValue::from_str(&format!("Intent parse error: {e}")))?;
    let mut style = intent.to_style();
    ensure_style_has_templates(&mut style);
    serde_yaml_ng::to_string(&style)
        .map_err(|e| JsValue::from_str(&format!("YAML serialization error: {e}")))
}

/// Render a citation to HTML directly from a style intent.
#[wasm_bindgen]
pub fn render_intent_citation(
    intent_json: &str,
    refs_json: &str,
    citation_json: &str,
    mode: Option<String>,
) -> Result<String, JsValue> {
    let intent: StyleIntent = serde_json::from_str(intent_json)
        .map_err(|e| JsValue::from_str(&format!("Intent parse error: {e}")))?;
    let mut style = intent.to_style();
    ensure_style_has_templates(&mut style);

    let refs = parse_references(refs_json)
        .map_err(|e| JsValue::from_str(&format!("References parse error: {e}")))?;

    let mut citation: Citation = serde_json::from_str(citation_json)
        .map_err(|e| JsValue::from_str(&format!("Citation parse error: {e}")))?;

    if let Some(m) = mode {
        if let Ok(m_enum) = serde_json::from_str::<CitationMode>(&format!("\"{m}\"")) {
            citation.mode = m_enum;
        }
    }

    let processor = Processor::new(style, refs);
    processor
        .process_citation_with_format::<HtmlRenderer>(&citation)
        .map_err(|e| JsValue::from_str(&format!("Rendering error: {e}")))
}

#[cfg(test)]
mod tests {
    // Intent-engine tests only.
    // render_citation/render_bibliography tests live in citum-bindings.
}
