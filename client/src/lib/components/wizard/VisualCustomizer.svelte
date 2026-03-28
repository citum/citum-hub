<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import { isNoteBranch, type WizardBranch } from "$lib/types/wizard";
	import InteractivePreview from "./InteractivePreview.svelte";
	import ComponentEditor from "./ComponentEditor.svelte";
	import RefinementControls from "./RefinementControls.svelte";
	import PunctuationEditor from "./editors/PunctuationEditor.svelte";
	import TypeSelector from "./TypeSelector.svelte";

	function goBack() {
		wizardStore.setPhase("quick-start");
		goto("/create/style");
	}

	async function downloadStyle() {
		const yaml = wizardStore.styleYaml;
		if (!yaml) {
			alert("No style to download");
			return;
		}
		const blob = new Blob([yaml], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${wizardStore.styleName || "style"}.yaml`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function handleSave() {
		wizardStore.setStep(7);
		goto("/create/review");
	}

	let activeTab = $state("structure");
	let debounceTimer: number | undefined;

	function debouncedFetchPreview() {
		clearTimeout(debounceTimer);
		debounceTimer = window.setTimeout(() => {
			wizardStore.fetchPreview();
		}, 300);
	}

	function updateOptionField(path: string, value: unknown) {
		const resolvedPath =
			path.startsWith("options.") || path.startsWith("citation.") ? path : `options.${path}`;
		wizardStore.updateStyleField(resolvedPath, value);
		debouncedFetchPreview();
	}

	function updateMonthFormat(month: string) {
		wizardStore.updateStyleField("options.dates", month);
		debouncedFetchPreview();
	}

	function updatePageRangeFormat(format: string) {
		wizardStore.updateStyleField("options.page-range-format", format);
		debouncedFetchPreview();
	}

	function updateLocatorLabel(form: string) {
		if (form === "none") {
			wizardStore.updateStyleField("options.locators", undefined);
		} else {
			wizardStore.updateStyleField("options.locators.default-label-form", form);
		}
		debouncedFetchPreview();
	}

	const currentOptions = $derived(wizardStore.getOptions());
	const branch = $derived(wizardStore.branch);

	type CustomizerTab = { id: string; label: string; icon: string };

	function tabsForBranch(activeBranch: WizardBranch | null): CustomizerTab[] {
		switch (activeBranch) {
			case "numeric":
				return [
					{ id: "structure", label: "Structure", icon: "schema" },
					{ id: "punctuation", label: "Citations", icon: "format_quote" },
					{ id: "authors", label: "Authors", icon: "group" },
					{ id: "dates", label: "Dates", icon: "event" },
					{ id: "titles", label: "References", icon: "title" },
				];
			case "note-humanities":
				return [
					{ id: "structure", label: "Structure", icon: "schema" },
					{ id: "punctuation", label: "Notes", icon: "format_quote" },
					{ id: "authors", label: "Contributors", icon: "group" },
					{ id: "dates", label: "Dates", icon: "event" },
					{ id: "titles", label: "Titles", icon: "title" },
				];
			case "note-law":
				return [
					{ id: "structure", label: "Structure", icon: "schema" },
					{ id: "punctuation", label: "Legal Notes", icon: "gavel" },
					{ id: "authors", label: "Contributors", icon: "group" },
					{ id: "dates", label: "Dates", icon: "event" },
					{ id: "titles", label: "Authorities", icon: "title" },
				];
			case "author-date":
			default:
				return [
					{ id: "structure", label: "Structure", icon: "schema" },
					{ id: "punctuation", label: "Citations", icon: "format_quote" },
					{ id: "authors", label: "Authors", icon: "group" },
					{ id: "dates", label: "Dates", icon: "event" },
					{ id: "titles", label: "Titles", icon: "title" },
				];
		}
	}

	const tabs = $derived(tabsForBranch(branch));

	function editorTitle(activeBranch: WizardBranch | null, tab: string): string {
		if (tab === "structure") return "Structure Editor";
		if (tab === "punctuation") {
			if (activeBranch === "note-law") return "Legal Notes Editor";
			if (isNoteBranch(activeBranch)) return "Notes Editor";
			if (activeBranch === "numeric") return "Citation Numbers Editor";
			return "Citation Editor";
		}
		if (tab === "titles" && activeBranch === "note-law") return "Authorities Editor";
		if (tab === "titles" && activeBranch === "numeric") return "Reference List Editor";
		return `${tab.charAt(0).toUpperCase() + tab.slice(1)} Editor`;
	}

	function editorDescription(activeBranch: WizardBranch | null, tab: string): string {
		if (tab === "structure") {
			return `Arrange fields and groups to define the layout for ${wizardStore.activeRefType}.`;
		}
		if (tab === "punctuation") {
			if (activeBranch === "author-date") {
				return "Adjust author-date citation punctuation and bibliography-facing details.";
			}
			if (activeBranch === "numeric") {
				return "Adjust citation number wrappers, locators, and numeric citation behavior.";
			}
			if (activeBranch === "note-law") {
				return "Adjust legal footnotes, short-form note behavior, and optional reference-list usage.";
			}
			return "Adjust full-note, repeat-note, and bibliography behavior for note styles.";
		}
		if (tab === "titles") {
			if (activeBranch === "numeric") {
				return "These controls affect reference-list titles only, not the in-text number.";
			}
			if (activeBranch === "note-law") {
				return "These controls affect legal titles and authority grouping where titles are visible.";
			}
			if (isNoteBranch(activeBranch)) {
				return "These controls affect how book and article titles appear in notes and the bibliography.";
			}
			return "Refine title formatting where titles actually appear in the bibliography or citation context.";
		}
		return `Refine global ${tab} settings for this style branch.`;
	}

	function previewShellHeading(activeBranch: WizardBranch | null): string {
		switch (activeBranch) {
			case "author-date":
				return "Author-Date Preview";
			case "numeric":
				return "Numeric Citation Preview";
			case "note-law":
				return "Legal Notes Preview";
			case "note-humanities":
				return "Notes Preview";
			default:
				return "Live Preview";
		}
	}

	onMount(() => {
		if (wizardStore.styleYaml) {
			void wizardStore.fetchPreview();
			// Ensure style is expanded before editing (fixes reordering/hiding bugs)
			wizardStore.materializeCurrentStyle();
		}
	});
</script>

<div class="min-h-screen w-full bg-[#fafaf9] text-slate-900">
	<!-- TopAppBar - Overrides layout nav -->
	<header
		class="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none font-headline"
	>
		<div class="flex items-center gap-8">
			<div class="flex items-center gap-6">
				<a
					href="/"
					class="text-xl font-bold tracking-tighter text-primary dark:text-blue-500 hover:opacity-80 transition-opacity"
				>
					Citum Style Wizard
				</a>
				<nav class="hidden lg:flex items-center gap-4">
					<a
						href="/"
						class="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors duration-200"
					>
						Home
					</a>
					<a
						href="/library/browse"
						class="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors duration-200"
					>
						Browse
					</a>
				</nav>
			</div>
			<nav class="hidden md:flex items-center gap-6">
				<button
					onclick={goBack}
					class="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-sm font-medium transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1 rounded"
					>Quick Start</button
				>
				<button
					class="text-primary dark:text-blue-400 border-b-2 border-primary dark:border-blue-400 pb-1 text-sm font-medium transition-colors duration-200 px-3 py-1"
					>Advanced</button
				>
			</nav>
		</div>
		<div class="flex items-center gap-4">
			<button
				onclick={handleSave}
				class="bg-primary text-white px-4 py-2 text-sm font-semibold rounded hover:bg-blue-700 active:opacity-80 active:scale-95 transition-all shadow-sm"
			>
				Review & Save
			</button>
		</div>
	</header>

	<!-- Main Content Canvas -->
	<main class="font-body">
		<div class="grid min-h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)]">
			<aside
				class="border-b border-slate-200 bg-slate-50 py-4 font-headline lg:border-b-0 lg:border-r dark:border-slate-800 dark:bg-slate-950"
			>
				<div class="mt-2 mb-8 px-6">
					<h2 class="mb-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
						Step 4 of 4
					</h2>
					<p class="text-xs font-bold text-slate-800 dark:text-slate-300">Style Editor</p>
				</div>

				<nav class="space-y-1">
					{#each tabs as tab (tab.id)}
						<button
							onclick={() => (activeTab = tab.id)}
							class="w-full flex items-center gap-3 px-6 py-3 text-xs uppercase tracking-widest font-bold transition-colors {activeTab ===
							tab.id
								? 'border-r-4 border-primary bg-blue-50 text-primary dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300'
								: 'text-slate-500 hover:bg-slate-100'}"
						>
							<span class="material-symbols-outlined text-lg">{tab.icon}</span>
							{tab.label}
						</button>
					{/each}
				</nav>

				<div class="mt-8 border-t border-slate-200 px-6 pt-4 dark:border-slate-800">
					<button
						onclick={downloadStyle}
						class="flex w-full items-center justify-center gap-2 rounded bg-slate-800 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-slate-900"
					>
						<span class="material-symbols-outlined text-sm">download</span> Export Style
					</button>
					<button
						onclick={goBack}
						class="mt-4 flex w-full items-center justify-center gap-2 text-[10px] font-bold text-slate-400 transition-colors hover:text-slate-600"
					>
						<span class="material-symbols-outlined text-sm">arrow_back</span> BACK TO START
					</button>
				</div>
			</aside>

			<div class="grid min-h-0 grid-cols-1 xl:grid-cols-[45%_55%]">
				<!-- Left Section: Component Editor (45%) -->
				<section class="border-r border-slate-200 bg-stone-50/30 p-6 sm:p-8">
					<div class="max-w-md mx-auto w-full">
						<header class="mb-8">
							<div
								class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2"
							>
								<span
									class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
								>
									{activeTab}
								</span>
								<span class="material-symbols-outlined text-[10px]">arrow_forward</span>
								<span
									class="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-400 border border-blue-100 dark:border-blue-800"
								>
									{wizardStore.activeRefType.replace("-", " ")}
								</span>
							</div>

							<h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
								{editorTitle(branch, activeTab)}
							</h1>
							<p class="text-sm text-slate-500 mt-2 leading-relaxed">
								{editorDescription(branch, activeTab)}
							</p>
						</header>

						<div class="mb-6">
							<TypeSelector />
						</div>

						<!-- Editor Controls -->
						<div class="w-full">
							{#if activeTab === "structure"}
								<ComponentEditor />
							{:else if activeTab === "punctuation"}
								<PunctuationEditor />
							{:else}
								<RefinementControls
									{activeTab}
									{currentOptions}
									onUpdateOption={updateOptionField}
									onUpdateDates={updateMonthFormat}
									onUpdatePageRange={updatePageRangeFormat}
									onUpdateLocatorLabel={updateLocatorLabel}
								/>
							{/if}
						</div>

						<!-- Undo/Redo Actions -->
						<div class="flex gap-2 mt-6">
							<button
								disabled={!wizardStore.canUndo}
								onclick={() => wizardStore.undo()}
								class="flex-1 rounded border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors flex justify-center items-center"
							>
								<span class="material-symbols-outlined inline mr-1 text-base">undo</span> Undo
							</button>
							<button
								disabled={!wizardStore.canRedo}
								onclick={() => wizardStore.redo()}
								class="flex-1 rounded border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors flex justify-center items-center"
							>
								<span class="material-symbols-outlined inline mr-1 text-base">redo</span> Redo
							</button>
						</div>
					</div>
				</section>

				<!-- Right Section: Live Preview (55%) -->
				<section class="flex flex-col items-center bg-stone-100 p-8 lg:p-12">
					<div class="w-full max-w-2xl">
						<div class="flex items-center justify-between mb-4 w-full px-2">
							<span class="text-xs font-bold uppercase tracking-widest text-slate-400">
								{previewShellHeading(branch)}
							</span>
						</div>

						<!-- Preview Document Surface -->
						<div
							class="bg-white shadow-lg rounded-lg p-10 lg:p-16 min-h-[500px] border border-stone-200 live-preview-content"
						>
							<div class="border-b border-stone-100 pb-6 mb-8 text-center">
								<h4
									class="text-stone-400 text-xs font-bold tracking-widest uppercase mb-2 font-headline"
								>
									{previewShellHeading(branch)}
								</h4>
								<div class="h-0.5 w-8 bg-primary mx-auto"></div>
							</div>

							<InteractivePreview />
						</div>
					</div>
				</section>
			</div>
		</div>
	</main>
</div>

<style>
	:global(.live-preview-content) {
		font-family: var(--font-serif);
	}
</style>
