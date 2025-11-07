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
		client: {start:"_app/immutable/entry/start.D8vrB_ty.js",app:"_app/immutable/entry/app.DDzsOYFd.js",imports:["_app/immutable/entry/start.D8vrB_ty.js","_app/immutable/chunks/9-NG8NVf.js","_app/immutable/chunks/COkgVhT-.js","_app/immutable/chunks/DbfMy2V5.js","_app/immutable/entry/app.DDzsOYFd.js","_app/immutable/chunks/COkgVhT-.js","_app/immutable/chunks/C0VxrkEy.js","_app/immutable/chunks/1Gs77TV-.js","_app/immutable/chunks/DbfMy2V5.js","_app/immutable/chunks/CfUMJD9q.js","_app/immutable/chunks/CR4W2wzQ.js","_app/immutable/chunks/YPG5HaLv.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js'))
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
				id: "/booking",
				pattern: /^\/booking\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
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
