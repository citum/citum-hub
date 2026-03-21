<script lang="ts">
	/* eslint-disable @typescript-eslint/no-explicit-any */
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import PreviewPane from "$lib/components/wizard/PreviewPane.svelte";
	import type { AxisChoices } from "$lib/types/wizard";
	import { goto } from "$app/navigation";

	// Define the axes based on the selected family
	const authorDateAxes = [
		{
			id: "nameForm",
			question: "How should author names look?",
			options: [
				{ value: "family-first-initials", label: "Smith, J. A." },
				{ value: "given-first-initials", label: "J. A. Smith" },
				{ value: "family-first-full", label: "Smith, John A." },
			],
		},
		{
			id: "datePosition",
			question: "Where does the year appear?",
			options: [
				{ value: "after-author-parens", label: "Smith (2024)." },
				{ value: "after-author-bare", label: "Smith 2024." },
				{ value: "after-author-comma", label: "Smith, 2024." },
			],
		},
		{
			id: "articleTitleEmphasis",
			question: "How are article titles formatted?",
			options: [
				{ value: "plain", label: "plain" },
				{ value: "quoted", label: '"In quotes"' },
				{ value: "italic", label: "Italic" },
			],
		},
		{
			id: "etAlThreshold",
			question: 'How many authors before "et al."?',
			options: [
				{ value: 2, label: "after 2" },
				{ value: 3, label: "after 3" },
				{ value: 6, label: "after 6" },
				{ value: null, label: "show all" },
			],
		},
		{
			id: "authorConnector",
			question: "Author connector",
			options: [
				{ value: "symbol", label: "&" },
				{ value: "text", label: "and" },
				{ value: "none", label: "," },
			],
		},
		{
			id: "locatorLabel",
			question: "How should page numbers be labeled?",
			options: [
				{ value: "short", label: "p. 123" },
				{ value: "long", label: "page 123" },
				{ value: "none", label: "123 (no label)" },
			],
		},
	];

	const numericAxes = [
		{
			id: "numberBracket",
			question: "How is the reference number shown?",
			options: [
				{ value: "square", label: "[1]" },
				{ value: "period", label: "1." },
				{ value: "paren", label: "(1)" },
				{ value: "superscript", label: "superscript¹" },
			],
		},
		{
			id: "nameForm", // Reuse nameForm for simplicity
			question: "How should author names look?",
			options: [
				{ value: "compact", label: "Smith JA (initials, no dots)" },
				{ value: "family-first-initials", label: "Smith, J. A." },
				{ value: "given-first-initials", label: "J. A. Smith" },
			],
		},
	];

	const noteAxes = [
		{
			id: "footnoteNameForm",
			question: "How are names written in footnotes?",
			options: [
				{ value: "full", label: "John A. Smith" },
				{ value: "inverted", label: "Smith, John A." },
			],
		},
		{
			id: "bookEmphasis",
			question: "How are book titles shown?",
			options: [
				{ value: "italic", label: "Italic" },
				{ value: "plain", label: "plain" },
			],
		},
	];

	const axes = $derived(
		wizardStore.family === "author-date"
			? authorDateAxes
			: wizardStore.family === "numeric"
				? numericAxes
				: noteAxes
	);

	let currentAxisIndex = $state(0);

	// Mapping of axis choice values to style fields
	const updateStyleForAxis = (axisId: string, value: any) => {
		switch (axisId) {
			case "nameForm":
				if (value === "family-first-initials") {
					wizardStore.updateStyleField("options.contributors.display-as-sort", "all");
					wizardStore.updateStyleField("options.contributors.name-form", "initials");
					wizardStore.updateStyleField("options.contributors.initialize-with", ". ");
				} else if (value === "given-first-initials") {
					wizardStore.updateStyleField("options.contributors.display-as-sort", "none");
					wizardStore.updateStyleField("options.contributors.name-form", "initials");
					wizardStore.updateStyleField("options.contributors.initialize-with", ". ");
				} else if (value === "family-first-full") {
					wizardStore.updateStyleField("options.contributors.display-as-sort", "all");
					wizardStore.updateStyleField("options.contributors.name-form", "full");
					wizardStore.updateStyleField("options.contributors.initialize-with", undefined);
				}
				break;
			case "etAlThreshold":
				if (value === null) {
					wizardStore.updateStyleField("options.contributors.shorten", undefined);
				} else {
					wizardStore.updateStyleField("options.contributors.shorten.min", value);
					wizardStore.updateStyleField("options.contributors.shorten.use-first", 1);
				}
				break;
			case "authorConnector":
				wizardStore.updateStyleField(
					"options.contributors.and",
					value === "none" ? undefined : value
				);
				break;
			case "locatorLabel":
				if (value === "none") {
					wizardStore.updateStyleField("options.locators", undefined);
				} else {
					wizardStore.updateStyleField("options.locators.default-label-form", value);
				}
				break;
			case "datePosition":
				// Note: Date wrap in the current schema is often handled at the template level
				// or via specific options. For now, we'll just skip this to avoid errors.
				break;
			case "numberBracket":
				if (value === "square") {
					wizardStore.updateStyleField("citation.wrap", "brackets");
				} else if (value === "paren") {
					wizardStore.updateStyleField("citation.wrap", "parentheses");
				} else {
					wizardStore.updateStyleField("citation.wrap", "none");
				}
				break;
		}
	};

	async function selectOption(axisId: string, value: any, index: number) {
		wizardStore.setAxisChoices({ [axisId]: value });
		updateStyleForAxis(axisId, value);

		// Re-fetch preview to show the change immediately
		await wizardStore.fetchPreview();

		if (index === currentAxisIndex && currentAxisIndex < axes.length - 1) {
			currentAxisIndex++;
		}
	}

	async function customizeFurther() {
		// Ensure YAML is generated if missing
		if (!wizardStore.styleYaml) {
			const presetId =
				wizardStore.family === "author-date"
					? "apa"
					: wizardStore.family === "numeric"
						? "vancouver"
						: "chicago-note";
			await wizardStore.generateFromIntent({
				class:
					wizardStore.family === "author-date"
						? "author_date"
						: wizardStore.family === "numeric"
							? "numeric"
							: "footnote",
				from_preset: presetId,
			});
		}
		wizardStore.setPhase("visual-customizer");
		goto("/create/customize");
	}

	async function useThisAnyhow() {
		// Ensure we have a preview ready for the next step
		if (!wizardStore.styleYaml) {
			const presetId =
				wizardStore.family === "author-date"
					? "apa"
					: wizardStore.family === "numeric"
						? "vancouver"
						: "chicago-note";
			await wizardStore.generateFromIntent({
				class:
					wizardStore.family === "author-date"
						? "author_date"
						: wizardStore.family === "numeric"
							? "numeric"
							: "footnote",
				from_preset: presetId,
			});
		} else {
			await wizardStore.fetchPreview();
		}
		wizardStore.setStep(4);
		goto("/create/review");
	}
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 w-full h-full flex flex-col">
	<!-- Progress Indicator -->
	<div class="mb-6 max-w-2xl mx-auto w-full text-center shrink-0 relative">
		<button
			onclick={() => history.back()}
			class="absolute top-0 sm:top-2 left-0 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
		>
			<span class="material-symbols-outlined">arrow_back</span>
		</button>
		<p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Step 3 of 4</p>
		<div class="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
			<div
				class="h-full bg-primary rounded-full transition-all duration-500"
				style="width: 75%"
			></div>
		</div>
		<h2 class="text-2xl font-bold mt-4 text-slate-900 dark:text-white">Style Navigator</h2>
	</div>

	<div class="flex flex-1 min-h-0 gap-6">
		<!-- Left: Live Preview (Takes up 2/3 width) -->
		<div
			class="flex w-2/3 flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden"
		>
			<div
				class="flex items-center justify-between border-b border-border-light bg-surface-light px-4 py-3"
			>
				<h3 class="font-semibold text-text-main">Live Preview</h3>
			</div>
			<div class="flex-1 overflow-auto bg-surface-main p-6">
				{#if wizardStore.isLoading}
					<div class="flex h-full items-center justify-center">
						<div class="animate-pulse text-text-secondary">Generating preview...</div>
					</div>
				{:else if wizardStore.styleYaml}
					<PreviewPane />
				{:else}
					<div class="flex h-full items-center justify-center text-text-secondary text-center p-8">
						Make your selections on the right to see the preview update.
					</div>
				{/if}
			</div>
			<div class="border-t border-border-light bg-surface-light px-4 py-3">
				<p class="text-sm font-medium text-text-secondary">
					Closest match:
					<span class="text-text-main">
						{wizardStore.styleInfo?.short_title ??
							wizardStore.styleInfo?.title ??
							(wizardStore.presetId ? wizardStore.presetId.toUpperCase() : "Computing...")}
						{wizardStore.styleInfo?.edition ? ` (${wizardStore.styleInfo.edition})` : ""}
					</span>
				</p>
			</div>
		</div>

		<!-- Right: Axis Cards (Takes up 1/3 width) -->
		<div class="flex w-1/3 flex-col gap-4 overflow-y-auto pr-2 pb-8">
			{#each axes.slice(0, currentAxisIndex + 1) as axis, i}
				<div
					class="rounded-lg border-2 {i === currentAxisIndex
						? 'border-primary shadow-md'
						: 'border-border-light opacity-60'} bg-surface-light p-4 transition-all"
				>
					<h4 class="mb-3 font-semibold text-text-main">{axis.question}</h4>
					<div class="flex flex-col gap-2">
						{#each axis.options as option}
							<label
								class="flex cursor-pointer items-center gap-3 rounded-md border border-border-light bg-surface-main p-3 hover:border-primary"
							>
								<input
									type="radio"
									name={axis.id}
									value={option.value}
									checked={wizardStore.axisChoices[axis.id as keyof AxisChoices] === option.value}
									onclick={() => selectOption(axis.id, option.value, i)}
									class="h-4 w-4 text-primary focus:ring-primary"
								/>
								<span class="text-sm text-text-main">{option.label}</span>
							</label>
						{/each}
					</div>
				</div>
			{/each}

			<div class="pt-4 space-y-3">
				{#if currentAxisIndex === axes.length - 1 && wizardStore.axisChoices[axes[currentAxisIndex].id as keyof AxisChoices]}
					<button
						onclick={useThisAnyhow}
						class="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
					>
						Continue to Final Review
					</button>
				{:else}
					<button
						onclick={useThisAnyhow}
						class="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
					>
						Use these settings
					</button>
					{#if currentAxisIndex < axes.length - 1}
						<p class="mt-2 text-xs text-text-secondary italic">
							You can skip the remaining {axes.length - 1 - currentAxisIndex} questions and refine further
							in the next step.
						</p>
					{/if}
				{/if}

				<button
					onclick={customizeFurther}
					class="w-full rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
				>
					<span class="material-symbols-outlined text-lg">settings_suggest</span>
					Open Visual Editor
				</button>
			</div>
		</div>
	</div>
</div>
