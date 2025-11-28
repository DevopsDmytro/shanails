import { U as attr_class } from "../../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import { a as attr } from "../../../chunks/attributes.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/state.svelte.js";
import "../../../chunks/auth.js";
import { e as escape_html } from "../../../chunks/escaping.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let upcomingAppointments, pastAppointments;
    let appointments = [];
    let loading = true;
    let activeTab = "upcoming";
    upcomingAppointments = appointments.filter((a) => new Date(a.start_time) > /* @__PURE__ */ new Date() && a.status === "SCHEDULED");
    pastAppointments = appointments.filter((a) => new Date(a.start_time) <= /* @__PURE__ */ new Date() || a.status !== "SCHEDULED");
    $$renderer2.push(`<div class="my-bookings-container svelte-1hhmmmu"><div class="header svelte-1hhmmmu"><h1 class="svelte-1hhmmmu">Мої записи</h1> <button class="refresh-btn svelte-1hhmmmu"${attr("disabled", loading, true)}>${escape_html("⌛")}</button></div> `);
    {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="tabs svelte-1hhmmmu"><button${attr_class("svelte-1hhmmmu", void 0, { "active": activeTab === "upcoming" })}>Майбутні (${escape_html(upcomingAppointments.length)})</button> <button${attr_class("svelte-1hhmmmu", void 0, { "active": activeTab === "past" })}>Минулі (${escape_html(pastAppointments.length)})</button></div> <div class="bookings-list svelte-1hhmmmu">`);
      {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="loading svelte-1hhmmmu"><div class="spinner svelte-1hhmmmu"></div> <p class="svelte-1hhmmmu">Завантаження...</p></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};
