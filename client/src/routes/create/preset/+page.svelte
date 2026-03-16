<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import PresetGallery from "$lib/components/wizard/PresetGallery.svelte";

	onMount(() => {
		if (!wizardStore.family) {
			goto("/create/field", { replaceState: true });
			return;
		}
		wizardStore.setStep(3);
	});
</script>

<PresetGallery />
