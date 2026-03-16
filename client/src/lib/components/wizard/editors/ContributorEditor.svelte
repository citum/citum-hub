<script lang="ts">
import { wizardStore } from "$lib/stores/wizard.svelte";
import type { ContributorConfig } from "$lib/types/wizard";

let { editScope = "all" } = $props<{ editScope?: "all" | "local" }>();
let debounceTimer: number | undefined;

function debouncedFetchPreview() {
	clearTimeout(debounceTimer);
	debounceTimer = window.setTimeout(() => {
		wizardStore.fetchPreview();
	}, 300);
}

const activeTypeLabel = $derived(
	wizardStore.activeRefType.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
);

function getContributorConfig(): ContributorConfig {
	const obj = wizardStore.parseStyle();
	if (!obj) return {};

	if (editScope === "local") {
		const bibliography = obj.bibliography as any;
		const override = bibliography?.["type-templates"]?.[wizardStore.activeRefType]?.contributors;
		if (override && typeof override === "object") {
			return override;
		}
	}

	const opts = wizardStore.getOptions();
	if (opts?.contributors && typeof opts.contributors === "object") {
		return opts.contributors;
	}
	return {};
}

function updateContributor(path: keyof ContributorConfig, value: unknown) {
	const current = getContributorConfig();
	const updated = { ...current } as Record<string, unknown>;
	if (value === undefined) {
		delete updated[path];
	} else {
		updated[path] = value;
	}

	if (editScope === "all") {
		wizardStore.updateStyleField("options.contributors", updated);
	} else {
		const typePath = `bibliography.type-templates.${wizardStore.activeRefType}.contributors`;
		wizardStore.updateStyleField(typePath, updated);
	}
	debouncedFetchPreview();
}

function updateShorten(minValue: number) {
	if (minValue < 1 || minValue > 20) return;
	const current = getContributorConfig();
	const useFirst = current.shorten?.["use-first"] ?? 1;
	const updated = {
		...current,
		shorten: { min: minValue, "use-first": useFirst },
	};
	
	if (editScope === "all") {
		wizardStore.updateStyleField("options.contributors", updated);
	} else {
		const typePath = `bibliography.type-templates.${wizardStore.activeRefType}.contributors`;
		wizardStore.updateStyleField(typePath, updated);
	}
	debouncedFetchPreview();
}

const config = $derived(getContributorConfig());
const nameOrder = $derived(
	config["display-as-sort"] === "all" ? "family-first" : "given-first",
);
const andConnector = $derived(config.and === "text" ? "text" : "symbol");
const initials = $derived(
	config["initialize-with"] === ". "
		? "abbreviated"
		: config["initialize-with"] === ""
			? "compact"
			: "full",
);
const etAlAfter = $derived(config.shorten?.min ?? 3);
</script>

<div class="space-y-4 p-6 pt-4">
	<h3 class="font-semibold text-text-main mb-4">Name Formatting</h3>
	
	<div class="space-y-4">
		<div>
			<label for="ce-name-order" class="block text-sm font-medium text-text-main mb-2">Name Order</label>
			<select
				id="ce-name-order"
				value={nameOrder}
				onchange={(e) => updateContributor("display-as-sort", e.currentTarget.value === "family-first" ? "all" : undefined)}
				class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
			>
				<option value="family-first">Family-first (Smith, John)</option>
				<option value="given-first">Given-first (John Smith)</option>
			</select>
		</div>

		<div>
			<label for="ce-and-connector" class="block text-sm font-medium text-text-main mb-2">And Connector</label>
			<select
				id="ce-and-connector"
				value={andConnector}
				onchange={(e) => updateContributor("and", e.currentTarget.value === "text" ? "text" : "symbol")}
				class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
			>
				<option value="symbol">Symbol (&)</option>
				<option value="text">Word (and)</option>
			</select>
		</div>

		<div>
			<label for="ce-initials" class="block text-sm font-medium text-text-main mb-2">Initials</label>
			<select
				id="ce-initials"
				value={initials}
				onchange={(e) => {
					const val = e.currentTarget.value;
					const initVal = val === "abbreviated" ? ". " : val === "compact" ? "" : undefined;
					if (initVal !== undefined) updateContributor("initialize-with", initVal);
				}}
				class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
			>
				<option value="abbreviated">Abbreviated (J. A.)</option>
				<option value="compact">Compact (JA)</option>
				<option value="full">Full names</option>
			</select>
		</div>

		<div>
			<label for="ce-etal-range" class="block text-sm font-medium text-text-main mb-2">
				Et al. after <span class="text-primary font-semibold">{etAlAfter}</span> authors
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