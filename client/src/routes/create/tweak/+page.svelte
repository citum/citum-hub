<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import { createFlowStore } from "$lib/stores/create-flow.svelte";
	import type { HubStyleDetail } from "$lib/types/style";

	let sourceStyleKey = $derived($page.url.searchParams.get("source"));
	let sourceStyle = $state<HubStyleDetail["style"] | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let isReady = $state(false);
	let activeRequestId = 0;

	function clearSourceStyle() {
		sourceStyle = null;
		error = null;
		loading = false;
	}

	async function loadSourceStyle(styleKey: string) {
		const requestId = ++activeRequestId;
		loading = true;
		error = null;

		try {
			const res = await fetch(`/api/hub/${encodeURIComponent(styleKey)}`);
			if (requestId !== activeRequestId) return;
			if (!res.ok) {
				error = "Could not load that style from the library.";
				sourceStyle = null;
				return;
			}

			const detail = (await res.json()) as HubStyleDetail;
			if (requestId !== activeRequestId) return;
			sourceStyle = detail.style;
		} catch {
			if (requestId !== activeRequestId) return;
			error = "Could not load that style from the library.";
			sourceStyle = null;
		} finally {
			if (requestId === activeRequestId) {
				loading = false;
			}
		}
	}

	onMount(() => {
		createFlowStore.restore();
		createFlowStore.setMode("tweak");
		isReady = true;
	});

	$effect(() => {
		if (!isReady) return;

		createFlowStore.setSourceStyleKey(sourceStyleKey);
		if (sourceStyleKey) {
			void loadSourceStyle(sourceStyleKey);
			return;
		}

		activeRequestId++;
		clearSourceStyle();
	});
</script>

<div class="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6">
	<section class="max-w-3xl">
		<p class="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Tweak</p>
		<h1 class="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
			Start from a close match and change only what differs.
		</h1>
		<p class="mt-4 max-w-2xl text-base leading-7 text-slate-600">
			This rewrite keeps tweaks distinct from full creation. The next implementation slice will turn
			a selected style into a minimal-override workflow instead of a full fork.
		</p>
	</section>

	<div class="rounded-3xl border border-slate-200 bg-white p-6">
		<p class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Selected Source</p>
		{#if loading}
			<p class="mt-3 text-sm text-slate-500">Loading the selected style…</p>
		{:else if sourceStyle}
			<h2 class="mt-3 text-2xl font-bold text-slate-950">{sourceStyle.title}</h2>
			<p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
				{sourceStyle.description ||
					"This style came from the library and is now pinned as the starting point for your tweak session."}
			</p>
			<p
				class="mt-4 rounded-[1.2rem] border border-slate-100 bg-slate-50 px-4 py-3 font-serif text-sm leading-7 text-slate-700"
			>
				{sourceStyle.preview_text}
			</p>
			<div class="mt-4 flex flex-wrap gap-2">
				<span
					class="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500"
				>
					{sourceStyle.family}
				</span>
				{#each sourceStyle.fields as field}
					<span
						class="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500"
					>
						{field}
					</span>
				{/each}
			</div>
		{:else if error}
			<p class="mt-3 text-sm text-red-600">{error}</p>
			<p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
				The selected source id was <span class="font-semibold">{sourceStyleKey}</span>.
			</p>
		{:else}
			<h2 class="mt-3 text-2xl font-bold text-slate-950">Choose a source style</h2>
			<p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
				Pick an existing style from the library first. Tweak is intended for “like APA but…”
				changes, not full rebuilds.
			</p>
		{/if}
	</div>

	<div class="flex flex-wrap gap-3">
		<a
			href={sourceStyleKey
				? `/create/build?source=${encodeURIComponent(sourceStyleKey)}`
				: "/library/browse"}
			class="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
		>
			{sourceStyleKey ? "Continue with this source" : "Choose a base style"}
		</a>
		<a
			href={sourceStyleKey ? `/style/${sourceStyleKey}` : "/create/build"}
			class="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
		>
			{sourceStyleKey ? "View source style" : "Build instead"}
		</a>
	</div>
</div>
