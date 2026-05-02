<script lang="ts">
	import { goto } from "$app/navigation";
	import { auth } from "$lib/stores/auth";
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import PreviewPane from "./PreviewPane.svelte";
	import {
		buildWizardMetadata,
		slugifyStyleId,
		suggestStyleName as suggestWizardStyleName,
		validateStyleMetadata,
	} from "$lib/utils/wizard-flow";
	import {
		ArrowLeft,
		Download,
		FileCode2,
		Github,
		RotateCcw,
		Save,
		SlidersHorizontal,
	} from "lucide-svelte";

	const initialStyleName = wizardStore.styleName || suggestStyleName();
	let styleName = $state(initialStyleName);
	let styleId = $state(wizardStore.styleId || slugifyStyleId(initialStyleName));
	let isSaving = $state(false);
	let saveError = $state<string | null>(null);
	let saveSuccess = $state(false);
	const metadataValidation = $derived(validateStyleMetadata(styleName, styleId));
	const hasMetadataError = $derived(
		Boolean(metadataValidation.nameError || metadataValidation.idError)
	);

	function suggestStyleName(): string {
		if (wizardStore.styleName && wizardStore.styleName !== "Custom Style")
			return wizardStore.styleName;
		return suggestWizardStyleName({
			field: wizardStore.field,
			family: wizardStore.family,
			presetId: wizardStore.presetId,
		});
	}

	function updateStyleName(value: string) {
		if (value.length <= 100) {
			const previousId = slugifyStyleId(styleName);
			styleName = value;
			if (!styleId || styleId === previousId) {
				styleId = slugifyStyleId(value);
			}
			wizardStore.setStyleMetadata(styleName, styleId);
		}
	}

	function updateStyleId(value: string) {
		styleId = slugifyStyleId(value);
		wizardStore.setStyleMetadata(styleName, styleId);
	}

	function validateName(): string | null {
		return metadataValidation.nameError ?? metadataValidation.idError;
	}

	async function downloadYaml() {
		const nameError = validateName();
		if (nameError) {
			saveError = nameError;
			return;
		}

		const validation = await wizardStore.validateCurrentStyle();
		if (validation) {
			saveError = validation;
			return;
		}

		const blob = new Blob([wizardStore.styleYaml], { type: "text/yaml" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${styleId || "custom-style"}.yaml`;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function saveToLibrary() {
		const nameError = validateName();
		if (nameError) {
			saveError = nameError;
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

			const validation = await wizardStore.validateCurrentStyle();
			if (validation) {
				saveError = validation;
				return;
			}

			const res = await fetch("/api/styles", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${$auth.token}`,
				},
				body: JSON.stringify({
					title: styleName.trim(),
					intent: buildWizardMetadata({
						field: wizardStore.field,
						family: wizardStore.family,
						axisChoices: wizardStore.axisChoices,
						presetId: wizardStore.presetId,
					}),
					citum: wizardStore.styleYaml,
				}),
			});

			if (!res.ok) {
				throw new Error(`Save failed: ${res.status}`);
			}

			saveSuccess = true;
		} catch (e) {
			saveError = e instanceof Error ? e.message : "Failed to save style";
		} finally {
			isSaving = false;
		}
	}

	function customizeFurther() {
		wizardStore.setPhase("visual-customizer");
		wizardStore.setRouteStep("customize");
		goto("/create/build/customize");
	}

	function openAdvanced() {
		wizardStore.setPhase("advanced");
		wizardStore.setRouteStep("advanced");
		goto("/create/build/advanced");
	}

	function startOver() {
		wizardStore.reset();
		goto("/create/build/field");
	}

	const authState = $derived($auth);
</script>

<div class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
	<div class="mx-auto mb-8 max-w-2xl text-center">
		<button
			onclick={() => history.back()}
			class="absolute left-4 top-24 flex items-center justify-center rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:left-8"
			aria-label="Go back"
		>
			<ArrowLeft class="size-5" />
		</button>
		<p class="mb-2 text-sm font-medium text-slate-500">Step 5 of 7</p>
		<div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
			<div
				class="h-full rounded-full bg-emerald-600 transition-all duration-500"
				style="width: 71.4285%"
			></div>
		</div>
		<h1 class="mt-6 text-3xl font-bold text-slate-950">Review and name your style</h1>
	</div>

	<div class="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
		<aside class="space-y-4">
			<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<label
					for="styleName"
					class="block text-xs font-bold uppercase tracking-[0.18em] text-slate-500"
				>
					Style name
				</label>
				<input
					id="styleName"
					type="text"
					placeholder="e.g. Department author-date style"
					maxlength="100"
					value={styleName}
					oninput={(e) => updateStyleName(e.currentTarget.value)}
					class="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base font-medium text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
				/>
				<p class="mt-2 text-right text-xs font-medium text-slate-400">{styleName.length}/100</p>
				{#if metadataValidation.nameError}
					<p class="mt-2 text-sm font-medium text-red-700">{metadataValidation.nameError}</p>
				{/if}

				<label
					for="styleId"
					class="mt-5 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500"
				>
					Style id
				</label>
				<input
					id="styleId"
					type="text"
					placeholder="department-author-date-style"
					maxlength="80"
					value={styleId}
					oninput={(e) => updateStyleId(e.currentTarget.value)}
					class="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm font-medium text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
				/>
				{#if metadataValidation.idError}
					<p class="mt-2 text-sm font-medium text-red-700">{metadataValidation.idError}</p>
				{/if}
			</div>

			<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Summary</p>
				<dl class="mt-4 space-y-3 text-sm">
					<div>
						<dt class="text-slate-400">Field</dt>
						<dd class="mt-1 font-semibold capitalize text-slate-900">
							{wizardStore.field?.replace(/-/g, " ") ?? "Not set"}
						</dd>
					</div>
					<div>
						<dt class="text-slate-400">Family</dt>
						<dd class="mt-1 font-semibold capitalize text-slate-900">
							{wizardStore.family?.replace(/-/g, " ") ?? "Not set"}
						</dd>
					</div>
					<div>
						<dt class="text-slate-400">Base</dt>
						<dd class="mt-1 font-semibold capitalize text-slate-900">
							{wizardStore.presetId?.replace(/-/g, " ") ?? "Custom"}
						</dd>
					</div>
				</dl>
			</div>

			{#if saveError}
				<div
					class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
				>
					{saveError}
				</div>
			{/if}
			{#if saveSuccess}
				<div
					class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
				>
					Style saved to your library.
				</div>
			{/if}

			<div class="grid gap-3">
				<button
					onclick={downloadYaml}
					disabled={hasMetadataError}
					class="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<Download class="size-4" />
					Download YAML
				</button>

				{#if authState?.user}
					<button
						onclick={saveToLibrary}
						disabled={isSaving || hasMetadataError}
						class="flex items-center justify-center gap-2 rounded-lg border border-emerald-600 bg-white px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
					>
						<Save class="size-4" />
						{isSaving ? "Saving..." : "Save to Library"}
					</button>
				{:else}
					<button
						onclick={() => (window.location.href = "/api/auth/github")}
						class="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300"
					>
						<Github class="size-4" />
						Sign in to Save
					</button>
				{/if}

				<button
					onclick={customizeFurther}
					class="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300"
				>
					<SlidersHorizontal class="size-4" />
					Customize
				</button>
				<button
					onclick={openAdvanced}
					class="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300"
				>
					<FileCode2 class="size-4" />
					Advanced Editor
				</button>
				<button
					onclick={startOver}
					class="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold text-slate-500 transition hover:text-slate-950"
				>
					<RotateCcw class="size-4" />
					Start Over
				</button>
			</div>
		</aside>

		<section class="rounded-2xl border border-slate-200 bg-slate-100 p-5 shadow-sm">
			<p class="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Final Preview</p>
			<PreviewPane />
		</section>
	</div>
</div>
