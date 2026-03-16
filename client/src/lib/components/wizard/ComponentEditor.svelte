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

let editScope = $state<"all" | "local">("all");

const activeTypeLabel = $derived(
	wizardStore.activeRefType.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
);

function getTemplatePath(): string {
	if (editScope === "all") return "bibliography.template";
	return `bibliography.type-templates.${wizardStore.activeRefType}.template`;
}

function moveLeft() {
	const sel = wizardStore.selectedComponent;
	if (!sel || sel.index === null || sel.index === 0) return;
	const path = getTemplatePath();
	
	// If local, ensure type template exists
	if (editScope === "local") {
		const obj = wizardStore.parseStyle();
		const bibliography = obj?.bibliography as any;
		if (!bibliography?.["type-templates"]?.[wizardStore.activeRefType]) {
			// Create local template from base
			const newTemplate = JSON.parse(JSON.stringify(bibliography.template));
			wizardStore.updateStyleField(`bibliography.type-templates.${wizardStore.activeRefType}`, { template: newTemplate });
		}
	}

	wizardStore.moveComponent(path, sel.index, sel.index - 1);
	
	// Update selection index to follow the move
	wizardStore.setSelectedComponent({
		...sel,
		index: sel.index - 1
	});
	wizardStore.fetchPreview();
}

function moveRight() {
	const sel = wizardStore.selectedComponent;
	if (!sel || sel.index === null) return;
	const path = getTemplatePath();
	
	const obj = wizardStore.parseStyle();
	const bibliography = obj?.bibliography as any;

	// If local, ensure type template exists
	if (editScope === "local" && !bibliography?.["type-templates"]?.[wizardStore.activeRefType]) {
		const newTemplate = JSON.parse(JSON.stringify(bibliography.template));
		wizardStore.updateStyleField(`bibliography.type-templates.${wizardStore.activeRefType}`, { template: newTemplate });
	}

	// Need to check array length to bound moveRight
	const template = editScope === "all" 
		? bibliography?.template 
		: bibliography?.["type-templates"]?.[wizardStore.activeRefType]?.template;

	if (Array.isArray(template) && sel.index >= template.length - 1) return;

	wizardStore.moveComponent(path, sel.index, sel.index + 1);
	
	// Update selection index to follow the move
	wizardStore.setSelectedComponent({
		...sel,
		index: sel.index + 1
	});
	wizardStore.fetchPreview();
}

function deleteComponent() {
	const sel = wizardStore.selectedComponent;
	if (!sel || sel.index === null) return;
	if (confirm(`Are you sure you want to remove ${sel.componentType}?`)) {
		const path = getTemplatePath();
		wizardStore.deleteComponent(path, sel.index);
		wizardStore.setSelectedComponent(null);
		wizardStore.fetchPreview();
	}
}
</script>

<div class="rounded-lg border border-border-light bg-surface-light">
	{#if !wizardStore.selectedComponent}
		<div class="text-center py-12 text-text-secondary">
			<span class="material-symbols-outlined text-4xl mb-2 inline-block">touch_app</span>
			<p class="text-sm mt-2">Click any element in the preview to edit it</p>
		</div>
	{:else}
		<!-- Component Toolbar -->
		<div class="flex items-center justify-between border-b border-border-light p-2 bg-background-light/50">
			<!-- Reorder Controls -->
			<div class="flex items-center gap-1">
				<button
					onclick={moveLeft}
					title="Move earlier"
					class="p-1.5 rounded hover:bg-surface-light text-text-main transition-colors"
				>
					<span class="material-symbols-outlined text-xl">arrow_back</span>
				</button>
				<button
					onclick={moveRight}
					title="Move later"
					class="p-1.5 rounded hover:bg-surface-light text-text-main transition-colors"
				>
					<span class="material-symbols-outlined text-xl">arrow_forward</span>
				</button>
			</div>

			<!-- Scope Toggle in Toolbar -->
			<div class="flex items-center gap-1 bg-surface-light p-1 rounded-md border border-border-light">
				<button
					onclick={() => (editScope = "all")}
					class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all {editScope === 'all'
						? 'bg-primary text-white'
						: 'text-text-secondary hover:text-text-main'}"
				>
					Global
				</button>
				<button
					onclick={() => (editScope = "local")}
					class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all {editScope === 'local'
						? 'bg-primary text-white'
						: 'text-text-secondary hover:text-text-main'}"
				>
					{activeTypeLabel}
				</button>
			</div>
			
			<button
				onclick={deleteComponent}
				title="Remove component"
				class="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
			>
				<span class="material-symbols-outlined text-xl">delete</span>
			</button>
		</div>

		{#if contributorTypes.includes(wizardStore.selectedComponent.componentType)}
			<ContributorEditor {editScope} />
		{:else if titleTypes.includes(wizardStore.selectedComponent.componentType)}
			<TitleEditor {editScope} />
		{:else if dateTypes.includes(wizardStore.selectedComponent.componentType)}
			<DateEditor {editScope} />
		{:else if numberTypes.includes(wizardStore.selectedComponent.componentType)}
			<NumberEditor {editScope} />
		{:else if variableTypes.includes(wizardStore.selectedComponent.componentType)}
			<VariableEditor {editScope} />
		{:else}
			<div class="p-6 text-text-secondary text-sm">
				<p>
					Editor for <span class="font-medium">{wizardStore.selectedComponent.componentType}</span> coming
					soon
				</p>
			</div>
		{/if}
	{/if}
</div>

<style>
	:global(.csln-interactive) {
		cursor: pointer;
	}
</style>
