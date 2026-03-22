#![warn(missing_docs)]

//! The `wasm-bridge` crate exposes core `citum_engine` and `intent-engine` functionality
//! to WebAssembly, allowing the frontend to render citations and bibliographies, 
//! and process style intents entirely client-side.

use citum_engine::{processor::Processor, render::html::Html as HtmlRenderer, Citation, Reference};
use citum_schema::{CitationSpec, Style, TemplatePreset};
use indexmap::IndexMap;
use intent_engine::StyleIntent;
use serde_json::Value;
use wasm_bindgen::prelude::*;

fn ensure_style_has_templates(style: &mut Style) {
    if style.citation.is_none() {
        style.citation = Some(CitationSpec {
            use_preset: Some(TemplatePreset::Apa),
            ..Default::default()
        });
    }

    // Force locator into the citation template if missing, to ensure it renders in preview
    if let Some(ref mut citation) = style.citation {
        use citum_schema::template::{
            Rendering, SimpleVariable, TemplateComponent, TemplateVariable,
        };

        let mut template = citation.resolve_template().unwrap_or_default();
        let has_locator = template.iter().any(|c| matches!(c, TemplateComponent::Variable(v) if v.variable == SimpleVariable::Locator));

        if !has_locator {
            template.push(TemplateComponent::Variable(TemplateVariable {
                variable: SimpleVariable::Locator,
                rendering: Rendering {
                    prefix: Some(", ".to_string()),
                    ..Default::default()
                },
                ..Default::default()
            }));

            citation.template = Some(template);
            citation.use_preset = None; // Explicit template overrides preset
        }
    }

    // Materialize bibliography template if using a preset
    if let Some(ref mut bib) = style.bibliography {
        let template = bib.resolve_template().unwrap_or_default();
        if !template.is_empty() && bib.template.as_ref().is_none_or(|t| t.is_empty()) {
            bib.template = Some(template);
            bib.use_preset = None;
        }
    } else {
        style.bibliography = Some(citum_schema::BibliographySpec {
            template: Some(citum_schema::TemplatePreset::Apa.bibliography_template()),
            ..Default::default()
        });
    }
}

/// Parses a map of references, automatically upgrading legacy CSL-JSON to the new schema.
fn parse_references(refs_json: &str) -> Result<IndexMap<String, Reference>, String> {
    let raw_refs: IndexMap<String, Value> = serde_json::from_str(refs_json)
        .map_err(|e| format!("Invalid JSON for references: {}", e))?;

    let mut mapped_refs = IndexMap::new();
    for (key, val) in raw_refs {
        // Try parsing as the new InputReference first
        if let Ok(new_ref) =
            serde_json::from_value::<citum_schema::reference::InputReference>(val.clone())
        {
            mapped_refs.insert(key, new_ref);
            continue;
        }

        // Fallback: try parsing as legacy CSL-JSON
        if let Ok(legacy_ref) = serde_json::from_value::<csl_legacy::csl_json::Reference>(val) {
            let new_ref: citum_schema::reference::InputReference = legacy_ref.into();
            mapped_refs.insert(key, new_ref);
            continue;
        }

        return Err(format!(
            "Failed to parse reference '{}' as either InputReference or legacy CSL-JSON",
            key
        ));
    }
    Ok(mapped_refs)
}

/// Extracts the `info` block from a YAML style string and returns it as a JSON string.
#[wasm_bindgen]
pub fn get_style_metadata(style_yaml: &str) -> Result<String, JsValue> {
    let style: Style = serde_yaml_ng::from_str(style_yaml)
        .map_err(|e| JsValue::from_str(&format!("Style parse error: {}", e)))?;

    serde_json::to_string(&style.info)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

/// Renders a single citation to HTML.
/// 
/// * `style_yaml` - The citation style definition in YAML format.
/// * `refs_json` - A JSON map of reference data.
/// * `citation_json` - A JSON string representing the `Citation` object to render.
/// * `mode` - Optional mode override (e.g. "Integral").
#[wasm_bindgen]
pub fn render_citation(
    style_yaml: &str,
    refs_json: &str,
    citation_json: &str,
    mode: Option<String>,
) -> Result<String, JsValue> {
    let mut style: Style = serde_yaml_ng::from_str(style_yaml)
        .map_err(|e| JsValue::from_str(&format!("Style parse error: {}", e)))?;

    ensure_style_has_templates(&mut style);

    let references = parse_references(refs_json)
        .map_err(|e| JsValue::from_str(&format!("References parse error: {}", e)))?;

    let mut citation: Citation = serde_json::from_str(citation_json)
        .map_err(|e| JsValue::from_str(&format!("Citation parse error: {}", e)))?;

    if let Some(m) = mode {
        if let Ok(m_enum) =
            serde_json::from_str::<citum_schema::citation::CitationMode>(&format!("\"{}\"", m))
        {
            citation.mode = m_enum;
        }
    }

    let processor = Processor::new(style, references);

    processor
        .process_citation_with_format::<HtmlRenderer>(&citation)
        .map_err(|e| JsValue::from_str(&format!("Rendering error: {}", e)))
}

/// Renders a full bibliography to HTML based on the provided style and references.
#[wasm_bindgen]
pub fn render_bibliography(style_yaml: &str, refs_json: &str) -> Result<String, JsValue> {
    let mut style: Style = serde_yaml_ng::from_str(style_yaml)
        .map_err(|e| JsValue::from_str(&format!("Style parse error: {}", e)))?;

    ensure_style_has_templates(&mut style);

    let references = parse_references(refs_json)
        .map_err(|e| JsValue::from_str(&format!("References parse error: {}", e)))?;

    let processor = Processor::new(style, references);

    Ok(processor.render_bibliography_with_format::<HtmlRenderer>())
}

/// Processes a user's style intent JSON and returns a JSON string representing 
/// the next required decision or the completed style state.
#[wasm_bindgen]
pub fn decide(intent_json: &str) -> Result<String, JsValue> {
    let intent: StyleIntent = serde_json::from_str(intent_json)
        .map_err(|e| JsValue::from_str(&format!("Intent parse error: {}", e)))?;

    let decision = intent.decide();

    serde_json::to_string(&decision)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

/// Converts a style intent JSON into a complete YAML style definition string.
#[wasm_bindgen]
pub fn generate_style(intent_json: &str) -> Result<String, JsValue> {
    let intent: StyleIntent = serde_json::from_str(intent_json)
        .map_err(|e| JsValue::from_str(&format!("Intent parse error: {}", e)))?;

    let mut style = intent.to_style();
    ensure_style_has_templates(&mut style);

    serde_yaml_ng::to_string(&style)
        .map_err(|e| JsValue::from_str(&format!("YAML Serialization error: {}", e)))
}

/// Ensures a given YAML style definition has all required templates materialized 
/// (expanding presets if needed) and returns the updated YAML string.
#[wasm_bindgen]
pub fn materialize_style(style_yaml: &str) -> Result<String, JsValue> {
    let mut style: Style = serde_yaml_ng::from_str(style_yaml)
        .map_err(|e| JsValue::from_str(&format!("Style parse error: {}", e)))?;

    ensure_style_has_templates(&mut style);

    serde_yaml_ng::to_string(&style)
        .map_err(|e| JsValue::from_str(&format!("YAML Serialization error: {}", e)))
}

/// Renders a single citation to HTML directly from a style intent, bypassing 
/// the intermediate step of generating a YAML style.
#[wasm_bindgen]
pub fn render_intent_citation(
    intent_json: &str,
    refs_json: &str,
    citation_json: &str,
    mode: Option<String>,
) -> Result<String, JsValue> {
    let intent: StyleIntent = serde_json::from_str(intent_json)
        .map_err(|e| JsValue::from_str(&format!("Intent parse error: {}", e)))?;

    let mut style = intent.to_style();
    ensure_style_has_templates(&mut style);

    let references = parse_references(refs_json)
        .map_err(|e| JsValue::from_str(&format!("References parse error: {}", e)))?;

    let mut citation: Citation = serde_json::from_str(citation_json)
        .map_err(|e| JsValue::from_str(&format!("Citation parse error: {}", e)))?;

    if let Some(m) = mode {
        if let Ok(m_enum) =
            serde_json::from_str::<citum_schema::citation::CitationMode>(&format!("\"{}\"", m))
        {
            citation.mode = m_enum;
        }
    }

    let processor = Processor::new(style, references);

    processor
        .process_citation_with_format::<HtmlRenderer>(&citation)
        .map_err(|e| JsValue::from_str(&format!("Rendering error: {}", e)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use citum_schema::citation::CitationMode;
    use std::fs;

    #[test]
    fn test_apa_7th_citation_modes() {
        let path = "/Users/brucedarcus/Code/citum/citum-core/styles/apa-7th.yaml";
        let yaml = fs::read_to_string(path).expect("apa-7th.yaml should exist");

        let refs_json = r#"{
            "ref1": {
                "class": "monograph",
                "type": "book",
                "title": "Test Book",
                "author": { "family": "Smith", "given": "John" },
                "issued": "2020"
            }
        }"#;

        let cite_json = r#"{
            "items": [{ "id": "ref1" }]
        }"#;

        let mut paren_cite: Citation = serde_json::from_str(cite_json).unwrap();
        paren_cite.mode = CitationMode::NonIntegral;
        let paren_cite_json = serde_json::to_string(&paren_cite).unwrap();

        let mut narrative_cite: Citation = serde_json::from_str(cite_json).unwrap();
        narrative_cite.mode = CitationMode::Integral;
        let narrative_cite_json = serde_json::to_string(&narrative_cite).unwrap();

        println!("Rendering Parenthetical...");
        let paren_res = render_citation(&yaml, refs_json, &paren_cite_json, None).unwrap();
        println!("Parenthetical: {}", paren_res);

        println!("Rendering Narrative...");
        let narrative_res = render_citation(&yaml, refs_json, &narrative_cite_json, None).unwrap();
        println!("Narrative: {}", narrative_res);

        assert_ne!(
            paren_res, narrative_res,
            "Parenthetical and Narrative renderings should be different!"
        );
    }

    #[test]
    fn test_multi_item_integral_citation_uses_prose_joining() {
        let style_path = "/Users/brucedarcus/Code/citum/citum-core/styles/apa-7th.yaml";
        let refs_path =
            "/Users/brucedarcus/Code/citum/citum-core/tests/fixtures/references-expanded.json";
        let yaml = fs::read_to_string(style_path).expect("apa-7th.yaml should exist");

        let raw_refs: serde_json::Value =
            serde_json::from_str(&fs::read_to_string(refs_path).expect("fixture should exist"))
                .expect("fixture should parse");
        let entries: Vec<serde_json::Value> = match raw_refs {
            serde_json::Value::Array(entries) => entries,
            serde_json::Value::Object(entries) => entries
                .into_iter()
                .filter_map(|(key, value)| (key != "comment").then_some(value))
                .collect(),
            _ => panic!("expanded fixture should be an array or object"),
        };

        let mut refs = serde_json::Map::new();
        for entry in entries.iter().take(4) {
            let id = entry["id"]
                .as_str()
                .expect("fixture refs should include ids")
                .to_string();
            refs.insert(id, entry.clone());
        }

        let cite_json = serde_json::json!({
            "items": [
                {
                    "id": entries[1]["id"].as_str().expect("second item id"),
                    "locator": { "label": "page", "value": "123-125" }
                },
                {
                    "id": entries[2]["id"].as_str().expect("third item id")
                }
            ],
            "mode": "integral"
        })
        .to_string();

        let narrative_res = render_citation(
            &yaml,
            &serde_json::Value::Object(refs).to_string(),
            &cite_json,
            Some("Integral".to_string()),
        )
        .unwrap();

        assert!(
            narrative_res.contains(" and "),
            "multi-item integral preview should use prose joining: {narrative_res}"
        );
        assert!(
            !narrative_res.contains(";"),
            "multi-item integral preview should not use semicolon clustering: {narrative_res}"
        );
    }
}
