<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";

	onMount(() => {
		goto("/create", { replaceState: true });
	});
</script>

<div class="flex items-center justify-center py-20">
	<p class="text-text-secondary text-sm">Redirecting to the new Style Builder...</p>
</div>
