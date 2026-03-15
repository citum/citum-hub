<script lang="ts">
	import { wizardStore } from "$lib/stores/wizard.svelte";
	import type { TitleConfig } from "$lib/types/wizard";

	let debounceTimer: number | undefined;

	function debouncedFetchPreview() {
		clearTimeout(debounceTimer);
		debounceTimer = window.setTimeout(() => {
			wizardStore.fetchPreview();
		}, 300);
	}

	function getTitleConfig(): TitleConfig {
		const opts = wizardStore.getOptions();
		if (opts?.titles && typeof opts.titles === "object") {
			return opts.titles;
		}
		return {};
	}

	function updateTitle(path: keyof TitleConfig, value: unknown) {
		const current = getTitleConfig();
		const updated = { ...current, [path]: value };
		wizardStore.updateStyleField("options.titles", updated);
		debouncedFetchPreview();
	}

	const config = $derived(getTitleConfig());
	const textCase = $derived(config["text-case"] ?? "sentence");
	const isQuoted = $derived(config.quote ?? false);
	const isEmph = $derived(config.emph ?? false);
</script>

<div class="space-y-4 p-6">
	<div>
		<h3 class="font-semibold text-text-main mb-4">Title Formatting</h3>
		<div class="space-y-4">
			<div>
				<label for="te-case" class="block text-sm font-medium text-text-main mb-2"
					>Capitalization</label
				>
				<select
					id="te-case"
					value={textCase}
					onchange={(e) => updateTitle("text-case", e.currentTarget.value)}
					class="w-full rounded border border-border-light bg-surface-light px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
				>
					<option value="sentence">Sentence case</option>
					<option value="title">Title Case</option>
					<option value="as-is">As entered</option>
				</select>
			</div>

			<div>
				<span class="block text-sm font-medium text-text-main mb-2">Style</span>
				<div class="space-y-2">
					<label for="te-quoted" class="flex items-center gap-2 cursor-pointer">
						<input
							id="te-quoted"
							type="checkbox"
							checked={isQuoted}
							onchange={(e) => updateTitle("quote", e.currentTarget.checked)}
							class="w-4 h-4 rounded border-border-light text-primary focus:ring-primary"
						/>
						<span class="text-sm text-text-main">In quotes</span>
					</label>
					<label for="te-emph" class="flex items-center gap-2 cursor-pointer">
						<input
							id="te-emph"
							type="checkbox"
							checked={isEmph}
							onchange={(e) => updateTitle("emph", e.currentTarget.checked)}
							class="w-4 h-4 rounded border-border-light text-primary focus:ring-primary"
						/>
						<span class="text-sm text-text-main">Italic</span>
					</label>
				</div>
			</div>
		</div>
	</div>
</div>
