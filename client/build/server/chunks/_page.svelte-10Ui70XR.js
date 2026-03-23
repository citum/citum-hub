import { Z as attr_class, X as escape_html, S as attr, Y as ensure_array_like, _ as stringify, $ as html, a0 as attr_style } from './exports-Cx_VB--H.js';
import './client-B7Dtr-YV.js';
import { w as wizardStore, g as getComponentLabel, a as getComponentType } from './wizard.svelte-BZEf1FsW.js';
import './index-DyD4Z1FP.js';
import 'js-yaml';

//#region src/lib/components/wizard/InteractivePreview.svelte
function InteractivePreview($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const showParenthetical = wizardStore.family === "author-date" || wizardStore.family === "numeric";
		const showNarrative = wizardStore.family === "author-date";
		const showNote = wizardStore.family === "note";
		const showBibliography = wizardStore.family !== "numeric";
		$$renderer.push(`<div class="rounded-lg border border-border-light bg-surface-light overflow-hidden">`);
		if (wizardStore.isLoading) {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<div class="flex items-center justify-center gap-2 p-8"><span class="material-symbols-outlined animate-spin text-primary">hourglass</span> <span class="text-text-secondary">Loading preview...</span></div>`);
		} else {
			$$renderer.push("<!--[!-->");
			if (wizardStore.error) {
				$$renderer.push("<!--[-->");
				$$renderer.push(`<div class="space-y-2 rounded bg-red-50 p-4"><p class="font-semibold text-red-700">Preview Error</p> <p class="text-sm text-red-600">${escape_html(wizardStore.error)}</p></div>`);
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push(`<div class="p-6"><div class="space-y-6 focus:outline-none" role="region" aria-label="Citation Preview" aria-live="polite" tabindex="0">`);
				if (showParenthetical && wizardStore.previewHtml.parenthetical) {
					$$renderer.push("<!--[-->");
					$$renderer.push(`<div class="space-y-2"><h4 class="font-semibold text-text-main text-sm">Parenthetical Citation</h4> <div class="interactive-preview rounded bg-background-light p-3 font-serif text-text-main">${html(wizardStore.previewHtml.parenthetical)}</div></div>`);
				} else $$renderer.push("<!--[!-->");
				$$renderer.push(`<!--]--> `);
				if (showNarrative && wizardStore.previewHtml.narrative) {
					$$renderer.push("<!--[-->");
					$$renderer.push(`<div class="space-y-2"><h4 class="font-semibold text-text-main text-sm">Narrative Citation</h4> <div class="interactive-preview rounded bg-background-light p-3 font-serif text-text-main">${html(wizardStore.previewHtml.narrative)}</div></div>`);
				} else $$renderer.push("<!--[!-->");
				$$renderer.push(`<!--]--> `);
				if (showNote && wizardStore.previewHtml.note) {
					$$renderer.push("<!--[-->");
					$$renderer.push(`<div class="space-y-2"><h4 class="font-semibold text-text-main text-sm">Footnote</h4> <div class="interactive-preview rounded bg-background-light p-3 font-serif text-text-main">${html(wizardStore.previewHtml.note)}</div></div>`);
				} else $$renderer.push("<!--[!-->");
				$$renderer.push(`<!--]--> `);
				if (showBibliography && wizardStore.previewHtml.bibliography) {
					$$renderer.push("<!--[-->");
					$$renderer.push(`<div class="space-y-2"><h4 class="font-semibold text-text-main text-sm">Bibliography</h4> <div class="interactive-preview rounded bg-background-light p-4 font-serif text-sm text-text-main">${html(wizardStore.previewHtml.bibliography)}</div></div>`);
				} else {
					$$renderer.push("<!--[!-->");
					if (!showParenthetical && !showNarrative && !showNote && !showBibliography) {
						$$renderer.push("<!--[-->");
						$$renderer.push(`<div class="text-center py-8"><p class="text-text-secondary">No preview available yet</p></div>`);
					} else $$renderer.push("<!--[!-->");
					$$renderer.push(`<!--]-->`);
				}
				$$renderer.push(`<!--]--></div></div> `);
				$$renderer.push("<!--[!-->");
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/lib/components/wizard/editors/ContributorEditor.svelte
function ContributorEditor($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { editScope = "all" } = $$props;
		let debounceTimer;
		function debouncedFetchPreview() {
			clearTimeout(debounceTimer);
			debounceTimer = window.setTimeout(() => {
				wizardStore.fetchPreview();
			}, 300);
		}
		function getSelectedPath(ensureLocal = false) {
			const selected = wizardStore.selectedComponent;
			if (!selected) return null;
			return wizardStore.getScopedTemplatePath(selected.templatePath, editScope, { ensureLocal });
		}
		function getContributorConfig() {
			const path = getSelectedPath();
			if (!path) return {};
			return wizardStore.getTemplateNode(path) ?? {};
		}
		function updateContributor(path, value) {
			const selectedPath = getSelectedPath(editScope === "local");
			if (!selectedPath) return;
			wizardStore.updateStyleField(`${selectedPath}.${path}`, value);
			debouncedFetchPreview();
		}
		const config = getContributorConfig();
		const nameOrder = config["name-order"] ?? "family-first";
		const andConnector = config.and ?? "symbol";
		const initials = config["initialize-with"] === ". " ? "abbreviated" : config["initialize-with"] === "" ? "compact" : "full";
		const etAlAfter = config.shorten?.min ?? 3;
		$$renderer.push(`<div class="space-y-6"><div class="mb-4"><h3 class="font-semibold text-text-main flex items-center gap-2 text-lg"><span class="material-symbols-outlined text-primary">person_edit</span> Name Formatting</h3> <p class="text-sm text-text-secondary mt-1">Configure how contributor names appear in your citations.</p></div> <div class="space-y-5 rounded-lg border border-border-light bg-surface-light p-6 shadow-sm"><div><label for="ce-name-order" class="block text-sm font-semibold text-text-main mb-2">Name Display Order</label> `);
		$$renderer.select({
			id: "ce-name-order",
			value: nameOrder,
			onchange: (e) => updateContributor("name-order", e.currentTarget.value),
			class: "w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
		}, ($$renderer) => {
			$$renderer.option({ value: "family-first" }, ($$renderer) => {
				$$renderer.push(`Family-first (Smith, John)`);
			});
			$$renderer.option({ value: "given-first" }, ($$renderer) => {
				$$renderer.push(`Given-first (John Smith)`);
			});
		});
		$$renderer.push(`</div> <div><label for="ce-and-connector" class="block text-sm font-semibold text-text-main mb-2">Last Author Connector</label> `);
		$$renderer.select({
			id: "ce-and-connector",
			value: andConnector,
			onchange: (e) => updateContributor("and", e.currentTarget.value),
			class: "w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
		}, ($$renderer) => {
			$$renderer.option({ value: "symbol" }, ($$renderer) => {
				$$renderer.push(`Symbol (&amp;)`);
			});
			$$renderer.option({ value: "text" }, ($$renderer) => {
				$$renderer.push(`Word (and)`);
			});
			$$renderer.option({ value: "none" }, ($$renderer) => {
				$$renderer.push(`None`);
			});
		});
		$$renderer.push(`</div> <div><label for="ce-initials" class="block text-sm font-semibold text-text-main mb-2">Initials Format</label> `);
		$$renderer.select({
			id: "ce-initials",
			value: initials,
			onchange: (e) => {
				const val = e.currentTarget.value;
				updateContributor("initialize-with", val === "abbreviated" ? ". " : val === "compact" ? "" : void 0);
			},
			class: "w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
		}, ($$renderer) => {
			$$renderer.option({ value: "abbreviated" }, ($$renderer) => {
				$$renderer.push(`Abbreviated (J. A.)`);
			});
			$$renderer.option({ value: "compact" }, ($$renderer) => {
				$$renderer.push(`Compact (JA)`);
			});
			$$renderer.option({ value: "full" }, ($$renderer) => {
				$$renderer.push(`Full names`);
			});
		});
		$$renderer.push(`</div> <div class="pt-2 border-t border-border-light"><label for="ce-etal-range" class="block text-sm font-semibold text-text-main mb-3">Truncate to "et al." when authors exceed <span class="text-primary text-xl ml-1">${escape_html(etAlAfter)}</span></label> <input id="ce-etal-range" type="range" min="1" max="20"${attr("value", etAlAfter)} class="w-full"/></div></div></div>`);
	});
}
//#endregion
//#region src/lib/components/wizard/editors/TitleEditor.svelte
function TitleEditor($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { editScope = "all" } = $$props;
		let debounceTimer;
		function debouncedFetchPreview() {
			clearTimeout(debounceTimer);
			debounceTimer = window.setTimeout(() => {
				wizardStore.fetchPreview();
			}, 300);
		}
		function getSelectedPath(ensureLocal = false) {
			const selected = wizardStore.selectedComponent;
			if (!selected) return null;
			return wizardStore.getScopedTemplatePath(selected.templatePath, editScope, { ensureLocal });
		}
		function getTitleRendering() {
			const path = getSelectedPath();
			if (!path) return {};
			return wizardStore.getTemplateNode(path) ?? {};
		}
		function updateTitleRendering(path, value) {
			const selectedPath = getSelectedPath(editScope === "local");
			if (!selectedPath) return;
			wizardStore.updateStyleField(`${selectedPath}.${path}`, value);
			debouncedFetchPreview();
		}
		const rendering = getTitleRendering();
		const textCase = rendering["text-case"] ?? "sentence";
		const isQuoted = rendering.quote ?? false;
		const isEmph = rendering.emph ?? false;
		const prefix = rendering.prefix ?? "";
		const suffix = rendering.suffix ?? "";
		$$renderer.push(`<div class="space-y-4 p-6 pt-4"><h3 class="font-semibold text-text-main mb-4">Title Formatting</h3> <div class="space-y-4"><div><label for="te-case" class="block text-sm font-medium text-text-main mb-2">Capitalization</label> `);
		$$renderer.select({
			id: "te-case",
			value: textCase,
			onchange: (e) => updateTitleRendering("text-case", e.currentTarget.value),
			class: "w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
		}, ($$renderer) => {
			$$renderer.option({ value: "sentence" }, ($$renderer) => {
				$$renderer.push(`Sentence case`);
			});
			$$renderer.option({ value: "title" }, ($$renderer) => {
				$$renderer.push(`Title Case`);
			});
			$$renderer.option({ value: "as-is" }, ($$renderer) => {
				$$renderer.push(`As entered`);
			});
		});
		$$renderer.push(`</div> <div><span class="block text-sm font-medium text-text-main mb-2">Style</span> <div class="space-y-2"><label for="te-quoted" class="flex items-center gap-2 cursor-pointer"><input id="te-quoted" type="checkbox"${attr("checked", isQuoted, true)} class="w-4 h-4 rounded border-border-light text-primary focus:ring-primary"/> <span class="text-sm text-text-main">In quotes</span></label> <label for="te-emph" class="flex items-center gap-2 cursor-pointer"><input id="te-emph" type="checkbox"${attr("checked", isEmph, true)} class="w-4 h-4 rounded border-border-light text-primary focus:ring-primary"/> <span class="text-sm text-text-main">Italic</span></label></div></div> <div class="grid grid-cols-2 gap-4"><div><label for="te-prefix" class="block text-sm font-medium text-text-main mb-2">Prefix</label> <input id="te-prefix" type="text"${attr("value", prefix)} class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"/></div> <div><label for="te-suffix" class="block text-sm font-medium text-text-main mb-2">Suffix</label> <input id="te-suffix" type="text"${attr("value", suffix)} class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"/></div></div></div></div>`);
	});
}
//#endregion
//#region src/lib/components/wizard/editors/DateEditor.svelte
function DateEditor($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { editScope = "all" } = $$props;
		let debounceTimer;
		function debouncedFetchPreview() {
			clearTimeout(debounceTimer);
			debounceTimer = window.setTimeout(() => {
				wizardStore.fetchPreview();
			}, 300);
		}
		function getSelectedPath(ensureLocal = false) {
			const selected = wizardStore.selectedComponent;
			if (!selected) return null;
			return wizardStore.getScopedTemplatePath(selected.templatePath, editScope, { ensureLocal });
		}
		function getDateConfig() {
			const path = getSelectedPath();
			if (!path) return {};
			return wizardStore.getTemplateNode(path) ?? {};
		}
		function updateDate(path, value) {
			const selectedPath = getSelectedPath(editScope === "local");
			if (!selectedPath) return;
			wizardStore.updateStyleField(`${selectedPath}.${path}`, value);
			debouncedFetchPreview();
		}
		const config = getDateConfig();
		const dateForm = config.form ?? "year";
		const wrap = config.wrap ?? "parentheses";
		const prefix = config.prefix ?? "";
		const suffix = config.suffix ?? "";
		const isEmph = config.emph ?? false;
		const isStrong = config.strong ?? false;
		$$renderer.push(`<div class="space-y-4 p-6 pt-4"><h3 class="font-semibold text-text-main mb-4">Date Display</h3> <div class="space-y-4"><div><label for="de-form" class="block text-sm font-medium text-text-main mb-2">Format</label> `);
		$$renderer.select({
			id: "de-form",
			value: dateForm,
			onchange: (e) => updateDate("form", e.currentTarget.value),
			class: "w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
		}, ($$renderer) => {
			$$renderer.option({ value: "year" }, ($$renderer) => {
				$$renderer.push(`Year`);
			});
			$$renderer.option({ value: "year-month" }, ($$renderer) => {
				$$renderer.push(`Month-Year`);
			});
			$$renderer.option({ value: "full" }, ($$renderer) => {
				$$renderer.push(`Full date`);
			});
			$$renderer.option({ value: "year-month-day" }, ($$renderer) => {
				$$renderer.push(`Numeric`);
			});
		});
		$$renderer.push(`</div> <div><label for="de-wrap" class="block text-sm font-medium text-text-main mb-2">Wrap</label> `);
		$$renderer.select({
			id: "de-wrap",
			value: wrap,
			onchange: (e) => updateDate("wrap", e.currentTarget.value),
			class: "w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
		}, ($$renderer) => {
			$$renderer.option({ value: "parentheses" }, ($$renderer) => {
				$$renderer.push(`Parentheses`);
			});
			$$renderer.option({ value: "brackets" }, ($$renderer) => {
				$$renderer.push(`Brackets`);
			});
			$$renderer.option({ value: "none" }, ($$renderer) => {
				$$renderer.push(`None`);
			});
		});
		$$renderer.push(`</div> <div class="grid grid-cols-2 gap-4"><div><label for="de-prefix" class="block text-sm font-medium text-text-main mb-2">Prefix</label> <input id="de-prefix" type="text"${attr("value", prefix)} class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"/></div> <div><label for="de-suffix" class="block text-sm font-medium text-text-main mb-2">Suffix</label> <input id="de-suffix" type="text"${attr("value", suffix)} class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"/></div></div> <div><span class="block text-sm font-medium text-text-main mb-2">Style</span> <div class="flex gap-4"><label for="de-emph" class="flex items-center gap-2 cursor-pointer"><input id="de-emph" type="checkbox"${attr("checked", isEmph, true)} class="w-4 h-4 rounded border-border-light text-primary focus:ring-primary"/> <span class="text-sm text-text-main">Italic</span></label> <label for="de-strong" class="flex items-center gap-2 cursor-pointer"><input id="de-strong" type="checkbox"${attr("checked", isStrong, true)} class="w-4 h-4 rounded border-border-light text-primary focus:ring-primary"/> <span class="text-sm text-text-main">Bold</span></label></div></div></div></div>`);
	});
}
//#endregion
//#region src/lib/components/wizard/editors/NumberEditor.svelte
function NumberEditor($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { editScope = "all" } = $$props;
		let debounceTimer;
		function debouncedFetchPreview() {
			clearTimeout(debounceTimer);
			debounceTimer = window.setTimeout(() => {
				wizardStore.fetchPreview();
			}, 300);
		}
		function getSelectedPath(ensureLocal = false) {
			const selected = wizardStore.selectedComponent;
			if (!selected) return null;
			return wizardStore.getScopedTemplatePath(selected.templatePath, editScope, { ensureLocal });
		}
		function getNumberConfig() {
			const path = getSelectedPath();
			if (!path) return {};
			return wizardStore.getTemplateNode(path) ?? {};
		}
		function updateNumberProperty(path, value) {
			const selectedPath = getSelectedPath(editScope === "local");
			if (!selectedPath) return;
			wizardStore.updateStyleField(`${selectedPath}.${path}`, value);
			debouncedFetchPreview();
		}
		const componentType = wizardStore.selectedComponent?.componentType ?? "number";
		const config = getNumberConfig();
		const prefix = config.prefix ?? "";
		const suffix = config.suffix ?? "";
		const isEmph = config.emph ?? false;
		const isStrong = config.strong ?? false;
		const wrap = config.wrap ?? "none";
		$$renderer.push(`<div class="space-y-4 p-6 pt-4"><h3 class="font-semibold text-text-main">Number: <span class="capitalize">${escape_html(componentType)}</span></h3> <div class="grid grid-cols-2 gap-4"><div><label for="ne-prefix" class="block text-sm font-medium text-text-main mb-2">Prefix</label> <input id="ne-prefix" type="text"${attr("value", prefix)} placeholder="e.g. vol. " class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"/></div> <div><label for="ne-suffix" class="block text-sm font-medium text-text-main mb-2">Suffix</label> <input id="ne-suffix" type="text"${attr("value", suffix)} placeholder="e.g. , " class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"/></div></div> <div><label for="ne-wrap" class="block text-sm font-medium text-text-main mb-2">Wrap</label> `);
		$$renderer.select({
			id: "ne-wrap",
			value: wrap,
			onchange: (e) => updateNumberProperty("wrap", e.currentTarget.value),
			class: "w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
		}, ($$renderer) => {
			$$renderer.option({ value: "none" }, ($$renderer) => {
				$$renderer.push(`None`);
			});
			$$renderer.option({ value: "parentheses" }, ($$renderer) => {
				$$renderer.push(`Parentheses`);
			});
			$$renderer.option({ value: "brackets" }, ($$renderer) => {
				$$renderer.push(`Brackets`);
			});
		});
		$$renderer.push(`</div> <div><span class="block text-sm font-medium text-text-main mb-2">Style</span> <div class="flex gap-4"><label for="ne-emph" class="flex items-center gap-2 cursor-pointer"><input id="ne-emph" type="checkbox"${attr("checked", isEmph, true)} class="w-4 h-4 rounded border-border-light text-primary focus:ring-primary"/> <span class="text-sm text-text-main">Italic</span></label> <label for="ne-strong" class="flex items-center gap-2 cursor-pointer"><input id="ne-strong" type="checkbox"${attr("checked", isStrong, true)} class="w-4 h-4 rounded border-border-light text-primary focus:ring-primary"/> <span class="text-sm text-text-main">Bold</span></label></div></div></div>`);
	});
}
//#endregion
//#region src/lib/components/wizard/editors/VariableEditor.svelte
function VariableEditor($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { editScope = "all" } = $$props;
		function getSelectedPath(ensureLocal = false) {
			const selected = wizardStore.selectedComponent;
			if (!selected) return null;
			return wizardStore.getScopedTemplatePath(selected.templatePath, editScope, { ensureLocal });
		}
		function getVariableConfig() {
			const path = getSelectedPath();
			if (!path) return {};
			return wizardStore.getTemplateNode(path) ?? {};
		}
		const componentType = wizardStore.selectedComponent?.componentType ?? "variable";
		const config = getVariableConfig();
		const prefix = config.prefix ?? "";
		const suffix = config.suffix ?? "";
		const isEmph = config.emph ?? false;
		const isStrong = config.strong ?? false;
		const isSuppressed = config.suppress ?? false;
		$$renderer.push(`<div class="space-y-4 p-6 pt-4"><div class="flex items-center justify-between"><h3 class="font-semibold text-text-main">Field: <span class="capitalize">${escape_html(componentType)}</span></h3> <label for="ve-suppress" class="flex items-center gap-2 cursor-pointer"><input id="ve-suppress" type="checkbox"${attr("checked", isSuppressed, true)} class="w-4 h-4 rounded border-border-light text-red-600 focus:ring-red-500"/> <span class="text-xs font-medium text-text-secondary uppercase tracking-wider">Hide field</span></label></div> <div class="grid grid-cols-2 gap-4"><div><label for="ve-prefix" class="block text-sm font-medium text-text-main mb-2">Prefix</label> <input id="ve-prefix" type="text"${attr("value", prefix)} placeholder="e.g. , " class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"/></div> <div><label for="ve-suffix" class="block text-sm font-medium text-text-main mb-2">Suffix</label> <input id="ve-suffix" type="text"${attr("value", suffix)} placeholder="e.g. . " class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"/></div></div> <div><span class="block text-sm font-medium text-text-main mb-2">Style</span> <div class="flex gap-4"><label for="ve-emph" class="flex items-center gap-2 cursor-pointer"><input id="ve-emph" type="checkbox"${attr("checked", isEmph, true)} class="w-4 h-4 rounded border-border-light text-primary focus:ring-primary"/> <span class="text-sm text-text-main">Italic</span></label> <label for="ve-strong" class="flex items-center gap-2 cursor-pointer"><input id="ve-strong" type="checkbox"${attr("checked", isStrong, true)} class="w-4 h-4 rounded border-border-light text-primary focus:ring-primary"/> <span class="text-sm text-text-main">Bold</span></label></div></div></div>`);
	});
}
//#endregion
//#region src/lib/components/wizard/ComponentEditor.svelte
function ComponentEditor($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const contributorTypes = [
			"author",
			"editor",
			"translator"
		];
		const titleTypes = ["title", "container-title"];
		const dateTypes = ["issued", "accessed"];
		const numberTypes = [
			"volume",
			"issue",
			"pages",
			"edition",
			"citation-number",
			"report-number"
		];
		const variableTypes = [
			"doi",
			"url",
			"isbn",
			"publisher",
			"publisher-place"
		];
		let editScope = "all";
		let insertKind = "field";
		let insertValue = "doi";
		let groupDelimiter = "comma";
		const activeTypeLabel = wizardStore.activeRefType.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
		function getDisplayedTemplateRoot() {
			return wizardStore.getResolvedTemplateRoot() ?? {
				path: "bibliography.template",
				scope: "all",
				template: []
			};
		}
		function getDisplayedTemplate() {
			return getDisplayedTemplateRoot().template;
		}
		function getScopedSelectionPath(ensureLocal = false) {
			const selection = wizardStore.selectedComponent;
			if (!selection) return null;
			return wizardStore.getScopedTemplatePath(selection.templatePath, editScope, { ensureLocal });
		}
		function getScopedSelectionNode() {
			const path = getScopedSelectionPath();
			if (!path) return null;
			return wizardStore.getTemplateNode(path);
		}
		function updateGroupDelimiter(value) {
			const selectedPath = getScopedSelectionPath(editScope === "local");
			if (!selectedPath) return;
			wizardStore.updateStyleField(`${selectedPath}.delimiter`, value || void 0);
			wizardStore.fetchPreview();
		}
		const selectedNode = getScopedSelectionNode();
		const selectedPrefix = selectedNode?.prefix ?? "";
		const selectedSuffix = selectedNode?.suffix ?? "";
		const selectedSuppress = selectedNode?.suppress ?? false;
		const selectedEmph = selectedNode?.emph ?? false;
		const selectedStrong = selectedNode?.strong ?? false;
		const selectedDelimiter = selectedNode?.delimiter ?? groupDelimiter;
		function renderList($$renderer, list, parentPath, depth) {
			$$renderer.push(`<div${attr_class(`space-y-2 ${stringify(depth > 0 ? "mt-2 ml-4 border-l-2 border-border-light/50 pl-4" : "")}`)} role="list"${attr("aria-label", depth === 0 ? "Template components" : "Grouped components")}>`);
			if (list.length === 0) {
				$$renderer.push("<!--[-->");
				$$renderer.push(`<div class="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-10 text-center transition-all hover:border-primary/30"><div class="mb-4 flex size-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition-transform group-hover:scale-110"><span class="material-symbols-outlined text-2xl">add_circle</span></div> <p class="text-sm font-semibold text-slate-700">Empty Group</p> <p class="mt-1 max-w-[200px] text-xs leading-relaxed text-slate-500 mx-auto">No components here yet. Add a field, term, or nested group below to start building.</p></div>`);
			} else $$renderer.push("<!--[!-->");
			$$renderer.push(`<!--]--> <!--[-->`);
			const each_array = ensure_array_like(list);
			for (let index = 0, $$length = each_array.length; index < $$length; index++) {
				let component = each_array[index];
				const currentPath = `${parentPath}.${index}`;
				const type = getComponentType(component);
				const isSelected = wizardStore.selectedComponent?.templatePath === currentPath;
				$$renderer.push(`<div${attr("data-template-path", currentPath)} draggable="true" role="listitem"${attr_class(`group relative flex flex-col rounded-xl border transition-all ${stringify(isSelected ? "border-primary bg-blue-50/20 ring-1 ring-primary/10 shadow-sm" : "border-slate-200 bg-white hover:border-primary/20 hover:shadow-md")}`)}${attr_style(`margin-left: ${stringify(depth > 0 ? "2rem" : "0")}`)}>`);
				if (depth > 0) {
					$$renderer.push("<!--[-->");
					$$renderer.push(`<div class="absolute -left-5 top-0 bottom-0 w-5 border-l-2 border-slate-200/50 group-hover:border-primary/20"></div> <div class="absolute -left-5 top-6 w-5 border-t-2 border-slate-200/50 group-hover:border-primary/20 rounded-tl-lg"></div>`);
				} else $$renderer.push("<!--[!-->");
				$$renderer.push(`<!--]--> <div class="flex items-center gap-3 px-3 py-2.5"><span class="material-symbols-outlined cursor-grab text-slate-300 transition-colors group-hover:text-slate-400 active:cursor-grabbing">drag_indicator</span> <div${attr_class(`flex size-9 items-center justify-center rounded-lg shadow-sm transition-all ${stringify(isSelected ? "bg-primary text-white scale-110 shadow-lg shadow-primary/30 ring-2 ring-white" : type === "contributor" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" : type === "date" ? "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300" : type === "title" ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" : type === "number" ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400")}`)}><span class="material-symbols-outlined text-xl">`);
				if (type === "field") {
					$$renderer.push("<!--[-->");
					$$renderer.push(`description`);
				} else {
					$$renderer.push("<!--[!-->");
					if (type === "term") {
						$$renderer.push("<!--[-->");
						$$renderer.push(`translate`);
					} else {
						$$renderer.push("<!--[!-->");
						if (type === "group") {
							$$renderer.push("<!--[-->");
							$$renderer.push(`folder_open`);
						} else {
							$$renderer.push("<!--[!-->");
							if (type === "date") {
								$$renderer.push("<!--[-->");
								$$renderer.push(`event`);
							} else {
								$$renderer.push("<!--[!-->");
								if (type === "contributor") {
									$$renderer.push("<!--[-->");
									$$renderer.push(`group`);
								} else {
									$$renderer.push("<!--[!-->");
									if (type === "title") {
										$$renderer.push("<!--[-->");
										$$renderer.push(`title`);
									} else {
										$$renderer.push("<!--[!-->");
										if (type === "number") {
											$$renderer.push("<!--[-->");
											$$renderer.push(`format_list_numbered`);
										} else {
											$$renderer.push("<!--[!-->");
											$$renderer.push(`extension`);
										}
										$$renderer.push(`<!--]-->`);
									}
									$$renderer.push(`<!--]-->`);
								}
								$$renderer.push(`<!--]-->`);
							}
							$$renderer.push(`<!--]-->`);
						}
						$$renderer.push(`<!--]-->`);
					}
					$$renderer.push(`<!--]-->`);
				}
				$$renderer.push(`<!--]--></span></div> <button type="button" class="min-w-0 flex-1 text-left"><span${attr_class(`block truncate text-sm font-semibold transition-colors ${stringify(isSelected ? "text-primary" : "text-slate-700 group-hover:text-slate-900")}`)}>${escape_html(getComponentLabel(component))}</span> <span class="block text-[10px] uppercase tracking-wider text-slate-400">${escape_html(type)}</span></button> <div class="flex items-center gap-1"><button type="button"${attr_class(`rounded p-1 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 ${stringify(component.suppress ? "text-red-400" : "")}`)}${attr("title", component.suppress ? "Show element" : "Hide element")}><span class="material-symbols-outlined text-lg">${escape_html(component.suppress ? "visibility_off" : "visibility")}</span></button> <button type="button" class="rounded p-1 text-slate-300 transition-all hover:bg-red-50 hover:text-red-500" title="Delete"><span class="material-symbols-outlined text-lg">delete</span></button></div></div> `);
				if (Array.isArray(component.items)) {
					$$renderer.push("<!--[-->");
					$$renderer.push(`<div class="px-1 pb-2">`);
					renderList($$renderer, component.items, `${currentPath}.items`, depth + 1);
					$$renderer.push(`<!----></div>`);
				} else $$renderer.push("<!--[!-->");
				$$renderer.push(`<!--]--></div>`);
			}
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<div class="rounded-lg border border-border-light bg-surface-light">`);
		if (!wizardStore.selectedComponent) {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<div class="border-b border-border-light bg-background-light p-4 sm:p-6"><div class="mb-4 flex items-center justify-between gap-3"><h3 class="flex items-center gap-2 text-sm font-semibold text-text-main"><span>Component Array</span> <span class="hidden rounded border border-border-light bg-surface-light px-2 py-0.5 text-xs font-normal text-text-secondary sm:inline-block">${escape_html(getDisplayedTemplateRoot().path)}</span></h3> <span class="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">${escape_html(getDisplayedTemplateRoot().scope === "local" ? `${activeTypeLabel} override` : "All types")}</span></div> <div class="mb-6 rounded-lg border border-blue-100 bg-blue-50/50 p-4"><h4 class="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary"><span class="material-symbols-outlined text-sm">info</span> Structure Guide</h4> <p class="text-xs leading-relaxed text-slate-600">This tree represents the order and nesting of your citation elements. <strong class="text-slate-900">Drag</strong> to reorder, <strong class="text-slate-900">click</strong> to customize fields, or use the <strong class="text-slate-900">Hide</strong> icon to skip variables.</p></div> <div class="rounded-lg border border-border-light bg-white p-2 min-h-[100px] shadow-inner">`);
			renderList($$renderer, getDisplayedTemplate(), getDisplayedTemplateRoot().path, 0);
			$$renderer.push(`<!----></div> <div class="mt-4 rounded-lg border border-dashed border-border-light bg-white p-3"><div class="flex flex-wrap gap-3 sm:grid sm:grid-cols-[1fr_1fr_auto]">`);
			$$renderer.select({
				value: insertKind,
				class: "min-w-[120px] flex-1 rounded border border-border-light bg-surface-light px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
			}, ($$renderer) => {
				$$renderer.option({ value: "field" }, ($$renderer) => {
					$$renderer.push(`Field`);
				});
				$$renderer.option({ value: "term" }, ($$renderer) => {
					$$renderer.push(`Localized term`);
				});
				$$renderer.option({ value: "group" }, ($$renderer) => {
					$$renderer.push(`Group`);
				});
			});
			$$renderer.push(` <input type="text"${attr("value", insertValue)}${attr("disabled", insertKind === "group", true)}${attr("placeholder", "doi")} class="min-w-[120px] flex-1 rounded border border-border-light bg-surface-light px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"/> <button type="button" class="w-full rounded bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:opacity-90 active:scale-[0.98] sm:w-auto">Append</button></div> <p class="mt-2 text-[10px] text-text-secondary">Select a type and enter a variable name (like 'doi', 'url', or 'publisher') then click
					Append.</p></div></div>`);
		} else {
			$$renderer.push("<!--[!-->");
			$$renderer.push(`<div class="border-b border-border-light bg-background-light/50 p-2"><div class="flex flex-wrap items-center justify-between gap-3"><div class="flex items-center gap-1"><button type="button" title="Move earlier" class="rounded p-1.5 text-text-main transition-colors hover:bg-surface-light"><span class="material-symbols-outlined text-xl">arrow_back</span></button> <button type="button" title="Move later" class="rounded p-1.5 text-text-main transition-colors hover:bg-surface-light"><span class="material-symbols-outlined text-xl">arrow_forward</span></button></div> <div class="flex items-center gap-1 rounded-md border border-border-light bg-surface-light p-1"><button type="button"${attr_class(`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${stringify("bg-primary text-white" )}`)}>All types</button> <button type="button"${attr_class(`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${stringify("text-text-secondary hover:text-text-main")}`)}>${escape_html(activeTypeLabel)}</button></div> <div class="flex items-center gap-2"><button type="button" class="rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 transition-colors hover:bg-slate-100">${escape_html(selectedSuppress ? "Show" : "Hide")}</button> <button type="button" title="Remove component" class="rounded p-1.5 text-red-500 transition-colors hover:bg-red-50"><span class="material-symbols-outlined text-xl">delete</span></button></div></div></div> <div class="border-b border-border-light bg-white px-6 py-4"><p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Editing</p> <p class="mt-1 text-sm font-medium text-text-main">${escape_html(getComponentLabel(selectedNode))}</p> <p class="mt-1 text-xs text-text-secondary">${escape_html("Applies to all reference types")}</p></div> `);
			if (contributorTypes.includes(wizardStore.selectedComponent.componentType)) {
				$$renderer.push("<!--[-->");
				ContributorEditor($$renderer, { editScope });
			} else {
				$$renderer.push("<!--[!-->");
				if (titleTypes.includes(wizardStore.selectedComponent.componentType)) {
					$$renderer.push("<!--[-->");
					TitleEditor($$renderer, { editScope });
				} else {
					$$renderer.push("<!--[!-->");
					if (dateTypes.includes(wizardStore.selectedComponent.componentType)) {
						$$renderer.push("<!--[-->");
						DateEditor($$renderer, { editScope });
					} else {
						$$renderer.push("<!--[!-->");
						if (numberTypes.includes(wizardStore.selectedComponent.componentType)) {
							$$renderer.push("<!--[-->");
							NumberEditor($$renderer, { editScope });
						} else {
							$$renderer.push("<!--[!-->");
							if (variableTypes.includes(wizardStore.selectedComponent.componentType)) {
								$$renderer.push("<!--[-->");
								VariableEditor($$renderer, { editScope });
							} else {
								$$renderer.push("<!--[!-->");
								if (wizardStore.selectedComponent.componentType === "group") {
									$$renderer.push("<!--[-->");
									$$renderer.push(`<div class="space-y-4 p-6 pt-4"><h3 class="font-semibold text-text-main">Group Formatting</h3> <div><label for="group-delimiter" class="mb-2 block text-sm font-medium text-text-main">Delimiter</label> `);
									$$renderer.select({
										id: "group-delimiter",
										value: selectedDelimiter,
										onchange: (event) => updateGroupDelimiter(event.currentTarget.value),
										class: "w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
									}, ($$renderer) => {
										$$renderer.option({ value: "comma" }, ($$renderer) => {
											$$renderer.push(`Comma`);
										});
										$$renderer.option({ value: "space" }, ($$renderer) => {
											$$renderer.push(`Space`);
										});
										$$renderer.option({ value: "period" }, ($$renderer) => {
											$$renderer.push(`Period`);
										});
										$$renderer.option({ value: "semicolon" }, ($$renderer) => {
											$$renderer.push(`Semicolon`);
										});
										$$renderer.option({ value: "none" }, ($$renderer) => {
											$$renderer.push(`None`);
										});
									});
									$$renderer.push(`</div> <div class="grid gap-4 sm:grid-cols-2"><div><label for="group-prefix" class="mb-2 block text-sm font-medium text-text-main">Prefix</label> <input id="group-prefix" type="text"${attr("value", selectedPrefix)} class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"/></div> <div><label for="group-suffix" class="mb-2 block text-sm font-medium text-text-main">Suffix</label> <input id="group-suffix" type="text"${attr("value", selectedSuffix)} class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"/></div></div> <div class="rounded-lg border border-dashed border-border-light bg-background-light/40 p-3"><div class="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">`);
									$$renderer.select({
										value: insertKind,
										class: "rounded border border-border-light bg-surface-light px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
									}, ($$renderer) => {
										$$renderer.option({ value: "field" }, ($$renderer) => {
											$$renderer.push(`Field`);
										});
										$$renderer.option({ value: "term" }, ($$renderer) => {
											$$renderer.push(`Localized term`);
										});
										$$renderer.option({ value: "group" }, ($$renderer) => {
											$$renderer.push(`Nested group`);
										});
									});
									$$renderer.push(` <input type="text"${attr("value", insertValue)}${attr("disabled", insertKind === "group", true)}${attr("placeholder", "doi")} class="rounded border border-border-light bg-surface-light px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"/> <button type="button" class="rounded bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">Insert After</button></div></div></div>`);
								} else {
									$$renderer.push("<!--[!-->");
									if (wizardStore.selectedComponent.componentType === "term") {
										$$renderer.push("<!--[-->");
										$$renderer.push(`<div class="space-y-4 p-6 pt-4"><h3 class="font-semibold text-text-main">Localized Term</h3> <div class="grid gap-4 sm:grid-cols-2"><div><label for="term-prefix" class="mb-2 block text-sm font-medium text-text-main">Prefix</label> <input id="term-prefix" type="text"${attr("value", selectedPrefix)} class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"/></div> <div><label for="term-suffix" class="mb-2 block text-sm font-medium text-text-main">Suffix</label> <input id="term-suffix" type="text"${attr("value", selectedSuffix)} class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"/></div></div> <div><span class="mb-2 block text-sm font-medium text-text-main">Style</span> <div class="flex gap-4"><label for="term-emph" class="flex items-center gap-2 cursor-pointer"><input id="term-emph" type="checkbox"${attr("checked", selectedEmph, true)} class="h-4 w-4 rounded border-border-light text-primary focus:ring-primary"/> <span class="text-sm text-text-main">Italic</span></label> <label for="term-strong" class="flex items-center gap-2 cursor-pointer"><input id="term-strong" type="checkbox"${attr("checked", selectedStrong, true)} class="h-4 w-4 rounded border-border-light text-primary focus:ring-primary"/> <span class="text-sm text-text-main">Bold</span></label></div></div></div>`);
									} else {
										$$renderer.push("<!--[!-->");
										$$renderer.push(`<div class="p-6 text-sm text-text-secondary"><p>Editor for <span class="font-medium">${escape_html(wizardStore.selectedComponent.componentType)}</span> is not available yet. You can still move, hide, delete, or adjust delimiters from the component
					array.</p></div>`);
									}
									$$renderer.push(`<!--]-->`);
								}
								$$renderer.push(`<!--]-->`);
							}
							$$renderer.push(`<!--]-->`);
						}
						$$renderer.push(`<!--]-->`);
					}
					$$renderer.push(`<!--]-->`);
				}
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/lib/components/wizard/TypeSelector.svelte
function TypeSelector($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const refTypes = [
			{
				id: "article-journal",
				label: "Article"
			},
			{
				id: "book",
				label: "Book"
			},
			{
				id: "chapter",
				label: "Chapter"
			},
			{
				id: "report",
				label: "Report"
			},
			{
				id: "thesis",
				label: "Thesis"
			},
			{
				id: "webpage",
				label: "Web page"
			}
		];
		$$renderer.push(`<div class="flex gap-1 border-b border-border-light overflow-x-auto"><!--[-->`);
		const each_array = ensure_array_like(refTypes);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let type = each_array[$$index];
			$$renderer.push(`<button${attr_class(`px-3 py-2 text-sm whitespace-nowrap transition-colors ${stringify(wizardStore.activeRefType === type.id ? "text-primary border-b-2 border-primary font-medium" : "text-text-secondary hover:text-text-main")}`)}>${escape_html(type.label)}</button>`);
		}
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/lib/components/wizard/VisualCustomizer.svelte
function VisualCustomizer($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let activeTab = "structure";
		wizardStore.getOptions();
		$$renderer.push(`<div class="min-h-screen w-full bg-[#fafaf9] text-slate-900"><header class="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none font-headline"><div class="flex items-center gap-8"><div class="flex items-center gap-6"><a href="/" class="text-xl font-bold tracking-tighter text-primary dark:text-blue-500 hover:opacity-80 transition-opacity">Citum Style Wizard</a> <nav class="hidden lg:flex items-center gap-4"><a href="/" class="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors duration-200">Home</a> <a href="/library/browse" class="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors duration-200">Browse</a></nav></div> <nav class="hidden md:flex items-center gap-6"><button class="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-sm font-medium transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1 rounded">Quick Start</button> <button class="text-primary dark:text-blue-400 border-b-2 border-primary dark:border-blue-400 pb-1 text-sm font-medium transition-colors duration-200 px-3 py-1">Advanced</button></nav></div> <div class="flex items-center gap-4"><button class="bg-primary text-white px-4 py-2 text-sm font-semibold rounded hover:bg-blue-700 active:opacity-80 active:scale-95 transition-all shadow-sm">Review &amp; Save</button></div></header> <main class="font-body"><div class="grid min-h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)]"><aside class="border-b border-slate-200 bg-slate-50 py-4 font-headline lg:border-b-0 lg:border-r dark:border-slate-800 dark:bg-slate-950"><div class="mt-2 mb-8 px-6"><h2 class="mb-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Step 4 of 4</h2> <p class="text-xs font-bold text-slate-800 dark:text-slate-300">Style Editor</p></div> <nav class="space-y-1"><button${attr_class(`w-full flex items-center gap-3 px-6 py-3 text-xs uppercase tracking-widest font-bold transition-colors ${stringify("border-r-4 border-primary bg-blue-50 text-primary dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300" )}`)}><span class="material-symbols-outlined text-lg">schema</span> Structure</button> <button${attr_class(`w-full flex items-center gap-3 px-6 py-3 text-xs uppercase tracking-widest font-bold transition-colors ${stringify("text-slate-500 hover:bg-slate-100")}`)}><span class="material-symbols-outlined text-lg">format_quote</span> Punctuation</button> <button${attr_class(`w-full flex items-center gap-3 px-6 py-3 text-xs uppercase tracking-widest font-bold transition-colors ${stringify("text-slate-500 hover:bg-slate-100")}`)}><span class="material-symbols-outlined text-lg">group</span> Authors</button> <button${attr_class(`w-full flex items-center gap-3 px-6 py-3 text-xs uppercase tracking-widest font-bold transition-colors ${stringify("text-slate-500 hover:bg-slate-100")}`)}><span class="material-symbols-outlined text-lg">event</span> Dates</button> <button${attr_class(`w-full flex items-center gap-3 px-6 py-3 text-xs uppercase tracking-widest font-bold transition-colors ${stringify("text-slate-500 hover:bg-slate-100")}`)}><span class="material-symbols-outlined text-lg">title</span> Titles</button></nav> <div class="mt-8 border-t border-slate-200 px-6 pt-4 dark:border-slate-800"><button class="flex w-full items-center justify-center gap-2 rounded bg-slate-800 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-slate-900"><span class="material-symbols-outlined text-sm">download</span> Export Style</button> <button class="mt-4 flex w-full items-center justify-center gap-2 text-[10px] font-bold text-slate-400 transition-colors hover:text-slate-600"><span class="material-symbols-outlined text-sm">arrow_back</span> BACK TO START</button></div></aside> <div class="grid min-h-0 grid-cols-1 xl:grid-cols-[45%_55%]"><section class="border-r border-slate-200 bg-stone-50/30 p-6 sm:p-8"><div class="max-w-md mx-auto w-full"><header class="mb-8"><div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2"><span class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">${escape_html(activeTab)}</span> <span class="material-symbols-outlined text-[10px]">arrow_forward</span> <span class="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-400 border border-blue-100 dark:border-blue-800">${escape_html(wizardStore.activeRefType.replace("-", " "))}</span></div> <h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">${escape_html(activeTab.charAt(0).toUpperCase() + activeTab.slice(1))} Editor</h1> <p class="text-sm text-slate-500 mt-2 leading-relaxed">`);
		{
			$$renderer.push("<!--[-->");
			$$renderer.push(`Arrange fields and groups to define the citation layout for <span class="font-semibold">${escape_html(wizardStore.activeRefType)}</span>.`);
		}
		$$renderer.push(`<!--]--></p></header> <div class="mb-6">`);
		TypeSelector($$renderer);
		$$renderer.push(`<!----></div> <div class="w-full">`);
		{
			$$renderer.push("<!--[-->");
			ComponentEditor($$renderer);
		}
		$$renderer.push(`<!--]--></div> <div class="flex gap-2 mt-6"><button${attr("disabled", !wizardStore.canUndo, true)} class="flex-1 rounded border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors flex justify-center items-center"><span class="material-symbols-outlined inline mr-1 text-base">undo</span> Undo</button> <button${attr("disabled", !wizardStore.canRedo, true)} class="flex-1 rounded border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors flex justify-center items-center"><span class="material-symbols-outlined inline mr-1 text-base">redo</span> Redo</button></div></div></section> <section class="flex flex-col items-center bg-stone-100 p-8 lg:p-12"><div class="w-full max-w-2xl"><div class="flex items-center justify-between mb-4 w-full px-2"><span class="text-xs font-bold uppercase tracking-widest text-slate-400">Live Preview</span></div> <div class="bg-white shadow-lg rounded-lg p-10 lg:p-16 min-h-[500px] border border-stone-200 live-preview-content"><div class="border-b border-stone-100 pb-6 mb-8 text-center"><h4 class="text-stone-400 text-xs font-bold tracking-widest uppercase mb-2 font-headline">Bibliography</h4> <div class="h-0.5 w-8 bg-primary mx-auto"></div></div> `);
		InteractivePreview($$renderer);
		$$renderer.push(`<!----></div></div></section></div></div></main></div>`);
	});
}
//#endregion
//#region src/routes/create/customize/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		VisualCustomizer($$renderer);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte-10Ui70XR.js.map
