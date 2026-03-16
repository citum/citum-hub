<script lang="ts">
import { goto } from "$app/navigation";
import { auth } from "$lib/stores/auth";
import { wizardStore } from "$lib/stores/wizard.svelte";
import PreviewPane from "./PreviewPane.svelte";

let styleName = $state(wizardStore.styleName || suggestStyleName());
let isSaving = $state(false);
let saveError = $state<string | null>(null);
let saveSuccess = $state(false);

function suggestStyleName(): string {
	if (wizardStore.presetId) {
		const presetMap: Record<string, string> = {
			apa: "APA Author-Date",
			chicago: "Chicago Author-Date",
			vancouver: "Vancouver Numeric",
			harvard: "Harvard Author-Date",
			numeric: "Numeric",
			footnote: "Footnote",
		};
		return presetMap[wizardStore.presetId] || "My Custom Style";
	}
	return "My Custom Style";
}

function updateStyleName(value: string) {
	if (value.length <= 100) {
		styleName = value;
		wizardStore.setStyleName(value);
	}
}

function slugify(s: string): string {
	return s
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

async function downloadYaml() {
	const blob = new Blob([wizardStore.styleYaml], { type: "text/yaml" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = slugify(styleName || "my-style") + ".yaml";
	a.click();
	URL.revokeObjectURL(url);
}

async function saveToLibrary() {
	if (!styleName.trim()) {
		saveError = "Please enter a style name";
		return;
	}

	isSaving = true;
	saveError = null;
	saveSuccess = false;

	try {
		if (!$auth.token) {
			saveError = "Not authenticated";
			return;
		}

		const res = await fetch("/api/styles", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${$auth.token}`,
			},
			body: JSON.stringify({
				title: styleName,
				intent: {},
				citum: wizardStore.styleYaml,
			}),
		});

		if (!res.ok) {
			throw new Error(`Save failed: ${res.status}`);
		}

		saveSuccess = true;
		setTimeout(() => {
			goto("/library");
		}, 1000);
	} catch (e) {
		saveError = e instanceof Error ? e.message : "Failed to save style";
	} finally {
		isSaving = false;
	}
}

function customizeFurther() {
	wizardStore.setPhase("visual-customizer");
	goto("/create/customize");
}

function startOver() {
	wizardStore.reset();
	goto("/create/field");
}

// Use $auth reactive store subscription for template access
const authState = $derived($auth);
</script>

<div class="min-h-screen bg-background-light p-4 sm:p-6 lg:p-8">
	<div class="mx-auto max-w-4xl space-y-6">
		<!-- Header -->
		<div class="space-y-2">
			<h1 class="font-display text-3xl font-semibold text-text-main">Review Your Style</h1>
			<p class="text-text-secondary">Give your style a name and review before saving</p>
		</div>

		<!-- Name Input -->
		<div class="rounded-lg border border-border-light bg-surface-light p-6">
			<label for="styleName" class="block text-sm font-medium text-text-main mb-2">
				Style Name
			</label>
			<input
				id="styleName"
				type="text"
				placeholder="e.g., My Research Style"
				maxlength="100"
				value={styleName}
				onchange={(e) => updateStyleName(e.currentTarget.value)}
				oninput={(e) => updateStyleName(e.currentTarget.value)}
				class="w-full rounded-lg border border-border-light bg-background-light px-4 py-2 text-text-main placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
			/>
			<p class="mt-1 text-xs text-text-secondary">
				{styleName.length}/100
			</p>
		</div>

		<!-- Preview -->
		<div>
			<h2 class="mb-4 font-semibold text-text-main">Preview</h2>
			<PreviewPane />
		</div>

		<!-- Messages -->
		{#if saveError}
			<div class="rounded-lg bg-red-50 p-4">
				<p class="text-sm font-medium text-red-700">
					<span class="material-symbols-outlined align-middle text-lg">error</span>
					{saveError}
				</p>
			</div>
		{/if}

		{#if saveSuccess}
			<div class="rounded-lg bg-green-50 p-4">
				<p class="text-sm font-medium text-green-700">
					<span class="material-symbols-outlined align-middle text-lg">check_circle</span>
					Style saved successfully! Redirecting...
				</p>
			</div>
		{/if}

		<!-- Action Buttons -->
		<div class="flex flex-col gap-3 sm:flex-row">
			<!-- Download (Primary) -->
			<button
				onclick={downloadYaml}
				class="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-white hover:bg-blue-700 transition-colors"
			>
				<span class="material-symbols-outlined">download</span>
				Download YAML
			</button>

			<!-- Save to Library -->
			{#if authState?.user}
				<button
					onclick={saveToLibrary}
					disabled={isSaving}
					class="flex items-center justify-center gap-2 rounded-lg border-2 border-primary bg-surface-light px-6 py-3 font-semibold text-primary hover:bg-blue-50 transition-colors disabled:opacity-50"
				>
					{#if isSaving}
						<span class="material-symbols-outlined animate-spin">hourglass</span>
					{:else}
						<span class="material-symbols-outlined">save</span>
					{/if}
					{isSaving ? "Saving..." : "Save to Library"}
				</button>
			{:else}
				<button
					onclick={() => (window.location.href = "/api/auth/github")}
					class="flex items-center justify-center gap-2 rounded-lg border-2 border-border-light bg-surface-light px-6 py-3 font-semibold text-text-main hover:bg-background-light transition-colors"
				>
					<span class="material-symbols-outlined">login</span>
					Sign in to Save
				</button>
			{/if}

			<!-- Customize Further (Secondary) -->
			<button
				onclick={customizeFurther}
				class="flex items-center justify-center gap-2 rounded-lg border border-border-light bg-surface-light px-6 py-3 font-semibold text-text-main hover:bg-background-light transition-colors"
			>
				<span class="material-symbols-outlined">edit</span>
				Customize Further
			</button>

			<!-- Start Over (Tertiary) -->
			<button
				onclick={startOver}
				class="flex items-center justify-center gap-2 rounded-lg border border-border-light bg-surface-light px-6 py-3 font-semibold text-text-main hover:bg-background-light transition-colors"
			>
				<span class="material-symbols-outlined">restart_alt</span>
				Start Over
			</button>
		</div>
	</div>
</div>

<style>
	:global(.live-preview-content) {
		font-family: var(--font-serif);
	}
</style>
