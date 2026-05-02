import yaml from "js-yaml";
import type {
	AxisChoice,
	AxisDefinition,
	AxisChoices,
	CitationField,
	PresetAxisSignature,
	PresetInfo,
	StyleFamily,
	WizardStep,
	WizardStyleOptions,
} from "$lib/types/wizard";
import { getPresetsForFamily } from "$lib/data/presets";
import {
	getArticleTitleStyleUpdates,
	getCitationNumberUpdates,
	getLocatorLabelUpdates,
	type WizardStyleUpdate,
} from "$lib/utils/wizard-style-updates";
import { getValueAtPath } from "$lib/utils/wizard-template";

export type { WizardStyleUpdate } from "$lib/utils/wizard-style-updates";

export const QUICK_START_STEPS: WizardStep[] = ["field", "family", "style", "refine", "review"];

const CHICAGO_NOTE_CITATION_TEMPLATE = [
	{ contributor: "author", form: "long" },
	{ title: "primary", quote: true },
	{ title: "parent-serial", emph: true },
	{ number: "volume" },
	{ number: "issue" },
	{ date: "issued", form: "year" },
	{ variable: "locator" },
];

const AUTHOR_DATE_NON_INTEGRAL_SPEC = {
	wrap: "parentheses",
	delimiter: ", ",
	template: [
		{ contributor: "author", form: "short" },
		{ date: "issued", form: "year" },
		{ variable: "locator" },
	],
};

const AUTHOR_DATE_INTEGRAL_SPEC = {
	delimiter: " ",
	template: [
		{ contributor: "author", form: "short" },
		{
			items: [{ date: "issued", form: "year" }, { variable: "locator" }],
			delimiter: ", ",
			wrap: "parentheses",
		},
	],
};

const NUMERIC_NON_INTEGRAL_SPEC = {
	template: [{ number: "citation-number" }, { variable: "locator" }],
};

const NUMERIC_INTEGRAL_SPEC = {
	delimiter: " ",
	template: [
		{
			contributor: "author",
			form: "short",
			shorten: { min: 3, "use-first": 1, "and-others": "et-al" },
			and: "text",
		},
		{ number: "citation-number" },
	],
};

const CITUM_STYLE_SCHEMA_VERSION = "0.39.1";
const GENERIC_STYLE_NAMES = new Set(["custom style", "my custom style", "untitled style"]);

export interface StyleMetadataValidation {
	nameError: string | null;
	idError: string | null;
}

export const WIZARD_STEP_LABELS: Record<WizardStep, string> = {
	field: "Field",
	family: "Family",
	style: "Style Navigator",
	refine: "Refine",
	review: "Review",
	customize: "Customize",
	advanced: "Advanced",
};

export function getWizardProgress(step: WizardStep) {
	const quickStep = QUICK_START_STEPS.includes(step) ? QUICK_START_STEPS.indexOf(step) + 1 : 5;
	return {
		current: step === "customize" ? 6 : step === "advanced" ? 7 : quickStep,
		total: 7,
		percentage: Math.round(
			((step === "customize" ? 6 : step === "advanced" ? 7 : quickStep) / 7) * 100
		),
		label: WIZARD_STEP_LABELS[step],
	};
}

export function defaultPresetForFamily(family: StyleFamily): PresetInfo {
	const presets = getPresetsForFamily(family);
	if (!presets[0]) throw new Error(`No presets available for ${family}`);
	return presets[0];
}

export function intentForPreset(preset: PresetInfo, field: CitationField | null) {
	return {
		field,
		...preset.intentFields,
	};
}

export const AXES_BY_FAMILY: Record<StyleFamily, AxisDefinition[]> = {
	"author-date": [
		{
			id: "nameForm",
			question: "How should author names look?",
			choices: [
				{ value: "family-first-initials", label: "Smith, J. A." },
				{ value: "given-first-initials", label: "J. A. Smith" },
				{ value: "family-first-full", label: "Smith, John A." },
			],
		},
		{
			id: "articleTitleEmphasis",
			question: "How are article titles formatted?",
			choices: [
				{ value: "plain", label: "Plain" },
				{ value: "quoted", label: "In quotes" },
				{ value: "italic", label: "Italic" },
			],
		},
		{
			id: "etAlThreshold",
			question: 'How many authors before "et al."?',
			choices: [
				{ value: 2, label: "After 2" },
				{ value: 3, label: "After 3" },
				{ value: 6, label: "After 6" },
				{ value: null, label: "Show all" },
			],
		},
		{
			id: "authorConnector",
			question: "Which author connector looks right?",
			choices: [
				{ value: "symbol", label: "&" },
				{ value: "text", label: "and" },
				{ value: "none", label: "Comma only" },
			],
		},
		{
			id: "locatorLabel",
			question: "How should page locators be labeled?",
			choices: [
				{ value: "short", label: "p. 42" },
				{ value: "long", label: "page 42" },
				{ value: "none", label: "42" },
			],
		},
	],
	numeric: [
		{
			id: "numberBracket",
			question: "How is the reference number shown?",
			choices: [
				{ value: "square", label: "[1]" },
				{ value: "period", label: "1." },
				{ value: "paren", label: "(1)" },
				{ value: "superscript", label: "Superscript 1" },
			],
		},
		{
			id: "nameForm",
			question: "How should author names look?",
			choices: [
				{ value: "compact", label: "Smith JA" },
				{ value: "family-first-initials", label: "Smith, J. A." },
				{ value: "given-first-initials", label: "J. A. Smith" },
			],
		},
		{
			id: "articleTitleEmphasis",
			question: "How are article titles formatted?",
			choices: [
				{ value: "plain", label: "Plain" },
				{ value: "quoted", label: "In quotes" },
			],
		},
		{
			id: "locatorLabel",
			question: "How should page locators be labeled?",
			choices: [
				{ value: "short", label: "p. 42" },
				{ value: "none", label: "42" },
			],
		},
	],
	note: [
		{
			id: "citationLocation",
			question: "Where should citations appear?",
			choices: [
				{ value: "footnote", label: "Footnotes" },
				{ value: "endnote", label: "Endnotes" },
			],
		},
		{
			id: "footnoteNameForm",
			question: "How are names written in notes?",
			choices: [
				{ value: "full", label: "John A. Smith" },
				{ value: "inverted", label: "Smith, John A." },
			],
		},
		{
			id: "bookEmphasis",
			question: "How are book titles shown?",
			choices: [
				{ value: "italic", label: "Italic" },
				{ value: "plain", label: "Plain" },
			],
		},
		{
			id: "hasBibliography",
			question: "Do you also need a bibliography?",
			choices: [
				{ value: true, label: "Yes" },
				{ value: false, label: "Footnotes only" },
			],
		},
	],
};

export const PRESET_SIGNATURES: PresetAxisSignature[] = [
	{
		presetId: "apa",
		family: "author-date",
		choices: {
			nameForm: "family-first-initials",
			articleTitleEmphasis: "italic",
			etAlThreshold: null,
			authorConnector: "symbol",
			locatorLabel: "short",
		},
	},
	{
		presetId: "harvard",
		family: "author-date",
		choices: {
			nameForm: "family-first-initials",
			articleTitleEmphasis: "plain",
			etAlThreshold: 3,
			authorConnector: "text",
			locatorLabel: "short",
		},
	},
	{
		presetId: "chicago-ad",
		family: "author-date",
		choices: {
			nameForm: "family-first-full",
			articleTitleEmphasis: "quoted",
			etAlThreshold: 3,
			authorConnector: "text",
			locatorLabel: "short",
		},
	},
	{
		presetId: "vancouver",
		family: "numeric",
		choices: {
			numberBracket: "square",
			nameForm: "compact",
			articleTitleEmphasis: "plain",
			locatorLabel: "none",
		},
	},
	{
		presetId: "ieee",
		family: "numeric",
		choices: {
			numberBracket: "square",
			nameForm: "given-first-initials",
			articleTitleEmphasis: "quoted",
			locatorLabel: "none",
		},
	},
	{
		presetId: "chicago-notes",
		family: "note",
		choices: {
			citationLocation: "footnote",
			footnoteNameForm: "full",
			bookEmphasis: "italic",
			hasBibliography: true,
		},
	},
	{
		presetId: "turabian",
		family: "note",
		choices: {
			citationLocation: "footnote",
			footnoteNameForm: "full",
			bookEmphasis: "italic",
			hasBibliography: true,
		},
	},
];

export function getAxisChoiceUpdates(
	axisId: keyof AxisChoices,
	value: AxisChoice["value"]
): WizardStyleUpdate[] {
	switch (axisId) {
		case "nameForm":
			if (value === "family-first-initials") {
				return [
					{ path: "options.contributors.display-as-sort", value: "all" },
					{ path: "options.contributors.name-form", value: "initials" },
					{ path: "options.contributors.initialize-with", value: ". " },
				];
			}
			if (value === "given-first-initials") {
				return [
					{ path: "options.contributors.display-as-sort", value: "none" },
					{ path: "options.contributors.name-form", value: "initials" },
					{ path: "options.contributors.initialize-with", value: ". " },
				];
			}
			if (value === "compact") {
				return [
					{ path: "options.contributors.display-as-sort", value: "all" },
					{ path: "options.contributors.name-form", value: "initials" },
					{ path: "options.contributors.initialize-with", value: "" },
				];
			}
			return [
				{ path: "options.contributors.display-as-sort", value: "all" },
				{ path: "options.contributors.name-form", value: "full" },
				{ path: "options.contributors.initialize-with", value: undefined },
			];
		case "etAlThreshold":
			return [
				{
					path: "options.contributors.shorten",
					value: value === null ? undefined : { min: value, "use-first": 1, "and-others": "et-al" },
				},
			];
		case "authorConnector":
			return [{ path: "options.contributors.and", value: value === "none" ? undefined : value }];
		case "articleTitleEmphasis":
			return getArticleTitleStyleUpdates(value as "plain" | "quoted" | "italic");
		case "locatorLabel":
			return getLocatorLabelUpdates(String(value));
		case "numberBracket":
			return getCitationNumberUpdates(value as "square" | "period" | "paren" | "superscript");
		case "citationLocation":
			return [
				{ path: "options.processing", value: "note" },
				{ path: "custom.wizard_v2.citation_location", value },
			];
		case "footnoteNameForm":
			return [
				{
					path: "options.contributors.display-as-sort",
					value: value === "inverted" ? "all" : "none",
				},
			];
		case "bookEmphasis":
			return [{ path: "options.titles.monograph.emph", value: value === "italic" }];
		case "hasBibliography":
			return value ? [] : [{ path: "bibliography", value: null }];
		default:
			return [];
	}
}

export function applyStyleUpdatesToObject(
	root: Record<string, unknown>,
	updates: WizardStyleUpdate[]
): Record<string, unknown> {
	const next = structuredClone(root);

	for (const update of updates) {
		const parts = update.path.split(".");
		let current: Record<string, unknown> | unknown[] = next;
		for (let index = 0; index < parts.length - 1; index++) {
			const part = parts[index];
			const following = parts[index + 1];
			if (Array.isArray(current)) {
				const arrayIndex = Number.parseInt(part, 10);
				if (typeof current[arrayIndex] !== "object" || current[arrayIndex] === null) {
					current[arrayIndex] = /^\d+$/.test(following) ? [] : {};
				}
				current = current[arrayIndex] as Record<string, unknown> | unknown[];
			} else {
				if (typeof current[part] !== "object" || current[part] === null) {
					current[part] = /^\d+$/.test(following) ? [] : {};
				}
				current = current[part] as Record<string, unknown> | unknown[];
			}
		}

		const last = parts[parts.length - 1];
		if (Array.isArray(current)) {
			const arrayIndex = Number.parseInt(last, 10);
			if (update.value === undefined) current.splice(arrayIndex, 1);
			else current[arrayIndex] = update.value;
		} else if (update.value === undefined) {
			delete current[last];
		} else {
			current[last] = update.value;
		}
	}

	return next;
}

export function applyStyleUpdatesToYaml(styleYaml: string, updates: WizardStyleUpdate[]): string {
	const parsed = yaml.load(styleYaml);
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return styleYaml;
	const next = applyStyleUpdatesToObject(parsed as Record<string, unknown>, updates);
	return yaml.dump(next, { lineWidth: 120, noRefs: true, quotingType: '"' });
}

export function normalizeGeneratedStyleForFamily(styleYaml: string, family: StyleFamily): string {
	const parsed = yaml.load(styleYaml);
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return styleYaml;

	const style = parsed as Record<string, unknown>;
	style.version = CITUM_STYLE_SCHEMA_VERSION;
	const options = ((style.options as Record<string, unknown> | undefined) ??= {});
	options.processing =
		family === "numeric" ? "numeric" : family === "note" ? "note" : "author-date";

	const citation = ((style.citation as Record<string, unknown> | undefined) ??= {});
	if (family === "author-date") {
		citation["non-integral"] ??= structuredClone(AUTHOR_DATE_NON_INTEGRAL_SPEC);
		citation.integral ??= structuredClone(AUTHOR_DATE_INTEGRAL_SPEC);
	} else if (family === "numeric") {
		citation["non-integral"] ??= structuredClone(NUMERIC_NON_INTEGRAL_SPEC);
		citation.integral ??= structuredClone(NUMERIC_INTEGRAL_SPEC);
	} else {
		citation.template = structuredClone(CHICAGO_NOTE_CITATION_TEMPLATE);
		citation["non-integral"] ??= { template: structuredClone(CHICAGO_NOTE_CITATION_TEMPLATE) };
		citation.integral ??= { template: structuredClone(CHICAGO_NOTE_CITATION_TEMPLATE) };
		delete citation["use-preset"];

		const bibliography = ((style.bibliography as Record<string, unknown> | undefined) ??= {});
		if (bibliography["use-preset"] === "apa") {
			bibliography["use-preset"] = "chicago-author-date";
		}
	}

	return yaml.dump(style, { lineWidth: 120, noRefs: true, quotingType: '"' });
}

export function getOptionsFromYaml(styleYaml: string): WizardStyleOptions | null {
	const parsed = yaml.load(styleYaml);
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
	return ((parsed as Record<string, unknown>).options as WizardStyleOptions | undefined) ?? null;
}

export function matchPreset(family: StyleFamily, choices: Partial<AxisChoices>) {
	const signatures = PRESET_SIGNATURES.filter((signature) => signature.family === family);
	const scored = signatures
		.map((signature) => {
			const entries = Object.entries(choices).filter(([, value]) => value !== undefined);
			const matches = entries.filter(([key, value]) => {
				return signature.choices[key as keyof AxisChoices] === value;
			}).length;
			return { ...signature, matches, considered: entries.length };
		})
		.sort(
			(left, right) => right.matches - left.matches || left.presetId.localeCompare(right.presetId)
		);

	return scored[0] ?? null;
}

export function isExactPresetMatch(family: StyleFamily, choices: Partial<AxisChoices>): boolean {
	const match = matchPreset(family, choices);
	if (!match) return false;
	const signatureKeys = Object.keys(match.choices);
	return (
		signatureKeys.every(
			(key) => choices[key as keyof AxisChoices] === match.choices[key as keyof AxisChoices]
		) && Object.keys(choices).length >= signatureKeys.length
	);
}

export function getPreviewHtmlForFamily(
	family: StyleFamily,
	preview: {
		parenthetical: string | null;
		narrative: string | null;
		note: string | null;
		bibliography: string | null;
	}
): string {
	if (family === "note") return preview.note ?? preview.bibliography ?? "";
	return preview.parenthetical ?? preview.bibliography ?? preview.narrative ?? "";
}

export function getPreviewHtmlForAxis(
	family: StyleFamily,
	axisId: keyof AxisChoices,
	preview: {
		parenthetical: string | null;
		narrative: string | null;
		note: string | null;
		bibliography: string | null;
	}
): string {
	if (family === "note") {
		if (axisId === "hasBibliography") {
			return preview.bibliography ?? preview.note ?? "";
		}
		return preview.note ?? "";
	}

	switch (axisId) {
		case "nameForm":
		case "articleTitleEmphasis":
		case "authorConnector":
		case "bookEmphasis":
		case "hasBibliography":
			return preview.bibliography ?? getPreviewHtmlForFamily(family, preview);
		case "numberBracket":
		case "locatorLabel":
		case "etAlThreshold":
			return preview.parenthetical ?? preview.narrative ?? getPreviewHtmlForFamily(family, preview);
		case "citationLocation":
		case "footnoteNameForm":
			return preview.note ?? preview.bibliography ?? getPreviewHtmlForFamily(family, preview);
		default:
			return getPreviewHtmlForFamily(family, preview);
	}
}

export function buildWizardMetadata(params: {
	field: CitationField | null;
	family: StyleFamily | null;
	axisChoices: Partial<AxisChoices>;
	presetId: string | null;
}) {
	const citationLocation =
		params.family === "note" ? (params.axisChoices.citationLocation ?? "footnote") : undefined;

	return {
		wizard_v2: {
			version: 1,
			field: params.field,
			family: params.family,
			axis_choices: params.axisChoices,
			preset_id: params.presetId,
			...(citationLocation ? { citation_location: citationLocation } : {}),
		},
	};
}

export function slugifyStyleId(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 80);
}

export function suggestStyleName(params: {
	field: CitationField | null;
	family: StyleFamily | null;
	presetId: string | null;
}): string {
	if (params.presetId) return `${params.presetId.replace(/-/g, " ")} style`;
	if (params.field && params.family) {
		return `${params.field.replace(/-/g, " ")} ${params.family.replace(/-/g, " ")} style`;
	}
	if (params.family) return `${params.family.replace(/-/g, " ")} style`;
	return "";
}

export function validateStyleMetadata(name: string, id: string): StyleMetadataValidation {
	const trimmedName = name.trim();
	const trimmedId = id.trim();
	const genericName = GENERIC_STYLE_NAMES.has(trimmedName.toLowerCase());

	return {
		nameError: !trimmedName
			? "Name your style before continuing."
			: trimmedName.length > 100
				? "Style names must be 100 characters or fewer."
				: genericName
					? "Choose a more specific style name."
					: null,
		idError: !trimmedId
			? "Style id is required."
			: trimmedId.length > 80
				? "Style ids must be 80 characters or fewer."
				: slugifyStyleId(trimmedId) !== trimmedId
					? "Use lowercase letters, numbers, and hyphens only."
					: null,
	};
}

export function applyWizardSessionToYaml(
	styleYaml: string,
	params: {
		name: string;
		id: string;
		field: CitationField | null;
		family: StyleFamily | null;
		axisChoices: Partial<AxisChoices>;
		presetId: string | null;
	}
): string {
	const parsed = yaml.load(styleYaml);
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return styleYaml;

	const style = parsed as Record<string, unknown>;
	style.version = CITUM_STYLE_SCHEMA_VERSION;
	const info = ((style.info as Record<string, unknown> | undefined) ??= {});
	info.title = params.name.trim();
	info.id = slugifyStyleId(params.id);

	const custom = ((style.custom as Record<string, unknown> | undefined) ??= {});
	custom.wizard_v2 = buildWizardMetadata({
		field: params.field,
		family: params.family,
		axisChoices: params.axisChoices,
		presetId: params.presetId,
	}).wizard_v2;

	return yaml.dump(style, { lineWidth: 120, noRefs: true, quotingType: '"' });
}

export function getStyleTitle(styleYaml: string): string | null {
	const parsed = yaml.load(styleYaml);
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
	const title = getValueAtPath(parsed as Record<string, unknown>, "info.title");
	return typeof title === "string" ? title : null;
}

export function getStyleId(styleYaml: string): string | null {
	const parsed = yaml.load(styleYaml);
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
	const id = getValueAtPath(parsed as Record<string, unknown>, "info.id");
	return typeof id === "string" ? id : null;
}
