<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { createFlowStore } from "$lib/stores/create-flow.svelte";
	import { wizardStore } from "$lib/stores/wizard.svelte";

	const navItems = [
		{ href: "/create/find", label: "Find" },
		{ href: "/create/tweak", label: "Tweak" },
		{ href: "/create/build", label: "Build" },
	];

	function isActive(href: string) {
		return $page.url.pathname === href;
	}

	function handleReset() {
		createFlowStore.resetAll();
		wizardStore.reset();
		goto("/create");
	}
</script>

<header class="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
	<div class="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
		<div class="flex items-center gap-4">
			<a href="/create" class="text-lg font-bold tracking-tight text-slate-950">Citum Create</a>
			<nav class="hidden items-center gap-2 md:flex">
				{#each navItems as item}
					<a
						href={item.href}
						class={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
							isActive(item.href)
								? "bg-slate-900 text-white"
								: "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
						}`}
					>
						{item.label}
					</a>
				{/each}
			</nav>
		</div>

		<div class="flex items-center gap-3">
			<a
				href="/library/browse"
				class="hidden text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 sm:inline"
			>
				Library
			</a>
			<button
				onclick={handleReset}
				class="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-950"
			>
				Start over
			</button>
		</div>
	</div>
</header>
