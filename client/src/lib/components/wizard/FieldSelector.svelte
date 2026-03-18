<script lang="ts">
	import { goto } from "$app/navigation";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import { FIELD_OPTIONS } from "$lib/types/wizard";
	import type { CitationField } from "$lib/types/wizard";

	async function selectField(fieldId: CitationField) {
		wizardStore.setField(fieldId);
		wizardStore.setStep(2);
		await goto("/create/family");
	}
</script>

<div class="space-y-4 sm:space-y-6">
	<div>
		<h2 class="font-display text-2xl font-semibold text-text-main">What's your area?</h2>
		<p class="mt-2 text-text-secondary">Choose the field that best matches your work</p>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each FIELD_OPTIONS as field (field.id)}
			<button
				onclick={() => selectField(field.id)}
				class="group flex flex-col items-start gap-3 rounded-lg border-2 border-border-light bg-surface-light p-4 transition-all duration-300 hover:scale-105 hover:border-primary hover:shadow-md"
			>
				<span class="material-symbols-outlined text-2xl text-primary">
					{field.icon}
				</span>
				<div class="text-left">
					<h3 class="font-semibold text-text-main group-hover:text-primary transition-colors">
						{field.label}
					</h3>
					<p class="text-sm text-text-secondary">
						{field.subtitle}
					</p>
				</div>
			</button>
		{/each}
	</div>
</div>
