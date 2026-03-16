<script lang="ts">
import { onMount } from "svelte";
import { wizardStore } from "$lib/stores/wizard.svelte";
import FieldSelector from "$lib/components/wizard/FieldSelector.svelte";

onMount(() => {
	wizardStore.setStep(1);
});
</script>

<FieldSelector />
