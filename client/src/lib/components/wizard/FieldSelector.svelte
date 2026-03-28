<script lang="ts">
	import { goto } from "$app/navigation";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import { FIELD_OPTIONS } from "$lib/types/wizard";
	import type { CitationField } from "$lib/types/wizard";

	async function selectField(fieldId: CitationField) {
		wizardStore.setField(fieldId);
		wizardStore.setStep(2);
		await goto("/create/build/family");
	}
</script>

<div class="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8 w-full">
	<!-- Progress Indicator -->
	<div class="mb-8 sm:mb-12 max-w-2xl mx-auto text-center">
		<p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 sm:mb-3">Step 1 of 4</p>
		<div class="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
			<div
				class="h-full bg-primary rounded-full transition-all duration-500"
				style="width: 25%"
			></div>
		</div>
		<h2 class="text-2xl sm:text-3xl font-bold mt-6 sm:mt-8 text-slate-900 dark:text-white">
			Select Your Academic Discipline
		</h2>
		<p class="text-base sm:text-lg text-slate-600 dark:text-slate-300 mt-2 sm:mt-3">
			This sets the baseline formatting rules for your citation style.
		</p>
	</div>

	<!-- Discipline Grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
		{#each FIELD_OPTIONS as field (field.id)}
			<button
				onclick={() => selectField(field.id)}
				class="group flex flex-col items-center justify-center p-6 sm:p-8 h-64 sm:h-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center transition-all hover:border-primary/50 hover:shadow-md dark:hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
			>
				<div
					class="size-14 sm:size-16 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-primary/10 group-hover:text-primary transition-colors flex items-center justify-center mb-4 sm:mb-6"
				>
					<span class="material-symbols-outlined text-2xl sm:text-3xl font-light">
						{field.icon}
					</span>
				</div>
				<h3
					class="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2 transition-colors"
				>
					{field.label}
				</h3>
				<p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
					{field.subtitle}
				</p>
			</button>
		{/each}
	</div>

	<!-- Secondary Action -->
	<div class="mt-12 text-center">
		<button
			onclick={async () => {
				wizardStore.setPhase("visual-customizer");
				// Provide a generic baseline (social sciences / author-date)
				await wizardStore.generateFromIntent({
					class: "author_date",
					from_preset: "apa",
				});
				goto("/create/build/customize");
			}}
			class="text-sm font-medium text-slate-500 hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
		>
			<span class="material-symbols-outlined text-lg">settings_suggest</span>
			I want to customize everything from scratch
		</button>
	</div>
</div>
