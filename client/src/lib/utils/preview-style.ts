import yaml from "js-yaml";

// Define a custom schema to handle !custom tags in Citum YAML
const CUSTOM_TAG = new yaml.Type("!custom", {
	kind: "mapping",
	construct: (data) => data,
});
const CITUM_SCHEMA = yaml.DEFAULT_SCHEMA.extend([CUSTOM_TAG]);

export function normalizeStyleYamlForPreview(styleYaml: string): string {
	if (!styleYaml.trim()) {
		return styleYaml;
	}

	try {
		const parsed = yaml.load(styleYaml, { schema: CITUM_SCHEMA });
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
