<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { auth } from '$lib/stores/auth';
    import { goto } from '$app/navigation';
    import ComprehensivePreview from '$lib/components/ComprehensivePreview.svelte';
    import { toStyle } from '$lib/intent';
    import yaml from 'js-yaml';

    let style = $state(null);
    let loading = $state(true);
    let previewLoading = $state(false);
    let error = $state(null);
    let isForking = $state(false);
    
    let previewSet = $state({
        in_text: null,
        note: null,
        bibliography: null
    });

    onMount(async () => {
        try {
            const res = await fetch(`/api/styles/${$page.params.id}`, {
                headers: $auth.token ? { 'Authorization': `Bearer ${$auth.token}` } : {}
            });
            if (res.ok) {
                style = await res.json();
                generatePreviews();
            } else {
                error = 'Style not found or private';
            }
        } catch (e) {
            error = 'Network error';
        } finally {
            loading = false;
        }
    });

    async function generatePreviews() {
        if (!style) return;
        previewLoading = true;
        
        try {
            // 1. Get references
            const refsRes = await fetch('/references');
            const refsData = await refsRes.json();
            const firstRef = [Object.entries(refsData)[0]].map(([id, ref]: [string, any]) => ({ ...ref, id }));
            const multiRefs = Object.entries(refsData)
                .slice(0, 3)
                .map(([id, ref]: [string, any]) => ({ ...ref, id }));

            // 2. Prepare the style object
            let styleObj;
            if (style.citum) {
                try {
                    styleObj = yaml.load(style.citum);
                } catch (e) {
                    console.error('Failed to parse Citum YAML, falling back to intent', e);
                    styleObj = toStyle(style.intent);
                }
            } else {
                styleObj = toStyle(style.intent);
            }

            // 3. Fetch previews via our proxy
            const [citRes, bibRes] = await Promise.all([
                fetch('/preview/citation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ style: styleObj, references: firstRef })
                }),
                fetch('/preview/bibliography', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ style: styleObj, references: multiRefs })
                })
            ]);

            if (citRes.ok) {
                const data = await citRes.json();
                // Check if the style object or intent suggests a note style
                const isNote = styleObj.options?.processing === 'note' || style.intent?.class === 'footnote';
                
                if (isNote) {
                    previewSet.note = data.result;
                    previewSet.in_text = '<sup class="text-primary font-bold">1</sup>';
                } else {
                    previewSet.in_text = data.result;
                    previewSet.note = null;
                }
            }
            if (bibRes.ok) {
                const data = await bibRes.json();
                previewSet.bibliography = data.result;
            }
        } catch (e) {
            console.error('Failed to generate previews', e);
        } finally {
            previewLoading = false;
        }
    }

    async function forkStyle() {
        if (!$auth.user) return;
        isForking = true;
        try {
            const res = await fetch(`/api/styles/${style.id}/fork`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${$auth.token}` }
            });
            if (res.ok) {
                const newStyle = await res.json();
                goto(`/library`);
            }
        } finally {
            isForking = false;
        }
    }

    async function bookmarkStyle() {
        if (!$auth.user) return;
        await fetch(`/api/styles/${style.id}/bookmark`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${$auth.token}` }
        });
        alert('Bookmarked!');
    }
</script>

<div class="px-4 py-10 lg:px-10 max-w-[1000px] mx-auto">
    {#if loading}
        <div class="flex justify-center py-20">
            <span class="material-symbols-outlined animate-spin text-4xl text-slate-300">progress_activity</span>
        </div>
    {:else if error}
        <div class="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">
            {error}
        </div>
    {:else}
        <div class="flex flex-col gap-8">
            <div class="flex justify-between items-start">
                <div>
                    <nav class="flex gap-2 mb-4">
                        <a href="/" class="text-slate-500 text-xs font-medium hover:underline">All Styles</a>
                        <span class="text-slate-500 text-xs">/</span>
                        <span class="text-slate-900 text-xs font-bold">{style.title}</span>
                    </nav>
                    <h1 class="text-3xl font-bold text-slate-900 mb-2">{style.title}</h1>
                    <p class="text-slate-500">Last updated {new Date(style.updated_at).toLocaleDateString()}</p>
                </div>
                
                {#if $auth.user}
                    <div class="flex gap-3">
                        <button 
                            onclick={bookmarkStyle}
                            class="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                            <span class="material-symbols-outlined text-xl">bookmark</span>
                            Bookmark
                        </button>
                        <button 
                            onclick={forkStyle}
                            disabled={isForking}
                            class="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors disabled:opacity-50">
                            <span class="material-symbols-outlined text-xl">fork_right</span>
                            {isForking ? 'Forking...' : 'Fork Style'}
                        </button>
                    </div>
                {/if}
            </div>

            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 relative overflow-hidden">
                {#if previewLoading}
                    <div class="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                        <span class="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                    </div>
                {/if}
                
                <ComprehensivePreview {previewSet} />
            </div>
        </div>
    {/if}
</div>
