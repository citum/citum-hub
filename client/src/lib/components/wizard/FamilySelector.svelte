<script lang="ts">
	import { goto } from "$app/navigation";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import { FAMILY_OPTIONS, FIELD_DEFAULTS } from "$lib/types/wizard";
	import type { StyleFamily } from "$lib/types/wizard";
	import { ArrowLeft, ArrowRight, Check, MessageSquareQuote } from "lucide-svelte";

	async function selectFamily(familyId: StyleFamily) {
		wizardStore.setFamily(familyId);
		wizardStore.setStep(3);
		wizardStore.setRouteStep("style");

		// Generate base style from family/preset
		await wizardStore.generateDefaultStyle();

		await goto("/create/build/style");
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
			<ArrowLeft class="size-5" />
		</button>
		<p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 sm:mb-3">Step 2 of 7</p>
		<div class="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
			<div
				class="h-full bg-emerald-600 rounded-full transition-all duration-500"
				style="width: 28.5714%"
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
					? 'border-emerald-500 dark:border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.12)]'
					: 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-500'}"
			>
				{#if isRecommended}
					<div
						class="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm whitespace-nowrap"
					>
						<Check class="size-3.5" />
						Recommended format
					</div>
				{/if}

				<div class="w-full flex justify-between items-start mb-4">
					<h3
						class="text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 transition-colors"
					>
						{family.label}
					</h3>
					<ArrowRight
						class="size-5 text-slate-300 transition-colors group-hover:text-emerald-700"
					/>
				</div>

				<p class="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-grow">
					{family.description}
				</p>

				<div
					class="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-700"
				>
					<MessageSquareQuote class="mb-3 size-4 text-slate-400" />
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
				const defaultFamily =
					wizardStore.family ??
					(wizardStore.field ? FIELD_DEFAULTS[wizardStore.field] : "author-date");

				wizardStore.setPhase("visual-customizer");
				wizardStore.setFamily(defaultFamily);
				wizardStore.setRouteStep("customize");

				await wizardStore.generateDefaultStyle();
				goto("/create/build/customize");
			}}
			class="text-sm font-medium text-slate-500 hover:text-emerald-700 transition-colors flex items-center justify-center gap-2 mx-auto"
		>
			I want to customize this further
		</button>
	</div>
</div>
