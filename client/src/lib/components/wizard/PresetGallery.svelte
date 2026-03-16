<script lang="ts">
	import { goto } from "$app/navigation";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import { getPresetsForFamily } from "$lib/data/presets";
	import type { PresetInfo } from "$lib/types/wizard";

	let presets = $derived(getPresetsForFamily(wizardStore.family!));
	let previewsLoaded = $state<Record<string, string | null>>({});
	let isLoadingPreviews = $state(true);

	async function loadPreview(preset: PresetInfo) {
		if (previewsLoaded[preset.id]) return;

		try {
			const res = await fetch("/api/v1/preview", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					intent: {
						...preset.intentFields,
						field: wizardStore.field,
					},
				}),
			});

			if (!res.ok) {
				previewsLoaded[preset.id] = null;
				return;
			}

			const data = await res.json();
			const html =
				data.in_text_parenthetical ||
				data.in_text_narrative ||
				data.note ||
				data.bibliography ||
				"";
			previewsLoaded[preset.id] = html;
		} catch {
			previewsLoaded[preset.id] = null;
		}
	}

	async function selectPreset(preset: PresetInfo) {
		wizardStore.setPresetId(preset.id);
		wizardStore.setStep(4);
		await wizardStore.generateFromIntent(preset.intentFields);
		await goto("/create/refine");
	}

	$effect(() => {
		if (!wizardStore.family) return;
		isLoadingPreviews = true;
		const loadAll = async () => {
			for (const preset of presets) {
				await loadPreview(preset);
			}
			isLoadingPreviews = false;
		};
		loadAll();
	});
</script>

<div class="space-y-4 sm:space-y-6">
	<div>
		<h2 class="font-display text-2xl font-semibold text-text-main">Pick the closest match</h2>
		<p class="mt-2 text-text-secondary">
			We'll generate a style from your selection. You can customize it later.
		</p>
	</div>

	{#if isLoadingPreviews}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
			{#each { length: 3 } as _, i (i)}
				<div class="space-y-3 rounded-lg bg-surface-light p-4">
					<div class="h-6 w-2/3 animate-pulse rounded bg-background-light"></div>
					<div class="space-y-2">
						<div class="h-4 w-full animate-pulse rounded bg-background-light"></div>
						<div class="h-4 w-5/6 animate-pulse rounded bg-background-light"></div>
					</div>
					<div class="h-16 animate-pulse rounded bg-background-light"></div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each presets as preset (preset.id)}
				<button
					onclick={() => selectPreset(preset)}
					class="group flex flex-col gap-3 rounded-lg border-2 border-border-light bg-surface-light p-4 text-left transition-all duration-300 hover:border-primary hover:shadow-md"
				>
					<h3 class="font-semibold text-text-main group-hover:text-primary transition-colors">
						{preset.name}
					</h3>

					<p class="text-sm text-text-secondary">
						{preset.traits}
					</p>

					{#if previewsLoaded[preset.id]}
						<div class="mt-auto rounded bg-background-light p-3 font-serif text-sm text-text-main">
							<div class="live-preview-content line-clamp-4">
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html previewsLoaded[preset.id]}
							</div>
						</div>
					{:else}
						<div class="mt-auto h-16 rounded bg-background-light"></div>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
