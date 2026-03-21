<script lang="ts">
	import { demoStore } from "$lib/stores/demo";

	function handleDismiss() {
		demoStore.dismissBanner();
	}
</script>

{#if !$demoStore.bannerDismissed}
	<div
		class="sticky top-[60px] z-40 w-full bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 px-4 py-3 lg:px-10"
	>
		<div class="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
			<div class="flex items-center gap-3 flex-1">
				<span class="material-symbols-outlined text-blue-600 text-lg">info</span>
				<p class="text-sm font-medium text-blue-900">
					You're using Citum Hub in demo mode. Changes are not saved.
				</p>
			</div>
			<button
				onclick={handleDismiss}
				class="flex-shrink-0 text-blue-600 hover:text-blue-800 transition-colors p-1"
				aria-label="Dismiss banner"
			>
				<span class="material-symbols-outlined text-lg">close</span>
			</button>
		</div>
	</div>
{/if}
