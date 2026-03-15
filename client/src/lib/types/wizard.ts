/** Wizard-specific types for the v2 style creation flow. */

export type StyleFamily = "author-date" | "numeric" | "note";

export type CitationField =
	| "sciences"
	| "medicine"
	| "social-sciences"
	| "humanities"
	| "law"
	| "other";

export type WizardPhase = "quick-start" | "visual-customizer" | "advanced";

/** Maps fields to their default style families. */
export const FIELD_DEFAULTS: Record<CitationField, StyleFamily> = {
	sciences: "numeric",
	medicine: "numeric",
	"social-sciences": "author-date",
	humanities: "note",
	law: "note",
	other: "author-date",
};

export interface FieldOption {
	id: CitationField;
	label: string;
	subtitle: string;
	icon: string;
}

export const FIELD_OPTIONS: FieldOption[] = [
	{
		id: "sciences",
		label: "Sciences",
		subtitle: "Physics, Chemistry, Biology, Engineering",
		icon: "science",
	},
	{
		id: "medicine",
		label: "Medicine & Health",
		subtitle: "Clinical, Nursing, Public Health",
		icon: "local_hospital",
	},
	{
		id: "social-sciences",
		label: "Social Sciences",
		subtitle: "Psychology, Sociology, Economics",
		icon: "bar_chart",
	},
	{
		id: "humanities",
		label: "Humanities",
		subtitle: "History, Literature, Philosophy",
		icon: "auto_stories",
	},
	{
		id: "law",
		label: "Law",
		subtitle: "Legal scholarship, Case law",
		icon: "gavel",
	},
	{
		id: "other",
		label: "Other",
		subtitle: "Cross-field, general use",
		icon: "public",
	},
];

export interface FamilyOption {
	id: StyleFamily;
	label: string;
	description: string;
	exampleText: string;
}

export const FAMILY_OPTIONS: FamilyOption[] = [
	{
		id: "author-date",
		label: "Author-Date",
		description: "Author names and years appear in the text",
		exampleText:
			"According to Smith (2024), the results were significant. Several studies confirm this finding (Jones & Lee, 2023; Chen et al., 2022).",
	},
	{
		id: "numeric",
		label: "Numeric",
		description: "Numbers in brackets refer to a numbered list",
		exampleText:
			"According to Smith [1], the results were significant. Several studies confirm this finding [2, 3].",
	},
	{
		id: "note",
		label: "Notes",
		description: "Superscript numbers link to footnotes or endnotes",
		exampleText:
			"According to Smith,\u00B9 the results were significant. Several studies confirm this finding.\u00B2",
	},
];

/** Minimal typed representation of the parts of a Citum Style
 *  that the wizard manipulates. The full style is kept as a YAML string. */
export interface WizardStyleOptions {
	contributors?: string | ContributorConfig;
	dates?: string | DateConfig;
	titles?: string | TitleConfig;
}

export interface ContributorConfig {
	"name-form"?: string;
	"display-as-sort"?: string;
	and?: string;
	"initialize-with"?: string;
	shorten?: { min?: number; "use-first"?: number };
}

export interface DateConfig {
	month?: string;
}

export interface TitleConfig {
	"text-case"?: string;
	emph?: boolean;
	quote?: boolean;
}

export interface PresetInfo {
	id: string;
	name: string;
	family: StyleFamily;
	/** Intent fields to set when this preset is selected. */
	intentFields: Record<string, string | boolean | null>;
	/** Short description of visual traits. */
	traits: string;
}

/** Component selection for the visual customizer. */
export interface ComponentSelection {
	componentType: string;
	cssClass: string;
	element: HTMLElement;
}
