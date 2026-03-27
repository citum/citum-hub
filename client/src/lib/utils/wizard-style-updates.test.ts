import { describe, expect, test } from "bun:test";

import {
	getArticleTitleStyleUpdates,
	getCitationNumberUpdates,
	getLocatorLabelUpdates,
	getRolePresetUpdates,
} from "./wizard-style-updates";

describe("wizard-style-updates", () => {
	test("maps contributor role presets onto the valid nested schema path", () => {
		expect(getRolePresetUpdates("short-suffix")).toEqual([
			{ path: "options.contributors.role.preset", value: "short-suffix" },
		]);
	});

	test("maps locator labels onto the valid locators shape", () => {
		expect(getLocatorLabelUpdates("short")).toEqual([
			{ path: "options.locators.default-label-form", value: "short" },
		]);
		expect(getLocatorLabelUpdates("none")).toEqual([
			{ path: "options.locators.default-label-form", value: "none" },
		]);
	});

	test("maps article title styling onto component title options", () => {
		expect(getArticleTitleStyleUpdates("quoted")).toEqual([
			{ path: "options.titles.component.quote", value: true },
			{ path: "options.titles.component.emph", value: false },
		]);
		expect(getArticleTitleStyleUpdates("italic")).toEqual([
			{ path: "options.titles.component.quote", value: false },
			{ path: "options.titles.component.emph", value: true },
		]);
	});

	test("maps numeric citation wrappers onto the generated citation template", () => {
		expect(getCitationNumberUpdates("paren")).toEqual([
			{ path: "citation.template.0.wrap", value: "parentheses" },
			{ path: "citation.template.0.suffix", value: undefined },
		]);
		expect(getCitationNumberUpdates("period")).toEqual([
			{ path: "citation.template.0.wrap", value: "none" },
			{ path: "citation.template.0.suffix", value: "." },
		]);
	});
});
