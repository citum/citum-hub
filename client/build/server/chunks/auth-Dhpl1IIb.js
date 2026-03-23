import { N as writable } from './exports-Cx_VB--H.js';

//#region src/lib/stores/auth.ts
function createAuthStore() {
	const { subscribe, set } = writable({
		token: null,
		user: null
	});
	return {
		subscribe,
		login: (token) => {
			const payload = JSON.parse(atob(token.split(".")[1]));
			set({
				token,
				user: {
					id: payload.sub,
					email: "",
					role: payload.role
				}
			});
		},
		logout: () => {
			set({
				token: null,
				user: null
			});
		}
	};
}
var auth = createAuthStore();

export { auth as a };
//# sourceMappingURL=auth-Dhpl1IIb.js.map
