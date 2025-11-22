import { U as store_get, V as unsubscribe_stores } from "../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/utils.js";
import { e as escape_html } from "../../chunks/escaping.js";
import "clsx";
import "@sveltejs/kit/internal/server";
import "../../chunks/state.svelte.js";
import { a as authStore } from "../../chunks/auth.js";
function isTelegram() {
  if (typeof window === "undefined" || !window.Telegram?.WebApp) {
    return false;
  }
  const webApp = window.Telegram.WebApp;
  return !!(webApp.initData || webApp.initDataUnsafe?.user);
}
function getInitData() {
  if (!isTelegram()) {
    return "";
  }
  return window.Telegram.WebApp.initData;
}
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    $$renderer2.push(`<main class="svelte-12qhfyh">`);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="loading svelte-12qhfyh"><p>Loading...</p></div>`);
    }
    $$renderer2.push(`<!--]--></main> <div class="debug-overlay svelte-12qhfyh"><details open><summary class="svelte-12qhfyh">DEBUG MODE (Click to toggle)</summary> <pre>
isTelegram: ${escape_html(isTelegram())}
Version: ${escape_html(typeof window !== "undefined" && window.Telegram?.WebApp?.version)}
Platform: ${escape_html(typeof window !== "undefined" && window.Telegram?.WebApp?.platform)}
InitData Present: ${escape_html(!!getInitData())}
InitData Length: ${escape_html(getInitData()?.length || 0)}
Unsafe User: ${escape_html(JSON.stringify(typeof window !== "undefined" && window.Telegram?.WebApp?.initDataUnsafe?.user || "None"))}
Auth Store: ${escape_html(JSON.stringify(store_get($$store_subs ??= {}, "$authStore", authStore), null, 2))}
		</pre></details></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _layout as default
};
