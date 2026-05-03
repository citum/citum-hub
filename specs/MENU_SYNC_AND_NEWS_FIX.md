# Design Doc: Citum Global Menu Sync and News 404 Fix

## Problem
The Citum Hub placeholder site (`hub.citum.org`) and the SvelteKit app (`client/`) have inconsistent navigation menus compared to the main documentation site (`docs.citum.org`). Additionally, the recently merged "News" support is resulting in 404 errors on the published site, likely due to missing pages in the static site deployment.

## Goals
1. **Synchronize Navigation:** Align the menus on `hub.citum.org` and the SvelteKit app with the global Citum menu.
2. **Resolve 404 Errors:** Create placeholder pages for "News" and "Demo" in the `site/` directory to prevent 404s while the full content is being finalized.
3. **Consistency:** Ensure a seamless transition between different Citum subdomains.

## Proposed Changes

### 1. Update Global Navigation Menu
The source of truth for the menu is `docs.citum.org`:
- Home: `https://citum.org`
- Docs: `https://docs.citum.org`
- News: `https://citum.org/news` (or `https://docs.citum.org/news`?) -> We will use the correct absolute URLs.
- Demo: `https://citum.org/demo`
- Examples: `https://docs.citum.org/examples`
- Style Guide: `https://docs.citum.org/style-guide`
- Reports: `https://docs.citum.org/reports`
- GitHub: `https://github.com/citum`

### 2. Static Site Updates (`site/`)
- **`site/index.html`**: Update the `<nav>` section to include the full list of links.
- **`site/news/index.html`**: Add a new directory and file. This will be a simple "Coming Soon" or redirect page to resolve the 404.
- **`site/demo/index.html`**: Add a similar placeholder for the Demo section.

### 3. SvelteKit App Updates (`client/`)
- **`client/src/routes/+layout.svelte`**: Update the `<header>` and `<footer>` components to include the full global menu.
- **`client/src/routes/news/`**: (Optional) Add a route in the Svelte app if it should also support news.

## Implementation Details

### Menu structure for `site/index.html` and placeholders:
```html
<nav class="flex gap-1 flex-wrap justify-end" aria-label="Global">
  <a class="nav-link" href="https://citum.org">Home</a>
  <a class="nav-link" href="https://docs.citum.org">Docs</a>
  <a class="nav-link" href="https://citum.org/news">News</a>
  <a class="nav-link" href="https://citum.org/demo">Demo</a>
  <a class="nav-link" href="https://hub.citum.org" aria-current="page">Hub</a>
  <a class="nav-link" href="https://github.com/citum">GitHub</a>
</nav>
```

### New File: `site/news/index.html`
A simple HTML file that matches the styling of `site/index.html`.

### New File: `site/demo/index.html`
A simple HTML file that matches the styling of `site/index.html`.

## Verification Plan
1. **Manual Inspection:** Check the updated `site/index.html` and new pages locally.
2. **Link Verification:** Ensure all URLs in the menu point to the intended destinations.
3. **SvelteKit Check:** Run `bun run check` in the `client/` directory to ensure no regressions.
