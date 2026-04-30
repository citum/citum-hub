import { describe, expect, test } from "bun:test";

import { normalizeCitationPreviewHtml } from "./preview-output";

describe("normalizeCitationPreviewHtml", () => {
	test("removes duplicated punctuation before locator spans", () => {
		const input =
			'<span class="citum-issued">2023</span>, <span class="citum-variable">, pp. 123-125</span>';

		expect(normalizeCitationPreviewHtml(input)).toBe(
			'<span class="citum-issued">2023</span><span class="citum-variable">, pp. 123-125</span>'
		);
	});

	test("leaves unrelated preview markup unchanged", () => {
		const input = '<span class="citum-citation-number">[4]</span>';

		expect(normalizeCitationPreviewHtml(input)).toBe(input);
	});
});
