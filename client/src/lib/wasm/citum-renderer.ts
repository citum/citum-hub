import { browser } from "$app/environment";
import type { PreviewResult, StyleFamily } from "$lib/types/wizard";
import { PREVIEW_REFERENCE_SETS } from "$lib/data/preview-fixtures";
import { normalizeCitationPreviewHtml } from "$lib/utils/preview-output";

type WasmBridge = typeof import("./pkg/wasm_bridge");

let bridgePromise: Promise<WasmBridge> | null = null;

async function loadBridge(): Promise<WasmBridge> {
	if (!browser) {
		throw new Error("Browser WASM renderer is only available in the browser.");
	}

	bridgePromise ??= import("./pkg/wasm_bridge").then(async (mod) => {
		await mod.default();
		return mod;
	});

	return bridgePromise;
}

async function renderViaServer(styleYaml: string, family: StyleFamily): Promise<PreviewResult> {
	const res = await fetch("/api/v1/preview", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			citum: styleYaml,
			class: family === "author-date" ? "author_date" : family === "note" ? "footnote" : "numeric",
		}),
	});

	if (!res.ok) {
		throw new Error(`Preview failed: ${res.status}`);
	}

	const data = await res.json();
	return {
		parenthetical: data.in_text_parenthetical ?? null,
		narrative: data.in_text_narrative ?? null,
		note: data.note ?? null,
		bibliography: data.bibliography ?? null,
	};
}

export async function generateStyleFromIntent(intent: Record<string, unknown>): Promise<string> {
	if (!browser) {
		const res = await fetch("/api/v1/generate", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(intent),
		});
		if (!res.ok) throw new Error(`Generate failed: ${res.status}`);
		return res.text();
	}

	const bridge = await loadBridge();
	return bridge.generate_style(JSON.stringify(intent));
}

export async function materializeStyle(styleYaml: string): Promise<string> {
	const bridge = await loadBridge();
	return bridge.materializeStyle(styleYaml);
}

export async function validateStyle(styleYaml: string): Promise<string | null> {
	try {
		const bridge = await loadBridge();
		bridge.validateStyle(styleYaml);
		return null;
	} catch (error) {
		return error instanceof Error ? error.message : String(error);
	}
}

export async function renderStylePreview(
	styleYaml: string,
	family: StyleFamily
): Promise<PreviewResult> {
	if (!styleYaml.trim()) {
		return { parenthetical: null, narrative: null, note: null, bibliography: null };
	}

	if (!browser) {
		return renderViaServer(styleYaml, family);
	}

	try {
		const bridge = await loadBridge();
		const fixture = PREVIEW_REFERENCE_SETS[family];
		const refs = JSON.stringify(fixture.references);
		const parentheticalCitation = JSON.stringify(fixture.citations.parenthetical);
		const narrativeCitation = JSON.stringify(fixture.citations.narrative);

		const parenthetical = normalizeCitationPreviewHtml(
			bridge.renderCitation(styleYaml, refs, parentheticalCitation, "non-integral")
		);
		const narrative = normalizeCitationPreviewHtml(
			bridge.renderCitation(styleYaml, refs, narrativeCitation, "integral")
		);
		const bibliography = bridge.renderBibliography(styleYaml, refs);

		if (family === "note") {
			return {
				parenthetical: null,
				narrative: null,
				note: parenthetical,
				bibliography,
			};
		}

		return {
			parenthetical,
			narrative,
			note: null,
			bibliography,
		};
	} catch {
		return renderViaServer(styleYaml, family);
	}
}
