# svelte-components

Convert design specs or descriptions into well-structured Svelte 5 components for citum-hub.

## Stack

- **Svelte 5** runes syntax: `$state`, `$derived`, `$effect`, `$props`
- **TypeScript** strict mode — explicit types, no `any`
- **Tailwind CSS 4** utility classes — no inline styles
- **SvelteKit** conventions — `+page.svelte`, `+layout.svelte`, `+page.server.ts`

## Rules

1. One component per file, max 300 lines
2. Use runes, never legacy `writable`/`readable` stores
3. Props typed with `interface Props` and destructured via `let { ... }: Props = $props()`
4. Explicit return types on all functions
5. Early returns / guard clauses in event handlers
6. No reactive statements (`$:`) — use `$derived` / `$effect` instead

## Output Format

For each component, output:

```
### ComponentName.svelte
<script lang="ts">
  // imports, props, state
</script>

<!-- markup -->

<style>
  /* only if truly needed; prefer Tailwind */
</style>
```

Then a short usage example showing how to import and use it.

## Trigger

Use this skill when the user says `/svelte-components` or asks to convert a design/spec into Svelte components for citum-hub.
