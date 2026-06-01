import { browser } from "$app/environment";
import type { PreviewResult, StyleFamily } from "$lib/types/wizard";
import { PREVIEW_REFERENCE_SETS } from "$lib/data/preview-fixtures";
import {
	emptyPreview,
	type FormatDocumentResult,
	mapDocumentPreview,
} from "$lib/utils/document-preview";

type CitumEngine = typeof import("@citum/engine");

let enginePromise: Promise<CitumEngine> | null = null;

interface PreviewRenderOptions {
	testLocator?: string;
	referenceType?: string;
	previewContext?: string;
	injectAstIndices?: boolean;
}

async function loadEngine(): Promise<CitumEngine> {
	if (!browser) {
		throw new Error("Browser WASM renderer is only available in the browser.");
	}

	enginePromise ??= import("@citum/engine").then(async (mod) => {
		await mod.default();
		return mod;
	});

	return enginePromise;
}

async function renderViaServer(
	styleYaml: string,
	family: StyleFamily | null,
	options: PreviewRenderOptions = {}
): Promise<PreviewResult> {
	const res = await fetch("/api/v1/preview", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			citum: styleYaml,
			class:
				family === "author-date"
					? "author_date"
					: family === "note"
						? "footnote"
						: family === "numeric"
							? "numeric"
							: undefined,
			test_locator: options.testLocator || undefined,
			reference_type: options.referenceType || undefined,
			preview_context: options.previewContext || undefined,
			inject_ast_indices: options.injectAstIndices || undefined,
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
		disambiguation: data.disambiguation ?? null,
		bibliography: data.bibliography ?? null,
	};
}

export async function generateStyleFromIntent(intent: Record<string, unknown>): Promise<string> {
	const res = await fetch("/api/v1/generate", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(intent),
	});
	if (!res.ok) throw new Error(`Generate failed: ${res.status}`);
	return res.text();
}

export async function materializeStyle(styleYaml: string): Promise<string> {
	const engine = await loadEngine();
	return engine.materializeStyle(styleYaml);
}

export async function validateStyle(styleYaml: string): Promise<string | null> {
	try {
		const engine = await loadEngine();
		engine.validateStyle(styleYaml);
		return null;
	} catch (error) {
		return error instanceof Error ? error.message : String(error);
	}
}

export async function renderStylePreview(
	styleYaml: string,
	family: StyleFamily | null,
	options: PreviewRenderOptions = {}
): Promise<PreviewResult> {
	if (!styleYaml.trim()) {
		return emptyPreview();
	}

	if (
		!browser ||
		!family ||
		options.referenceType ||
		options.testLocator ||
		options.previewContext ||
		options.injectAstIndices
	) {
		return renderViaServer(styleYaml, family, options);
	}

	try {
		const engine = await loadEngine();
		const fixture = PREVIEW_REFERENCE_SETS[family];
		const result = JSON.parse(
			engine.formatDocument(
				JSON.stringify({
					style: { kind: "yaml", value: styleYaml },
					refs: { kind: "json", value: fixture.references },
					output_format: "html",
					citations: fixture.citations,
				})
			)
		) as FormatDocumentResult;

		return mapDocumentPreview(result, family, styleYaml);
	} catch {
		return renderViaServer(styleYaml, family, options);
	}
}
