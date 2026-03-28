import { describe, expect, test } from "bun:test";

import { getRefinementPreviewPanels } from "./refinement-preview";

describe("refinement preview panels", () => {
	const previewHtml = {
		parenthetical: "(Smith 2024)",
		narrative: "Smith (2024)",
		note: "1. Smith, edited by Jones.",
		bibliography: "<p>Jones, ed.</p>",
	};

	test("shows bibliography only for contributor-role focus in non-note styles", () => {
		expect(getRefinementPreviewPanels("author-date", previewHtml, "roles")).toEqual([
			{ key: "bibliography", label: "Bibliography", html: "<p>Jones, ed.</p>" },
		]);
	});

	test("shows note preview for contributor-role focus in note styles", () => {
		expect(getRefinementPreviewPanels("note", previewHtml, "roles")).toEqual([
			{ key: "note", label: "Note", html: "1. Smith, edited by Jones." },
		]);
	});

	test("preserves family-based panels outside role-focused preview", () => {
		expect(getRefinementPreviewPanels("author-date", previewHtml, null)).toEqual([
			{ key: "parenthetical", label: "Parenthetical Citation", html: "(Smith 2024)" },
			{ key: "narrative", label: "Narrative Citation", html: "Smith (2024)" },
			{ key: "bibliography", label: "Bibliography", html: "<p>Jones, ed.</p>" },
		]);
	});
});
