import type { PreviewReferenceSet, StyleFamily } from "$lib/types/wizard";

const sharedReferences = {
	smith2024: {
		id: "smith2024",
		type: "book",
		title: "The Study of Things",
		author: [{ family: "Smith", given: "John A." }],
		issued: { "date-parts": [[2024]] },
		publisher: "Example Press",
		"publisher-place": "New York",
	},
	jones2023: {
		id: "jones2023",
		type: "article-journal",
		title: "Further Analysis of Evidence",
		author: [
			{ family: "Jones", given: "Betty C." },
			{ family: "Lee", given: "Samuel" },
		],
		issued: { "date-parts": [[2023, 5, 12]] },
		"container-title": "Journal of Examples",
		volume: "15",
		issue: "2",
		page: "100-115",
		DOI: "10.1234/example",
	},
	chen2022: {
		id: "chen2022",
		type: "article-journal",
		title: "Collaborative Research Methods",
		author: [
			{ family: "Chen", given: "Li" },
			{ family: "Kim", given: "Sora" },
			{ family: "Park", given: "Ji" },
			{ family: "Patel", given: "Mina" },
		],
		issued: { "date-parts": [[2022]] },
		"container-title": "Research Quarterly",
		volume: "8",
		issue: "1",
		page: "12-30",
	},
	edited2021: {
		id: "edited2021",
		type: "chapter",
		title: "A Chapter About Sources",
		author: [{ family: "Miller", given: "Ada" }],
		editor: [{ family: "Garcia", given: "Elena" }],
		issued: { "date-parts": [[2021]] },
		"container-title": "Handbook of Citation Studies",
		publisher: "Scholarly House",
		page: "55-72",
	},
	web2025: {
		id: "web2025",
		type: "webpage",
		title: "Digital Archive Guide",
		author: [{ literal: "Open Archives Group" }],
		issued: { "date-parts": [[2025, 3, 3]] },
		accessed: { "date-parts": [[2026, 4, 30]] },
		URL: "https://example.org/archive-guide",
	},
};

export const PREVIEW_REFERENCE_SETS: Record<StyleFamily, PreviewReferenceSet> = {
	"author-date": {
		id: "author-date",
		references: sharedReferences,
		citations: {
			parenthetical: {
				items: [{ id: "jones2023", locator: { label: "page", value: "103" } }, { id: "chen2022" }],
				mode: "non-integral",
			},
			narrative: {
				items: [{ id: "smith2024", locator: { label: "page", value: "42" } }],
				mode: "integral",
			},
		},
	},
	numeric: {
		id: "numeric",
		references: sharedReferences,
		citations: {
			parenthetical: {
				items: [{ id: "jones2023", locator: { label: "page", value: "103" } }, { id: "chen2022" }],
				mode: "non-integral",
			},
			narrative: {
				items: [{ id: "smith2024", locator: { label: "page", value: "42" } }],
				mode: "integral",
			},
		},
	},
	note: {
		id: "note",
		references: sharedReferences,
		citations: {
			parenthetical: {
				items: [{ id: "jones2023", locator: { label: "page", value: "103" } }],
				mode: "non-integral",
			},
			narrative: {
				items: [{ id: "edited2021", locator: { label: "page", value: "63" } }],
				mode: "integral",
			},
		},
	},
};
