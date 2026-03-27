import { describe, expect, test } from "bun:test";

import { normalizeCitationPreviewHtml } from "./preview-output";

describe("normalizeCitationPreviewHtml", () => {
	test("removes duplicated punctuation before locator spans", () => {
		const input =
			'<span class="csln-issued">2023</span>, <span class="csln-variable">, pp. 123-125</span>';

		expect(normalizeCitationPreviewHtml(input)).toBe(
			'<span class="csln-issued">2023</span><span class="csln-variable">, pp. 123-125</span>'
		);
	});

	test("leaves unrelated preview markup unchanged", () => {
		const input = '<span class="csln-citation-number">[4]</span>';

		expect(normalizeCitationPreviewHtml(input)).toBe(input);
	});
});
