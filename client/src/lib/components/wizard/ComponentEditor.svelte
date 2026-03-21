<script lang="ts">
	/* eslint-disable @typescript-eslint/no-explicit-any */
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import ContributorEditor from "./editors/ContributorEditor.svelte";
	import TitleEditor from "./editors/TitleEditor.svelte";
	import DateEditor from "./editors/DateEditor.svelte";
	import NumberEditor from "./editors/NumberEditor.svelte";
	import VariableEditor from "./editors/VariableEditor.svelte";
	import {
		getAstIndexFromTemplatePath,
		getComponentLabel,
		getComponentType,
		getValueAtPath,
	} from "$lib/utils/wizard-template";

	const contributorTypes = ["author", "editor", "translator"];
	const titleTypes = ["title", "container-title"];
	const dateTypes = ["issued", "accessed"];
	const numberTypes = ["volume", "issue", "pages", "edition", "citation-number", "report-number"];
	const variableTypes = ["doi", "url", "isbn", "publisher", "publisher-place"];

	let editScope = $state<"all" | "local">("all");
	let draggedPath = $state<string | null>(null);
	let insertKind = $state<"field" | "term" | "group">("field");
	let insertValue = $state("doi");
	let groupDelimiter = $state("comma");
	let lastSelectionPath: string | null = null;
	let structureRootRef: HTMLDivElement | undefined = $state();

	$effect(() => {
		const selectionPath = wizardStore.selectedComponent?.templatePath ?? null;
		if (selectionPath && selectionPath !== lastSelectionPath) {
			editScope = wizardStore.selectedComponent?.scope ?? "all";
			lastSelectionPath = selectionPath;
		}
		if (!selectionPath) {
			lastSelectionPath = null;
		}
	});

	$effect(() => {
		const selectionPath = wizardStore.selectedComponent?.templatePath;
		if (!selectionPath || !structureRootRef) return;

		const target = structureRootRef.querySelector<HTMLElement>(
			`[data-template-path="${selectionPath}"]`
		);
		target?.scrollIntoView({ block: "nearest" });
	});

	const activeTypeLabel = $derived(
		wizardStore.activeRefType.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
	);

	function getDisplayedTemplateRoot() {
		return (
			wizardStore.getResolvedTemplateRoot() ?? {
				path: "bibliography.template",
				scope: "all" as const,
				template: [],
			}
		);
	}

	function getDisplayedTemplate(): any[] {
		return getDisplayedTemplateRoot().template;
	}

	function getParentArrayInfo(path: string): { arrayPath: string; index: number } | null {
		const parts = path.split(".");
		const index = Number.parseInt(parts.pop() ?? "", 10);
		if (Number.isNaN(index)) return null;
		return { arrayPath: parts.join("."), index };
	}

	function getScopedSelectionPath(ensureLocal = false): string | null {
		const selection = wizardStore.selectedComponent;
		if (!selection) return null;
		return wizardStore.getScopedTemplatePath(selection.templatePath, editScope, { ensureLocal });
	}

	function getScopedSelectionNode(): Record<string, unknown> | null {
		const path = getScopedSelectionPath();
		if (!path) return null;
		return wizardStore.getTemplateNode(path);
	}

	function getArrayAtPath(path: string): any[] {
		const obj = wizardStore.parseStyle();
		if (!obj) return [];
		const array = getValueAtPath(obj, path);
		return Array.isArray(array) ? array : [];
	}

	function activateComponent(component: Record<string, unknown>, path: string) {
		wizardStore.setSelectedComponent({
			componentType: getComponentType(component),
			cssClass: "",
			astIndex: getAstIndexFromTemplatePath(path),
			templatePath: path,
			scope: getDisplayedTemplateRoot().scope,
		});
	}

	function moveLeft() {
		const selectedPath = getScopedSelectionPath(editScope === "local");
		if (!selectedPath) return;

		const parent = getParentArrayInfo(selectedPath);
		if (!parent || parent.index === 0) return;

		wizardStore.moveComponent(parent.arrayPath, parent.index, parent.index - 1);
		wizardStore.setSelectedComponent({
			...wizardStore.selectedComponent!,
			templatePath: `${parent.arrayPath}.${parent.index - 1}`,
			astIndex: getAstIndexFromTemplatePath(`${parent.arrayPath}.${parent.index - 1}`),
			scope: editScope,
		});
		void wizardStore.fetchPreview();
	}

	function moveRight() {
		const selectedPath = getScopedSelectionPath(editScope === "local");
		if (!selectedPath) return;

		const parent = getParentArrayInfo(selectedPath);
		if (!parent) return;

		const array = getArrayAtPath(parent.arrayPath);
		if (parent.index >= array.length - 1) return;

		wizardStore.moveComponent(parent.arrayPath, parent.index, parent.index + 1);
		wizardStore.setSelectedComponent({
			...wizardStore.selectedComponent!,
			templatePath: `${parent.arrayPath}.${parent.index + 1}`,
			astIndex: getAstIndexFromTemplatePath(`${parent.arrayPath}.${parent.index + 1}`),
			scope: editScope,
		});
		void wizardStore.fetchPreview();
	}

	function deleteComponent() {
		const selectedPath = getScopedSelectionPath(editScope === "local");
		if (!selectedPath) return;

		const parent = getParentArrayInfo(selectedPath);
		if (!parent) return;

		wizardStore.deleteComponent(parent.arrayPath, parent.index);
		wizardStore.setSelectedComponent(null);
		void wizardStore.fetchPreview();
	}

	function toggleSuppress(path: string, currentValue: boolean | undefined) {
		wizardStore.updateStyleField(`${path}.suppress`, currentValue ? undefined : true);
		void wizardStore.fetchPreview();
	}

	function updateGroupDelimiter(value: string) {
		const selectedPath = getScopedSelectionPath(editScope === "local");
		if (!selectedPath) return;
		wizardStore.updateStyleField(`${selectedPath}.delimiter`, value || undefined);
		void wizardStore.fetchPreview();
	}

	function buildInsertedComponent(): Record<string, unknown> {
		if (insertKind === "group") {
			return { items: [] };
		}
		if (insertKind === "term") {
			return { term: insertValue || "retrieved" };
		}
		return { variable: insertValue || "doi" };
	}

	function insertComponent() {
		const component = buildInsertedComponent();
		const selectedPath = getScopedSelectionPath(editScope === "local");

		if (selectedPath) {
			const parent = getParentArrayInfo(selectedPath);
			if (!parent) return;
			wizardStore.updateStyleField(`${parent.arrayPath}.${parent.index + 1}`, component);
			wizardStore.setSelectedComponent({
				componentType: getComponentType(component),
				cssClass: "",
				astIndex: getAstIndexFromTemplatePath(`${parent.arrayPath}.${parent.index + 1}`),
				templatePath: `${parent.arrayPath}.${parent.index + 1}`,
				scope: editScope,
			});
		} else {
			const root = getDisplayedTemplateRoot();
			wizardStore.updateStyleField(`${root.path}.${root.template.length}`, component);
		}

		void wizardStore.fetchPreview();
	}

	function deleteComponentFromPath(path: string) {
		const parent = getParentArrayInfo(path);
		if (!parent) return;
		wizardStore.deleteComponent(parent.arrayPath, parent.index);
		if (wizardStore.selectedComponent?.templatePath === path) {
			wizardStore.setSelectedComponent(null);
		}
		void wizardStore.fetchPreview();
	}

	function updateSelectedRendering(path: string, value: unknown) {
		const selectedPath = getScopedSelectionPath(editScope === "local");
		if (!selectedPath) return;
		wizardStore.updateStyleField(`${selectedPath}.${path}`, value);
		void wizardStore.fetchPreview();
	}

	const selectedNode = $derived(getScopedSelectionNode());
	const selectedPrefix = $derived((selectedNode?.prefix as string) ?? "");
	const selectedSuffix = $derived((selectedNode?.suffix as string) ?? "");
	const selectedSuppress = $derived((selectedNode?.suppress as boolean) ?? false);
	const selectedEmph = $derived((selectedNode?.emph as boolean) ?? false);
	const selectedStrong = $derived((selectedNode?.strong as boolean) ?? false);
	const selectedDelimiter = $derived((selectedNode?.delimiter as string) ?? groupDelimiter);
</script>

{#snippet renderList(list: any[], parentPath: string, depth: number)}
	<div
		class="space-y-2 {depth > 0 ? 'mt-2 ml-4 border-l-2 border-border-light/50 pl-4' : ''}"
		ondragover={(event) => {
			event.preventDefault();
			event.stopPropagation();
			if (event.dataTransfer && draggedPath) {
				event.dataTransfer.dropEffect = "move";
			}
		}}
		ondrop={(event) => {
			event.preventDefault();
			event.stopPropagation();
			if (!draggedPath || draggedPath === parentPath) return;

			const draggedParent = getParentArrayInfo(draggedPath);
			if (!draggedParent) return;

			wizardStore.moveComponentCrossArray(
				draggedParent.arrayPath,
				draggedParent.index,
				parentPath,
				list.length
			);
			draggedPath = null;
			void wizardStore.fetchPreview();
		}}
		role="list"
		aria-label={depth === 0 ? "Template components" : "Grouped components"}
	>
		{#if list.length === 0}
			<div
				class="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-10 text-center transition-all hover:border-primary/30"
			>
				<div class="mb-4 flex size-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition-transform group-hover:scale-110">
					<span class="material-symbols-outlined text-2xl">add_circle</span>
				</div>
				<p class="text-sm font-semibold text-slate-700">Empty Group</p>
				<p class="mt-1 max-w-[200px] text-xs leading-relaxed text-slate-500 mx-auto">
					No components here yet. Add a field, term, or nested group below to start building.
				</p>
			</div>
		{/if}

		{#each list as component, index (index)}
			{@const currentPath = `${parentPath}.${index}`}
			{@const type = getComponentType(component)}
			{@const isSelected = wizardStore.selectedComponent?.templatePath === currentPath}
			<div
				data-template-path={currentPath}
				draggable="true"
				ondragstart={(event) => {
					draggedPath = currentPath;
					if (event.dataTransfer) {
						event.dataTransfer.effectAllowed = "move";
					}
					// Add a visual class for the item being dragged
					(event.currentTarget as HTMLElement).classList.add('opacity-40');
					event.stopPropagation();
				}}
				ondragend={(event) => {
					draggedPath = null;
					(event.currentTarget as HTMLElement).classList.remove('opacity-40');
				}}
				ondragover={(event) => {
					event.preventDefault();
					event.stopPropagation();
				}}
				ondrop={(event) => {
					event.preventDefault();
					event.stopPropagation();
					if (!draggedPath || draggedPath === currentPath) return;

					const draggedParent = getParentArrayInfo(draggedPath);
					if (!draggedParent) return;

					wizardStore.moveComponentCrossArray(
						draggedParent.arrayPath,
						draggedParent.index,
						parentPath,
						index
					);
					draggedPath = null;
					void wizardStore.fetchPreview();
				}}
				role="listitem"
				class="group relative flex flex-col rounded-xl border transition-all {isSelected
					? 'border-primary bg-blue-50/20 ring-1 ring-primary/10 shadow-sm'
					: 'border-slate-200 bg-white hover:border-primary/20 hover:shadow-md'}"
				style="margin-left: {depth > 0 ? '2rem' : '0'}"
			>
				<!-- Connecting lines for depth -->
				{#if depth > 0}
					<div
						class="absolute -left-5 top-0 bottom-0 w-5 border-l-2 border-slate-200/50 group-hover:border-primary/20"
					></div>
					<div
						class="absolute -left-5 top-6 w-5 border-t-2 border-slate-200/50 group-hover:border-primary/20 rounded-tl-lg"
					></div>
				{/if}

				<div class="flex items-center gap-3 px-3 py-2.5">
					<span
						class="material-symbols-outlined cursor-grab text-slate-300 transition-colors group-hover:text-slate-400 active:cursor-grabbing"
					>
						drag_indicator
					</span>

					<div
						class="flex size-9 items-center justify-center rounded-lg shadow-sm transition-all {isSelected
							? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30 ring-2 ring-white'
							: type === 'contributor' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
							: type === 'date' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
							: type === 'title' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
							: type === 'number' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
							: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}"
					>
						<span class="material-symbols-outlined text-xl">
							{#if type === "field"}
								description
							{:else if type === "term"}
								translate
							{:else if type === "group"}
								folder_open
							{:else if type === "date"}
								event
							{:else if type === "contributor"}
								group
							{:else if type === "title"}
								title
							{:else if type === "number"}
								format_list_numbered
							{:else}
								extension
							{/if}
						</span>
					</div>

					<button
						type="button"
						class="min-w-0 flex-1 text-left"
						onclick={() => activateComponent(component, currentPath)}
					>
						<span
							class="block truncate text-sm font-semibold transition-colors {isSelected
								? 'text-primary'
								: 'text-slate-700 group-hover:text-slate-900'}"
						>
							{getComponentLabel(component)}
						</span>
						<span class="block text-[10px] uppercase tracking-wider text-slate-400">
							{type}
						</span>
					</button>

					<div class="flex items-center gap-1">
						<button
							type="button"
							class="rounded p-1 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 {component.suppress
								? 'text-red-400'
								: ''}"
							title={component.suppress ? "Show element" : "Hide element"}
							onclick={(event) => {
								event.stopPropagation();
								toggleSuppress(currentPath, component.suppress);
							}}
						>
							<span class="material-symbols-outlined text-lg">
								{component.suppress ? "visibility_off" : "visibility"}
							</span>
						</button>
						<button
							type="button"
							class="rounded p-1 text-slate-300 transition-all hover:bg-red-50 hover:text-red-500"
							title="Delete"
							onclick={(event) => {
								event.stopPropagation();
								deleteComponentFromPath(currentPath);
							}}
						>
							<span class="material-symbols-outlined text-lg">delete</span>
						</button>
					</div>
				</div>

				{#if Array.isArray(component.items)}
					<div class="px-1 pb-2">
						{@render renderList(component.items, `${currentPath}.items`, depth + 1)}
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/snippet}

<div class="rounded-lg border border-border-light bg-surface-light">
	{#if !wizardStore.selectedComponent}
		<div class="border-b border-border-light bg-background-light p-4 sm:p-6">
			<div class="mb-4 flex items-center justify-between gap-3">
				<h3 class="flex items-center gap-2 text-sm font-semibold text-text-main">
					<span>Component Array</span>
					<span
						class="hidden rounded border border-border-light bg-surface-light px-2 py-0.5 text-xs font-normal text-text-secondary sm:inline-block"
					>
						{getDisplayedTemplateRoot().path}
					</span>
				</h3>
				<span
					class="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary"
				>
					{getDisplayedTemplateRoot().scope === "local"
						? `${activeTypeLabel} override`
						: "All types"}
				</span>
			</div>

			<div class="mb-6 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
				<h4 class="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
					<span class="material-symbols-outlined text-sm">info</span>
					Structure Guide
				</h4>
				<p class="text-xs leading-relaxed text-slate-600">
					This tree represents the order and nesting of your citation elements.
					<strong class="text-slate-900">Drag</strong> to reorder, <strong class="text-slate-900"
						>click</strong
					> to customize fields, or use the <strong class="text-slate-900">Hide</strong> icon to skip variables.
				</p>
			</div>

			<div
				bind:this={structureRootRef}
				class="rounded-lg border border-border-light bg-white p-2 min-h-[100px] shadow-inner"
			>
				{@render renderList(getDisplayedTemplate(), getDisplayedTemplateRoot().path, 0)}
			</div>

			<div class="mt-4 rounded-lg border border-dashed border-border-light bg-white p-3">
				<div class="flex flex-wrap gap-3 sm:grid sm:grid-cols-[1fr_1fr_auto]">
					<select
						bind:value={insertKind}
						class="min-w-[120px] flex-1 rounded border border-border-light bg-surface-light px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
					>
						<option value="field">Field</option>
						<option value="term">Localized term</option>
						<option value="group">Group</option>
					</select>
					<input
						type="text"
						bind:value={insertValue}
						disabled={insertKind === "group"}
						placeholder={insertKind === "term" ? "retrieved" : "doi"}
						class="min-w-[120px] flex-1 rounded border border-border-light bg-surface-light px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
					/>
					<button
						type="button"
						onclick={insertComponent}
						class="w-full rounded bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:opacity-90 active:scale-[0.98] sm:w-auto"
					>
						Append
					</button>
				</div>
				<p class="mt-2 text-[10px] text-text-secondary">
					Select a type and enter a variable name (like 'doi', 'url', or 'publisher') then click Append.
				</p>
			</div>
		</div>
	{:else}
		<div class="border-b border-border-light bg-background-light/50 p-2">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div class="flex items-center gap-1">
					<button
						type="button"
						onclick={moveLeft}
						title="Move earlier"
						class="rounded p-1.5 text-text-main transition-colors hover:bg-surface-light"
					>
						<span class="material-symbols-outlined text-xl">arrow_back</span>
					</button>
					<button
						type="button"
						onclick={moveRight}
						title="Move later"
						class="rounded p-1.5 text-text-main transition-colors hover:bg-surface-light"
					>
						<span class="material-symbols-outlined text-xl">arrow_forward</span>
					</button>
				</div>

				<div
					class="flex items-center gap-1 rounded-md border border-border-light bg-surface-light p-1"
				>
					<button
						type="button"
						onclick={() => (editScope = "all")}
						class="rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-all {editScope ===
						'all'
							? 'bg-primary text-white'
							: 'text-text-secondary hover:text-text-main'}"
					>
						All types
					</button>
					<button
						type="button"
						onclick={() => (editScope = "local")}
						class="rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-all {editScope ===
						'local'
							? 'bg-primary text-white'
							: 'text-text-secondary hover:text-text-main'}"
					>
						{activeTypeLabel}
					</button>
				</div>

				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={() =>
							toggleSuppress(getScopedSelectionPath(editScope === "local") ?? "", selectedSuppress)}
						class="rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 transition-colors hover:bg-slate-100"
					>
						{selectedSuppress ? "Show" : "Hide"}
					</button>
					<button
						type="button"
						onclick={deleteComponent}
						title="Remove component"
						class="rounded p-1.5 text-red-500 transition-colors hover:bg-red-50"
					>
						<span class="material-symbols-outlined text-xl">delete</span>
					</button>
				</div>
			</div>
		</div>

		<div class="border-b border-border-light bg-white px-6 py-4">
			<p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Editing</p>
			<p class="mt-1 text-sm font-medium text-text-main">{getComponentLabel(selectedNode)}</p>
			<p class="mt-1 text-xs text-text-secondary">
				{editScope === "local" ? `Only for ${activeTypeLabel}` : "Applies to all reference types"}
			</p>
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
		{:else if wizardStore.selectedComponent.componentType === "group"}
			<div class="space-y-4 p-6 pt-4">
				<h3 class="font-semibold text-text-main">Group Formatting</h3>
				<div>
					<label for="group-delimiter" class="mb-2 block text-sm font-medium text-text-main">
						Delimiter
					</label>
					<select
						id="group-delimiter"
						value={selectedDelimiter}
						onchange={(event) => updateGroupDelimiter(event.currentTarget.value)}
						class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
					>
						<option value="comma">Comma</option>
						<option value="space">Space</option>
						<option value="period">Period</option>
						<option value="semicolon">Semicolon</option>
						<option value="none">None</option>
					</select>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<label for="group-prefix" class="mb-2 block text-sm font-medium text-text-main">
							Prefix
						</label>
						<input
							id="group-prefix"
							type="text"
							value={selectedPrefix}
							oninput={(event) =>
								updateSelectedRendering("prefix", event.currentTarget.value || undefined)}
							class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
						/>
					</div>
					<div>
						<label for="group-suffix" class="mb-2 block text-sm font-medium text-text-main">
							Suffix
						</label>
						<input
							id="group-suffix"
							type="text"
							value={selectedSuffix}
							oninput={(event) =>
								updateSelectedRendering("suffix", event.currentTarget.value || undefined)}
							class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
						/>
					</div>
				</div>

				<div class="rounded-lg border border-dashed border-border-light bg-background-light/40 p-3">
					<div class="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
						<select
							bind:value={insertKind}
							class="rounded border border-border-light bg-surface-light px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
						>
							<option value="field">Field</option>
							<option value="term">Localized term</option>
							<option value="group">Nested group</option>
						</select>
						<input
							type="text"
							bind:value={insertValue}
							disabled={insertKind === "group"}
							placeholder={insertKind === "term" ? "retrieved" : "doi"}
							class="rounded border border-border-light bg-surface-light px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
						/>
						<button
							type="button"
							onclick={insertComponent}
							class="rounded bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
						>
							Insert After
						</button>
					</div>
				</div>
			</div>
		{:else if wizardStore.selectedComponent.componentType === "term"}
			<div class="space-y-4 p-6 pt-4">
				<h3 class="font-semibold text-text-main">Localized Term</h3>
				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<label for="term-prefix" class="mb-2 block text-sm font-medium text-text-main">
							Prefix
						</label>
						<input
							id="term-prefix"
							type="text"
							value={selectedPrefix}
							oninput={(event) =>
								updateSelectedRendering("prefix", event.currentTarget.value || undefined)}
							class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
						/>
					</div>
					<div>
						<label for="term-suffix" class="mb-2 block text-sm font-medium text-text-main">
							Suffix
						</label>
						<input
							id="term-suffix"
							type="text"
							value={selectedSuffix}
							oninput={(event) =>
								updateSelectedRendering("suffix", event.currentTarget.value || undefined)}
							class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
						/>
					</div>
				</div>

				<div>
					<span class="mb-2 block text-sm font-medium text-text-main">Style</span>
					<div class="flex gap-4">
						<label for="term-emph" class="flex items-center gap-2 cursor-pointer">
							<input
								id="term-emph"
								type="checkbox"
								checked={selectedEmph}
								onchange={(event) =>
									updateSelectedRendering("emph", event.currentTarget.checked || undefined)}
								class="h-4 w-4 rounded border-border-light text-primary focus:ring-primary"
							/>
							<span class="text-sm text-text-main">Italic</span>
						</label>
						<label for="term-strong" class="flex items-center gap-2 cursor-pointer">
							<input
								id="term-strong"
								type="checkbox"
								checked={selectedStrong}
								onchange={(event) =>
									updateSelectedRendering("strong", event.currentTarget.checked || undefined)}
								class="h-4 w-4 rounded border-border-light text-primary focus:ring-primary"
							/>
							<span class="text-sm text-text-main">Bold</span>
						</label>
					</div>
				</div>
			</div>
		{:else}
			<div class="p-6 text-sm text-text-secondary">
				<p>
					Editor for <span class="font-medium">{wizardStore.selectedComponent.componentType}</span>
					is not available yet. You can still move, hide, delete, or adjust delimiters from the component
					array.
				</p>
			</div>
		{/if}
	{/if}
</div>
