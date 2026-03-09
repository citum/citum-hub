use wasm_bindgen::prelude::*;
use citum_schema::{Style, citation::Citation, CitationSpec, TemplatePreset};
use citum_engine::{processor::Processor, Reference, render::html::Html as HtmlRenderer};
use intent_engine::StyleIntent;
use indexmap::IndexMap;
use serde_json::Value;

fn ensure_style_has_templates(style: &mut Style) {
    if style.citation.is_none() {
        style.citation = Some(CitationSpec {
            use_preset: Some(TemplatePreset::Apa),
            ..Default::default()
        });
    }
    // Also ensure bibliography if it's supposed to have one
    if style.bibliography.is_none() {
         style.bibliography = Some(citum_schema::BibliographySpec {
            use_preset: Some(TemplatePreset::Apa),
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
        if let Ok(new_ref) = serde_json::from_value::<citum_schema::reference::InputReference>(val.clone()) {
            mapped_refs.insert(key, new_ref.into());
            continue;
        }

        // Fallback: try parsing as legacy CSL-JSON
        if let Ok(legacy_ref) = serde_json::from_value::<csl_legacy::csl_json::Reference>(val) {
            let new_ref: citum_schema::reference::InputReference = legacy_ref.into();
            mapped_refs.insert(key, new_ref.into());
            continue;
        }

        return Err(format!("Failed to parse reference '{}' as either InputReference or legacy CSL-JSON", key));
    }
    Ok(mapped_refs)
}

#[wasm_bindgen]
pub fn render_citation(style_yaml: &str, refs_json: &str, citation_json: &str, mode: Option<String>) -> Result<String, JsValue> {
    let mut style: Style = serde_yaml_ng::from_str(style_yaml)
        .map_err(|e| JsValue::from_str(&format!("Style parse error: {}", e)))?;

    ensure_style_has_templates(&mut style);

    let references = parse_references(refs_json)
        .map_err(|e| JsValue::from_str(&format!("References parse error: {}", e)))?;

    let mut citation: Citation = serde_json::from_str(citation_json)
        .map_err(|e| JsValue::from_str(&format!("Citation parse error: {}", e)))?;

    if let Some(m) = mode {
        if let Ok(m_enum) = serde_json::from_str::<citum_schema::citation::CitationMode>(&format!("\"{}\"", m)) {
            citation.mode = m_enum;
        }
    }

    let processor = Processor::new(style, references);
    
    processor.process_citation_with_format::<HtmlRenderer>(&citation)
        .map_err(|e| JsValue::from_str(&format!("Rendering error: {}", e)))
}

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

#[wasm_bindgen]
pub fn decide(intent_json: &str) -> Result<String, JsValue> {
    let intent: StyleIntent = serde_json::from_str(intent_json)
        .map_err(|e| JsValue::from_str(&format!("Intent parse error: {}", e)))?;
    
    let decision = intent.decide();
    
    serde_json::to_string(&decision)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

#[wasm_bindgen]
pub fn generate_style(intent_json: &str) -> Result<String, JsValue> {
    let intent: StyleIntent = serde_json::from_str(intent_json)
        .map_err(|e| JsValue::from_str(&format!("Intent parse error: {}", e)))?;
    
    let style = intent.to_style();
    
    serde_yaml_ng::to_string(&style)
        .map_err(|e| JsValue::from_str(&format!("YAML Serialization error: {}", e)))
}

#[wasm_bindgen]
pub fn render_intent_citation(intent_json: &str, refs_json: &str, citation_json: &str, mode: Option<String>) -> Result<String, JsValue> {
    let intent: StyleIntent = serde_json::from_str(intent_json)
        .map_err(|e| JsValue::from_str(&format!("Intent parse error: {}", e)))?;
    
    let mut style = intent.to_style();
    ensure_style_has_templates(&mut style);
    
    let references = parse_references(refs_json)
        .map_err(|e| JsValue::from_str(&format!("References parse error: {}", e)))?;

    let mut citation: Citation = serde_json::from_str(citation_json)
        .map_err(|e| JsValue::from_str(&format!("Citation parse error: {}", e)))?;

    if let Some(m) = mode {
        if let Ok(m_enum) = serde_json::from_str::<citum_schema::citation::CitationMode>(&format!("\"{}\"", m)) {
            citation.mode = m_enum;
        }
    }

    let processor = Processor::new(style, references);
    
    processor.process_citation_with_format::<HtmlRenderer>(&citation)
        .map_err(|e| JsValue::from_str(&format!("Rendering error: {}", e)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use citum_schema::citation::CitationMode;

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
        let paren_res = render_citation(&yaml, refs_json, &paren_cite_json).unwrap();
        println!("Parenthetical: {}", paren_res);

        println!("Rendering Narrative...");
        let narrative_res = render_citation(&yaml, refs_json, &narrative_cite_json).unwrap();
        println!("Narrative: {}", narrative_res);

        assert_ne!(paren_res, narrative_res, "Parenthetical and Narrative renderings should be different!");
    }
}
