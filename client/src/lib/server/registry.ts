import path from "node:path";
import fs from "node:fs/promises";
import yaml from "js-yaml";
// @ts-expect-error - Bun is the runtime for the API and scripts that import this module.
import { file, sql } from "bun";

const PROJECT_ROOT = path.resolve(process.cwd(), "..");
const CITUM_CORE_PATH =
	process.env.CITUM_CORE_PATH || path.resolve(PROJECT_ROOT, "..", "citum-core");
const CORE_STYLES_DIR = path.join(CITUM_CORE_PATH, "styles");
const CORE_DEPENDENT_DIR = path.join(CITUM_CORE_PATH, "styles-legacy", "dependent");
const CORE_DEFAULT_REGISTRY_PATH = path.join(CITUM_CORE_PATH, "registry", "default.yaml");
const SYSTEM_USER_EMAIL = "system@citum.org";

const TOOL_ALIASES_BY_TARGET: Record<string, string[]> = {
	"apa-7th": ["apa 7", "apa 7th edition", "pandoc apa", "zotero apa", "mendeley apa"],
	"american-medical-association": ["ama", "mendeley ama"],
	"chicago-shortened-notes-bibliography": ["chicago notes", "turabian notes"],
	"elsevier-vancouver": ["vancouver", "mendeley vancouver"],
	ieee: ["ieee references", "pandoc ieee", "zotero ieee"],
	"modern-language-association": ["mla", "mla works cited"],
	"taylor-and-francis-chicago-author-date": ["chicago author date"],
};

type RegistrySlug = "core-default" | "hub-primary" | "hub-candidates";
type TargetKind = "builtin" | "path";
type EntryStatus = "active" | "candidate" | "disabled";
type SourceKind = "csl-dependent" | "manual" | "crossref-enriched" | "tool-alias";
type NameKind = "title" | "title_short" | "issn" | "publisher_name" | "tool_alias" | "legacy_slug";

type StyleRow = {
	id: string;
	user_id: string;
	title: string;
	filename: string | null;
	intent: string | Record<string, unknown> | null;
	citum: string | null;
	is_public: boolean;
	created_at: string;
	updated_at: string;
};

type RegistryRow = {
	id: string;
	slug: RegistrySlug | string;
	name: string;
	scope: string;
	is_primary: boolean;
	visibility: string;
	format_version: string;
};

type RegistryEntryRecord = {
	id: string;
	registry_id: string;
	entry_slug: string;
	display_title: string;
	description: string | null;
	fields: string[] | null;
	citation_format: string | null;
	target_kind: TargetKind | null;
	target_ref: string | null;
	target_style_id: string | null;
	parent_style_slug: string | null;
	status: EntryStatus;
	source_kind: SourceKind;
	source_ref: string | null;
	last_synced_at: string | null;
	metadata: Record<string, unknown> | string | null;
	created_at: string;
	updated_at: string;
};

type RegistryEntryNameRecord = {
	id: string;
	entry_id: string;
	kind: NameKind;
	value: string;
	normalized_value: string;
	is_public: boolean;
	metadata: Record<string, unknown> | string | null;
};

type ParsedStyleMetadata = {
	title: string;
	description: string | null;
	fields: string[];
	shortName: string | null;
	edition: string | null;
	family: string;
	sourceLicense: string | null;
	originalAuthors: Array<{ name?: string | null }>;
	slugCandidates: string[];
};

type ParsedDependentStyle = {
	entrySlug: string;
	title: string;
	titleShort: string | null;
	description: string | null;
	fields: string[];
	citationFormat: string | null;
	parentStyleSlug: string | null;
	issns: string[];
	sourceRef: string;
};

type ResolvedTarget = {
	targetKind: TargetKind;
	targetRef: string;
	targetStyleId: string | null;
	resolvedSlug: string;
};

type ResolutionContext = {
	byParentSlug: Map<string, ResolvedTarget>;
	stylesById: Map<string, StyleRow>;
	stylesByKey: Map<string, StyleRow>;
	metadataByStyleId: Map<string, ParsedStyleMetadata>;
};

type SyncSummary = {
	entriesSeen: number;
	entriesUpserted: number;
	entriesHidden: number;
	entriesSkipped: number;
	activeCount: number;
	candidateCount: number;
};

export type HubStyleSummary = {
	id: string;
	title: string;
	filename: string | null;
	description: string | null;
	fields: string[];
	updated_at: string;
	short_name: string | null;
	edition: string | null;
	family: string;
	alias_count: number;
	preview_text: string;
	match_context: string | null;
};

export type HubSearchResponse = {
	items: HubStyleSummary[];
	total: number;
	page: number;
	page_size: number;
	filters: {
		fields: string[];
		families: string[];
	};
};

export type HubAliasRecord = {
	id: string;
	entry_slug: string;
	title: string;
	title_short: string | null;
	issns: string[];
	status: EntryStatus;
	last_synced_at: string | null;
	parent_style_slug: string | null;
};

export type HubStyleDetail = {
	style: HubStyleSummary & {
		citum: string | null;
		source_license: string | null;
		original_authors: Array<{ name?: string | null }>;
	};
	aliases: {
		total: number;
		items: HubAliasRecord[];
	};
	history: Array<{
		id: string;
		action: string;
		status: string;
		entries_seen: number;
		entries_upserted: number;
		entries_hidden: number;
		entries_skipped: number;
		message: string | null;
		started_at: string;
		finished_at: string;
	}>;
	permissions: {
		registry_name: string;
		scope: string;
		visibility: string;
		is_primary: boolean;
	};
};

type QueryHubStylesOptions = {
	q?: string;
	field?: string;
	family?: string;
	hasAliases?: boolean;
	page?: number;
	pageSize?: number;
};

type ImportRegistryOptions = {
	registrySlug?: RegistrySlug;
	format?: "yaml" | "json";
	body: string;
};

type ExportRegistryOptions = {
	registrySlug?: RegistrySlug;
	format?: "yaml" | "json";
};

type CoreRegistryDocument = {
	version: string;
	styles: Array<{
		id: string;
		aliases?: string[];
		builtin?: string;
		path?: string;
		description?: string;
		fields?: string[];
	}>;
};

function normalizeText(value: string) {
	return value
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[^\p{L}\p{N}]+/gu, " ")
		.trim();
}

function slugify(value: string) {
	return value
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[^\p{L}\p{N}]+/gu, "-")
		.replace(/^-+|-+$/g, "");
}

function humanizeSlug(slug: string) {
	return slug
		.split("-")
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function decodeXmlEntities(value: string) {
	return value
		.replace(/&amp;/g, "&")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&apos;/g, "'")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">");
}

function stripXmlTags(value: string) {
	return decodeXmlEntities(
		value
			.replace(/<[^>]+>/g, " ")
			.replace(/\s+/g, " ")
			.trim()
	);
}

function parseXmlAttributes(tag: string) {
	const attrs: Record<string, string> = {};
	const attrRegex = /([A-Za-z_:][A-Za-z0-9_.:-]*)\s*=\s*"([^"]*)"/g;
	for (const match of tag.matchAll(attrRegex)) {
		attrs[match[1]] = decodeXmlEntities(match[2]);
	}
	return attrs;
}

function getFirstTagContent(block: string, tagName: string) {
	const match = block.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
	return match ? stripXmlTags(match[1]) : null;
}

function getSelfClosingTags(block: string, tagName: string) {
	return Array.from(block.matchAll(new RegExp(`<${tagName}\\b[^>]*/>`, "gi")), (match) => match[0]);
}

function getOpeningClosingTags(block: string, tagName: string) {
	return Array.from(
		block.matchAll(new RegExp(`<${tagName}\\b[^>]*>[\\s\\S]*?<\\/${tagName}>`, "gi")),
		(match) => match[0]
	);
}

function familyLabelFromProcessing(processing: unknown) {
	switch (processing) {
		case "numeric":
			return "Numeric";
		case "note":
		case "footnote":
		case "endnote":
			return "Note-Based";
		case "author":
			return "Author";
		case "label":
			return "Label";
		case "author-date":
		default:
			return "Author-Date";
	}
}

function previewTextForFamily(family: string, title: string) {
	switch (family) {
		case "Numeric":
			return `[1] Example study rendered with ${title}.`;
		case "Note-Based":
			return `1. Example note citation rendered with ${title}.`;
		case "Author":
			return `Doe 127. Example text rendered with ${title}.`;
		case "Label":
			return `[Doe24] Example text rendered with ${title}.`;
		case "Author-Date":
		default:
			return `(Doe, 2024) Example text rendered with ${title}.`;
	}
}

function toPgTextArray(values: string[]) {
	const escaped = values.map(
		(value) => `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`
	);
	return `{${escaped.join(",")}}`;
}

async function getFilesByExtension(rootDir: string, extensions: string[]) {
	const results: string[] = [];
	const entries = await fs.readdir(rootDir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(rootDir, entry.name);
		if (entry.isDirectory()) {
			results.push(...(await getFilesByExtension(fullPath, extensions)));
			continue;
		}

		if (extensions.includes(path.extname(entry.name).toLowerCase())) {
			results.push(fullPath);
		}
	}

	return results;
}

async function ensureSystemUser() {
	const [user] = await sql`
        INSERT INTO users (email, role)
        VALUES (${SYSTEM_USER_EMAIL}, 'admin')
        ON CONFLICT (email) DO UPDATE SET role = 'admin'
        RETURNING id
    `;
	return user.id as string;
}

function shouldSyncStyle(filename: string) {
	return !filename.startsWith("experimental/") && !filename.startsWith("preset-bases/");
}

function parseStyleYamlMetadata(
	citum: string | null,
	fallbackTitle: string,
	filename?: string | null
): ParsedStyleMetadata {
	if (!citum) {
		return {
			title: fallbackTitle,
			description: null,
			fields: [],
			shortName: null,
			edition: null,
			family: "Author-Date",
			sourceLicense: null,
			originalAuthors: [],
			slugCandidates: [
				slugify(fallbackTitle),
				filename ? path.basename(filename, path.extname(filename)) : "",
			].filter(Boolean),
		};
	}

	try {
		const parsed = (yaml.load(citum) || {}) as Record<string, unknown>;
		const info = ((parsed.info as Record<string, unknown> | undefined) || {}) as Record<
			string,
			unknown
		>;
		const source = ((info.source as Record<string, unknown> | undefined) || {}) as Record<
			string,
			unknown
		>;
		const shortName =
			typeof info["short-name"] === "string"
				? info["short-name"]
				: typeof info.short_name === "string"
					? info.short_name
					: null;
		const edition = typeof info.edition === "string" ? info.edition : null;
		const options = ((parsed.options as Record<string, unknown> | undefined) || {}) as Record<
			string,
			unknown
		>;
		const processing = options.processing ?? parsed.class ?? "author-date";
		const title = typeof info.title === "string" ? info.title : fallbackTitle;
		const styleId = typeof info.id === "string" ? info.id : null;
		const slugCandidates = new Set<string>();
		slugCandidates.add(slugify(title));
		if (shortName) slugCandidates.add(slugify(shortName));
		if (styleId) slugCandidates.add(styleId.split("/").pop() || styleId);
		if (filename) {
			slugCandidates.add(path.basename(filename, path.extname(filename)));
		}

		return {
			title,
			description: typeof info.description === "string" ? info.description : null,
			fields: Array.isArray(info.fields) ? info.fields.map(String) : [],
			shortName,
			edition,
			family: familyLabelFromProcessing(
				typeof processing === "string" ? processing : "author-date"
			),
			sourceLicense: typeof source.license === "string" ? source.license : null,
			originalAuthors: Array.isArray(source["original-authors"])
				? source["original-authors"]
				: Array.isArray(source.original_authors)
					? source.original_authors
					: [],
			slugCandidates: Array.from(slugCandidates).filter(Boolean),
		};
	} catch {
		return {
			title: fallbackTitle,
			description: null,
			fields: [],
			shortName: null,
			edition: null,
			family: "Author-Date",
			sourceLicense: null,
			originalAuthors: [],
			slugCandidates: [
				slugify(fallbackTitle),
				filename ? path.basename(filename, path.extname(filename)) : "",
			].filter(Boolean),
		};
	}
}

async function syncCoreStyles() {
	const systemUserId = await ensureSystemUser();
	const files = await getFilesByExtension(CORE_STYLES_DIR, [".yaml", ".yml"]);
	const syncedStyles: StyleRow[] = [];

	for (const filePath of files) {
		const filename = path.relative(CORE_STYLES_DIR, filePath).replaceAll("\\", "/");
		if (!shouldSyncStyle(filename)) continue;

		const content = await file(filePath).text();
		const metadata = parseStyleYamlMetadata(
			content,
			humanizeSlug(path.basename(filename, path.extname(filename))),
			filename
		);
		const [row] = await sql`
            INSERT INTO styles (user_id, title, filename, intent, citum, is_public, updated_at)
            VALUES (${systemUserId}, ${metadata.title}, ${filename}, ${JSON.stringify({})}, ${content}, true, NOW())
            ON CONFLICT (filename) DO UPDATE SET
                title = EXCLUDED.title,
                intent = EXCLUDED.intent,
                citum = EXCLUDED.citum,
                is_public = true,
                updated_at = NOW()
            RETURNING *
        `;
		syncedStyles.push(row as StyleRow);
	}

	return syncedStyles;
}

async function getRegistries() {
	const registries = (await sql`SELECT * FROM registries ORDER BY slug ASC`) as RegistryRow[];
	return new Map(registries.map((registry) => [registry.slug, registry]));
}

async function ensureRegistrySeeded() {
	const [existing] = await sql`
        SELECT COUNT(*)::int AS count
        FROM registry_entries
        WHERE source_kind = 'csl-dependent'
    `;
	if ((existing?.count as number) > 0) {
		return;
	}
	await syncRegistryData();
}

function parseDependentStyleXml(xml: string, relativePath: string): ParsedDependentStyle | null {
	const infoMatch = xml.match(/<info\b[^>]*>([\s\S]*?)<\/info>/i);
	if (!infoMatch) return null;

	const infoBlock = infoMatch[1];
	const title =
		getFirstTagContent(infoBlock, "title") || humanizeSlug(path.basename(relativePath, ".csl"));
	const titleShort = getFirstTagContent(infoBlock, "title-short");
	const description = getFirstTagContent(infoBlock, "summary");
	const linkTags = [
		...getSelfClosingTags(infoBlock, "link"),
		...getOpeningClosingTags(infoBlock, "link"),
	];
	let parentStyleSlug: string | null = null;

	for (const tag of linkTags) {
		const attrs = parseXmlAttributes(tag);
		if (attrs.rel === "independent-parent" && attrs.href) {
			parentStyleSlug = attrs.href.split("/").pop() || attrs.href;
			break;
		}
	}

	const fields = new Set<string>();
	let citationFormat: string | null = null;
	for (const tag of [
		...getSelfClosingTags(infoBlock, "category"),
		...getOpeningClosingTags(infoBlock, "category"),
	]) {
		const attrs = parseXmlAttributes(tag);
		if (attrs.field) fields.add(attrs.field);
		if (!citationFormat && attrs["citation-format"]) {
			citationFormat = attrs["citation-format"];
		}
	}

	const issns = new Set<string>();
	for (const tag of getOpeningClosingTags(infoBlock, "issn")) {
		const content = stripXmlTags(tag.replace(/^<issn\b[^>]*>/i, "").replace(/<\/issn>$/i, ""));
		if (content) issns.add(content);
	}

	return {
		entrySlug: path.basename(relativePath, ".csl"),
		title,
		titleShort,
		description,
		fields: Array.from(fields),
		citationFormat,
		parentStyleSlug,
		issns: Array.from(issns),
		sourceRef: relativePath,
	};
}

function isLocaleVariantEntry(entrySlug: string, parentStyleSlug: string | null) {
	if (!parentStyleSlug) return false;
	if (!entrySlug.startsWith(`${parentStyleSlug}-`)) return false;

	const suffix = entrySlug.slice(parentStyleSlug.length + 1);
	return /^[a-z]{2}(?:-[A-Za-z]{2,4})?$/.test(suffix);
}

async function buildResolutionContext(): Promise<ResolutionContext> {
	const styles = (await syncCoreStyles()) as StyleRow[];
	const stylesById = new Map<string, StyleRow>();
	const stylesByKey = new Map<string, StyleRow>();
	const metadataByStyleId = new Map<string, ParsedStyleMetadata>();
	const byParentSlug = new Map<string, ResolvedTarget>();
	const defaultRegistry = (yaml.load(await file(CORE_DEFAULT_REGISTRY_PATH).text()) || {
		version: "1",
		styles: [],
	}) as CoreRegistryDocument;

	for (const style of styles) {
		stylesById.set(style.id, style);
		const metadata = parseStyleYamlMetadata(style.citum, style.title, style.filename);
		metadataByStyleId.set(style.id, metadata);
		stylesByKey.set(style.id, style);
		if (style.filename) {
			stylesByKey.set(style.filename, style);
			stylesByKey.set(path.basename(style.filename, path.extname(style.filename)), style);
		}
		for (const slug of metadata.slugCandidates) {
			stylesByKey.set(slug, style);
			byParentSlug.set(slug, {
				targetKind: "path",
				targetRef: style.filename || `${slug}.yaml`,
				targetStyleId: style.id,
				resolvedSlug: slug,
			});
		}
	}

	for (const entry of defaultRegistry.styles || []) {
		const targetRef = entry.builtin || entry.path;
		if (!targetRef) continue;
		const targetStyle = stylesByKey.get(entry.id) || stylesByKey.get(targetRef);
		const resolvedTarget: ResolvedTarget = {
			targetKind: entry.builtin ? "builtin" : "path",
			targetRef,
			targetStyleId: targetStyle?.id ?? null,
			resolvedSlug: entry.id,
		};
		byParentSlug.set(entry.id, resolvedTarget);
		for (const alias of entry.aliases || []) {
			byParentSlug.set(alias, resolvedTarget);
		}
	}

	return { byParentSlug, stylesById, stylesByKey, metadataByStyleId };
}

async function createSyncRun(
	registryId: string,
	action: "sync" | "import" | "export",
	status: "started" | "completed" | "failed",
	summary: Partial<SyncSummary> & {
		message?: string | null;
		metadata?: Record<string, unknown>;
	} = {}
) {
	const [run] = await sql`
        INSERT INTO registry_sync_runs (
            registry_id,
            action,
            status,
            entries_seen,
            entries_upserted,
            entries_hidden,
            entries_skipped,
            message,
            metadata,
            finished_at
        )
        VALUES (
            ${registryId},
            ${action},
            ${status},
            ${summary.entriesSeen ?? 0},
            ${summary.entriesUpserted ?? 0},
            ${summary.entriesHidden ?? 0},
            ${summary.entriesSkipped ?? 0},
            ${summary.message ?? null},
            ${JSON.stringify(summary.metadata ?? {})},
            NOW()
        )
        RETURNING id
    `;
	return run.id as string;
}

async function upsertRegistryEntry(
	registryId: string,
	entry: {
		entrySlug: string;
		displayTitle: string;
		description: string | null;
		fields: string[];
		citationFormat: string | null;
		targetKind: TargetKind | null;
		targetRef: string | null;
		targetStyleId: string | null;
		parentStyleSlug: string | null;
		status: EntryStatus;
		sourceKind: SourceKind;
		sourceRef: string | null;
		lastSyncedAt: string;
		metadata: Record<string, unknown>;
	}
) {
	const [row] = await sql`
        INSERT INTO registry_entries (
            registry_id,
            entry_slug,
            display_title,
            description,
            fields,
            citation_format,
            target_kind,
            target_ref,
            target_style_id,
            parent_style_slug,
            status,
            source_kind,
            source_ref,
            last_synced_at,
            metadata
        )
        VALUES (
            ${registryId},
            ${entry.entrySlug},
            ${entry.displayTitle},
            ${entry.description},
            ${toPgTextArray(entry.fields)},
            ${entry.citationFormat},
            ${entry.targetKind},
            ${entry.targetRef},
            ${entry.targetStyleId},
            ${entry.parentStyleSlug},
            ${entry.status},
            ${entry.sourceKind},
            ${entry.sourceRef},
            ${entry.lastSyncedAt},
            ${JSON.stringify(entry.metadata)}
        )
        ON CONFLICT (registry_id, entry_slug) DO UPDATE SET
            display_title = EXCLUDED.display_title,
            description = EXCLUDED.description,
            fields = EXCLUDED.fields,
            citation_format = EXCLUDED.citation_format,
            target_kind = EXCLUDED.target_kind,
            target_ref = EXCLUDED.target_ref,
            target_style_id = EXCLUDED.target_style_id,
            parent_style_slug = EXCLUDED.parent_style_slug,
            status = EXCLUDED.status,
            source_kind = EXCLUDED.source_kind,
            source_ref = EXCLUDED.source_ref,
            last_synced_at = EXCLUDED.last_synced_at,
            metadata = EXCLUDED.metadata,
            updated_at = NOW()
        RETURNING id
    `;
	return row.id as string;
}

async function replaceEntryNames(
	entryId: string,
	names: Array<{
		kind: NameKind;
		value: string;
		isPublic?: boolean;
		metadata?: Record<string, unknown>;
	}>
) {
	await sql`DELETE FROM registry_entry_names WHERE entry_id = ${entryId}`;
	for (const name of names) {
		const normalizedValue = normalizeText(name.value);
		if (!normalizedValue) continue;
		await sql`
            INSERT INTO registry_entry_names (
                entry_id,
                kind,
                value,
                normalized_value,
                is_public,
                metadata
            )
            VALUES (
                ${entryId},
                ${name.kind},
                ${name.value},
                ${normalizedValue},
                ${name.isPublic ?? true},
                ${JSON.stringify(name.metadata ?? {})}
            )
            ON CONFLICT (entry_id, kind, normalized_value) DO UPDATE SET
                value = EXCLUDED.value,
                is_public = EXCLUDED.is_public,
                metadata = EXCLUDED.metadata
        `;
	}
}

async function syncCoreDefaultRegistry(coreRegistryId: string, context: ResolutionContext) {
	const doc = (yaml.load(await file(CORE_DEFAULT_REGISTRY_PATH).text()) || {
		version: "1",
		styles: [],
	}) as CoreRegistryDocument;

	let entriesUpserted = 0;
	for (const entry of doc.styles || []) {
		const targetRef = entry.builtin || entry.path || null;
		const targetStyle = targetRef
			? context.stylesByKey.get(entry.id) || context.stylesByKey.get(targetRef)
			: null;
		const entryId = await upsertRegistryEntry(coreRegistryId, {
			entrySlug: entry.id,
			displayTitle: humanizeSlug(entry.id),
			description: entry.description || null,
			fields: (entry.fields || []).map(String),
			citationFormat: null,
			targetKind: entry.builtin ? "builtin" : entry.path ? "path" : null,
			targetRef,
			targetStyleId: targetStyle?.id ?? null,
			parentStyleSlug: entry.id,
			status: "active",
			sourceKind: "manual",
			sourceRef: "registry/default.yaml",
			lastSyncedAt: new Date().toISOString(),
			metadata: {},
		});
		await replaceEntryNames(
			entryId,
			(entry.aliases || []).map((alias) => ({ kind: "tool_alias", value: alias }))
		);
		entriesUpserted += 1;
	}
	return entriesUpserted;
}

export async function syncRegistryData(): Promise<SyncSummary> {
	const context = await buildResolutionContext();
	const registries = await getRegistries();
	const coreDefaultRegistry = registries.get("core-default");
	const primaryRegistry = registries.get("hub-primary");
	const candidateRegistry = registries.get("hub-candidates");

	if (!coreDefaultRegistry || !primaryRegistry || !candidateRegistry) {
		throw new Error("Registry seed rows are missing. Run migrations first.");
	}

	const defaultEntriesUpserted = await syncCoreDefaultRegistry(coreDefaultRegistry.id, context);

	const dependentAbsolutePaths = await getFilesByExtension(CORE_DEPENDENT_DIR, [".csl"]);
	let entriesSeen = 0;
	let entriesUpserted = defaultEntriesUpserted;
	let entriesHidden = 0;
	let entriesSkipped = 0;
	let activeCount = 0;
	let candidateCount = 0;
	const nowIso = new Date().toISOString();

	for (const absolutePath of dependentAbsolutePaths) {
		const relativePath = path.relative(CORE_DEPENDENT_DIR, absolutePath).replaceAll("\\", "/");
		const parsed = parseDependentStyleXml(await file(absolutePath).text(), relativePath);
		if (!parsed) {
			entriesSkipped += 1;
			continue;
		}

		if (isLocaleVariantEntry(parsed.entrySlug, parsed.parentStyleSlug)) {
			entriesSkipped += 1;
			continue;
		}

		entriesSeen += 1;
		const resolved = parsed.parentStyleSlug
			? context.byParentSlug.get(parsed.parentStyleSlug)
			: null;
		const status: EntryStatus = resolved ? "active" : "candidate";
		const registryId = resolved ? primaryRegistry.id : candidateRegistry.id;
		const metadata: Record<string, unknown> = {
			title_short: parsed.titleShort,
			issns: parsed.issns,
		};
		const entryId = await upsertRegistryEntry(registryId, {
			entrySlug: parsed.entrySlug,
			displayTitle: parsed.title,
			description:
				parsed.description ||
				(parsed.parentStyleSlug
					? `Alias of ${humanizeSlug(resolved?.resolvedSlug || parsed.parentStyleSlug)}.`
					: "Imported dependent style alias."),
			fields: parsed.fields,
			citationFormat: parsed.citationFormat,
			targetKind: resolved?.targetKind ?? null,
			targetRef: resolved?.targetRef ?? null,
			targetStyleId: resolved?.targetStyleId ?? null,
			parentStyleSlug: parsed.parentStyleSlug,
			status,
			sourceKind: "csl-dependent",
			sourceRef: parsed.sourceRef,
			lastSyncedAt: nowIso,
			metadata,
		});

		const names = [
			{ kind: "title" as const, value: parsed.title },
			{ kind: "legacy_slug" as const, value: parsed.entrySlug },
			...(parsed.titleShort ? [{ kind: "title_short" as const, value: parsed.titleShort }] : []),
			...parsed.issns.map((issn) => ({ kind: "issn" as const, value: issn })),
			...((resolved?.targetRef && TOOL_ALIASES_BY_TARGET[resolved.targetRef]) || []).map(
				(alias) => ({
					kind: "tool_alias" as const,
					value: alias,
				})
			),
		];
		await replaceEntryNames(entryId, names);
		entriesUpserted += 1;

		if (status === "active") {
			activeCount += 1;
		} else {
			candidateCount += 1;
			entriesHidden += 1;
		}
	}

	await createSyncRun(primaryRegistry.id, "sync", "completed", {
		entriesSeen,
		entriesUpserted: activeCount,
		entriesHidden: 0,
		entriesSkipped,
		message: "Primary registry sync completed.",
		metadata: { activeCount },
	});
	await createSyncRun(candidateRegistry.id, "sync", "completed", {
		entriesSeen,
		entriesUpserted: candidateCount,
		entriesHidden,
		entriesSkipped,
		message: "Candidate registry sync completed.",
		metadata: { candidateCount },
	});

	return {
		entriesSeen,
		entriesUpserted,
		entriesHidden,
		entriesSkipped,
		activeCount,
		candidateCount,
	};
}

async function getPublicStyleRows() {
	await ensureRegistrySeeded();
	return (await sql`
        SELECT *
        FROM styles
        WHERE is_public = true
          AND (filename IS NULL OR filename NOT LIKE 'experimental/%')
        ORDER BY updated_at DESC, title ASC
    `) as StyleRow[];
}

async function getActiveRegistryEntries() {
	await ensureRegistrySeeded();
	return (await sql`
        SELECT re.*, r.slug AS registry_slug
        FROM registry_entries re
        JOIN registries r ON r.id = re.registry_id
        WHERE r.slug = 'hub-primary'
          AND re.status = 'active'
        ORDER BY re.display_title ASC
    `) as Array<RegistryEntryRecord & { registry_slug: string }>;
}

async function getRegistryEntryNames(entryIds: string[]) {
	if (entryIds.length === 0) return [] as RegistryEntryNameRecord[];
	const values = entryIds.map((entryId) => `'${entryId.replaceAll("'", "''")}'`).join(", ");
	return (await sql.unsafe(`
        SELECT *
        FROM registry_entry_names
        WHERE entry_id IN (${values})
    `)) as RegistryEntryNameRecord[];
}

function matchScore(query: string, summary: HubStyleSummary, aliasNames: string[]) {
	if (!query) return 0;
	const normalizedQuery = normalizeText(query);
	let score = 0;

	const candidates = [
		summary.title,
		summary.description || "",
		summary.short_name || "",
		summary.edition || "",
		...summary.fields,
		...aliasNames,
	];

	for (const candidate of candidates) {
		const normalizedCandidate = normalizeText(candidate);
		if (!normalizedCandidate) continue;
		if (normalizedCandidate === normalizedQuery) score += 80;
		else if (normalizedCandidate.startsWith(normalizedQuery)) score += 40;
		else if (normalizedCandidate.includes(normalizedQuery)) score += 20;
	}

	if (summary.alias_count > 0) score += 3;
	return score;
}

export async function queryHubStyles(
	options: QueryHubStylesOptions = {}
): Promise<HubSearchResponse> {
	const styleRows = await getPublicStyleRows();
	const entries = await getActiveRegistryEntries();
	const names = await getRegistryEntryNames(entries.map((entry) => entry.id));
	const namesByEntryId = new Map<string, RegistryEntryNameRecord[]>();
	for (const name of names) {
		const bucket = namesByEntryId.get(name.entry_id) || [];
		bucket.push(name);
		namesByEntryId.set(name.entry_id, bucket);
	}

	const aliasGroups = new Map<string, { count: number; matched: Set<string> }>();
	const query = options.q?.trim() || "";
	const normalizedQuery = normalizeText(query);
	for (const entry of entries) {
		if (!entry.target_style_id) continue;
		const bucket = aliasGroups.get(entry.target_style_id) || {
			count: 0,
			matched: new Set<string>(),
		};
		bucket.count += 1;
		for (const name of namesByEntryId.get(entry.id) || []) {
			if (normalizedQuery && normalizeText(name.value).includes(normalizedQuery)) {
				bucket.matched.add(name.value);
			}
		}
		if (normalizedQuery && normalizeText(entry.display_title).includes(normalizedQuery)) {
			bucket.matched.add(entry.display_title);
		}
		aliasGroups.set(entry.target_style_id, bucket);
	}

	const styleSummaries = styleRows.map((style) => {
		const metadata = parseStyleYamlMetadata(style.citum, style.title, style.filename);
		const aliasGroup = aliasGroups.get(style.id);
		const matchContext =
			aliasGroup && aliasGroup.matched.size > 0
				? `Matched aliases: ${Array.from(aliasGroup.matched).slice(0, 3).join(", ")}`
				: null;
		return {
			id: style.id,
			title: metadata.title,
			filename: style.filename,
			description: metadata.description,
			fields: metadata.fields,
			updated_at: style.updated_at,
			short_name: metadata.shortName,
			edition: metadata.edition,
			family: metadata.family,
			alias_count: aliasGroup?.count || 0,
			preview_text: previewTextForFamily(metadata.family, metadata.shortName || metadata.title),
			match_context: matchContext,
		} satisfies HubStyleSummary;
	});

	const filtered = styleSummaries
		.filter((style) => !options.field || style.fields.includes(options.field))
		.filter((style) => !options.family || style.family === options.family)
		.filter((style) => !options.hasAliases || style.alias_count > 0)
		.filter((style) => {
			if (!normalizedQuery) return true;
			const aliasNames =
				(aliasGroups.get(style.id)?.matched && Array.from(aliasGroups.get(style.id)!.matched)) ||
				[];
			return matchScore(normalizedQuery, style, aliasNames) > 0;
		})
		.sort((left, right) => {
			const leftNames =
				(aliasGroups.get(left.id)?.matched && Array.from(aliasGroups.get(left.id)!.matched)) || [];
			const rightNames =
				(aliasGroups.get(right.id)?.matched && Array.from(aliasGroups.get(right.id)!.matched)) ||
				[];
			const scoreDelta =
				matchScore(normalizedQuery, right, rightNames) -
				matchScore(normalizedQuery, left, leftNames);
			if (scoreDelta !== 0) return scoreDelta;
			return right.alias_count - left.alias_count || left.title.localeCompare(right.title);
		});

	const pageSize = Math.max(1, options.pageSize || 24);
	const page = Math.max(1, options.page || 1);
	const start = (page - 1) * pageSize;
	const items = filtered.slice(start, start + pageSize);
	const fields = Array.from(new Set(styleSummaries.flatMap((style) => style.fields))).sort();
	const families = Array.from(new Set(styleSummaries.map((style) => style.family))).sort();

	return {
		items,
		total: filtered.length,
		page,
		page_size: pageSize,
		filters: {
			fields,
			families,
		},
	};
}

async function resolveStyleByKey(styleKey: string) {
	const rows = await getPublicStyleRows();
	for (const style of rows) {
		if (style.id === styleKey || style.filename === styleKey) return style;
		const metadata = parseStyleYamlMetadata(style.citum, style.title, style.filename);
		if (metadata.slugCandidates.includes(styleKey)) return style;
	}
	return null;
}

export async function getHubAliases(styleKey: string, page = 1, pageSize = 40) {
	const style = await resolveStyleByKey(styleKey);
	if (!style) return null;

	const entries = (await sql`
        SELECT re.*
        FROM registry_entries re
        JOIN registries r ON r.id = re.registry_id
        WHERE r.slug = 'hub-primary'
          AND re.status = 'active'
          AND re.target_style_id = ${style.id}
        ORDER BY re.display_title ASC
    `) as RegistryEntryRecord[];
	const names = await getRegistryEntryNames(entries.map((entry) => entry.id));
	const namesByEntry = new Map<string, RegistryEntryNameRecord[]>();
	for (const name of names) {
		const bucket = namesByEntry.get(name.entry_id) || [];
		bucket.push(name);
		namesByEntry.set(name.entry_id, bucket);
	}

	const items = entries.map((entry) => {
		const entryNames = namesByEntry.get(entry.id) || [];
		return {
			id: entry.id,
			entry_slug: entry.entry_slug,
			title: entry.display_title,
			title_short: entryNames.find((name) => name.kind === "title_short")?.value || null,
			issns: entryNames.filter((name) => name.kind === "issn").map((name) => name.value),
			status: entry.status,
			last_synced_at: entry.last_synced_at,
			parent_style_slug: entry.parent_style_slug,
		} satisfies HubAliasRecord;
	});

	const start = (Math.max(1, page) - 1) * pageSize;
	return {
		total: items.length,
		page: Math.max(1, page),
		page_size: pageSize,
		items: items.slice(start, start + pageSize),
	};
}

export async function getHubStyleDetail(styleKey: string): Promise<HubStyleDetail | null> {
	const style = await resolveStyleByKey(styleKey);
	if (!style) return null;

	const metadata = parseStyleYamlMetadata(style.citum, style.title, style.filename);
	const aliases = await getHubAliases(style.id, 1, 12);
	const registries = await getRegistries();
	const primaryRegistry = registries.get("hub-primary");
	if (!primaryRegistry || !aliases) return null;

	const history = (await sql`
        SELECT *
        FROM registry_sync_runs
        WHERE registry_id = ${primaryRegistry.id}
        ORDER BY started_at DESC
        LIMIT 10
    `) as Array<{
		id: string;
		action: string;
		status: string;
		entries_seen: number;
		entries_upserted: number;
		entries_hidden: number;
		entries_skipped: number;
		message: string | null;
		started_at: string;
		finished_at: string;
	}>;

	return {
		style: {
			id: style.id,
			title: metadata.title,
			filename: style.filename,
			description: metadata.description,
			fields: metadata.fields,
			updated_at: style.updated_at,
			short_name: metadata.shortName,
			edition: metadata.edition,
			family: metadata.family,
			alias_count: aliases.total,
			preview_text: previewTextForFamily(metadata.family, metadata.shortName || metadata.title),
			match_context: null,
			citum: style.citum,
			source_license: metadata.sourceLicense,
			original_authors: metadata.originalAuthors,
		},
		aliases: {
			total: aliases.total,
			items: aliases.items,
		},
		history,
		permissions: {
			registry_name: primaryRegistry.name,
			scope: primaryRegistry.scope,
			visibility: primaryRegistry.visibility,
			is_primary: primaryRegistry.is_primary,
		},
	};
}

export async function exportRegistryDocument({
	registrySlug = "hub-primary",
	format = "yaml",
}: ExportRegistryOptions = {}) {
	await ensureRegistrySeeded();
	const registries = await getRegistries();
	const registry = registries.get(registrySlug);
	if (!registry) {
		throw new Error(`Unknown registry: ${registrySlug}`);
	}
	if (registrySlug === "hub-candidates") {
		throw new Error("Candidate registries cannot be exported in strict core format.");
	}

	const entries = (await sql`
        SELECT *
        FROM registry_entries
        WHERE registry_id = ${registry.id}
          AND status = 'active'
        ORDER BY entry_slug ASC
    `) as RegistryEntryRecord[];
	const names = await getRegistryEntryNames(entries.map((entry) => entry.id));
	const namesByEntry = new Map<string, RegistryEntryNameRecord[]>();
	for (const name of names) {
		const bucket = namesByEntry.get(name.entry_id) || [];
		bucket.push(name);
		namesByEntry.set(name.entry_id, bucket);
	}

	const document: CoreRegistryDocument = {
		version: registry.format_version,
		styles: entries
			.filter((entry) => entry.target_kind && entry.target_ref)
			.map((entry) => ({
				id: entry.entry_slug,
				aliases: (namesByEntry.get(entry.id) || [])
					.filter(
						(name) => name.is_public && (name.kind === "title_short" || name.kind === "tool_alias")
					)
					.map((name) => name.value),
				builtin: entry.target_kind === "builtin" ? entry.target_ref || undefined : undefined,
				path: entry.target_kind === "path" ? entry.target_ref || undefined : undefined,
				description: entry.description || undefined,
				fields: entry.fields || [],
			})),
	};

	const body =
		format === "json"
			? JSON.stringify(document, null, 2)
			: yaml.dump(document, { noRefs: true, lineWidth: 120 });

	await createSyncRun(registry.id, "export", "completed", {
		entriesSeen: document.styles.length,
		entriesUpserted: document.styles.length,
		message: `Exported ${registry.slug} as ${format}.`,
	});

	return {
		contentType: format === "json" ? "application/json" : "application/x-yaml",
		filename: `${registry.slug}.${format === "json" ? "json" : "yaml"}`,
		body,
	};
}

export async function importRegistryDocument({
	registrySlug = "hub-primary",
	format = "yaml",
	body,
}: ImportRegistryOptions) {
	const registries = await getRegistries();
	const registry = registries.get(registrySlug);
	if (!registry) {
		throw new Error(`Unknown registry: ${registrySlug}`);
	}

	const parsed = (format === "json" ? JSON.parse(body) : yaml.load(body)) as CoreRegistryDocument;
	if (!parsed || !Array.isArray(parsed.styles)) {
		throw new Error("Invalid registry document.");
	}

	let entriesUpserted = 0;
	for (const entry of parsed.styles) {
		const entryId = await upsertRegistryEntry(registry.id, {
			entrySlug: entry.id,
			displayTitle: humanizeSlug(entry.id),
			description: entry.description || null,
			fields: (entry.fields || []).map(String),
			citationFormat: null,
			targetKind: entry.builtin ? "builtin" : entry.path ? "path" : null,
			targetRef: entry.builtin || entry.path || null,
			targetStyleId: null,
			parentStyleSlug: entry.id,
			status: "active",
			sourceKind: "manual",
			sourceRef: `manual-import.${format}`,
			lastSyncedAt: new Date().toISOString(),
			metadata: {},
		});
		await replaceEntryNames(
			entryId,
			(entry.aliases || []).map((alias) => ({ kind: "tool_alias" as const, value: alias }))
		);
		entriesUpserted += 1;
	}

	await createSyncRun(registry.id, "import", "completed", {
		entriesSeen: parsed.styles.length,
		entriesUpserted,
		message: `Imported ${parsed.styles.length} entries into ${registry.slug}.`,
	});

	return {
		version: parsed.version || "1",
		entries_upserted: entriesUpserted,
	};
}

export async function getRegistryRuns() {
	await ensureRegistrySeeded();
	return (await sql`
        SELECT rsr.*, r.slug AS registry_slug, r.name AS registry_name
        FROM registry_sync_runs rsr
        LEFT JOIN registries r ON r.id = rsr.registry_id
        ORDER BY rsr.started_at DESC
        LIMIT 30
    `) as Array<Record<string, unknown>>;
}
