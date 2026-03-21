<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { wizardStore } from "$lib/stores/wizard.svelte";

	onMount(() => {
		if (!wizardStore.styleYaml) {
			goto("/create/field", { replaceState: true });
			return;
		}
		wizardStore.setPhase("visual-customizer");
		goto("/create/customize", { replaceState: true });
	});
</script>

<div class="flex items-center justify-center py-20">
	<div class="animate-pulse text-sm text-text-secondary">Redirecting to the visual customizer…</div>
</div>
