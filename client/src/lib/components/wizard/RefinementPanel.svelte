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
		const opts = wizardStore.getOptions();
		let contributors = opts?.contributors ?? {};

		// If contributors is a string preset, convert to object
		if (typeof contributors === "string") {
			contributors = {};
		}

		// Merge the change, filtering out undefined to avoid null in YAML
		const merged = { ...contributors } as Record<string, unknown>;
		if (value === undefined) {
			delete merged[path];
		} else {
			merged[path] = value;
		}
		wizardStore.updateStyleField("options.contributors", merged);
		debouncedFetchPreview();
	}

	function updateMonthFormat(month: string) {
		wizardStore.updateStyleField("options.dates", { month });
		debouncedFetchPreview();
	}

	function updateTitleCase(caseStyle: string) {
		const opts = wizardStore.getOptions();
		let titles =
			opts?.titles && typeof opts.titles === "object"
				? (opts.titles as Record<string, unknown>)
				: {};
		const currentDefault =
			titles.default && typeof titles.default === "object"
				? (titles.default as Record<string, unknown>)
				: {};
		const merged = { ...titles, default: { ...currentDefault, "text-case": caseStyle } };
		wizardStore.updateStyleField("options.titles", merged);
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
