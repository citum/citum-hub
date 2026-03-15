<script lang="ts">
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import { FIELD_OPTIONS, FAMILY_OPTIONS } from "$lib/types/wizard";

	function handleBack() {
		window.history.back();
	}

	const fieldLabel = $derived(
		wizardStore.field ? FIELD_OPTIONS.find((f) => f.id === wizardStore.field)?.label : null
	);

	const familyLabel = $derived(
		wizardStore.family ? FAMILY_OPTIONS.find((f) => f.id === wizardStore.family)?.label : null
	);

	const showProgress = $derived(wizardStore.phase === "quick-start");
	const progressPercent = $derived((wizardStore.step / 7) * 100);
</script>

<header class="border-b border-border-light bg-surface-light px-4 py-4 sm:px-6">
	<div class="flex items-center justify-between gap-2 sm:gap-4">
		<button
			onclick={handleBack}
			class="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-background-light transition-colors duration-300"
			aria-label="Go back"
		>
			<span class="material-symbols-outlined text-text-main">arrow_back</span>
		</button>

		<nav class="flex-1 overflow-hidden">
			<ol class="flex items-center gap-2 text-sm">
				{#if fieldLabel}
					<li class="truncate text-text-secondary">
						{fieldLabel}
					</li>
					<li class="text-text-secondary">/</li>
				{/if}

				{#if familyLabel}
					<li class="truncate text-text-secondary">
						{familyLabel}
					</li>
					<li class="text-text-secondary">/</li>
				{/if}

				{#if wizardStore.presetId}
					<li class="truncate font-medium text-text-main">
						{wizardStore.presetId}
					</li>
				{/if}
			</ol>
		</nav>

		<div class="hidden sm:block text-sm text-text-secondary">
			{#if showProgress}
				Step {wizardStore.step}/7
			{/if}
		</div>
	</div>

	{#if showProgress}
		<div class="mt-4 h-1 w-full overflow-hidden rounded-full bg-background-light">
			<div
				class="h-full bg-primary transition-all duration-300"
				style="width: {progressPercent}%"
			></div>
		</div>
	{/if}
</header>
