import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const target = path.resolve("node_modules/svelte-check/dist/src/index.js");

const original = `function createProject(host, createLanguageService, options) {
    const version = typescript_1$8.default.version.split('.');
    const major = parseInt(version[0]);
    const minor = parseInt(version[1]);
    if (major < 5) {
        return undefined;
    }
    const factory = minor < 3 ? project_1.createProject : minor < 5 ? project_2.createProject : project_3.createProject;
    const project = factory(typescript_1$8.default, host, createLanguageService, options);
`;

const patched = `function createProject(host, createLanguageService, options) {
    const version = typescript_1$8.default.version.split('.');
    const major = parseInt(version[0]);
    const minor = parseInt(version[1]);
    if (major < 5) {
        return undefined;
    }
    const factory = major === 5 && minor < 3
        ? project_1.createProject
        : major === 5 && minor < 5
          ? project_2.createProject
          : project_3.createProject;
    const project = factory(typescript_1$8.default, host, createLanguageService, options);
`;

const file = readFileSync(target, "utf8");

if (file.includes("major === 5 && minor < 3")) {
	console.log("svelte-check TS6 patch already applied");
	process.exit(0);
}

if (!file.includes(original)) {
	console.warn(
		"Unable to find expected svelte-check TS6 patch target; " +
			"svelte-check may already be patched or its internals may have changed. " +
			"Skipping TS6 compatibility patch."
	);
	process.exit(0);
}

writeFileSync(target, file.replace(original, patched));
console.log("Applied svelte-check TS6 patch");
