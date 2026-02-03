-- =============================================
-- Events & Calendar Module
-- =============================================

-- First, update the permissions table CHECK constraint to include 'events' module
ALTER TABLE public.permissions DROP CONSTRAINT IF EXISTS permissions_module_check;
ALTER TABLE public.permissions ADD CONSTRAINT permissions_module_check CHECK (
    module IN (
        'members', 'households', 'donations', 'funds', 'pledges',
        'education', 'cases', 'umrah', 'qurbani', 'services',
        'announcements', 'reports', 'settings', 'permissions', 'expenses',
        'events'
    )
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Basic info
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'prayer',      -- Regular prayers, Jummah
        'class',       -- Educational classes
        'lecture',     -- Lectures, halaqas
        'meeting',     -- Board meetings, committee meetings
        'community',   -- Community events, gatherings
        'fundraiser',  -- Fundraising events
        'iftar',       -- Ramadan iftars
        'taraweeh',    -- Taraweeh prayers
        'eid',         -- Eid celebrations
        'sports',      -- Sports activities
        'youth',       -- Youth programs
        'sisters',     -- Sisters programs
        'other'        -- Other events
    )),

    -- Date and time
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ,
    all_day BOOLEAN DEFAULT false,
    hijri_date TEXT,                    -- Stored Hijri date for Islamic events

    -- Location
    location TEXT,                       -- Physical location or room
    is_virtual BOOLEAN DEFAULT false,
    virtual_link TEXT,                   -- Zoom/Meet link for virtual events

    -- Capacity and registration
    capacity INTEGER,                    -- Max attendees (NULL = unlimited)
    rsvp_enabled BOOLEAN DEFAULT false,
    rsvp_deadline TIMESTAMPTZ,

    -- Recurrence
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule JSONB,              -- RRule format: { frequency, interval, until, byDay, etc. }
    parent_event_id UUID REFERENCES events(id) ON DELETE CASCADE, -- For recurring instances

    -- Visibility and status
    is_public BOOLEAN DEFAULT false,    -- Visible to non-members
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),

    -- Categories and tags
    category_id UUID,                    -- Future: event_categories table
    tags TEXT[],

    -- Media
    cover_image_url TEXT,
    attachments JSONB DEFAULT '[]',     -- Array of { name, url, type }

    -- Contact
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,

    -- Metadata
    created_by UUID REFERENCES members(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Event RSVPs table
CREATE TABLE IF NOT EXISTS event_rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

    status TEXT NOT NULL DEFAULT 'attending' CHECK (status IN ('attending', 'maybe', 'declined')),
    guests_count INTEGER DEFAULT 0,       -- Additional guests
    notes TEXT,                           -- Special requests, dietary needs

    -- Check-in tracking
    checked_in BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMPTZ,
    checked_in_by UUID REFERENCES members(id),

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Unique constraint: one RSVP per person per event
    UNIQUE(event_id, person_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_organization_id ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_start_datetime ON events(start_datetime);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_is_public ON events(is_public);
CREATE INDEX IF NOT EXISTS idx_events_parent_event_id ON events(parent_event_id);
CREATE INDEX IF NOT EXISTS idx_events_organization_start ON events(organization_id, start_datetime);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_person_id ON event_rsvps(person_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_status ON event_rsvps(status);

-- Trigger for updated_at
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_rsvps_updated_at
    BEFORE UPDATE ON event_rsvps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

-- Events policies

-- Platform admins can do everything
CREATE POLICY "Platform admins have full access to events"
    ON events FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM platform_admins
            WHERE user_id = auth.uid()
        )
    );

-- Organization members can view events for their org
CREATE POLICY "Organization members can view events"
    ON events FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
            UNION
            SELECT organization_id FROM organization_owners WHERE user_id = auth.uid()
            UNION
            SELECT organization_id FROM organization_delegates WHERE user_id = auth.uid()
        )
        OR (is_public = true AND status = 'published')
    );

-- Organization owners and delegates can manage events
CREATE POLICY "Organization admins can manage events"
    ON events FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_owners WHERE user_id = auth.uid()
            UNION
            SELECT organization_id FROM organization_delegates WHERE user_id = auth.uid()
        )
    );

-- Members with event management permission can create/edit events
CREATE POLICY "Members with permissions can manage events"
    ON events FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            JOIN permission_group_members pgm ON pgm.member_id = om.id
            JOIN permission_group_permissions pgp ON pgp.permission_group_id = pgm.permission_group_id
            JOIN permissions p ON p.id = pgp.permission_id
            WHERE om.user_id = auth.uid()
            AND om.organization_id = events.organization_id
            AND p.code IN ('events:manage', 'admin')
        )
    );

-- Event RSVPs policies

-- Platform admins can do everything
CREATE POLICY "Platform admins have full access to event_rsvps"
    ON event_rsvps FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM platform_admins
            WHERE user_id = auth.uid()
        )
    );

-- Users can manage their own RSVPs
CREATE POLICY "Users can manage their own RSVPs"
    ON event_rsvps FOR ALL
    TO authenticated
    USING (
        person_id IN (
            SELECT id FROM members WHERE user_id = auth.uid()
        )
    );

-- Organization admins can view all RSVPs for their events
CREATE POLICY "Org admins can view RSVPs for their events"
    ON event_rsvps FOR SELECT
    TO authenticated
    USING (
        event_id IN (
            SELECT e.id FROM events e
            WHERE e.organization_id IN (
                SELECT organization_id FROM organization_owners WHERE user_id = auth.uid()
                UNION
                SELECT organization_id FROM organization_delegates WHERE user_id = auth.uid()
            )
        )
    );

-- Organization admins can manage RSVPs (check-in, etc.)
CREATE POLICY "Org admins can manage RSVPs"
    ON event_rsvps FOR UPDATE
    TO authenticated
    USING (
        event_id IN (
            SELECT e.id FROM events e
            WHERE e.organization_id IN (
                SELECT organization_id FROM organization_owners WHERE user_id = auth.uid()
                UNION
                SELECT organization_id FROM organization_delegates WHERE user_id = auth.uid()
            )
        )
    );

-- =============================================
-- Functions
-- =============================================

-- Function to get upcoming events for an organization
CREATE OR REPLACE FUNCTION get_upcoming_events(
    p_organization_id UUID,
    p_limit INTEGER DEFAULT 10,
    p_event_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    event_type TEXT,
    start_datetime TIMESTAMPTZ,
    end_datetime TIMESTAMPTZ,
    location TEXT,
    capacity INTEGER,
    rsvp_count BIGINT,
    is_public BOOLEAN,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.title,
        e.description,
        e.event_type,
        e.start_datetime,
        e.end_datetime,
        e.location,
        e.capacity,
        COALESCE(COUNT(er.id) FILTER (WHERE er.status = 'attending'), 0) as rsvp_count,
        e.is_public,
        e.status
    FROM events e
    LEFT JOIN event_rsvps er ON er.event_id = e.id
    WHERE e.organization_id = p_organization_id
    AND e.status = 'published'
    AND e.start_datetime > now()
    AND (p_event_type IS NULL OR e.event_type = p_event_type)
    GROUP BY e.id
    ORDER BY e.start_datetime ASC
    LIMIT p_limit;
END;
$$;

-- Function to get event with RSVP stats
CREATE OR REPLACE FUNCTION get_event_with_stats(p_event_id UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    event_type TEXT,
    start_datetime TIMESTAMPTZ,
    end_datetime TIMESTAMPTZ,
    location TEXT,
    is_virtual BOOLEAN,
    virtual_link TEXT,
    capacity INTEGER,
    rsvp_enabled BOOLEAN,
    attending_count BIGINT,
    maybe_count BIGINT,
    declined_count BIGINT,
    checked_in_count BIGINT,
    is_public BOOLEAN,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.title,
        e.description,
        e.event_type,
        e.start_datetime,
        e.end_datetime,
        e.location,
        e.is_virtual,
        e.virtual_link,
        e.capacity,
        e.rsvp_enabled,
        COALESCE(COUNT(er.id) FILTER (WHERE er.status = 'attending'), 0) as attending_count,
        COALESCE(COUNT(er.id) FILTER (WHERE er.status = 'maybe'), 0) as maybe_count,
        COALESCE(COUNT(er.id) FILTER (WHERE er.status = 'declined'), 0) as declined_count,
        COALESCE(COUNT(er.id) FILTER (WHERE er.checked_in = true), 0) as checked_in_count,
        e.is_public,
        e.status
    FROM events e
    LEFT JOIN event_rsvps er ON er.event_id = e.id
    WHERE e.id = p_event_id
    GROUP BY e.id;
END;
$$;

-- Function to check RSVP status for a user
CREATE OR REPLACE FUNCTION get_user_rsvp_status(
    p_event_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    rsvp_id UUID,
    status TEXT,
    guests_count INTEGER,
    checked_in BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        er.id as rsvp_id,
        er.status,
        er.guests_count,
        er.checked_in
    FROM event_rsvps er
    JOIN members m ON m.id = er.person_id
    WHERE er.event_id = p_event_id
    AND m.user_id = p_user_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_upcoming_events TO authenticated;
GRANT EXECUTE ON FUNCTION get_event_with_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_rsvp_status TO authenticated;

-- =============================================
-- Add events permissions
-- =============================================
INSERT INTO permissions (code, name, description, module, sort_order)
VALUES
    ('events:view', 'View Events', 'Can view events and calendar', 'events', 1),
    ('events:create', 'Create Events', 'Can create new events', 'events', 2),
    ('events:edit', 'Edit Events', 'Can edit event details', 'events', 3),
    ('events:delete', 'Delete Events', 'Can delete events', 'events', 4),
    ('events:manage', 'Manage Events', 'Full event management including RSVPs and check-ins', 'events', 5)
ON CONFLICT (code) DO NOTHING;
