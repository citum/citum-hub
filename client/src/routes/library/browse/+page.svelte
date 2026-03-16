<script lang="ts">
import { onMount } from "svelte";

import type { Style } from "$lib/types/style";

let publicStyles: Style[] = $state([]);
let searchQuery = $state("");
let loading = $state(true);
let error = $state(null);

const filteredStyles = $derived(
	publicStyles.filter((s) =>
		s.title.toLowerCase().includes(searchQuery.toLowerCase()),
	),
);

onMount(async () => {
	try {
		const res = await fetch("/api/hub");
		if (res.ok) {
			publicStyles = await res.json();
		} else {
			error = "Failed to load hub styles";
		}
	} catch {
		error = "Network error";
	} finally {
		loading = false;
	}
});
</script>

<div class="px-4 py-10 lg:px-10 max-w-[1200px] mx-auto">
	<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
		<div>
			<h1 class="text-3xl font-bold text-slate-900">Browse Style Hub</h1>
			<p class="text-slate-500">Discover and use citation styles created by the community</p>
		</div>

		<div class="w-full md:w-80 relative">
			<span
				class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
				>search</span
			>
			<input
				bind:value={searchQuery}
				type="text"
				placeholder="Filter styles..."
				class="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
			/>
		</div>
	</div>

	{#if loading}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
			<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
			{#each Array(6) as _}
				<div class="h-64 bg-slate-100 animate-pulse rounded-3xl"></div>
			{/each}
		</div>
	{:else if error}
		<div class="bg-red-50 text-red-600 p-8 rounded-3xl border border-red-100 text-center">
			<span class="material-symbols-outlined text-4xl mb-2">error</span>
			<p>{error}</p>
		</div>
	{:else if filteredStyles.length === 0}
		<div class="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
			<span class="material-symbols-outlined text-6xl text-slate-200 mb-4">search_off</span>
			<p class="text-slate-500 text-lg">No styles match your search.</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
			{#each filteredStyles as style}
				<div
					class="group bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all flex flex-col justify-between"
				>
					<div>
						<div class="flex justify-between items-start mb-6">
							<div
								class="size-12 bg-slate-50 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors"
							>
								<span class="material-symbols-outlined text-2xl">description</span>
							</div>
							<span
								class="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded"
								>Verified</span
							>
						</div>
						<h3
							class="text-xl font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors"
						>
							{style.title}
						</h3>
						<p class="text-sm text-slate-500 leading-relaxed mb-6 line-clamp-2">
							Official citation style for {style.title}.
						</p>
					</div>
					<div class="flex items-center justify-between pt-6 border-t border-slate-50">
						<a href="/style/{style.id}" class="text-sm font-bold text-primary hover:underline"
							>View Details</a
						>
						<span
							class="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors"
							>arrow_forward</span
						>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
