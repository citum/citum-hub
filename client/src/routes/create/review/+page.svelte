<script lang="ts">
	import { onMount } from "svelte";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import ReviewScreen from "$lib/components/wizard/ReviewScreen.svelte";

	onMount(() => {
		wizardStore.setStep(7); // Review is step 7 in the v2 spec
	});
</script>

<ReviewScreen />
