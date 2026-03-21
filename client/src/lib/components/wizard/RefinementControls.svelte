<script lang="ts">
	import type { WizardStyleOptions, ContributorConfig, LocatorConfig } from "$lib/types/wizard";

	interface Props {
		activeTab?: string;
		currentOptions: WizardStyleOptions | null;
		onUpdateContributors: (path: string, value: unknown) => void;
		onUpdateDates: (form: string) => void;
		onUpdateTitles: (textCase: string) => void;
		onUpdatePageRange: (format: string) => void;
		onUpdateLocatorLabel: (form: string) => void;
		onHighlightChange?: (field: string | null) => void;
	}

	const {
		activeTab,
		currentOptions,
		onUpdateContributors,
		onUpdateDates,
		onUpdateTitles,
		onUpdatePageRange,
		onUpdateLocatorLabel,
		onHighlightChange,
	}: Props = $props();

	let expandedSections = $state<Record<string, boolean>>({
		names: true,
		dates: true,
		titles: true,
		citations: true,
	});

	function toggleSection(section: string) {
		expandedSections[section] = !expandedSections[section];
	}

	function updateNameOrder(order: string) {
		const displayAsSort = order === "family-first" ? "all" : "none";
		onUpdateContributors("display-as-sort", displayAsSort);
	}

	function updateAndConnector(connector: string) {
		onUpdateContributors("and", connector);
	}

	function updateEtAlAfter(minValue: number) {
		if (minValue < 1 || minValue > 20) return;
		onUpdateContributors("shorten", { min: minValue, "use-first": 1 });
	}

	function updateInitials(style: string) {
		if (style === "abbreviated") {
			onUpdateContributors("name-form", "initials");
			onUpdateContributors("initialize-with", ". ");
		} else if (style === "compact") {
			onUpdateContributors("name-form", "initials");
			onUpdateContributors("initialize-with", "");
		} else {
			onUpdateContributors("name-form", "full");
			onUpdateContributors("initialize-with", undefined);
		}
	}

	const getNameOrderValue = () => {
		if (currentOptions?.contributors && typeof currentOptions.contributors === "object") {
			const config = currentOptions.contributors as ContributorConfig;
			return config["display-as-sort"] === "all" ? "family-first" : "given-first";
		}
		return "family-first";
	};

	const getAndValue = () => {
		if (currentOptions?.contributors && typeof currentOptions.contributors === "object") {
			const config = currentOptions.contributors as ContributorConfig;
			return config.and === "text" ? "text" : "symbol";
		}
		return "symbol";
	};

	const getEtAlValue = () => {
		if (currentOptions?.contributors && typeof currentOptions.contributors === "object") {
			const config = currentOptions.contributors as ContributorConfig;
			return config.shorten?.min || 3;
		}
		return 3;
	};

	const getInitialsValue = () => {
		if (currentOptions?.contributors && typeof currentOptions.contributors === "object") {
			const config = currentOptions.contributors as ContributorConfig;
			if (config["name-form"] === "full") return "full";
			const initWith = config["initialize-with"];
			if (initWith === ". ") return "abbreviated";
			if (initWith === "") return "compact";
		}
		return "full";
	};

	const getMonthFormatValue = () => {
		if (currentOptions?.dates && typeof currentOptions.dates === "object") {
			return currentOptions.dates.month || "long";
		}
		return "long";
	};

	const getTitleCaseValue = () => {
		if (currentOptions?.titles && typeof currentOptions.titles === "object") {
			const titles = currentOptions.titles as Record<string, unknown>;
			const defaultRendering = titles.default as Record<string, unknown> | undefined;
			return (defaultRendering?.["text-case"] as string) || "sentence";
		}
		return "sentence";
	};

	const getLocatorLabelValue = () => {
		if (currentOptions?.locators && typeof currentOptions.locators === "object") {
			const config = currentOptions.locators as LocatorConfig;
			return config["default-label-form"] || "short";
		}
		return "short";
	};
</script>

<div class="space-y-4">
	{#if !activeTab || activeTab === "punctuation"}
	<!-- Citations Section -->
	<div class="overflow-hidden rounded-lg border border-border-light bg-surface-light">
		<button
			onclick={() => toggleSection("citations")}
			class="flex w-full items-center justify-between px-6 py-4 hover:bg-background-light transition-colors"
		>
			<h2 class="font-semibold text-text-main">Citations</h2>
			<span
				class="material-symbols-outlined transition-transform duration-200"
				class:rotate-180={expandedSections.citations}
			>
				expand_more
			</span>
		</button>

		{#if expandedSections.citations}
			<div class="space-y-4 border-t border-border-light px-6 py-4">
				<p class="text-xs text-text-secondary">
					Configure how pinpoint locators (page numbers, etc.) appear in citations.
				</p>
				<div>
					<label for="rc-locator-label" class="block text-sm font-medium text-text-main mb-2"
						>Locator Label Format</label
					>
					<select
						id="rc-locator-label"
						onchange={(e) => onUpdateLocatorLabel(e.currentTarget.value)}
						value={getLocatorLabelValue()}
						class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
					>
						<option value="short">Short (p. 42)</option>
						<option value="long">Long (page 42)</option>
						<option value="symbol">Symbol (§ 42)</option>
						<option value="none">None (42)</option>
					</select>
				</div>
			</div>
		{/if}
	</div>

	{/if}
	{#if !activeTab || activeTab === "authors"}
	<!-- Names Section -->
	<div class="overflow-hidden rounded-lg border border-border-light bg-surface-light">
		<button
			onclick={() => toggleSection("names")}
			class="flex w-full items-center justify-between px-6 py-4 hover:bg-background-light transition-colors"
		>
			<h2 class="font-semibold text-text-main">Names</h2>
			<span
				class="material-symbols-outlined transition-transform duration-200"
				class:rotate-180={expandedSections.names}
			>
				expand_more
			</span>
		</button>

		{#if expandedSections.names}
			<div class="space-y-4 border-t border-border-light px-6 py-4">
				<div>
					<label for="rc-name-order" class="block text-sm font-medium text-text-main mb-2"
						>Name Order</label
					>
					<select
						id="rc-name-order"
						onchange={(e) => updateNameOrder(e.currentTarget.value)}
						value={getNameOrderValue()}
						class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
					>
						<option value="family-first">Family-first (Smith, John)</option>
						<option value="given-first">Given-first (John Smith)</option>
					</select>
				</div>

				<div>
					<label for="rc-and-connector" class="block text-sm font-medium text-text-main mb-2"
						>And Connector</label
					>
					<select
						id="rc-and-connector"
						onchange={(e) => updateAndConnector(e.currentTarget.value)}
						value={getAndValue()}
						class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
					>
						<option value="symbol">Symbol (&)</option>
						<option value="text">Word (and)</option>
					</select>
				</div>

				<div>
					<label for="rc-etal-range" class="block text-sm font-medium text-text-main mb-2">
						Et al. after {getEtAlValue()} authors
					</label>
					<input
						id="rc-etal-range"
						type="range"
						min="1"
						max="20"
						value={getEtAlValue()}
						onpointerdown={() => onHighlightChange?.("contributors")}
						oninput={() => onHighlightChange?.("contributors")}
						onchange={(e) => updateEtAlAfter(parseInt(e.currentTarget.value))}
						onpointerup={() => onHighlightChange?.(null)}
						class="w-full"
					/>
				</div>

				<div>
					<label for="rc-initials" class="block text-sm font-medium text-text-main mb-2"
						>Initials</label
					>
					<select
						id="rc-initials"
						onchange={(e) => updateInitials(e.currentTarget.value)}
						value={getInitialsValue()}
						class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
					>
						<option value="abbreviated">Abbreviated (J. A.)</option>
						<option value="compact">Compact (JA)</option>
						<option value="full">Full names</option>
					</select>
				</div>
			</div>
		{/if}
	</div>

	{/if}
	{#if !activeTab || activeTab === "dates"}
	<!-- Dates Section -->
	<div class="overflow-hidden rounded-lg border border-border-light bg-surface-light">
		<button
			onclick={() => toggleSection("dates")}
			class="flex w-full items-center justify-between px-6 py-4 hover:bg-background-light transition-colors"
		>
			<h2 class="font-semibold text-text-main">Date Display</h2>
			<span
				class="material-symbols-outlined transition-transform duration-200"
				class:rotate-180={expandedSections.dates}
			>
				expand_more
			</span>
		</button>

		{#if expandedSections.dates}
			<div class="space-y-4 border-t border-border-light px-6 py-4">
				<p class="text-xs text-text-secondary">
					Affects dates and number ranges in your bibliography and citations.
				</p>
				<div>
					<label for="rc-month-format" class="block text-sm font-medium text-text-main mb-2"
						>Month Format</label
					>
					<select
						id="rc-month-format"
						onchange={(e) => onUpdateDates(e.currentTarget.value)}
						value={getMonthFormatValue()}
						class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
					>
						<option value="long">Full name (January)</option>
						<option value="short">Abbreviated (Jan.)</option>
						<option value="numeric">Numeric (1)</option>
						<option value="numeric-leading-zeros">Numeric with zero (01)</option>
					</select>
					<p class="mt-2 text-xs text-text-secondary italic">
						{#if getMonthFormatValue() === "long"}
							e.g. "Published January 15, 2024" · "Accessed March 3, 2025"
						{:else if getMonthFormatValue() === "short"}
							e.g. "Published Jan. 15, 2024" · "Accessed Mar. 3, 2025"
						{:else if getMonthFormatValue() === "numeric"}
							e.g. "Published 1/15/2024" · "Accessed 3/3/2025"
						{:else}
							e.g. "Published 01/15/2024" · "Accessed 03/03/2025"
						{/if}
					</p>
				</div>

				<div class="pt-2">
					<label for="rc-page-range" class="block text-sm font-medium text-text-main mb-2"
						>Page Range Format</label
					>
					<select
						id="rc-page-range"
						onchange={(e) => onUpdatePageRange(e.currentTarget.value)}
						value={currentOptions?.["page-range-format"] || "expanded"}
						class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
					>
						<option value="expanded">Expanded (123–125)</option>
						<option value="minimal">Minimal (123–5)</option>
						<option value="minimal-two">Minimal-two (123–25)</option>
						<option value="chicago">Chicago (123–25, but 100–104)</option>
					</select>
				</div>
			</div>
		{/if}
	</div>

	{/if}
	{#if !activeTab || activeTab === "titles"}
	<!-- Titles Section -->
	<div class="overflow-hidden rounded-lg border border-border-light bg-surface-light">
		<button
			onclick={() => toggleSection("titles")}
			class="flex w-full items-center justify-between px-6 py-4 hover:bg-background-light transition-colors"
		>
			<h2 class="font-semibold text-text-main">Titles</h2>
			<span
				class="material-symbols-outlined transition-transform duration-200"
				class:rotate-180={expandedSections.titles}
			>
				expand_more
			</span>
		</button>

		{#if expandedSections.titles}
			<div class="space-y-4 border-t border-border-light px-6 py-4">
				<div>
					<label for="rc-title-case" class="block text-sm font-medium text-text-main mb-2"
						>Capitalization</label
					>
					<select
						id="rc-title-case"
						onchange={(e) => onUpdateTitles(e.currentTarget.value)}
						value={getTitleCaseValue()}
						class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
					>
						<option value="sentence">Sentence case</option>
						<option value="title">Title Case</option>
						<option value="as-is">As entered</option>
					</select>
				</div>
			</div>
		{/if}
	</div>
	{/if}
</div>
