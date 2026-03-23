import { writable } from "svelte/store";
import type { StyleIntent } from "../types/bindings";

export function createInitialIntent(): StyleIntent {
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

export const intent = writable<StyleIntent>(createInitialIntent());

export function resetIntent() {
	intent.set(createInitialIntent());
}
