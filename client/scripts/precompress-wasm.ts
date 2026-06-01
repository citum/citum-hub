import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

const buildRoot = join(import.meta.dir, "..", "build");

function* walk(dir: string): Generator<string> {
	for (const entry of readdirSync(dir)) {
		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);
		if (stat.isDirectory()) {
			yield* walk(fullPath);
		} else if (fullPath.endsWith(".wasm")) {
			yield fullPath;
		}
	}
}

for (const wasmPath of walk(buildRoot)) {
	const bytes = readFileSync(wasmPath);
	writeFileSync(`${wasmPath}.gz`, gzipSync(bytes, { level: 9 }));
	writeFileSync(
		`${wasmPath}.br`,
		brotliCompressSync(bytes, {
			params: {
				[constants.BROTLI_PARAM_QUALITY]: 11,
			},
		})
	);
	console.log(`precompressed ${wasmPath}`);
}
