import { P as store_get, S as attr, X as escape_html, R as unsubscribe_stores } from './exports-Cx_VB--H.js';
import './client-B7Dtr-YV.js';
import { a as auth } from './auth-Dhpl1IIb.js';
import { w as wizardStore } from './wizard.svelte-BZEf1FsW.js';
import { P as PreviewPane } from './PreviewPane-Bra00V-8.js';
import './index-DyD4Z1FP.js';
import 'js-yaml';

//#region src/lib/components/wizard/ReviewScreen.svelte
function ReviewScreen($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let styleName = wizardStore.styleName || suggestStyleName();
		let isSaving = false;
		function suggestStyleName() {
			if (wizardStore.styleInfo?.title) {
				let name = wizardStore.styleInfo.title;
				if (wizardStore.styleInfo.edition) name += ` ${wizardStore.styleInfo.edition}`;
				return name;
			}
			if (wizardStore.presetId) return {
				apa: "APA Author-Date",
				chicago: "Chicago Author-Date",
				vancouver: "Vancouver Numeric",
				harvard: "Harvard Author-Date",
				numeric: "Numeric",
				footnote: "Footnote"
			}[wizardStore.presetId] || "My Custom Style";
			return "My Custom Style";
		}
		const authState = store_get($$store_subs ??= {}, "$auth", auth);
		$$renderer.push(`<div class="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8 w-full"><div class="mb-8 sm:mb-12 text-center relative"><button class="absolute top-0 sm:top-2 left-0 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><span class="material-symbols-outlined">arrow_back</span></button> <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 sm:mb-3">Step 4 of 4</p> <div class="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div class="h-full bg-primary rounded-full transition-all duration-500" style="width: 100%"></div></div> <h2 class="text-2xl sm:text-3xl font-bold mt-6 sm:mt-8 text-slate-900 dark:text-white">Review Your Style</h2> <p class="text-base sm:text-lg text-slate-600 dark:text-slate-300 mt-2 sm:mt-3">Give your style a name and review before saving.</p></div> <div class="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 sm:p-8 shadow-sm mb-8"><label for="styleName" class="block text-sm font-bold tracking-wide uppercase text-slate-500 dark:text-slate-400 mb-3">Style Name</label> <input id="styleName" type="text" placeholder="e.g., My Research Style" maxlength="100"${attr("value", styleName)} class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-lg font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"/> <p class="mt-2 text-xs font-medium text-slate-400 text-right">${escape_html(styleName.length)}/100</p></div> <div class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 sm:p-8 shadow-sm mb-6"><h2 class="mb-6 text-sm font-bold tracking-wide uppercase text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2"><span class="material-symbols-outlined text-lg">checklist</span> Style Summary</h2> <ul class="grid grid-cols-1 md:grid-cols-2 gap-4"><li class="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-primary/30 group"><div class="flex size-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30 text-primary group-hover:scale-110 transition-transform"><span class="material-symbols-outlined text-xl">architecture</span></div> <div><p class="font-bold text-slate-900 dark:text-white text-sm">Style System</p> <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">${escape_html(wizardStore.family === "author-date" ? "Author-Date Citation Format" : wizardStore.family === "numeric" ? "Numbered Reference List" : "Humanities Footnote Style")}</p></div></li> <li class="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-primary/30 group"><div class="flex size-10 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 group-hover:scale-110 transition-transform"><span class="material-symbols-outlined text-xl">auto_awesome</span></div> <div><p class="font-bold text-slate-900 dark:text-white text-sm">Baseline Design</p> <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">${escape_html(wizardStore.presetId ? wizardStore.presetId.toUpperCase() : "Custom Composition")}</p></div></li> `);
		if (wizardStore.getOptions()?.contributors) {
			$$renderer.push("<!--[-->");
			const contrib = wizardStore.getOptions()?.contributors;
			$$renderer.push(`<li class="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-primary/30 group"><div class="flex size-10 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 group-hover:scale-110 transition-transform"><span class="material-symbols-outlined text-xl">person</span></div> <div><p class="font-bold text-slate-900 dark:text-white text-sm">Name Formatting</p> <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">${escape_html(contrib["name-form"] === "initials" ? "Initial-based" : "Full Names")},
							${escape_html(contrib["display-as-sort"] === "all" ? "Family-First" : "Given-First")}</p></div></li> `);
			if (contrib.shorten) {
				$$renderer.push("<!--[-->");
				$$renderer.push(`<li class="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-primary/30 group"><div class="flex size-10 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-600 group-hover:scale-110 transition-transform"><span class="material-symbols-outlined text-xl">reorder</span></div> <div><p class="font-bold text-slate-900 dark:text-white text-sm">Truncation Rules</p> <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">${escape_html(contrib.shorten.min)}+ authors shorten to ${escape_html(contrib.shorten["use-first"])}</p></div></li>`);
			} else $$renderer.push("<!--[!-->");
			$$renderer.push(`<!--]-->`);
		} else $$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--> `);
		if (wizardStore.getOptions()?.punctuation) {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<li class="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-primary/30 group"><div class="flex size-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 group-hover:scale-110 transition-transform"><span class="material-symbols-outlined text-xl">terminal</span></div> <div><p class="font-bold text-slate-900 dark:text-white text-sm">Quote Logic</p> <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">${escape_html(wizardStore.getOptions()?.["punctuation-in-quote"] ? "Punctuation inside" : "Punctuation outside")}</p></div></li>`);
		} else $$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--></ul></div> <div class="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-6 sm:p-8 shadow-sm mb-6"><h2 class="mb-6 text-sm font-bold tracking-wide uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-3 flex items-center gap-2"><span class="material-symbols-outlined text-lg">code</span> Raw Citum Code</h2> <pre class="overflow-auto text-sm text-slate-800 dark:text-slate-300 font-mono whitespace-pre-wrap break-all">${escape_html(wizardStore.styleYaml)}</pre></div> <details class="group rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm mb-8 overflow-hidden"><summary class="cursor-pointer list-none p-6 sm:p-8 flex items-center justify-between outline-none bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"><h2 class="text-sm font-bold tracking-wide uppercase text-slate-500 dark:text-slate-400 flex items-center gap-2 m-0"><span class="material-symbols-outlined text-lg">visibility</span> Visual Preview</h2> <span class="material-symbols-outlined text-slate-400 transition-transform group-open:rotate-180">expand_more</span></summary> <div class="p-6 sm:p-8 border-t border-slate-200 dark:border-slate-700">`);
		PreviewPane($$renderer, {});
		$$renderer.push(`<!----></div></details> `);
		$$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--> <div class="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-800"><button class="flex items-center justify-center w-full sm:w-auto min-w-[200px] gap-2 rounded-xl bg-primary px-8 py-3.5 font-bold text-white hover:bg-blue-700 focus:ring-4 focus:ring-primary/20 transition-all shadow-sm shadow-primary/20"><span class="material-symbols-outlined text-xl">download</span> Download YAML</button> `);
		if (authState?.user) {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<button${attr("disabled", isSaving, true)} class="flex items-center justify-center w-full sm:w-auto min-w-[200px] gap-2 rounded-xl border-2 border-primary bg-white dark:bg-slate-900 px-8 py-3 font-bold text-primary hover:bg-primary/5 focus:ring-4 focus:ring-primary/20 transition-all disabled:opacity-50">`);
			$$renderer.push("<!--[!-->");
			$$renderer.push(`<span class="material-symbols-outlined text-xl">save</span>`);
			$$renderer.push(`<!--]--> ${escape_html("Save to Library")}</button>`);
		} else {
			$$renderer.push("<!--[!-->");
			$$renderer.push(`<button class="flex items-center justify-center w-full sm:w-auto min-w-[200px] gap-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-8 py-3 font-bold text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 transition-all"><span class="material-symbols-outlined text-xl">login</span> Sign in to Save</button>`);
		}
		$$renderer.push(`<!--]--> <button class="flex items-center justify-center w-full sm:w-auto min-w-[200px] gap-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-8 py-3 font-bold text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 transition-all focus:ring-4 focus:ring-slate-100"><span class="material-symbols-outlined text-xl">edit</span> Component Editor</button> <button class="flex items-center justify-center w-full sm:w-auto min-w-[200px] gap-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-8 py-3 font-bold text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 transition-all focus:ring-4 focus:ring-slate-100"><span class="material-symbols-outlined text-xl">undo</span> Back to Selection</button> <button class="flex items-center justify-center w-full sm:w-auto mt-4 sm:ml-auto text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors uppercase tracking-wider"><span class="material-symbols-outlined text-sm mr-1">restart_alt</span> Start Over</button></div></div>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
//#endregion
//#region src/routes/create/review/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		ReviewScreen($$renderer);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte-Dj9wUvqV.js.map
