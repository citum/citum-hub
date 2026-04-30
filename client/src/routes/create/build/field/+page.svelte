<script lang="ts">
	import { onMount } from "svelte";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import FieldSelector from "$lib/components/wizard/FieldSelector.svelte";

	onMount(() => {
		wizardStore.setPhase("quick-start");
		wizardStore.setStep(1);
		wizardStore.setRouteStep("field");
	});
</script>

<FieldSelector />
