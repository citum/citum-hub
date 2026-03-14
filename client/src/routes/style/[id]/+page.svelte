<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import ComprehensivePreview from "$lib/components/ComprehensivePreview.svelte";
	import { auth } from "$lib/stores/auth";

	let style = $state(null);
	let loading = $state(true);
	let previewLoading = $state(false);
	let error = $state(null);
	let isForking = $state(false);
	let showSource = $state(false);

	let previewSet = $state({
		in_text_parenthetical: null,
		in_text_narrative: null,
		note: null,
		bibliography: null,
	});

	onMount(async () => {
		try {
			const res = await fetch(`/api/styles/${page.params.id}`, {
				headers: $auth.token ? { Authorization: `Bearer ${$auth.token}` } : {},
			});
			if (res.ok) {
				style = await res.json();
				generatePreviews();
			} else {
				error = "Style not found or private";
			}
		} catch (_e) {
			error = "Network error";
		} finally {
			loading = false;
		}
	});

	async function generatePreviews() {
		if (!style) return;
		previewLoading = true;

		try {
			const basePayload = style.citum ? { style_yaml: style.citum } : { intent: style.intent };

			// Fetch parenthetical (default)
			const resParen = await fetch("/api/v1/preview", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...basePayload, mode: "NonIntegral" }),
			});

			// Fetch narrative
			const resNarrative = await fetch("/api/v1/preview", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...basePayload, mode: "Integral" }),
			});

			if (resParen.ok && resNarrative.ok) {
				const dataParen = await resParen.json();
				const dataNarrative = await resNarrative.json();

				previewSet = {
					in_text_parenthetical: dataParen.in_text_parenthetical,
					in_text_narrative: dataNarrative.in_text_parenthetical, // endpoint returns result in parenthetical field for single item
					note: dataParen.note || null,
					bibliography: dataParen.bibliography || null,
				};
			}
		} catch (e) {
			console.error("Failed to generate previews", e);
		} finally {
			previewLoading = false;
		}
	}

	async function forkStyle() {
		if (!$auth.user) return;
		isForking = true;
		try {
			const res = await fetch(`/api/styles/${style.id}/fork`, {
				method: "POST",
				headers: { Authorization: `Bearer ${$auth.token}` },
			});
			if (res.ok) {
				goto(`/library`);
			}
		} finally {
			isForking = false;
		}
	}

	async function bookmarkStyle() {
		if (!$auth.user) return;
		await fetch(`/api/styles/${style.id}/bookmark`, {
			method: "POST",
			headers: { Authorization: `Bearer ${$auth.token}` },
		});
		alert("Bookmarked!");
	}
</script>

<div class="px-4 py-10 lg:px-10 max-w-[1000px] mx-auto">
	{#if loading}
		<div class="flex justify-center py-20">
			<span class="material-symbols-outlined animate-spin text-4xl text-slate-300"
				>progress_activity</span
			>
		</div>
	{:else if error}
		<div class="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">
			{error}
		</div>
	{:else}
		<div class="flex flex-col gap-8">
			<div class="flex justify-between items-start">
				<div>
					<nav class="flex gap-2 mb-4">
						<a href="/" class="text-slate-500 text-xs font-medium hover:underline">All Styles</a>
						<span class="text-slate-500 text-xs">/</span>
						<span class="text-slate-900 text-xs font-bold">{style.title}</span>
					</nav>
					<h1 class="text-3xl font-bold text-slate-900 mb-2">{style.title}</h1>
					<p class="text-slate-500 text-sm">
						Last updated {new Date(style.updated_at).toLocaleDateString()}
					</p>
				</div>

				{#if $auth.user}
					<div class="flex gap-3">
						<button
							onclick={bookmarkStyle}
							class="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors"
						>
							<span class="material-symbols-outlined text-xl">bookmark</span>
							Bookmark
						</button>
						<button
							onclick={forkStyle}
							disabled={isForking}
							class="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
						>
							<span class="material-symbols-outlined text-xl">fork_right</span>
							{isForking ? "Forking..." : "Fork Style"}
						</button>
					</div>
				{/if}
			</div>

			<div
				class="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 relative overflow-hidden"
			>
				{#if previewLoading}
					<div
						class="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center"
					>
						<span class="material-symbols-outlined animate-spin text-3xl text-primary"
							>progress_activity</span
						>
					</div>
				{/if}

				<ComprehensivePreview {previewSet} />
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div class="lg:col-span-2 flex flex-col gap-8">
					<section class="bg-white rounded-3xl border border-slate-200 p-8">
						<h2 class="text-xl font-bold text-slate-900 mb-4">About this Style</h2>
						<p class="text-slate-600 leading-relaxed mb-6">
							{style.description ||
								`Official citation style for ${style.title}. Fully compliant with Citum requirements.`}
						</p>

						{#if style.fields?.length}
							<div class="flex flex-wrap gap-2">
								{#each style.fields as field}
									<a
										href="/?searchQuery={field}"
										class="bg-slate-50 text-slate-500 border border-slate-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider hover:bg-slate-100 hover:text-primary transition-colors"
										>{field}</a
									>
								{/each}
							</div>
						{/if}
					</section>

					<section class="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
						<div class="flex justify-between items-center mb-6">
							<div class="flex items-center gap-3">
								<span class="material-symbols-outlined text-primary">code</span>
								<h2 class="text-xl font-bold">Citum Source</h2>
							</div>
							<button
								onclick={() => (showSource = !showSource)}
								class="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
							>
								{showSource ? "Hide Source" : "View YAML"}
							</button>
						</div>

						{#if showSource}
							<pre
								class="bg-black/30 p-6 rounded-2xl text-xs font-mono overflow-x-auto border border-white/5 text-slate-300 max-h-[600px]">{style.citum ||
									JSON.stringify(style.intent, null, 2)}</pre>
						{:else}
							<div
								class="flex items-center justify-center py-10 opacity-40 italic text-sm text-slate-400"
							>
								Click 'View YAML' to see the full style definition.
							</div>
						{/if}
					</section>
				</div>

				<aside class="flex flex-col gap-6">
					<div class="bg-white rounded-3xl border border-slate-200 p-6">
						<h3 class="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
							Original Authors
						</h3>
						<div class="flex flex-col gap-4">
							{#if style.source?.original_authors?.length}
								{#each style.source.original_authors as author}
									<div class="flex items-center gap-3">
										<div
											class="size-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"
										>
											<span class="material-symbols-outlined text-lg">person</span>
										</div>
										<div class="flex flex-col">
											<span class="text-sm font-bold text-slate-900">{author.name}</span>
										</div>
									</div>
								{/each}
							{:else}
								<div class="flex items-center gap-3 opacity-50">
									<div class="size-8 bg-slate-50 rounded-full"></div>
									<span class="text-xs italic">Community contribution</span>
								</div>
							{/if}
						</div>
					</div>

					<div class="bg-white rounded-3xl border border-slate-200 p-6">
						<h3 class="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Meta</h3>
						<div class="flex flex-col gap-4">
							<div class="flex items-center gap-3 text-slate-600">
								<span class="material-symbols-outlined text-lg text-slate-300">verified_user</span>
								<span class="text-sm font-medium">{style.source?.license || "Open Source"}</span>
							</div>
						</div>
					</div>
				</aside>
			</div>
		</div>
	{/if}
</div>
