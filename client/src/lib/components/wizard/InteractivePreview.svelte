<script lang="ts">
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import {
		isNoteBranch,
		shouldShowBibliographyPreview,
		shouldShowNarrativePreview,
		type WizardBranch,
	} from "$lib/types/wizard";

	let containerRef: HTMLDivElement | undefined = $state();
	let tooltipPos = $state({ x: 0, y: 0 });
	let tooltipInfo = $state<{ type: string; label: string } | null>(null);

	const branch = $derived(wizardStore.branch);
	const showParenthetical = $derived(branch === "author-date" || branch === "numeric");
	const showNarrative = $derived(shouldShowNarrativePreview(branch));
	const showNote = $derived(isNoteBranch(branch));
	const showBibliography = $derived(
		shouldShowBibliographyPreview(branch, wizardStore.styleIntent.has_bibliography)
	);

	function inTextLabel(activeBranch: WizardBranch | null): string {
		return activeBranch === "numeric" ? "In-Text Citation" : "Parenthetical Citation";
	}

	function noteHeading(activeBranch: WizardBranch | null): string {
		return activeBranch === "note-law" ? "Legal Footnote" : "First Note";
	}

	function repeatNoteHeading(activeBranch: WizardBranch | null): string {
		return activeBranch === "note-law" ? "Short-Form Footnote" : "Repeat Note";
	}

	function bibliographyHeading(activeBranch: WizardBranch | null): string {
		return activeBranch === "note-law" ? "Authorities / Reference List" : "Bibliography";
	}

	function getComponentInfo(
		el: HTMLElement
	): { type: string; label: string; index: number | null } | null {
		const classes = Array.from(el.classList);
		const cslnClass = classes.find(
			(c) =>
				c.startsWith("csln-") &&
				c !== "csln-entry" &&
				c !== "csln-bibliography" &&
				c !== "csln-citation"
		);
		if (!cslnClass) return null;

		const indexStr = el.getAttribute("data-index");
		const index = indexStr ? parseInt(indexStr) : null;

		const type = cslnClass.replace("csln-", "");
		const labels: Record<string, string> = {
			author: "Author",
			editor: "Editor",
			translator: "Translator",
			title: "Title",
			"container-title": "Journal/Book Title",
			issued: "Date",
			accessed: "Access Date",
			volume: "Volume",
			issue: "Issue",
			pages: "Pages",
			doi: "DOI",
			url: "URL",
			publisher: "Publisher",
			"citation-number": "Number",
			edition: "Edition",
		};
		return { type, label: labels[type] || type.replace(/-/g, " "), index };
	}

	function handleInteraction(e: MouseEvent | KeyboardEvent) {
		const target = e.target as HTMLElement;
		const cslnEl = target.closest('[class*="csln-"]') as HTMLElement;

		if (
			!cslnEl ||
			cslnEl.classList.contains("csln-entry") ||
			cslnEl.classList.contains("csln-bibliography")
		) {
			if (e.type === "mousemove") tooltipInfo = null;
			return;
		}

		const info = getComponentInfo(cslnEl);
		if (!info) return;

		if (e.type === "mousemove") {
			tooltipInfo = info;
			const rect = cslnEl.getBoundingClientRect();
			tooltipPos = { x: rect.left + rect.width / 2, y: rect.top - 5 };
		} else if (e.type === "click") {
			e.stopPropagation();
			const selection = wizardStore.resolvePreviewSelection(info.type, info.index);
			if (selection) {
				wizardStore.setSelectedComponent(selection);
			}
		}
	}

	// Update selected state highlighting
	$effect(() => {
		if (!containerRef) return;
		const selected = wizardStore.selectedComponent;

		// Clear all selections
		containerRef
			.querySelectorAll(".csln-selected")
			.forEach((el) => el.classList.remove("csln-selected"));

		if (selected?.astIndex !== null && selected?.astIndex !== undefined) {
			containerRef.querySelectorAll(`[data-index="${selected.astIndex}"]`).forEach((el) => {
				el.classList.add("csln-selected");
			});
		}
	});

	$effect(() => {
		// Add interactive class to elements for CSS styling
		if (
			containerRef &&
			(wizardStore.previewHtml.parenthetical ||
				wizardStore.previewHtml.narrative ||
				wizardStore.previewHtml.note ||
				wizardStore.previewHtml.noteRepeat ||
				wizardStore.previewHtml.bibliography)
		) {
			const elements = containerRef.querySelectorAll('[class^="csln-"]');
			elements.forEach((el) => {
				if (!el.classList.contains("csln-entry") && !el.classList.contains("csln-bibliography")) {
					el.classList.add("csln-interactive");
				}
			});
		}
	});
</script>

<div class="rounded-lg border border-border-light bg-surface-light overflow-hidden">
	{#if wizardStore.isLoading}
		<div class="flex items-center justify-center gap-2 p-8">
			<span class="material-symbols-outlined animate-spin text-primary">hourglass</span>
			<span class="text-text-secondary">Loading preview...</span>
		</div>
	{:else if wizardStore.error}
		<div class="space-y-2 rounded bg-red-50 p-4">
			<p class="font-semibold text-red-700">Preview Error</p>
			<p class="text-sm text-red-600">{wizardStore.error}</p>
		</div>
	{:else}
		<div class="p-6">
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div
				bind:this={containerRef}
				class="space-y-6 focus:outline-none"
				role="region"
				aria-label="Citation Preview"
				aria-live="polite"
				tabindex="0"
				onmousemove={handleInteraction}
				onclick={handleInteraction}
				onkeydown={(e: KeyboardEvent) => {
					if (e.key === "Enter" || e.key === " ") {
						handleInteraction(e);
					}
				}}
				onmouseleave={() => (tooltipInfo = null)}
			>
				{#if showParenthetical && wizardStore.previewHtml.parenthetical}
					<div class="space-y-2">
						<h4 class="font-semibold text-text-main text-sm">{inTextLabel(branch)}</h4>
						<div
							class="interactive-preview rounded bg-background-light p-3 font-serif text-text-main"
						>
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html wizardStore.previewHtml.parenthetical}
						</div>
					</div>
				{/if}

				{#if showNarrative && wizardStore.previewHtml.narrative}
					<div class="space-y-2">
						<h4 class="font-semibold text-text-main text-sm">Narrative Citation</h4>
						<div
							class="interactive-preview rounded bg-background-light p-3 font-serif text-text-main"
						>
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html wizardStore.previewHtml.narrative}
						</div>
					</div>
				{/if}

				{#if showNote && wizardStore.previewHtml.note}
					<div class="space-y-2">
						<h4 class="font-semibold text-text-main text-sm">{noteHeading(branch)}</h4>
						<div
							class="interactive-preview rounded bg-background-light p-3 font-serif text-text-main"
						>
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html wizardStore.previewHtml.note}
						</div>
					</div>
				{/if}

				{#if showNote && wizardStore.previewHtml.noteRepeat}
					<div class="space-y-2">
						<h4 class="font-semibold text-text-main text-sm">{repeatNoteHeading(branch)}</h4>
						<div
							class="interactive-preview rounded bg-background-light p-3 font-serif text-text-main"
						>
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html wizardStore.previewHtml.noteRepeat}
						</div>
					</div>
				{/if}

				{#if showBibliography && wizardStore.previewHtml.bibliography}
					<div class="space-y-2">
						<h4 class="font-semibold text-text-main text-sm">{bibliographyHeading(branch)}</h4>
						<div
							class="interactive-preview rounded bg-background-light p-4 font-serif text-sm text-text-main"
						>
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html wizardStore.previewHtml.bibliography}
						</div>
					</div>
				{:else if !wizardStore.previewHtml.parenthetical && !wizardStore.previewHtml.narrative && !wizardStore.previewHtml.note && !wizardStore.previewHtml.noteRepeat && !wizardStore.previewHtml.bibliography}
					<div class="text-center py-8">
						<p class="text-text-secondary">No preview available yet</p>
					</div>
				{/if}
			</div>
		</div>

		{#if tooltipInfo}
			<div
				class="fixed pointer-events-none bg-gray-800 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap z-50 -translate-y-full -translate-x-1/2"
				style="left: {tooltipPos.x}px; top: {tooltipPos.y}px; transform: translateY(-100%) translateX(-50%);"
			>
				{tooltipInfo.label}
				<div
					class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"
				></div>
			</div>
		{/if}
	{/if}
</div>

<style>
	:global(.csln-interactive) {
		cursor: pointer;
		border-radius: 2px;
		transition: all 0.15s ease;
	}

	:global(.csln-interactive:hover) {
		outline: 2px solid rgba(19, 91, 236, 0.3);
		outline-offset: 1px;
		background: rgba(19, 91, 236, 0.05);
	}

	:global(.csln-selected) {
		outline: 3px solid #135bec;
		outline-offset: 2px;
		background: rgba(19, 91, 236, 0.15);
		box-shadow: 0 0 15px rgba(19, 91, 236, 0.2);
	}

	/* Type-specific hover colors in preview */
	:global(.csln-author:hover),
	:global(.csln-editor:hover),
	:global(.csln-translator:hover) {
		background: rgba(16, 185, 129, 0.15);
		border-radius: 4px;
	}
	:global(.csln-issued:hover),
	:global(.csln-accessed:hover) {
		background: rgba(249, 115, 22, 0.15);
		border-radius: 4px;
	}
	:global(.csln-title:hover),
	:global(.csln-container-title:hover) {
		background: rgba(168, 85, 247, 0.15);
		border-radius: 4px;
	}
	:global(.csln-volume:hover),
	:global(.csln-issue:hover),
	:global(.csln-pages:hover) {
		background: rgba(99, 102, 241, 0.15);
		border-radius: 4px;
	}
	:global(.csln-doi:hover),
	:global(.csln-url:hover) {
		background: rgba(14, 165, 233, 0.15);
		border-radius: 4px;
	}

	:global(.interactive-preview) {
		font-family: var(--font-serif);
	}
</style>
