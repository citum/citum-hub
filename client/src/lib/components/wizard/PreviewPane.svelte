<script lang="ts">
	import { wizardStore } from "$lib/stores/wizard.svelte";

	const showParenthetical = $derived(
		wizardStore.family === "author-date" || wizardStore.family === "numeric"
	);
	const showNarrative = $derived(wizardStore.family === "author-date");
	const showNote = $derived(wizardStore.family === "note");
	const showBibliography = $derived(wizardStore.family !== "numeric");
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
		<div class="space-y-6 p-6">
			{#if showParenthetical && wizardStore.previewHtml.parenthetical}
				<div class="space-y-2">
					<h4 class="font-semibold text-text-main">Parenthetical Citation</h4>
					<div
						class="live-preview-content rounded bg-background-light p-3 font-serif text-text-main"
					>
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html wizardStore.previewHtml.parenthetical}
					</div>
				</div>
			{/if}

			{#if showNarrative && wizardStore.previewHtml.narrative}
				<div class="space-y-2">
					<h4 class="font-semibold text-text-main">Narrative Citation</h4>
					<div
						class="live-preview-content rounded bg-background-light p-3 font-serif text-text-main"
					>
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html wizardStore.previewHtml.narrative}
					</div>
				</div>
			{/if}

			{#if showNote && wizardStore.previewHtml.note}
				<div class="space-y-2">
					<h4 class="font-semibold text-text-main">Footnote</h4>
					<div
						class="live-preview-content rounded bg-background-light p-3 font-serif text-text-main"
					>
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html wizardStore.previewHtml.note}
					</div>
				</div>
			{/if}

			{#if showBibliography && wizardStore.previewHtml.bibliography}
				<div class="space-y-2">
					<h4 class="font-semibold text-text-main">Bibliography</h4>
					<div
						class="live-preview-content rounded bg-background-light p-3 font-serif text-sm text-text-main"
					>
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html wizardStore.previewHtml.bibliography}
					</div>
				</div>
			{/if}

			{#if !wizardStore.previewHtml.parenthetical && !wizardStore.previewHtml.narrative && !wizardStore.previewHtml.note && !wizardStore.previewHtml.bibliography}
				<div class="text-center py-8">
					<p class="text-text-secondary">No preview available yet</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
