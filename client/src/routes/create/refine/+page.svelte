<script lang="ts">
	import { onMount } from "svelte";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import RefinementPanel from "$lib/components/wizard/RefinementPanel.svelte";
	import { goto } from "$app/navigation";

	onMount(() => {
		if (!wizardStore.styleYaml) {
			goto("/create/field", { replaceState: true });
			return;
		}
		wizardStore.setStep(4);
	});
</script>

<RefinementPanel />
