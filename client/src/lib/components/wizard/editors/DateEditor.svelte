<script lang="ts">
	/* eslint-disable @typescript-eslint/no-explicit-any */
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import type { DateConfig } from "$lib/types/wizard";

	let { editScope = "all" } = $props<{ editScope?: "all" | "local" }>();
	let debounceTimer: number | undefined;

	function debouncedFetchPreview() {
		clearTimeout(debounceTimer);
		debounceTimer = window.setTimeout(() => {
			wizardStore.fetchPreview();
		}, 300);
	}

	function getDateConfig(): DateConfig {
		const obj = wizardStore.parseStyle();
		if (!obj) return {};

		if (editScope === "local") {
			const override = (obj.options as any)?.dates?.[wizardStore.activeRefType];
			if (override && typeof override === "object") return override;
		}

		const opts = wizardStore.getOptions();
		if (opts?.dates && typeof opts.dates === "object") return opts.dates;
		return {};
	}

	function updateDate(path: keyof DateConfig, value: unknown) {
		const current = getDateConfig();
		const updated = { ...current, [path]: value };

		if (editScope === "all") {
			wizardStore.updateStyleField("options.dates", updated);
		} else {
			const typePath = `options.dates.${wizardStore.activeRefType}`;
			wizardStore.updateStyleField(typePath, updated);
		}
		debouncedFetchPreview();
	}

	const config = $derived(getDateConfig());
	const monthFormat = $derived(config.month ?? "long");
</script>

<div class="space-y-4 p-6 pt-4">
	<h3 class="font-semibold text-text-main mb-4">Date Display</h3>
	<p class="text-xs text-text-secondary mb-4">
		Affects all dates in your bibliography and citations.
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
					e.g. "January 15, 2024"
				{:else if monthFormat === "short"}
					e.g. "Jan. 15, 2024"
				{:else if monthFormat === "numeric"}
					e.g. "1/15/2024"
				{:else}
					e.g. "01/15/2024"
				{/if}
			</p>
		</div>
	</div>
</div>
