<script lang="ts">
import { onMount } from "svelte";
import { createInitialIntent, intent, resetIntent } from "$lib/stores/intent";
import type { DecisionPackage, StyleIntent } from "$lib/types/bindings";

let { onDecision } = $props<{
	onDecision: (decision: DecisionPackage | null) => void;
}>();

let loading = $state(false);
let error = $state<string | null>(null);
let decisionPackage = $state<DecisionPackage | null>(null);
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
			decisionPackage = data;
			onDecision(data);
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
	syncDecision($intent);
});

$effect(() => {
	const currentIntent = $intent;
	if (!hasMounted) return;
	syncDecision(currentIntent);
});

function handleChoice(choice: Partial<StyleIntent>) {
	intent.update((prev) => ({ ...prev, ...choice }));
}

function doReset() {
	resetIntent();
	lastIntentKey = "";
	decisionPackage = null;
	onDecision(null);
	syncDecision(createInitialIntent());
}

function doCustomize() {
	intent.update((prev) => ({ ...prev, customize_target: "menu" }));
}

function shouldShowChoicePreview() {
	return !["field", "customize_target"].includes(
		decisionPackage?.question?.id ?? "",
	);
}

function canCustomizeCurrentStyle() {
	const hasPresetBackedChoices = Boolean(
		$intent.from_preset ||
			$intent.contributor_preset ||
			$intent.date_preset ||
			$intent.title_preset ||
			$intent.bib_template,
	);

	return (
		hasPresetBackedChoices &&
		!["field", "class", "customize_target"].includes(
			decisionPackage?.question?.id ?? "",
		)
	);
}

async function downloadCitum() {
	try {
		const res = await fetch("/api/v1/generate", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify($intent),
		});
		if (res.ok) {
			const blob = await res.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "custom-style.yaml";
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
			onclick={() => fetchDecision($intent)}
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
						class="p-4 rounded-xl border border-slate-200 text-left hover:border-primary hover:bg-blue-50/30 transition-all group overflow-hidden relative"
					>
						<div class="flex flex-col gap-3 relative z-10">
							<div class="flex justify-between items-center">
								<span
									class="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors"
								>
									{choice.label}
								</span>
								<span
									class="material-symbols-outlined text-transparent group-hover:text-primary text-xl transition-all translate-x-1"
								>
									arrow_forward
								</span>
							</div>
							{#if shouldShowChoicePreview()}
								<div
									class="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] font-serif text-slate-600 group-hover:bg-white transition-colors"
								>
									<!-- eslint-disable-next-line svelte/no-at-html-tags -->
									{@html choice.html}
								</div>
							{/if}
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
			<button
				onclick={downloadCitum}
				class="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
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
