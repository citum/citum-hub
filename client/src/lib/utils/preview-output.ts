export function normalizeCitationPreviewHtml(html: string): string {
	return html.replace(/<\/span>,\s*(<span class="csln-variable">,\s*)/g, "</span>$1");
}
