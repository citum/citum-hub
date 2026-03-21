<script lang="ts">
	import { wizardStore } from "$lib/stores/wizard.svelte";

	let debounceTimer: number | undefined;

	function debouncedFetchPreview() {
		clearTimeout(debounceTimer);
		debounceTimer = window.setTimeout(() => {
			void wizardStore.fetchPreview();
		}, 300);
	}

	function getSelectedNode(): Record<string, unknown> | null {
		if (!wizardStore.selectedComponent) return null;
		const path = wizardStore.getScopedTemplatePath(
			wizardStore.selectedComponent.templatePath,
			wizardStore.selectedComponent.scope === "local" ? "local" : "all",
            { ensureLocal: wizardStore.selectedComponent.scope === "local" }
		);
		return wizardStore.getTemplateNode(path);
	}

	function updatePunctuation(key: "prefix" | "suffix", value: string) {
		const selection = wizardStore.selectedComponent;
		if (!selection) return;

		const path = wizardStore.getScopedTemplatePath(
			selection.templatePath,
			selection.scope === "local" ? "local" : "all",
			{ ensureLocal: selection.scope === "local" }
		);

		wizardStore.updateStyleField(`${path}.${key}`, value || undefined);
		debouncedFetchPreview();
	}

	function updateGlobalPunctuationInQuote(value: boolean) {
		wizardStore.updateStyleField("options.punctuation-in-quote", value);
		debouncedFetchPreview();
	}

	const selectedNode = $derived(getSelectedNode());
	const punctuationInQuote = $derived(
		(wizardStore.getOptions()?.["punctuation-in-quote"] as boolean) ?? false
	);
</script>

<div class="space-y-6">
	<!-- Contextual Punctuation (Only visible if a component is selected) -->
	{#if wizardStore.selectedComponent && selectedNode}
		<div class="rounded-lg border border-border-light bg-surface-light p-6">
			<div class="mb-4">
				<h3 class="font-semibold text-text-main flex items-center gap-2 text-lg">
					<span class="material-symbols-outlined text-primary">data_object</span>
					Element Punctuation
				</h3>
				<p class="text-sm text-text-secondary mt-1">
					Refine delimiters specifically for <span class="font-bold text-slate-700"
						>{wizardStore.selectedComponent.componentType}</span
					>.
				</p>
			</div>

			<div class="grid gap-6 sm:grid-cols-2">
				<div>
					<label for="punc-prefix" class="block text-sm font-medium text-text-main mb-2">
						Prefix (Added before)
					</label>
					<input
						id="punc-prefix"
						type="text"
						value={(selectedNode.prefix as string) || ""}
						placeholder='e.g., " ("'
						oninput={(e) => updatePunctuation("prefix", e.currentTarget.value)}
						class="w-full rounded border border-border-light bg-white px-4 py-2 text-text-main font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
					/>
				</div>
				<div>
					<label for="punc-suffix" class="block text-sm font-medium text-text-main mb-2">
						Suffix (Added after)
					</label>
					<input
						id="punc-suffix"
						type="text"
						value={(selectedNode.suffix as string) || ""}
						placeholder='e.g., "."'
						oninput={(e) => updatePunctuation("suffix", e.currentTarget.value)}
						class="w-full rounded border border-border-light bg-white px-4 py-2 text-text-main font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
					/>
				</div>
			</div>

			<div class="mt-4 rounded-lg bg-blue-50/50 p-4 border border-blue-100/50 flex gap-3">
				<span class="material-symbols-outlined text-primary text-xl">lightbulb</span>
				<div>
					<h4 class="text-sm font-semibold text-blue-900">Smart Suggestions</h4>
					<p class="text-xs text-blue-800/80 mt-0.5">
						Depending on your layout, a comma or period might be appropriate here based on standard
						rules.
					</p>
				</div>
			</div>
		</div>
	{:else}
		<div class="rounded-lg border border-dashed border-border-light bg-surface-light p-8 text-center">
			<span class="material-symbols-outlined text-slate-300 text-4xl mb-2">touch_app</span>
			<p class="text-sm text-text-secondary">
				Select a component in the Structure tab or Preview to edit its specific prefix and suffix.
			</p>
		</div>
	{/if}

	<!-- Global Punctuation Options -->
	<div class="rounded-lg border border-border-light bg-surface-light overflow-hidden">
		<div class="p-6 border-b border-border-light bg-white">
			<h3 class="font-semibold text-text-main flex items-center gap-2 text-lg">
				<span class="material-symbols-outlined text-primary">public</span>
				Global Punctuation Rules
			</h3>
			<p class="text-sm text-text-secondary mt-1">
				These rules apply across the entire citation style.
			</p>
		</div>

		<div class="p-6 space-y-6">
			<!-- Punctuation in Quotes -->
			<label class="flex items-start gap-4 cursor-pointer group">
				<div class="flex items-center h-6">
					<input
						type="checkbox"
						checked={punctuationInQuote}
						onchange={(e) => updateGlobalPunctuationInQuote(e.currentTarget.checked)}
						class="h-5 w-5 rounded border-border-light text-primary focus:ring-primary transition-colors cursor-pointer"
					/>
				</div>
				<div class="flex-1">
					<p class="font-semibold text-text-main group-hover:text-primary transition-colors">
						Punctuation in quotes
					</p>
					<p class="text-sm text-text-secondary mt-1">
						Move terminal punctuation (periods and commas) inside closing quotation marks, common in
						US styles.
					</p>
				</div>
			</label>
		</div>
	</div>
</div>
