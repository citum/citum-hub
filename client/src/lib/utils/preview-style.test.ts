import { describe, expect, test } from "bun:test";

import { normalizeStyleYamlForPreview } from "./preview-style";

describe("normalizeStyleYamlForPreview", () => {
	test("removes top-level preset for wasm preview compatibility", () => {
		const input = `preset: apa-7th
info:
  title: American Psychological Association 7th edition
citation:
  sort: author-date-title
bibliography:
  sort: author`;

		const output = normalizeStyleYamlForPreview(input);

		expect(output).not.toContain("preset:");
		expect(output).toContain("info:");
		expect(output).toContain("citation:");
		expect(output).toContain("bibliography:");
	});

	test("leaves styles without preset unchanged", () => {
		const input = `info:
  title: Custom Style
citation:
  sort: author`;

		expect(normalizeStyleYamlForPreview(input)).toBe(input);
	});
});
