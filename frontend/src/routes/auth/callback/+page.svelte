<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { authStore } from "../../../stores/auth";

    import { getCurrentUser } from "$lib/api";

    onMount(async () => {
        const token = $page.url.searchParams.get("token");

        if (token) {
            try {
                console.log("Processing magic link token...");
                // Validate token and fetch user data immediately
                const user = await getCurrentUser(token);
                console.log("User fetched successfully:", user);

                // Update auth store
                authStore.setUser(user, token);

                // Redirect to home
                console.log("Redirecting to home...");
                goto("/");
            } catch (error) {
                console.error("Error processing magic link:", error);
                authStore.setError("Invalid login link.");
                goto("/login");
            }
        } else {
            console.error("No token in URL");
            authStore.setError("No token provided.");
            goto("/login");
        }
    });
</script>

<div class="loading">
    <p>Logging you in...</p>
</div>

<style>
    .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        font-size: 1.2rem;
        color: #666;
    }
</style>
