<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { ArrowLeft, FileText, RotateCcw, Save, Undo2, Redo2 } from "lucide-svelte";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import InteractivePreview from "./InteractivePreview.svelte";
	import RefinementControls from "./RefinementControls.svelte";
	import TypeSelector from "./TypeSelector.svelte";

	let debounceTimer: number | undefined;
	let editScope = $state<"all" | "local">("all");

	function debouncedFetchPreview() {
		clearTimeout(debounceTimer);
		debounceTimer = window.setTimeout(() => {
			void wizardStore.fetchPreview();
		}, 150);
	}

	function updateOptionField(path: string, value: unknown) {
		wizardStore.updateStyleField(`options.${path}`, value);
		debouncedFetchPreview();
	}

	function updateMonthFormat(month: string) {
		wizardStore.updateStyleField("options.dates.month", month);
		debouncedFetchPreview();
	}

	function updatePageRangeFormat(format: string) {
		wizardStore.updateStyleField("options.page-range-format", format);
		debouncedFetchPreview();
	}

	function updateLocatorLabel(form: string) {
		wizardStore.updateStyleField("options.locators.default-label-form", form);
		debouncedFetchPreview();
	}

	function goReview() {
		wizardStore.setPhase("quick-start");
		wizardStore.setRouteStep("review");
		goto("/create/build/review");
	}

	function goAdvanced() {
		wizardStore.setPhase("advanced");
		wizardStore.setRouteStep("advanced");
		goto("/create/build/advanced");
	}

	function startOver() {
		wizardStore.reset();
		goto("/create/build/field");
	}

	const currentOptions = $derived(wizardStore.getOptions());
	const selectedLabel = $derived(
		wizardStore.selectedComponent?.componentType
			? wizardStore.selectedComponent.componentType.replace(/-/g, " ")
			: "Select an output element"
	);

	onMount(async () => {
		wizardStore.setPhase("visual-customizer");
		wizardStore.setRouteStep("customize");
		if (!wizardStore.styleYaml && wizardStore.family) {
			await wizardStore.generateDefaultStyle();
		}
		if (wizardStore.styleYaml) {
			await wizardStore.materializeCurrentStyleFromWasm();
			await wizardStore.fetchPreview();
		}
	});
</script>

<div class="min-h-screen bg-background-light">
	<header class="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
		<div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
			<div class="flex items-center gap-4">
				<button
					onclick={() => goto("/create/build/review")}
					class="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
					aria-label="Back to review"
				>
					<ArrowLeft class="size-5" />
				</button>
				<div>
					<p class="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Step 6 of 7</p>
					<h1 class="text-lg font-bold text-slate-950">Visual Customizer</h1>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<button
					onclick={() => wizardStore.undo()}
					disabled={!wizardStore.canUndo}
					class="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-slate-300 disabled:opacity-40"
					aria-label="Undo"
				>
					<Undo2 class="size-4" />
				</button>
				<button
					onclick={() => wizardStore.redo()}
					disabled={!wizardStore.canRedo}
					class="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-slate-300 disabled:opacity-40"
					aria-label="Redo"
				>
					<Redo2 class="size-4" />
				</button>
				<button
					onclick={goAdvanced}
					class="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 sm:flex"
				>
					<FileText class="size-4" />
					Advanced
				</button>
				<button
					onclick={goReview}
					class="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
				>
					<Save class="size-4" />
					Review
				</button>
			</div>
		</div>
	</header>

	<main
		class="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.15fr)]"
	>
		<section class="space-y-4">
			<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Editing</p>
				<h2 class="mt-2 text-xl font-bold capitalize text-slate-950">{selectedLabel}</h2>
				<p class="mt-2 text-sm leading-6 text-slate-600">
					Click an element in the preview. Use the controls below to change the style, and choose
					whether edits apply everywhere or only to the active reference type.
				</p>
				<div class="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
					<button
						onclick={() => (editScope = "all")}
						class={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
							editScope === "all" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
						}`}
					>
						All types
					</button>
					<button
						onclick={() => (editScope = "local")}
						class={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
							editScope === "local" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
						}`}
					>
						This type
					</button>
				</div>
			</div>

			<div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
				<TypeSelector />
			</div>

			<RefinementControls
				{currentOptions}
				activeTab={wizardStore.selectedComponent?.componentType === "issued" ? "dates" : undefined}
				onUpdateOption={updateOptionField}
				onUpdateDates={updateMonthFormat}
				onUpdatePageRange={updatePageRangeFormat}
				onUpdateLocatorLabel={updateLocatorLabel}
			/>

			<button
				onclick={startOver}
				class="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
			>
				<RotateCcw class="size-4" />
				Start Over
			</button>
		</section>

		<section class="min-h-[620px] rounded-2xl border border-slate-200 bg-slate-100 p-5 shadow-sm">
			<div class="mx-auto max-w-3xl">
				<p class="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
					Interactive Preview
				</p>
				<InteractivePreview />
			</div>
		</section>
	</main>
</div>
