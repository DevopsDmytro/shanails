import { a as attr } from "../../../chunks/attributes.js";
import { e as escape_html } from "../../../chunks/escaping.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/state.svelte.js";
import "../../../chunks/auth.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let name = "";
    let phone = "";
    let loading = false;
    $$renderer2.push(`<div class="registration-container svelte-52fghe"><div class="registration-card svelte-52fghe"><h1 class="svelte-52fghe">Complete Registration</h1> <p class="subtitle svelte-52fghe">Please provide your details to continue</p> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <form><div class="form-group svelte-52fghe"><label for="name" class="svelte-52fghe">Full Name</label> <input type="text" id="name"${attr("value", name)} placeholder="Enter your full name" required${attr("disabled", loading, true)} class="svelte-52fghe"/></div> <div class="form-group svelte-52fghe"><label for="phone" class="svelte-52fghe">Phone Number</label> <input type="tel" id="phone"${attr("value", phone)} placeholder="+38 (0XX) XXX-XX-XX" required${attr("disabled", loading, true)} class="svelte-52fghe"/> <small class="svelte-52fghe">Ukrainian phone number</small></div> <button type="submit" class="submit-button svelte-52fghe"${attr("disabled", loading, true)}>${escape_html("Complete Registration")}</button></form></div></div>`);
  });
}
export {
  _page as default
};
