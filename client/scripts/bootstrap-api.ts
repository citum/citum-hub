import { bootstrapHubApiData } from "../src/lib/server/registry";

async function main() {
	console.log("Bootstrapping hub API data...");
	const summary = await bootstrapHubApiData();
	console.log("Hub API bootstrap complete:", summary);
}

main().catch((error) => {
	console.error("Hub API bootstrap failed:", error);
	process.exit(1);
});
