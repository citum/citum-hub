<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { auth } from "$lib/stores/auth";
	import type { Style } from "$lib/types/style";

	let styles: Style[] = $state([]);
	let bookmarks: Style[] = $state([]);
	let loading = $state(true);
	let error = $state(null);

	onMount(async () => {
		if (!$auth.user) {
			goto("/");
			return;
		}

		try {
			const [stylesRes, bookmarksRes] = await Promise.all([
				fetch("/api/styles", {
					headers: { Authorization: `Bearer ${$auth.token}` },
				}),
				fetch("/api/bookmarks", {
					headers: { Authorization: `Bearer ${$auth.token}` },
				}),
			]);

			if (stylesRes.ok && bookmarksRes.ok) {
				styles = await stylesRes.json();
				bookmarks = await bookmarksRes.json();
			} else {
				error = "Failed to load library data";
			}
		} catch (_e) {
			error = "Network error";
		} finally {
			loading = false;
		}
	});

	async function handleRemoveBookmark(id: string) {
		const res = await fetch(`/api/styles/${id}/bookmark`, {
			method: "DELETE",
			headers: { Authorization: `Bearer ${$auth.token}` },
		});
		if (res.ok) {
			bookmarks = bookmarks.filter((b) => b.id !== id);
		}
	}
</script>

<div class="px-4 py-10 lg:px-10 max-w-[1200px] mx-auto">
	<div class="flex justify-between items-center mb-12">
		<div>
			<h1 class="text-3xl font-bold text-slate-900">My Library</h1>
			<p class="text-slate-500">Manage your custom styles and references</p>
		</div>
		<a
			href="/create-wizard"
			class="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-dark transition-colors"
		>
			Create New Style
		</a>
	</div>

	{#if loading}
		<div class="flex justify-center py-20">
			<span class="material-symbols-outlined animate-spin text-4xl text-slate-300"
				>progress_activity</span
			>
		</div>
	{:else if error}
		<div class="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">
			{error}
		</div>
	{:else}
		<section class="mb-12">
			<div class="flex items-center gap-2 mb-6">
				<span class="material-symbols-outlined text-slate-400">edit_document</span>
				<h2 class="text-xl font-bold text-slate-800">My Styles</h2>
				<span class="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full font-bold"
					>{styles.length}</span
				>
			</div>

			{#if styles.length === 0}
				<div class="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
					<p class="text-slate-500">You haven't created any styles yet.</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each styles as style}
						<div
							class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
						>
							<div>
								<div class="flex justify-between items-start mb-4">
									<h3 class="text-lg font-bold text-slate-900">{style.title}</h3>
									<span
										class="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-slate-100 rounded text-slate-500"
									>
										{style.is_public ? "Public" : "Private"}
									</span>
								</div>
								<p class="text-sm text-slate-500 mb-4">
									Last updated: {new Date(style.updated_at).toLocaleDateString()}
								</p>
							</div>
							<div class="flex gap-2 mt-4">
								<a
									href="/style/{style.id}"
									class="flex-1 text-center py-2 text-sm font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
								>
									View
								</a>
								<button
									class="flex-1 text-center py-2 text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
								>
									Edit
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<section>
			<div class="flex items-center gap-2 mb-6">
				<span class="material-symbols-outlined text-slate-400">bookmark</span>
				<h2 class="text-xl font-bold text-slate-800">Bookmarked Styles</h2>
				<span class="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full font-bold"
					>{bookmarks.length}</span
				>
			</div>

			{#if bookmarks.length === 0}
				<div class="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
					<p class="text-slate-500">
						No bookmarked styles. Browse the hub to find styles to follow.
					</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each bookmarks as style}
						<div
							class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
						>
							<div>
								<h3 class="text-lg font-bold text-slate-900 mb-2">{style.title}</h3>
								<p class="text-sm text-slate-500 mb-4">
									By {style.user_id === $auth.user?.id ? "You" : "Community"}
								</p>
							</div>
							<div class="flex gap-2 mt-4">
								<a
									href="/style/{style.id}"
									class="flex-1 text-center py-2 text-sm font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
								>
									View
								</a>
								<button
									onclick={() => handleRemoveBookmark(style.id)}
									class="p-2 text-slate-400 hover:text-red-500 transition-colors"
								>
									<span class="material-symbols-outlined">bookmark_remove</span>
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	{/if}
</div>
