<script lang="ts">
    import { onMount } from 'svelte';
    import { auth } from '$lib/stores/auth';

    let publicStyles: any[] = $state([]);
    let searchQuery = $state('');
    let loading = $state(true);

    const filteredStyles = $derived(
        publicStyles.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    onMount(async () => {
        try {
            const res = await fetch('/api/hub');
            if (res.ok) {
                publicStyles = await res.json();
            }
        } catch (e) {
            console.error('Failed to load hub', e);
        } finally {
            loading = false;
        }
    });
</script>

<main class="flex flex-col gap-12 pb-20">
    <!-- Hero Section -->
    <section class="bg-slate-900 text-white py-20 px-4 lg:px-10">
        <div class="max-w-[1200px] mx-auto flex flex-col items-center text-center gap-6">
            <h1 class="text-5xl lg:text-6xl font-black tracking-tight max-w-3xl leading-[1.1]">
                Find the perfect citation style for your research
            </h1>
            <p class="text-xl text-slate-400 max-w-2xl">
                Browse, fork, and customize thousands of academic styles managed by the CSL community.
            </p>
            
            <div class="w-full max-w-xl mt-4 relative">
                <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input 
                    bind:value={searchQuery}
                    type="text" 
                    placeholder="Search styles (e.g., 'APA', 'Nature', 'Harvard')..." 
                    class="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
            </div>
        </div>
    </section>

    <!-- Style Grid -->
    <section class="px-4 lg:px-10 max-w-[1200px] mx-auto w-full">
        <div class="flex justify-between items-end mb-8">
            <div>
                <h2 class="text-2xl font-bold text-slate-900">Featured Styles</h2>
                <p class="text-slate-500">Popular and verified styles from the hub</p>
            </div>
            <p class="text-sm font-bold text-slate-400 uppercase tracking-widest">
                {filteredStyles.length} styles found
            </p>
        </div>

        {#if loading}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {#each Array(6) as _}
                    <div class="h-64 bg-slate-100 animate-pulse rounded-3xl"></div>
                {/each}
            </div>
        {:else if filteredStyles.length === 0}
            <div class="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <span class="material-symbols-outlined text-6xl text-slate-200 mb-4">search_off</span>
                <p class="text-slate-500 text-lg">No styles match your search.</p>
            </div>
        {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {#each filteredStyles as style}
                    <a 
                        href="/style/{style.id}"
                        class="group bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all flex flex-col justify-between">
                        <div>
                            <div class="flex justify-between items-start mb-6">
                                <div class="size-12 bg-slate-50 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <span class="material-symbols-outlined text-2xl">description</span>
                                </div>
                                <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded">Verified</span>
                            </div>
                            <h3 class="text-xl font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors">{style.title}</h3>
                            <p class="text-sm text-slate-500 leading-relaxed mb-6 line-clamp-2">
                                Official citation style for {style.title}. Supports {style.intent?.class || 'standard'} formatting with comprehensive bibliography rules.
                            </p>
                        </div>
                        <div class="flex items-center justify-between pt-6 border-t border-slate-50">
                            <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Updated {new Date(style.updated_at).toLocaleDateString()}</span>
                            <span class="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">arrow_forward</span>
                        </div>
                    </a>
                {/each}
            </div>
        {/if}
    </section>

    <!-- Call to Action -->
    <section class="px-4 lg:px-10 max-w-[1200px] mx-auto w-full mt-10">
        <div class="bg-primary/5 rounded-[40px] p-12 flex flex-col items-center text-center gap-6 border border-primary/10">
            <h2 class="text-3xl font-black text-slate-900">Can't find what you're looking for?</h2>
            <p class="text-slate-600 max-w-xl">
                Use our Decision Wizard to build a custom style from scratch or by modifying an existing archetype.
            </p>
            <a href="/create-wizard" class="bg-primary text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                Start the Wizard
            </a>
        </div>
    </section>
</main>
