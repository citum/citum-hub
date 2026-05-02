/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs";
import path from "node:path";
// @ts-expect-error - Bun is the runtime
import { file, sql } from "bun";
import { Hono, type Context } from "hono";
import yaml from "js-yaml";
import { jwtVerify, SignJWT } from "jose";
import {
	generate_style,
	renderBibliography as render_bibliography,
	renderCitation as render_citation,
	render_intent_citation,
	decide as wasm_decide,
} from "../../../server/crates/wasm-bridge/pkg/wasm_bridge.js";
import {
	bootstrapHubApiData,
	exportRegistryDocument,
	getHubAliases,
	getHubStyleDetail,
	getRegistryRuns,
	importRegistryDocument,
	queryHubStyles,
	syncRegistryData,
} from "../lib/server/registry";
import { normalizeCitationPreviewHtml } from "../lib/utils/preview-output";
import { normalizeStyleYamlForPreview } from "../lib/utils/preview-style";

const app = new Hono().basePath("/api");

const PROJECT_ROOT = path.resolve(process.cwd(), "..");
const configuredResourceRoot = process.env.CITUM_CORE_PATH;

// Look for citum-core in sibling directory if not explicitly configured
const siblingCorePath = path.resolve(PROJECT_ROOT, "..", "citum-core");
const actualCorePath =
	configuredResourceRoot || (fs.existsSync(siblingCorePath) ? siblingCorePath : null);

const RESOURCE_ROOT =
	actualCorePath && fs.existsSync(path.join(actualCorePath, "fixtures"))
		? actualCorePath
		: actualCorePath && fs.existsSync(path.join(actualCorePath, "resources", "fixtures"))
			? path.join(actualCorePath, "resources")
			: path.join(PROJECT_ROOT, "resources");

console.log("[Setup] RESOURCE_ROOT:", RESOURCE_ROOT);

// Startup Validation: ensure we actually have styles to work with
const stylesDir = path.join(RESOURCE_ROOT, "styles");
if (!fs.existsSync(stylesDir) || fs.readdirSync(stylesDir).length === 0) {
	console.error("\n" + "!".repeat(80));
	console.error("FATAL ERROR: Styles directory is missing or empty!");
	console.error(`Path: ${stylesDir}`);
	console.error("The Hub cannot link aliases or generate previews without the citum-core styles.");
	console.error("Please ensure one of the following:");
	console.error("1. CITUM_CORE_PATH is set to your local citum-core repository.");
	console.error("2. A 'citum-core' directory exists as a sibling to 'citum-hub'.");
	console.error("!".repeat(80) + "\n");
}

const JWT_SECRET = new TextEncoder().encode(
	process.env.JWT_SECRET || "default_secret_for_development"
);

void bootstrapHubApiData()
	.then((summary) => {
		console.log("[Setup] Hub API bootstrap complete:", summary);
	})
	.catch((error) => {
		console.error("[Setup] Hub API bootstrap failed:", error);
	});

type PreviewContext = "default" | "contributors";

interface PreviewSet {
	in_text_parenthetical: string | null;
	in_text_narrative: string | null;
	note: string | null;
	bibliography: string | null;
}

interface FixtureCitation {
	items: Array<Record<string, unknown>>;
	mode: "non-integral" | "integral";
}

interface FixtureData {
	references: Record<string, unknown>;
	citations: {
		nonIntegral: FixtureCitation;
		integral: FixtureCitation;
	};
}

/**
 * --- Fixture Loading Logic ---
 */
async function getFixtureData(
	type: string = "expanded",
	previewContext: PreviewContext = "default"
) {
	const fixtureMap: Record<string, string> = {
		author_date: "references-author-date.json",
		footnote: "references-humanities-note.json",
		endnote: "references-humanities-note.json",
		numeric: "references-physics-numeric.json",
		label: "references-author-date.json",
		legal: "references-legal.json",
		expanded: "references-expanded.json",
	};

	const fileName = fixtureMap[type] || fixtureMap["expanded"];
	const filePath = path.join(RESOURCE_ROOT, "fixtures", fileName);

	try {
		const raw = await file(filePath).json();
		const entries = Array.isArray(raw)
			? raw
			: Object.entries(raw)
					.filter(([key]) => key !== "comment")
					.map(([, val]) => val);

		let multiAuthorItem: any = null;
		let editorItem: any = null;
		let translatorItem: any = null;
		const otherItems: unknown[] = [];

		entries.forEach((ref: any) => {
			if (ref && typeof ref === "object" && "id" in ref) {
				// Priority 1: 4+ authors (to test et al.)
				if (!multiAuthorItem && ref.author && Array.isArray(ref.author) && ref.author.length >= 4) {
					multiAuthorItem = ref;
				}
				// Priority 2: Editor roles (prefer monographs without authors to ensure role is in primary position)
				else if (
					!editorItem &&
					ref.editor &&
					Array.isArray(ref.editor) &&
					ref.editor.length > 0 &&
					(!ref.author || ref.author.length === 0)
				) {
					editorItem = ref;
				}
				// Priority 3: Translator roles (prefer works without authors)
				else if (
					!translatorItem &&
					ref.translator &&
					Array.isArray(ref.translator) &&
					ref.translator.length > 0 &&
					(!ref.author || ref.author.length === 0)
				) {
					translatorItem = ref;
				}
				// Standard items
				else if (otherItems.length < 10) {
					otherItems.push(ref);
				}
			}
		});

		// Fallback for editorItem if no edited monograph found
		if (!editorItem) {
			editorItem = entries.find(
				(r: any) => r.editor && Array.isArray(r.editor) && r.editor.length > 0
			);
		}

		if (!multiAuthorItem && otherItems.length > 0) {
			multiAuthorItem = otherItems.pop();
		}

		const roleItems = entries
			.filter(
				(ref: any) =>
					ref &&
					typeof ref === "object" &&
					"id" in ref &&
					((ref.editor && Array.isArray(ref.editor) && ref.editor.length > 0) ||
						(ref.translator && Array.isArray(ref.translator) && ref.translator.length > 0))
			)
			.sort((left: any, right: any) => {
				const leftWeight =
					left.author && Array.isArray(left.author) && left.author.length > 0 ? 1 : 0;
				const rightWeight =
					right.author && Array.isArray(right.author) && right.author.length > 0 ? 1 : 0;
				return leftWeight - rightWeight;
			});

		const defaultItems = [multiAuthorItem, editorItem, translatorItem, ...otherItems]
			.filter(Boolean)
			.filter((item, index, self) => self.findIndex((t) => t.id === item.id) === index) // Unique
			.slice(0, 4);
		const contributorItems = roleItems
			.filter(Boolean)
			.filter((item, index, self) => self.findIndex((t) => t.id === item.id) === index)
			.slice(0, 4);
		const selectedItems =
			previewContext === "contributors" && contributorItems.length > 0
				? contributorItems
				: defaultItems;
		const references = Object.fromEntries(
			(previewContext === "contributors" ? selectedItems : entries)
				.filter((item): item is Record<string, unknown> => Boolean(item))
				.map((item) => [String(item.id), item])
		);

		const cite1Items = [];
		const cite2Items = [];

		if (selectedItems.length > 0) {
			cite1Items.push({ id: selectedItems[0].id, locator: { label: "page", value: "15" } });
			if (selectedItems.length > 1) cite1Items.push({ id: selectedItems[1].id });
			if (selectedItems.length > 2) cite2Items.push({ id: selectedItems[2].id });
			if (selectedItems.length > 3) cite2Items.push({ id: selectedItems[3].id });
		}

		const nonIntegralCitation: FixtureCitation = { items: cite1Items, mode: "non-integral" };
		const integralCitation: FixtureCitation = { items: cite2Items, mode: "integral" };

		return {
			references,
			citations: {
				nonIntegral: nonIntegralCitation,
				integral: integralCitation,
			},
		} satisfies FixtureData;
	} catch (e) {
		console.error(
			`[Fixture] Failed to load ${fileName} from ${filePath}. Previews will be empty.`,
			e
		);
		const emptyCite: FixtureCitation = { items: [], mode: "non-integral" };
		return {
			references: {},
			citations: { nonIntegral: emptyCite, integral: emptyCite },
		} satisfies FixtureData;
	}
}

function resolvePreviewClass(
	body: Record<string, unknown>,
	previewStyleYaml: string | undefined
): "author_date" | "numeric" | "footnote" | "endnote" | "expanded" {
	const explicitClass =
		(typeof body.intent === "object" &&
			body.intent &&
			typeof (body.intent as Record<string, unknown>).class === "string" &&
			((body.intent as Record<string, unknown>).class as string)) ||
		(typeof body.class === "string" ? body.class : null);

	if (explicitClass === "numeric") return "numeric";
	if (explicitClass === "footnote" || explicitClass === "endnote") return explicitClass;
	if (explicitClass === "author_date" || explicitClass === "author-date") return "author_date";

	if (!previewStyleYaml) return "expanded";

	try {
		const parsed = yaml.load(previewStyleYaml);
		if (!parsed || typeof parsed !== "object") return "expanded";

		const options = (parsed as Record<string, unknown>).options;
		if (!options || typeof options !== "object") return "expanded";

		const processing = (options as Record<string, unknown>).processing;
		if (processing === "numeric") return "numeric";
		if (processing === "note") return "footnote";
		if (processing === "author-date" || processing === "author_date") return "author_date";
	} catch {
		return "expanded";
	}

	return "expanded";
}

function resolvePreviewContext(body: Record<string, unknown>): PreviewContext {
	const value =
		typeof body.preview_context === "string"
			? body.preview_context
			: typeof body.preview_focus === "string"
				? body.preview_focus
				: "default";

	return value === "contributors" || value === "roles" ? "contributors" : "default";
}

function createEmptyPreviewSet(): PreviewSet {
	return {
		in_text_parenthetical: null,
		in_text_narrative: null,
		note: null,
		bibliography: null,
	};
}

function styleHasBibliography(styleYaml: string | undefined): boolean {
	if (!styleYaml) return true;
	try {
		const parsed = yaml.load(styleYaml);
		if (!parsed || typeof parsed !== "object") return true;
		return (parsed as Record<string, unknown>).bibliography !== null;
	} catch {
		return true;
	}
}

function injectLocatorIntoCitation(
	citation: FixtureCitation,
	testLocator: string
): FixtureCitation {
	if (!citation.items.length) return citation;
	const items = [...citation.items];
	items[0] = {
		...items[0],
		locator: { label: "page", value: testLocator },
	};

	return { ...citation, items };
}

function getChoicePreviewHtml(previewSet: PreviewSet): string {
	return (
		previewSet.note ??
		previewSet.in_text_parenthetical ??
		previewSet.bibliography ??
		previewSet.in_text_narrative ??
		""
	);
}

async function renderPreviewSet(params: {
	intent?: Record<string, unknown>;
	previewStyleYaml?: string;
	testLocator: string;
	previewContext?: PreviewContext;
}): Promise<PreviewSet> {
	const { intent, previewStyleYaml, testLocator, previewContext = "default" } = params;
	const previewSource = intent ?? params;
	const fixtureType = resolvePreviewClass(previewSource, previewStyleYaml);
	const isNotePreview = fixtureType === "footnote" || fixtureType === "endnote";

	const previewSet = createEmptyPreviewSet();
	const fixture = await getFixtureData(fixtureType, previewContext);
	const refsStr = JSON.stringify(fixture.references);
	const citeNonIntegral = injectLocatorIntoCitation(fixture.citations.nonIntegral, testLocator);
	const citeIntegral = injectLocatorIntoCitation(fixture.citations.integral, testLocator);
	const citeNonIntegralStr = JSON.stringify(citeNonIntegral);
	const citeIntegralStr = JSON.stringify(citeIntegral);

	if (previewStyleYaml && previewStyleYaml.trim().length > 0) {
		const renderedNonIntegral = render_citation(
			previewStyleYaml,
			refsStr,
			citeNonIntegralStr,
			"non-integral"
		);
		const renderedIntegral = render_citation(
			previewStyleYaml,
			refsStr,
			citeIntegralStr,
			"integral"
		);
		const previewNonIntegral = normalizeCitationPreviewHtml(renderedNonIntegral);
		const previewIntegral = normalizeCitationPreviewHtml(renderedIntegral);

		if (isNotePreview) {
			previewSet.note =
				previewIntegral && previewIntegral !== previewNonIntegral
					? `${previewNonIntegral}<br>${previewIntegral}`
					: previewNonIntegral;
		} else {
			previewSet.in_text_parenthetical = previewNonIntegral;
			previewSet.in_text_narrative = previewIntegral;
		}

		previewSet.bibliography = styleHasBibliography(previewStyleYaml)
			? render_bibliography(previewStyleYaml, refsStr)
			: null;
		return previewSet;
	}

	if (intent) {
		const intentStr = JSON.stringify(intent);
		const renderedNonIntegral = render_intent_citation(
			intentStr,
			refsStr,
			citeNonIntegralStr,
			"non-integral"
		);
		const renderedIntegral = render_intent_citation(
			intentStr,
			refsStr,
			citeIntegralStr,
			"integral"
		);
		const previewNonIntegral = normalizeCitationPreviewHtml(renderedNonIntegral);
		const previewIntegral = normalizeCitationPreviewHtml(renderedIntegral);

		if (isNotePreview) {
			previewSet.note =
				previewIntegral && previewIntegral !== previewNonIntegral
					? `${previewNonIntegral}<br>${previewIntegral}`
					: previewNonIntegral;
		} else {
			previewSet.in_text_parenthetical = previewNonIntegral;
			previewSet.in_text_narrative = previewIntegral;
		}

		const generatedStyle = generate_style(intentStr);
		previewSet.bibliography = styleHasBibliography(generatedStyle)
			? render_bibliography(generatedStyle, refsStr)
			: null;
	}

	return previewSet;
}

// --- Middleware: Auth ---
const authMiddleware = async (c: Context, next: () => Promise<void>) => {
	const authHeader = c.req.header("Authorization");
	if (!authHeader?.startsWith("Bearer ")) {
		c.set("user", null);
		await next();
		return;
	}

	const token = authHeader.split(" ")[1];
	try {
		const { payload } = await jwtVerify(token, JWT_SECRET);
		c.set("user", {
			id: payload.sub as string,
			role: payload.role as string,
		});
	} catch {
		c.set("user", null);
	}
	await next();
};

const requireAdmin = async (c: Context, next: () => Promise<void>) => {
	await authMiddleware(c, async () => {
		const user = (c as any).get("user");
		if (!user || user.role !== "admin") {
			c.res = c.json({ error: "Admin access required" }, 401);
			return;
		}
		await next();
	});
};

// --- API Routes ---

app.get("/hub", async (c) => {
	try {
		const page = Number.parseInt(c.req.query("page") || "1", 10) || 1;
		const pageSize = Number.parseInt(c.req.query("page_size") || "24", 10) || 24;
		const fields = new URL(c.req.url).searchParams.getAll("field").filter(Boolean);
		const styles = await queryHubStyles({
			q: c.req.query("q") || c.req.query("search") || undefined,
			fields: fields.length > 0 ? fields : undefined,
			family: c.req.query("family") || undefined,
			hasAliases: c.req.query("has_aliases") === "true",
			page,
			pageSize,
		});
		return c.json(styles);
	} catch (error) {
		console.error("[Hub] Failed to fetch public styles", error);
		return c.json({ error: "Failed to fetch public styles" }, 500);
	}
});

app.get("/hub/:styleKey", async (c) => {
	try {
		const detail = await getHubStyleDetail(c.req.param("styleKey"));
		if (!detail) {
			return c.json({ error: "Style not found" }, 404);
		}
		return c.json(detail);
	} catch (error) {
		console.error("[Hub] Failed to fetch style detail", error);
		return c.json({ error: "Failed to fetch style detail" }, 500);
	}
});

app.get("/hub/:styleKey/aliases", async (c) => {
	try {
		const page = Number.parseInt(c.req.query("page") || "1", 10) || 1;
		const pageSize = Number.parseInt(c.req.query("page_size") || "40", 10) || 40;
		const aliases = await getHubAliases(c.req.param("styleKey"), page, pageSize);
		if (!aliases) {
			return c.json({ error: "Style not found" }, 404);
		}
		return c.json(aliases);
	} catch (error) {
		console.error("[Hub] Failed to fetch aliases", error);
		return c.json({ error: "Failed to fetch aliases" }, 500);
	}
});

app.get("/hub/:styleKey/download", async (c) => {
	try {
		const detail = await getHubStyleDetail(c.req.param("styleKey"));
		if (!detail?.style.citum) {
			return c.json({ error: "Style source not found" }, 404);
		}
		const slug =
			detail.style.filename
				?.split("/")
				.pop()
				?.replace(/\.(yaml|yml)$/i, "") ||
			detail.style.short_name?.toLowerCase().replace(/\s+/g, "-") ||
			"style";
		c.header("Content-Type", "application/x-yaml; charset=utf-8");
		c.header("Content-Disposition", `attachment; filename="${slug}.yaml"`);
		return c.body(detail.style.citum);
	} catch (error) {
		console.error("[Hub] Failed to download style source", error);
		return c.json({ error: "Failed to download style source" }, 500);
	}
});

app.post("/admin/registry/sync", requireAdmin, async (c) => {
	try {
		const summary = await syncRegistryData();
		return c.json(summary);
	} catch (error) {
		console.error("[Registry] Sync failed", error);
		return c.json({ error: "Registry sync failed", details: String(error) }, 500);
	}
});

app.post("/admin/registry/import", requireAdmin, async (c) => {
	try {
		const body = await c.req.text();
		const requestedFormat = c.req.query("format");
		const contentType = c.req.header("content-type") || "";
		const format =
			requestedFormat === "json" || contentType.includes("application/json") ? "json" : "yaml";
		const result = await importRegistryDocument({
			registrySlug:
				(c.req.query("registry") as "hub-primary" | "core-default" | "hub-candidates") ||
				"hub-primary",
			format,
			body,
		});
		return c.json(result);
	} catch (error) {
		console.error("[Registry] Import failed", error);
		return c.json({ error: "Registry import failed", details: String(error) }, 500);
	}
});

app.get("/admin/registry/export", requireAdmin, async (c) => {
	try {
		const format = c.req.query("format") === "json" ? "json" : "yaml";
		const document = await exportRegistryDocument({
			registrySlug:
				(c.req.query("registry") as "hub-primary" | "core-default" | "hub-candidates") ||
				"hub-primary",
			format,
		});
		c.header("Content-Type", `${document.contentType}; charset=utf-8`);
		c.header("Content-Disposition", `attachment; filename="${document.filename}"`);
		return c.body(document.body);
	} catch (error) {
		console.error("[Registry] Export failed", error);
		return c.json({ error: "Registry export failed", details: String(error) }, 500);
	}
});

app.get("/admin/registry/runs", requireAdmin, async (c) => {
	try {
		return c.json(await getRegistryRuns());
	} catch (error) {
		console.error("[Registry] Failed to fetch runs", error);
		return c.json({ error: "Failed to fetch registry runs" }, 500);
	}
});

app.get("/styles", authMiddleware, async (c) => {
	const user = (c as any).get("user");
	const userId = user?.id || c.req.query("user_id");
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	try {
		const styles =
			await sql`SELECT * FROM styles WHERE user_id = ${userId} ORDER BY updated_at DESC`;
		return c.json(styles);
	} catch {
		return c.json({ error: "Database error" }, 500);
	}
});

app.post("/styles", authMiddleware, async (c) => {
	const user = (c as any).get("user");
	if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

	try {
		const body = await c.req.json();
		const title = body.title || "Untitled Style";
		const intent = body.intent || {};
		const citum =
			body.citum ||
			body.style_yaml ||
			(Object.keys(intent).length > 0 ? generate_style(JSON.stringify(intent)) : "");

		const [style] = await sql`
            INSERT INTO styles (user_id, title, intent, citum, is_public)
            VALUES (${user.id}, ${title}, ${JSON.stringify(intent)}, ${citum}, false)
            RETURNING *
        `;
		return c.json(style, 201);
	} catch (error) {
		console.error("[Styles] Failed to create style", error);
		return c.json({ error: "Failed to create style" }, 500);
	}
});

app.get("/styles/:id", authMiddleware, async (c) => {
	const id = c.req.param("id");
	const user = (c as any).get("user");
	try {
		const [style] = await sql`SELECT * FROM styles WHERE id = ${id}`;
		if (!style) return c.json({ error: "Not found" }, 404);
		if (!style.is_public && style.user_id !== user?.id) {
			return c.json({ error: "Unauthorized" }, 401);
		}
		return c.json(style);
	} catch {
		return c.json({ error: "Database error" }, 500);
	}
});

app.patch("/styles/:id", authMiddleware, async (c) => {
	const id = c.req.param("id");
	const user = (c as any).get("user");
	if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

	try {
		const body = await c.req.json();
		const existing = await sql`SELECT * FROM styles WHERE id = ${id} AND user_id = ${user.id}`;
		if (existing.length === 0) return c.json({ error: "Not found" }, 404);

		const title = body.title || existing[0].title;
		const intent = body.intent || existing[0].intent || {};
		const citum =
			body.citum ||
			body.style_yaml ||
			existing[0].citum ||
			(Object.keys(intent).length > 0 ? generate_style(JSON.stringify(intent)) : "");
		const isPublic = typeof body.is_public === "boolean" ? body.is_public : existing[0].is_public;

		const [style] = await sql`
            UPDATE styles
            SET title = ${title},
                intent = ${JSON.stringify(intent)},
                citum = ${citum},
                is_public = ${isPublic},
                updated_at = NOW()
            WHERE id = ${id}
              AND user_id = ${user.id}
            RETURNING *
        `;
		return c.json(style);
	} catch (error) {
		console.error("[Styles] Failed to update style", error);
		return c.json({ error: "Failed to update style" }, 500);
	}
});

app.post("/styles/:id/fork", authMiddleware, async (c) => {
	const id = c.req.param("id");
	const user = (c as any).get("user");
	if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

	try {
		const [original] = await sql`
            SELECT *
            FROM styles
            WHERE id = ${id}
              AND (is_public = true OR user_id = ${user.id})
        `;
		if (!original) return c.json({ error: "Not found" }, 404);

		const [forked] = await sql`
            INSERT INTO styles (user_id, title, intent, citum, is_public)
            VALUES (
                ${user.id},
                ${`${original.title} (Fork)`},
                ${JSON.stringify(original.intent || {})},
                ${original.citum || ""},
                false
            )
            RETURNING *
        `;
		return c.json(forked, 201);
	} catch (error) {
		console.error("[Styles] Failed to fork style", error);
		return c.json({ error: "Failed to fork style" }, 500);
	}
});

app.get("/bookmarks", authMiddleware, async (c) => {
	const user = (c as any).get("user");
	if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

	try {
		const bookmarks = await sql`
            SELECT s.*
            FROM styles s
            JOIN bookmarks b ON b.style_id = s.id
            WHERE b.user_id = ${user.id}
            ORDER BY s.updated_at DESC
        `;
		return c.json(bookmarks);
	} catch (error) {
		console.error("[Bookmarks] Failed to fetch bookmarks", error);
		return c.json({ error: "Failed to fetch bookmarks" }, 500);
	}
});

app.post("/styles/:id/bookmark", authMiddleware, async (c) => {
	const id = c.req.param("id");
	const user = (c as any).get("user");
	if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

	try {
		await sql`
            INSERT INTO bookmarks (user_id, style_id)
            VALUES (${user.id}, ${id})
            ON CONFLICT DO NOTHING
        `;
		return c.body(null, 201);
	} catch (error) {
		console.error("[Bookmarks] Failed to create bookmark", error);
		return c.json({ error: "Failed to bookmark style" }, 500);
	}
});

app.delete("/styles/:id/bookmark", authMiddleware, async (c) => {
	const id = c.req.param("id");
	const user = (c as any).get("user");
	if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

	try {
		await sql`
            DELETE FROM bookmarks
            WHERE user_id = ${user.id}
              AND style_id = ${id}
        `;
		return c.body(null, 204);
	} catch (error) {
		console.error("[Bookmarks] Failed to remove bookmark", error);
		return c.json({ error: "Failed to remove bookmark" }, 500);
	}
});

// --- High-Performance WASM Rendering & Intent Engine ---

app.post("/v1/decide", async (c) => {
	try {
		const intent = await c.req.json();
		const intentStr = JSON.stringify(intent);

		let decision;
		try {
			const resultJson = wasm_decide(intentStr);
			decision = JSON.parse(resultJson);
		} catch (wasmError) {
			console.error("[Decide] WASM core failed:", wasmError);
			return c.json({ error: "Intent evaluation failed", details: String(wasmError) }, 500);
		}

		const testLocator = "123-125";

		// Try generating main previews
		try {
			const previewSet = await renderPreviewSet({
				intent,
				testLocator,
			});
			decision.in_text_parenthetical = previewSet.in_text_parenthetical;
			decision.in_text_narrative = previewSet.in_text_narrative;
			decision.note = previewSet.note;
			decision.bibliography = previewSet.bibliography;
		} catch (previewError) {
			console.warn("[Decide] Main preview rendering failed:", previewError);
			// Non-fatal, just no preview
		}

		// Try populating choice previews
		if (decision.question && decision.previews) {
			for (const preview of decision.previews) {
				try {
					const previewIntent = { ...intent, ...preview.choice_value };
					const previewSet = await renderPreviewSet({
						intent: previewIntent,
						testLocator,
					});
					preview.preview_set = previewSet;
					preview.html = getChoicePreviewHtml(previewSet);
				} catch {
					preview.preview_set = createEmptyPreviewSet();
					preview.html = "";
				}
			}
		}
		return c.json(decision);
	} catch (e) {
		console.error("[Decide] Fatal Handler Error:", e);
		return c.json({ error: "Internal Server Error during decision processing" }, 500);
	}
});

app.post("/v1/preview", async (c) => {
	try {
		const body = await c.req.json();
		const style_yaml = body.style_yaml || body.citum;
		const previewStyleYaml =
			typeof style_yaml === "string" ? normalizeStyleYamlForPreview(style_yaml) : style_yaml;
		const testLocator = body.test_locator || "123-125";
		const previewContext = resolvePreviewContext(body);

		try {
			const previewSet = await renderPreviewSet({
				intent:
					body.intent || body.field || body.class
						? ((body.intent || body) as Record<string, unknown>)
						: undefined,
				previewStyleYaml:
					typeof previewStyleYaml === "string" && previewStyleYaml.trim().length > 0
						? previewStyleYaml
						: undefined,
				testLocator,
				previewContext,
			});

			return c.json(previewSet);
		} catch (renderError) {
			console.error("[Preview] WASM render error details:", renderError);
			return c.json({ error: "Rendering failed", details: String(renderError) }, 500);
		}
	} catch (e) {
		console.error("[Preview] Fatal Handler Error:", e);
		return c.json({ error: "Internal Server Error during preview generation" }, 500);
	}
});
app.post("/v1/generate", async (c) => {
	try {
		const intent = await c.req.json();
		const yaml = generate_style(JSON.stringify(intent));
		return c.text(yaml);
	} catch (e) {
		return c.json({ error: String(e) }, 500);
	}
});

// --- Auth Routes ---
app.get("/auth/github", (c) => {
	const clientId = process.env.GITHUB_CLIENT_ID;
	const url = new URL("https://github.com/login/oauth/authorize");
	url.searchParams.set("client_id", clientId!);
	url.searchParams.set("scope", "user:email");
	return c.redirect(url.toString());
});

app.get("/auth/github/callback", async (c) => {
	const code = c.req.query("code");
	const clientId = process.env.GITHUB_CLIENT_ID;
	const clientSecret = process.env.GITHUB_CLIENT_SECRET;

	const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
		method: "POST",
		headers: { "Content-Type": "application/json", Accept: "application/json" },
		body: JSON.stringify({
			client_id: clientId,
			client_secret: clientSecret,
			code,
		}),
	});
	const tokenData = await tokenRes.json();
	const userRes = await fetch("https://api.github.com/user", {
		headers: {
			Authorization: `Bearer ${tokenData.access_token}`,
			"User-Agent": "citum-hub-bun",
		},
	});
	const githubUser = await userRes.json();
	const email = githubUser.email || githubUser.login;

	const [user] = await sql`
        INSERT INTO users (email, github_id) 
        VALUES (${email}, ${githubUser.id.toString()}) 
        ON CONFLICT (github_id) DO UPDATE SET email = ${email} 
        RETURNING id, role
    `;

	const jwt = await new SignJWT({ role: user.role })
		.setProtectedHeader({ alg: "HS256" })
		.setSubject(user.id)
		.setIssuedAt()
		.setExpirationTime("7d")
		.sign(JWT_SECRET);

	return c.redirect(
		`${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/callback?token=${jwt}`
	);
});

// --- Websocket Integration ---
const server = {
	hostname: "0.0.0.0",
	port: 3002,
	fetch(req: Request, server: any) {
		const url = new URL(req.url);
		if (url.pathname === "/ws/preview") {
			const upgraded = server.upgrade(req);
			if (upgraded) return;
			return new Response("Upgrade failed", { status: 500 });
		}
		return app.fetch(req, server);
	},
	websocket: {
		message(ws: any, message: string) {
			try {
				JSON.parse(message);
				ws.send(
					JSON.stringify({
						type: "preview_result",
						html: "WS preview not yet fixture-linked",
					})
				);
			} catch (e) {
				ws.send(JSON.stringify({ type: "error", message: String(e) }));
			}
		},
	},
};

export default server;
