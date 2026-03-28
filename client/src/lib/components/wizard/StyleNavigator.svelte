<script lang="ts">
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import PreviewPane from "$lib/components/wizard/PreviewPane.svelte";
	import { resolveWizardBranch, type AxisChoices } from "$lib/types/wizard";
	import { goto } from "$app/navigation";

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
		{
			id: "rolePreset",
			question: "How should contributor roles be formatted?",
			options: [
				{ value: "short-suffix", label: "Smith, J. (ed.) / Doe, J. (trans.)" },
				{ value: "long-suffix", label: "Smith, J. (editor) / Doe, J. (translator)" },
				{ value: "verb-prefix", label: "edited by J. Smith / translated by J. Doe" },
				{ value: "none", label: "None (suppress role)" },
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
		{
			id: "authorConnector",
			question: "How should multiple contributors connect?",
			options: [
				{ value: "symbol", label: "&" },
				{ value: "text", label: "and" },
				{ value: "none", label: "," },
			],
		},
		{
			id: "yearPosition",
			question: "Where does the year appear?",
			options: [
				{ value: "volume-issue", label: "after volume/issue (2024;12(3))" },
				{ value: "end-parens", label: "at the end (2024)" },
				{ value: "after-title", label: "after title" },
			],
		},
		{
			id: "locatorLabel",
			question: "How should locators appear?",
			options: [
				{ value: "short", label: "p. 123" },
				{ value: "long", label: "page 123" },
				{ value: "none", label: "123" },
			],
		},
	];

	const noteHumanitiesAxes = [
		{
			id: "citationLocation",
			question: "Where should citations appear?",
			options: [
				{ value: "footnote", label: "Footnotes" },
				{ value: "endnote", label: "Endnotes" },
			],
		},
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
			question: "How are book titles shown in notes?",
			options: [
				{ value: "italic", label: "Italic" },
				{ value: "plain", label: "plain" },
			],
		},
		{
			id: "repeatCitation",
			question: "On second citation, use...",
			options: [
				{ value: "ibid", label: "Ibid." },
				{ value: "short-title", label: "shortened title" },
				{ value: "full", label: "full repeat" },
			],
		},
		{
			id: "hasBibliography",
			question: "Do you also need a bibliography?",
			options: [
				{ value: true, label: "Yes" },
				{ value: false, label: "Footnotes only" },
			],
		},
		{
			id: "articleTitleEmphasis",
			question: "How are article titles shown in notes?",
			options: [
				{ value: "quoted", label: '"In quotes"' },
				{ value: "italic", label: "Italic" },
				{ value: "plain", label: "plain" },
			],
		},
	];

	const noteLawAxes = [
		{
			id: "legalSystem",
			question: "Which legal tradition is closest?",
			options: [
				{ value: "bluebook", label: "Bluebook" },
				{ value: "oscola", label: "OSCOLA" },
			],
		},
		{
			id: "citationLocation",
			question: "Where should legal citations appear?",
			options: [
				{ value: "footnote", label: "Footnotes" },
				{ value: "endnote", label: "Endnotes" },
			],
		},
		{
			id: "repeatCitation",
			question: "What should repeat footnotes prefer?",
			options: [
				{ value: "short-title", label: "Short form" },
				{ value: "ibid", label: "Ibid." },
				{ value: "full", label: "Full repeat" },
			],
		},
		{
			id: "groupAuthorities",
			question: "How should authorities be organized?",
			options: [
				{ value: true, label: "Grouped by authority/type" },
				{ value: false, label: "Single combined list" },
			],
		},
		{
			id: "hasBibliography",
			question: "Include a table of authorities or references?",
			options: [
				{ value: true, label: "Yes" },
				{ value: false, label: "Footnotes only" },
			],
		},
	];

	const branch = $derived(resolveWizardBranch(wizardStore.field, wizardStore.family));
	const axes = $derived.by(() => {
		switch (branch) {
			case "author-date":
				return authorDateAxes;
			case "numeric":
				return numericAxes;
			case "note-law":
				return noteLawAxes;
			case "note-humanities":
			default:
				return noteHumanitiesAxes;
		}
	});

	let currentAxisIndex = $state(0);

	// Mapping of axis choice values to style fields
	const updateStyleForAxis = (axisId: string, value: unknown) => {
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
				} else if (value === "compact") {
					wizardStore.updateStyleField("options.contributors.display-as-sort", "all");
					wizardStore.updateStyleField("options.contributors.name-form", "initials");
					wizardStore.updateStyleField("options.contributors.initialize-with", "");
				}
				break;
			case "etAlThreshold":
				if (value === null) {
					wizardStore.updateStyleField("options.contributors.shorten", undefined);
				} else {
					wizardStore.updateStyleField("options.contributors.shorten", {
						min: value,
						"use-first": 1,
						"and-others": "et-al",
					});
				}
				break;
			case "authorConnector":
				wizardStore.updateStyleField(
					"options.contributors.and",
					value === "none" ? undefined : value
				);
				break;
			case "locatorLabel":
				wizardStore.updateStyleField("options.locators.default-label-form", value);
				break;
			case "datePosition":
				// Standard Citum doesn't have a top-level position for dates in options.
				// We'll set a standard form for now to avoid invalid YAML.
				wizardStore.updateStyleField("options.dates", "long");
				break;
			case "articleTitleEmphasis":
				if (value === "quoted") {
					wizardStore.updateStyleField("options.titles.component.quote", true);
					wizardStore.updateStyleField("options.titles.component.emph", false);
				} else if (value === "italic") {
					wizardStore.updateStyleField("options.titles.component.quote", false);
					wizardStore.updateStyleField("options.titles.component.emph", true);
				} else if (value === "plain") {
					wizardStore.updateStyleField("options.titles.component.quote", false);
					wizardStore.updateStyleField("options.titles.component.emph", false);
				}
				break;
			case "yearPosition":
				// Skip non-existent field to avoid 500
				break;
			case "numberBracket":
				if (value === "square") {
					wizardStore.updateStyleField("citation.template.0.wrap", "brackets");
					wizardStore.updateStyleField("citation.template.0.suffix", undefined);
				} else if (value === "paren") {
					wizardStore.updateStyleField("citation.template.0.wrap", "parentheses");
					wizardStore.updateStyleField("citation.template.0.suffix", undefined);
				} else if (value === "period") {
					wizardStore.updateStyleField("citation.template.0.wrap", "none");
					wizardStore.updateStyleField("citation.template.0.suffix", ".");
				} else {
					wizardStore.updateStyleField("citation.template.0.wrap", "none");
					wizardStore.updateStyleField("citation.template.0.suffix", undefined);
				}
				break;
			case "citationLocation":
				wizardStore.updateStyleField(
					"options.processing",
					value === "footnote" || value === "endnote" ? "note" : "author-date"
				);
				break;
			case "footnoteNameForm":
				wizardStore.updateStyleField(
					"options.contributors.display-as-sort",
					value === "inverted" ? "all" : "none"
				);
				break;
			case "bookEmphasis":
				wizardStore.updateStyleField("options.titles.monograph.emph", value === "italic");
				break;
			case "repeatCitation":
				wizardStore.updateStyleField(
					"options.subsequent",
					value === "short-title" ? "short" : value
				);
				break;
			case "hasBibliography":
				wizardStore.setBibliographyUsage(Boolean(value));
				break;
			case "legalSystem":
				wizardStore.setStyleIntent({
					from_preset: value === "oscola" ? "oscola" : "bluebook_legal",
				});
				break;
			case "groupAuthorities":
				wizardStore.setAxisChoices({ groupAuthorities: Boolean(value) });
				break;
			case "rolePreset":
				wizardStore.updateStyleField("options.contributors.role.preset", value);
				break;
		}
	};

	async function selectOption(axisId: string, value: unknown, index: number) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		wizardStore.setAxisChoices({ [axisId]: value } as any);
		updateStyleForAxis(axisId, value);

		if (axisId === "legalSystem") {
			await wizardStore.generateFromIntent({
				...wizardStore.styleIntent,
				class: wizardStore.styleIntent.class ?? "footnote",
				from_preset: value === "oscola" ? "oscola" : "bluebook_legal",
				has_bibliography:
					wizardStore.styleIntent.has_bibliography ??
					wizardStore.axisChoices.hasBibliography ??
					true,
			});
		}

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
		goto("/create/refine");
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
		<p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Step 3 of 5</p>
		<div class="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
			<div
				class="h-full bg-primary rounded-full transition-all duration-500"
				style="width: 60%"
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
						Continue to Refinement
					</button>
				{:else}
					<button
						onclick={useThisAnyhow}
						class="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
					>
						{currentAxisIndex === 0 ? "Skip to Refinement" : "Next: Refine Details"}
					</button>
					{#if currentAxisIndex < axes.length - 1}
						<p class="mt-2 text-xs text-text-secondary italic">
							You can skip the remaining {axes.length - 1 - currentAxisIndex} questions and refine further
							in the next step.
						</p>
					{/if}
				{/if}

				<div class="grid grid-cols-2 gap-3">
					<button
						onclick={customizeFurther}
						class="rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
					>
						<span class="material-symbols-outlined text-lg">settings_suggest</span>
						Visual Editor
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
