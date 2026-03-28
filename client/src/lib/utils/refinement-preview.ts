import type { StyleFamily } from "$lib/types/wizard";

export interface WizardPreviewHtml {
	parenthetical: string | null;
	narrative: string | null;
	note: string | null;
	bibliography: string | null;
}

export interface RefinementPreviewPanel {
	key: "parenthetical" | "narrative" | "note" | "bibliography";
	label: string;
	html: string;
}

export function getRefinementPreviewPanels(
	family: StyleFamily | null,
	previewHtml: WizardPreviewHtml,
	activeHighlight: string | null
): RefinementPreviewPanel[] {
	const panels: RefinementPreviewPanel[] = [];
	const isRoleFocused = activeHighlight === "contributors" || activeHighlight === "roles";

	if (isRoleFocused) {
		if (family === "note") {
			if (previewHtml.note) {
				panels.push({ key: "note", label: "Note", html: previewHtml.note });
			} else if (previewHtml.bibliography) {
				panels.push({ key: "bibliography", label: "Bibliography", html: previewHtml.bibliography });
			}
			return panels;
		}

		if (previewHtml.bibliography) {
			panels.push({ key: "bibliography", label: "Bibliography", html: previewHtml.bibliography });
		}
		return panels;
	}

	if (family === "note") {
		if (previewHtml.note) {
			panels.push({ key: "note", label: "Note", html: previewHtml.note });
		}
		if (previewHtml.bibliography) {
			panels.push({ key: "bibliography", label: "Bibliography", html: previewHtml.bibliography });
		}
		return panels;
	}

	if (family === "numeric") {
		if (previewHtml.parenthetical) {
			panels.push({ key: "parenthetical", label: "Citation", html: previewHtml.parenthetical });
		}
		if (previewHtml.bibliography) {
			panels.push({ key: "bibliography", label: "Bibliography", html: previewHtml.bibliography });
		}
		return panels;
	}

	if (previewHtml.parenthetical) {
		panels.push({
			key: "parenthetical",
			label: "Parenthetical Citation",
			html: previewHtml.parenthetical,
		});
	}
	if (previewHtml.narrative) {
		panels.push({ key: "narrative", label: "Narrative Citation", html: previewHtml.narrative });
	}
	if (previewHtml.bibliography) {
		panels.push({ key: "bibliography", label: "Bibliography", html: previewHtml.bibliography });
	}

	return panels;
}
