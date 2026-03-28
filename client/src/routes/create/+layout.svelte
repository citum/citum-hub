<script lang="ts">
	import { onMount } from "svelte";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import WizardHeader from "$lib/components/wizard/WizardHeader.svelte";
	import CreateFlowHeader from "$lib/components/create/CreateFlowHeader.svelte";
	import { page } from "$app/stores";

	let { children } = $props();
	const showCreateHeader = $derived(
		$page.url.pathname === "/create" ||
			$page.url.pathname === "/create/find" ||
			$page.url.pathname === "/create/tweak" ||
			$page.url.pathname === "/create/build"
	);
	const showWizardHeader = $derived(
		$page.url.pathname.startsWith("/create/build/") &&
			!$page.url.pathname.startsWith("/create/build/refine") &&
			!$page.url.pathname.startsWith("/create/build/customize")
	);

	onMount(() => {
		wizardStore.restore();
	});
</script>

<div class="w-full flex flex-col h-full bg-slate-50 dark:bg-slate-950">
	{#if showCreateHeader}
		<CreateFlowHeader />
	{/if}
	{#if showWizardHeader}
		<WizardHeader />
	{/if}
	<div class="flex-1 w-full h-full">
		{@render children()}
	</div>
</div>
