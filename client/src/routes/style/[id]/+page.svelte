<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";

	import ComprehensivePreview from "$lib/components/ComprehensivePreview.svelte";
	import { auth } from "$lib/stores/auth";
	import type { HubAliasRecord, HubStyleDetail, Style } from "$lib/types/style";

	type LegacyStyle = Style & {
		citum?: string | null;
		description?: string;
		fields?: string[];
		source?: {
			license?: string;
			original_authors?: Array<{ name?: string }>;
		};
	};

	type TabId = "overview" | "style" | "aliases" | "history" | "permissions";

	let detail = $state<HubStyleDetail | null>(null);
	let legacyStyle = $state<LegacyStyle | null>(null);
	let loading = $state(true);
	let previewLoading = $state(false);
	let error = $state<string | null>(null);
	let showSource = $state(false);
	let activeTab = $state<TabId>("overview");

	let previewSet = $state({
		in_text_parenthetical: null,
		in_text_narrative: null,
		note: null,
		bibliography: null,
	});

	const tabs = [
		{ id: "overview", label: "Overview", icon: "info" },
		{ id: "style", label: "Style", icon: "account_tree" },
		{ id: "aliases", label: "Aliases", icon: "list_alt" },
		{ id: "history", label: "History", icon: "history" },
		{ id: "permissions", label: "Permissions", icon: "shield" },
	] as const;

	const detailStyle = $derived((detail ? detail.style : null) as HubStyleDetail["style"] | null);
	const aliasRows = $derived((detail ? detail.aliases.items : []) as HubAliasRecord[]);
	const styleTitle = $derived(detailStyle?.title || legacyStyle?.title || "Style");
	const styleDescription = $derived(
		detailStyle?.description ||
			legacyStyle?.description ||
			`Registry entry for ${detailStyle?.title || legacyStyle?.title || "this style"}.`
	);
	const styleFields = $derived(detailStyle?.fields || legacyStyle?.fields || []);
	const styleYaml = $derived(detailStyle?.citum || legacyStyle?.citum || null);
	const styleLicense = $derived(
		detailStyle?.source_license || legacyStyle?.source?.license || "Open Source"
	);
	const originalAuthors = $derived(
		detailStyle?.original_authors || legacyStyle?.source?.original_authors || []
	);

	const HASH_TO_TAB: Record<string, TabId> = {
		"#overview": "overview",
		"#style": "style",
		"#definition": "style",
		"#aliases": "aliases",
		"#history": "history",
		"#permissions": "permissions",
	};

	function syncTabFromHash() {
		if (typeof window === "undefined") return;
		activeTab = HASH_TO_TAB[window.location.hash] || "overview";
	}

	async function loadStyle() {
		try {
			const hubRes = await fetch(`/api/hub/${page.params.id}`, {
				headers: $auth.token ? { Authorization: `Bearer ${$auth.token}` } : {},
			});

			if (hubRes.ok) {
				detail = (await hubRes.json()) as HubStyleDetail;
				await generatePreviews(detail.style.citum);
				return;
			}

			const legacyRes = await fetch(`/api/styles/${page.params.id}`, {
				headers: $auth.token ? { Authorization: `Bearer ${$auth.token}` } : {},
			});
			if (legacyRes.ok) {
				legacyStyle = (await legacyRes.json()) as LegacyStyle;
				await generatePreviews(legacyStyle.citum || null);
			} else {
				error = "Style not found or private";
			}
		} catch {
			error = "Network error";
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		syncTabFromHash();
		void loadStyle();

		const handleHashChange = () => syncTabFromHash();
		window.addEventListener("hashchange", handleHashChange);

		return () => {
			window.removeEventListener("hashchange", handleHashChange);
		};
	});

	async function generatePreviews(citum: string | null) {
		if (!citum) return;
		previewLoading = true;

		try {
			const [resParen, resNarrative] = await Promise.all([
				fetch("/api/v1/preview", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ style_yaml: citum, mode: "non-integral" }),
				}),
				fetch("/api/v1/preview", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ style_yaml: citum, mode: "integral" }),
				}),
			]);

			if (resParen.ok && resNarrative.ok) {
				const dataParen = await resParen.json();
				const dataNarrative = await resNarrative.json();

				previewSet = {
					in_text_parenthetical: dataParen.in_text_parenthetical,
					in_text_narrative: dataNarrative.in_text_narrative,
					note: dataParen.note || null,
					bibliography: dataParen.bibliography || null,
				};
			}
		} finally {
			previewLoading = false;
		}
	}

	async function bookmarkStyle() {
		if (!$auth.user || !detail) return;
		await fetch(`/api/styles/${detail.style.id}/bookmark`, {
			method: "POST",
			headers: { Authorization: `Bearer ${$auth.token}` },
		});
	}

	async function forkStyle() {
		if (!$auth.user || !detail) return;
		await fetch(`/api/styles/${detail.style.id}/fork`, {
			method: "POST",
			headers: { Authorization: `Bearer ${$auth.token}` },
		});
		goto("/library");
	}

	function openTab(tabId: TabId) {
		activeTab = tabId;
		if (typeof window !== "undefined") {
			window.history.pushState({}, "", `${window.location.pathname}#${tabId}`);
		}
	}

	function aliasIdentifier(alias: HubAliasRecord) {
		if (alias.issns.length > 0) return alias.issns.join(" / ");
		if (alias.title_short) return alias.title_short;
		return alias.entry_slug;
	}
</script>

<main
	class="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef3fb_100%)] px-4 py-10 lg:px-10"
>
	<div class="mx-auto max-w-[1280px]">
		{#if loading}
			<div class="flex justify-center py-20">
				<span class="material-symbols-outlined animate-spin text-4xl text-slate-300"
					>progress_activity</span
				>
			</div>
		{:else if error}
			<div class="rounded-[2rem] border border-red-100 bg-red-50 p-6 text-red-600">{error}</div>
		{:else}
			<div class="space-y-8">
				<section
					class="rounded-[2.4rem] border border-slate-200 bg-white/85 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.06)] backdrop-blur lg:p-8"
				>
					<div class="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
						<div class="max-w-3xl">
							<nav
								class="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400"
							>
								<a href="/" class="transition hover:text-primary">Registry</a>
								<span>/</span>
								<span class="text-slate-900">{styleTitle}</span>
							</nav>
							<div class="flex flex-wrap items-center gap-3">
								<span
									class="rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-primary"
								>
									Primary
								</span>
								{#if detail}
									<span
										class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500"
									>
										{detail.style.alias_count} active aliases linked
									</span>
								{/if}
							</div>
							<h1 class="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950 lg:text-5xl">
								{styleTitle}
							</h1>
							<p class="mt-4 max-w-2xl text-base leading-7 text-slate-600">{styleDescription}</p>
						</div>

						<div
							class="grid gap-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-5 lg:min-w-[320px]"
						>
							<div>
								<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
									Registry Details
								</p>
								<div class="mt-4 space-y-3 text-sm text-slate-600">
									<div class="flex items-center justify-between gap-4">
										<span>Version</span>
										<span class="font-bold text-slate-900"
											>{detail?.permissions.is_primary ? "1.0" : "Draft"}</span
										>
									</div>
									<div class="flex items-center justify-between gap-4">
										<span>Family</span>
										<span class="font-bold text-slate-900">
											{detail?.style.family || "Custom"}
										</span>
									</div>
									<div class="flex items-center justify-between gap-4">
										<span>Last Updated</span>
										<span class="font-bold text-slate-900">
											{new Date(
												(detail?.style.updated_at || legacyStyle?.updated_at) ?? Date.now()
											).toLocaleDateString()}
										</span>
									</div>
								</div>
							</div>

							{#if detail}
								<div class="flex flex-wrap gap-3">
									<a
										href={`/api/hub/${detail.style.id}/download`}
										class="inline-flex flex-1 items-center justify-center gap-2 rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-primary/30 hover:text-primary"
									>
										<span class="material-symbols-outlined text-lg">download</span>
										Download Style
									</a>
									{#if $auth.user}
										<button
											class="inline-flex flex-1 items-center justify-center gap-2 rounded-[1.2rem] bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
											onclick={forkStyle}
										>
											<span class="material-symbols-outlined text-lg">fork_right</span>
											Customize
										</button>
									{/if}
								</div>
								{#if $auth.user}
									<button
										class="inline-flex items-center justify-center gap-2 rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-primary/30 hover:text-primary"
										onclick={bookmarkStyle}
									>
										<span class="material-symbols-outlined text-lg">bookmark</span>
										Save to Library
									</button>
								{/if}
							{/if}
						</div>
					</div>

					<div class="mt-8 flex flex-wrap gap-2">
						{#each tabs as tab}
							<button
								class={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${activeTab === tab.id ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:text-slate-950"}`}
								onclick={() => openTab(tab.id)}
							>
								<span class="material-symbols-outlined text-lg">{tab.icon}</span>
								{tab.label}
							</button>
						{/each}
					</div>
				</section>

				<section class="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
					<div class="space-y-8">
						<section
							class="relative overflow-hidden rounded-[2.4rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] lg:p-8"
						>
							{#if previewLoading}
								<div
									class="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm"
								>
									<span class="material-symbols-outlined animate-spin text-3xl text-primary"
										>progress_activity</span
									>
								</div>
							{/if}
							<ComprehensivePreview
								{previewSet}
								title="Reference Preview"
								subtitle="See how this style renders before you inspect the aliases people use to find it."
							/>
						</section>

						<section
							class="rounded-[2.4rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] lg:p-8"
						>
							{#if activeTab === "overview"}
								<div class="space-y-6">
									<div>
										<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
											Overview
										</p>
										<h2 class="mt-3 text-2xl font-black text-slate-950">Style Registry</h2>
										<p class="mt-4 text-sm leading-7 text-slate-600">
											This style is the canonical formatting entry. Aliases are alternate names and
											search handles that point back to the same behavior, while locale variants are
											excluded because Citum handles locale separately.
										</p>
									</div>

									<div class="grid gap-4 md:grid-cols-2">
										<div class="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
											<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
												Active Aliases
											</p>
											<p class="mt-3 text-4xl font-black tracking-[-0.04em] text-slate-950">
												{detail?.aliases.total || 0}
											</p>
										</div>
										<div class="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
											<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
												Download Format
											</p>
											<p class="mt-3 text-lg font-bold text-slate-950">Citum YAML</p>
											<p class="mt-2 text-sm text-slate-600">
												Public export stays core-compatible and registry metadata remains internal.
											</p>
										</div>
									</div>
								</div>
							{/if}

							{#if activeTab === "style"}
								<div class="space-y-6">
									<div>
										<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
											Style
										</p>
										<h2 class="mt-3 text-2xl font-black text-slate-950">Canonical style details</h2>
									</div>
									<div class="grid gap-4 md:grid-cols-2">
										<div class="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
											<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
												Family
											</p>
											<p class="mt-2 text-lg font-bold text-slate-950">
												{detail?.style.family || "Custom"}
											</p>
										</div>
										<div class="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
											<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
												License
											</p>
											<p class="mt-2 text-sm font-bold break-words text-slate-950">
												{styleLicense}
											</p>
										</div>
									</div>
									<div class="rounded-[1.6rem] border border-slate-200 bg-white p-5">
										<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
											Alias Discovery
										</p>
										<p class="mt-3 text-sm leading-7 text-slate-600">
											Use aliases to find this style by journal names, short titles, and related
											publication labels without changing the underlying formatting behavior.
										</p>
									</div>
								</div>
							{/if}

							{#if activeTab === "aliases"}
								<div id="aliases" class="space-y-6">
									<div class="flex items-start justify-between gap-4">
										<div>
											<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
												Aliases
											</p>
											<h2 class="mt-3 text-2xl font-black text-slate-950">
												Journals and publications mapped to this style
											</h2>
										</div>
										<span
											class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500"
										>
											{aliasRows.length} of {detail?.aliases.total || aliasRows.length} shown
										</span>
									</div>

									<div class="overflow-hidden rounded-[1.6rem] border border-slate-200">
										<table class="min-w-full divide-y divide-slate-200 text-left">
											<thead class="bg-slate-50">
												<tr class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
													<th class="px-5 py-4">Journal Title</th>
													<th class="px-5 py-4">Identifier</th>
													<th class="px-5 py-4">Status</th>
													<th class="px-5 py-4">Last Synced</th>
												</tr>
											</thead>
											<tbody class="divide-y divide-slate-100 bg-white">
												{#each aliasRows as alias}
													<tr class="align-top">
														<td class="px-5 py-4">
															<div class="font-bold text-slate-950">{alias.title}</div>
															<div class="mt-1 text-sm text-slate-500">{alias.entry_slug}</div>
														</td>
														<td class="px-5 py-4 text-sm text-slate-600">
															{aliasIdentifier(alias)}
														</td>
														<td class="px-5 py-4">
															<span
																class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
															>
																{alias.status}
															</span>
														</td>
														<td class="px-5 py-4 text-sm text-slate-600">
															{alias.last_synced_at
																? new Date(alias.last_synced_at).toLocaleDateString()
																: "Pending"}
														</td>
													</tr>
												{/each}
											</tbody>
										</table>
									</div>
								</div>
							{/if}

							{#if activeTab === "history"}
								<div class="space-y-6">
									<div>
										<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
											History
										</p>
										<h2 class="mt-3 text-2xl font-black text-slate-950">
											Recent registry sync activity
										</h2>
									</div>

									<div class="space-y-4">
										{#each detail?.history || [] as run}
											<div class="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
												<div class="flex flex-wrap items-center justify-between gap-3">
													<div>
														<p class="text-sm font-bold text-slate-950">
															{run.action} • {run.status}
														</p>
														<p class="mt-1 text-sm text-slate-500">
															{new Date(run.started_at).toLocaleString()}
														</p>
													</div>
													<div
														class="flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500"
													>
														<span>{run.entries_seen} seen</span>
														<span>{run.entries_upserted} upserted</span>
														<span>{run.entries_hidden} hidden</span>
														<span>{run.entries_skipped} skipped</span>
													</div>
												</div>
												{#if run.message}
													<p class="mt-3 text-sm text-slate-600">{run.message}</p>
												{/if}
											</div>
										{/each}
									</div>
								</div>
							{/if}

							{#if activeTab === "permissions"}
								<div class="space-y-6">
									<div>
										<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
											Permissions
										</p>
										<h2 class="mt-3 text-2xl font-black text-slate-950">
											System registry controls
										</h2>
									</div>
									<div class="grid gap-4 md:grid-cols-3">
										<div class="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
											<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
												Registry
											</p>
											<p class="mt-2 text-lg font-bold text-slate-950">
												{detail?.permissions.registry_name || "Custom"}
											</p>
										</div>
										<div class="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
											<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
												Scope
											</p>
											<p class="mt-2 text-lg font-bold text-slate-950">
												{detail?.permissions.scope || "user"}
											</p>
										</div>
										<div class="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
											<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
												Visibility
											</p>
											<p class="mt-2 text-lg font-bold text-slate-950">
												{detail?.permissions.visibility || "private"}
											</p>
										</div>
									</div>
								</div>
							{/if}
						</section>
					</div>

					<aside class="space-y-8">
						<section
							class="rounded-[2.4rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
						>
							<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Fields</p>
							<div class="mt-4 flex flex-wrap gap-2">
								{#each styleFields as field}
									<a
										href={`/library/browse?field=${encodeURIComponent(field)}`}
										class="rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 transition hover:border-primary/30 hover:text-primary"
									>
										{field}
									</a>
								{/each}
							</div>
						</section>

						<section
							class="rounded-[2.4rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
						>
							<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
								Original Authors
							</p>
							<div class="mt-4 space-y-3">
								{#if originalAuthors.length > 0}
									{#each originalAuthors as author}
										<div class="flex items-center gap-3">
											<div
												class="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-400"
											>
												<span class="material-symbols-outlined text-lg">person</span>
											</div>
											<span class="text-sm font-bold text-slate-900"
												>{author.name || "Unknown"}</span
											>
										</div>
									{/each}
								{:else}
									<p class="text-sm text-slate-500">Community maintained registry entry.</p>
								{/if}
							</div>
						</section>

						<section
							class="rounded-[2.4rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
						>
							<div class="flex items-center justify-between gap-4">
								<div>
									<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
										Advanced
									</p>
									<h2 class="mt-2 text-xl font-black text-slate-950">Style source</h2>
								</div>
								<button
									class="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-white"
									onclick={() => (showSource = !showSource)}
								>
									{showSource ? "Hide YAML" : "View YAML"}
								</button>
							</div>

							{#if showSource}
								<pre
									class="mt-5 max-h-[600px] overflow-auto rounded-[1.4rem] bg-slate-950 p-5 text-xs leading-6 text-slate-200">{styleYaml ||
										"No YAML available."}</pre>
							{:else}
								<p class="mt-5 text-sm leading-7 text-slate-600">
									View the raw style definition used for preview and export.
								</p>
							{/if}
						</section>
					</aside>
				</section>
			</div>
		{/if}
	</div>
</main>
