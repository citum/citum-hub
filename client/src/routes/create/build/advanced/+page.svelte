<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import AdvancedEditor from "$lib/components/wizard/AdvancedEditor.svelte";

	onMount(() => {
		if (!wizardStore.styleYaml && !wizardStore.family) {
			goto("/create/build/field", { replaceState: true });
			return;
		}
		wizardStore.setPhase("advanced");
		wizardStore.setRouteStep("advanced");
	});
</script>

<AdvancedEditor />
