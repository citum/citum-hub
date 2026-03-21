import yaml from "js-yaml";

export function normalizeStyleYamlForPreview(styleYaml: string): string {
	if (!styleYaml.trim()) {
		return styleYaml;
	}

	try {
		const parsed = yaml.load(styleYaml);
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			return styleYaml;
		}

		const style = parsed as Record<string, unknown>;
		if (!("preset" in style)) {
			return styleYaml;
		}

		const normalized = { ...style };
		delete normalized.preset;
		return yaml.dump(normalized, { lineWidth: 120 });
	} catch {
		return styleYaml;
	}
}
