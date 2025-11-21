import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		host: true,
		port: 5173,
		allowedHosts: ['test.shapovalova.pp.ua', 'app.shapovalova.pp.ua', 'localhost', '127.0.0.1'],
		proxy: {
			'/api': {
				target: 'http://backend:8000',
				changeOrigin: true,
				secure: false,
				rewrite: (path) => path
			}
		}
	},
	resolve: {
		alias: {
			$lib: '/src/lib'
		}
	}
});