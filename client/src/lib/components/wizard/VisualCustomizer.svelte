<script lang="ts">
import { goto } from "$app/navigation";
import { wizardStore } from "$lib/stores/wizard.svelte";
import TypeSelector from "./TypeSelector.svelte";
import InteractivePreview from "./InteractivePreview.svelte";
import ComponentEditor from "./ComponentEditor.svelte";

function goBack() {
	wizardStore.setPhase("quick-start");
	goto("/create/preset");
}

async function downloadStyle() {
	const yaml = wizardStore.styleYaml;
	if (!yaml) {
		alert("No style to download");
		return;
	}
	const blob = new Blob([yaml], { type: "text/plain" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `${wizardStore.styleName || "style"}.yaml`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
</script>

<div class="min-h-screen bg-background-light">
	<!-- Header -->
	<div class="border-b border-border-light bg-surface-light">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
			<h1 class="font-display text-3xl font-semibold text-text-main">Visual Customizer</h1>
			<p class="mt-1 text-text-secondary">Click elements in the preview to edit formatting</p>
		</div>
	</div>

	<!-- Type Selector -->
	<div class="border-b border-border-light bg-surface-light">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
			<TypeSelector />
		</div>
	</div>

	<!-- Main Content -->
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
			<!-- Preview (60%) -->
			<div class="order-2 lg:order-1">
				<div class="sticky top-8">
					<InteractivePreview />
				</div>
			</div>

			<!-- Editor Panel (40%) -->
			<div class="order-1 space-y-6 lg:order-2">
				<ComponentEditor />

				<!-- Undo/Redo Actions -->
				<div class="flex gap-2">
					<button
						disabled={!wizardStore.canUndo}
						onclick={() => wizardStore.undo()}
						class="flex-1 rounded-lg border border-border-light bg-surface-light px-4 py-2 text-sm font-medium text-text-main hover:bg-background-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						<span class="material-symbols-outlined inline align-middle mr-1 text-base">undo</span>
						Undo
					</button>
					<button
						disabled={!wizardStore.canRedo}
						onclick={() => wizardStore.redo()}
						class="flex-1 rounded-lg border border-border-light bg-surface-light px-4 py-2 text-sm font-medium text-text-main hover:bg-background-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						<span class="material-symbols-outlined inline align-middle mr-1 text-base">redo</span>
						Redo
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Footer -->
	<div class="border-t border-border-light bg-surface-light mt-12">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
			<div class="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
				<button
					onclick={goBack}
					class="order-2 sm:order-1 px-4 py-2 text-sm font-medium text-primary hover:text-blue-700 transition-colors"
				>
					← Back to Quick Start
				</button>

				<div class="order-1 sm:order-2 flex gap-3">
					<button
						onclick={downloadStyle}
						class="rounded-lg border border-border-light bg-surface-light px-6 py-2 text-sm font-medium text-text-main hover:bg-background-light transition-colors"
					>
						<span class="material-symbols-outlined inline align-middle mr-1 text-base"
							>download</span
						>
						Download
					</button>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	:global(.live-preview-content) {
		font-family: var(--font-serif);
	}
</style>
