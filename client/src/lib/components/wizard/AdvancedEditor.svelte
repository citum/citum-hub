<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import {
		ArrowLeft,
		CheckCircle2,
		FileCode2,
		RotateCcw,
		Save,
		TriangleAlert,
	} from "lucide-svelte";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import PreviewPane from "./PreviewPane.svelte";

	let draftYaml = $state("");
	let validationMessage = $state<string | null>(null);
	let isValidating = $state(false);
	let debounceTimer: number | undefined;

	function syncYaml(value: string) {
		draftYaml = value;
		wizardStore.setStyleYaml(value);
		clearTimeout(debounceTimer);
		debounceTimer = window.setTimeout(async () => {
			await wizardStore.fetchPreview();
			await validate();
		}, 250);
	}

	async function validate() {
		isValidating = true;
		validationMessage = await wizardStore.validateCurrentStyle();
		isValidating = false;
	}

	function startOver() {
		wizardStore.reset();
		goto("/create/build/field");
	}

	function goReview() {
		wizardStore.setPhase("quick-start");
		wizardStore.setRouteStep("review");
		goto("/create/build/review");
	}

	const presetScore = $derived(wizardStore.presetId ? 90 : 55);
	const qualityScore = $derived(Math.round((presetScore + (validationMessage ? 45 : 90)) / 2));

	onMount(async () => {
		wizardStore.setPhase("advanced");
		wizardStore.setRouteStep("advanced");
		if (!wizardStore.styleYaml && wizardStore.family) {
			await wizardStore.generateDefaultStyle();
		}
		draftYaml = wizardStore.styleYaml;
		await wizardStore.fetchPreview();
		await validate();
	});
</script>

<div class="min-h-screen bg-background-light">
	<header class="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
		<div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
			<div class="flex items-center gap-4">
				<button
					onclick={() => history.back()}
					class="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
					aria-label="Go back"
				>
					<ArrowLeft class="size-5" />
				</button>
				<div>
					<p class="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Step 7 of 7</p>
					<h1 class="text-lg font-bold text-slate-950">Advanced Editor</h1>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<button
					onclick={goReview}
					class="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
				>
					<Save class="size-4" />
					Review
				</button>
				<button
					onclick={startOver}
					class="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 sm:flex"
				>
					<RotateCcw class="size-4" />
					Start Over
				</button>
			</div>
		</div>
	</header>

	<main
		class="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[minmax(380px,0.95fr)_minmax(0,1.05fr)]"
	>
		<section class="space-y-4">
			<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<div class="flex items-center justify-between gap-4">
					<div>
						<p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">YAML</p>
						<h2 class="mt-1 text-xl font-bold text-slate-950">Style source</h2>
					</div>
					<FileCode2 class="size-5 text-slate-400" />
				</div>
				<textarea
					value={draftYaml}
					oninput={(event) => syncYaml(event.currentTarget.value)}
					spellcheck="false"
					class="mt-4 min-h-[520px] w-full resize-y rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
				></textarea>
			</div>
		</section>

		<section class="space-y-4">
			<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<div class="flex items-start justify-between gap-4">
					<div>
						<p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Validation</p>
						<h2 class="mt-1 text-lg font-bold text-slate-950">
							{isValidating ? "Checking..." : validationMessage ? "Needs attention" : "Valid style"}
						</h2>
					</div>
					{#if validationMessage}
						<TriangleAlert class="size-5 text-amber-600" />
					{:else}
						<CheckCircle2 class="size-5 text-emerald-700" />
					{/if}
				</div>
				{#if validationMessage}
					<p class="mt-3 text-sm leading-6 text-amber-800">{validationMessage}</p>
				{:else}
					<p class="mt-3 text-sm leading-6 text-slate-600">
						The current YAML validates through the Citum WASM bridge.
					</p>
				{/if}
			</div>

			<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Style Quality</p>
				<div class="mt-4 flex items-center gap-4">
					<div class="text-4xl font-black text-slate-950">{qualityScore}</div>
					<div class="flex-1">
						<div class="h-2 overflow-hidden rounded-full bg-slate-100">
							<div
								class="h-full rounded-full bg-emerald-600"
								style={`width: ${qualityScore}%`}
							></div>
						</div>
						<p class="mt-2 text-sm text-slate-600">
							{wizardStore.presetId
								? "Preset-backed output keeps the style concise."
								: "Choose a preset base when possible to improve maintainability."}
						</p>
					</div>
				</div>
			</div>

			<div class="rounded-2xl border border-slate-200 bg-slate-100 p-5 shadow-sm">
				<p class="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
					Live Preview
				</p>
				<PreviewPane />
			</div>
		</section>
	</main>
</div>
