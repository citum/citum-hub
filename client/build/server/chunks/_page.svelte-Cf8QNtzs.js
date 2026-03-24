import { X as escape_html, Y as ensure_array_like, Z as attr_class, S as attr, _ as stringify } from './exports-B4Nj0tM2.js';
import './client-qzoUCy8n.js';
import { w as wizardStore } from './wizard.svelte-BuKwCymi.js';
import { P as PreviewPane } from './PreviewPane-BeiP5Ixo.js';
import './index-DyD4Z1FP.js';
import 'js-yaml';

//#region src/lib/components/wizard/StyleNavigator.svelte
function StyleNavigator($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const axes = wizardStore.family === "author-date" ? [
			{
				id: "nameForm",
				question: "How should author names look?",
				options: [
					{
						value: "family-first-initials",
						label: "Smith, J. A."
					},
					{
						value: "given-first-initials",
						label: "J. A. Smith"
					},
					{
						value: "family-first-full",
						label: "Smith, John A."
					}
				]
			},
			{
				id: "datePosition",
				question: "Where does the year appear?",
				options: [
					{
						value: "after-author-parens",
						label: "Smith (2024)."
					},
					{
						value: "after-author-bare",
						label: "Smith 2024."
					},
					{
						value: "after-author-comma",
						label: "Smith, 2024."
					}
				]
			},
			{
				id: "articleTitleEmphasis",
				question: "How are article titles formatted?",
				options: [
					{
						value: "plain",
						label: "plain"
					},
					{
						value: "quoted",
						label: "\"In quotes\""
					},
					{
						value: "italic",
						label: "Italic"
					}
				]
			},
			{
				id: "etAlThreshold",
				question: "How many authors before \"et al.\"?",
				options: [
					{
						value: 2,
						label: "after 2"
					},
					{
						value: 3,
						label: "after 3"
					},
					{
						value: 6,
						label: "after 6"
					},
					{
						value: null,
						label: "show all"
					}
				]
			},
			{
				id: "authorConnector",
				question: "Author connector",
				options: [
					{
						value: "symbol",
						label: "&"
					},
					{
						value: "text",
						label: "and"
					},
					{
						value: "none",
						label: ","
					}
				]
			},
			{
				id: "locatorLabel",
				question: "How should page numbers be labeled?",
				options: [
					{
						value: "short",
						label: "p. 123"
					},
					{
						value: "long",
						label: "page 123"
					},
					{
						value: "none",
						label: "123 (no label)"
					}
				]
			},
			{
				id: "rolePreset",
				question: "How should contributor roles be formatted?",
				options: [
					{
						value: "short-suffix",
						label: "Smith, J. (ed.) / Doe, J. (trans.)"
					},
					{
						value: "long-suffix",
						label: "Smith, J. (editor) / Doe, J. (translator)"
					},
					{
						value: "verb-prefix",
						label: "edited by J. Smith / translated by J. Doe"
					},
					{
						value: "none",
						label: "None (suppress role)"
					}
				]
			}
		] : wizardStore.family === "numeric" ? [
			{
				id: "numberBracket",
				question: "How is the reference number shown?",
				options: [
					{
						value: "square",
						label: "[1]"
					},
					{
						value: "period",
						label: "1."
					},
					{
						value: "paren",
						label: "(1)"
					},
					{
						value: "superscript",
						label: "superscript¹"
					}
				]
			},
			{
				id: "nameForm",
				question: "How should author names look?",
				options: [
					{
						value: "compact",
						label: "Smith JA (initials, no dots)"
					},
					{
						value: "family-first-initials",
						label: "Smith, J. A."
					},
					{
						value: "given-first-initials",
						label: "J. A. Smith"
					}
				]
			},
			{
				id: "rolePreset",
				question: "How should contributor roles be formatted?",
				options: [
					{
						value: "short-suffix",
						label: "Smith, J. (ed.) / Doe, J. (trans.)"
					},
					{
						value: "long-suffix",
						label: "Smith, J. (editor) / Doe, J. (translator)"
					},
					{
						value: "verb-prefix",
						label: "edited by J. Smith / translated by J. Doe"
					},
					{
						value: "none",
						label: "None (suppress role)"
					}
				]
			}
		] : [
			{
				id: "footnoteNameForm",
				question: "How are names written in footnotes?",
				options: [{
					value: "full",
					label: "John A. Smith"
				}, {
					value: "inverted",
					label: "Smith, John A."
				}]
			},
			{
				id: "bookEmphasis",
				question: "How are book titles shown?",
				options: [{
					value: "italic",
					label: "Italic"
				}, {
					value: "plain",
					label: "plain"
				}]
			},
			{
				id: "rolePreset",
				question: "How should contributor roles be formatted?",
				options: [
					{
						value: "short-suffix",
						label: "Smith, J. (ed.) / Doe, J. (trans.)"
					},
					{
						value: "long-suffix",
						label: "Smith, J. (editor) / Doe, J. (translator)"
					},
					{
						value: "verb-prefix",
						label: "edited by J. Smith / translated by J. Doe"
					},
					{
						value: "none",
						label: "None (suppress role)"
					}
				]
			}
		];
		let currentAxisIndex = 0;
		$$renderer.push(`<div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 w-full h-full flex flex-col"><div class="mb-6 max-w-2xl mx-auto w-full text-center shrink-0 relative"><button class="absolute top-0 sm:top-2 left-0 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><span class="material-symbols-outlined">arrow_back</span></button> <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Step 3 of 4</p> <div class="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div class="h-full bg-primary rounded-full transition-all duration-500" style="width: 75%"></div></div> <h2 class="text-2xl font-bold mt-4 text-slate-900 dark:text-white">Style Navigator</h2></div> <div class="flex flex-1 min-h-0 gap-6"><div class="flex w-2/3 flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden"><div class="flex items-center justify-between border-b border-border-light bg-surface-light px-4 py-3"><h3 class="font-semibold text-text-main">Live Preview</h3></div> <div class="flex-1 overflow-auto bg-surface-main p-6">`);
		if (wizardStore.isLoading) {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<div class="flex h-full items-center justify-center"><div class="animate-pulse text-text-secondary">Generating preview...</div></div>`);
		} else {
			$$renderer.push("<!--[!-->");
			if (wizardStore.styleYaml) {
				$$renderer.push("<!--[-->");
				PreviewPane($$renderer, {});
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push(`<div class="flex h-full items-center justify-center text-text-secondary text-center p-8">Make your selections on the right to see the preview update.</div>`);
			}
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--></div> <div class="border-t border-border-light bg-surface-light px-4 py-3"><p class="text-sm font-medium text-text-secondary">Closest match: <span class="text-text-main">${escape_html(wizardStore.styleInfo?.short_title ?? wizardStore.styleInfo?.title ?? (wizardStore.presetId ? wizardStore.presetId.toUpperCase() : "Computing..."))}
						${escape_html(wizardStore.styleInfo?.edition ? ` (${wizardStore.styleInfo.edition})` : "")}</span></p></div></div> <div class="flex w-1/3 flex-col gap-4 overflow-y-auto pr-2 pb-8"><!--[-->`);
		const each_array = ensure_array_like(axes.slice(0, currentAxisIndex + 1));
		for (let i = 0, $$length = each_array.length; i < $$length; i++) {
			let axis = each_array[i];
			$$renderer.push(`<div${attr_class(`rounded-lg border-2 ${stringify(i === currentAxisIndex ? "border-primary shadow-md" : "border-border-light opacity-60")} bg-surface-light p-4 transition-all`)}><h4 class="mb-3 font-semibold text-text-main">${escape_html(axis.question)}</h4> <div class="flex flex-col gap-2"><!--[-->`);
			const each_array_1 = ensure_array_like(axis.options);
			for (let $$index = 0, $$length = each_array_1.length; $$index < $$length; $$index++) {
				let option = each_array_1[$$index];
				$$renderer.push(`<label class="flex cursor-pointer items-center gap-3 rounded-md border border-border-light bg-surface-main p-3 hover:border-primary"><input type="radio"${attr("name", axis.id)}${attr("value", option.value)}${attr("checked", wizardStore.axisChoices[axis.id] === option.value, true)} class="h-4 w-4 text-primary focus:ring-primary"/> <span class="text-sm text-text-main">${escape_html(option.label)}</span></label>`);
			}
			$$renderer.push(`<!--]--></div></div>`);
		}
		$$renderer.push(`<!--]--> <div class="pt-4 space-y-3">`);
		if (currentAxisIndex === axes.length - 1 && wizardStore.axisChoices[axes[currentAxisIndex].id]) {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<button class="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm">Continue to Final Review</button>`);
		} else {
			$$renderer.push("<!--[!-->");
			$$renderer.push(`<button class="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm">Use these settings</button> `);
			if (currentAxisIndex < axes.length - 1) {
				$$renderer.push("<!--[-->");
				$$renderer.push(`<p class="mt-2 text-xs text-text-secondary italic">You can skip the remaining ${escape_html(axes.length - 1 - currentAxisIndex)} questions and refine further
							in the next step.</p>`);
			} else $$renderer.push("<!--[!-->");
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--> <button class="w-full rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"><span class="material-symbols-outlined text-lg">settings_suggest</span> Open Visual Editor</button></div></div></div></div>`);
	});
}
//#endregion
//#region src/routes/create/style/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		StyleNavigator($$renderer);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte-Cf8QNtzs.js.map
