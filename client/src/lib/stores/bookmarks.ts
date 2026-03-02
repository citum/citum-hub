import { writable } from "svelte/store";

// Array of style IDs that are bookmarked
export const bookmarks = writable<string[]>([]);

export function toggleBookmark(id: string) {
	bookmarks.update((ids) => {
		if (ids.includes(id)) {
			return ids.filter((i) => i !== id);
		} else {
			return [...ids, id];
		}
	});
}
