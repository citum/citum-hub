<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { createFlowStore } from "$lib/stores/create-flow.svelte";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import { getWizardProgress } from "$lib/utils/wizard-flow";
	import { BookOpen, Compass, FileText, RotateCcw, SlidersHorizontal } from "lucide-svelte";

	let isReady = $state(false);

	onMount(() => {
		createFlowStore.restore();
		createFlowStore.setMode("build");
		wizardStore.restore();
		isReady = true;
	});

	const progress = $derived(getWizardProgress(wizardStore.routeStep));

	function startFresh() {
		wizardStore.reset();
		goto("/create/build/field");
	}

	function resume() {
		const route =
			wizardStore.routeStep === "customize"
				? "/create/build/customize"
				: wizardStore.routeStep === "advanced"
					? "/create/build/advanced"
					: `/create/build/${wizardStore.routeStep}`;
		goto(route);
	}
</script>

<div class="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
	<section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
		<p class="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Build</p>
		<h1 class="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
			Build from the citation output back to the style.
		</h1>
		<p class="mt-4 max-w-2xl text-base leading-7 text-slate-600">
			The wizard now starts with discipline and citation family, then lets you steer by choosing
			rendered examples. The preview is the decision surface.
		</p>

		<div class="mt-8 grid gap-4 sm:grid-cols-2">
			<button
				onclick={startFresh}
				class="group rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left transition hover:border-emerald-300 hover:bg-emerald-100/70"
			>
				<Compass class="size-6 text-emerald-700" />
				<h2 class="mt-4 text-lg font-bold text-slate-950">Start a new style</h2>
				<p class="mt-2 text-sm leading-6 text-slate-600">
					Begin with field, family, visual navigation, refinement, and review.
				</p>
			</button>

			<button
				onclick={resume}
				disabled={!isReady || !wizardStore.field}
				class="group rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
			>
				<RotateCcw class="size-6 text-slate-700" />
				<h2 class="mt-4 text-lg font-bold text-slate-950">Resume current build</h2>
				<p class="mt-2 text-sm leading-6 text-slate-600">
					Continue from {wizardStore.field ? progress.label : "your next saved step"}.
				</p>
			</button>
		</div>
	</section>

	<aside class="space-y-4">
		<div class="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white">
			<BookOpen class="size-5 text-emerald-300" />
			<h2 class="mt-4 text-lg font-bold">V2 wizard path</h2>
			<ol class="mt-4 space-y-3 text-sm text-slate-300">
				<li>1. Field and citation family</li>
				<li>2. Rendered style navigator</li>
				<li>3. Names, dates, and titles refinement</li>
				<li>4. Review, download, save, or customize</li>
			</ol>
		</div>

		<a
			href="/create/build/advanced"
			class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
		>
			<FileText class="size-5" />
			Open Advanced Editor
		</a>
		<a
			href="/create/build/customize"
			class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
		>
			<SlidersHorizontal class="size-5" />
			Open Visual Customizer
		</a>
	</aside>
</div>
