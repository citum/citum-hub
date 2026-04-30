/*
SPDX-License-Identifier: AGPL-3.0-or-later
SPDX-FileCopyrightText: © 2023-2026 Bruce D'Arcus
*/

#![warn(missing_docs)]

//! The `intent-engine` crate is responsible for capturing the user's intent when 
//! creating a new citation style and converting that intent into a full `Style` definition.
//!
//! It provides types to represent different dimensions of citation styles, such as 
//! formatting classes (author-date, numeric, note), contributor name formatting, 
//! date formats, and bibliography layouts.

use citum_schema::{
    Style, StyleInfo, TemplatePreset,
    options::{Config, Processing},
    presets::{ContributorPreset, DatePreset, TitlePreset, SortPreset},
};
use serde::{Deserialize, Serialize};

#[cfg(not(target_arch = "wasm32"))]
use specta::Type;

/// Defines the fundamental mechanism by which a citation is referenced in text.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[cfg_attr(not(target_arch = "wasm32"), derive(Type))]
#[serde(rename_all = "snake_case")]
pub enum CitationClass {
    /// In-text references formatted with the author's name and publication date (e.g., "(Smith, 2024)").
    AuthorDate,
    /// Citations placed in page footnotes.
    Footnote,
    /// Citations placed at the end of the document.
    Endnote,
    /// In-text references using numbers enclosed in brackets (e.g., "`[1]`").
    Numeric,
    /// In-text references using a shorthand label.
    Label,
}

/// Represents the specific dimension of a style the user wishes to refine.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[cfg_attr(not(target_arch = "wasm32"), derive(Type))]
#[serde(rename_all = "snake_case")]
pub enum CustomizeTarget {
    /// Return to the main customization menu.
    Menu,
    /// Customize how contributor names are formatted.
    Contributors,
    /// Customize how contributor roles (like editor) are formatted.
    Roles,
    /// Customize date formatting.
    Dates,
    /// Customize title capitalization and styling.
    Titles,
    /// Customize the layout and ordering of the bibliography.
    Bibliography,
    /// Customize whether a bibliography is included at all (mostly relevant for note styles).
    BibliographyUsage,
}

/// Represents the user's intent for the citation style they are building.
/// Redesigned to center around pervasive presets.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[cfg_attr(not(target_arch = "wasm32"), derive(Type))]
#[serde(rename_all = "snake_case")]
pub struct StyleIntent {
    /// The academic field (e.g., "humanities", "sciences").
    pub field: Option<String>,
    /// The general class of citation (author-date, footnote, numeric).
    pub class: Option<CitationClass>,
    /// If the user selected a preset that fills multiple fields at once.
    pub from_preset: Option<String>,
    /// Which style dimension the user wants to refine after selecting a preset.
    pub customize_target: Option<CustomizeTarget>,
    /// Contributor formatting preset (e.g. "apa", "vancouver").
    pub contributor_preset: Option<String>,
    /// Role formatting preset (e.g. "short-suffix", "verb-prefix").
    pub role_preset: Option<String>,
    /// Date formatting preset (e.g. "long", "numeric").
    pub date_preset: Option<String>,
    /// Title formatting preset (e.g. "apa", "chicago", "scientific").
    pub title_preset: Option<String>,
    /// Sort order for the bibliography.
    pub sort_preset: Option<String>,
    /// Component ordering/layout template for bibliography.
    pub bib_template: Option<String>,
    /// Whether the style requires a bibliography.
    pub has_bibliography: Option<bool>,
}

impl StyleIntent {
    fn inferred_class(&self) -> Option<CitationClass> {
        match self.field.as_deref() {
            Some("social_science") => Some(CitationClass::AuthorDate),
            _ => None,
        }
    }

    fn in_customize_flow(&self, target: CustomizeTarget) -> bool {
        self.customize_target.as_ref() == Some(&target)
    }

    fn with_optional_customize_return(
        &self,
        mut updates: serde_json::Value,
        return_to_menu: bool,
    ) -> serde_json::Value {
        if return_to_menu && let Some(obj) = updates.as_object_mut() {
            obj.insert("customize_target".to_string(), serde_json::json!("menu"));
        }
        updates
    }

    /// Analyzes the current intent and returns the next decision to be made.
    pub fn decide(&self) -> DecisionPackage {
        let effective_class = self.class.clone().or_else(|| self.inferred_class());
        let mut missing_fields = Vec::new();
        if self.field.is_none() { missing_fields.push("field".to_string()); }
        if effective_class.is_none() { missing_fields.push("class".to_string()); }
        if self.contributor_preset.is_none() { missing_fields.push("contributor_preset".to_string()); }
        if self.role_preset.is_none() { missing_fields.push("role_preset".to_string()); }
        if self.date_preset.is_none() { missing_fields.push("date_preset".to_string()); }
        if self.title_preset.is_none() { missing_fields.push("title_preset".to_string()); }

        // Bibliography is assumed for author-date, numeric, label.
        // Only note styles ask the question.
        let is_note_style = matches!(effective_class, Some(CitationClass::Footnote) | Some(CitationClass::Endnote));
        let include_bib = if is_note_style {
            self.has_bibliography == Some(true)
        } else {
            // Non-note styles always have a bibliography
            true
        };

        if self.has_bibliography.is_none() && is_note_style {
            missing_fields.push("has_bibliography".to_string());
        }
        if include_bib && self.bib_template.is_none() {
            missing_fields.push("bib_template".to_string());
        }

        let (question, previews) = if self.field.is_none() {
            // Step 1: What field?
            (
                Some(Question {
                    id: "field".to_string(),
                    text: "What is your academic field?".to_string(),
                    description: Some("We use this to narrow the citation traditions that are most common in your discipline.".to_string()),
                }),
                vec![
                    Preview { label: "Humanities".to_string(), html: String::new(), choice_value: serde_json::json!({ "field": "humanities" }) },
                    Preview { label: "Social Sciences".to_string(), html: String::new(), choice_value: serde_json::json!({ "field": "social_science", "class": "author_date", "has_bibliography": true }) },
                    Preview { label: "Sciences".to_string(), html: String::new(), choice_value: serde_json::json!({ "field": "sciences" }) },
                ]
            )
        } else if effective_class.is_none() {
            // Step 2: What class of citation?
            (
                Some(Question {
                    id: "class".to_string(),
                    text: "How should citations appear in the text?".to_string(),
                    description: Some(self.class_question_description().to_string()),
                }),
                self.class_previews(),
            )
        } else if self.in_customize_flow(CustomizeTarget::Menu) {
            self.customization_menu(include_bib, is_note_style)
        } else if self.from_preset.is_none() && self.contributor_preset.is_none() {
            // Step 3: Preset gallery — show complete style presets based on class
            self.preset_gallery()
        } else if (self.has_bibliography.is_none() && is_note_style)
            || self.in_customize_flow(CustomizeTarget::BibliographyUsage)
        {
            // Step 4 (note styles only): Include bibliography?
            (
                Some(Question {
                    id: "has_bibliography".to_string(),
                    text: "Include a bibliography?".to_string(),
                    description: Some("Some note styles include a full bibliography; others rely solely on notes.".to_string()),
                }),
                vec![
                    Preview {
                        label: "Yes, include full bibliography".to_string(),
                        html: String::new(),
                        choice_value: self.with_optional_customize_return(
                            serde_json::json!({ "has_bibliography": true }),
                            self.in_customize_flow(CustomizeTarget::BibliographyUsage),
                        ),
                    },
                    Preview {
                        label: "No, notes only".to_string(),
                        html: String::new(),
                        choice_value: self.with_optional_customize_return(
                            serde_json::json!({ "has_bibliography": false }),
                            self.in_customize_flow(CustomizeTarget::BibliographyUsage),
                        ),
                    },
                ]
            )
        } else if (self.bib_template.is_none() && include_bib && self.from_preset.is_none())
            || (self.in_customize_flow(CustomizeTarget::Bibliography) && include_bib)
        {
            // Step 5: Bibliography template (only if not set by preset)
            (
                Some(Question {
                    id: "bib_template".to_string(),
                    text: "What layout should the bibliography use?".to_string(),
                    description: Some("Controls the general arrangement of components (Author, Date, Title, etc.)".to_string()),
                }),
                vec![
                    Preview {
                        label: "APA — Author. (Date). Title.".to_string(),
                        html: String::new(),
                        choice_value: self.with_optional_customize_return(
                            serde_json::json!({ "bib_template": "apa" }),
                            self.in_customize_flow(CustomizeTarget::Bibliography),
                        ),
                    },
                    Preview {
                        label: "Chicago — Author. Title. Date.".to_string(),
                        html: String::new(),
                        choice_value: self.with_optional_customize_return(
                            serde_json::json!({ "bib_template": "chicago" }),
                            self.in_customize_flow(CustomizeTarget::Bibliography),
                        ),
                    },
                    Preview {
                        label: "Vancouver — Author. Title. Date.".to_string(),
                        html: String::new(),
                        choice_value: self.with_optional_customize_return(
                            serde_json::json!({ "bib_template": "vancouver" }),
                            self.in_customize_flow(CustomizeTarget::Bibliography),
                        ),
                    },
                    Preview {
                        label: "Harvard — Author. (Date). Title.".to_string(),
                        html: String::new(),
                        choice_value: self.with_optional_customize_return(
                            serde_json::json!({ "bib_template": "harvard" }),
                            self.in_customize_flow(CustomizeTarget::Bibliography),
                        ),
                    },
                ]
            )
        } else if (self.role_preset.is_none() && self.from_preset.is_none())
            || self.in_customize_flow(CustomizeTarget::Roles)
        {
            (
                Some(Question {
                    id: "role_preset".to_string(),
                    text: "How should contributor roles (like editor or translator) be formatted?".to_string(),
                    description: Some("Different styles format roles differently, such as 'ed.', 'editor', or 'edited by'.".to_string()),
                }),
                vec![
                    Preview {
                        label: "Short Suffix — Smith, J. (ed.)".to_string(),
                        html: String::new(),
                        choice_value: self.with_optional_customize_return(
                            serde_json::json!({ "role_preset": "short-suffix" }),
                            self.in_customize_flow(CustomizeTarget::Roles),
                        ),
                    },
                    Preview {
                        label: "Long Suffix — Smith, J. (editor)".to_string(),
                        html: String::new(),
                        choice_value: self.with_optional_customize_return(
                            serde_json::json!({ "role_preset": "long-suffix" }),
                            self.in_customize_flow(CustomizeTarget::Roles),
                        ),
                    },
                    Preview {
                        label: "Verb Prefix — edited by J. Smith".to_string(),
                        html: String::new(),
                        choice_value: self.with_optional_customize_return(
                            serde_json::json!({ "role_preset": "verb-prefix" }),
                            self.in_customize_flow(CustomizeTarget::Roles),
                        ),
                    },
                    Preview {
                        label: "None — Smith, J.".to_string(),
                        html: String::new(),
                        choice_value: self.with_optional_customize_return(
                            serde_json::json!({ "role_preset": "none" }),
                            self.in_customize_flow(CustomizeTarget::Roles),
                        ),
                    },
                ]
            )
        } else if (self.date_preset.is_none() && self.from_preset.is_none())
            || self.in_customize_flow(CustomizeTarget::Dates)
        {
            // Step 6: Date format (only if not set by preset)
            (
                Some(Question {
                    id: "date_preset".to_string(),
                    text: "Select a date format".to_string(),
                    description: None,
                }),
                vec![
                    Preview {
                        label: "Year only — 2024".to_string(),
                        html: String::new(),
                        choice_value: self.with_optional_customize_return(
                            serde_json::json!({ "date_preset": "year" }),
                            self.in_customize_flow(CustomizeTarget::Dates),
                        ),
                    },
                    Preview {
                        label: "Year-month — January 2024".to_string(),
                        html: String::new(),
                        choice_value: self.with_optional_customize_return(
                            serde_json::json!({ "date_preset": "long" }),
                            self.in_customize_flow(CustomizeTarget::Dates),
                        ),
                    },
                    Preview {
                        label: "Short — Jan 2024".to_string(),
                        html: String::new(),
                        choice_value: self.with_optional_customize_return(
                            serde_json::json!({ "date_preset": "short" }),
                            self.in_customize_flow(CustomizeTarget::Dates),
                        ),
                    },
                ]
            )
        } else if (self.title_preset.is_none() && self.from_preset.is_none())
            || self.in_customize_flow(CustomizeTarget::Titles)
        {
            // Step 7: Title styling (only if not set by preset)
            (
                Some(Question {
                    id: "title_preset".to_string(),
                    text: "How should titles be styled?".to_string(),
                    description: None,
                }),
                vec![
                    Preview {
                        label: "Article Title. *Journal Title*".to_string(),
                        html: String::new(),
                        choice_value: self.with_optional_customize_return(
                            serde_json::json!({ "title_preset": "apa" }),
                            self.in_customize_flow(CustomizeTarget::Titles),
                        ),
                    },
                    Preview {
                        label: "\"Article Title.\" *Journal Title*".to_string(),
                        html: String::new(),
                        choice_value: self.with_optional_customize_return(
                            serde_json::json!({ "title_preset": "chicago" }),
                            self.in_customize_flow(CustomizeTarget::Titles),
                        ),
                    },
                    Preview {
                        label: "Article title. Journal title".to_string(),
                        html: String::new(),
                        choice_value: self.with_optional_customize_return(
                            serde_json::json!({ "title_preset": "scientific" }),
                            self.in_customize_flow(CustomizeTarget::Titles),
                        ),
                    },
                ]
            )
        } else if (self.contributor_preset.is_none() && self.from_preset.is_none())
            || self.in_customize_flow(CustomizeTarget::Contributors)
        {
            (
                Some(Question {
                    id: "contributor_preset".to_string(),
                    text: "How should contributor names be formatted?".to_string(),
                    description: Some("Different styles vary a lot in how they abbreviate, invert, and join names.".to_string()),
                }),
                vec![
                    Preview {
                        label: "APA — Smith, J. D., & Jones, M.".to_string(),
                        html: String::new(),
                        choice_value: self.with_optional_customize_return(
                            serde_json::json!({ "contributor_preset": "apa" }),
                            self.in_customize_flow(CustomizeTarget::Contributors),
                        ),
                    },
                    Preview {
                        label: "Chicago — Smith, John D., and Mary Jones".to_string(),
                        html: String::new(),
                        choice_value: self.with_optional_customize_return(
                            serde_json::json!({ "contributor_preset": "chicago" }),
                            self.in_customize_flow(CustomizeTarget::Contributors),
                        ),
                    },
                    Preview {
                        label: "Vancouver — Smith JD, Jones M".to_string(),
                        html: String::new(),
                        choice_value: self.with_optional_customize_return(
                            serde_json::json!({ "contributor_preset": "vancouver" }),
                            self.in_customize_flow(CustomizeTarget::Contributors),
                        ),
                    },
                    Preview {
                        label: "Harvard — Smith, J.D. and Jones, M.".to_string(),
                        html: String::new(),
                        choice_value: self.with_optional_customize_return(
                            serde_json::json!({ "contributor_preset": "harvard" }),
                            self.in_customize_flow(CustomizeTarget::Contributors),
                        ),
                    },
                ]
            )
        } else {
            // Complete!
            (None, vec![])
        };

        DecisionPackage {
            missing_fields,
            question,
            previews,
            in_text_parenthetical: None,
            in_text_narrative: None,
            note: None,
            bibliography: None,
        }
    }

    fn class_question_description(&self) -> &'static str {
        match self.field.as_deref() {
            Some("humanities") => "Humanities styles usually use notes or author-date citations.",
            Some("sciences") => "Science styles most often use numeric or author-date citations.",
            _ => "Choose the general citation mechanism.",
        }
    }

    fn customization_menu(
        &self,
        include_bib: bool,
        is_note_style: bool,
    ) -> (Option<Question>, Vec<Preview>) {
        let mut previews = vec![
            Preview {
                label: "Contributor Names".to_string(),
                html: String::new(),
                choice_value: serde_json::json!({ "customize_target": "contributors" }),
            },
            Preview {
                label: "Contributor Roles".to_string(),
                html: String::new(),
                choice_value: serde_json::json!({ "customize_target": "roles" }),
            },
        ];

        if is_note_style {
            previews.push(Preview {
                label: "Bibliography Usage".to_string(),
                html: String::new(),
                choice_value: serde_json::json!({ "customize_target": "bibliography_usage" }),
            });
        }

        if include_bib {
            previews.push(Preview {
                label: "Bibliography Layout".to_string(),
                html: String::new(),
                choice_value: serde_json::json!({ "customize_target": "bibliography" }),
            });
        }

        previews.push(Preview {
            label: "Date Format".to_string(),
            html: String::new(),
            choice_value: serde_json::json!({ "customize_target": "dates" }),
        });
        previews.push(Preview {
            label: "Title Styling".to_string(),
            html: String::new(),
            choice_value: serde_json::json!({ "customize_target": "titles" }),
        });
        previews.push(Preview {
            label: "Done Customizing".to_string(),
            html: String::new(),
            choice_value: serde_json::json!({ "customize_target": null }),
        });

        (
            Some(Question {
                id: "customize_target".to_string(),
                text: "What would you like to refine?".to_string(),
                description: Some("Start from a preset, then tune the dimensions where styles vary the most.".to_string()),
            }),
            previews,
        )
    }

    fn class_previews(&self) -> Vec<Preview> {
        match self.field.as_deref() {
            Some("humanities") => vec![
                Preview {
                    label: "Footnote — 1".to_string(),
                    html: String::new(),
                    choice_value: serde_json::json!({ "class": "footnote" }),
                },
                Preview {
                    label: "Author-Date — (Smith, 2024)".to_string(),
                    html: String::new(),
                    choice_value: serde_json::json!({ "class": "author_date", "has_bibliography": true }),
                },
            ],
            Some("sciences") => vec![
                Preview {
                    label: "Numeric — [1]".to_string(),
                    html: String::new(),
                    choice_value: serde_json::json!({ "class": "numeric", "has_bibliography": true }),
                },
                Preview {
                    label: "Author-Date — (Smith, 2024)".to_string(),
                    html: String::new(),
                    choice_value: serde_json::json!({ "class": "author_date", "has_bibliography": true }),
                },
            ],
            _ => vec![
                Preview {
                    label: "Author-Date — (Smith, 2024)".to_string(),
                    html: String::new(),
                    choice_value: serde_json::json!({ "class": "author_date", "has_bibliography": true }),
                },
                Preview {
                    label: "Numeric — [1]".to_string(),
                    html: String::new(),
                    choice_value: serde_json::json!({ "class": "numeric", "has_bibliography": true }),
                },
                Preview {
                    label: "Footnote — 1".to_string(),
                    html: String::new(),
                    choice_value: serde_json::json!({ "class": "footnote" }),
                },
            ],
        }
    }

    /// Generates the preset gallery step based on the current class.
    fn preset_gallery(&self) -> (Option<Question>, Vec<Preview>) {
        match self.class.clone().or_else(|| self.inferred_class()) {
            Some(CitationClass::AuthorDate) => (
                Some(Question {
                    id: "preset".to_string(),
                    text: "Choose a style to start from".to_string(),
                    description: Some("Select a complete style preset, then refine later if needed.".to_string()),
                }),
                vec![
                    Preview {
                        label: "APA".to_string(),
                        html: String::new(), // filled by decide_handler
                        choice_value: serde_json::json!({
                            "from_preset": "apa",
                            "contributor_preset": "apa",
                            "role_preset": "short-suffix",
                            "date_preset": "year",
                            "title_preset": "apa",
                            "bib_template": "apa",
                        }),
                    },
                    Preview {
                        label: "Chicago Author-Date".to_string(),
                        html: String::new(),
                        choice_value: serde_json::json!({
                            "from_preset": "chicago_ad",
                            "contributor_preset": "chicago",
                            "role_preset": "verb-prefix",
                            "date_preset": "year",
                            "title_preset": "chicago",
                            "bib_template": "chicago",
                        }),
                    },
                    Preview {
                        label: "Harvard".to_string(),
                        html: String::new(),
                        choice_value: serde_json::json!({
                            "from_preset": "harvard",
                            "contributor_preset": "harvard",
                            "role_preset": "short-suffix",
                            "date_preset": "year",
                            "title_preset": "scientific",
                            "bib_template": "harvard",
                        }),
                    },
                ],
            ),
            Some(CitationClass::Numeric) => (
                Some(Question {
                    id: "preset".to_string(),
                    text: "Choose a style to start from".to_string(),
                    description: Some("Select a complete style preset, then refine later if needed.".to_string()),
                }),
                vec![
                    Preview {
                        label: "Vancouver".to_string(),
                        html: String::new(),
                        choice_value: serde_json::json!({
                            "from_preset": "vancouver",
                            "contributor_preset": "vancouver",
                            "role_preset": "short-suffix",
                            "date_preset": "year",
                            "title_preset": "scientific",
                            "bib_template": "vancouver",
                        }),
                    },
                    Preview {
                        label: "IEEE".to_string(),
                        html: String::new(),
                        choice_value: serde_json::json!({
                            "from_preset": "ieee",
                            "contributor_preset": "ieee",
                            "role_preset": "short-suffix",
                            "date_preset": "year",
                            "title_preset": "scientific",
                            "bib_template": "vancouver",
                        }),
                    },
                ],
            ),
            Some(CitationClass::Footnote) | Some(CitationClass::Endnote) => (
                Some(Question {
                    id: "preset".to_string(),
                    text: "Choose a style to start from".to_string(),
                    description: Some("Select a complete style preset, then refine later if needed.".to_string()),
                }),
                vec![
                    Preview {
                        label: "Chicago Notes & Bibliography".to_string(),
                        html: String::new(),
                        choice_value: serde_json::json!({
                            "from_preset": "chicago_notes",
                            "contributor_preset": "chicago",
                            "role_preset": "verb-prefix",
                            "date_preset": "year",
                            "title_preset": "chicago",
                            "bib_template": "chicago",
                        }),
                    },
                    Preview {
                        label: "Turabian".to_string(),
                        html: String::new(),
                        choice_value: serde_json::json!({
                            "from_preset": "turabian",
                            "contributor_preset": "chicago",
                            "role_preset": "verb-prefix",
                            "date_preset": "year",
                            "title_preset": "chicago",
                            "bib_template": "chicago",
                        }),
                    },
                ],
            ),
            _ => (None, vec![]),
        }
    }

    /// Converts the current intent into a `citum_schema::Style` struct.
    pub fn to_style(&self) -> Style {
        let mut style = Style {
            info: StyleInfo {
                id: Some("custom-style".to_string()),
                title: Some("Custom Style".to_string()),
                ..Default::default()
            },
            ..Default::default()
        };

        let mut config = Config::default();
        let mut contributors = self.contributor_preset.as_ref().and_then(|p| serde_yaml::from_str::<ContributorPreset>(p).ok()).map(|p| p.config());

        if let Some(role_str) = &self.role_preset {
            let mut cont = contributors.unwrap_or_default();
            
            use citum_schema::options::contributors::RoleLabelPreset;
            let role_preset = match role_str.as_str() {
                "short-suffix" => Some(RoleLabelPreset::ShortSuffix),
                "long-suffix" => Some(RoleLabelPreset::LongSuffix),
                "verb-prefix" => Some(RoleLabelPreset::VerbPrefix),
                "none" | "" => None,
                _ => {
                    eprintln!("Unknown role_preset value: {}", role_str);
                    None
                }
            };

            cont.role = Some(citum_schema::options::contributors::RoleOptions {
                preset: role_preset,
                ..Default::default()
            });
            contributors = Some(cont);
        }

        config.contributors = contributors;
        config.substitute = Some(citum_schema::options::SubstituteConfig::Preset(citum_schema::presets::SubstitutePreset::Standard));
        config.dates = self.date_preset.as_ref().and_then(|p| serde_yaml::from_str::<DatePreset>(p).ok()).map(|p| p.config());
        config.titles = self.title_preset.as_ref().and_then(|p| serde_yaml::from_str::<TitlePreset>(p).ok()).map(|p| p.config());
        
        let effective_class = self.class.clone().or_else(|| self.inferred_class());

        config.processing = match effective_class {
            Some(CitationClass::AuthorDate) | Some(CitationClass::Label) => Some(Processing::AuthorDate),
            Some(CitationClass::Numeric) => Some(Processing::Numeric),
            Some(CitationClass::Footnote) | Some(CitationClass::Endnote) => Some(Processing::Note),
            None => None,
        };

        style.options = Some(config);

        let template_preset = match effective_class {
            Some(CitationClass::Numeric) => Some(TemplatePreset::Vancouver),
            Some(CitationClass::Footnote) | Some(CitationClass::Endnote) => Some(TemplatePreset::ChicagoAuthorDate),
            Some(CitationClass::AuthorDate) | Some(CitationClass::Label) => Some(TemplatePreset::Apa),
            None => None,
        };

        if let Some(p) = template_preset {
            let mut citation_spec = citum_schema::CitationSpec {
                use_preset: Some(p.clone()),
                ..Default::default()
            };

            if matches!(effective_class, Some(CitationClass::AuthorDate) | Some(CitationClass::Label)) {
                // For author-date/label styles, we want parenthetical citations to be wrapped in parentheses.
                citation_spec.wrap = Some(citum_schema::template::WrapPunctuation::Parentheses.into());

                // Narrative citations should NOT have a global wrap (they have Author (Date) structure).
                citation_spec.integral = Some(Box::new(citum_schema::CitationSpec {
                    wrap: None,
                    ..Default::default()
                }));
            }

            style.citation = Some(citation_spec);

            let include_bib = if matches!(effective_class, Some(CitationClass::Footnote) | Some(CitationClass::Endnote)) {
                self.has_bibliography == Some(true)
            } else {
                true // non-note styles always include bib
            };

            if include_bib {
                let bib_preset = match self.bib_template.as_deref() {
                    Some("apa") => TemplatePreset::Apa,
                    Some("chicago") | Some("chicago_author_date") => TemplatePreset::ChicagoAuthorDate,
                    Some("vancouver") => TemplatePreset::Vancouver,
                    Some("harvard") => TemplatePreset::Harvard,
                    _ => p,
                };

                style.bibliography = Some(citum_schema::BibliographySpec {
                    use_preset: Some(bib_preset),
                    sort: self.sort_preset.as_ref()
                        .and_then(|s| serde_yaml::from_str::<SortPreset>(s).ok())
                        .map(|s| citum_schema::grouping::GroupSortEntry::Preset(s.clone())),
                    ..Default::default()
                });
            }
        }

        style
    }
}

/// A complete package returned by the intent engine representing the next decision 
/// the user needs to make, along with the current state of previews.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(not(target_arch = "wasm32"), derive(Type))]
pub struct DecisionPackage {
    /// List of fields that are still missing from the intent to form a complete style.
    pub missing_fields: Vec<String>,
    /// The next question to ask the user. Will be `None` if the intent is complete.
    pub question: Option<Question>,
    /// The available choices for the current question, typically rendered as interactive previews.
    pub previews: Vec<Preview>,
    /// Rendered preview of a parenthetical in-text citation (if applicable).
    pub in_text_parenthetical: Option<String>,
    /// Rendered preview of a narrative in-text citation (if applicable).
    pub in_text_narrative: Option<String>,
    /// Rendered preview of a note citation (if applicable).
    pub note: Option<String>,
    /// Rendered preview of the bibliography.
    pub bibliography: Option<String>,
}

/// Represents a question asked to the user during the style building process.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(not(target_arch = "wasm32"), derive(Type))]
pub struct Question {
    /// A unique identifier for the question (e.g., "class", "field").
    pub id: String,
    /// The main text of the question (e.g., "What is your academic field?").
    pub text: String,
    /// Optional supplementary text providing more context or guidance.
    pub description: Option<String>,
}

/// Represents an available choice for a `Question`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(not(target_arch = "wasm32"), derive(Type))]
pub struct Preview {
    /// The human-readable label for this choice.
    pub label: String,
    /// Rendered HTML demonstrating the effect of this choice.
    pub html: String,
    /// The JSON value to patch into the `StyleIntent` if this choice is selected.
    pub choice_value: serde_json::Value,
}

#[cfg(test)]
mod tests {
    use super::*;
    #[cfg(not(target_arch = "wasm32"))]
    use specta::ts::{self, ExportConfiguration};
    #[cfg(not(target_arch = "wasm32"))]
    use std::path::PathBuf;

    #[test]
    fn social_science_field_skips_class_question() {
        let decision = StyleIntent {
            field: Some("social_science".to_string()),
            ..Default::default()
        }
        .decide();

        assert_eq!(decision.question.as_ref().map(|q| q.id.as_str()), Some("preset"));
        assert!(!decision.missing_fields.iter().any(|field| field == "class"));
    }

    #[test]
    fn humanities_field_limits_class_choices() {
        let decision = StyleIntent {
            field: Some("humanities".to_string()),
            ..Default::default()
        }
        .decide();

        let labels: Vec<&str> = decision.previews.iter().map(|preview| preview.label.as_str()).collect();
        assert_eq!(decision.question.as_ref().map(|q| q.id.as_str()), Some("class"));
        assert_eq!(labels, vec!["Footnote — 1", "Author-Date — (Smith, 2024)"]);
    }

    #[test]
    fn test_role_preset_to_style() {
        let intent = StyleIntent {
            role_preset: Some("verb-prefix".to_string()),
            ..Default::default()
        };
        let style = intent.to_style();
        let config = style.options.unwrap();
        let contributors = config.contributors.unwrap();
        let role = contributors.role.unwrap();
        
        // verb-prefix should map to RoleLabelPreset::VerbPrefix
        assert_eq!(
            role.preset,
            Some(citum_schema::options::contributors::RoleLabelPreset::VerbPrefix)
        );
    }

    #[test]
    #[cfg(not(target_arch = "wasm32"))]
    fn export_bindings() {
        let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        path.pop(); // crates
        path.pop(); // server
        path.pop(); // root
        path.push("client/src/lib/types/bindings.ts");
        
        let config = ExportConfiguration::default();

        let mut out = String::new();
        out.push_str("/* eslint-disable */\n// This file was generated by [specta](https://github.com/oscartbeaumont/specta). Do not edit this file manually.\n\n");
        out.push_str(&ts::export::<StyleIntent>(&config).unwrap());
        out.push_str(";\n\n");
        out.push_str(&ts::export::<CitationClass>(&config).unwrap());
        out.push_str(";\n\n");
        out.push_str(&ts::export::<CustomizeTarget>(&config).unwrap());
        out.push_str(";\n\n");
        out.push_str(&ts::export::<DecisionPackage>(&config).unwrap());
        out.push_str(";\n\n");
        out.push_str(&ts::export::<Question>(&config).unwrap());
        out.push_str(";\n\n");
        out.push_str(&ts::export::<Preview>(&config).unwrap());
        out.push_str(";\n");

        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        std::fs::write(path, out).unwrap();
    }
}
