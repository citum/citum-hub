<script lang="ts">
/**
 * LivePreview component
 * Displays raw HTML content from the backend in a styled container.
 */
interface Props {
	html: string | null;
}

let { html }: Props = $props();
</script>

<div class="live-preview-content">
	{#if html}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html html}
	{:else}
		<div class="empty-state">
			<p>Select options to see how your citations will look.</p>
		</div>
	{/if}
</div>

<style>
	.live-preview-content {
		line-height: 1.6;
	}

	.empty-state {
		color: #64748b;
		font-style: italic;
		font-size: 0.9rem;
	}

	/* Citum Engine Styling */
	:global(.csln-bibliography) {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	:global(.csln-entry) {
		margin-bottom: 0.25rem;
	}

	:global(.csln-citation) {
		cursor: help;
		border-bottom: 1px dotted rgba(0, 0, 0, 0.1);
	}

	/* Style the italics/bold even if the engine returns them as tags */
	:global(.live-preview-content i) {
		font-style: italic;
	}
	:global(.live-preview-content b) {
		font-weight: bold;
	}
</style>
