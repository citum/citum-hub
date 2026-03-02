import { json } from "@sveltejs/kit";
import { syncStylesFromGitHub } from "$lib/server/sync_styles";

export async function POST() {
	// In a real app, we'd check for an admin API key here
	await syncStylesFromGitHub();
	return json({ message: "Sync triggered" });
}
