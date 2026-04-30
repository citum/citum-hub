<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import FamilySelector from "$lib/components/wizard/FamilySelector.svelte";

	onMount(() => {
		if (!wizardStore.field) {
			goto("/create/build/field", { replaceState: true });
			return;
		}
		wizardStore.setPhase("quick-start");
		wizardStore.setStep(2);
		wizardStore.setRouteStep("family");
	});
</script>

<FamilySelector />
