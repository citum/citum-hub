<script lang="ts">
	import type { WizardStyleOptions, ContributorConfig, LocatorConfig } from "$lib/types/wizard";

	interface Props {
		activeTab?: string;
		currentOptions: WizardStyleOptions | null;
		onUpdateOption: (path: string, value: unknown) => void;
		onUpdateDates: (form: string) => void;
		onUpdatePageRange: (format: string) => void;
		onUpdateLocatorLabel: (form: string) => void;
		onHighlightChange?: (field: string | null) => void;
	}

	const {
		activeTab,
		currentOptions,
		onUpdateOption,
		onUpdateDates,
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
		onUpdateOption("contributors.display-as-sort", displayAsSort);
	}

	function updateAndConnector(connector: string) {
		onUpdateOption("contributors.and", connector);
	}

	function updateEtAlAfter(minValue: number) {
		if (minValue < 1 || minValue > 20) return;
		onUpdateOption("contributors.shorten", {
			min: minValue,
			"use-first": 1,
			"and-others": "et-al",
		});
	}

	function updateInitials(style: string) {
		if (style === "abbreviated") {
			onUpdateOption("contributors.name-form", "initials");
			onUpdateOption("contributors.initialize-with", ". ");
		} else if (style === "compact") {
			onUpdateOption("contributors.name-form", "initials");
			onUpdateOption("contributors.initialize-with", "");
		} else {
			onUpdateOption("contributors.name-form", "full");
			onUpdateOption("contributors.initialize-with", undefined);
		}
	}

	function updateRolePreset(preset: string) {
		onUpdateOption("contributors.editor-label-format", preset);
	}

	function updateArticleStyle(style: "plain" | "quoted" | "italic") {
		if (style === "quoted") {
			onUpdateOption("titles.serial.wrap", "quotes");
		} else {
			onUpdateOption("titles.serial.wrap", undefined);
		}
	}

	function updateBookEmphasis(italic: boolean) {
		onUpdateOption("titles.monograph.emph", italic);
	}

	function updateTitleCase(caseStyle: string) {
		onUpdateOption("titles.monograph.text-case", caseStyle);
		onUpdateOption("titles.serial.text-case", caseStyle);
	}

	const getArticleStyleValue = () => {
		if (currentOptions?.titles && typeof currentOptions.titles === "object") {
			const titles = currentOptions.titles as Record<string, Record<string, unknown>>;
			if (titles.serial?.wrap === "quotes") return "quoted";
		}
		return "plain";
	};

	const getBookEmphasisValue = () => {
		if (currentOptions?.titles && typeof currentOptions.titles === "object") {
			const titles = currentOptions.titles as Record<string, Record<string, unknown>>;
			return titles.monograph?.emph !== false;
		}
		return true;
	};

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
			const titles = currentOptions.titles as Record<string, Record<string, unknown>>;
			return (titles.monograph?.["text-case"] as string) || "sentence";
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

	const getRolePresetValue = () => {
		if (currentOptions?.contributors && typeof currentOptions.contributors === "object") {
			const config = currentOptions.contributors as ContributorConfig;
			if (typeof config.role === "string") return config.role;
			if (config.role && typeof config.role === "object" && config.role.preset) {
				return config.role.preset;
			}
		}
		return "short-suffix";
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

					<div>
						<label for="rc-role-preset" class="block text-sm font-medium text-text-main mb-2"
							>Role Label Format</label
						>
						<select
							id="rc-role-preset"
							onchange={(e) => updateRolePreset(e.currentTarget.value)}
							value={getRolePresetValue()}
							class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
						>
							<option value="short-suffix">Short Suffix (ed. / trans.)</option>
							<option value="long-suffix">Long Suffix (editor / translator)</option>
							<option value="verb-prefix">Verb Prefix (edited by / translated by)</option>
							<option value="none">None (suppress role)</option>
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
						<label for="rc-date-position" class="block text-sm font-medium text-text-main mb-2"
							>Position</label
						>
						<select
							id="rc-date-position"
							disabled
							value="after-author"
							class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main opacity-50 cursor-not-allowed"
						>
							<option value="after-author">After author</option>
						</select>
						<p class="mt-1 text-xs text-text-secondary">
							Structural position is set by style family.
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
							onchange={(e) => updateTitleCase(e.currentTarget.value)}
							value={getTitleCaseValue()}
							class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
						>
							<option value="sentence">Sentence case</option>
							<option value="title">Title Case</option>
							<option value="as-is">As entered</option>
						</select>
					</div>

					<div>
						<label for="rc-article-style" class="block text-sm font-medium text-text-main mb-2"
							>Article Style</label
						>
						<select
							id="rc-article-style"
							onchange={(e) =>
								updateArticleStyle(e.currentTarget.value as "plain" | "quoted" | "italic")}
							value={getArticleStyleValue()}
							class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
						>
							<option value="plain">No decoration</option>
							<option value="quoted">"In quotes"</option>
							<option value="italic">Italic</option>
						</select>
					</div>

					<div>
						<label for="rc-book-emphasis" class="block text-sm font-medium text-text-main mb-2"
							>Book Titles</label
						>
						<select
							id="rc-book-emphasis"
							onchange={(e) => updateBookEmphasis(e.currentTarget.value === "italic")}
							value={getBookEmphasisValue() ? "italic" : "plain"}
							class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
						>
							<option value="italic">Italic</option>
							<option value="plain">No decoration</option>
						</select>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
