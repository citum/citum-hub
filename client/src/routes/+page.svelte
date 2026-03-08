<script lang="ts">
import { onMount } from "svelte";

import type { Style } from "$lib/types/style";

let publicStyles: Style[] = $state([]);
let searchQuery = $state("");
let loading = $state(true);

const filteredStyles = $derived(
        publicStyles.filter((s) => {
                const query = searchQuery.toLowerCase();
                const inTitle = s.title.toLowerCase().includes(query);
                const inDesc = (s.description || "").toLowerCase().includes(query);
                const inFields = (s.fields || []).some((f) =>
                        f.toLowerCase().includes(query),
                );
                return inTitle || inDesc || inFields;
        }),
);

onMount(async () => {
        try {
                const res = await fetch("/api/hub");
                if (res.ok) {
                        publicStyles = await res.json();
                }
        } finally {
                loading = false;
        }
});
</script>

<main class="min-h-screen bg-slate-50">
    <section class="bg-slate-900 pt-24 pb-20 px-4">
        <div class="max-w-[1200px] mx-auto text-center">
            <h1 class="text-5xl font-black text-white mb-6 tracking-tight">Style Hub</h1>
            <p class="text-slate-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                Discover, fork, and customize 100+ citation styles for any discipline.
            </p>
            
            <div class="max-w-2xl mx-auto relative group">
                <span class="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">search</span>
                <input 
                    type="text" 
                    bind:value={searchQuery}
                    placeholder="Search by title, field, or discipline..." 
                    class="w-full bg-white/5 border border-white/10 text-white pl-16 pr-6 py-5 rounded-3xl text-lg focus:outline-none focus:ring-4 focus:ring-primary/20 focus:bg-white/10 focus:border-primary/50 transition-all placeholder:text-slate-600 shadow-2xl"
                />
            </div>
        </div>
    </section>

    <section class="max-w-[1200px] mx-auto py-16 px-4">
        {#if loading}
            <div class="flex justify-center py-20">
                <span class="material-symbols-outlined animate-spin text-4xl text-slate-300">progress_activity</span>
            </div>
        {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {#each filteredStyles as style}
                    <a href="/style/{style.id}" class="group bg-white rounded-[32px] border border-slate-200/60 p-8 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 transition-all flex flex-col justify-between">
                        <div>
                            <div class="flex items-center gap-3 mb-6">
                                <div class="size-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                                    <span class="material-symbols-outlined text-2xl text-slate-400 group-hover:text-primary">description</span>
                                </div>
                                <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Official Style</span>
                            </div>
                            <h3 class="text-xl font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors">{style.title}</h3>
                            <p class="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">
                                {style.description || `Official citation style for ${style.title}.`}
                            </p>
                            
                            {#if style.fields?.length}
                                <div class="flex flex-wrap gap-2 mb-4">
                                    {#each style.fields as field}
                                        <span class="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 uppercase tracking-tighter">{field}</span>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                        <div class="flex items-center justify-between pt-6 border-t border-slate-50">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Updated {new Date(style.updated_at).toLocaleDateString()}</span>
                            <span class="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">arrow_forward</span>
                        </div>
                    </a>
                {/each}
            </div>
        {/if}

        <div class="mt-20 text-center bg-white rounded-[40px] border border-slate-200/60 p-12 lg:p-20 shadow-sm">
            <h2 class="text-3xl font-bold text-slate-900 mb-4">Can't find what you need?</h2>
            <p class="text-slate-500 text-lg mb-10 max-w-xl mx-auto">Build your own custom style in minutes using our guided visual wizard.</p>
            <a href="/create-wizard" class="bg-primary text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 inline-flex items-center gap-3">
                <span class="material-symbols-outlined">auto_fix</span>
                Start the Wizard
            </a>
        </div>
    </section>
</main>
