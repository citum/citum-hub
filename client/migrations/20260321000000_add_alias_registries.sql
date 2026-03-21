CREATE TABLE IF NOT EXISTS registries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    scope TEXT NOT NULL DEFAULT 'system',
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    visibility TEXT NOT NULL DEFAULT 'private',
    format_version TEXT NOT NULL DEFAULT '1',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT registries_scope_check CHECK (scope IN ('system', 'organization', 'user')),
    CONSTRAINT registries_visibility_check CHECK (visibility IN ('public', 'private', 'admin'))
);

CREATE TABLE IF NOT EXISTS registry_sync_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registry_id UUID REFERENCES registries(id) ON DELETE CASCADE,
    action TEXT NOT NULL DEFAULT 'sync',
    status TEXT NOT NULL DEFAULT 'completed',
    entries_seen INTEGER NOT NULL DEFAULT 0,
    entries_upserted INTEGER NOT NULL DEFAULT 0,
    entries_hidden INTEGER NOT NULL DEFAULT 0,
    entries_skipped INTEGER NOT NULL DEFAULT 0,
    message TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT registry_sync_runs_status_check CHECK (status IN ('started', 'completed', 'failed')),
    CONSTRAINT registry_sync_runs_action_check CHECK (action IN ('sync', 'import', 'export'))
);

CREATE TABLE IF NOT EXISTS registry_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registry_id UUID NOT NULL REFERENCES registries(id) ON DELETE CASCADE,
    entry_slug TEXT NOT NULL,
    display_title TEXT NOT NULL,
    description TEXT,
    fields TEXT[] NOT NULL DEFAULT '{}',
    citation_format TEXT,
    target_kind TEXT,
    target_ref TEXT,
    target_style_id UUID REFERENCES styles(id) ON DELETE SET NULL,
    parent_style_slug TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    source_kind TEXT NOT NULL DEFAULT 'manual',
    source_ref TEXT,
    last_synced_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT registry_entries_target_kind_check CHECK (target_kind IN ('builtin', 'path') OR target_kind IS NULL),
    CONSTRAINT registry_entries_status_check CHECK (status IN ('active', 'candidate', 'disabled')),
    CONSTRAINT registry_entries_source_kind_check CHECK (source_kind IN ('csl-dependent', 'manual', 'crossref-enriched', 'tool-alias')),
    CONSTRAINT registry_entries_target_presence_check CHECK (
        (status = 'candidate' AND target_kind IS NULL AND target_ref IS NULL)
        OR (status <> 'candidate' AND target_kind IS NOT NULL AND target_ref IS NOT NULL)
    ),
    UNIQUE (registry_id, entry_slug)
);

CREATE TABLE IF NOT EXISTS registry_entry_names (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES registry_entries(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    value TEXT NOT NULL,
    normalized_value TEXT NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT registry_entry_names_kind_check CHECK (kind IN ('title', 'title_short', 'issn', 'publisher_name', 'tool_alias', 'legacy_slug')),
    UNIQUE (entry_id, kind, normalized_value)
);

CREATE INDEX IF NOT EXISTS idx_registry_entries_registry_status
    ON registry_entries (registry_id, status);

CREATE INDEX IF NOT EXISTS idx_registry_entries_target_style
    ON registry_entries (target_style_id);

CREATE INDEX IF NOT EXISTS idx_registry_entry_names_lookup
    ON registry_entry_names (normalized_value);

CREATE INDEX IF NOT EXISTS idx_registry_sync_runs_registry_started
    ON registry_sync_runs (registry_id, started_at DESC);

DROP TRIGGER IF EXISTS update_registries_updated_at ON registries;
CREATE TRIGGER update_registries_updated_at
BEFORE UPDATE ON registries
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_registry_entries_updated_at ON registry_entries;
CREATE TRIGGER update_registry_entries_updated_at
BEFORE UPDATE ON registry_entries
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

INSERT INTO registries (slug, name, scope, is_primary, visibility, format_version)
VALUES
    ('core-default', 'Core Default Registry', 'system', FALSE, 'public', '1'),
    ('hub-primary', 'Citum Hub Primary Registry', 'system', TRUE, 'public', '1'),
    ('hub-candidates', 'Citum Hub Candidate Registry', 'system', FALSE, 'admin', '1')
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    scope = EXCLUDED.scope,
    is_primary = EXCLUDED.is_primary,
    visibility = EXCLUDED.visibility,
    format_version = EXCLUDED.format_version,
    updated_at = NOW();
