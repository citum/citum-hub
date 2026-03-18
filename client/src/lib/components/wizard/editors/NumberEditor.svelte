<script lang="ts">
	/* eslint-disable @typescript-eslint/no-explicit-any */
	import { wizardStore } from "$lib/stores/wizard.svelte";

	let { editScope = "all" } = $props<{ editScope?: "all" | "local" }>();
	let debounceTimer: number | undefined;

	function debouncedFetchPreview() {
		clearTimeout(debounceTimer);
		debounceTimer = window.setTimeout(() => {
			wizardStore.fetchPreview();
		}, 300);
	}

	const componentType = $derived(wizardStore.selectedComponent?.componentType ?? "number");

	function getNumberConfig(): Record<string, unknown> {
		const obj = wizardStore.parseStyle();
		if (!obj) return {};

		const type = wizardStore.activeRefType;
		const field = componentType;

		if (editScope === "local") {
			const bibliography = obj.bibliography as any;
			const template = bibliography?.["type-templates"]?.[type]?.template;
			if (Array.isArray(template)) {
				const component = template.find(
					(c: any) => c.number === field || (c.variable === field && c.component === "number")
				);
				if (component) return component;
			}
		}

		const bibliography = (obj as any).bibliography;
		const template = bibliography?.template;
		if (Array.isArray(template)) {
			const component = template.find(
				(c: any) => c.number === field || (c.variable === field && c.component === "number")
			);
			if (component) return component;
		}

		return {};
	}

	function updateNumberProperty(path: string, value: unknown) {
		const obj = wizardStore.parseStyle();
		if (!obj) return;

		const field = componentType;

		if (editScope === "all") {
			const bibliography = obj.bibliography as any;
			const template = bibliography?.template;
			if (Array.isArray(template)) {
				const index = template.findIndex((c: any) => c.number === field);
				if (index !== -1) {
					wizardStore.updateStyleField(`bibliography.template.${index}.${path}`, value);
				}
			}
		} else {
			const type = wizardStore.activeRefType;
			const bibliography = obj.bibliography as any;
			let typeTemplates = bibliography?.["type-templates"] || {};
			let typeTemplate = typeTemplates[type];

			if (!typeTemplate) {
				typeTemplate = { template: JSON.parse(JSON.stringify(bibliography.template)) };
				wizardStore.updateStyleField(`bibliography.type-templates.${type}`, typeTemplate);
			}

			const template = typeTemplate.template;
			if (Array.isArray(template)) {
				const index = template.findIndex((c: any) => c.number === field);
				if (index !== -1) {
					wizardStore.updateStyleField(
						`bibliography.type-templates.${type}.template.${index}.${path}`,
						value
					);
				}
			}
		}
		debouncedFetchPreview();
	}

	const config = $derived(getNumberConfig());
	const prefix = $derived((config.prefix as string) ?? "");
	const suffix = $derived((config.suffix as string) ?? "");
	const isEmph = $derived((config.emph as boolean) ?? false);
	const isStrong = $derived((config.strong as boolean) ?? false);
</script>

<div class="space-y-4 p-6 pt-4">
	<h3 class="font-semibold text-text-main">
		Number: <span class="capitalize">{componentType}</span>
	</h3>

	<div class="grid grid-cols-2 gap-4">
		<div>
			<label for="ne-prefix" class="block text-sm font-medium text-text-main mb-2">Prefix</label>
			<input
				id="ne-prefix"
				type="text"
				value={prefix}
				oninput={(e) => updateNumberProperty("prefix", e.currentTarget.value)}
				placeholder="e.g. vol. "
				class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
			/>
		</div>
		<div>
			<label for="ne-suffix" class="block text-sm font-medium text-text-main mb-2">Suffix</label>
			<input
				id="ne-suffix"
				type="text"
				value={suffix}
				oninput={(e) => updateNumberProperty("suffix", e.currentTarget.value)}
				placeholder="e.g. , "
				class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
			/>
		</div>
	</div>

	<div>
		<span class="block text-sm font-medium text-text-main mb-2">Style</span>
		<div class="flex gap-4">
			<label for="ne-emph" class="flex items-center gap-2 cursor-pointer">
				<input
					id="ne-emph"
					type="checkbox"
					checked={isEmph}
					onchange={(e) => updateNumberProperty("emph", e.currentTarget.checked)}
					class="w-4 h-4 rounded border-border-light text-primary focus:ring-primary"
				/>
				<span class="text-sm text-text-main">Italic</span>
			</label>
			<label for="ne-strong" class="flex items-center gap-2 cursor-pointer">
				<input
					id="ne-strong"
					type="checkbox"
					checked={isStrong}
					onchange={(e) => updateNumberProperty("strong", e.currentTarget.checked)}
					class="w-4 h-4 rounded border-border-light text-primary focus:ring-primary"
				/>
				<span class="text-sm text-text-main">Bold</span>
			</label>
		</div>
	</div>
</div>
