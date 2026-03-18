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

	function skipToReview() {
		wizardStore.setStep(7);
		goto("/create/review");
	}

	const currentOptions = $derived(wizardStore.getOptions());
</script>

<div class="min-h-screen bg-background-light p-4 sm:p-6 lg:p-8">
	<div class="mx-auto max-w-7xl">
		<div class="mb-6 space-y-2">
			<h1 class="font-display text-3xl font-semibold text-text-main">Refine your style</h1>
			<p class="text-text-secondary">Customize naming, dates, and title formatting</p>
		</div>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.5fr]">
			<!-- Left: Preview (on mobile: bottom) -->
			<div class="order-2 lg:order-1">
				<div class="sticky top-6">
					<PreviewPane {activeHighlight} />
				</div>
			</div>

			<!-- Right: Controls (on mobile: top) -->
			<div class="order-1 space-y-4 lg:order-2">
				<RefinementControls
					{currentOptions}
					onUpdateContributors={updateContributorsField}
					onUpdateDates={updateMonthFormat}
					onUpdateTitles={updateTitleCase}
					onUpdatePageRange={updatePageRangeFormat}
					onUpdateLocatorLabel={updateLocatorLabel}
					onHighlightChange={(field) => {
						activeHighlight = field;
					}}
				/>

				<!-- Action Buttons -->
				<div class="flex gap-3 pt-4">
					<button
						onclick={skipToReview}
						class="flex-1 rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-blue-700 transition-colors"
					>
						Continue to Review
					</button>
					<button
						onclick={skipToReview}
						class="flex-1 rounded-lg border border-border-light bg-surface-light px-4 py-2 font-semibold text-text-main hover:bg-background-light transition-colors"
					>
						Skip — use defaults
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
