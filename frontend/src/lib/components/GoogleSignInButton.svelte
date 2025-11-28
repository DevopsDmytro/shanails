<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";

    // TypeScript declarations for Google Identity Services
    declare global {
        interface Window {
            google: any;
        }
    }

    export let clientId: string = "";

    const dispatch = createEventDispatcher();

    let googleLoaded = false;

    onMount(() => {
        // Load Google Sign-In script
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => {
            googleLoaded = true;
            if (clientId) {
                initializeGoogle();
            }
        };
        document.head.appendChild(script);
    });

    function initializeGoogle() {
        if (!window.google || !clientId) return;

        window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
        });

        window.google.accounts.id.renderButton(
            document.getElementById("google-signin-button"),
            {
                theme: "outline",
                size: "large",
                width: 400,
                text: "signin_with",
                shape: "rectangular",
            },
        );
    }

    function handleCredentialResponse(response: any) {
        // response.credential contains the JWT ID token
        dispatch("signin", { idToken: response.credential });
    }

    $: if (googleLoaded && clientId) {
        initializeGoogle();
    }
</script>

<div id="google-signin-button" class="google-button"></div>

<style>
    .google-button {
        display: flex;
        justify-content: center;
        width: 100%;
    }

    :global(#google-signin-button > div) {
        width: 100% !important;
    }
</style>
