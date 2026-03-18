<script lang="ts">
	import { wizardStore } from "$lib/stores/wizard.svelte";

	interface RefType {
		id: string;
		label: string;
	}

	const refTypes: RefType[] = [
		{ id: "article-journal", label: "Article" },
		{ id: "book", label: "Book" },
		{ id: "chapter", label: "Chapter" },
		{ id: "report", label: "Report" },
		{ id: "thesis", label: "Thesis" },
		{ id: "webpage", label: "Web page" },
	];
</script>

<div class="flex gap-1 border-b border-border-light overflow-x-auto">
	{#each refTypes as type (type.id)}
		<button
			class="px-3 py-2 text-sm whitespace-nowrap transition-colors {wizardStore.activeRefType ===
			type.id
				? 'text-primary border-b-2 border-primary font-medium'
				: 'text-text-secondary hover:text-text-main'}"
			onclick={() => {
				wizardStore.setActiveRefType(type.id);
				wizardStore.fetchPreview();
			}}
		>
			{type.label}
		</button>
	{/each}
</div>
