import { Y as ensure_array_like } from './exports-B4Nj0tM2.js';
import './client-qzoUCy8n.js';
import { w as wizardStore } from './wizard.svelte-BuKwCymi.js';
import './index-DyD4Z1FP.js';
import 'js-yaml';

//#region src/lib/data/presets.ts
/** Preset metadata for the gallery. Each entry maps to intent-engine fields. */
var PRESETS = [
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
			bib_template: "apa"
		},
		traits: "Year in parentheses after author, italic journal, ampersand"
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
			bib_template: "chicago"
		},
		traits: "Year after author (no parens), quoted article titles, \"and\""
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
			bib_template: "harvard"
		},
		traits: "Minimal punctuation, \"pp.\" prefix for pages"
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
			bib_template: "apa"
		},
		traits: "Given-first names, compact layout"
	},
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
			bib_template: "vancouver"
		},
		traits: "Initials without dots, semicolon before date"
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
			bib_template: "ieee"
		},
		traits: "Given-first, quoted titles, bracketed numbers"
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
			bib_template: "vancouver"
		},
		traits: "Ampersand between authors, year in parens at end"
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
			bib_template: "vancouver"
		},
		traits: "Semicolons between authors, italic journal"
	},
	{
		id: "chicago-notes",
		name: "Chicago Notes",
		family: "note",
		intentFields: {
			from_preset: "chicago_notes",
			class: "footnote",
			contributor_preset: "chicago",
			role_preset: "verb-prefix",
			date_preset: "year",
			title_preset: "chicago",
			bib_template: "chicago",
			has_bibliography: true
		},
		traits: "Full names, comma-separated, shortened on repeat"
	},
	{
		id: "turabian",
		name: "Turabian",
		family: "note",
		intentFields: {
			from_preset: "chicago_notes",
			class: "footnote",
			contributor_preset: "chicago",
			role_preset: "verb-prefix",
			date_preset: "year",
			title_preset: "chicago",
			bib_template: "chicago",
			has_bibliography: true
		},
		traits: "Similar to Chicago Notes with minor variations"
	}
];
function getPresetsForFamily(family) {
	return PRESETS.filter((p) => p.family === family);
}
//#endregion
//#region src/lib/components/wizard/PresetGallery.svelte
function PresetGallery($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		getPresetsForFamily(wizardStore.family);
		$$renderer.push(`<div class="space-y-4 sm:space-y-6"><div><h2 class="font-display text-2xl font-semibold text-text-main">Pick the closest match</h2> <p class="mt-2 text-text-secondary">We'll generate a style from your selection. You can customize it later.</p></div> `);
		{
			$$renderer.push("<!--[-->");
			$$renderer.push(`<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"><!--[-->`);
			const each_array = ensure_array_like({ length: 3 });
			for (let i = 0, $$length = each_array.length; i < $$length; i++) {
				each_array[i];
				$$renderer.push(`<div class="space-y-3 rounded-lg bg-surface-light p-4"><div class="h-6 w-2/3 animate-pulse rounded bg-background-light"></div> <div class="space-y-2"><div class="h-4 w-full animate-pulse rounded bg-background-light"></div> <div class="h-4 w-5/6 animate-pulse rounded bg-background-light"></div></div> <div class="h-16 animate-pulse rounded bg-background-light"></div></div>`);
			}
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/routes/create/preset/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		PresetGallery($$renderer);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte-Cglr0d-k.js.map
