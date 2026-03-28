import { describe, expect, test } from "bun:test";
import {
	getCitationClassLabel,
	getChoicePreviewHtml,
	getBuildPreviewPanels,
	getBuildProgress,
	getFieldLabel,
	isNoteCitationClass,
	resolveBuildStage,
	sanitizeStyleFilename,
	suggestBuildStyleName,
	citationClassToFamily,
	createEmptyIntent,
	familyToCitationClass,
} from "./create-flow";

describe("create-flow helpers", () => {
	test("builds an empty style intent with all fields unset", () => {
		expect(createEmptyIntent()).toEqual({
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
		});
	});

	test("maps style families to intent-engine citation classes", () => {
		expect(familyToCitationClass("author-date")).toBe("author_date");
		expect(familyToCitationClass("numeric")).toBe("numeric");
		expect(familyToCitationClass("note")).toBe("footnote");
	});

	test("maps citation classes back to build families", () => {
		expect(citationClassToFamily("author_date")).toBe("author-date");
		expect(citationClassToFamily("numeric")).toBe("numeric");
		expect(citationClassToFamily("footnote")).toBe("note");
		expect(citationClassToFamily("endnote")).toBe("note");
	});

	test("identifies note-based citation classes", () => {
		expect(isNoteCitationClass("footnote")).toBe(true);
		expect(isNoteCitationClass("endnote")).toBe(true);
		expect(isNoteCitationClass("numeric")).toBe(false);
	});

	test("resolves bibliography stage for note bibliography questions", () => {
		const intent = { ...createEmptyIntent(), field: "humanities", class: "footnote" as const };
		expect(
			resolveBuildStage(intent, {
				missing_fields: ["has_bibliography"],
				question: { id: "has_bibliography", text: "", description: null },
				previews: [],
				in_text_parenthetical: null,
				in_text_narrative: null,
				note: null,
				bibliography: null,
			})
		).toBe("bibliography");
	});

	test("calculates progress for social science preset selection without class step", () => {
		const intent = { ...createEmptyIntent(), field: "social_science" };
		expect(
			getBuildProgress(intent, {
				missing_fields: ["preset"],
				question: { id: "preset", text: "", description: null },
				previews: [],
				in_text_parenthetical: null,
				in_text_narrative: null,
				note: null,
				bibliography: null,
			})
		).toMatchObject({
			currentStep: 2,
			totalSteps: 2,
			stage: "citation",
		});
	});

	test("keeps advanced customization progress on the final step", () => {
		const intent = {
			...createEmptyIntent(),
			field: "humanities",
			class: "author_date" as const,
			from_preset: "apa",
			customize_target: "menu",
		};

		expect(
			getBuildProgress(intent, {
				missing_fields: ["customize_target"],
				question: { id: "customize_target", text: "", description: null },
				previews: [],
				in_text_parenthetical: null,
				in_text_narrative: null,
				note: null,
				bibliography: null,
			})
		).toMatchObject({
			currentStep: 4,
			totalSteps: 4,
			stage: "advanced",
			stepLabel: "Pick an advanced area to refine",
		});
	});

	test("falls back to the final known step for unknown future questions", () => {
		const intent = {
			...createEmptyIntent(),
			field: "humanities",
			class: "author_date" as const,
			from_preset: "apa",
		};

		expect(
			getBuildProgress(intent, {
				missing_fields: ["title_preset"],
				question: { id: "title_preset", text: "", description: null },
				previews: [],
				in_text_parenthetical: null,
				in_text_narrative: null,
				note: null,
				bibliography: null,
			})
		).toMatchObject({
			currentStep: 3,
			totalSteps: 3,
			stepLabel: "Continue refining",
		});
	});

	test("selects numeric preview panels without narrative output", () => {
		const panels = getBuildPreviewPanels(
			{ ...createEmptyIntent(), class: "numeric" },
			{
				in_text_parenthetical: "[1]",
				in_text_narrative: "unused",
				note: null,
				bibliography: "<p>Ref</p>",
			}
		);

		expect(panels).toEqual([
			{ key: "parenthetical", label: "Citation", html: "[1]" },
			{ key: "bibliography", label: "Bibliography", html: "<p>Ref</p>" },
		]);
	});

	test("uses note output for note-style choice cards", () => {
		expect(
			getChoicePreviewHtml(
				{ ...createEmptyIntent(), class: "footnote" },
				{
					in_text_parenthetical: null,
					in_text_narrative: null,
					note: "<p>Edited by Smith</p>",
					bibliography: "<p>Bib</p>",
				}
			)
		).toBe("<p>Edited by Smith</p>");
	});

	test("formats user-facing build state labels", () => {
		expect(getFieldLabel("social_science")).toBe("Social Science");
		expect(getCitationClassLabel("author_date")).toBe("Author-date");
		expect(getCitationClassLabel(null)).toBe("Not chosen yet");
	});

	test("suggests a preset-based style name when available", () => {
		expect(
			suggestBuildStyleName({
				...createEmptyIntent(),
				from_preset: "apa",
				class: "author_date",
			})
		).toBe("APA Custom");
	});

	test("sanitizes a build name into a yaml filename", () => {
		expect(sanitizeStyleFilename("My APA Style 2026")).toBe("my-apa-style-2026.yaml");
		expect(sanitizeStyleFilename("")).toBe("custom-style.yaml");
	});
});
