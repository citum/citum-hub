import type { Question, StyleIntent } from "$lib/types/bindings";

export interface PreviewSet {
	in_text_parenthetical: string | null;
	in_text_narrative: string | null;
	note: string | null;
	bibliography: string | null;
}

export interface DecisionChoice {
	label: string;
	html: string;
	choice_value: Partial<StyleIntent>;
	preview_set: PreviewSet;
}

export interface DecisionResult extends PreviewSet {
	missing_fields: string[];
	question: Question | null;
	previews: DecisionChoice[];
}

export type PreviewContext = "default" | "contributors";

export function createEmptyPreviewSet(): PreviewSet {
	return {
		in_text_parenthetical: null,
		in_text_narrative: null,
		note: null,
		bibliography: null,
	};
}

export function hasRenderablePreview(previewSet: PreviewSet | null | undefined): boolean {
	if (!previewSet) return false;
	return Boolean(
		previewSet.in_text_parenthetical ||
		previewSet.in_text_narrative ||
		previewSet.note ||
		previewSet.bibliography
	);
}
