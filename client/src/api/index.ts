import path from "node:path";
import { file, sql } from "bun";
import { Hono } from "hono";
import { jwtVerify, SignJWT } from "jose";
import {
	generate_style,
	render_bibliography,
	render_citation,
	render_intent_citation,
	decide as wasm_decide,
} from "../../../server/crates/wasm-bridge/pkg/wasm_bridge.js";

const app = new Hono().basePath("/api");

// Dynamically determine the core path if not set
const PROJECT_ROOT = path.resolve(process.cwd(), "..");
const CITUM_CORE_PATH =
	process.env.CITUM_CORE_PATH || path.resolve(PROJECT_ROOT, "..", "citum-core");

console.log("[Setup] CITUM_CORE_PATH:", CITUM_CORE_PATH);

const JWT_SECRET = new TextEncoder().encode(
	process.env.JWT_SECRET || "default_secret_for_development"
);

/**
 * --- Fixture Loading Logic ---
 */
async function getFixtureData(type: string = "expanded") {
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
	const filePath = path.join(CITUM_CORE_PATH, "tests/fixtures", fileName);

	try {
		const raw = await file(filePath).json();
		const refs: Record<string, unknown> = {};
		const citationItems: unknown[] = [];

		const entries = Array.isArray(raw)
			? raw
			: Object.entries(raw)
					.filter(([key]) => key !== "comment")
					.map(([, val]) => val);

		entries.slice(0, 12).forEach((ref: unknown, index: number) => {
			if (ref && typeof ref === "object" && "id" in ref) {
				const typedRef = ref as Record<string, unknown>;
				refs[String(typedRef.id)] = ref;
				// Add a page locator to the first item so previews show
				// how the style formats locators (p. 15, pp. 23–45, etc.)
				const item: Record<string, unknown> = { id: typedRef.id };
				if (index === 0) {
					item.locator = { label: "page", value: "15" };
				}
				citationItems.push(item);
			}
		});

		return {
			references: refs,
			citation: { items: citationItems, mode: "non-integral" },
		};
	} catch (e) {
		console.error(
			`[Fixture] Failed to load ${fileName} from ${filePath}. Previews will be empty.`,
			e
		);
		return { references: {}, citation: { items: [], mode: "non-integral" } };
	}
}

// --- Middleware: Auth ---
const authMiddleware = async (c: unknown, next: () => Promise<void>) => {
	const authHeader = (c as Record<string, unknown>).req.header("Authorization");
	if (!authHeader?.startsWith("Bearer ")) {
		(c as Record<string, unknown>).set("user", null);
		await next();
		return;
	}

	const token = authHeader.split(" ")[1];
	try {
		const { payload } = await jwtVerify(token, JWT_SECRET);
		(c as Record<string, unknown>).set("user", { id: payload.sub, role: payload.role });
	} catch {
		(c as Record<string, unknown>).set("user", null);
	}
	await next();
};

// --- API Routes ---

app.get("/hub", async (c) => {
	try {
		const styles = await sql`SELECT * FROM styles WHERE is_public = true ORDER BY updated_at DESC`;
		return c.json(styles);
	} catch {
		return c.json({ error: "Failed to fetch public styles" }, 500);
	}
});

app.get("/styles", authMiddleware, async (c) => {
	const user = c.get("user");
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

app.get("/styles/:id", authMiddleware, async (c) => {
	const id = c.req.param("id");
	const user = c.get("user");
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

		const fixture = await getFixtureData(intent.class || intent.field);
		const refsStr = JSON.stringify(fixture.references);
		const citeStr = JSON.stringify(fixture.citation);

		// Try generating main previews
		try {
			decision.in_text_parenthetical = render_intent_citation(
				intentStr,
				refsStr,
				citeStr,
				"NonIntegral"
			);
			decision.in_text_narrative = render_intent_citation(intentStr, refsStr, citeStr, "Integral");
			const style_yaml = generate_style(intentStr);
			decision.bibliography = render_bibliography(style_yaml, refsStr);
		} catch (previewError) {
			console.warn("[Decide] Main preview rendering failed:", previewError);
			// Non-fatal, just no preview
		}

		// Try populating choice previews
		if (decision.question && decision.previews) {
			for (const preview of decision.previews) {
				try {
					const previewIntent = { ...intent, ...preview.choice_value };
					preview.html = render_intent_citation(
						JSON.stringify(previewIntent),
						refsStr,
						citeStr,
						"NonIntegral"
					);
				} catch {
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
		const mode = body.mode || "NonIntegral";

		let fixtureType = "expanded";
		if (body.intent?.class) fixtureType = body.intent.class;
		else if (body.class) fixtureType = body.class;

		const fixture = await getFixtureData(fixtureType);
		const refsStr = JSON.stringify(fixture.references);
		const citeStr = JSON.stringify(fixture.citation);

		let html = "",
			bib = "";

		try {
			if (style_yaml && typeof style_yaml === "string" && style_yaml.trim().length > 0) {
				html = render_citation(style_yaml, refsStr, citeStr, mode);
				bib = render_bibliography(style_yaml, refsStr);
			} else if (body.intent || body.field || body.class) {
				const intentStr = JSON.stringify(body.intent || body);
				html = render_intent_citation(intentStr, refsStr, citeStr, mode);
				const generated_style = generate_style(intentStr);
				bib = render_bibliography(generated_style, refsStr);
			}
		} catch (renderError) {
			console.error("[Preview] WASM render error:", renderError);
			html = `<span style="color:red">Preview rendering error: ${renderError}</span>`;
		}

		return c.json({
			in_text_parenthetical: html,
			in_text_narrative: html,
			note: null,
			bibliography: bib,
		});
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
	port: 3002,
	fetch(req: Request, server: unknown) {
		const url = new URL(req.url);
		if (url.pathname === "/ws/preview") {
			const upgraded = (server as Record<string, unknown>).upgrade(req);
			if (upgraded) return;
			return new Response("Upgrade failed", { status: 500 });
		}
		return app.fetch(req, server);
	},
	websocket: {
		message(ws: unknown, message: string) {
			try {
				JSON.parse(message);
				(ws as Record<string, unknown>).send(
					JSON.stringify({
						type: "preview_result",
						html: "WS preview not yet fixture-linked",
					})
				);
			} catch (e) {
				(ws as Record<string, unknown>).send(JSON.stringify({ type: "error", message: String(e) }));
			}
		},
	},
};

export default server;
