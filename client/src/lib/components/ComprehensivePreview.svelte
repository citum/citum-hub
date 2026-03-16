<script lang="ts">
import LivePreview from "./LivePreview.svelte";

interface PreviewSet {
	in_text_parenthetical: string | null;
	in_text_narrative: string | null;
	note: string | null;
	bibliography: string | null;
}

let {
	previewSet,
	title = "Comprehensive Preview",
	subtitle = "Review how this style handles common citation scenarios across your document.",
} = $props<{
	previewSet: PreviewSet | null;
	title?: string;
	subtitle?: string;
}>();
</script>

<div class="w-full flex flex-col gap-12">
	<!-- Section Header -->
	<div class="border-b border-slate-100 pb-6">
		<h2 class="text-3xl font-black text-slate-900 leading-tight">
			{title}
		</h2>
		<p class="text-slate-500 text-sm mt-2">
			{subtitle}
		</p>
	</div>

	{#if previewSet}
		<!-- In-Text Citations (Show for Author-Date/Label) -->
		{#if previewSet.in_text_parenthetical || previewSet.in_text_narrative}
			<section class="flex flex-col gap-4">
				<h3 class="text-xs font-black uppercase tracking-widest text-slate-400">
					In-Text Citations
				</h3>

				{#if previewSet.in_text_parenthetical}
					<div class="flex flex-col gap-2">
						<span class="text-[10px] font-bold uppercase tracking-widest text-slate-400"
							>Parenthetical</span
						>
						<div
							class="p-6 bg-slate-50 border border-slate-100 rounded-2xl font-serif text-lg leading-relaxed text-slate-800"
						>
							<LivePreview html={previewSet.in_text_parenthetical} />
						</div>
					</div>
				{/if}

				{#if previewSet.in_text_narrative}
					<div class="flex flex-col gap-2">
						<span class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2"
							>Narrative</span
						>
						<div
							class="p-6 bg-slate-50 border border-slate-100 rounded-2xl font-serif text-lg leading-relaxed text-slate-800"
						>
							<LivePreview html={previewSet.in_text_narrative} />
						</div>
					</div>
				{/if}
			</section>
		{/if}

		<!-- Note Preview (Show for Note-based styles) -->
		{#if previewSet.note}
			<section class="flex flex-col gap-4">
				<h3 class="text-xs font-black uppercase tracking-widest text-slate-400">
					Footnote / Endnote Body
				</h3>
				<div
					class="p-6 bg-slate-50 border border-slate-100 rounded-2xl font-serif text-lg leading-relaxed text-slate-800"
				>
					<LivePreview html={previewSet.note} />
				</div>
			</section>
		{/if}

		<!-- Bibliography Preview -->
		{#if previewSet.bibliography}
			<section class="flex flex-col gap-4">
				<h3 class="text-xs font-black uppercase tracking-widest text-slate-400">Bibliography</h3>
				<div
					class="p-6 bg-slate-50 border border-slate-100 rounded-2xl font-serif text-base leading-relaxed text-slate-700 flex flex-col gap-3"
				>
					<LivePreview html={previewSet.bibliography} />
				</div>
			</section>
		{/if}

		{#if !previewSet.in_text_parenthetical && !previewSet.in_text_narrative && !previewSet.note && !previewSet.bibliography}
			<div class="py-20 text-center flex flex-col items-center gap-4">
				<div
					class="size-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300"
				>
					<span class="material-symbols-outlined text-4xl">visibility_off</span>
				</div>
				<p class="text-slate-400 font-medium max-w-xs transition-opacity duration-300">
					No preview data available for this configuration.
				</p>
			</div>
		{/if}
	{:else}
		<div class="py-40 text-center">
			<div class="animate-pulse flex flex-col items-center gap-4">
				<div class="h-4 w-48 bg-slate-100 rounded-full"></div>
				<div class="h-32 w-full bg-slate-50 rounded-2xl"></div>
			</div>
		</div>
	{/if}
</div>
