export interface WizardStyleUpdate {
	path: string;
	value: unknown;
}

export function getLocatorLabelUpdates(form: string): WizardStyleUpdate[] {
	return [{ path: "options.locators.default-label-form", value: form }];
}

export function getRolePresetUpdates(preset: string): WizardStyleUpdate[] {
	return [{ path: "options.contributors.role.preset", value: preset }];
}

export function getArticleTitleStyleUpdates(
	style: "plain" | "quoted" | "italic"
): WizardStyleUpdate[] {
	return [
		{ path: "options.titles.component.quote", value: style === "quoted" },
		{ path: "options.titles.component.emph", value: style === "italic" },
	];
}

export function getCitationNumberUpdates(
	style: "square" | "period" | "paren" | "superscript"
): WizardStyleUpdate[] {
	const wrap = style === "square" ? "brackets" : style === "paren" ? "parentheses" : "none";

	return [
		{ path: "citation.template.0.wrap", value: wrap },
		{ path: "citation.template.0.suffix", value: style === "period" ? "." : undefined },
	];
}
