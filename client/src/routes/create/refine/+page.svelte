<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import RefinementPanel from "$lib/components/wizard/RefinementPanel.svelte";

	onMount(() => {
		if (!wizardStore.styleYaml) {
			goto("/create/field", { replaceState: true });
			return;
		}
		wizardStore.setStep(5);
	});
</script>

<RefinementPanel />
