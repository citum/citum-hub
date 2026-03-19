<script lang="ts">
	import { goto } from "$app/navigation";
	import { auth } from "$lib/stores/auth";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import PreviewPane from "./PreviewPane.svelte";

	let styleName = $state(wizardStore.styleName || suggestStyleName());
	let isSaving = $state(false);
	let saveError = $state<string | null>(null);
	let saveSuccess = $state(false);

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

	<!-- Preview -->
	<div
		class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 sm:p-8 shadow-sm mb-8"
	>
		<h2
			class="mb-6 text-sm font-bold tracking-wide uppercase text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-3"
		>
			Final Preview
		</h2>
		<PreviewPane />
	</div>

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

		<!-- Start Over (Tertiary) -->
		<button
			onclick={startOver}
			class="flex items-center justify-center w-full sm:w-auto mt-4 sm:ml-auto text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors uppercase tracking-wider"
		>
			<span class="material-symbols-outlined text-sm mr-1">restart_alt</span>
			Start Over
		</button>
	</div>
</div>

<style>
	:global(.live-preview-content) {
		font-family: var(--font-serif);
	}
</style>
