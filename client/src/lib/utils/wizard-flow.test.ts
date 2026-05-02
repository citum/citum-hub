import { describe, expect, test } from "bun:test";
import {
	AXES_BY_FAMILY,
	applyWizardSessionToYaml,
	applyStyleUpdatesToYaml,
	buildWizardMetadata,
	getAxisChoiceUpdates,
	getPreviewHtmlForAxis,
	getPreviewHtmlForFamily,
	getWizardProgress,
	isExactPresetMatch,
	matchPreset,
	normalizeGeneratedStyleForFamily,
	slugifyStyleId,
	validateStyleMetadata,
} from "./wizard-flow";

describe("wizard-flow helpers", () => {
	test("defines branch-specific axis sets", () => {
		expect(AXES_BY_FAMILY["author-date"].map((axis) => axis.id)).toContain("authorConnector");
		expect(AXES_BY_FAMILY.numeric.map((axis) => axis.id)).toContain("numberBracket");
		expect(AXES_BY_FAMILY.note.map((axis) => axis.id)).toContain("hasBibliography");
	});

	test("maps axis choices into style updates", () => {
		expect(getAxisChoiceUpdates("nameForm", "compact")).toEqual([
			{ path: "options.contributors.display-as-sort", value: "all" },
			{ path: "options.contributors.name-form", value: "initials" },
			{ path: "options.contributors.initialize-with", value: "" },
		]);

		expect(getAxisChoiceUpdates("numberBracket", "period")).toEqual([
			{ path: "citation.template.0.wrap", value: "none" },
			{ path: "citation.template.0.suffix", value: "." },
			{ path: "citation.non-integral.template.0.wrap", value: "none" },
			{ path: "citation.non-integral.template.0.suffix", value: "." },
			{ path: "citation.integral.template.1.wrap", value: "none" },
			{ path: "citation.integral.template.1.suffix", value: "." },
		]);

		expect(getAxisChoiceUpdates("citationLocation", "endnote")).toEqual([
			{ path: "options.processing", value: "note" },
			{ path: "custom.wizard_v2.citation_location", value: "endnote" },
		]);
	});

	test("applies nested updates to YAML", () => {
		const input = `version: ''\noptions:\n  contributors:\n    and: symbol\n`;
		const output = applyStyleUpdatesToYaml(input, [
			{ path: "options.contributors.and", value: "text" },
			{ path: "options.contributors.initialize-with", value: ". " },
		]);

		expect(output).toContain("and: text");
		expect(output).toContain('initialize-with: ". "');
	});

	test("matches closest and exact presets from axis choices", () => {
		const choices = {
			nameForm: "family-first-initials" as const,
			articleTitleEmphasis: "italic" as const,
			etAlThreshold: null,
			authorConnector: "symbol" as const,
			locatorLabel: "short" as const,
		};

		expect(matchPreset("author-date", choices)?.presetId).toBe("apa");
		expect(isExactPresetMatch("author-date", choices)).toBe(true);
	});

	test("calculates fixed seven-step progress", () => {
		expect(getWizardProgress("field")).toMatchObject({ current: 1, total: 7 });
		expect(getWizardProgress("customize")).toMatchObject({ current: 6, total: 7 });
		expect(getWizardProgress("advanced")).toMatchObject({ current: 7, total: 7 });
	});

	test("selects family-aware preview html", () => {
		expect(
			getPreviewHtmlForFamily("note", {
				parenthetical: "(Smith 2024)",
				narrative: "Smith (2024)",
				note: "1. Smith, Title.",
				bibliography: "<p>Smith</p>",
			})
		).toBe("1. Smith, Title.");
	});

	test("selects axis-aware preview html", () => {
		const preview = {
			parenthetical: "(Smith 2024)",
			narrative: "Smith (2024)",
			note: "1. Smith, Title.",
			bibliography: "<p>Smith, J. A. Title.</p>",
		};

		expect(getPreviewHtmlForAxis("author-date", "articleTitleEmphasis", preview)).toBe(
			"<p>Smith, J. A. Title.</p>"
		);
		expect(getPreviewHtmlForAxis("numeric", "numberBracket", preview)).toBe("(Smith 2024)");
		expect(getPreviewHtmlForAxis("note", "bookEmphasis", preview)).toBe("1. Smith, Title.");
		expect(getPreviewHtmlForAxis("note", "hasBibliography", preview)).toBe(
			"<p>Smith, J. A. Title.</p>"
		);
		expect(getPreviewHtmlForAxis("note", "footnoteNameForm", preview)).toBe("1. Smith, Title.");
	});

	test("normalizes processing for every family", () => {
		const input = `version: ''\noptions:\n  processing: author-date\ncitation:\n  use-preset: apa\nbibliography:\n  use-preset: apa\n`;

		expect(normalizeGeneratedStyleForFamily(input, "author-date")).toContain(
			"processing: author-date"
		);
		expect(normalizeGeneratedStyleForFamily(input, "author-date")).toContain("version: 0.39.1");
		expect(normalizeGeneratedStyleForFamily(input, "author-date")).toContain("integral:");
		expect(normalizeGeneratedStyleForFamily(input, "numeric")).toContain("processing: numeric");
		expect(normalizeGeneratedStyleForFamily(input, "numeric")).toContain("number: citation-number");
		expect(normalizeGeneratedStyleForFamily(input, "note")).toContain("processing: note");
		expect(normalizeGeneratedStyleForFamily(input, "note")).toContain("non-integral:");
	});

	test("normalizes generated note styles away from author-date-like citations", () => {
		const input = `version: ''\noptions:\n  processing: note\ncitation:\n  template:\n    - contributor: author\n      form: short\n    - date: issued\n      form: year\n      prefix: ' '\n    - variable: locator\n      prefix: ', '\nbibliography:\n  use-preset: apa\n`;
		const output = normalizeGeneratedStyleForFamily(input, "note");

		expect(output).toContain("quote: true");
		expect(output).toContain("title: parent-serial");
		expect(output).toContain("variable: locator");
		expect(output).toContain("integral:");
		expect(output).toContain("use-preset: chicago-author-date");
		expect(output).not.toContain("no. ");
		expect(output).not.toContain("form: short");
	});

	test("validates and writes style metadata into exported YAML", () => {
		expect(slugifyStyleId("My Department Style!")).toBe("my-department-style");
		expect(validateStyleMetadata("Custom Style", "custom-style").nameError).toBeTruthy();
		expect(validateStyleMetadata("Department Style", "Department Style").idError).toBeTruthy();
		expect(validateStyleMetadata("Department Style", "department-style")).toEqual({
			nameError: null,
			idError: null,
		});

		const output = applyWizardSessionToYaml(`version: ''\ninfo:\n  title: Custom Style\n`, {
			name: "Department Style",
			id: "department-style",
			field: "humanities",
			family: "note",
			axisChoices: { citationLocation: "footnote" },
			presetId: "chicago-notes",
		});

		expect(output).toContain("title: Department Style");
		expect(output).toContain("version: 0.39.1");
		expect(output).toContain("id: department-style");
		expect(output).toContain("wizard_v2:");
		expect(output).toContain("citation_location: footnote");
		expect(output).toContain("citationLocation: footnote");
	});

	test("stores v2 metadata under the existing intent payload", () => {
		expect(
			buildWizardMetadata({
				field: "humanities",
				family: "note",
				axisChoices: { hasBibliography: true },
				presetId: "chicago-notes",
			})
		).toEqual({
			wizard_v2: {
				version: 1,
				field: "humanities",
				family: "note",
				axis_choices: { hasBibliography: true },
				preset_id: "chicago-notes",
				citation_location: "footnote",
			},
		});
	});
});
