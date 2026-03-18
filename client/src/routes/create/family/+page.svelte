<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import FamilySelector from "$lib/components/wizard/FamilySelector.svelte";

	onMount(() => {
		if (!wizardStore.field) {
			goto("/create/field", { replaceState: true });
			return;
		}
		wizardStore.setStep(2);
	});
</script>

<FamilySelector />
