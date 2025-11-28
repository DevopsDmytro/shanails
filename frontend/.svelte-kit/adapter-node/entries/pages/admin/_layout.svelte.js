import { U as attr_class, V as ensure_array_like, W as store_get, X as slot, Y as unsubscribe_stores } from "../../../chunks/index.js";
import { g as getContext } from "../../../chunks/context.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "clsx";
import "@sveltejs/kit/internal/server";
import "../../../chunks/state.svelte.js";
import { a as attr } from "../../../chunks/attributes.js";
import { a as authStore } from "../../../chunks/auth.js";
import { e as escape_html } from "../../../chunks/escaping.js";
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
    const menuItems = [
      { path: "/admin", icon: "📊", label: "Огляд" },
      { path: "/admin/appointments", icon: "📅", label: "Записи" },
      { path: "/admin/clients", icon: "👥", label: "Клієнти" },
      { path: "/admin/masters", icon: "✂️", label: "Майстри" },
      { path: "/admin/services", icon: "✨", label: "Послуги" },
      { path: "/admin/schedule", icon: "🕐", label: "Розклад" },
      { path: "/admin/reports", icon: "📈", label: "Звіти" }
    ];
    $$renderer2.push(`<div class="admin-container svelte-1qg5d05"><aside${attr_class("sidebar svelte-1qg5d05", void 0, { "collapsed": false })}><div class="sidebar-header svelte-1qg5d05"><h2 class="svelte-1qg5d05">Адмін Панель</h2> <button class="toggle-btn svelte-1qg5d05">${escape_html("◀")}</button></div> <nav class="sidebar-nav svelte-1qg5d05"><!--[-->`);
    const each_array = ensure_array_like(menuItems);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let item = each_array[$$index];
      $$renderer2.push(`<a${attr("href", item.path)}${attr_class("nav-item svelte-1qg5d05", void 0, {
        "active": store_get($$store_subs ??= {}, "$page", page).url.pathname === item.path
      })}><span class="nav-icon svelte-1qg5d05">${escape_html(item.icon)}</span> `);
      {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="nav-label svelte-1qg5d05">${escape_html(item.label)}</span>`);
      }
      $$renderer2.push(`<!--]--></a>`);
    }
    $$renderer2.push(`<!--]--></nav> <div class="sidebar-footer svelte-1qg5d05"><button class="logout-btn svelte-1qg5d05"><span class="nav-icon svelte-1qg5d05">🚪</span> `);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span>Вийти</span>`);
    }
    $$renderer2.push(`<!--]--></button></div></aside> <div class="main-content svelte-1qg5d05"><header class="admin-header svelte-1qg5d05"><div class="header-left"><h1 class="page-title svelte-1qg5d05">${escape_html(menuItems.find((item) => item.path === store_get($$store_subs ??= {}, "$page", page).url.pathname)?.label || "Адмін")}</h1></div> <div class="header-right">`);
    if (store_get($$store_subs ??= {}, "$authStore", authStore).user) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="user-info svelte-1qg5d05"><span class="user-icon svelte-1qg5d05">👤</span> <span class="user-name svelte-1qg5d05">${escape_html(store_get($$store_subs ??= {}, "$authStore", authStore).user.name)}</span> <span class="admin-badge svelte-1qg5d05">ADMIN</span></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div></header> <main class="content svelte-1qg5d05"><!--[-->`);
    slot($$renderer2, $$props, "default", {});
    $$renderer2.push(`<!--]--></main></div></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _layout as default
};
