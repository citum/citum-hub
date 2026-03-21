import { writable } from "svelte/store";
import { browser } from "$app/environment";

export interface User {
	id: string;
	email: string;
	role: string;
}

function createAuthStore() {
	const { subscribe, set } = writable<{
		token: string | null;
		user: User | null;
	}>({
		token: browser ? localStorage.getItem("auth_token") : null,
		user: browser ? JSON.parse(localStorage.getItem("auth_user") || "null") : null,
	});

	return {
		subscribe,
		login: (token: string) => {
			// Decode JWT to get user info (simple base64 decode of payload)
			const payload = JSON.parse(atob(token.split(".")[1]));
			const user = {
				id: payload.sub,
				email: "", // Backend doesn't put email in JWT currently, could add it
				role: payload.role,
			};

			if (browser) {
				localStorage.setItem("auth_token", token);
				localStorage.setItem("auth_user", JSON.stringify(user));
			}
			set({ token, user });
		},
		logout: () => {
			if (browser) {
				localStorage.removeItem("auth_token");
				localStorage.removeItem("auth_user");
			}
			set({ token: null, user: null });
		},
	};
}

export const auth = createAuthStore();
