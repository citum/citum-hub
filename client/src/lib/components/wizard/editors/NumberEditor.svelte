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

	function getNumberConfig(): Record<string, unknown> {
		const path = getSelectedPath();
		if (!path) return {};
		return wizardStore.getTemplateNode(path) ?? {};
	}

	function updateNumberProperty(path: string, value: unknown) {
		const selectedPath = getSelectedPath(editScope === "local");
		if (!selectedPath) return;
		wizardStore.updateStyleField(`${selectedPath}.${path}`, value);
		debouncedFetchPreview();
	}

	const componentType = $derived(wizardStore.selectedComponent?.componentType ?? "number");
	const config = $derived(getNumberConfig());
	const prefix = $derived((config.prefix as string) ?? "");
	const suffix = $derived((config.suffix as string) ?? "");
	const isEmph = $derived((config.emph as boolean) ?? false);
	const isStrong = $derived((config.strong as boolean) ?? false);
	const wrap = $derived((config.wrap as string) ?? "none");
</script>

<div class="space-y-4 p-6 pt-4">
	<h3 class="font-semibold text-text-main">
		Number: <span class="capitalize">{componentType}</span>
	</h3>

	<div class="grid grid-cols-2 gap-4">
		<div>
			<label for="ne-prefix" class="block text-sm font-medium text-text-main mb-2">Prefix</label>
			<input
				id="ne-prefix"
				type="text"
				value={prefix}
				oninput={(e) => updateNumberProperty("prefix", e.currentTarget.value)}
				placeholder="e.g. vol. "
				class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
			/>
		</div>
		<div>
			<label for="ne-suffix" class="block text-sm font-medium text-text-main mb-2">Suffix</label>
			<input
				id="ne-suffix"
				type="text"
				value={suffix}
				oninput={(e) => updateNumberProperty("suffix", e.currentTarget.value)}
				placeholder="e.g. , "
				class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
			/>
		</div>
	</div>

	<div>
		<label for="ne-wrap" class="block text-sm font-medium text-text-main mb-2">Wrap</label>
		<select
			id="ne-wrap"
			value={wrap}
			onchange={(e) => updateNumberProperty("wrap", e.currentTarget.value)}
			class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
		>
			<option value="none">None</option>
			<option value="parentheses">Parentheses</option>
			<option value="brackets">Brackets</option>
		</select>
	</div>

	<div>
		<span class="block text-sm font-medium text-text-main mb-2">Style</span>
		<div class="flex gap-4">
			<label for="ne-emph" class="flex items-center gap-2 cursor-pointer">
				<input
					id="ne-emph"
					type="checkbox"
					checked={isEmph}
					onchange={(e) => updateNumberProperty("emph", e.currentTarget.checked)}
					class="w-4 h-4 rounded border-border-light text-primary focus:ring-primary"
				/>
				<span class="text-sm text-text-main">Italic</span>
			</label>
			<label for="ne-strong" class="flex items-center gap-2 cursor-pointer">
				<input
					id="ne-strong"
					type="checkbox"
					checked={isStrong}
					onchange={(e) => updateNumberProperty("strong", e.currentTarget.checked)}
					class="w-4 h-4 rounded border-border-light text-primary focus:ring-primary"
				/>
				<span class="text-sm text-text-main">Bold</span>
			</label>
		</div>
	</div>
</div>
