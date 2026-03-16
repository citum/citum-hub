<script lang="ts">
	import { wizardStore } from "$lib/stores/wizard.svelte";

	let containerRef: HTMLDivElement | undefined = $state();
	let tooltipPos = $state({ x: 0, y: 0 });
	let tooltipInfo = $state<{ type: string; label: string } | null>(null);
	let lastSelectedElement: HTMLElement | null = null;

	function getComponentInfo(el: HTMLElement): { type: string; label: string } | null {
		const classes = Array.from(el.classList);
		const cslnClass = classes.find(
			(c) =>
				c.startsWith("csln-") &&
				c !== "csln-entry" &&
				c !== "csln-bibliography" &&
				c !== "csln-citation"
		);
		if (!cslnClass) return null;

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
		return { type, label: labels[type] || type.replace(/-/g, " ") };
	}

	function attachListeners() {
		if (!containerRef) return;
		const elements = containerRef.querySelectorAll('[class^="csln-"]');
		elements.forEach((el) => {
			const htmlEl = el as HTMLElement;
			const info = getComponentInfo(htmlEl);
			if (info && !htmlEl.classList.contains("csln-interactive")) {
				htmlEl.classList.add("csln-interactive");

				htmlEl.addEventListener("mouseenter", () => {
					tooltipInfo = info;
					const rect = htmlEl.getBoundingClientRect();
					tooltipPos = { x: rect.left, y: rect.top - 5 };
				});

				htmlEl.addEventListener("mouseleave", () => {
					tooltipInfo = null;
				});

				htmlEl.addEventListener("click", (e) => {
					e.stopPropagation();
					wizardStore.setSelectedComponent({
						componentType: info.type,
						cssClass: `csln-${info.type}`,
						element: htmlEl,
					});
				});

			}
		});
	}

	$effect(() => {
		// Re-attach listeners when HTML changes
		if (wizardStore.previewHtml.bibliography) {
			setTimeout(() => {
				attachListeners();
			}, 0);
		}
	});

	$effect(() => {
		const el = wizardStore.selectedComponent?.element ?? null;

		if (lastSelectedElement && lastSelectedElement !== el) {
			lastSelectedElement.classList.remove("csln-selected");
		}

		if (el) {
			el.classList.add("csln-selected");
		}

		lastSelectedElement = el;
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
			<div bind:this={containerRef} class="space-y-4">
				{#if wizardStore.previewHtml.bibliography}
					<div class="space-y-2">
						<h4 class="font-semibold text-text-main text-sm">Bibliography</h4>
						<div
							class="interactive-preview rounded bg-background-light p-4 font-serif text-sm text-text-main"
						>
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html wizardStore.previewHtml.bibliography}
						</div>
					</div>
				{:else}
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
		outline: 2px solid #135bec;
		outline-offset: 1px;
		background: rgba(19, 91, 236, 0.1);
	}

	:global(.interactive-preview) {
		font-family: var(--font-serif);
	}
</style>
