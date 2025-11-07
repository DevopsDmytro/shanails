import { U as store_get, V as slot, W as unsubscribe_stores } from "../../chunks/index2.js";
import { g as getContext } from "../../chunks/context.js";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/utils.js";
import "clsx";
import "@sveltejs/kit/internal/server";
import "../../chunks/state.svelte.js";
const getStores = () => {
  const stores$1 = getContext("__svelte__");
  return {
    /** @type {typeof page} */
    page: {
      subscribe: stores$1.page.subscribe
    },
    /** @type {typeof navigating} */
    navigating: {
      subscribe: stores$1.navigating.subscribe
    },
    /** @type {typeof updated} */
    updated: stores$1.updated
  };
};
const page = {
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    $$renderer2.push(`<main class="svelte-12qhfyh">`);
    if (store_get($$store_subs ??= {}, "$page", page).url.pathname !== "/booking") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<h1 class="svelte-12qhfyh">Салон Красоти</h1> <nav class="svelte-12qhfyh"><a href="/booking" class="svelte-12qhfyh">Записатися</a></nav>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <!--[-->`);
    slot($$renderer2, $$props, "default", {});
    $$renderer2.push(`<!--]--></main>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _layout as default
};
