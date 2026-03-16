<script lang="ts">
import { onMount } from "svelte";
import { wizardStore } from "$lib/stores/wizard.svelte";
import WizardHeader from "$lib/components/wizard/WizardHeader.svelte";

let { children } = $props();

onMount(() => {
	wizardStore.restore();
});
</script>

<div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
	<WizardHeader />
	<div class="mt-6">
		{@render children()}
	</div>
</div>
