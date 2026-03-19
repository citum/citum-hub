<script lang="ts">
	import { goto } from "$app/navigation";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import InteractivePreview from "./InteractivePreview.svelte";
	import ComponentEditor from "./ComponentEditor.svelte";
	import RefinementControls from "./RefinementControls.svelte";

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

	function updateContributorsField(path: string, value: unknown) {
		wizardStore.updateStyleField(`options.contributors.${path}`, value);
		debouncedFetchPreview();
	}

	function updateMonthFormat(month: string) {
		wizardStore.updateStyleField("options.dates.month", month);
		debouncedFetchPreview();
	}

	function updateTitleCase(caseStyle: string) {
		wizardStore.updateStyleField("options.titles.default.text-case", caseStyle);
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
</script>

<div class="w-full h-full min-h-screen flex text-slate-900 bg-[#fafaf9] overflow-hidden">
	
	<!-- TopAppBar - Overrides layout nav -->
	<header class="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 sm:px-6 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none font-headline">
		<div class="flex items-center gap-8">
			<span class="text-xl font-bold tracking-tighter text-primary dark:text-blue-500">Citum Style Wizard</span>
			<nav class="hidden md:flex items-center gap-6">
				<button onclick={goBack} class="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-sm font-medium transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1 rounded">Quick Start</button>
				<button class="text-primary dark:text-blue-400 border-b-2 border-primary dark:border-blue-400 pb-1 text-sm font-medium transition-colors duration-200 px-3 py-1">Advanced</button>
			</nav>
		</div>
		<div class="flex items-center gap-4">
			<button onclick={handleSave} class="bg-primary text-white px-4 py-2 text-sm font-semibold rounded hover:bg-blue-700 active:opacity-80 active:scale-95 transition-all shadow-sm">
				Review & Save
			</button>
		</div>
	</header>

	<!-- SideNavBar -->
	<aside class="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col py-4 font-headline z-40">
		<div class="px-6 mb-8 mt-2">
			<h2 class="text-[10px] uppercase tracking-[0.2em] font-extrabold text-slate-400 mb-1">Step 4 of 4</h2>
			<p class="text-xs font-bold text-slate-800 dark:text-slate-300">Style Editor</p>
		</div>
		
		<nav class="flex-1 space-y-1">
			<button onclick={() => activeTab = 'structure'} class="w-full flex items-center gap-3 px-6 py-3 text-xs uppercase tracking-widest font-bold transition-colors {activeTab === 'structure' ? 'bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-300 border-r-4 border-primary' : 'text-slate-500 hover:bg-slate-100'}">
				<span class="material-symbols-outlined text-lg">schema</span> Component Array
			</button>
			<button onclick={() => activeTab = 'authors'} class="w-full flex items-center gap-3 px-6 py-3 text-xs uppercase tracking-widest font-bold transition-colors {activeTab === 'authors' ? 'bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-300 border-r-4 border-primary' : 'text-slate-500 hover:bg-slate-100'}">
				<span class="material-symbols-outlined text-lg">group</span> Global Rules
			</button>
		</nav>
		
		<div class="mt-auto px-6 border-t border-slate-200 dark:border-slate-800 pt-4">
			<button onclick={downloadStyle} class="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-2.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-slate-900 transition-colors">
				<span class="material-symbols-outlined text-sm">download</span> Export Style
			</button>
			<button onclick={goBack} class="w-full flex items-center justify-center gap-2 mt-4 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors">
				<span class="material-symbols-outlined text-sm">arrow_back</span> BACK TO START
			</button>
		</div>
	</aside>

	<!-- Main Content Canvas -->
	<main class="ml-64 w-[calc(100%-16rem)] flex text-slate-900 h-screen pt-16 font-body">
		<!-- Left Section: Component Editor (45%) -->
		<section class="w-[45%] h-full border-r border-slate-200 p-6 sm:p-8 overflow-y-auto bg-stone-50/30">
			<div class="max-w-md mx-auto w-full">
				<header class="mb-6">
					{#if wizardStore.selectedComponent && activeTab === 'structure'}
						<div class="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-primary rounded-full text-xs font-semibold mb-3 border border-blue-100">
							<span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
							Editing: {wizardStore.selectedComponent.componentType}
						</div>
					{/if}
					
					<h1 class="text-2xl font-semibold tracking-tight text-slate-800">Visual Customizer</h1>
					<p class="text-sm text-slate-500 mt-1">Configure how elements appear in your citations. Click components in the preview to edit.</p>
				</header>
				
				<!-- Editor Controls -->
				<div class="w-full">
					{#if activeTab === 'structure'}
						<ComponentEditor />
					{:else}
						<RefinementControls
							{currentOptions}
							onUpdateContributors={updateContributorsField}
							onUpdateDates={updateMonthFormat}
							onUpdateTitles={updateTitleCase}
							onUpdatePageRange={updatePageRangeFormat}
							onUpdateLocatorLabel={updateLocatorLabel}
						/>
					{/if}
				</div>
				
				<!-- Undo/Redo Actions -->
				<div class="flex gap-2 mt-6">
					<button disabled={!wizardStore.canUndo} onclick={() => wizardStore.undo()} class="flex-1 rounded border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors flex justify-center items-center">
						<span class="material-symbols-outlined inline mr-1 text-base">undo</span> Undo
					</button>
					<button disabled={!wizardStore.canRedo} onclick={() => wizardStore.redo()} class="flex-1 rounded border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors flex justify-center items-center">
						<span class="material-symbols-outlined inline mr-1 text-base">redo</span> Redo
					</button>
				</div>
			</div>
		</section>

		<!-- Right Section: Live Preview (55%) -->
		<section class="w-[55%] h-full bg-stone-100 p-8 lg:p-12 overflow-y-auto flex flex-col items-center">
			<div class="w-full max-w-2xl">
				<div class="flex items-center justify-between mb-4 w-full px-2">
					<span class="text-xs font-bold uppercase tracking-widest text-slate-400">Live Preview</span>
				</div>
				
				<!-- Preview Document Surface -->
				<div class="bg-white shadow-lg rounded-lg p-10 lg:p-16 min-h-[500px] border border-stone-200 live-preview-content">
					<div class="border-b border-stone-100 pb-6 mb-8 text-center">
						<h4 class="text-stone-400 text-xs font-bold tracking-widest uppercase mb-2 font-headline">Bibliography</h4>
						<div class="h-0.5 w-8 bg-primary mx-auto"></div>
					</div>
					
					<InteractivePreview />
				</div>
			</div>
		</section>
	</main>
</div>

<style>
	:global(.live-preview-content) {
		font-family: var(--font-serif);
	}
	:global(body) {
		overflow: hidden; /* Prevent double scrollbars since VisualCustomizer takes over screen */
	}
</style>
