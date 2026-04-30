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
			Search the library by style name, discipline, or family. If something close already exists,
			using it is faster than building from scratch — and you can always tweak the result.
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
		<div class="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-6">
			<div class="flex items-center gap-2">
				<h2 class="text-lg font-bold text-slate-500">Search by example</h2>
				<span
					class="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500"
				>
					Coming soon
				</span>
			</div>
			<p class="mt-2 text-sm leading-6 text-slate-500">
				Paste a sample citation and find styles that produce something close. Not yet available.
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
