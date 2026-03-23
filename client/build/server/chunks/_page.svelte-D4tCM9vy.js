import { S as attr, Z as attr_class, Y as ensure_array_like, X as escape_html } from './exports-Cx_VB--H.js';
import './client-B7Dtr-YV.js';
import './index-DyD4Z1FP.js';

//#region src/routes/library/browse/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let publicStyles = [];
		let searchQuery = "";
		let disciplines = [];
		let families = [];
		let selectedFields = [];
		let selectedFamily = "";
		$$renderer.push(`<main class="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef3fb_100%)] px-4 py-10 lg:px-10"><div class="mx-auto max-w-[1280px]"><section class="rounded-[2.4rem] border border-slate-200 bg-white/85 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.06)] backdrop-blur lg:p-8"><div class="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"><div class="max-w-2xl"><p class="text-xs font-black uppercase tracking-[0.22em] text-primary">Style Browser</p> <h1 class="mt-3 text-4xl font-black tracking-[-0.04em] text-slate-950 lg:text-5xl">Find and manage citation formatting for your manuscripts.</h1> <p class="mt-4 text-base leading-7 text-slate-600">Search canonical styles, scan alias-heavy results, and jump straight into a
						customization flow when a journal match is close but not perfect.</p></div> <div class="flex gap-3"><a href="/create" class="inline-flex items-center gap-2 rounded-[1.3rem] border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-primary/30 hover:text-primary"><span class="material-symbols-outlined text-lg">edit</span> Open Visual Editor</a></div></div> <div class="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]"><label class="relative block"><span class="material-symbols-outlined pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">search</span> <input${attr("value", searchQuery)} type="text" placeholder="Search by style, journal, field, short title, or ISSN" class="w-full rounded-[1.4rem] border border-slate-200 bg-slate-50 px-14 py-4 text-base text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/10"/></label> <div class="flex gap-3"><button class="inline-flex flex-1 items-center justify-center gap-2 rounded-[1.4rem] bg-primary px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-blue-700"><span class="material-symbols-outlined text-lg">manage_search</span> Search</button> <button class="inline-flex items-center justify-center gap-2 rounded-[1.4rem] border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"><span class="material-symbols-outlined text-lg">restart_alt</span> Reset</button></div></div> <div class="mt-6 grid gap-4 lg:grid-cols-2"><div class="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4"><p class="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Disciplines</p> <div class="flex flex-wrap gap-2"><button${attr_class(`rounded-full px-3 py-2 text-sm font-bold transition ${selectedFields.length === 0 ? "bg-primary text-white" : "bg-white text-slate-600 hover:text-primary"}`)}>All Fields</button> <!--[-->`);
		const each_array = ensure_array_like(disciplines);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let field = each_array[$$index];
			$$renderer.push(`<button${attr_class(`rounded-full px-3 py-2 text-sm font-bold transition ${selectedFields.includes(field) ? "bg-primary text-white" : "bg-white text-slate-600 hover:text-primary"}`)}>${escape_html(field)}</button>`);
		}
		$$renderer.push(`<!--]--></div></div> <div class="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4"><p class="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Style Families</p> <div class="flex flex-wrap gap-2"><button${attr_class(`rounded-full px-3 py-2 text-sm font-bold transition ${"bg-slate-900 text-white" }`)}>All Families</button> <!--[-->`);
		const each_array_1 = ensure_array_like(families);
		for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
			let family = each_array_1[$$index_1];
			$$renderer.push(`<button${attr_class(`rounded-full px-3 py-2 text-sm font-bold transition ${selectedFamily === family ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:text-slate-900"}`)}>${escape_html(family)}</button>`);
		}
		$$renderer.push(`<!--]--></div></div></div></section> <section class="mt-10"><div class="mb-6 flex items-center justify-between gap-4"><div><p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Results</p> <h2 class="mt-2 text-2xl font-black text-slate-950">Showing ${escape_html(publicStyles.length)} style${escape_html(publicStyles.length === 1 ? "" : "s")}</h2></div></div> `);
		{
			$$renderer.push("<!--[-->");
			$$renderer.push(`<div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"><!--[-->`);
			const each_array_2 = ensure_array_like(Array.from({ length: 6 }, (_, index) => index));
			for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
				let index = each_array_2[$$index_2];
				$$renderer.push(`<div class="h-72 animate-pulse rounded-[2rem] bg-white"${attr("aria-hidden", index > -1)}></div>`);
			}
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<!--]--></section></div></main>`);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte-D4tCM9vy.js.map
