<script lang="ts">
	import { goto } from "$app/navigation";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import PreviewPane from "./PreviewPane.svelte";
	import RefinementControls from "./RefinementControls.svelte";

	let debounceTimer: number | undefined;
	let activeHighlight = $state<string | null>(null);

	function debouncedFetchPreview() {
		clearTimeout(debounceTimer);
		debounceTimer = window.setTimeout(() => {
			wizardStore.fetchPreview();
		}, 300);
	}

	function updateOptionField(path: string, value: unknown) {
		wizardStore.updateStyleField(`options.${path}`, value);
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

	function skipToReview() {
		wizardStore.setStep(5);
		goto("/create/review");
	}

	const currentOptions = $derived(wizardStore.getOptions());
</script>

<div class="min-h-screen bg-background-light p-4 sm:p-6 lg:p-8">
	<div class="mx-auto max-w-7xl">
		<!-- Progress Indicator -->
		<div class="mb-8 max-w-2xl mx-auto w-full text-center shrink-0 relative">
			<button
				onclick={() => history.back()}
				class="absolute top-0 sm:top-2 left-0 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
			>
				<span class="material-symbols-outlined">arrow_back</span>
			</button>
			<p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Step 4 of 5</p>
			<div class="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
				<div
					class="h-full bg-primary rounded-full transition-all duration-500"
					style="width: 80%"
				></div>
			</div>
			<h1 class="text-2xl font-bold mt-4 text-slate-900 dark:text-white">Refine your style</h1>
			<p class="text-text-secondary mt-1">Fine-tune the details (or skip to finish)</p>
		</div>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
			<!-- Left: Preview (on mobile: bottom) -->
			<div class="order-2 lg:order-1">
				<div class="sticky top-6">
					<div
						class="flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden"
					>
						<div
							class="flex items-center justify-between border-b border-border-light bg-surface-light px-4 py-3"
						>
							<h3 class="font-semibold text-text-main">Live Preview</h3>
						</div>
						<div class="bg-surface-main p-6 overflow-auto max-h-[calc(100vh-16rem)]">
							<PreviewPane {activeHighlight} />
						</div>
					</div>
				</div>
			</div>

			<!-- Right: Controls (on mobile: top) -->
			<div class="order-1 space-y-4 lg:order-2">
				<RefinementControls
					{currentOptions}
					onUpdateOption={updateOptionField}
					onUpdateDates={updateMonthFormat}
					onUpdatePageRange={updatePageRangeFormat}
					onUpdateLocatorLabel={updateLocatorLabel}
					onHighlightChange={(field) => {
						activeHighlight = field;
					}}
				/>

				<!-- Action Buttons -->
				<div class="flex flex-col gap-3 pt-4">
					<button
						onclick={skipToReview}
						class="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
					>
						Save & Continue
					</button>
					<div class="grid grid-cols-2 gap-3">
						<button
							onclick={() => {
								wizardStore.setStep(3);
								goto("/create/style");
							}}
							class="rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
						>
							<span class="material-symbols-outlined text-lg">undo</span>
							Back
						</button>
						<button
							onclick={() => {
								wizardStore.reset();
								goto("/create/field");
							}}
							class="rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
						>
							<span class="material-symbols-outlined text-lg">restart_alt</span>
							Start Over
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
