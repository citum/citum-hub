<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";

	onMount(() => {
		goto("/create/build/preset", { replaceState: true });
	});
</script>

<div class="flex items-center justify-center py-20">
	<p class="text-sm text-slate-500">Redirecting to the Build flow...</p>
</div>
