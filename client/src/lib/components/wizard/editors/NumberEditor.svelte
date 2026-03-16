<script lang="ts">
	import { wizardStore } from "$lib/stores/wizard.svelte";

	const componentType = $derived(wizardStore.selectedComponent?.componentType ?? "number");
</script>

<div class="space-y-4 p-6">
	<div class="space-y-3">
		<h3 class="font-semibold text-text-main">Number Formatting</h3>
		<p class="text-sm text-text-secondary">
			Component-level editing for <span class="font-medium">{componentType}</span> is coming in a future
			update. For now, use global options to customize all numbers.
		</p>
	</div>

	<div class="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
		<p>
			<span class="font-semibold">Tip:</span> Edit the Contributors, Dates, or Titles sections to adjust
			global formatting that applies to all similar components.
		</p>
	</div>
</div>
