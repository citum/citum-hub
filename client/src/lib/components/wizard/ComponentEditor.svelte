<script lang="ts">
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import ContributorEditor from "./editors/ContributorEditor.svelte";
	import TitleEditor from "./editors/TitleEditor.svelte";
	import DateEditor from "./editors/DateEditor.svelte";
	import NumberEditor from "./editors/NumberEditor.svelte";
	import VariableEditor from "./editors/VariableEditor.svelte";

	const contributorTypes = ["author", "editor", "translator"];
	const titleTypes = ["title", "container-title"];
	const dateTypes = ["issued", "accessed"];
	const numberTypes = ["volume", "issue", "pages", "edition", "citation-number"];
	const variableTypes = ["doi", "url", "isbn", "publisher"];
</script>

<div class="rounded-lg border border-border-light bg-surface-light">
	{#if !wizardStore.selectedComponent}
		<div class="text-center py-12 text-text-secondary">
			<span class="material-symbols-outlined text-4xl mb-2 inline-block">touch_app</span>
			<p class="text-sm mt-2">Click any element in the preview to edit it</p>
		</div>
	{:else if contributorTypes.includes(wizardStore.selectedComponent.componentType)}
		<ContributorEditor />
	{:else if titleTypes.includes(wizardStore.selectedComponent.componentType)}
		<TitleEditor />
	{:else if dateTypes.includes(wizardStore.selectedComponent.componentType)}
		<DateEditor />
	{:else if numberTypes.includes(wizardStore.selectedComponent.componentType)}
		<NumberEditor />
	{:else if variableTypes.includes(wizardStore.selectedComponent.componentType)}
		<VariableEditor />
	{:else}
		<div class="p-6 text-text-secondary text-sm">
			<p>
				Editor for <span class="font-medium">{wizardStore.selectedComponent.componentType}</span> coming
				soon
			</p>
		</div>
	{/if}
</div>

<style>
	:global(.csln-interactive) {
		cursor: pointer;
	}
</style>
