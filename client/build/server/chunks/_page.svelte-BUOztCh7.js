import { Y as ensure_array_like, Z as attr_class, X as escape_html, _ as stringify } from './exports-B4Nj0tM2.js';
import './client-qzoUCy8n.js';
import { F as FAMILY_OPTIONS, w as wizardStore, b as FIELD_DEFAULTS } from './wizard.svelte-BuKwCymi.js';
import './index-DyD4Z1FP.js';
import 'js-yaml';

//#region src/lib/components/wizard/FamilySelector.svelte
function FamilySelector($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const isDefaultFamily = (familyId) => {
			return wizardStore.field ? FIELD_DEFAULTS[wizardStore.field] === familyId : false;
		};
		$$renderer.push(`<div class="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8 w-full"><div class="mb-8 sm:mb-12 max-w-2xl mx-auto text-center"><button class="absolute top-4 sm:top-8 left-4 sm:left-8 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><span class="material-symbols-outlined">arrow_back</span></button> <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 sm:mb-3">Step 2 of 4</p> <div class="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div class="h-full bg-primary rounded-full transition-all duration-500" style="width: 50%"></div></div> <h2 class="text-2xl sm:text-3xl font-bold mt-6 sm:mt-8 text-slate-900 dark:text-white">How should citations appear?</h2> <p class="text-base sm:text-lg text-slate-600 dark:text-slate-300 mt-2 sm:mt-3">Choose the citation format that matches your discipline.</p></div> <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"><!--[-->`);
		const each_array = ensure_array_like(FAMILY_OPTIONS);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let family = each_array[$$index];
			const isRecommended = isDefaultFamily(family.id);
			$$renderer.push(`<button${attr_class(`group relative flex flex-col p-6 sm:p-8 bg-white dark:bg-slate-800 border-2 rounded-xl text-left transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${stringify(isRecommended ? "border-primary dark:border-primary shadow-[0_0_15px_rgba(19,91,236,0.1)]" : "border-slate-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/50")}`)}>`);
			if (isRecommended) {
				$$renderer.push("<!--[-->");
				$$renderer.push(`<div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm whitespace-nowrap"><span class="material-symbols-outlined text-[14px]">star</span> Recommended format</div>`);
			} else $$renderer.push("<!--[!-->");
			$$renderer.push(`<!--]--> <div class="w-full flex justify-between items-start mb-4"><h3 class="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">${escape_html(family.label)}</h3> <span class="material-symbols-outlined text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors">arrow_forward</span></div> <p class="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-grow">${escape_html(family.description)}</p> <div class="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-700"><p class="font-serif text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">${escape_html(family.exampleText)}</p></div></button>`);
		}
		$$renderer.push(`<!--]--></div> <div class="mt-12 text-center"><button class="text-sm font-medium text-slate-500 hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"><span class="material-symbols-outlined text-lg">settings_suggest</span> I want to customize this further</button></div></div>`);
	});
}
//#endregion
//#region src/routes/create/family/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		FamilySelector($$renderer);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte-BUOztCh7.js.map
