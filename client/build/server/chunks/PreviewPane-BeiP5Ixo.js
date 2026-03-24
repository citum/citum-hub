import { X as escape_html, Z as attr_class, $ as html } from './exports-B4Nj0tM2.js';
import { w as wizardStore } from './wizard.svelte-BuKwCymi.js';

//#region src/lib/components/wizard/PreviewPane.svelte
function PreviewPane($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const { activeHighlight = null } = $$props;
		const showParenthetical = wizardStore.family === "author-date" || wizardStore.family === "numeric";
		const showNarrative = wizardStore.family === "author-date";
		const showNote = wizardStore.family === "note";
		const showBibliography = wizardStore.family !== "numeric";
		$$renderer.push(`<div class="rounded-lg border border-border-light bg-surface-light">`);
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
				$$renderer.push(`<div${attr_class(`space-y-6 p-6 ${activeHighlight === "contributors" ? "highlight-contributors" : ""}`)}>`);
				if (showParenthetical && wizardStore.previewHtml.parenthetical) {
					$$renderer.push("<!--[-->");
					$$renderer.push(`<div class="space-y-2"><h4 class="font-semibold text-text-main">Parenthetical Citation</h4> <div class="live-preview-content rounded bg-background-light p-3 font-serif text-text-main">${html(wizardStore.previewHtml.parenthetical)}</div></div>`);
				} else $$renderer.push("<!--[!-->");
				$$renderer.push(`<!--]--> `);
				if (showNarrative && wizardStore.previewHtml.narrative) {
					$$renderer.push("<!--[-->");
					$$renderer.push(`<div class="space-y-2"><h4 class="font-semibold text-text-main">Narrative Citation</h4> <div class="live-preview-content rounded bg-background-light p-3 font-serif text-text-main">${html(wizardStore.previewHtml.narrative)}</div></div>`);
				} else $$renderer.push("<!--[!-->");
				$$renderer.push(`<!--]--> `);
				if (showNote && wizardStore.previewHtml.note) {
					$$renderer.push("<!--[-->");
					$$renderer.push(`<div class="space-y-2"><h4 class="font-semibold text-text-main">Footnote</h4> <div class="live-preview-content rounded bg-background-light p-3 font-serif text-text-main">${html(wizardStore.previewHtml.note)}</div></div>`);
				} else $$renderer.push("<!--[!-->");
				$$renderer.push(`<!--]--> `);
				if (showBibliography && wizardStore.previewHtml.bibliography) {
					$$renderer.push("<!--[-->");
					$$renderer.push(`<div class="space-y-2"><h4 class="font-semibold text-text-main">Bibliography</h4> <div class="live-preview-content rounded bg-background-light p-3 font-serif text-sm text-text-main">${html(wizardStore.previewHtml.bibliography)}</div></div>`);
				} else $$renderer.push("<!--[!-->");
				$$renderer.push(`<!--]--> `);
				if (!wizardStore.previewHtml.parenthetical && !wizardStore.previewHtml.narrative && !wizardStore.previewHtml.note && !wizardStore.previewHtml.bibliography) {
					$$renderer.push("<!--[-->");
					$$renderer.push(`<div class="text-center py-8"><p class="text-text-secondary">No preview available yet</p></div>`);
				} else $$renderer.push("<!--[!-->");
				$$renderer.push(`<!--]--></div>`);
			}
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--></div>`);
	});
}

export { PreviewPane as P };
//# sourceMappingURL=PreviewPane-BeiP5Ixo.js.map
