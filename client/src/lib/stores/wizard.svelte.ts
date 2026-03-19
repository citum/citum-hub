/**
 * WizardStore — Svelte 5 runes-based state for the v2 style wizard.
 * Single source of truth for the wizard flow, style YAML, and preview state.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import yaml from "js-yaml";
import type {
	CitationField,
	StyleFamily,
	WizardPhase,
	ComponentSelection,
	WizardStyleOptions,
	AxisChoices,
} from "$lib/types/wizard";
import { FIELD_DEFAULTS } from "$lib/types/wizard";

// Reactive state using module-level $state runes
let phase = $state<WizardPhase>("quick-start");
let step = $state(1);
let field = $state<CitationField | null>(null);
let family = $state<StyleFamily | null>(null);
let axisChoices = $state<Partial<AxisChoices>>({});
let presetId = $state<string | null>(null);
let styleYaml = $state("");
let styleName = $state("");
let styleInfo = $state<Record<string, any> | null>(null);
let selectedComponent = $state<ComponentSelection | null>(null);
let activeRefType = $state("article-journal");
let testLocator = $state<string>("123-125");

// Preview HTML from the server
let previewHtml = $state<{
	parenthetical: string | null;
	narrative: string | null;
	note: string | null;
	bibliography: string | null;
}>({ parenthetical: null, narrative: null, note: null, bibliography: null });

// Undo history
let history = $state<string[]>([]);
let historyIndex = $state(-1);

// Loading / error state
let isLoading = $state(false);
let error = $state<string | null>(null);

function pushHistory() {
	if (!styleYaml) return;
	// Trim future entries if we undid something
	history = [...history.slice(0, historyIndex + 1), styleYaml];
	historyIndex = history.length - 1;
	// Cap at 50 entries
	if (history.length > 50) {
		history = history.slice(history.length - 50);
		historyIndex = history.length - 1;
	}
}

/** Parse the current YAML into a JS object. Returns null on error. */
function parseStyle(): Record<string, unknown> | null {
	if (!styleYaml) return null;
	try {
		return yaml.load(styleYaml) as Record<string, unknown>;
	} catch {
		return null;
	}
}

/** Re-serialize a modified style object back to YAML. */
function serializeStyle(obj: Record<string, unknown>): string {
	return yaml.dump(obj, { lineWidth: 120, noRefs: true, quotingType: '"' });
}

/** Update a specific path in the style YAML.
 *  path is dot-separated, e.g. "options.contributors.and" or "bibliography.template.0.prefix" */
function updateStyleField(path: string, value: unknown) {
	const obj = parseStyle();
	if (!obj) return;

	pushHistory();

	const parts = path.split(".");
	let current: any = obj;
	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i];
		const nextPart = parts[i + 1];

		// If part is not in current or is not an object/array, create it
		if (!(part in current) || typeof current[part] !== "object" || current[part] === null) {
			current[part] = /^\d+$/.test(nextPart) ? [] : {};
		}
		current = current[part];
	}

	const lastPart = parts[parts.length - 1];
	if (value === undefined) {
		if (Array.isArray(current)) {
			current.splice(parseInt(lastPart), 1);
		} else {
			delete current[lastPart];
		}
	} else {
		current[lastPart] = value;
	}
	styleYaml = serializeStyle(obj);
}

/** Move a component within a template array. */
function moveComponent(templatePath: string, fromIndex: number, toIndex: number) {
	const obj = parseStyle();
	if (!obj) return;

	const parts = templatePath.split(".");
	let template: any = obj;
	for (const part of parts) {
		template = template[part];
	}

	if (!Array.isArray(template)) return;
	if (toIndex < 0 || toIndex >= template.length) return;

	pushHistory();
	const [item] = template.splice(fromIndex, 1);
	template.splice(toIndex, 0, item);
	styleYaml = serializeStyle(obj);
}

/** Delete a component from a template array. */
function deleteComponent(templatePath: string, index: number) {
	const obj = parseStyle();
	if (!obj) return;

	const parts = templatePath.split(".");
	let template: any = obj;
	for (const part of parts) {
		template = template[part];
	}

	if (!Array.isArray(template)) return;

	pushHistory();
	template.splice(index, 1);
	styleYaml = serializeStyle(obj);
}

/** Get the options block from the style. */
function getOptions(): WizardStyleOptions | null {
	const obj = parseStyle();
	if (!obj) return null;
	return (obj["options"] as WizardStyleOptions) ?? null;
}

/** Fetch preview HTML from the server for the current style YAML. */
async function fetchPreview() {
	if (!styleYaml) return;
	isLoading = true;
	error = null;
	try {
		// Use "citum" variant of the preview API
		const res = await fetch("/api/v1/preview", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				citum: styleYaml,
				test_locator: testLocator || undefined,
				inject_ast_indices: true,
			}),
		});
		if (!res.ok) throw new Error(`Preview failed: ${res.status}`);
		const data = await res.json();
		previewHtml = {
			parenthetical: data.in_text_parenthetical ?? null,
			narrative: data.in_text_narrative ?? null,
			note: data.note ?? null,
			bibliography: data.bibliography ?? null,
		};
	} catch (e) {
		error = e instanceof Error ? e.message : "Preview error";
	} finally {
		isLoading = false;
	}
}

/** Generate base style YAML from intent fields via the server. */
async function generateFromIntent(intentFields: Record<string, string | boolean | null>) {
	isLoading = true;
	error = null;
	try {
		const intentObj = {
			field: field,
			class: intentFields["class"] ?? null,
			from_preset: intentFields["from_preset"] ?? null,
			customize_target: null,
			contributor_preset: intentFields["contributor_preset"] ?? null,
			date_preset: intentFields["date_preset"] ?? null,
			title_preset: intentFields["title_preset"] ?? null,
			sort_preset: null,
			bib_template: intentFields["bib_template"] ?? null,
			has_bibliography: intentFields["has_bibliography"] ?? null,
		};
		const res = await fetch("/api/v1/generate", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(intentObj),
		});
		if (!res.ok) throw new Error(`Generate failed: ${res.status}`);
		styleYaml = await res.text();

		// Extract metadata (info) from YAML
		const parsed = parseStyle();
		if (parsed && parsed.info) {
			styleInfo = parsed.info as Record<string, any>;
			if (styleInfo.title && !styleName) {
				styleName = styleInfo.title;
			}
		}

		// Reset history with new base
		history = [styleYaml];
		historyIndex = 0;
		await fetchPreview();
	} catch (e) {
		error = e instanceof Error ? e.message : "Generation error";
	} finally {
		isLoading = false;
	}
}

function undo() {
	if (historyIndex > 0) {
		historyIndex--;
		styleYaml = history[historyIndex];
	}
}

function redo() {
	if (historyIndex < history.length - 1) {
		historyIndex++;
		styleYaml = history[historyIndex];
	}
}

function reset() {
	phase = "quick-start";
	step = 1;
	field = null;
	family = null;
	axisChoices = {};
	presetId = null;
	styleYaml = "";
	styleName = "";
	styleInfo = null;
	selectedComponent = null;
	activeRefType = "article-journal";
	previewHtml = {
		parenthetical: null,
		narrative: null,
		note: null,
		bibliography: null,
	};
	history = [];
	historyIndex = -1;
	error = null;
	try {
		sessionStorage.removeItem("citum-wizard-state");
	} catch {
		// SSR or storage unavailable
	}
}

/** Persist state to sessionStorage. */
function persist() {
	try {
		sessionStorage.setItem(
			"citum-wizard-state",
			JSON.stringify({
				phase,
				step,
				field,
				family,
				axisChoices,
				presetId,
				styleYaml,
				styleName,
				styleInfo,
				activeRefType,
			})
		);
	} catch {
		// Storage unavailable
	}
}

/** Restore state from sessionStorage. Returns true if state was restored. */
function restore(): boolean {
	try {
		const saved = sessionStorage.getItem("citum-wizard-state");
		if (!saved) return false;
		const data = JSON.parse(saved);
		phase = data.phase ?? "quick-start";
		step = data.step ?? 1;
		field = data.field ?? null;
		family = data.family ?? null;
		axisChoices = data.axisChoices ?? {};
		presetId = data.presetId ?? null;
		styleYaml = data.styleYaml ?? "";
		styleName = data.styleName ?? "";
		styleInfo = data.styleInfo ?? null;
		activeRefType = data.activeRefType ?? "article-journal";
		if (styleYaml) {
			history = [styleYaml];
			historyIndex = 0;
		}
		return true;
	} catch {
		return false;
	}
}

export const wizardStore = {
	// Getters (reactive via $state)
	get phase() {
		return phase;
	},
	get step() {
		return step;
	},
	get field() {
		return field;
	},
	get family() {
		return family;
	},
	get axisChoices() {
		return axisChoices;
	},
	get presetId() {
		return presetId;
	},
	get styleYaml() {
		return styleYaml;
	},
	get styleName() {
		return styleName;
	},
	get styleInfo() {
		return styleInfo;
	},
	get selectedComponent() {
		return selectedComponent;
	},
	get activeRefType() {
		return activeRefType;
	},
	get testLocator() {
		return testLocator;
	},
	get previewHtml() {
		return previewHtml;
	},
	get isLoading() {
		return isLoading;
	},
	get error() {
		return error;
	},
	get canUndo() {
		return historyIndex > 0;
	},
	get canRedo() {
		return historyIndex < history.length - 1;
	},

	// Setters
	setPhase(p: WizardPhase) {
		phase = p;
		persist();
	},
	setStep(s: number) {
		step = s;
		persist();
	},
	setField(f: CitationField) {
		field = f;
		family = FIELD_DEFAULTS[f];
		persist();
	},
	setFamily(f: StyleFamily) {
		family = f;
		persist();
	},
	setAxisChoices(c: Partial<AxisChoices>) {
		axisChoices = { ...axisChoices, ...c };
		persist();
	},
	setPresetId(id: string) {
		presetId = id;
		persist();
	},
	setStyleYaml(y: string) {
		styleYaml = y;
		persist();
	},
	setStyleName(n: string) {
		styleName = n;
		persist();
	},
	setSelectedComponent(c: ComponentSelection | null) {
		selectedComponent = c;
	},
	setActiveRefType(t: string) {
		activeRefType = t;
	},
	setTestLocator(l: string) {
		testLocator = l;
		fetchPreview();
	},

	// Actions
	updateStyleField,
	moveComponent,
	deleteComponent,
	getOptions,
	parseStyle,
	serializeStyle,
	generateFromIntent,
	fetchPreview,
	undo,
	redo,
	reset,
	restore,
	persist,
};
