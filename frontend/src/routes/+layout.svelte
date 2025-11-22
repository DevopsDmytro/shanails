<script lang="ts">
	import "../app.css";
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { initTelegramWebApp, isTelegram, getInitData } from "$lib/telegram";
	import { authenticateWithTelegram, initAuth } from "../services/auth";
	import { authStore } from "../stores/auth";
	import { config } from "$lib/config";

	let initializing = true;

	// Load existing auth state and handle authentication on mount
	onMount(async () => {
		try {
			// Initialize Telegram WebApp UI
			initTelegramWebApp();

			// Try to load existing token and validate it
			await initAuth();

			// If in Telegram and not authenticated, try to authenticate
			if (isTelegram() && !$authStore.isAuthenticated) {
				try {
					console.log("Attempting auto-authentication...");
					const result = await authenticateWithTelegram();
					console.log("Auto-auth result:", result);

					if (result.needsRegistration) {
						console.log("Redirecting to registration...");
						// Redirect to registration page
						await goto("/register");
					}
				} catch (error) {
					console.error("Auto-authentication failed:", error);
					authStore.setError(
						"Authentication failed. Please try again.",
					);
				}
			}
		} catch (error) {
			console.error("Initialization error:", error);
		} finally {
			initializing = false;
		}
	});

	// Protect routes that require authentication
	$: if (
		!initializing &&
		($page.url.pathname as string) !== "/register" &&
		($page.url.pathname as string) !== "/login"
	) {
		if (!$authStore.isAuthenticated) {
			// Not authenticated - try different auth methods
			if (isTelegram()) {
				// In Telegram WebApp with initData - authenticate
				authenticateWithTelegram()
					.then((result) => {
						if (result.needsRegistration) {
							goto("/register");
						}
					})
					.catch((err) => {
						console.error("Telegram authentication failed:", err);
						authStore.setError(
							"Authentication failed. Please try again.",
						);
					});
			} else {
				// Regular web browser (or Telegram browser without initData) - redirect to login page
				goto("/login");
			}
		} else if ($authStore.user && !$authStore.isRegistered) {
			// Authenticated but not registered, redirect to registration
			goto("/register");
		}
	}
</script>

<main>
	{#if initializing}
		<div class="loading">
			<p>Loading...</p>
		</div>
	{:else if $authStore.loading}
		<div class="loading">
			<p>Authenticating...</p>
		</div>
	{:else}
		{#if ($page.url.pathname as string) !== "/booking" && ($page.url.pathname as string) !== "/register" && ($page.url.pathname as string) !== "/login"}
			<header>
				<h1>Салон Красоти</h1>
				{#if $authStore.user}
					<div class="user-profile">
						<div class="user-icon">
							<svg
								viewBox="0 0 24 24"
								width="24"
								height="24"
								fill="currentColor"
							>
								<path
									d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
								/>
							</svg>
						</div>
						<span class="user-name">{$authStore.user.name}</span>
					</div>
				{/if}
			</header>
			<nav>
				<a href="/booking">Записатися</a>
			</nav>
		{/if}
		<slot />
	{/if}
</main>

<!-- Debug Overlay (only in development/test) -->
{#if config.features.debugMode}
	<div class="debug-overlay">
		<details open>
			<summary>DEBUG MODE (Click to toggle)</summary>
			<pre>
isTelegram: {isTelegram()}
Version: {typeof window !== "undefined" && window.Telegram?.WebApp?.version}
Platform: {typeof window !== "undefined" && window.Telegram?.WebApp?.platform}
InitData Present: {!!getInitData()}
InitData Length: {getInitData()?.length || 0}
Unsafe User: {JSON.stringify(
					(typeof window !== "undefined" &&
						window.Telegram?.WebApp?.initDataUnsafe?.user) ||
						"None",
				)}
Auth Store: {JSON.stringify($authStore, null, 2)}
			</pre>
		</details>
	</div>
{/if}

<style>
	main {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
			Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
		max-width: 800px;
		margin: 0 auto;
		padding: 20px;
		min-height: 100vh;
	}

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		font-size: 1.2rem;
		color: #666;
	}

	header {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 30px;
	}

	h1 {
		color: #333;
		text-align: center;
		margin-bottom: 10px;
		font-size: 2rem;
	}

	.user-profile {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 12px;
		background: #f0f2f5;
		border-radius: 20px;
		font-size: 0.9rem;
		color: #555;
	}

	.user-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		color: #007bff;
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

	.debug-overlay {
		position: fixed;
		bottom: 10px;
		right: 10px;
		background: rgba(0, 0, 0, 0.8);
		color: #0f0;
		padding: 10px;
		border-radius: 5px;
		font-family: monospace;
		font-size: 12px;
		z-index: 9999;
		max-width: 300px;
		overflow: auto;
	}

	.debug-overlay summary {
		cursor: pointer;
		user-select: none;
	}
</style>
