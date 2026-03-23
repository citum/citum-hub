const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["robots.txt"]),
	mimeTypes: {".txt":"text/plain"},
	_: {
		client: {start:"_app/immutable/entry/start.Bf5-vJfn.js",app:"_app/immutable/entry/app.j3YNFPkp.js",imports:["_app/immutable/entry/start.Bf5-vJfn.js","_app/immutable/chunks/D8ZDf0MR.js","_app/immutable/chunks/BxCzT0AR.js","_app/immutable/entry/app.j3YNFPkp.js","_app/immutable/chunks/D8ZDf0MR.js","_app/immutable/chunks/DEggy0fl.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-CEbTe10q.js')),
			__memo(() => import('./chunks/1-DvPJ_6Rk.js')),
			__memo(() => import('./chunks/2-BDZzc5q0.js')),
			__memo(() => import('./chunks/3-Dt5Y8ib5.js')),
			__memo(() => import('./chunks/4-CyS9mlyk.js')),
			__memo(() => import('./chunks/5-CgVEJ0zD.js')),
			__memo(() => import('./chunks/6-C1Ljx7B_.js')),
			__memo(() => import('./chunks/7-3QynCUug.js')),
			__memo(() => import('./chunks/8-C4OdQQ4Z.js')),
			__memo(() => import('./chunks/9-Denzc89e.js')),
			__memo(() => import('./chunks/10-DPDwaSqW.js')),
			__memo(() => import('./chunks/11-CLr-DZ7_.js')),
			__memo(() => import('./chunks/12-BIsyTFM4.js')),
			__memo(() => import('./chunks/13-CE9el3Uv.js')),
			__memo(() => import('./chunks/14-zCcxrYrJ.js')),
			__memo(() => import('./chunks/15-Bq_R32G-.js')),
			__memo(() => import('./chunks/16-C13uaejx.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/api/admin/registry/export",
				pattern: /^\/api\/admin\/registry\/export\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Oww7ctaM.js'))
			},
			{
				id: "/api/admin/registry/import",
				pattern: /^\/api\/admin\/registry\/import\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-yO-M5jCk.js'))
			},
			{
				id: "/api/admin/registry/runs",
				pattern: /^\/api\/admin\/registry\/runs\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CWRq5puu.js'))
			},
			{
				id: "/api/admin/registry/sync",
				pattern: /^\/api\/admin\/registry\/sync\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D1zV58uP.js'))
			},
			{
				id: "/api/admin/sync-styles",
				pattern: /^\/api\/admin\/sync-styles\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-0wcxBCZA.js'))
			},
			{
				id: "/api/auth/github",
				pattern: /^\/api\/auth\/github\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Cgh7zZTv.js'))
			},
			{
				id: "/api/auth/github/callback",
				pattern: /^\/api\/auth\/github\/callback\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Q6RNgjeT.js'))
			},
			{
				id: "/api/bookmarks",
				pattern: /^\/api\/bookmarks\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-I8yKRZQn.js'))
			},
			{
				id: "/api/hub",
				pattern: /^\/api\/hub\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DGtGQOdN.js'))
			},
			{
				id: "/api/hub/[styleKey]",
				pattern: /^\/api\/hub\/([^/]+?)\/?$/,
				params: [{"name":"styleKey","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D_VekHeL.js'))
			},
			{
				id: "/api/hub/[styleKey]/aliases",
				pattern: /^\/api\/hub\/([^/]+?)\/aliases\/?$/,
				params: [{"name":"styleKey","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-0Mnp4F_i.js'))
			},
			{
				id: "/api/hub/[styleKey]/download",
				pattern: /^\/api\/hub\/([^/]+?)\/download\/?$/,
				params: [{"name":"styleKey","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CU6QJ_4M.js'))
			},
			{
				id: "/api/styles",
				pattern: /^\/api\/styles\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DywyaQaA.js'))
			},
			{
				id: "/api/styles/[id]",
				pattern: /^\/api\/styles\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CyCAyYAC.js'))
			},
			{
				id: "/api/styles/[id]/bookmark",
				pattern: /^\/api\/styles\/([^/]+?)\/bookmark\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Bh2rIWYv.js'))
			},
			{
				id: "/api/styles/[id]/fork",
				pattern: /^\/api\/styles\/([^/]+?)\/fork\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DtKCUzuE.js'))
			},
			{
				id: "/api/v1/decide",
				pattern: /^\/api\/v1\/decide\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BKxGYVrq.js'))
			},
			{
				id: "/api/v1/generate",
				pattern: /^\/api\/v1\/generate\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Chh-iFrG.js'))
			},
			{
				id: "/api/v1/preview",
				pattern: /^\/api\/v1\/preview\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-C28TSjgX.js'))
			},
			{
				id: "/auth/callback",
				pattern: /^\/auth\/callback\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/create-wizard",
				pattern: /^\/create-wizard\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 13 },
				endpoint: null
			},
			{
				id: "/create",
				pattern: /^\/create\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/create/customize",
				pattern: /^\/create\/customize\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/create/family",
				pattern: /^\/create\/family\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/create/field",
				pattern: /^\/create\/field\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/create/preset",
				pattern: /^\/create\/preset\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/create/refine",
				pattern: /^\/create\/refine\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/create/review",
				pattern: /^\/create\/review\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/create/style",
				pattern: /^\/create\/style\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 12 },
				endpoint: null
			},
			{
				id: "/library",
				pattern: /^\/library\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 14 },
				endpoint: null
			},
			{
				id: "/library/browse",
				pattern: /^\/library\/browse\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 15 },
				endpoint: null
			},
			{
				id: "/preview/[...path]",
				pattern: /^\/preview(?:\/([^]*))?\/?$/,
				params: [{"name":"path","optional":false,"rest":true,"chained":true}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DRCxfnGv.js'))
			},
			{
				id: "/references",
				pattern: /^\/references\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CKAQhCxH.js'))
			},
			{
				id: "/style/[id]",
				pattern: /^\/style\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 16 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

const prerendered = new Set([]);

const base = "";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map
