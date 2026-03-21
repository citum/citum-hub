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

	function getContributorConfig(): Record<string, unknown> {
		const path = getSelectedPath();
		if (!path) return {};
		return wizardStore.getTemplateNode(path) ?? {};
	}

	function updateContributor(path: string, value: unknown) {
		const selectedPath = getSelectedPath(editScope === "local");
		if (!selectedPath) return;
		wizardStore.updateStyleField(`${selectedPath}.${path}`, value);
		debouncedFetchPreview();
	}

	function updateShorten(minValue: number) {
		if (minValue < 1 || minValue > 20) return;
		updateContributor("shorten", { min: minValue, "use-first": 1 });
		debouncedFetchPreview();
	}

	const config = $derived(getContributorConfig());
	const nameOrder = $derived((config["name-order"] as string) ?? "family-first");
	const andConnector = $derived((config.and as string) ?? "symbol");
	const initials = $derived(
		config["initialize-with"] === ". "
			? "abbreviated"
			: config["initialize-with"] === ""
				? "compact"
				: "full"
	);
	const etAlAfter = $derived(
		((config.shorten as { min?: number } | undefined)?.min ?? 3) as number
	);
</script>

<div class="space-y-6">
	<div class="mb-4">
		<h3 class="font-semibold text-text-main flex items-center gap-2 text-lg">
			<span class="material-symbols-outlined text-primary">person_edit</span>
			Name Formatting
		</h3>
		<p class="text-sm text-text-secondary mt-1">
			Configure how contributor names appear in your citations.
		</p>
	</div>

	<div class="space-y-5 rounded-lg border border-border-light bg-surface-light p-6 shadow-sm">
		<div>
			<label for="ce-name-order" class="block text-sm font-semibold text-text-main mb-2"
				>Name Display Order</label
			>
			<select
				id="ce-name-order"
				value={nameOrder}
				onchange={(e) => updateContributor("name-order", e.currentTarget.value)}
				class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
			>
				<option value="family-first">Family-first (Smith, John)</option>
				<option value="given-first">Given-first (John Smith)</option>
			</select>
		</div>

		<div>
			<label for="ce-and-connector" class="block text-sm font-semibold text-text-main mb-2"
				>Last Author Connector</label
			>
			<select
				id="ce-and-connector"
				value={andConnector}
				onchange={(e) => updateContributor("and", e.currentTarget.value)}
				class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
			>
				<option value="symbol">Symbol (&)</option>
				<option value="text">Word (and)</option>
				<option value="none">None</option>
			</select>
		</div>

		<div>
			<label for="ce-initials" class="block text-sm font-semibold text-text-main mb-2"
				>Initials Format</label
			>
			<select
				id="ce-initials"
				value={initials}
				onchange={(e) => {
					const val = e.currentTarget.value;
					const initVal = val === "abbreviated" ? ". " : val === "compact" ? "" : undefined;
					updateContributor("initialize-with", initVal);
				}}
				class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
			>
				<option value="abbreviated">Abbreviated (J. A.)</option>
				<option value="compact">Compact (JA)</option>
				<option value="full">Full names</option>
			</select>
		</div>

		<div class="pt-2 border-t border-border-light">
			<label for="ce-etal-range" class="block text-sm font-semibold text-text-main mb-3">
				Truncate to "et al." when authors exceed <span class="text-primary text-xl ml-1"
					>{etAlAfter}</span
				>
			</label>
			<input
				id="ce-etal-range"
				type="range"
				min="1"
				max="20"
				value={etAlAfter}
				onchange={(e) => updateShorten(parseInt(e.currentTarget.value))}
				class="w-full"
			/>
		</div>
	</div>
</div>
