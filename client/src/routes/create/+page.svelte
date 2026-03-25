<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { wizardStore } from "$lib/stores/wizard.svelte";

	onMount(() => {
		// Resume where the user left off, or start fresh
		if (wizardStore.step === 5) {
			goto("/create/review", { replaceState: true });
		} else if (wizardStore.step === 4) {
			goto("/create/refine", { replaceState: true });
		} else if (wizardStore.step === 3) {
			goto("/create/style", { replaceState: true });
		} else if (wizardStore.step === 2) {
			goto("/create/family", { replaceState: true });
		} else {
			goto("/create/field", { replaceState: true });
		}
	});
</script>

<div class="flex items-center justify-center py-20">
	<div class="animate-pulse text-text-secondary text-sm">Loading wizard...</div>
</div>
