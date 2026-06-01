import { describe, expect, test } from "bun:test";
import { PREVIEW_REFERENCE_SETS } from "../data/preview-fixtures";
import { mapDocumentPreview } from "./document-preview";

describe("document preview mapping", () => {
	test("author-date fixture includes same-author same-year disambiguation occurrences", () => {
		const fixture = PREVIEW_REFERENCE_SETS["author-date"];
		const occurrenceIds = fixture.citations.map((citation) => citation.id);

		expect(occurrenceIds).toContain("author-date-disambiguation-a");
		expect(occurrenceIds).toContain("author-date-disambiguation-b");
		expect(fixture.slots.disambiguation).toBe("author-date-disambiguation-b");
	});

	test("maps formatted citation ids onto existing preview fields", () => {
		const preview = mapDocumentPreview(
			{
				formatted_citations: [
					{ id: "author-date-parenthetical", text: "(Jones & Lee, 2023, p. 103)" },
					{ id: "author-date-narrative", text: "Smith (2024, p. 42)" },
					{ id: "author-date-disambiguation-a", text: "(Doe, 2023a)" },
					{ id: "author-date-disambiguation-b", text: "(Doe, 2023b)" },
				],
				bibliography: { content: "<div>Bibliography</div>" },
			},
			"author-date",
			"bibliography: {}"
		);

		expect(preview).toEqual({
			parenthetical: "(Jones & Lee, 2023, p. 103)",
			narrative: "Smith (2024, p. 42)",
			note: null,
			disambiguation: "(Doe, 2023b)",
			bibliography: "<div>Bibliography</div>",
		});
	});

	test("note previews use the ordered document occurrence selected by the slot", () => {
		const fixture = PREVIEW_REFERENCE_SETS.note;

		expect(fixture.citations.map((citation) => citation.id)).toEqual([
			"note-first",
			"note-subsequent",
			"note-related",
		]);
		expect(fixture.slots.note).toBe("note-subsequent");

		const preview = mapDocumentPreview(
			{
				formatted_citations: {
					"note-first": { text: "Jones, Further Analysis, 103." },
					"note-subsequent": { text: "Jones, Further Analysis, 108." },
					"note-related": { text: "Miller, Chapter, 63." },
				},
				bibliography: { content: "<div>Bibliography</div>" },
			},
			"note",
			"bibliography: {}"
		);

		expect(preview.note).toBe("Jones, Further Analysis, 108.");
		expect(preview.parenthetical).toBeNull();
		expect(preview.narrative).toBeNull();
		expect(preview.bibliography).toBe("<div>Bibliography</div>");
	});
});
