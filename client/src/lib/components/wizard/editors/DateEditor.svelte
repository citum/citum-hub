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
	const monthFormat = $derived(config.month ?? "long");
</script>

<div class="space-y-4 p-6">
	<div>
		<h3 class="font-semibold text-text-main mb-4">Date Display</h3>
		<p class="text-xs text-text-secondary mb-4">
			Affects all dates in your bibliography and citations — publication year, access date, event
			date, etc.
		</p>
		<div class="space-y-4">
			<div>
				<label for="de-month" class="block text-sm font-medium text-text-main mb-2"
					>Month Format</label
				>
				<select
					id="de-month"
					value={monthFormat}
					onchange={(e) => updateDate("month", e.currentTarget.value)}
					class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
				>
					<option value="long">Full name (January)</option>
					<option value="short">Abbreviated (Jan.)</option>
					<option value="numeric">Numeric (1)</option>
					<option value="numeric-leading-zeros">Numeric with zero (01)</option>
				</select>
				<p class="mt-2 text-xs text-text-secondary italic">
					{#if monthFormat === "long"}
						e.g. "Published January 15, 2024" · "Accessed March 3, 2025"
					{:else if monthFormat === "short"}
						e.g. "Published Jan. 15, 2024" · "Accessed Mar. 3, 2025"
					{:else if monthFormat === "numeric"}
						e.g. "Published 1/15/2024" · "Accessed 3/3/2025"
					{:else}
						e.g. "Published 01/15/2024" · "Accessed 03/03/2025"
					{/if}
				</p>
			</div>
		</div>
	</div>
</div>
