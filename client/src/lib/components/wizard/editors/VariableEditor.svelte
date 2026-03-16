<script lang="ts">
	import { wizardStore } from "$lib/stores/wizard.svelte";

	const componentType = $derived(wizardStore.selectedComponent?.componentType ?? "variable");
</script>

<div class="space-y-4 p-6">
	<div class="space-y-3">
		<h3 class="font-semibold text-text-main">Field Formatting</h3>
		<p class="text-sm text-text-secondary">
			Component-level editing for <span class="font-medium">{componentType}</span> is coming in a future
			update. For now, global options are available for common fields.
		</p>
	</div>

	<div class="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
		<p>
			<span class="font-semibold">Tip:</span> Advanced field customization like suppression and prefixes
			will be available in the Advanced editor.
		</p>
	</div>
</div>
