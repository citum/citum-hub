<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { onMount } from "svelte";

	import type { HubSearchResponse, HubStyleSummary } from "$lib/types/style";

	let publicStyles: HubStyleSummary[] = $state([]);
	let searchQuery = $state("");
	let loading = $state(true);
	let error = $state<string | null>(null);
	let disciplines: string[] = $state([]);
	let families: string[] = $state([]);
	let selectedFields: string[] = $state([]);
	let selectedFamily = $state("");

	async function loadStyles() {
		loading = true;
		error = null;

		try {
			const params = new URLSearchParams();
			if (searchQuery.trim()) params.set("q", searchQuery.trim());
			for (const field of selectedFields) params.append("field", field);
			if (selectedFamily) params.set("family", selectedFamily);
			params.set("page_size", "36");

			const res = await fetch(`/api/hub?${params.toString()}`);
			if (!res.ok) {
				error = "Failed to load hub styles";
				return;
			}
			const data = (await res.json()) as HubSearchResponse;
			publicStyles = data.items;
			disciplines = data.filters.fields;
			families = data.filters.families;
		} catch {
			error = "Network error";
		} finally {
			loading = false;
		}
	}

	onMount(async () => {
		searchQuery = page.url.searchParams.get("q") || "";
		selectedFields = page.url.searchParams.getAll("field");
		selectedFamily = page.url.searchParams.get("family") || "";
		await loadStyles();
	});

	function applyFilters() {
		const params = new URLSearchParams();
		if (searchQuery.trim()) params.set("q", searchQuery.trim());
		for (const field of selectedFields) params.append("field", field);
		if (selectedFamily) params.set("family", selectedFamily);
		goto(`/library/browse${params.toString() ? `?${params.toString()}` : ""}`, {
			replaceState: true,
			noScroll: true,
		});
		loadStyles();
	}

	function toggleField(field: string) {
		selectedFields = selectedFields.includes(field)
			? selectedFields.filter((value) => value !== field)
			: [...selectedFields, field];
		applyFilters();
	}

	function resetFilters() {
		searchQuery = "";
		selectedFields = [];
		selectedFamily = "";
		applyFilters();
	}
</script>

<main
	class="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef3fb_100%)] px-4 py-10 lg:px-10"
>
	<div class="mx-auto max-w-[1280px]">
		<section
			class="rounded-[2.4rem] border border-slate-200 bg-white/85 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.06)] backdrop-blur lg:p-8"
		>
			<div class="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
				<div class="max-w-2xl">
					<p class="text-xs font-black uppercase tracking-[0.22em] text-primary">Style Browser</p>
					<h1 class="mt-3 text-4xl font-black tracking-[-0.04em] text-slate-950 lg:text-5xl">
						Find and manage citation formatting for your manuscripts.
					</h1>
					<p class="mt-4 text-base leading-7 text-slate-600">
						Search canonical styles, scan alias-heavy results, and jump straight into a
						customization flow when a journal match is close but not perfect.
					</p>
				</div>

				<div class="flex gap-3">
					<a
						href="/create"
						class="inline-flex items-center gap-2 rounded-[1.3rem] border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-primary/30 hover:text-primary"
					>
						<span class="material-symbols-outlined text-lg">edit</span>
						Open Visual Editor
					</a>
				</div>
			</div>

			<div class="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
				<label class="relative block">
					<span
						class="material-symbols-outlined pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
						>search</span
					>
					<input
						bind:value={searchQuery}
						type="text"
						placeholder="Search by style, journal, field, short title, or ISSN"
						class="w-full rounded-[1.4rem] border border-slate-200 bg-slate-50 px-14 py-4 text-base text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/10"
						onkeydown={(event) => event.key === "Enter" && applyFilters()}
					/>
				</label>

				<div class="flex gap-3">
					<button
						class="inline-flex flex-1 items-center justify-center gap-2 rounded-[1.4rem] bg-primary px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-blue-700"
						onclick={applyFilters}
					>
						<span class="material-symbols-outlined text-lg">manage_search</span>
						Search
					</button>
					<button
						class="inline-flex items-center justify-center gap-2 rounded-[1.4rem] border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
						onclick={resetFilters}
					>
						<span class="material-symbols-outlined text-lg">restart_alt</span>
						Reset
					</button>
				</div>
			</div>

			<div class="mt-6 grid gap-4 lg:grid-cols-2">
				<div class="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
					<p class="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
						Disciplines
					</p>
					<div class="flex flex-wrap gap-2">
						<button
							class={`rounded-full px-3 py-2 text-sm font-bold transition ${selectedFields.length === 0 ? "bg-primary text-white" : "bg-white text-slate-600 hover:text-primary"}`}
							onclick={() => {
								selectedFields = [];
								applyFilters();
							}}
						>
							All Fields
						</button>
						{#each disciplines as field}
							<button
								class={`rounded-full px-3 py-2 text-sm font-bold transition ${selectedFields.includes(field) ? "bg-primary text-white" : "bg-white text-slate-600 hover:text-primary"}`}
								onclick={() => toggleField(field)}
							>
								{field}
							</button>
						{/each}
					</div>
				</div>

				<div class="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
					<p class="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
						Style Families
					</p>
					<div class="flex flex-wrap gap-2">
						<button
							class={`rounded-full px-3 py-2 text-sm font-bold transition ${selectedFamily === "" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:text-slate-900"}`}
							onclick={() => {
								selectedFamily = "";
								applyFilters();
							}}
						>
							All Families
						</button>
						{#each families as family}
							<button
								class={`rounded-full px-3 py-2 text-sm font-bold transition ${selectedFamily === family ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:text-slate-900"}`}
								onclick={() => {
									selectedFamily = family;
									applyFilters();
								}}
							>
								{family}
							</button>
						{/each}
					</div>
				</div>
			</div>
		</section>

		<section class="mt-10">
			<div class="mb-6 flex items-center justify-between gap-4">
				<div>
					<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Results</p>
					<h2 class="mt-2 text-2xl font-black text-slate-950">
						Showing {publicStyles.length} style{publicStyles.length === 1 ? "" : "s"}
					</h2>
				</div>
			</div>

			{#if loading}
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
					{#each Array.from({ length: 6 }, (_, index) => index) as index}
						<div class="h-72 animate-pulse rounded-[2rem] bg-white" aria-hidden={index > -1}></div>
					{/each}
				</div>
			{:else if error}
				<div class="rounded-[2rem] border border-red-100 bg-red-50 p-8 text-center text-red-600">
					<p>{error}</p>
				</div>
			{:else if publicStyles.length === 0}
				<div
					class="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 p-12 text-center"
				>
					<span class="material-symbols-outlined text-5xl text-slate-300">search_off</span>
					<p class="mt-4 text-lg font-medium text-slate-500">No styles match your filters.</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
					{#each publicStyles as style}
						<article
							class="group flex h-full flex-col justify-between rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
						>
							<div>
								<div class="flex items-start justify-between gap-4">
									<div>
										<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
											{style.family}
										</p>
										<h3
											class="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950 group-hover:text-primary"
										>
											{style.title}
										</h3>
									</div>
									<span
										class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500"
									>
										{style.alias_count} aliases
									</span>
								</div>

								<p class="mt-4 text-sm leading-7 text-slate-600">
									{style.description ||
										`Canonical ${style.family.toLowerCase()} style in the Citum registry.`}
								</p>
								<p
									class="mt-4 rounded-[1.3rem] border border-slate-100 bg-slate-50 px-4 py-3 font-serif text-sm leading-7 text-slate-700"
								>
									{style.preview_text}
								</p>

								{#if style.match_context}
									<p class="mt-4 text-sm font-medium text-primary">{style.match_context}</p>
								{/if}

								<div class="mt-5 flex flex-wrap gap-2">
									{#each style.fields as field}
										<span
											class="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500"
										>
											{field}
										</span>
									{/each}
								</div>
							</div>

							<div class="mt-6 flex flex-wrap gap-3">
								<a
									href={`/create/tweak?source=${encodeURIComponent(style.id)}`}
									class="inline-flex flex-1 items-center justify-center gap-2 rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-primary/30 hover:text-primary"
								>
									<span class="material-symbols-outlined text-lg">edit</span>
									Customize
								</a>
								<a
									href={`/api/hub/${style.id}/download`}
									class="inline-flex flex-1 items-center justify-center gap-2 rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
								>
									<span class="material-symbols-outlined text-lg">download</span>
									Download YAML
								</a>
								<a
									href={`/style/${style.id}#aliases`}
									class="inline-flex flex-1 items-center justify-center gap-2 rounded-[1.2rem] bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
								>
									<span class="material-symbols-outlined text-lg">visibility</span>
									View Aliases
								</a>
							</div>
						</article>
					{/each}
				</div>
			{/if}
		</section>
	</div>
</main>
