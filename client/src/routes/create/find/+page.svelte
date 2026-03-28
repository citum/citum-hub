<script lang="ts">
	import { onMount } from "svelte";
	import { createFlowStore } from "$lib/stores/create-flow.svelte";

	onMount(() => {
		createFlowStore.restore();
		createFlowStore.setMode("find");
	});
</script>

<div class="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6">
	<section class="max-w-3xl">
		<p class="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Find</p>
		<h1 class="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
			Start from the closest style instead of building from scratch.
		</h1>
		<p class="mt-4 max-w-2xl text-base leading-7 text-slate-600">
			Search by style name, discipline, or family. The rewrite keeps discovery as the primary path,
			with example-based matching landing in a follow-up slice.
		</p>
	</section>

	<section class="grid gap-4 md:grid-cols-3">
		<div class="rounded-3xl border border-slate-200 bg-white p-6">
			<h2 class="text-lg font-bold text-slate-950">Search by name</h2>
			<p class="mt-2 text-sm leading-6 text-slate-600">
				Look for known styles such as APA, Nature, Chicago, or discipline-specific variants.
			</p>
		</div>
		<div class="rounded-3xl border border-slate-200 bg-white p-6">
			<h2 class="text-lg font-bold text-slate-950">Search by field</h2>
			<p class="mt-2 text-sm leading-6 text-slate-600">
				Use humanities, medicine, sciences, or social sciences to narrow to realistic defaults.
			</p>
		</div>
		<div class="rounded-3xl border border-slate-200 bg-white p-6">
			<h2 class="text-lg font-bold text-slate-950">Search by example</h2>
			<p class="mt-2 text-sm leading-6 text-slate-600">
				Reverse-match from a sample citation is planned next. This route establishes the discovery
				entry now.
			</p>
		</div>
	</section>

	<div class="flex flex-wrap gap-3">
		<a
			href="/library/browse"
			class="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
		>
			Browse the library
		</a>
		<a
			href="/create"
			class="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
		>
			Back to create modes
		</a>
	</div>
</div>
