<script lang="ts">
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import { LoaderCircle } from "lucide-svelte";

	let containerRef: HTMLDivElement | undefined = $state();
	let tooltipPos = $state({ x: 0, y: 0 });
	let tooltipInfo = $state<{ type: string; label: string } | null>(null);

	const showParenthetical = $derived(
		wizardStore.family === "author-date" || wizardStore.family === "numeric"
	);
	const showNarrative = $derived(wizardStore.family === "author-date");
	const showNote = $derived(wizardStore.family === "note");
	const showBibliography = $derived(true);
	const citationHeading = $derived(
		wizardStore.family === "numeric" ? "Citation" : "Parenthetical Citation"
	);
	const noteHeading = $derived("Note");

	function getComponentInfo(
		el: HTMLElement
	): { type: string; label: string; index: number | null } | null {
		const classes = Array.from(el.classList);
		const cslnClass = classes.find(
			(c) =>
				c.startsWith("citum-") &&
				c !== "citum-entry" &&
				c !== "citum-bibliography" &&
				c !== "citum-citation"
		);
		if (!cslnClass) return null;

		const indexStr = el.getAttribute("data-index");
		const index = indexStr ? parseInt(indexStr) : null;

		const type = cslnClass.replace("citum-", "");
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
		const cslnEl = target.closest('[class*="citum-"]') as HTMLElement;

		if (
			!cslnEl ||
			cslnEl.classList.contains("citum-entry") ||
			cslnEl.classList.contains("citum-bibliography")
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
			.querySelectorAll(".citum-selected")
			.forEach((el) => el.classList.remove("citum-selected"));

		if (selected?.astIndex !== null && selected?.astIndex !== undefined) {
			containerRef.querySelectorAll(`[data-index="${selected.astIndex}"]`).forEach((el) => {
				el.classList.add("citum-selected");
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
				wizardStore.previewHtml.bibliography)
		) {
			const elements = containerRef.querySelectorAll('[class^="citum-"]');
			elements.forEach((el) => {
				if (!el.classList.contains("citum-entry") && !el.classList.contains("citum-bibliography")) {
					el.classList.add("citum-interactive");
				}
			});
		}
	});
</script>

<div class="rounded-lg border border-border-light bg-surface-light overflow-hidden">
	{#if wizardStore.isLoading}
		<div class="flex items-center justify-center gap-2 p-8">
			<LoaderCircle class="size-5 animate-spin text-emerald-700" />
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
						<h4 class="font-semibold text-text-main text-sm">{citationHeading}</h4>
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
						<h4 class="font-semibold text-text-main text-sm">{noteHeading}</h4>
						<div
							class="interactive-preview rounded bg-background-light p-3 font-serif text-text-main"
						>
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html wizardStore.previewHtml.note}
						</div>
					</div>
				{/if}

				{#if showBibliography && wizardStore.previewHtml.bibliography}
					<div class="space-y-2">
						<h4 class="font-semibold text-text-main text-sm">Bibliography</h4>
						<div
							class="interactive-preview rounded bg-background-light p-4 font-serif text-sm text-text-main"
						>
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html wizardStore.previewHtml.bibliography}
						</div>
					</div>
				{:else if !wizardStore.previewHtml.parenthetical && !wizardStore.previewHtml.narrative && !wizardStore.previewHtml.note && !wizardStore.previewHtml.bibliography}
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
	:global(.citum-interactive) {
		cursor: pointer;
		border-radius: 2px;
		transition: all 0.15s ease;
	}

	:global(.citum-interactive:hover) {
		outline: 2px solid rgba(19, 91, 236, 0.3);
		outline-offset: 1px;
		background: rgba(19, 91, 236, 0.05);
	}

	:global(.citum-selected) {
		outline: 3px solid #135bec;
		outline-offset: 2px;
		background: rgba(19, 91, 236, 0.15);
		box-shadow: 0 0 15px rgba(19, 91, 236, 0.2);
	}

	/* Type-specific hover colors in preview */
	:global(.citum-author:hover),
	:global(.citum-editor:hover),
	:global(.citum-translator:hover) {
		background: rgba(16, 185, 129, 0.15);
		border-radius: 4px;
	}
	:global(.citum-issued:hover),
	:global(.citum-accessed:hover) {
		background: rgba(249, 115, 22, 0.15);
		border-radius: 4px;
	}
	:global(.citum-title:hover),
	:global(.citum-container-title:hover) {
		background: rgba(168, 85, 247, 0.15);
		border-radius: 4px;
	}
	:global(.citum-volume:hover),
	:global(.citum-issue:hover),
	:global(.citum-pages:hover) {
		background: rgba(99, 102, 241, 0.15);
		border-radius: 4px;
	}
	:global(.citum-doi:hover),
	:global(.citum-url:hover) {
		background: rgba(14, 165, 233, 0.15);
		border-radius: 4px;
	}

	:global(.interactive-preview) {
		font-family: var(--font-serif);
	}
</style>
