export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.BfVfELAA.js",app:"_app/immutable/entry/app.Dh-0qtC9.js",imports:["_app/immutable/entry/start.BfVfELAA.js","_app/immutable/chunks/CfUmlp5g.js","_app/immutable/chunks/WSApsJOu.js","_app/immutable/chunks/ZcxIPOnX.js","_app/immutable/chunks/D-C0kqwC.js","_app/immutable/entry/app.Dh-0qtC9.js","_app/immutable/chunks/WSApsJOu.js","_app/immutable/chunks/Bbz4drtu.js","_app/immutable/chunks/DUykcf2M.js","_app/immutable/chunks/D-C0kqwC.js","_app/immutable/chunks/CAUYAOfQ.js","_app/immutable/chunks/DOhbBg0t.js","_app/immutable/chunks/so6kwQCi.js","_app/immutable/chunks/ZcxIPOnX.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/auth/callback",
				pattern: /^\/auth\/callback\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/booking",
				pattern: /^\/booking\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/register",
				pattern: /^\/register\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
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
