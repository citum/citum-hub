import { writable } from "svelte/store";
import { browser } from "$app/environment";
import { env } from "$env/dynamic/public";

export interface User {
	id: string;
	email: string;
	role: string;
}

function createAuthStore() {
	// In demo mode, automatically populate a demo user
	let initialState = {
		token: null as string | null,
		user: null as User | null,
	};

	if (env.PUBLIC_DEMO_MODE === "true") {
		initialState = {
			token: "demo-token",
			user: {
				id: "demo",
				email: "demo@citum.local",
				role: "demo",
			},
		};
	} else if (browser) {
		initialState = {
			token: localStorage.getItem("auth_token"),
			user: JSON.parse(localStorage.getItem("auth_user") || "null"),
		};
	}

	const { subscribe, set } = writable(initialState);

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
