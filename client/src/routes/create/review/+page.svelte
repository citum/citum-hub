<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import ReviewScreen from "$lib/components/wizard/ReviewScreen.svelte";

	onMount(() => {
		if (!wizardStore.styleYaml) {
			goto("/create/field", { replaceState: true });
			return;
		}
		wizardStore.setPhase("quick-start");
		wizardStore.setStep(5);
	});
</script>

<ReviewScreen />
