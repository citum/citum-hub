import yaml from 'js-yaml';

//#region src/lib/types/wizard.ts
/** Maps fields to their default style families. */
var FIELD_DEFAULTS = {
	sciences: "numeric",
	medicine: "numeric",
	"social-sciences": "author-date",
	humanities: "note",
	law: "note",
	other: "author-date"
};
var FIELD_OPTIONS = [
	{
		id: "sciences",
		label: "Sciences",
		subtitle: "Physics, Chemistry, Biology, Engineering",
		icon: "science"
	},
	{
		id: "medicine",
		label: "Medicine & Health",
		subtitle: "Clinical, Nursing, Public Health",
		icon: "local_hospital"
	},
	{
		id: "social-sciences",
		label: "Social Sciences",
		subtitle: "Psychology, Sociology, Economics",
		icon: "bar_chart"
	},
	{
		id: "humanities",
		label: "Humanities",
		subtitle: "History, Literature, Philosophy",
		icon: "auto_stories"
	},
	{
		id: "law",
		label: "Law",
		subtitle: "Legal scholarship, Case law",
		icon: "gavel"
	},
	{
		id: "other",
		label: "Other",
		subtitle: "Cross-field, general use",
		icon: "public"
	}
];
var FAMILY_OPTIONS = [
	{
		id: "author-date",
		label: "Author-Date",
		description: "Author names and years appear in the text",
		exampleText: "According to Smith (2024), the results were significant. Several studies confirm this finding (Jones & Lee, 2023; Chen et al., 2022)."
	},
	{
		id: "numeric",
		label: "Numeric",
		description: "Numbers in brackets refer to a numbered list",
		exampleText: "According to Smith [1], the results were significant. Several studies confirm this finding [2, 3]."
	},
	{
		id: "note",
		label: "Notes",
		description: "Superscript numbers link to footnotes or endnotes",
		exampleText: "According to Smith,¹ the results were significant. Several studies confirm this finding.²"
	}
];
//#endregion
//#region src/lib/utils/wizard-template.ts
var BASE_TEMPLATE_PATH = "bibliography.template";
var TYPE_TEMPLATES_PATH = "bibliography.type-templates";
function getValueAtPath(root, path) {
	return path.split(".").reduce((current, segment) => current?.[segment], root);
}
function getLocalTemplatePath(refType) {
	return `${TYPE_TEMPLATES_PATH}.${refType}`;
}
var APA_BASELINE = [
	{
		contributor: "author",
		form: "long",
		suffix: ".",
		"name-order": "family-first"
	},
	{
		date: "issued",
		form: "year",
		wrap: "parentheses",
		prefix: " "
	},
	{
		title: "primary",
		emph: true,
		prefix: " "
	},
	{
		items: [{
			number: "volume",
			emph: true
		}, {
			number: "issue",
			wrap: "parentheses"
		}],
		delimiter: "",
		prefix: ", "
	},
	{
		number: "pages",
		prefix: ", ",
		suffix: "."
	},
	{
		variable: "doi",
		prefix: " https://doi.org/"
	}
];
function getResolvedTemplateRoot$1(root, refType) {
	const localPath = getLocalTemplatePath(refType);
	const localTemplate = getValueAtPath(root, localPath);
	if (Array.isArray(localTemplate)) return {
		path: localPath,
		scope: "local",
		template: localTemplate
	};
	const baseTemplate = getValueAtPath(root, BASE_TEMPLATE_PATH);
	if (Array.isArray(baseTemplate)) return {
		path: BASE_TEMPLATE_PATH,
		scope: "all",
		template: baseTemplate
	};
	const bib = root.bibliography;
	if (bib && (bib["use-preset"] || bib["from-preset"])) return {
		path: BASE_TEMPLATE_PATH,
		scope: "all",
		template: APA_BASELINE
	};
	return null;
}
function getTemplatePathSuffix(path) {
	if (path === BASE_TEMPLATE_PATH) return "";
	if (path.startsWith(`${BASE_TEMPLATE_PATH}.`)) return path.slice(`${BASE_TEMPLATE_PATH}.`.length);
	const match = path.match(/^bibliography\.type-templates\.[^.]+(?:\.(.*))?$/);
	if (!match) return null;
	return match[1] ?? "";
}
function toScopedTemplatePath(path, refType, scope) {
	const suffix = getTemplatePathSuffix(path);
	if (suffix === null) return null;
	const rootPath = scope === "local" ? getLocalTemplatePath(refType) : BASE_TEMPLATE_PATH;
	return suffix ? `${rootPath}.${suffix}` : rootPath;
}
function getComponentType(component) {
	if (!component) return "unknown";
	if (Array.isArray(component.items)) return "group";
	if (typeof component.contributor === "string") return component.contributor;
	if (typeof component.date === "string") return component.date;
	if (typeof component.title === "string") return component.title === "parent-serial" ? "container-title" : "title";
	if (typeof component.number === "string") return component.number;
	if (typeof component.variable === "string") return component.variable;
	if (typeof component.term === "string") return "term";
	return "unknown";
}
function getComponentLabel(component) {
	if (!component) return "Unknown";
	if (Array.isArray(component.items)) return "Group";
	if (typeof component.contributor === "string") return `Contributor (${component.contributor})`;
	if (typeof component.date === "string") return `Date (${component.date})`;
	if (typeof component.title === "string") return `Title (${component.title})`;
	if (typeof component.number === "string") return `Number (${component.number})`;
	if (typeof component.variable === "string") return `Field (${component.variable})`;
	if (typeof component.term === "string") return `Term (${component.term})`;
	return "Unknown";
}
function cloneBaseTemplateIntoTypeTemplate(root, refType) {
	const baseTemplate = getValueAtPath(root, BASE_TEMPLATE_PATH);
	if (!Array.isArray(baseTemplate)) return null;
	const bibliography = root.bibliography ??= {};
	const typeTemplates = bibliography["type-templates"] ??= {};
	if (!Array.isArray(typeTemplates[refType])) typeTemplates[refType] = JSON.parse(JSON.stringify(baseTemplate));
	return getLocalTemplatePath(refType);
}
//#endregion
//#region src/lib/stores/wizard.svelte.ts
var phase = "quick-start";
var step = 1;
var field = null;
var family = null;
var axisChoices = {};
var presetId = null;
var styleYaml = "";
var styleName = "";
var styleInfo = null;
var selectedComponent = null;
var activeRefType = "article-journal";
var testLocator = "123-125";
var previewHtml = {
	parenthetical: null,
	narrative: null,
	note: null,
	bibliography: null
};
var history = [];
var historyIndex = -1;
var isLoading = false;
var error = null;
function pushHistory() {
	if (!styleYaml) return;
	history = [...history.slice(0, historyIndex + 1), styleYaml];
	historyIndex = history.length - 1;
	if (history.length > 50) {
		history = history.slice(history.length - 50);
		historyIndex = history.length - 1;
	}
}
/** Parse the current YAML into a JS object. Returns null on error. */
function parseStyle() {
	if (!styleYaml) return null;
	try {
		return yaml.load(styleYaml);
	} catch {
		return null;
	}
}
function getTemplateNode(path) {
	const obj = parseStyle();
	if (!obj) return null;
	const node = getValueAtPath(obj, path);
	return node && typeof node === "object" ? node : null;
}
/** Re-serialize a modified style object back to YAML. */
function serializeStyle(obj) {
	return yaml.dump(obj, {
		lineWidth: 120,
		noRefs: true,
		quotingType: "\""
	});
}
/** Update a specific path in the style YAML.
*  path is dot-separated, e.g. "options.contributors.and" or "bibliography.template.0.prefix" */
function updateStyleField(path, value) {
	const obj = parseStyle();
	if (!obj) return;
	pushHistory();
	const parts = path.split(".");
	let current = obj;
	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i];
		const nextPart = parts[i + 1];
		if (!(part in current) || typeof current[part] !== "object" || current[part] === null) current[part] = /^\d+$/.test(nextPart) ? [] : {};
		current = current[part];
	}
	const lastPart = parts[parts.length - 1];
	if (value === void 0) if (Array.isArray(current)) current.splice(parseInt(lastPart), 1);
	else delete current[lastPart];
	else current[lastPart] = value;
	styleYaml = serializeStyle(obj);
}
/** Move a component within a template array. */
function moveComponent(templatePath, fromIndex, toIndex) {
	const obj = parseStyle();
	if (!obj) return;
	const parts = templatePath.split(".");
	let template = obj;
	for (const part of parts) template = template[part];
	if (!Array.isArray(template)) return;
	if (toIndex < 0 || toIndex >= template.length) return;
	pushHistory();
	const [item] = template.splice(fromIndex, 1);
	template.splice(toIndex, 0, item);
	styleYaml = serializeStyle(obj);
}
/** Move a component between two potentially different arrays (e.g. into or out of a group). */
function moveComponentCrossArray(fromPath, fromIndex, toPath, toIndex) {
	if (fromPath === toPath) return moveComponent(fromPath, fromIndex, toIndex);
	const obj = parseStyle();
	if (!obj) return;
	const resolveArray = (path) => {
		const parts = path.split(".");
		let cur = obj;
		for (const part of parts) cur = cur[part];
		return cur;
	};
	const fromArr = resolveArray(fromPath);
	const toArr = resolveArray(toPath);
	if (!Array.isArray(fromArr) || !Array.isArray(toArr)) return;
	pushHistory();
	const [item] = fromArr.splice(fromIndex, 1);
	if (toIndex >= toArr.length) toArr.push(item);
	else toArr.splice(toIndex, 0, item);
	styleYaml = serializeStyle(obj);
}
/** Delete a component from a template array. */
function deleteComponent(templatePath, index) {
	const obj = parseStyle();
	if (!obj) return;
	const parts = templatePath.split(".");
	let template = obj;
	for (const part of parts) template = template[part];
	if (!Array.isArray(template)) return;
	pushHistory();
	template.splice(index, 1);
	styleYaml = serializeStyle(obj);
}
function getResolvedTemplateRoot() {
	const obj = parseStyle();
	if (!obj) return null;
	return getResolvedTemplateRoot$1(obj, activeRefType);
}
/**
* Ensure the current style has a literal template array instead of a shorthand preset.
* This is required before the user can reorder or toggle components.
*/
function materializeCurrentStyle() {
	const obj = parseStyle();
	if (!obj) return;
	const bib = obj.bibliography ??= {};
	if (!(Array.isArray(bib.template) || bib["type-templates"] && Object.keys(bib["type-templates"]).length > 0)) {
		console.log("[Wizard] Materializing shorthand preset into literal template...");
		bib.template = JSON.parse(JSON.stringify(APA_BASELINE));
		delete bib["use-preset"];
		delete bib["from-preset"];
		styleYaml = serializeStyle(obj);
		persist();
		fetchPreview();
	}
}
function ensureBibliographyTypeTemplate() {
	const obj = parseStyle();
	if (!obj) return null;
	const existing = getValueAtPath(obj, getLocalTemplatePath(activeRefType));
	if (Array.isArray(existing)) return getLocalTemplatePath(activeRefType);
	pushHistory();
	const localPath = cloneBaseTemplateIntoTypeTemplate(obj, activeRefType);
	if (!localPath) return null;
	styleYaml = serializeStyle(obj);
	return localPath;
}
function getScopedTemplatePath(path, scope, options = {}) {
	if (scope === "local" && options.ensureLocal) ensureBibliographyTypeTemplate();
	return toScopedTemplatePath(path, activeRefType, scope);
}
function resolvePreviewSelection(componentCssType, astIndex) {
	if (astIndex === null) return null;
	const templateRoot = getResolvedTemplateRoot();
	if (!templateRoot) return null;
	const component = templateRoot.template[astIndex];
	if (!component || typeof component !== "object") return null;
	return {
		componentType: getComponentType(component),
		cssClass: `csln-${componentCssType}`,
		astIndex,
		templatePath: `${templateRoot.path}.${astIndex}`,
		scope: templateRoot.scope
	};
}
/** Get the options block from the style. */
function getOptions() {
	const obj = parseStyle();
	if (!obj) return null;
	return obj["options"] ?? null;
}
/** Fetch preview HTML from the server for the current style YAML. */
async function fetchPreview() {
	if (!styleYaml) return;
	isLoading = true;
	error = null;
	try {
		const res = await fetch("/api/v1/preview", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				citum: styleYaml,
				test_locator: testLocator || void 0,
				inject_ast_indices: true,
				reference_type: activeRefType
			})
		});
		if (!res.ok) throw new Error(`Preview failed: ${res.status}`);
		const data = await res.json();
		previewHtml = {
			parenthetical: data.in_text_parenthetical ?? null,
			narrative: data.in_text_narrative ?? null,
			note: data.note ?? null,
			bibliography: data.bibliography ?? null
		};
	} catch (e) {
		error = e instanceof Error ? e.message : "Preview error";
	} finally {
		isLoading = false;
	}
}
/** Generate base style YAML from intent fields via the server. */
async function generateFromIntent(intentFields) {
	isLoading = true;
	error = null;
	try {
		const intentObj = {
			field,
			class: intentFields["class"] ?? null,
			from_preset: intentFields["from_preset"] ?? null,
			customize_target: null,
			contributor_preset: intentFields["contributor_preset"] ?? null,
			date_preset: intentFields["date_preset"] ?? null,
			title_preset: intentFields["title_preset"] ?? null,
			sort_preset: null,
			bib_template: intentFields["bib_template"] ?? null,
			has_bibliography: intentFields["has_bibliography"] ?? null
		};
		const res = await fetch("/api/v1/generate", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(intentObj)
		});
		if (!res.ok) throw new Error(`Generate failed: ${res.status}`);
		styleYaml = await res.text();
		const parsed = parseStyle();
		if (parsed && parsed.info) {
			styleInfo = parsed.info;
			if (styleInfo.title && !styleName) styleName = styleInfo.title;
		}
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
		fetchPreview();
	}
}
function redo() {
	if (historyIndex < history.length - 1) {
		historyIndex++;
		styleYaml = history[historyIndex];
		fetchPreview();
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
		bibliography: null
	};
	history = [];
	historyIndex = -1;
	error = null;
	try {
		sessionStorage.removeItem("citum-wizard-state");
	} catch {}
}
/** Persist state to sessionStorage. */
function persist() {
	try {
		sessionStorage.setItem("citum-wizard-state", JSON.stringify({
			phase,
			step,
			field,
			family,
			axisChoices,
			presetId,
			styleYaml,
			styleName,
			styleInfo,
			activeRefType
		}));
	} catch {}
}
/** Restore state from sessionStorage. Returns true if state was restored. */
function restore() {
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
var wizardStore = {
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
	setPhase(p) {
		phase = p;
		persist();
	},
	setStep(s) {
		step = s;
		persist();
	},
	setField(f) {
		field = f;
		family = FIELD_DEFAULTS[f];
		persist();
	},
	setFamily(f) {
		family = f;
		persist();
	},
	setAxisChoices(c) {
		axisChoices = {
			...axisChoices,
			...c
		};
		persist();
	},
	setPresetId(id) {
		presetId = id;
		persist();
	},
	setStyleYaml(y) {
		styleYaml = y;
		persist();
	},
	setStyleName(n) {
		styleName = n;
		persist();
	},
	setSelectedComponent(c) {
		selectedComponent = c;
	},
	setActiveRefType(t) {
		activeRefType = t;
		persist();
	},
	setTestLocator(l) {
		testLocator = l;
		fetchPreview();
	},
	updateStyleField,
	moveComponent,
	moveComponentCrossArray,
	deleteComponent,
	getOptions,
	parseStyle,
	serializeStyle,
	getTemplateNode,
	getResolvedTemplateRoot,
	getScopedTemplatePath,
	materializeCurrentStyle,
	ensureBibliographyTypeTemplate,
	resolvePreviewSelection,
	generateFromIntent,
	fetchPreview,
	undo,
	redo,
	reset,
	restore,
	persist
};

export { FAMILY_OPTIONS as F, getComponentType as a, FIELD_DEFAULTS as b, FIELD_OPTIONS as c, getComponentLabel as g, wizardStore as w };
//# sourceMappingURL=wizard.svelte-BZEf1FsW.js.map
