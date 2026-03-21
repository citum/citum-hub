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

	function getTitleRendering(): Record<string, unknown> {
		const path = getSelectedPath();
		if (!path) return {};
		return wizardStore.getTemplateNode(path) ?? {};
	}

	function updateTitleRendering(path: string, value: unknown) {
		const selectedPath = getSelectedPath(editScope === "local");
		if (!selectedPath) return;
		wizardStore.updateStyleField(`${selectedPath}.${path}`, value);
		debouncedFetchPreview();
	}

	const rendering = $derived(getTitleRendering());
	const textCase = $derived((rendering["text-case"] as string) ?? "sentence");
	const isQuoted = $derived((rendering.quote as boolean) ?? false);
	const isEmph = $derived((rendering.emph as boolean) ?? false);
	const prefix = $derived((rendering.prefix as string) ?? "");
	const suffix = $derived((rendering.suffix as string) ?? "");
</script>

<div class="space-y-4 p-6 pt-4">
	<h3 class="font-semibold text-text-main mb-4">Title Formatting</h3>

	<div class="space-y-4">
		<div>
			<label for="te-case" class="block text-sm font-medium text-text-main mb-2"
				>Capitalization</label
			>
			<select
				id="te-case"
				value={textCase}
				onchange={(e) => updateTitleRendering("text-case", e.currentTarget.value)}
				class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
			>
				<option value="sentence">Sentence case</option>
				<option value="title">Title Case</option>
				<option value="as-is">As entered</option>
			</select>
		</div>

		<div>
			<span class="block text-sm font-medium text-text-main mb-2">Style</span>
			<div class="space-y-2">
				<label for="te-quoted" class="flex items-center gap-2 cursor-pointer">
					<input
						id="te-quoted"
						type="checkbox"
						checked={isQuoted}
						onchange={(e) => updateTitleRendering("quote", e.currentTarget.checked)}
						class="w-4 h-4 rounded border-border-light text-primary focus:ring-primary"
					/>
					<span class="text-sm text-text-main">In quotes</span>
				</label>
				<label for="te-emph" class="flex items-center gap-2 cursor-pointer">
					<input
						id="te-emph"
						type="checkbox"
						checked={isEmph}
						onchange={(e) => updateTitleRendering("emph", e.currentTarget.checked)}
						class="w-4 h-4 rounded border-border-light text-primary focus:ring-primary"
					/>
					<span class="text-sm text-text-main">Italic</span>
				</label>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="te-prefix" class="block text-sm font-medium text-text-main mb-2">Prefix</label>
				<input
					id="te-prefix"
					type="text"
					value={prefix}
					oninput={(e) => updateTitleRendering("prefix", e.currentTarget.value || undefined)}
					class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
				/>
			</div>
			<div>
				<label for="te-suffix" class="block text-sm font-medium text-text-main mb-2">Suffix</label>
				<input
					id="te-suffix"
					type="text"
					value={suffix}
					oninput={(e) => updateTitleRendering("suffix", e.currentTarget.value || undefined)}
					class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
				/>
			</div>
		</div>
	</div>
</div>
