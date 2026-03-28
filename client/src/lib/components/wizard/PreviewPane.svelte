<script lang="ts">
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import {
		branchLabel,
		shouldShowBibliographyPreview,
		shouldShowInTextPreview,
		shouldShowNarrativePreview,
		shouldShowNotePreview,
	} from "$lib/types/wizard";

	interface Props {
		activeHighlight?: string | null;
	}

	const { activeHighlight = null }: Props = $props();

	const branch = $derived(wizardStore.branch);
	const showParenthetical = $derived(shouldShowInTextPreview(branch));
	const showNarrative = $derived(shouldShowNarrativePreview(branch));
	const showNote = $derived(shouldShowNotePreview(branch));
	const showBibliography = $derived(
		shouldShowBibliographyPreview(branch, wizardStore.styleIntent.has_bibliography)
	);
	const previewHeading = $derived(
		branch === "note-law"
			? "Legal Footnote Preview"
			: branch === "note-humanities"
				? "Notes Preview"
				: `${branchLabel(branch)} Preview`
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
			{#if showParenthetical && wizardStore.previewHtml.parenthetical}
				<div class="space-y-2">
					<h4 class="font-semibold text-text-main">
						{branch === "numeric" ? "In-Text Citation" : "Parenthetical Citation"}
					</h4>
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

			{#if showNote && (wizardStore.previewHtml.note || wizardStore.previewHtml.noteRepeat)}
				<div class="space-y-2">
					<h4 class="font-semibold text-text-main">{previewHeading}</h4>
					{#if wizardStore.previewHtml.note}
						<div class="space-y-1">
							<p class="text-xs font-bold uppercase tracking-widest text-slate-400">First Note</p>
							<div
								class="live-preview-content rounded bg-background-light p-3 font-serif text-text-main"
							>
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html wizardStore.previewHtml.note}
							</div>
						</div>
					{/if}
					{#if wizardStore.previewHtml.noteRepeat}
						<div class="space-y-1">
							<p class="text-xs font-bold uppercase tracking-widest text-slate-400">Repeat Note</p>
							<div
								class="live-preview-content rounded bg-background-light p-3 font-serif text-text-main"
							>
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html wizardStore.previewHtml.noteRepeat}
							</div>
						</div>
					{/if}
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

			{#if !wizardStore.previewHtml.parenthetical && !wizardStore.previewHtml.narrative && !wizardStore.previewHtml.note && !wizardStore.previewHtml.noteRepeat && !wizardStore.previewHtml.bibliography}
				<div class="text-center py-8">
					<p class="text-text-secondary">No preview available yet</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	:global(.highlight-contributors .csln-author),
	:global(.highlight-contributors .csln-editor),
	:global(.highlight-contributors .csln-translator) {
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
