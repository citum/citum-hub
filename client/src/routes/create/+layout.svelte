<script lang="ts">
	import { onMount } from "svelte";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import WizardHeader from "$lib/components/wizard/WizardHeader.svelte";
	import { page } from "$app/stores";

	let { children } = $props();

	onMount(() => {
		wizardStore.restore();
	});
</script>

<div class="w-full flex flex-col h-full bg-slate-50 dark:bg-slate-950">
	{#if !$page.url.pathname.includes("/create/refine") && !$page.url.pathname.includes("/create/customize")}
		<WizardHeader />
	{/if}
	<div class="flex-1 w-full h-full">
		{@render children()}
	</div>
</div>
