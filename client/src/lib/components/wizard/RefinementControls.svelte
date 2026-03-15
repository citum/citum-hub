<script lang="ts">
	import type { WizardStyleOptions } from "$lib/types/wizard";

	interface Props {
		currentOptions: WizardStyleOptions | null;
		onUpdateContributors: (path: string, value: unknown) => void;
		onUpdateDates: (form: string) => void;
		onUpdateTitles: (textCase: string) => void;
	}

	const { currentOptions, onUpdateContributors, onUpdateDates, onUpdateTitles }: Props = $props();

	let expandedSections = $state<Record<string, boolean>>({
		names: true,
		dates: true,
		titles: true,
	});

	function toggleSection(section: string) {
		expandedSections[section] = !expandedSections[section];
	}

	function updateNameOrder(order: string) {
		const form = order === "family-first" ? "short" : "long";
		onUpdateContributors("form", form);
	}

	function updateAndConnector(connector: string) {
		let value: string | undefined;
		if (connector === "symbol") {
			value = "symbol";
		} else if (connector === "text") {
			value = "text";
		}
		if (value !== undefined) {
			onUpdateContributors("and", value);
		}
	}

	function updateEtAlAfter(minValue: number) {
		if (minValue < 1 || minValue > 20) return;
		onUpdateContributors("shorten", { min: minValue });
	}

	function updateInitials(style: string) {
		let value: string | undefined;
		if (style === "abbreviated") {
			value = ". ";
		} else if (style === "compact") {
			value = "";
		}
		if (value !== undefined) {
			onUpdateContributors("initialize-with", value);
		}
	}

	const getNameOrderValue = () => {
		if (currentOptions?.contributors && typeof currentOptions.contributors === "object") {
			return currentOptions.contributors.form === "long" ? "given-first" : "family-first";
		}
		return "family-first";
	};

	const getAndValue = () => {
		if (currentOptions?.contributors && typeof currentOptions.contributors === "object") {
			return currentOptions.contributors.and === "text" ? "text" : "symbol";
		}
		return "symbol";
	};

	const getEtAlValue = () => {
		if (currentOptions?.contributors && typeof currentOptions.contributors === "object") {
			return currentOptions.contributors.shorten?.min || 3;
		}
		return 3;
	};

	const getInitialsValue = () => {
		if (currentOptions?.contributors && typeof currentOptions.contributors === "object") {
			const initWith = currentOptions.contributors["initialize-with"];
			if (initWith === ". ") return "abbreviated";
			if (initWith === "") return "compact";
		}
		return "full";
	};

	const getDateFormatValue = () => {
		if (currentOptions?.dates && typeof currentOptions.dates === "object") {
			return currentOptions.dates.form || "year";
		}
		return "year";
	};

	const getTitleCaseValue = () => {
		if (currentOptions?.titles && typeof currentOptions.titles === "object") {
			return currentOptions.titles["text-case"] || "sentence";
		}
		return "sentence";
	};
</script>

<div class="space-y-4">
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
						onchange={(e) => updateEtAlAfter(parseInt(e.currentTarget.value))}
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

	<!-- Dates Section -->
	<div class="overflow-hidden rounded-lg border border-border-light bg-surface-light">
		<button
			onclick={() => toggleSection("dates")}
			class="flex w-full items-center justify-between px-6 py-4 hover:bg-background-light transition-colors"
		>
			<h2 class="font-semibold text-text-main">Dates</h2>
			<span
				class="material-symbols-outlined transition-transform duration-200"
				class:rotate-180={expandedSections.dates}
			>
				expand_more
			</span>
		</button>

		{#if expandedSections.dates}
			<div class="space-y-4 border-t border-border-light px-6 py-4">
				<div>
					<label for="rc-date-format" class="block text-sm font-medium text-text-main mb-2"
						>Format</label
					>
					<select
						id="rc-date-format"
						onchange={(e) => onUpdateDates(e.currentTarget.value)}
						value={getDateFormatValue()}
						class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
					>
						<option value="year">Year only (2024)</option>
						<option value="year-month">Month and year (March 2024)</option>
						<option value="full">Full date (March 15, 2024)</option>
					</select>
				</div>
			</div>
		{/if}
	</div>

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
</div>
