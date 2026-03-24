import { S as attr, Y as ensure_array_like, X as escape_html } from './exports-B4Nj0tM2.js';
import './client-qzoUCy8n.js';
import './index-DyD4Z1FP.js';

//#region src/routes/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let disciplines = [];
		let searchQuery = "";
		const trending = [
			"APA 7th Edition",
			"Nature",
			"IEEE",
			"Chicago Notes"
		];
		$$renderer.push(`<main class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(19,91,236,0.14),_transparent_38%),linear-gradient(180deg,_#f8fafc_0%,_#eef3fb_45%,_#f8fafc_100%)]"><section class="px-4 pb-18 pt-16 lg:px-10 lg:pb-24 lg:pt-24"><div class="mx-auto grid max-w-[1240px] gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end"><div class="space-y-8"><div class="space-y-4"><p class="text-xs font-black uppercase tracking-[0.28em] text-primary">Citum Registry</p> <h1 class="max-w-3xl text-5xl font-black tracking-[-0.04em] text-slate-950 lg:text-7xl">The definitive source for citation integrity.</h1> <p class="max-w-2xl text-lg leading-8 text-slate-600 lg:text-xl">Search a community-scale registry of citation styles, journal aliases, and discipline
						patterns. Find the closest match fast, tweak it when you need to, and export Citum YAML
						for the tools you already use.</p></div> <div class="rounded-[2rem] border border-white/70 bg-white/85 p-3 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur"><div class="flex flex-col gap-3 lg:flex-row"><label class="relative flex-1"><span class="material-symbols-outlined pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">search</span> <input${attr("value", searchQuery)} type="text" placeholder="Search styles, journals, fields, or ISSNs" class="w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-14 py-4 text-base text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/10"/></label> <button class="inline-flex items-center justify-center gap-2 rounded-[1.5rem] bg-primary px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-blue-700"><span class="material-symbols-outlined text-lg">manage_search</span> Search</button></div> <div class="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-500"><span class="font-bold uppercase tracking-[0.16em] text-slate-400">Trending:</span> <!--[-->`);
		const each_array = ensure_array_like(trending);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let trend = each_array[$$index];
			$$renderer.push(`<button class="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 transition hover:border-primary/30 hover:text-primary">${escape_html(trend)}</button>`);
		}
		$$renderer.push(`<!--]--></div></div> <div class="grid gap-4 sm:grid-cols-3"><div class="rounded-[1.8rem] border border-white/70 bg-white/70 p-5 shadow-sm"><div class="mb-3 inline-flex rounded-2xl bg-blue-50 p-3 text-primary"><span class="material-symbols-outlined">find_in_page</span></div> <h2 class="text-lg font-bold text-slate-900">Find</h2> <p class="mt-2 text-sm leading-6 text-slate-600">Search styles, journal aliases, and disciplines with fast matching across names, short
							titles, and registry metadata.</p></div> <div class="rounded-[1.8rem] border border-white/70 bg-white/70 p-5 shadow-sm"><div class="mb-3 inline-flex rounded-2xl bg-amber-50 p-3 text-amber-600"><span class="material-symbols-outlined">tune</span></div> <h2 class="text-lg font-bold text-slate-900">Customize</h2> <p class="mt-2 text-sm leading-6 text-slate-600">Open a canonical style, inspect its aliases, then jump into the builder when you need
							a project-specific variant.</p></div> <div class="rounded-[1.8rem] border border-white/70 bg-white/70 p-5 shadow-sm"><div class="mb-3 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-600"><span class="material-symbols-outlined">ios_share</span></div> <h2 class="text-lg font-bold text-slate-900">Export</h2> <p class="mt-2 text-sm leading-6 text-slate-600">Download Citum YAML for direct use, or keep browsing aliases until you find the exact
							journal mapping you need.</p></div></div></div> <div class="rounded-[2.4rem] border border-slate-200/70 bg-slate-950 p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]"><div class="flex items-center justify-between"><div><p class="text-xs font-black uppercase tracking-[0.22em] text-blue-200">Registry Pulse</p> <h2 class="mt-2 text-2xl font-black tracking-[-0.03em]">Featured Styles</h2></div> <a href="/library/browse" class="inline-flex items-center gap-2 text-sm font-bold text-blue-200 transition hover:text-white">View all <span class="material-symbols-outlined text-base">arrow_forward</span></a></div> <div class="mt-8 space-y-4">`);
		{
			$$renderer.push("<!--[-->");
			$$renderer.push(`<!--[-->`);
			const each_array_1 = ensure_array_like(Array.from({ length: 4 }, (_, index) => index));
			for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
				let index = each_array_1[$$index_1];
				$$renderer.push(`<div class="h-28 animate-pulse rounded-[1.8rem] bg-white/6"${attr("aria-hidden", index > -1)}></div>`);
			}
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--></div></div></div></section> <section class="px-4 pb-20 lg:px-10"><div class="mx-auto grid max-w-[1240px] gap-8 rounded-[2.4rem] border border-slate-200 bg-white/80 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.06)] backdrop-blur lg:grid-cols-[0.95fr_1.05fr] lg:p-10"><div><p class="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Explore by Discipline</p> <h2 class="mt-3 text-3xl font-black tracking-[-0.03em] text-slate-950">Start from the field your work already lives in.</h2> <p class="mt-4 max-w-xl text-sm leading-7 text-slate-600">The registry keeps styles and journal aliases connected, so you can move from a broad
					discipline search into a concrete publication format without guessing which result to
					trust.</p></div> <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><!--[-->`);
		const each_array_3 = ensure_array_like(disciplines);
		for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
			let field = each_array_3[$$index_3];
			$$renderer.push(`<button class="group flex min-h-28 flex-col justify-between rounded-[1.8rem] border border-slate-200 bg-slate-50 px-5 py-4 text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white hover:shadow-lg"><span class="material-symbols-outlined text-2xl text-slate-400 transition group-hover:text-primary">${escape_html(field.includes("medicine") ? "medical_services" : field.includes("science") ? "science" : field.includes("engineering") ? "memory" : field.includes("humanities") ? "menu_book" : "groups")}</span> <div><p class="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Field</p> <h3 class="mt-1 text-lg font-bold text-slate-900">${escape_html(field)}</h3></div></button>`);
		}
		$$renderer.push(`<!--]--></div></div></section> <section class="px-4 pb-24 lg:px-10"><div class="mx-auto flex max-w-[1240px] flex-col gap-6 rounded-[2.4rem] bg-slate-950 px-8 py-10 text-white shadow-[0_30px_80px_rgba(15,23,42,0.16)] lg:flex-row lg:items-center lg:justify-between lg:px-10"><div class="max-w-2xl"><p class="text-xs font-black uppercase tracking-[0.22em] text-blue-200">Need something unique?</p> <h2 class="mt-3 text-3xl font-black tracking-[-0.03em]">Create a custom style from scratch with the wizard.</h2> <p class="mt-4 text-sm leading-7 text-slate-300">Use the visual builder when the registry gets you close but not all the way. Start from an
					existing style, adjust the behavior, and export only the changes you need.</p></div> <div class="flex flex-col gap-3 sm:flex-row"><a href="/create-wizard" class="inline-flex items-center justify-center gap-2 rounded-[1.4rem] bg-primary px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-blue-700"><span class="material-symbols-outlined text-lg">auto_fix_high</span> Create Style</a> <a href="/library/browse" class="inline-flex items-center justify-center gap-2 rounded-[1.4rem] border border-white/15 bg-white/5 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/10"><span class="material-symbols-outlined text-lg">visibility</span> Browse Registry</a></div></div></section></main>`);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte-KmDWfjiu.js.map
