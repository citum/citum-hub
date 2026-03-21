<script lang="ts">
	import { wizardStore } from "$lib/stores/wizard.svelte";

	let { editScope = "all" } = $props<{ editScope?: "all" | "local" }>();
	let debounceTimer: number | undefined;

	function debouncedFetchPreview() {
		clearTimeout(debounceTimer);
		debounceTimer = window.setTimeout(() => {
			wizardStore.fetchPreview();
		}, 300);
	}

	function getSelectedPath(ensureLocal = false): string | null {
		const selected = wizardStore.selectedComponent;
		if (!selected) return null;
		return wizardStore.getScopedTemplatePath(selected.templatePath, editScope, { ensureLocal });
	}

	function getDateConfig(): Record<string, unknown> {
		const path = getSelectedPath();
		if (!path) return {};
		return wizardStore.getTemplateNode(path) ?? {};
	}

	function updateDate(path: string, value: unknown) {
		const selectedPath = getSelectedPath(editScope === "local");
		if (!selectedPath) return;
		wizardStore.updateStyleField(`${selectedPath}.${path}`, value);
		debouncedFetchPreview();
	}

	const config = $derived(getDateConfig());
	const dateForm = $derived((config.form as string) ?? "year");
	const wrap = $derived((config.wrap as string) ?? "parentheses");
	const prefix = $derived((config.prefix as string) ?? "");
	const suffix = $derived((config.suffix as string) ?? "");
	const isEmph = $derived((config.emph as boolean) ?? false);
	const isStrong = $derived((config.strong as boolean) ?? false);
</script>

<div class="space-y-4 p-6 pt-4">
	<h3 class="font-semibold text-text-main mb-4">Date Display</h3>

	<div class="space-y-4">
		<div>
			<label for="de-form" class="block text-sm font-medium text-text-main mb-2">Format</label>
			<select
				id="de-form"
				value={dateForm}
				onchange={(e) => updateDate("form", e.currentTarget.value)}
				class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
			>
				<option value="year">Year</option>
				<option value="year-month">Month-Year</option>
				<option value="full">Full date</option>
				<option value="year-month-day">Numeric</option>
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
				<option value="parentheses">Parentheses</option>
				<option value="brackets">Brackets</option>
				<option value="none">None</option>
			</select>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="de-prefix" class="block text-sm font-medium text-text-main mb-2">Prefix</label>
				<input
					id="de-prefix"
					type="text"
					value={prefix}
					oninput={(e) => updateDate("prefix", e.currentTarget.value || undefined)}
					class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
				/>
			</div>
			<div>
				<label for="de-suffix" class="block text-sm font-medium text-text-main mb-2">Suffix</label>
				<input
					id="de-suffix"
					type="text"
					value={suffix}
					oninput={(e) => updateDate("suffix", e.currentTarget.value || undefined)}
					class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
				/>
			</div>
		</div>

		<div>
			<span class="block text-sm font-medium text-text-main mb-2">Style</span>
			<div class="flex gap-4">
				<label for="de-emph" class="flex items-center gap-2 cursor-pointer">
					<input
						id="de-emph"
						type="checkbox"
						checked={isEmph}
						onchange={(e) => updateDate("emph", e.currentTarget.checked || undefined)}
						class="w-4 h-4 rounded border-border-light text-primary focus:ring-primary"
					/>
					<span class="text-sm text-text-main">Italic</span>
				</label>
				<label for="de-strong" class="flex items-center gap-2 cursor-pointer">
					<input
						id="de-strong"
						type="checkbox"
						checked={isStrong}
						onchange={(e) => updateDate("strong", e.currentTarget.checked || undefined)}
						class="w-4 h-4 rounded border-border-light text-primary focus:ring-primary"
					/>
					<span class="text-sm text-text-main">Bold</span>
				</label>
			</div>
		</div>
	</div>
</div>
