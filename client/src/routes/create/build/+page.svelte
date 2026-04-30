<script lang="ts">
	import { page } from "$app/stores";
	import { onMount } from "svelte";
	import DecisionWizard from "$lib/components/DecisionWizard.svelte";
	import { createFlowStore } from "$lib/stores/create-flow.svelte";
	import {
		getCitationClassLabel,
		getDecisionPreviewSet,
		getFieldLabel,
		getBuildPreviewPanels,
		getBuildProgress,
		resolveBuildStage,
		type HoverPreviewState,
	} from "$lib/utils/create-flow";
	import type { HubStyleDetail } from "$lib/types/style";

	const routeSourceStyleKey = $derived($page.url.searchParams.get("source"));
	let sourceStyle = $state<HubStyleDetail["style"] | null>(null);
	let sourceError = $state<string | null>(null);
	let hoveredPreview = $state<HoverPreviewState | null>(null);
	let isReady = $state(false);
	let activeRequestId = 0;
	let restoredSourceStyleKey: string | null = null;

	function clearSourceStyle() {
		sourceStyle = null;
		sourceError = null;
	}

	async function loadSourceStyle(styleKey: string) {
		const requestId = ++activeRequestId;
		sourceError = null;
		try {
			const res = await fetch(`/api/hub/${encodeURIComponent(styleKey)}`);
			if (requestId !== activeRequestId) return;
			if (!res.ok) {
				sourceError = "Could not load the selected source style.";
				sourceStyle = null;
				return;
			}
			const detail = (await res.json()) as HubStyleDetail;
			if (requestId !== activeRequestId) return;
			sourceStyle = detail.style;
		} catch {
			if (requestId !== activeRequestId) return;
			sourceError = "Could not load the selected source style.";
			sourceStyle = null;
		}
	}

	onMount(() => {
		createFlowStore.restore();
		createFlowStore.setMode("build");
		restoredSourceStyleKey = createFlowStore.sourceStyleKey;
		isReady = true;
	});

	$effect(() => {
		if (!isReady) return;

		const sourceStyleKey = routeSourceStyleKey ?? restoredSourceStyleKey;
		restoredSourceStyleKey = null;
		createFlowStore.setSourceStyleKey(sourceStyleKey);

		if (sourceStyleKey) {
			void loadSourceStyle(sourceStyleKey);
			return;
		}

		activeRequestId++;
		clearSourceStyle();
	});

	const progress = $derived(getBuildProgress(createFlowStore.intent, createFlowStore.lastDecision));
	const committedPreview = $derived(getDecisionPreviewSet(createFlowStore.lastDecision));
	const activePreviewIntent = $derived(hoveredPreview?.intent ?? createFlowStore.intent);
	const previewPanels = $derived(
		getBuildPreviewPanels(activePreviewIntent, hoveredPreview?.previewSet ?? committedPreview)
	);

	$effect(() => {
		createFlowStore.setBuildStage(resolveBuildStage(createFlowStore.intent, createFlowStore.lastDecision));
	});
</script>

<div class="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
	<section class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
		<p class="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Build</p>
		<h1 class="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
			Build a style by picking the closest output each round.
		</h1>
		<p class="mt-4 max-w-2xl text-base leading-7 text-slate-600">
			Each round shows a question and a few candidate citations. Pick the one closest to what you
			want — the engine narrows in from there. Refine the result on the next screen.
		</p>

		{#if createFlowStore.sourceStyleKey}
			<div class="mt-6 rounded-[1.6rem] border border-slate-200 bg-slate-50 px-5 py-4">
				<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Starting Point</p>
				{#if sourceStyle}
					<h2 class="mt-2 text-lg font-bold text-slate-950">{sourceStyle.title}</h2>
					<p class="mt-1 text-sm text-slate-600">
						Using this style as the starting point for your build.
					</p>
				{:else if sourceError}
					<p class="mt-2 text-sm text-red-600">{sourceError}</p>
				{:else}
					<p class="mt-2 text-sm text-slate-600">{createFlowStore.sourceStyleKey}</p>
				{/if}
			</div>
		{/if}

		<div class="mt-8 rounded-[1.6rem] border border-emerald-100 bg-emerald-50 px-5 py-4">
			<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p class="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
						{progress.stageLabel}
					</p>
					<p class="mt-1 text-sm text-emerald-950">
						Step {progress.currentStep} of {progress.totalSteps}: {progress.stepLabel}
					</p>
				</div>
				<p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
					{progress.percentage}% complete
				</p>
			</div>
			<div class="mt-4 h-2 rounded-full bg-emerald-100">
				<div
					class={`h-2 rounded-full bg-emerald-600 transition-all duration-300 ${progress.widthClass}`}
				></div>
			</div>
		</div>

			<div class="mt-8">
			<DecisionWizard
				onDecision={(decision) => createFlowStore.setLastDecision(decision)}
				onPreviewHover={(preview) => {
					hoveredPreview = preview;
				}}
			/>
		</div>
	</section>

	<aside class="flex flex-col gap-4">
		<div class="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white">
			<p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
				Current build state
			</p>
			<dl class="mt-4 grid gap-4">
				<div>
					<dt class="text-xs uppercase tracking-[0.2em] text-slate-400">Field</dt>
					<dd class="mt-1 text-sm font-medium text-white/90">
						{getFieldLabel(activePreviewIntent.field)}
					</dd>
				</div>
				<div>
					<dt class="text-xs uppercase tracking-[0.2em] text-slate-400">Citation class</dt>
					<dd class="mt-1 text-sm font-medium text-white/90">
						{getCitationClassLabel(activePreviewIntent.class)}
					</dd>
				</div>
				<div>
					<dt class="text-xs uppercase tracking-[0.2em] text-slate-400">Status</dt>
					<dd class="mt-1 text-sm font-medium text-white/90">
						{hoveredPreview
							? `Previewing ${hoveredPreview.label}`
							: createFlowStore.lastDecision?.question
								? "Choosing the next decision"
								: "Draft ready"}
					</dd>
				</div>
				<div>
					<dt class="text-xs uppercase tracking-[0.2em] text-slate-400">Stage</dt>
					<dd class="mt-1 text-sm font-medium text-white/90">{progress.stageLabel}</dd>
				</div>
				<div>
					<dt class="text-xs uppercase tracking-[0.2em] text-slate-400">Source style</dt>
					<dd class="mt-1 text-sm font-medium text-white/90">
						{sourceStyle?.title ?? createFlowStore.sourceStyleKey ?? "None"}
					</dd>
				</div>
			</dl>
		</div>

		<div class="rounded-[2rem] border border-slate-200 bg-white p-6">
			<h2 class="text-lg font-bold text-slate-950">Live preview</h2>
			<p class="mt-2 text-sm leading-6 text-slate-600">
				Hover or focus a choice to compare it here before you commit. On mobile, use the preview
				inside each choice card.
			</p>

			<div class="mt-5 grid gap-4">
				{#if previewPanels.length > 0}
					{#each previewPanels as panel}
						<div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
							<p class="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
								{panel.label}
							</p>
							<div class="text-sm leading-6 text-slate-700">
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html panel.html}
							</div>
						</div>
					{/each}
				{:else}
					<div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
						Your preview will appear here once you've made enough decisions to render a citation.
					</div>
				{/if}
			</div>
		</div>
	</aside>
</div>
