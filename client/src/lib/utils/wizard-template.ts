/* eslint-disable @typescript-eslint/no-explicit-any */

export type TemplateScope = "all" | "local";

export interface TemplateRoot {
	path: string;
	scope: TemplateScope;
	template: any[];
}

const BASE_TEMPLATE_PATH = "bibliography.template";
const TYPE_TEMPLATES_PATH = "bibliography.type-templates";

export function getValueAtPath(root: Record<string, unknown>, path: string): any {
	return path.split(".").reduce<any>((current, segment) => current?.[segment], root);
}

export function getBaseTemplatePath(): string {
	return BASE_TEMPLATE_PATH;
}

export function getLocalTemplatePath(refType: string): string {
	return `${TYPE_TEMPLATES_PATH}.${refType}`;
}

export const APA_BASELINE = [
	{
		contributor: "author",
		form: "long",
		suffix: ".",
		"name-order": "family-first",
		substitute: {
			template: ["editor", "title", "translator"],
		},
	},
	{
		contributor: "translator",
		form: "long",
		prefix: " (",
		suffix: ")",
	},
	{ date: "issued", form: "year", wrap: "parentheses", prefix: " " },
	{ title: "primary", emph: true, prefix: " " },
	{
		items: [
			{ number: "volume", emph: true },
			{ number: "issue", wrap: "parentheses" },
		],
		delimiter: "",
		prefix: ", ",
	},
	{ number: "pages", prefix: ", ", suffix: "." },
	{ variable: "doi", prefix: " https://doi.org/" },
];

export function getResolvedTemplateRoot(
	root: Record<string, unknown>,
	refType: string
): TemplateRoot | null {
	const localPath = getLocalTemplatePath(refType);
	const localTemplate = getValueAtPath(root, localPath);
	if (Array.isArray(localTemplate)) {
		return { path: localPath, scope: "local", template: localTemplate };
	}

	const baseTemplate = getValueAtPath(root, BASE_TEMPLATE_PATH);
	if (Array.isArray(baseTemplate)) {
		return { path: BASE_TEMPLATE_PATH, scope: "all", template: baseTemplate };
	}

	// NEW: If we have a preset but no template, use the hardcoded baseline
	const bib = root.bibliography as Record<string, any>;
	if (bib && (bib["use-preset"] || bib["from-preset"])) {
		return { path: BASE_TEMPLATE_PATH, scope: "all", template: APA_BASELINE };
	}

	return null;
}

export function getTemplatePathSuffix(path: string): string | null {
	if (path === BASE_TEMPLATE_PATH) return "";
	if (path.startsWith(`${BASE_TEMPLATE_PATH}.`)) {
		return path.slice(`${BASE_TEMPLATE_PATH}.`.length);
	}

	const match = path.match(/^bibliography\.type-templates\.[^.]+(?:\.(.*))?$/);
	if (!match) return null;
	return match[1] ?? "";
}

export function toScopedTemplatePath(
	path: string,
	refType: string,
	scope: TemplateScope
): string | null {
	const suffix = getTemplatePathSuffix(path);
	if (suffix === null) return null;

	const rootPath = scope === "local" ? getLocalTemplatePath(refType) : BASE_TEMPLATE_PATH;
	return suffix ? `${rootPath}.${suffix}` : rootPath;
}

export function getAstIndexFromTemplatePath(path: string): number | null {
	const suffix = getTemplatePathSuffix(path);
	if (suffix === null || !suffix) return null;

	const firstSegment = suffix.split(".")[0];
	const astIndex = Number.parseInt(firstSegment, 10);
	return Number.isNaN(astIndex) ? null : astIndex;
}

export function getComponentType(component: Record<string, unknown> | null | undefined): string {
	if (!component) return "unknown";
	if (Array.isArray(component.items)) return "group";

	if (typeof component.contributor === "string") return component.contributor;
	if (typeof component.date === "string") return component.date;
	if (typeof component.title === "string") {
		return component.title === "parent-serial" ? "container-title" : "title";
	}
	if (typeof component.number === "string") return component.number;
	if (typeof component.variable === "string") return component.variable;
	if (typeof component.term === "string") return "term";

	return "unknown";
}

export function getComponentLabel(component: Record<string, unknown> | null | undefined): string {
	if (!component) return "Unknown";
	if (Array.isArray(component.items)) return "Group";

	if (typeof component.contributor === "string") {
		return `Contributor (${component.contributor})`;
	}
	if (typeof component.date === "string") {
		return `Date (${component.date})`;
	}
	if (typeof component.title === "string") {
		return `Title (${component.title})`;
	}
	if (typeof component.number === "string") {
		return `Number (${component.number})`;
	}
	if (typeof component.variable === "string") {
		return `Field (${component.variable})`;
	}
	if (typeof component.term === "string") {
		return `Term (${component.term})`;
	}

	return "Unknown";
}

export function cloneBaseTemplateIntoTypeTemplate(
	root: Record<string, unknown>,
	refType: string
): string | null {
	const baseTemplate = getValueAtPath(root, BASE_TEMPLATE_PATH);
	if (!Array.isArray(baseTemplate)) return null;

	const bibliography = (root.bibliography ??= {}) as Record<string, unknown>;
	const typeTemplates = ((bibliography["type-templates"] as Record<string, unknown> | undefined) ??=
		{});

	if (!Array.isArray(typeTemplates[refType])) {
		typeTemplates[refType] = JSON.parse(JSON.stringify(baseTemplate));
	}

	return getLocalTemplatePath(refType);
}
