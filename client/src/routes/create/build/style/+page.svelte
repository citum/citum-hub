<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import StyleNavigator from "$lib/components/wizard/StyleNavigator.svelte";

	onMount(() => {
		if (!wizardStore.family) {
			goto("/create/build/family", { replaceState: true });
			return;
		}
		wizardStore.setPhase("quick-start");
		wizardStore.setStep(3);
		wizardStore.setRouteStep("style");
	});
</script>

<StyleNavigator />
