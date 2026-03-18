<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import StyleNavigator from "$lib/components/wizard/StyleNavigator.svelte";

	onMount(() => {
		if (!wizardStore.family) {
			goto("/create/family", { replaceState: true });
			return;
		}
		wizardStore.setStep(3);
	});
</script>

<StyleNavigator />
