<script lang="ts">
	import { goto } from "$app/navigation";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import { FAMILY_OPTIONS, FIELD_DEFAULTS } from "$lib/types/wizard";
	import type { StyleFamily } from "$lib/types/wizard";

	async function selectFamily(familyId: StyleFamily) {
		wizardStore.setFamily(familyId);
		wizardStore.setStep(3);

		// Generate base style from family/preset
		const presetId =
			familyId === "author-date" ? "apa" : familyId === "numeric" ? "vancouver" : "chicago-note";
		wizardStore.setPresetId(presetId);
		await wizardStore.generateFromIntent({
			class:
				familyId === "author-date"
					? "author_date"
					: familyId === "numeric"
						? "numeric"
						: "footnote",
			from_preset: presetId,
		});

		await goto("/create/style");
	}

	const isDefaultFamily = (familyId: StyleFamily): boolean => {
		return wizardStore.field ? FIELD_DEFAULTS[wizardStore.field] === familyId : false;
	};
</script>

<div class="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8 w-full">
	<!-- Progress Indicator -->
	<div class="mb-8 sm:mb-12 max-w-2xl mx-auto text-center">
		<button
			onclick={() => history.back()}
			class="absolute top-4 sm:top-8 left-4 sm:left-8 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
		>
			<span class="material-symbols-outlined">arrow_back</span>
		</button>
		<p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 sm:mb-3">Step 2 of 4</p>
		<div class="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
			<div
				class="h-full bg-primary rounded-full transition-all duration-500"
				style="width: 50%"
			></div>
		</div>
		<h2 class="text-2xl sm:text-3xl font-bold mt-6 sm:mt-8 text-slate-900 dark:text-white">
			How should citations appear?
		</h2>
		<p class="text-base sm:text-lg text-slate-600 dark:text-slate-300 mt-2 sm:mt-3">
			Choose the citation format that matches your discipline.
		</p>
	</div>

	<!-- Family Cards -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
		{#each FAMILY_OPTIONS as family (family.id)}
			{@const isRecommended = isDefaultFamily(family.id)}
			<button
				onclick={() => selectFamily(family.id)}
				class="group relative flex flex-col p-6 sm:p-8 bg-white dark:bg-slate-800 border-2 rounded-xl text-left transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent {isRecommended
					? 'border-primary dark:border-primary shadow-[0_0_15px_rgba(19,91,236,0.1)]'
					: 'border-slate-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/50'}"
			>
				{#if isRecommended}
					<div
						class="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm whitespace-nowrap"
					>
						<span class="material-symbols-outlined text-[14px]">star</span>
						Recommended format
					</div>
				{/if}

				<div class="w-full flex justify-between items-start mb-4">
					<h3
						class="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors"
					>
						{family.label}
					</h3>
					<span
						class="material-symbols-outlined text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors"
					>
						arrow_forward
					</span>
				</div>

				<p class="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-grow">
					{family.description}
				</p>

				<div
					class="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-700"
				>
					<p class="font-serif text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
						{family.exampleText}
					</p>
				</div>
			</button>
		{/each}
	</div>

	<!-- Secondary Action -->
	<div class="mt-12 text-center">
		<button
			onclick={async () => {
				wizardStore.setPhase("visual-customizer");
				// Generate based on current choice or default
				await wizardStore.generateFromIntent({
					class: wizardStore.field ? (FIELD_DEFAULTS[wizardStore.field] === 'author-date' ? 'author_date' : 'numeric') : 'author_date',
					from_preset: wizardStore.presetId || "apa",
				});
				goto("/create/customize");
			}}
			class="text-sm font-medium text-slate-500 hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
		>
			<span class="material-symbols-outlined text-lg">settings_suggest</span>
			I want to customize this further
		</button>
	</div>
</div>
