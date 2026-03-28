import type { StyleIntent } from "$lib/types/bindings";
import type { DecisionResult } from "$lib/types/decision";
import { createEmptyIntent, type BuildStage, type CreateMode } from "$lib/utils/create-flow";

const STORAGE_KEY = "citum-create-flow-state";

let mode = $state<CreateMode | null>(null);
let sourceStyleKey = $state<string | null>(null);
let buildStage = $state<BuildStage>("citation");
let buildIntent = $state<StyleIntent>(createEmptyIntent());
let lastDecision = $state<DecisionResult | null>(null);
let draftName = $state("");

function persist() {
	try {
		sessionStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				mode,
				sourceStyleKey,
				buildStage,
				buildIntent,
				draftName,
			})
		);
	} catch {
		// Storage unavailable
	}
}

function restore(): boolean {
	try {
		const saved = sessionStorage.getItem(STORAGE_KEY);
		if (!saved) return false;
		const data = JSON.parse(saved) as {
			mode?: CreateMode | null;
			sourceStyleKey?: string | null;
			buildStage?: BuildStage;
			buildIntent?: Partial<StyleIntent>;
			draftName?: string;
		};

		mode = data.mode ?? null;
		sourceStyleKey = data.sourceStyleKey ?? null;
		buildStage = data.buildStage ?? "citation";
		buildIntent = { ...createEmptyIntent(), ...(data.buildIntent ?? {}) };
		draftName = data.draftName ?? "";
		return true;
	} catch {
		return false;
	}
}

function setMode(nextMode: CreateMode | null) {
	mode = nextMode;
	persist();
}

function setSourceStyleKey(nextSourceStyleKey: string | null) {
	sourceStyleKey = nextSourceStyleKey;
	persist();
}

function setBuildStage(nextStage: BuildStage) {
	buildStage = nextStage;
	persist();
}

function setIntentPatch(patch: Partial<StyleIntent>) {
	buildIntent = { ...buildIntent, ...patch };
	persist();
}

function replaceIntent(intent: StyleIntent) {
	buildIntent = intent;
	persist();
}

function setLastDecision(decision: DecisionResult | null) {
	lastDecision = decision;
}

function setDraftName(nextDraftName: string) {
	draftName = nextDraftName;
	persist();
}

function resetBuild() {
	buildStage = "citation";
	buildIntent = createEmptyIntent();
	lastDecision = null;
	draftName = "";
	persist();
}

function resetAll() {
	mode = null;
	sourceStyleKey = null;
	buildStage = "citation";
	buildIntent = createEmptyIntent();
	lastDecision = null;
	draftName = "";
	try {
		sessionStorage.removeItem(STORAGE_KEY);
	} catch {
		// Storage unavailable
	}
}

export const createFlowStore = {
	get mode() {
		return mode;
	},
	get sourceStyleKey() {
		return sourceStyleKey;
	},
	get buildStage() {
		return buildStage;
	},
	get intent() {
		return buildIntent;
	},
	get lastDecision() {
		return lastDecision;
	},
	get draftName() {
		return draftName;
	},
	persist,
	restore,
	setMode,
	setSourceStyleKey,
	setBuildStage,
	setIntentPatch,
	replaceIntent,
	setLastDecision,
	setDraftName,
	resetBuild,
	resetAll,
};
