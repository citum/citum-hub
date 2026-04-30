<script lang="ts">
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import { getRefinementPreviewPanels } from "$lib/utils/refinement-preview";

	interface Props {
		activeHighlight?: string | null;
	}

	const { activeHighlight = null }: Props = $props();
	const panels = $derived(
		getRefinementPreviewPanels(wizardStore.family, wizardStore.previewHtml, activeHighlight)
	);
</script>

<div class="rounded-lg border border-border-light bg-surface-light">
	{#if wizardStore.isLoading}
		<div class="flex items-center justify-center gap-2 p-8">
			<span class="material-symbols-outlined animate-spin text-primary">hourglass</span>
			<span class="text-text-secondary">Loading preview...</span>
		</div>
	{:else if wizardStore.error}
		<div class="space-y-2 rounded bg-red-50 p-4">
			<p class="font-semibold text-red-700">Preview Error</p>
			<p class="text-sm text-red-600">
				{wizardStore.error}
			</p>
		</div>
	{:else}
		<div
			class={`space-y-6 p-6 ${activeHighlight === "contributors" || activeHighlight === "roles" ? "highlight-contributors" : ""}`}
		>
			{#if panels.length > 0}
				{#each panels as panel}
					<div class="space-y-2">
						<h4 class="font-semibold text-text-main">{panel.label}</h4>
						<div
							class={`live-preview-content rounded bg-background-light font-serif text-text-main ${panel.key === "bibliography" ? "p-3 text-sm" : "p-3"}`}
						>
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html panel.html}
						</div>
					</div>
				{/each}
			{:else}
				<div class="text-center py-8">
					<p class="text-text-secondary">No preview available yet</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	:global(.highlight-contributors .citum-author),
	:global(.highlight-contributors .citum-editor),
	:global(.highlight-contributors .citum-translator) {
		background-color: color-mix(in srgb, var(--color-primary, #3b82f6) 15%, transparent);
		border-radius: 2px;
		padding: 0 2px;
		outline: 1px solid color-mix(in srgb, var(--color-primary, #3b82f6) 30%, transparent);
		outline-offset: 1px;
		transition:
			background-color 0.2s ease,
			outline-color 0.2s ease;
	}
</style>
