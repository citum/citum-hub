import type { StyleIntent, DecisionPackage, Question, Preview } from '$lib/types/bindings';
import yaml from 'js-yaml';

export function decide(intent: StyleIntent): DecisionPackage {
    const missing_fields: string[] = [];
    if (!intent.field) missing_fields.push("field");
    if (!intent.class) missing_fields.push("class");
    
    if (intent.class) {
        if (intent.class === 'footnote') {
            if (intent.has_bibliography === null) missing_fields.push("has_bibliography");
            if (!intent.author_format) missing_fields.push("author_format");
        } else if (['numeric', 'author_date', 'endnote'].includes(intent.class)) {
            if (!intent.author_format) missing_fields.push("author_format");
            if (intent.class === 'author_date' && intent.has_bibliography === null) {
                missing_fields.push("has_bibliography");
            }
        }
    }

    let question: Question | null = null;
    let previews: Preview[] = [];

    if (!intent.field) {
        question = { id: "field", text: "What is your academic field?", description: "Select one or more fields to find appropriate styles." };
        previews = [
            { label: "Humanities", html: "", choice_value: { field: "humanities" } },
            { label: "Social Science", html: "", choice_value: { field: "social_science" } },
            { label: "Sciences", html: "", choice_value: { field: "sciences" } },
        ];
    } else if (!intent.class) {
        const field = intent.field;
        question = { id: "class", text: "Select a style type", description: null };
        if (field === "humanities") {
            previews = [
                { label: "footnote", html: "", choice_value: { class: "footnote" } },
                { label: "endnote", html: "", choice_value: { class: "endnote" } },
                { label: "Author-Date", html: "", choice_value: { class: "author_date" } },
            ];
        } else if (field === "social_science") {
            previews = [
                { label: "Author-Date", html: "", choice_value: { class: "author_date" } },
            ];
        } else {
            previews = [
                { label: "Author-Date", html: "", choice_value: { class: "author_date" } },
                { label: "numeric", html: "", choice_value: { class: "numeric" } },
            ];
        }
    } else {
        const cls = intent.class;
        if (cls === 'author_date' && !intent.citation_preset) {
            question = { id: "citation_preset", text: "How should citations appear in your text?", description: "Choose the pattern that matches your target publication." };
            previews = [
                { label: "(Smith and Jones, 2023: 34)", html: "", choice_value: { citation_preset: "colon-locator" } },
                { label: "(Smith and Jones, 2023, p.34)", html: "", choice_value: { citation_preset: "comma-sep" } },
                { label: "(Smith and Jones 2023, 34)", html: "", choice_value: { citation_preset: "minimal" } },
            ];
        } else if (cls === 'author_date' && !intent.bibliography_preset) {
            question = { id: "bibliography_preset", text: "How should entries look in the bibliography?", description: null };
            previews = [
                { label: "Smith, J. (2023). Title...", html: "", choice_value: { bibliography_preset: "year-wrapped", has_bibliography: true } },
                { label: "Smith, J. 2023. Title...", html: "", choice_value: { bibliography_preset: "flat", has_bibliography: true } },
            ];
        } else if (cls === 'author_date' && intent.detailed_config === null) {
            question = { id: "detailed_config", text: "Refine further?", description: "The presets cover 90% of cases. Do you need to tweak granular details like author initials or et al. rules?" };
            previews = [
                { label: "No, presets are fine", html: "", choice_value: { detailed_config: false } },
                { label: "Yes, show detailed config", html: "", choice_value: { detailed_config: true } },
            ];
        } else if (cls === 'author_date' && intent.detailed_config === true && !intent.author_format) {
            question = { id: "author_format", text: "Advanced Formatting", description: "Fine-tune how authors and names are handled." };
            previews = [
                { label: "Standard (APA-style et al.)", html: "", choice_value: { author_format: { form: "long", et_al: { min: 3, use_first: 1 } } } },
                { label: "Always show all authors", html: "", choice_value: { author_format: { form: "long", et_al: null } } },
            ];
        } else if (cls === 'footnote' && intent.has_bibliography === null) {
            question = { id: "has_bibliography", text: "Does this style include a bibliography?", description: "Note formatting typically changes if a bibliography is present." };
            previews = [
                { label: "Yes, include bibliography", html: "", choice_value: { has_bibliography: true } },
                { label: "No, notes only", html: "", choice_value: { has_bibliography: false } },
            ];
        } else if (cls === 'numeric' && !intent.author_format) {
            question = { id: "author_format", text: "How should citation numbers be wrapped?", description: null };
            previews = [
                { label: "Square Brackets [1]", html: "", choice_value: { author_format: { form: "short", et_al: null } } },
                { label: "Parentheses (1)", html: "", choice_value: { author_format: { form: "long", et_al: null } } },
                { label: "Superscript ¹", html: "", choice_value: { author_format: { form: "long", et_al: { min: 1, use_first: 1 } } } },
            ];
        } else if (!intent.author_format) {
            question = { id: "author_format", text: "Choose a formatting pattern", description: null };
            previews = [
                { label: "Standard", html: "", choice_value: { author_format: { form: "long", et_al: { min: 3, use_first: 1 } } } },
                { label: "Full", html: "", choice_value: { author_format: { form: "long", et_al: null } } },
            ];
        }
    }

    return {
        missing_fields,
        question,
        previews,
        in_text_preview: null,
        note_preview: null,
        bibliography_preview: null
    };
}

export function toStyle(intent: StyleIntent): any {
    const style: any = {
        info: {
            id: "custom-style",
            title: "Custom Style"
        }
    };

    let preset = null;
    if (intent.class === 'numeric') preset = 'vancouver';
    else if (intent.class === 'footnote' || intent.class === 'endnote') preset = 'chicago-author-date';
    else if (intent.class === 'author_date') {
        if (intent.bibliography_preset === 'year-wrapped') preset = 'apa';
        else if (intent.bibliography_preset === 'flat') preset = 'chicago-author-date';
        else preset = 'apa';
    }

    if (preset) {
        let wrap = null;
        if (intent.class === 'author_date') wrap = 'parentheses';

        let options = undefined;
        if (intent.author_format && intent.author_format.et_al) {
            options = {
                contributors: {
                    shorten: {
                        min: intent.author_format.et_al.min,
                        use_first: intent.author_format.et_al.use_first
                    }
                }
            };
        }

        style.citation = {
            use_preset: preset,
            wrap,
            options
        };

        if (intent.has_bibliography) {
            style.bibliography = {
                use_preset: preset,
                options
            };
        }
    }

    return style;
}

export function generateCitum(intent: StyleIntent): string {
    const style = toStyle(intent);
    return yaml.dump(style);
}
