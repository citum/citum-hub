<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { wizardStore } from "$lib/stores/wizard.svelte";

	onMount(() => {
		// Resume where the user left off, or start fresh
		const timer = setTimeout(() => {
			if (wizardStore.step === 5) {
				goto("/create/review", { replaceState: true });
			} else if (wizardStore.step === 4) {
				goto("/create/refine", { replaceState: true });
			} else if (wizardStore.step === 3) {
				goto("/create/style", { replaceState: true });
			} else if (wizardStore.step === 2) {
				goto("/create/family", { replaceState: true });
			} else {
				goto("/create/field", { replaceState: true });
			}
		}, 500);
		return () => clearTimeout(timer);
	});
</script>

<div class="flex flex-col items-center justify-center py-20 px-4 text-center">
	<div class="animate-pulse text-text-secondary text-sm mb-6">Restoring your session...</div>

	<div class="max-w-xs w-full pt-8 border-t border-slate-100 dark:border-slate-800">
		<p class="text-xs text-slate-400 mb-4">Taking too long or want to start over?</p>
		<button
			onclick={() => {
				wizardStore.reset();
				goto("/create/field");
			}}
			class="w-full rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
		>
			<span class="material-symbols-outlined text-lg">restart_alt</span>
			Start a fresh style
		</button>
	</div>
</div>
