<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
</script>

<main>
	{#if $page.url.pathname !== '/booking'}
		<h1>Салон Красоти</h1>
		<nav>
			<a href="/booking">Записатися</a>
		</nav>
	{/if}
	<slot />
</main>

<style>
	main {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
		max-width: 800px;
		margin: 0 auto;
		padding: 20px;
		min-height: 100vh;
	}
	
	h1 {
		color: #333;
		text-align: center;
		margin-bottom: 30px;
		font-size: 2rem;
	}
	
	nav {
		text-align: center;
		margin-bottom: 30px;
	}
	
	nav a {
		display: inline-block;
		padding: 12px 24px;
		background-color: #007bff;
		color: white;
		text-decoration: none;
		border-radius: 6px;
		font-weight: 500;
		transition: background-color 0.2s ease;
	}
	
	nav a:hover {
		background-color: #0056b3;
	}

	@media (max-width: 768px) {
		main {
			padding: 15px;
		}
		
		h1 {
			font-size: 1.5rem;
			margin-bottom: 20px;
		}
		
		nav {
			margin-bottom: 20px;
		}
		
		nav a {
			display: block;
			width: 100%;
			max-width: 300px;
			margin: 0 auto;
		}
	}
</style>