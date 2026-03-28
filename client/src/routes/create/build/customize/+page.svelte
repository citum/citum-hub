<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import VisualCustomizer from "$lib/components/wizard/VisualCustomizer.svelte";

	onMount(() => {
		if (!wizardStore.styleYaml) {
			goto("/create/build/field", { replaceState: true });
			return;
		}
		wizardStore.setPhase("visual-customizer");
	});
</script>

<VisualCustomizer />
