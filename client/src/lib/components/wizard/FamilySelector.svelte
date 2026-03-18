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

<div class="space-y-4 sm:space-y-6">
	<div>
		<h2 class="font-display text-2xl font-semibold text-text-main">How should citations appear?</h2>
		<p class="mt-2 text-text-secondary">Choose the citation format that matches your discipline</p>
	</div>

	<div class="space-y-3">
		{#each FAMILY_OPTIONS as family (family.id)}
			<button
				onclick={() => selectFamily(family.id)}
				class="group w-full rounded-lg border-2 border-border-light bg-surface-light p-5 text-left transition-all duration-300 hover:border-primary hover:shadow-md"
			>
				<div class="flex items-start justify-between gap-3">
					<div class="flex-1">
						<h3 class="font-semibold text-text-main group-hover:text-primary transition-colors">
							{family.label}
						</h3>
						<p class="mt-1 text-sm text-text-secondary">
							{family.description}
						</p>
						<p class="mt-3 font-serif text-text-main">
							{family.exampleText}
						</p>
					</div>

					{#if isDefaultFamily(family.id)}
						<span
							class="mt-1 inline-block rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary"
						>
							Recommended
						</span>
					{/if}
				</div>
			</button>
		{/each}
	</div>
</div>
