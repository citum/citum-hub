<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { ArrowLeft, Check, Eye, RotateCcw, SlidersHorizontal } from "lucide-svelte";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import PreviewPane from "$lib/components/wizard/PreviewPane.svelte";
	import type { AxisChoice, AxisChoices } from "$lib/types/wizard";
	import {
		AXES_BY_FAMILY,
		getAxisChoiceUpdates,
		getPreviewHtmlForAxis,
		isExactPresetMatch,
		matchPreset,
	} from "$lib/utils/wizard-flow";

	let currentAxisIndex = $state(0);
	let optionPreviews = $state<Record<string, string>>({});
	let isLoadingChoicePreviews = $state(false);
	let previewRequestId = 0;
	const choicePreviewCache = new Map<string, string>();

	const axes = $derived(wizardStore.family ? AXES_BY_FAMILY[wizardStore.family] : []);
	const currentAxis = $derived(axes[currentAxisIndex] ?? null);
	const presetMatch = $derived(
		wizardStore.family ? matchPreset(wizardStore.family, wizardStore.axisChoices) : null
	);
	const exactMatch = $derived(
		wizardStore.family ? isExactPresetMatch(wizardStore.family, wizardStore.axisChoices) : false
	);

	function choiceKey(axisId: string, choice: AxisChoice) {
		return `${axisId}:${String(choice.value)}`;
	}

	function previewCacheKey(axisId: string, choice: AxisChoice, styleYaml: string) {
		return `${axisId}:${String(choice.value)}:${styleYaml}`;
	}

	async function loadChoicePreviews() {
		if (!wizardStore.family || !currentAxis || !wizardStore.styleYaml) return;
		const requestId = ++previewRequestId;
		const axis = currentAxis;
		const family = wizardStore.family;
		const styleYaml = wizardStore.styleYaml;
		isLoadingChoicePreviews = true;

		const previewEntries = await Promise.all(
			axis.choices.map(async (choice) => {
				const cacheKey = previewCacheKey(axis.id, choice, styleYaml);
				const cached = choicePreviewCache.get(cacheKey);
				if (cached) return [choiceKey(axis.id, choice), cached] as const;

				const preview = await wizardStore.previewStyleWithUpdates(
					getAxisChoiceUpdates(axis.id, choice.value)
				);
				const html = getPreviewHtmlForAxis(family, axis.id, preview);
				choicePreviewCache.set(cacheKey, html);
				return [choiceKey(axis.id, choice), html] as const;
			})
		);

		if (requestId !== previewRequestId) return;

		optionPreviews = Object.fromEntries(previewEntries);
		isLoadingChoicePreviews = false;
	}

	async function selectOption(axisId: keyof AxisChoices, value: AxisChoice["value"]) {
		await wizardStore.selectAxisChoice(axisId, value);
		if (currentAxisIndex < axes.length - 1) {
			currentAxisIndex++;
		}
	}

	async function continueToRefine() {
		wizardStore.setStep(4);
		wizardStore.setRouteStep("refine");
		await goto("/create/build/refine");
	}

	async function customizeFurther() {
		wizardStore.setPhase("visual-customizer");
		wizardStore.setRouteStep("customize");
		await goto("/create/build/customize");
	}

	function startOver() {
		wizardStore.reset();
		goto("/create/build/field");
	}

	onMount(async () => {
		wizardStore.setRouteStep("style");
		if (!wizardStore.styleYaml && wizardStore.family) {
			await wizardStore.generateDefaultStyle();
		} else if (wizardStore.styleYaml) {
			await wizardStore.fetchPreview();
		}
	});

	$effect(() => {
		if (!currentAxis || !wizardStore.styleYaml) return;
		void loadChoicePreviews();
	});
</script>

<div class="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6">
	<div class="mx-auto mb-6 w-full max-w-2xl text-center">
		<button
			onclick={() => history.back()}
			class="absolute left-4 top-24 flex items-center justify-center rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:left-8"
			aria-label="Go back"
		>
			<ArrowLeft class="size-5" />
		</button>
		<p class="mb-2 text-sm font-medium text-slate-500">Step 3 of 7</p>
		<div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
			<div
				class="h-full rounded-full bg-emerald-600 transition-all duration-500"
				style="width: 42.8571%"
			></div>
		</div>
		<h1 class="mt-4 text-2xl font-bold text-slate-950">Style Navigator</h1>
		<p class="mt-2 text-sm leading-6 text-slate-600">
			Choose the rendered example that looks closest. The left preview updates after every choice.
		</p>
	</div>

	<div class="grid min-h-[620px] gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)]">
		<section
			class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
		>
			<div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
				<div>
					<p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Live Preview</p>
					<p class="mt-1 text-sm font-semibold text-slate-950">
						{exactMatch ? "Exact match" : "Closest match"}:
						<span class="text-emerald-700"
							>{presetMatch?.presetId ?? wizardStore.presetId ?? "working"}</span
						>
					</p>
				</div>
				<Eye class="size-5 text-slate-400" />
			</div>
			<div class="min-h-0 flex-1 overflow-auto bg-slate-50 p-5">
				<PreviewPane />
			</div>
		</section>

		<aside class="flex min-h-0 flex-col gap-4 overflow-y-auto pb-8">
			{#if currentAxis}
				<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
					<p class="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
						Axis {currentAxisIndex + 1} of {axes.length}
					</p>
					<h2 class="mt-2 text-xl font-bold text-slate-950">{currentAxis.question}</h2>
				</div>

				<div class="grid gap-3">
					{#each currentAxis.choices as choice}
						{@const selected = wizardStore.axisChoices[currentAxis.id] === choice.value}
						<button
							onclick={() => selectOption(currentAxis.id, choice.value)}
							class={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-emerald-300 ${
								selected ? "border-emerald-500 ring-2 ring-emerald-100" : "border-slate-200"
							}`}
						>
							<div class="flex items-start justify-between gap-4">
								<div class="min-w-0">
									<p class="text-sm font-bold text-slate-950">{choice.label}</p>
									<div
										class="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3 font-serif text-sm leading-7 text-slate-700"
									>
										{#if isLoadingChoicePreviews && !optionPreviews[choiceKey(currentAxis.id, choice)]}
											<span class="font-sans text-xs text-slate-400">Rendering...</span>
										{:else if optionPreviews[choiceKey(currentAxis.id, choice)]}
											<!-- eslint-disable-next-line svelte/no-at-html-tags -->
											{@html optionPreviews[choiceKey(currentAxis.id, choice)]}
										{:else}
											<span class="font-sans text-xs text-slate-400">Preview unavailable</span>
										{/if}
									</div>
								</div>
								{#if selected}
									<Check class="mt-1 size-5 shrink-0 text-emerald-700" />
								{/if}
							</div>
						</button>
					{/each}
				</div>
			{/if}

			<div class="grid gap-3 pt-2">
				<button
					onclick={continueToRefine}
					class="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
				>
					{currentAxisIndex >= axes.length - 1 ? "Continue to Refinement" : "Use this and refine"}
				</button>
				<div class="grid grid-cols-2 gap-3">
					<button
						onclick={customizeFurther}
						class="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-300"
					>
						<SlidersHorizontal class="size-4" />
						Customize
					</button>
					<button
						onclick={startOver}
						class="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-300"
					>
						<RotateCcw class="size-4" />
						Start Over
					</button>
				</div>
			</div>
		</aside>
	</div>
</div>
