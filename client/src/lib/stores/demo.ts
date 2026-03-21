import { writable } from "svelte/store";
import { browser } from "$app/environment";

/**
 * Demo mode store for managing demo user state and bookmarks.
 * When PUBLIC_DEMO_MODE is enabled, users are automatically logged in
 * as a demo user with session-based bookmarks stored in sessionStorage.
 */

export interface DemoBanner {
	dismissed: boolean;
}

function createDemoStore() {
	const { subscribe, set } = writable<{
		bannerDismissed: boolean;
	}>({
		bannerDismissed: browser
			? sessionStorage.getItem("citum_demo_banner_dismissed") === "true"
			: false,
	});

	return {
		subscribe,
		dismissBanner: () => {
			if (browser) {
				sessionStorage.setItem("citum_demo_banner_dismissed", "true");
			}
			set({ bannerDismissed: true });
		},
		resetBanner: () => {
			if (browser) {
				sessionStorage.removeItem("citum_demo_banner_dismissed");
			}
			set({ bannerDismissed: false });
		},
	};
}

/**
 * Demo bookmarks store for managing bookmarks in demo mode.
 * Bookmarks are persisted to sessionStorage under the key "citum_demo_bookmarks"
 * as a JSON array of style IDs.
 */

export interface DemoBookmarks {
	styleIds: string[];
}

function createDemoBookmarksStore() {
	const storedBookmarks = browser
		? JSON.parse(sessionStorage.getItem("citum_demo_bookmarks") || "[]")
		: [];

	const { subscribe, set, update } = writable<DemoBookmarks>({
		styleIds: storedBookmarks,
	});

	return {
		subscribe,
		add: (styleId: string) => {
			update((state) => {
				if (!state.styleIds.includes(styleId)) {
					state.styleIds.push(styleId);
					if (browser) {
						sessionStorage.setItem("citum_demo_bookmarks", JSON.stringify(state.styleIds));
					}
				}
				return state;
			});
		},
		remove: (styleId: string) => {
			update((state) => {
				state.styleIds = state.styleIds.filter((id) => id !== styleId);
				if (browser) {
					sessionStorage.setItem("citum_demo_bookmarks", JSON.stringify(state.styleIds));
				}
				return state;
			});
		},
		clear: () => {
			if (browser) {
				sessionStorage.removeItem("citum_demo_bookmarks");
			}
			set({ styleIds: [] });
		},
	};
}

export const demoStore = createDemoStore();
export const demoBookmarks = createDemoBookmarksStore();
