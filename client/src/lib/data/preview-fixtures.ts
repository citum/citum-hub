import type { PreviewReferenceSet, StyleFamily } from "$lib/types/wizard";

const sharedReferences = {
	smith2024: {
		id: "smith2024",
		class: "monograph",
		type: "book",
		title: "The Study of Things",
		author: [{ family: "Smith", given: "John A." }],
		issued: "2024",
		publisher: "Example Press",
		"publisher-place": "New York",
	},
	jones2023: {
		id: "jones2023",
		class: "serial-component",
		type: "article-journal",
		title: "Further Analysis of Evidence",
		author: [
			{ family: "Jones", given: "Betty C." },
			{ family: "Lee", given: "Samuel" },
		],
		issued: "2023-05-12",
		"container-title": "Journal of Examples",
		volume: "15",
		issue: "2",
		page: "100-115",
		DOI: "10.1234/example",
	},
	chen2022: {
		id: "chen2022",
		class: "serial-component",
		type: "article-journal",
		title: "Collaborative Research Methods",
		author: [
			{ family: "Chen", given: "Li" },
			{ family: "Kim", given: "Sora" },
			{ family: "Park", given: "Ji" },
			{ family: "Patel", given: "Mina" },
		],
		issued: "2022",
		"container-title": "Research Quarterly",
		volume: "8",
		issue: "1",
		page: "12-30",
	},
	doeArticle2023: {
		id: "doeArticle2023",
		class: "serial-component",
		type: "article-journal",
		title: "First Same-Year Study",
		author: [{ family: "Doe", given: "Jane" }],
		issued: "2023",
		"container-title": "Disambiguation Review",
		volume: "4",
		issue: "1",
		page: "1-14",
	},
	doeBook2023: {
		id: "doeBook2023",
		class: "monograph",
		type: "book",
		title: "Second Same-Year Study",
		author: [{ family: "Doe", given: "Jane" }],
		issued: "2023",
		publisher: "Disambiguation Press",
	},
	edited2021: {
		id: "edited2021",
		class: "collection-component",
		type: "chapter",
		title: "A Chapter About Sources",
		author: [{ family: "Miller", given: "Ada" }],
		editor: [{ family: "Garcia", given: "Elena" }],
		issued: "2021",
		"container-title": "Handbook of Citation Studies",
		publisher: "Scholarly House",
		page: "55-72",
	},
	web2025: {
		id: "web2025",
		class: "monograph",
		type: "webpage",
		title: "Digital Archive Guide",
		author: [{ name: "Open Archives Group" }],
		issued: "2025-03-03",
		accessed: "2026-04-30",
		URL: "https://example.org/archive-guide",
	},
};

export const PREVIEW_REFERENCE_SETS: Record<StyleFamily, PreviewReferenceSet> = {
	"author-date": {
		id: "author-date",
		references: sharedReferences,
		citations: [
			{
				id: "author-date-parenthetical",
				items: [{ id: "jones2023", locator: { label: "page", value: "103" } }, { id: "chen2022" }],
				mode: "non-integral",
			},
			{
				id: "author-date-narrative",
				items: [{ id: "smith2024", locator: { label: "page", value: "42" } }],
				mode: "integral",
			},
			{
				id: "author-date-disambiguation-a",
				items: [{ id: "doeArticle2023" }],
				mode: "non-integral",
			},
			{
				id: "author-date-disambiguation-b",
				items: [{ id: "doeBook2023" }],
				mode: "non-integral",
			},
		],
		slots: {
			parenthetical: "author-date-parenthetical",
			narrative: "author-date-narrative",
			disambiguation: "author-date-disambiguation-b",
		},
	},
	numeric: {
		id: "numeric",
		references: sharedReferences,
		citations: [
			{
				id: "numeric-parenthetical",
				items: [{ id: "jones2023", locator: { label: "page", value: "103" } }, { id: "chen2022" }],
				mode: "non-integral",
			},
			{
				id: "numeric-narrative",
				items: [{ id: "smith2024", locator: { label: "page", value: "42" } }],
				mode: "integral",
			},
		],
		slots: {
			parenthetical: "numeric-parenthetical",
			narrative: "numeric-narrative",
		},
	},
	note: {
		id: "note",
		references: sharedReferences,
		citations: [
			{
				id: "note-first",
				items: [{ id: "jones2023", locator: { label: "page", value: "103" } }],
				mode: "non-integral",
				note_number: 1,
			},
			{
				id: "note-subsequent",
				items: [{ id: "jones2023", locator: { label: "page", value: "108" } }],
				mode: "non-integral",
				note_number: 2,
			},
			{
				id: "note-related",
				items: [{ id: "edited2021", locator: { label: "page", value: "63" } }],
				mode: "non-integral",
				note_number: 3,
			},
		],
		slots: {
			note: "note-subsequent",
		},
	},
};
