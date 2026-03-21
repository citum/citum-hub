<script lang="ts">
	import { goto } from "$app/navigation";
	import { auth } from "$lib/stores/auth";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import PreviewPane from "./PreviewPane.svelte";
	import { PUBLIC_DEMO_MODE } from "$env/static/public";

	let styleName = $state(wizardStore.styleName || suggestStyleName());
	let isSaving = $state(false);
	let saveError = $state<string | null>(null);
	let saveSuccess = $state(false);
	let showDemoSignInModal = $state(false);

	function suggestStyleName(): string {
		if (wizardStore.styleInfo?.title) {
			let name = wizardStore.styleInfo.title as string;
			if (wizardStore.styleInfo.edition) {
				name += ` ${wizardStore.styleInfo.edition as string}`;
			}
			return name;
		}
		if (wizardStore.presetId) {
			const presetMap: Record<string, string> = {
				apa: "APA Author-Date",
				chicago: "Chicago Author-Date",
				vancouver: "Vancouver Numeric",
				harvard: "Harvard Author-Date",
				numeric: "Numeric",
				footnote: "Footnote",
			};
			return presetMap[wizardStore.presetId] || "My Custom Style";
		}
		return "My Custom Style";
	}

	function updateStyleName(value: string) {
		if (value.length <= 100) {
			styleName = value;
			wizardStore.setStyleName(value);
		}
	}

	function slugify(s: string): string {
		return s
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");
	}

	async function downloadYaml() {
		const blob = new Blob([wizardStore.styleYaml], { type: "text/yaml" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = slugify(styleName || "my-style") + ".yaml";
		a.click();
		URL.revokeObjectURL(url);
	}

	async function saveToLibrary() {
		if (!styleName.trim()) {
			saveError = "Please enter a style name";
			return;
		}

		// In demo mode, show the sign-in modal
		if (PUBLIC_DEMO_MODE === "true") {
			showDemoSignInModal = true;
			return;
		}

		isSaving = true;
		saveError = null;
		saveSuccess = false;

		try {
			if (!$auth.token) {
				saveError = "Not authenticated";
				return;
			}

			const res = await fetch("/api/styles", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${$auth.token}`,
				},
				body: JSON.stringify({
					title: styleName,
					intent: {},
					citum: wizardStore.styleYaml,
				}),
			});

			if (!res.ok) {
				throw new Error(`Save failed: ${res.status}`);
			}

			saveSuccess = true;
			setTimeout(() => {
				goto("/library");
			}, 1000);
		} catch (e) {
			saveError = e instanceof Error ? e.message : "Failed to save style";
		} finally {
			isSaving = false;
		}
	}

	function customizeFurther() {
		wizardStore.setPhase("visual-customizer");
		goto("/create/customize");
	}

	function startOver() {
		wizardStore.reset();
		goto("/create/field");
	}

	// Use $auth reactive store subscription for template access
	const authState = $derived($auth);
</script>

<div class="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8 w-full">
	<!-- Progress Indicator -->
	<div class="mb-8 sm:mb-12 text-center relative">
		<button
			onclick={() => history.back()}
			class="absolute top-0 sm:top-2 left-0 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
		>
			<span class="material-symbols-outlined">arrow_back</span>
		</button>
		<p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 sm:mb-3">Step 4 of 4</p>
		<div class="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
			<div
				class="h-full bg-primary rounded-full transition-all duration-500"
				style="width: 100%"
			></div>
		</div>
		<h2 class="text-2xl sm:text-3xl font-bold mt-6 sm:mt-8 text-slate-900 dark:text-white">
			Review Your Style
		</h2>
		<p class="text-base sm:text-lg text-slate-600 dark:text-slate-300 mt-2 sm:mt-3">
			Give your style a name and review before saving.
		</p>
	</div>

	<!-- Name Input -->
	<div
		class="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 sm:p-8 shadow-sm mb-8"
	>
		<label
			for="styleName"
			class="block text-sm font-bold tracking-wide uppercase text-slate-500 dark:text-slate-400 mb-3"
		>
			Style Name
		</label>
		<input
			id="styleName"
			type="text"
			placeholder="e.g., My Research Style"
			maxlength="100"
			value={styleName}
			onchange={(e) => updateStyleName(e.currentTarget.value)}
			oninput={(e) => updateStyleName(e.currentTarget.value)}
			class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-lg font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
		/>
		<p class="mt-2 text-xs font-medium text-slate-400 text-right">
			{styleName.length}/100
		</p>
	</div>

	<!-- Style Summary -->
	<div
		class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 sm:p-8 shadow-sm mb-6"
	>
		<h2
			class="mb-6 text-sm font-bold tracking-wide uppercase text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2"
		>
			<span class="material-symbols-outlined text-lg">checklist</span> Style Summary
		</h2>
		<ul class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<li
				class="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-primary/30 group"
			>
				<div
					class="flex size-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30 text-primary group-hover:scale-110 transition-transform"
				>
					<span class="material-symbols-outlined text-xl">architecture</span>
				</div>
				<div>
					<p class="font-bold text-slate-900 dark:text-white text-sm">Style System</p>
					<p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
						{wizardStore.family === "author-date"
							? "Author-Date Citation Format"
							: wizardStore.family === "numeric"
								? "Numbered Reference List"
								: "Humanities Footnote Style"}
					</p>
				</div>
			</li>
			<li
				class="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-primary/30 group"
			>
				<div
					class="flex size-10 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 group-hover:scale-110 transition-transform"
				>
					<span class="material-symbols-outlined text-xl">auto_awesome</span>
				</div>
				<div>
					<p class="font-bold text-slate-900 dark:text-white text-sm">Baseline Design</p>
					<p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
						{wizardStore.presetId ? wizardStore.presetId.toUpperCase() : "Custom Composition"}
					</p>
				</div>
			</li>
			{#if wizardStore.getOptions()?.contributors}
				{@const contrib = wizardStore.getOptions()
					?.contributors as import("$lib/types/wizard").ContributorConfig}
				<li
					class="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-primary/30 group"
				>
					<div
						class="flex size-10 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 group-hover:scale-110 transition-transform"
					>
						<span class="material-symbols-outlined text-xl">person</span>
					</div>
					<div>
						<p class="font-bold text-slate-900 dark:text-white text-sm">Name Formatting</p>
						<p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
							{contrib["name-form"] === "initials" ? "Initial-based" : "Full Names"},
							{contrib["display-as-sort"] === "all" ? "Family-First" : "Given-First"}
						</p>
					</div>
				</li>
				{#if contrib.shorten}
					<li
						class="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-primary/30 group"
					>
						<div
							class="flex size-10 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-600 group-hover:scale-110 transition-transform"
						>
							<span class="material-symbols-outlined text-xl">reorder</span>
						</div>
						<div>
							<p class="font-bold text-slate-900 dark:text-white text-sm">Truncation Rules</p>
							<p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
								{contrib.shorten.min}+ authors shorten to {contrib.shorten["use-first"]}
							</p>
						</div>
					</li>
				{/if}
			{/if}
			{#if wizardStore.getOptions()?.punctuation}
				<li
					class="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-primary/30 group"
				>
					<div
						class="flex size-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 group-hover:scale-110 transition-transform"
					>
						<span class="material-symbols-outlined text-xl">terminal</span>
					</div>
					<div>
						<p class="font-bold text-slate-900 dark:text-white text-sm">Quote Logic</p>
						<p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
							{wizardStore.getOptions()?.["punctuation-in-quote"]
								? "Punctuation inside"
								: "Punctuation outside"}
						</p>
					</div>
				</li>
			{/if}
		</ul>
	</div>

	<!-- Raw Code -->
	<div
		class="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-6 sm:p-8 shadow-sm mb-6"
	>
		<h2
			class="mb-6 text-sm font-bold tracking-wide uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-3 flex items-center gap-2"
		>
			<span class="material-symbols-outlined text-lg">code</span> Raw Citum Code
		</h2>
		<pre
			class="overflow-auto text-sm text-slate-800 dark:text-slate-300 font-mono whitespace-pre-wrap break-all">{wizardStore.styleYaml}</pre>
	</div>

	<!-- Collapsible Preview -->
	<details
		class="group rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm mb-8 overflow-hidden"
	>
		<summary
			class="cursor-pointer list-none p-6 sm:p-8 flex items-center justify-between outline-none bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
		>
			<h2
				class="text-sm font-bold tracking-wide uppercase text-slate-500 dark:text-slate-400 flex items-center gap-2 m-0"
			>
				<span class="material-symbols-outlined text-lg">visibility</span> Visual Preview
			</h2>
			<span
				class="material-symbols-outlined text-slate-400 transition-transform group-open:rotate-180"
				>expand_more</span
			>
		</summary>
		<div class="p-6 sm:p-8 border-t border-slate-200 dark:border-slate-700">
			<PreviewPane />
		</div>
	</details>

	<!-- Messages -->
	{#if saveError}
		<div class="rounded-xl border border-red-200 bg-red-50 p-4 mb-8">
			<p class="text-sm font-medium text-red-700 flex items-center gap-2">
				<span class="material-symbols-outlined text-lg">error</span>
				{saveError}
			</p>
		</div>
	{/if}

	{#if saveSuccess}
		<div class="rounded-xl border border-green-200 bg-green-50 p-4 mb-8">
			<p class="text-sm font-medium text-green-700 flex items-center gap-2">
				<span class="material-symbols-outlined text-lg">check_circle</span>
				Style saved successfully! Redirecting...
			</p>
		</div>
	{/if}

	<!-- Action Buttons -->
	<div
		class="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-800"
	>
		<!-- Download (Primary) -->
		<button
			onclick={downloadYaml}
			class="flex items-center justify-center w-full sm:w-auto min-w-[200px] gap-2 rounded-xl bg-primary px-8 py-3.5 font-bold text-white hover:bg-blue-700 focus:ring-4 focus:ring-primary/20 transition-all shadow-sm shadow-primary/20"
		>
			<span class="material-symbols-outlined text-xl">download</span>
			Download YAML
		</button>

		<!-- Save to Library -->
		{#if authState?.user}
			<button
				onclick={saveToLibrary}
				disabled={isSaving}
				class="flex items-center justify-center w-full sm:w-auto min-w-[200px] gap-2 rounded-xl border-2 border-primary bg-white dark:bg-slate-900 px-8 py-3 font-bold text-primary hover:bg-primary/5 focus:ring-4 focus:ring-primary/20 transition-all disabled:opacity-50"
			>
				{#if isSaving}
					<span class="material-symbols-outlined animate-spin text-xl">hourglass_empty</span>
				{:else}
					<span class="material-symbols-outlined text-xl">save</span>
				{/if}
				{isSaving ? "Saving..." : "Save to Library"}
			</button>
		{:else}
			<button
				onclick={() => (window.location.href = "/api/auth/github")}
				class="flex items-center justify-center w-full sm:w-auto min-w-[200px] gap-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-8 py-3 font-bold text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 transition-all"
			>
				<span class="material-symbols-outlined text-xl">login</span>
				Sign in to Save
			</button>
		{/if}

		<!-- Customize Further (Secondary) -->
		<button
			onclick={customizeFurther}
			class="flex items-center justify-center w-full sm:w-auto min-w-[200px] gap-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-8 py-3 font-bold text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 transition-all focus:ring-4 focus:ring-slate-100"
		>
			<span class="material-symbols-outlined text-xl">edit</span>
			Component Editor
		</button>

		<!-- Back to Wizard -->
		<button
			onclick={() => {
				wizardStore.setStep(3);
				goto("/create/refine");
			}}
			class="flex items-center justify-center w-full sm:w-auto min-w-[200px] gap-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-8 py-3 font-bold text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 transition-all focus:ring-4 focus:ring-slate-100"
		>
			<span class="material-symbols-outlined text-xl">undo</span>
			Back to Selection
		</button>

		<!-- Start Over (Tertiary) -->
		<button
			onclick={startOver}
			class="flex items-center justify-center w-full sm:w-auto mt-4 sm:ml-auto text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors uppercase tracking-wider"
		>
			<span class="material-symbols-outlined text-sm mr-1">restart_alt</span>
			Start Over
		</button>
	</div>

	<!-- Demo Sign-In Modal -->
	{#if showDemoSignInModal}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div
				class="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-8"
			>
				<button
					onclick={() => (showDemoSignInModal = false)}
					class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
				>
					<span class="material-symbols-outlined">close</span>
				</button>

				<div class="text-center">
					<div class="mb-4 flex justify-center">
						<div class="rounded-full bg-blue-50 dark:bg-blue-900/30 p-3">
							<span class="material-symbols-outlined text-3xl text-blue-600">lock</span>
						</div>
					</div>
					<h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Sign in to Save</h3>
					<p class="text-sm text-slate-600 dark:text-slate-400 mb-6">
						You're in demo mode. Sign in with GitHub to save your custom styles to your personal
						library.
					</p>
				</div>

				<div class="space-y-3">
					<button
						onclick={() => (window.location.href = "/api/auth/github")}
						class="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white px-6 py-3 font-bold hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
					>
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path
								d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
							/>
						</svg>
						Sign in with GitHub
					</button>
					<button
						onclick={() => (showDemoSignInModal = false)}
						class="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-3 font-bold hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
					>
						Continue in Demo Mode
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(.live-preview-content) {
		font-family: var(--font-serif);
	}
</style>
