import type { CitationClass, StyleIntent } from "$lib/types/bindings";
import type { DecisionResult, PreviewSet } from "$lib/types/decision";
import type { StyleFamily } from "$lib/types/wizard";

export type CreateMode = "find" | "tweak" | "build";
export type BuildStage = "citation" | "bibliography" | "advanced";

export interface BuildProgress {
	currentStep: number;
	totalSteps: number;
	stage: BuildStage;
	stageLabel: string;
	stepLabel: string;
	percentage: number;
	widthClass: string;
}

export interface BuildPreviewPanel {
	key: "parenthetical" | "narrative" | "note" | "bibliography";
	label: string;
	html: string;
}

export interface HoverPreviewState {
	intent: StyleIntent;
	label: string;
	previewSet: PreviewSet;
}

const PRESET_LABELS: Record<string, string> = {
	apa: "APA",
	chicago_ad: "Chicago Author-Date",
	harvard: "Harvard",
	vancouver: "Vancouver",
	ieee: "IEEE",
	chicago_notes: "Chicago Notes",
	turabian: "Turabian",
};

const FIELD_LABELS: Record<string, string> = {
	humanities: "Humanities",
	social_science: "Social Science",
	sciences: "Sciences",
};

const CITATION_CLASS_LABELS: Record<CitationClass, string> = {
	author_date: "Author-date",
	footnote: "Footnote",
	endnote: "Endnote",
	numeric: "Numeric",
	label: "Labeled",
};

export function createEmptyIntent(): StyleIntent {
	return {
		field: null,
		class: null,
		from_preset: null,
		customize_target: null,
		contributor_preset: null,
		role_preset: null,
		date_preset: null,
		title_preset: null,
		sort_preset: null,
		bib_template: null,
		has_bibliography: null,
	};
}

export function familyToCitationClass(family: StyleFamily | null): CitationClass | null {
	switch (family) {
		case "author-date":
			return "author_date";
		case "numeric":
			return "numeric";
		case "note":
			return "footnote";
		default:
			return null;
	}
}

export function citationClassToFamily(citationClass: CitationClass | null): StyleFamily | null {
	switch (citationClass) {
		case "author_date":
			return "author-date";
		case "numeric":
			return "numeric";
		case "footnote":
		case "endnote":
			return "note";
		default:
			return null;
	}
}

export function isNoteCitationClass(citationClass: CitationClass | null): boolean {
	return citationClass === "footnote" || citationClass === "endnote";
}

function needsExplicitClassStep(intent: StyleIntent): boolean {
	return intent.field !== "social_science";
}

function getBuildStepOrder(intent: StyleIntent, decision: DecisionResult | null): string[] {
	const steps = ["field"];

	if (needsExplicitClassStep(intent) || decision?.question?.id === "class") {
		steps.push("class");
	}

	steps.push("preset");

	if (
		isNoteCitationClass(intent.class) ||
		decision?.question?.id === "has_bibliography" ||
		decision?.question?.id === "bib_template"
	) {
		steps.push("has_bibliography");
	}

	if (
		!intent.from_preset &&
		(intent.has_bibliography === true || decision?.question?.id === "bib_template")
	) {
		steps.push("bib_template");
	}

	if (decision?.question?.id === "customize_target" || intent.customize_target === "menu") {
		steps.push("customize_target");
	}

	return steps;
}

export function resolveBuildStage(
	intent: StyleIntent,
	decision: DecisionResult | null
): BuildStage {
	const questionId = decision?.question?.id;

	if (questionId === "customize_target" || intent.customize_target === "menu") {
		return "advanced";
	}

	if (
		questionId === "has_bibliography" ||
		questionId === "bib_template" ||
		(isNoteCitationClass(intent.class) && intent.has_bibliography !== null && !questionId)
	) {
		return "bibliography";
	}

	return "citation";
}

export function getBuildProgress(
	intent: StyleIntent,
	decision: DecisionResult | null
): BuildProgress {
	const order = getBuildStepOrder(intent, decision);
	const stage = resolveBuildStage(intent, decision);
	const stageLabel =
		stage === "citation"
			? "Citation refinement"
			: stage === "bibliography"
				? "Bibliography decisions"
				: "Advanced refinement";

	const questionId = decision?.question?.id;
	const questionIndex = questionId ? order.indexOf(questionId) : -1;
	const currentStep = questionId
		? questionIndex >= 0
			? questionIndex + 1
			: order.length
		: order.length;
	const stepLabel = questionId
		? questionId === "field"
			? "Choose a field"
			: questionId === "class"
				? "Choose a citation class"
				: questionId === "preset"
					? "Choose the closest pattern"
					: questionId === "has_bibliography"
						? "Decide whether notes need a bibliography"
						: questionId === "bib_template"
							? "Choose the bibliography layout"
							: questionId === "customize_target"
								? "Pick an advanced area to refine"
								: "Continue refining"
		: "Draft ready";
	const percentage = Math.round((currentStep / Math.max(order.length, 1)) * 100);
	const widthClass = getProgressWidthClass(currentStep, Math.max(order.length, 1));

	return {
		currentStep,
		totalSteps: Math.max(order.length, 1),
		stage,
		stageLabel,
		stepLabel,
		percentage,
		widthClass,
	};
}

function getProgressWidthClass(currentStep: number, totalSteps: number): string {
	if (currentStep >= totalSteps) return "w-full";

	if (totalSteps === 2) {
		return currentStep === 1 ? "w-1/2" : "w-full";
	}

	if (totalSteps === 3) {
		return currentStep === 1 ? "w-1/3" : currentStep === 2 ? "w-2/3" : "w-full";
	}

	if (totalSteps === 4) {
		return currentStep === 1
			? "w-1/4"
			: currentStep === 2
				? "w-1/2"
				: currentStep === 3
					? "w-3/4"
					: "w-full";
	}

	if (totalSteps === 5) {
		return currentStep === 1
			? "w-1/5"
			: currentStep === 2
				? "w-2/5"
				: currentStep === 3
					? "w-3/5"
					: currentStep === 4
						? "w-4/5"
						: "w-full";
	}

	return "w-full";
}

export function getBuildPreviewPanels(
	intent: StyleIntent,
	previewSet: PreviewSet | null
): BuildPreviewPanel[] {
	if (!previewSet) return [];

	const panels: BuildPreviewPanel[] = [];

	if (isNoteCitationClass(intent.class)) {
		if (previewSet.note) {
			panels.push({ key: "note", label: "Note", html: previewSet.note });
		}
		if (previewSet.bibliography) {
			panels.push({ key: "bibliography", label: "Bibliography", html: previewSet.bibliography });
		}
		return panels;
	}

	if (intent.class === "numeric" || intent.class === "label") {
		if (previewSet.in_text_parenthetical) {
			panels.push({
				key: "parenthetical",
				label: "Citation",
				html: previewSet.in_text_parenthetical,
			});
		}
		if (previewSet.bibliography) {
			panels.push({ key: "bibliography", label: "Bibliography", html: previewSet.bibliography });
		}
		return panels;
	}

	if (previewSet.in_text_parenthetical) {
		panels.push({
			key: "parenthetical",
			label: "Parenthetical",
			html: previewSet.in_text_parenthetical,
		});
	}
	if (previewSet.in_text_narrative) {
		panels.push({ key: "narrative", label: "Narrative", html: previewSet.in_text_narrative });
	}
	if (previewSet.bibliography) {
		panels.push({ key: "bibliography", label: "Bibliography", html: previewSet.bibliography });
	}

	return panels;
}

export function getDecisionPreviewSet(decision: DecisionResult | null): PreviewSet | null {
	if (!decision) return null;
	return {
		in_text_parenthetical: decision.in_text_parenthetical,
		in_text_narrative: decision.in_text_narrative,
		note: decision.note,
		bibliography: decision.bibliography,
	};
}

export function getChoicePreviewHtml(intent: StyleIntent, previewSet: PreviewSet): string {
	if (isNoteCitationClass(intent.class)) {
		return previewSet.note ?? previewSet.bibliography ?? "";
	}

	if (intent.class === "numeric" || intent.class === "label") {
		return previewSet.in_text_parenthetical ?? previewSet.bibliography ?? "";
	}

	return previewSet.in_text_parenthetical ?? previewSet.bibliography ?? "";
}

export function getFieldLabel(field: string | null): string {
	if (!field) return "Not chosen yet";
	return FIELD_LABELS[field] ?? field.replace(/_/g, " ");
}

export function getCitationClassLabel(citationClass: CitationClass | null): string {
	if (!citationClass) return "Not chosen yet";
	return CITATION_CLASS_LABELS[citationClass] ?? citationClass.replace(/_/g, " ");
}

export function suggestBuildStyleName(intent: StyleIntent): string {
	const presetName = intent.from_preset ? PRESET_LABELS[intent.from_preset] : null;
	if (presetName) {
		return `${presetName} Custom`;
	}

	const fieldName = intent.field ? (FIELD_LABELS[intent.field] ?? intent.field) : null;
	const familyName = citationClassToFamily(intent.class);

	if (fieldName && familyName) {
		return `${fieldName} ${familyName} Style`;
	}

	if (familyName) {
		return `${familyName} Style`;
	}

	return "Custom Style";
}

export function sanitizeStyleFilename(name: string): string {
	const slug = name
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

	return `${slug || "custom-style"}.yaml`;
}
