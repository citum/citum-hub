<script lang="ts">
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import type { DateConfig } from "$lib/types/wizard";

	let debounceTimer: number | undefined;

	function debouncedFetchPreview() {
		clearTimeout(debounceTimer);
		debounceTimer = window.setTimeout(() => {
			wizardStore.fetchPreview();
		}, 300);
	}

	function getDateConfig(): DateConfig {
		const opts = wizardStore.getOptions();
		if (opts?.dates && typeof opts.dates === "object") {
			return opts.dates;
		}
		return {};
	}

	function updateDate(path: keyof DateConfig, value: unknown) {
		const current = getDateConfig();
		const updated = { ...current, [path]: value };
		wizardStore.updateStyleField("options.dates", updated);
		debouncedFetchPreview();
	}

	const config = $derived(getDateConfig());
	const format = $derived(config.form ?? "year");
	const wrap = $derived(config.wrap ?? "none");
</script>

<div class="space-y-4 p-6">
	<div>
		<h3 class="font-semibold text-text-main mb-4">Date Formatting</h3>
		<div class="space-y-4">
			<div>
				<label for="de-format" class="block text-sm font-medium text-text-main mb-2">Format</label>
				<select
					id="de-format"
					value={format}
					onchange={(e) => updateDate("form", e.currentTarget.value)}
					class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
				>
					<option value="year">Year only (2024)</option>
					<option value="year-month">Month and year (March 2024)</option>
					<option value="full">Full date (March 15, 2024)</option>
				</select>
			</div>

			<div>
				<label for="de-wrap" class="block text-sm font-medium text-text-main mb-2">Wrap</label>
				<select
					id="de-wrap"
					value={wrap}
					onchange={(e) => updateDate("wrap", e.currentTarget.value)}
					class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
				>
					<option value="none">None</option>
					<option value="parentheses">Parentheses (2024)</option>
					<option value="brackets">Brackets [2024]</option>
				</select>
			</div>
		</div>
	</div>
</div>
