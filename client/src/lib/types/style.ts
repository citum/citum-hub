export interface Style {
	id: string;
	title: string;
	filename: string;
	description?: string;
	fields?: string[];
	is_public: boolean;
	updated_at: string;
	user_id: string;
	citum?: string | null;
	intent?: Record<string, unknown>;
}

export interface HubStyleSummary {
	id: string;
	title: string;
	filename: string | null;
	description: string | null;
	fields: string[];
	updated_at: string;
	short_name: string | null;
	edition: string | null;
	family: string;
	alias_count: number;
	preview_text: string;
	match_context: string | null;
}

export interface HubAliasRecord {
	id: string;
	entry_slug: string;
	title: string;
	title_short: string | null;
	issns: string[];
	status: "active" | "candidate" | "disabled";
	last_synced_at: string | null;
	parent_style_slug: string | null;
}

export interface HubStyleDetail {
	style: HubStyleSummary & {
		citum: string | null;
		source_license: string | null;
		original_authors: Array<{ name?: string | null }>;
	};
	aliases: {
		total: number;
		items: HubAliasRecord[];
	};
	history: Array<{
		id: string;
		action: string;
		status: string;
		entries_seen: number;
		entries_upserted: number;
		entries_hidden: number;
		entries_skipped: number;
		message: string | null;
		started_at: string;
		finished_at: string;
	}>;
	permissions: {
		registry_name: string;
		scope: string;
		visibility: string;
		is_primary: boolean;
	};
}

export interface HubSearchResponse {
	items: HubStyleSummary[];
	total: number;
	page: number;
	page_size: number;
	filters: {
		fields: string[];
		families: string[];
	};
}
