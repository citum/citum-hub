<script lang="ts">
	import "../index.css";
	import { page } from "$app/stores";
	import favicon from "$lib/assets/favicon.svg";
	import { auth } from "$lib/stores/auth";
	import { env } from "$env/dynamic/public";

	let { children } = $props();
	const commitHash = env.PUBLIC_COMMIT_HASH;
	const isCustomizerRoute = $derived($page.url.pathname.startsWith("/create"));

	function handleLogin() {
		window.location.href = "/api/auth/github";
	}

	function handleLogout() {
		auth.logout();
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&display=swap"
		rel="stylesheet"
	/>
	<link
		href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
		rel="stylesheet"
	/>
	<title>Citum Hub</title>
</svelte:head>

<div class="min-h-screen flex flex-col bg-background-light">
	<!-- Shared Header -->
	{#if !isCustomizerRoute}
		<header
			class="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 bg-white px-4 py-3 lg:px-10"
		>
			<a href="/" class="flex items-center gap-4 hover:opacity-80 transition-opacity">
				<div class="size-8 text-primary flex items-center justify-center">
					<span class="material-symbols-outlined text-3xl">school</span>
				</div>
				<h2 class="text-lg font-bold leading-tight tracking-[-0.015em] text-slate-900">
					Citum Hub
				</h2>
			</a>
			<div class="hidden md:flex flex-1 justify-end gap-8">
				<nav class="flex items-center gap-9">
					<a
						class="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
						href="/library/browse">Browse</a
					>
					<a
						class="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
						href="/create">Style Builder</a
					>
					{#if $auth.user}
						<a
							class="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
							href="/library">My Library</a
						>
					{/if}
					<a
						class="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
						href="/">Docs</a
					>
				</nav>
				<div class="flex gap-2">
					{#if $auth.user}
						<button
							onclick={handleLogout}
							class="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-slate-200 hover:bg-slate-300 text-slate-900 text-sm font-bold transition-colors"
						>
							Sign Out
						</button>
					{:else}
						<button
							onclick={handleLogin}
							class="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white hover:bg-primary-dark text-sm font-bold transition-colors"
						>
							Sign In
						</button>
					{/if}
				</div>
			</div>
		</header>
	{/if}

	<!-- Page Content -->
	<div class="flex-grow">
		{@render children()}
	</div>

	<!-- Shared Footer -->
	{#if !isCustomizerRoute}
		<footer class="border-t border-slate-100 bg-white px-10 py-16">
			<div class="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between gap-12">
				<div class="flex flex-col gap-4 max-w-sm">
					<div class="flex items-center gap-3">
						<div class="size-6 text-primary flex items-center justify-center">
							<span class="material-symbols-outlined text-2xl">school</span>
						</div>
						<span class="text-lg font-bold text-slate-900">Citum Hub</span>
					</div>
					<p class="text-sm text-slate-500 leading-relaxed">
						An open-source initiative to modernize academic referencing.
					</p>
				</div>
				<div class="grid grid-cols-2 sm:grid-cols-3 gap-12">
					<div class="flex flex-col gap-4">
						<h4 class="text-xs font-black text-slate-900 uppercase tracking-widest">Platform</h4>
						<a class="text-sm text-slate-500 hover:text-primary" href="/library/browse">Browse</a>
						<a class="text-sm text-slate-500 hover:text-primary" href="/create">Style Builder</a>
						<a class="text-sm text-slate-500 hover:text-primary" href="/">API</a>
					</div>
					<div class="flex flex-col gap-4">
						<h4 class="text-xs font-black text-slate-900 uppercase tracking-widest">Help</h4>
						<a class="text-sm text-slate-500 hover:text-primary" href="/">Docs</a>
						<a class="text-sm text-slate-500 hover:text-primary" href="/">Forum</a>
					</div>
				</div>
			</div>
			<div class="mt-16 pt-8 border-t border-slate-100 text-center">
				<p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
					© 2024 Citum Hub. All rights reserved.
				</p>
				{#if commitHash}
					<p class="mt-2 text-[9px] font-mono text-slate-300">
						Build: {commitHash.slice(0, 7)}
					</p>
				{/if}
			</div>
		</footer>
	{/if}
</div>
