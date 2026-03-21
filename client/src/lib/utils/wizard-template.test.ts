import { describe, expect, test } from "bun:test";
import { getComponentType, getResolvedTemplateRoot, toScopedTemplatePath } from "./wizard-template";

describe("wizard-template helpers", () => {
	test("resolves local bibliography templates when present", () => {
		const style = {
			bibliography: {
				template: [{ variable: "doi" }],
				"type-templates": {
					book: [{ title: "primary" }],
				},
			},
		};

		expect(getResolvedTemplateRoot(style, "book")).toEqual({
			path: "bibliography.type-templates.book",
			scope: "local",
			template: [{ title: "primary" }],
		});
		expect(getResolvedTemplateRoot(style, "article-journal")).toEqual({
			path: "bibliography.template",
			scope: "all",
			template: [{ variable: "doi" }],
		});
	});

	test("translates template paths between global and local scopes", () => {
		expect(toScopedTemplatePath("bibliography.template.2.items.1", "book", "local")).toBe(
			"bibliography.type-templates.book.2.items.1"
		);
		expect(toScopedTemplatePath("bibliography.type-templates.book.2.items.1", "book", "all")).toBe(
			"bibliography.template.2.items.1"
		);
	});

	test("detects component types from actual schema nodes", () => {
		expect(getComponentType({ contributor: "author" })).toBe("author");
		expect(getComponentType({ title: "parent-serial" })).toBe("container-title");
		expect(getComponentType({ items: [{ variable: "doi" }] })).toBe("group");
	});
});
