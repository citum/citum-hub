<script lang="ts">
	import { wizardStore } from "$lib/stores/wizard.svelte";

	const hasBuildDraft = $derived(Boolean(wizardStore.styleYaml || wizardStore.field));
</script>

<main
	class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-12 lg:px-10"
>
	<div class="mx-auto max-w-6xl">
		<div class="mb-12 max-w-3xl">
			<p class="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Create</p>
			<h1 class="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
				Find a style, tweak a close match, or build a new one.
			</h1>
			<p class="mt-4 text-lg leading-8 text-slate-600">
				The rewrite moves `/create` to a product-level entry point instead of a direct wizard
				redirect. Build remains available today under a dedicated namespace while the spec-aligned
				flows land in follow-up slices.
			</p>
		</div>

		<div class="grid gap-6 lg:grid-cols-3">
			<a
				href="/create/find"
				class="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
			>
				<p class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Find</p>
				<h2 class="mt-4 text-2xl font-bold text-slate-900">Use an existing style</h2>
				<p class="mt-3 text-base leading-7 text-slate-600">
					Search the style library by field, family, or name before you open any editing flow.
				</p>
			</a>

			<a
				href="/create/tweak"
				class="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-amber-400/50 hover:shadow-xl"
			>
				<p class="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Tweak</p>
				<h2 class="mt-4 text-2xl font-bold text-slate-900">Modify a close match</h2>
				<p class="mt-3 text-base leading-7 text-slate-600">
					Start from a real style and change only the parts that need to differ.
				</p>
			</a>

			<a
				href="/create/build"
				class="rounded-[2rem] border border-slate-200 bg-slate-900 p-8 text-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
			>
				<p class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Build</p>
				<h2 class="mt-4 text-2xl font-bold">Create a new style</h2>
				<p class="mt-3 text-base leading-7 text-slate-300">
					Use the guided build flow to create a style from scratch, then refine it further.
				</p>
			</a>
		</div>

		{#if hasBuildDraft}
			<div
				class="mt-8 rounded-[2rem] border border-blue-200 bg-blue-50 px-6 py-5 text-sm text-blue-950"
			>
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p class="font-semibold">A build draft is still available.</p>
						<p class="mt-1 text-blue-800">
							Resume the guided build flow from the new `Build` namespace.
						</p>
					</div>
					<a
						href="/create/build"
						class="inline-flex items-center justify-center rounded-full bg-blue-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
					>
						Resume build
					</a>
				</div>
			</div>
		{/if}
	</div>
</main>
