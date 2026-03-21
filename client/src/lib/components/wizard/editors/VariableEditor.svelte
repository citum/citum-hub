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

	function getVariableConfig(): Record<string, unknown> {
		const path = getSelectedPath();
		if (!path) return {};
		return wizardStore.getTemplateNode(path) ?? {};
	}

	function updateVariableProperty(path: string, value: unknown) {
		const selectedPath = getSelectedPath(editScope === "local");
		if (!selectedPath) return;
		wizardStore.updateStyleField(`${selectedPath}.${path}`, value);
		debouncedFetchPreview();
	}

	const componentType = $derived(wizardStore.selectedComponent?.componentType ?? "variable");
	const config = $derived(getVariableConfig());
	const prefix = $derived((config.prefix as string) ?? "");
	const suffix = $derived((config.suffix as string) ?? "");
	const isEmph = $derived((config.emph as boolean) ?? false);
	const isStrong = $derived((config.strong as boolean) ?? false);
	const isSuppressed = $derived((config.suppress as boolean) ?? false);
</script>

<div class="space-y-4 p-6 pt-4">
	<div class="flex items-center justify-between">
		<h3 class="font-semibold text-text-main">
			Field: <span class="capitalize">{componentType}</span>
		</h3>

		<label for="ve-suppress" class="flex items-center gap-2 cursor-pointer">
			<input
				id="ve-suppress"
				type="checkbox"
				checked={isSuppressed}
				onchange={(e) => updateVariableProperty("suppress", e.currentTarget.checked)}
				class="w-4 h-4 rounded border-border-light text-red-600 focus:ring-red-500"
			/>
			<span class="text-xs font-medium text-text-secondary uppercase tracking-wider"
				>Hide field</span
			>
		</label>
	</div>

	<div class="grid grid-cols-2 gap-4">
		<div>
			<label for="ve-prefix" class="block text-sm font-medium text-text-main mb-2">Prefix</label>
			<input
				id="ve-prefix"
				type="text"
				value={prefix}
				oninput={(e) => updateVariableProperty("prefix", e.currentTarget.value)}
				placeholder="e.g. , "
				class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
			/>
		</div>
		<div>
			<label for="ve-suffix" class="block text-sm font-medium text-text-main mb-2">Suffix</label>
			<input
				id="ve-suffix"
				type="text"
				value={suffix}
				oninput={(e) => updateVariableProperty("suffix", e.currentTarget.value)}
				placeholder="e.g. . "
				class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
			/>
		</div>
	</div>

	<div>
		<span class="block text-sm font-medium text-text-main mb-2">Style</span>
		<div class="flex gap-4">
			<label for="ve-emph" class="flex items-center gap-2 cursor-pointer">
				<input
					id="ve-emph"
					type="checkbox"
					checked={isEmph}
					onchange={(e) => updateVariableProperty("emph", e.currentTarget.checked)}
					class="w-4 h-4 rounded border-border-light text-primary focus:ring-primary"
				/>
				<span class="text-sm text-text-main">Italic</span>
			</label>
			<label for="ve-strong" class="flex items-center gap-2 cursor-pointer">
				<input
					id="ve-strong"
					type="checkbox"
					checked={isStrong}
					onchange={(e) => updateVariableProperty("strong", e.currentTarget.checked)}
					class="w-4 h-4 rounded border-border-light text-primary focus:ring-primary"
				/>
				<span class="text-sm text-text-main">Bold</span>
			</label>
		</div>
	</div>
</div>
