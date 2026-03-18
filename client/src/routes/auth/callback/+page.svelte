<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { auth } from "$lib/stores/auth";

	onMount(() => {
		const token = page.url.searchParams.get("token");
		if (token) {
			auth.login(token);
		}
		goto("/");
	});
</script>

<div class="flex items-center justify-center min-h-screen">
	<p class="text-lg">Completing login...</p>
</div>
