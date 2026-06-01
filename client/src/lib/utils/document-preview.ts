import { PREVIEW_REFERENCE_SETS } from "$lib/data/preview-fixtures";
import type { PreviewResult, StyleFamily } from "$lib/types/wizard";
import { normalizeCitationPreviewHtml } from "$lib/utils/preview-output";
import yaml from "js-yaml";

export interface FormatDocumentCitation {
	id: string;
	text: string;
	ref_ids?: string[];
}

export interface FormatDocumentResult {
	formatted_citations:
		| FormatDocumentCitation[]
		| Record<string, Omit<FormatDocumentCitation, "id"> & { id?: string }>;
	bibliography?: { content?: string | null } | null;
	warnings?: unknown[];
}

export function emptyPreview(): PreviewResult {
	return {
		parenthetical: null,
		narrative: null,
		note: null,
		disambiguation: null,
		bibliography: null,
	};
}

export function styleHasBibliography(styleYaml: string): boolean {
	try {
		const parsed = yaml.load(styleYaml);
		if (!parsed || typeof parsed !== "object") return true;
		return (parsed as Record<string, unknown>).bibliography !== null;
	} catch {
		return true;
	}
}

function citationsById(result: FormatDocumentResult): Map<string, string> {
	const citations = result.formatted_citations;
	if (Array.isArray(citations)) {
		return new Map(
			citations.map((citation) => [citation.id, normalizeCitationPreviewHtml(citation.text)])
		);
	}

	return new Map(
		Object.entries(citations).map(([id, citation]) => [
			id,
			normalizeCitationPreviewHtml(citation.text),
		])
	);
}

function hasDistinctAuthorDateDisambiguation(citations: Map<string, string>): boolean {
	const first = citations.get("author-date-disambiguation-a");
	const second = citations.get("author-date-disambiguation-b");
	return Boolean(first && second && first !== second);
}

export function mapDocumentPreview(
	result: FormatDocumentResult,
	family: StyleFamily,
	styleYaml: string
): PreviewResult {
	const fixture = PREVIEW_REFERENCE_SETS[family];
	const citations = citationsById(result);

	if (result.warnings?.length) {
		console.warn("Citum preview warnings", result.warnings);
	}

	if (family === "note") {
		return {
			parenthetical: null,
			narrative: null,
			note: fixture.slots.note ? (citations.get(fixture.slots.note) ?? null) : null,
			disambiguation: null,
			bibliography: styleHasBibliography(styleYaml) ? (result.bibliography?.content ?? null) : null,
		};
	}

	const disambiguationId = fixture.slots.disambiguation;
	const disambiguation =
		family === "author-date" && disambiguationId && hasDistinctAuthorDateDisambiguation(citations)
			? (citations.get(disambiguationId) ?? null)
			: null;

	return {
		parenthetical: fixture.slots.parenthetical
			? (citations.get(fixture.slots.parenthetical) ?? null)
			: null,
		narrative: fixture.slots.narrative ? (citations.get(fixture.slots.narrative) ?? null) : null,
		note: null,
		disambiguation,
		bibliography: styleHasBibliography(styleYaml) ? (result.bibliography?.content ?? null) : null,
	};
}
