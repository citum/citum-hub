import { describe, expect, test } from "bun:test";

import { resolveWizardBranch, shouldShowBibliographyPreview } from "./wizard";

describe("resolveWizardBranch", () => {
	test("maps social sciences to author-date", () => {
		expect(resolveWizardBranch("social-sciences", "author-date")).toBe("author-date");
	});

	test("maps sciences to numeric", () => {
		expect(resolveWizardBranch("sciences", "numeric")).toBe("numeric");
	});

	test("maps humanities notes to note-humanities", () => {
		expect(resolveWizardBranch("humanities", "note")).toBe("note-humanities");
	});

	test("maps law notes to note-law", () => {
		expect(resolveWizardBranch("law", "note")).toBe("note-law");
	});
});

describe("shouldShowBibliographyPreview", () => {
	test("always shows bibliography for author-date and numeric", () => {
		expect(shouldShowBibliographyPreview("author-date", false)).toBe(true);
		expect(shouldShowBibliographyPreview("numeric", false)).toBe(true);
	});

	test("respects note bibliography toggles", () => {
		expect(shouldShowBibliographyPreview("note-humanities", true)).toBe(true);
		expect(shouldShowBibliographyPreview("note-humanities", false)).toBe(false);
		expect(shouldShowBibliographyPreview("note-law", true)).toBe(true);
		expect(shouldShowBibliographyPreview("note-law", false)).toBe(false);
	});
});
