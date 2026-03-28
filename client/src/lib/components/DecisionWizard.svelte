<script lang="ts">
	import { onMount } from "svelte";
	import { createFlowStore } from "$lib/stores/create-flow.svelte";
	import {
		createEmptyIntent,
		getChoicePreviewHtml,
		sanitizeStyleFilename,
		suggestBuildStyleName,
		type HoverPreviewState,
	} from "$lib/utils/create-flow";
	import type { StyleIntent } from "$lib/types/bindings";
	import type { DecisionChoice, DecisionResult } from "$lib/types/decision";

	let { onDecision, onPreviewHover = undefined } = $props<{
		onDecision: (decision: DecisionResult | null) => void;
		onPreviewHover?: (preview: HoverPreviewState | null) => void;
	}>();

	let loading = $state(false);
	let error = $state<string | null>(null);
	let decisionPackage = $state<DecisionResult | null>(null);
	let requestSequence = 0;
	let hasMounted = false;
	let lastIntentKey = "";

	async function fetchDecision(currentIntent: StyleIntent) {
		const requestId = ++requestSequence;
		loading = true;
		error = null;
		try {
			const res = await fetch("/api/v1/decide", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(currentIntent),
			});
			if (res.ok) {
				const data = await res.json();
				if (requestId !== requestSequence) return;
				onPreviewHover?.(null);
				decisionPackage = data as DecisionResult;
				onDecision(data as DecisionResult);
			} else {
				if (requestId !== requestSequence) return;
				error = `Error: ${res.statusText}`;
			}
		} catch (e) {
			if (requestId !== requestSequence) return;
			error = String(e);
		} finally {
			if (requestId === requestSequence) {
				loading = false;
			}
		}
	}

	function syncDecision(currentIntent: StyleIntent) {
		const nextIntentKey = JSON.stringify(currentIntent);
		if (nextIntentKey === lastIntentKey) return;
		lastIntentKey = nextIntentKey;
		fetchDecision(currentIntent);
	}

	onMount(() => {
		hasMounted = true;
		syncDecision(createFlowStore.intent);
	});

	$effect(() => {
		const currentIntent = createFlowStore.intent;
		if (!hasMounted) return;
		syncDecision(currentIntent);
	});

	function handleChoice(choice: Partial<StyleIntent>) {
		onPreviewHover?.(null);
		createFlowStore.setIntentPatch(choice);
	}

	function previewChoice(choice: DecisionChoice) {
		const nextIntent = { ...createFlowStore.intent, ...choice.choice_value };
		onPreviewHover?.({
			intent: nextIntent,
			label: choice.label,
			previewSet: choice.preview_set,
		});
	}

	function clearChoicePreview() {
		onPreviewHover?.(null);
	}

	function doReset() {
		createFlowStore.resetBuild();
		lastIntentKey = "";
		decisionPackage = null;
		onPreviewHover?.(null);
		createFlowStore.setLastDecision(null);
		onDecision(null);
		syncDecision(createEmptyIntent());
	}

	function doCustomize() {
		createFlowStore.setIntentPatch({ customize_target: "menu" });
	}

	function shouldShowChoicePreview() {
		const questionId = decisionPackage?.question?.id ?? "";
		const hasRenderableHtml =
			decisionPackage?.previews.some((choice) => choice.html.trim().length > 0) ?? false;
		return (
			!["field", "customize_target", "has_bibliography", "bib_template"].includes(questionId) &&
			hasRenderableHtml
		);
	}

	function shouldDeEmphasizeChoiceLabel() {
		return shouldShowChoicePreview();
	}

	function canCustomizeCurrentStyle() {
		const hasPresetBackedChoices = Boolean(
			createFlowStore.intent.from_preset ||
			createFlowStore.intent.contributor_preset ||
			createFlowStore.intent.date_preset ||
			createFlowStore.intent.title_preset ||
			createFlowStore.intent.bib_template
		);

		return (
			hasPresetBackedChoices &&
			!["field", "class", "customize_target"].includes(decisionPackage?.question?.id ?? "")
		);
	}

	async function downloadCitum() {
		const styleName = createFlowStore.draftName.trim();
		if (!styleName) {
			error = "Name your style before downloading it.";
			return;
		}

		try {
			const res = await fetch("/api/v1/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(createFlowStore.intent),
			});
			if (res.ok) {
				const blob = await res.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = sanitizeStyleFilename(styleName);
				document.body.appendChild(a);
				a.click();
				a.remove();
			} else {
				alert("Failed to generate Citum");
			}
		} catch (e) {
			alert(`Error: ${String(e)}`);
		}
	}

	$effect(() => {
		if (decisionPackage?.question === null && !createFlowStore.draftName.trim()) {
			createFlowStore.setDraftName(suggestBuildStyleName(createFlowStore.intent));
		}
	});
</script>

{#if loading && !decisionPackage}
	<div class="flex items-center justify-center py-20">
		<div
			class="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full"
		></div>
	</div>
{:else if error}
	<div class="p-6 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
		<p class="font-medium mb-2">{error}</p>
		<button
			onclick={() => fetchDecision(createFlowStore.intent)}
			class="font-bold hover:underline flex items-center gap-1"
		>
			<span class="material-symbols-outlined text-sm">refresh</span> Retry
		</button>
	</div>
{:else if decisionPackage}
	{#if decisionPackage.question}
		<div class="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div class="flex flex-col gap-1">
				<h2 class="text-lg font-bold text-slate-900">{decisionPackage.question.text}</h2>
				{#if decisionPackage.question.description}
					<p class="text-sm text-slate-500 leading-relaxed">
						{decisionPackage.question.description}
					</p>
				{/if}
			</div>

			<div class="grid grid-cols-1 gap-4">
				{#each decisionPackage.previews as choice}
					<button
						onclick={() => handleChoice(choice.choice_value)}
						onmouseenter={() => previewChoice(choice)}
						onmouseleave={clearChoicePreview}
						onfocus={() => previewChoice(choice)}
						onblur={clearChoicePreview}
						class="p-4 rounded-xl border border-slate-200 text-left hover:border-primary hover:bg-blue-50/30 transition-all group overflow-hidden relative"
					>
						<div class="flex flex-col gap-3 relative z-10">
							{#if shouldShowChoicePreview()}
								<div
									class="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm font-serif leading-7 text-slate-700 group-hover:bg-white transition-colors"
								>
									<!-- eslint-disable-next-line svelte/no-at-html-tags -->
									{@html choice.html ||
										getChoicePreviewHtml(createFlowStore.intent, choice.preview_set)}
								</div>
							{/if}
							<div class="flex justify-between items-start gap-3">
								<div class="min-w-0">
									{#if shouldDeEmphasizeChoiceLabel()}
										<p class="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
											Starting point
										</p>
										<p class="mt-1 text-xs font-medium text-slate-500">
											{choice.label}
										</p>
									{:else}
										<span
											class="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors"
										>
											{choice.label}
										</span>
									{/if}
								</div>
								<span
									class="material-symbols-outlined text-transparent group-hover:text-primary text-xl transition-all translate-x-1"
								>
									arrow_forward
								</span>
							</div>
						</div>
					</button>
				{/each}
			</div>
		</div>
	{:else}
		<!-- Completion State -->
		<div class="flex flex-col gap-6 py-4 animate-in fade-in zoom-in duration-500">
			<div
				class="size-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2"
			>
				<span class="material-symbols-outlined text-4xl">check_circle</span>
			</div>
			<div class="text-center">
				<h3 class="text-xl font-bold text-slate-900 mb-2">Style Ready!</h3>
				<p class="text-slate-600 text-sm leading-relaxed">
					Your citation style has been configured. You can now download the Citum file or use it in
					your editor.
				</p>
			</div>
			<div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
				<label class="block text-left">
					<span class="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
						Name your style
					</span>
					<input
						class="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
						type="text"
						maxlength="100"
						value={createFlowStore.draftName}
						oninput={(event) =>
							createFlowStore.setDraftName((event.currentTarget as HTMLInputElement).value)}
					/>
				</label>
				<p class="mt-3 text-xs text-slate-500">
					Download filename: <span class="font-semibold text-slate-700">
						{sanitizeStyleFilename(createFlowStore.draftName)}
					</span>
				</p>
			</div>
			<button
				onclick={downloadCitum}
				class="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
				disabled={!createFlowStore.draftName.trim()}
			>
				Download Citum Style
			</button>
			<button
				onclick={doCustomize}
				class="w-full py-3 text-primary text-sm font-bold hover:text-primary-dark transition-colors flex items-center justify-center gap-2"
			>
				<span class="material-symbols-outlined text-sm">tune</span>
				Customize Style
			</button>
			<button
				onclick={doReset}
				class="w-full py-3 text-slate-500 text-sm font-bold hover:text-slate-900 transition-colors"
			>
				Start Over
			</button>
		</div>
	{/if}

	<!-- Sticky footer reset button in wizard -->
	{#if decisionPackage.question}
		<div class="mt-8 pt-6 border-t border-slate-100">
			{#if canCustomizeCurrentStyle()}
				<button
					onclick={doCustomize}
					class="w-full py-2.5 text-primary text-xs font-bold uppercase tracking-widest hover:text-primary-dark transition-colors flex items-center justify-center gap-2 mb-3"
				>
					<span class="material-symbols-outlined text-sm">tune</span> Customize Style
				</button>
			{/if}
			<button
				onclick={doReset}
				class="w-full py-2.5 text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-red-500 transition-colors flex items-center justify-center gap-2"
			>
				<span class="material-symbols-outlined text-sm">restart_alt</span> Reset Wizard
			</button>
		</div>
	{/if}
{/if}
