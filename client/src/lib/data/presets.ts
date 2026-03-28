import type { PresetInfo, StyleFamily, WizardBranch } from "$lib/types/wizard";

/** Preset metadata for the gallery. Each entry maps to intent-engine fields. */
export const PRESETS: PresetInfo[] = [
	// Author-Date
	{
		id: "apa",
		name: "APA",
		family: "author-date",
		intentFields: {
			from_preset: "apa",
			class: "author_date",
			contributor_preset: "apa",
			role_preset: "short-suffix",
			date_preset: "year",
			title_preset: "apa",
			bib_template: "apa",
		},
		traits: "Year in parentheses after author, italic journal, ampersand",
	},
	{
		id: "chicago-ad",
		name: "Chicago Author-Date",
		family: "author-date",
		intentFields: {
			from_preset: "chicago_ad",
			class: "author_date",
			contributor_preset: "chicago",
			role_preset: "verb-prefix",
			date_preset: "year",
			title_preset: "chicago",
			bib_template: "chicago",
		},
		traits: 'Year after author (no parens), quoted article titles, "and"',
	},
	{
		id: "harvard",
		name: "Harvard",
		family: "author-date",
		intentFields: {
			from_preset: "harvard",
			class: "author_date",
			contributor_preset: "harvard",
			role_preset: "short-suffix",
			date_preset: "year",
			title_preset: "apa",
			bib_template: "harvard",
		},
		traits: 'Minimal punctuation, "pp." prefix for pages',
	},
	{
		id: "elsevier",
		name: "Elsevier",
		family: "author-date",
		intentFields: {
			from_preset: "apa",
			class: "author_date",
			contributor_preset: "apa",
			role_preset: "short-suffix",
			date_preset: "year",
			title_preset: "scientific",
			bib_template: "apa",
		},
		traits: "Given-first names, compact layout",
	},
	// Numeric
	{
		id: "vancouver",
		name: "Vancouver",
		family: "numeric",
		intentFields: {
			from_preset: "vancouver",
			class: "numeric",
			contributor_preset: "vancouver",
			role_preset: "short-suffix",
			date_preset: "year",
			title_preset: "scientific",
			bib_template: "vancouver",
		},
		traits: "Initials without dots, semicolon before date",
	},
	{
		id: "ieee",
		name: "IEEE",
		family: "numeric",
		intentFields: {
			from_preset: "ieee",
			class: "numeric",
			contributor_preset: "ieee",
			role_preset: "short-suffix",
			date_preset: "year",
			title_preset: "ieee",
			bib_template: "ieee",
		},
		traits: "Given-first, quoted titles, bracketed numbers",
	},
	{
		id: "nature",
		name: "Nature",
		family: "numeric",
		intentFields: {
			from_preset: "vancouver",
			class: "numeric",
			contributor_preset: "vancouver",
			role_preset: "short-suffix",
			date_preset: "year",
			title_preset: "scientific",
			bib_template: "vancouver",
		},
		traits: "Ampersand between authors, year in parens at end",
	},
	{
		id: "acs",
		name: "ACS",
		family: "numeric",
		intentFields: {
			from_preset: "vancouver",
			class: "numeric",
			contributor_preset: "vancouver",
			role_preset: "short-suffix",
			date_preset: "year",
			title_preset: "scientific",
			bib_template: "vancouver",
		},
		traits: "Semicolons between authors, italic journal",
	},
	// Note
	{
		id: "chicago-notes",
		name: "Chicago Notes",
		family: "note",
		branch: "note-humanities",
		intentFields: {
			from_preset: "chicago_notes",
			class: "footnote",
			contributor_preset: "chicago",
			role_preset: "verb-prefix",
			date_preset: "year",
			title_preset: "chicago",
			bib_template: "chicago",
			has_bibliography: true,
		},
		traits: "Full names, comma-separated, shortened on repeat",
	},
	{
		id: "turabian",
		name: "Turabian",
		family: "note",
		branch: "note-humanities",
		intentFields: {
			from_preset: "chicago_notes",
			class: "footnote",
			contributor_preset: "chicago",
			role_preset: "verb-prefix",
			date_preset: "year",
			title_preset: "chicago",
			bib_template: "chicago",
			has_bibliography: true,
		},
		traits: "Similar to Chicago Notes with minor variations",
	},
	{
		id: "bluebook-legal",
		name: "Bluebook",
		family: "note",
		branch: "note-law",
		intentFields: {
			from_preset: "bluebook_legal",
			class: "footnote",
			contributor_preset: "chicago",
			role_preset: "verb-prefix",
			date_preset: "year",
			title_preset: "chicago",
			bib_template: "chicago",
			has_bibliography: true,
		},
		traits: "Full legal footnotes with grouped references and shortened repeat notes",
	},
	{
		id: "oscola",
		name: "OSCOLA",
		family: "note",
		branch: "note-law",
		intentFields: {
			from_preset: "oscola",
			class: "footnote",
			contributor_preset: "chicago",
			role_preset: "verb-prefix",
			date_preset: "year",
			title_preset: "chicago",
			bib_template: "chicago",
			has_bibliography: false,
		},
		traits: "Compact legal footnotes with short-form repeats and notes-first behavior",
	},
];

export function getPresetsForFamily(family: StyleFamily): PresetInfo[] {
	return PRESETS.filter((p) => p.family === family);
}

export function getPresetsForBranch(
	branch: WizardBranch | null,
	family: StyleFamily | null
): PresetInfo[] {
	if (!family) return [];
	if (!branch) return getPresetsForFamily(family);
	return PRESETS.filter(
		(preset) => preset.family === family && (!preset.branch || preset.branch === branch)
	);
}
