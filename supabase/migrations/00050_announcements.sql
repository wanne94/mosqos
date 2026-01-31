-- =============================================
-- Migration: 00050_announcements
-- Description: Announcements module for mosque communications
-- =============================================

-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Multi-language content (JSONB for i18n support)
    title JSONB NOT NULL DEFAULT '{}',           -- {"en": "...", "ar": "...", "tr": "..."}
    content JSONB NOT NULL DEFAULT '{}',
    excerpt JSONB DEFAULT '{}',

    -- Classification
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
    category VARCHAR(100),

    -- Scheduling
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
    publish_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,

    -- Targeting
    target_audience VARCHAR(20) DEFAULT 'all' CHECK (target_audience IN ('all', 'members', 'specific_groups')),
    target_group_ids UUID[] DEFAULT '{}',

    -- Display options
    is_pinned BOOLEAN DEFAULT FALSE,
    show_in_portal BOOLEAN DEFAULT TRUE,
    show_in_admin BOOLEAN DEFAULT TRUE,

    -- Media
    image_url TEXT,
    attachments JSONB DEFAULT '[]',

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_announcements_organization ON public.announcements(organization_id);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON public.announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON public.announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_publish_at ON public.announcements(publish_at);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view announcements in their organization"
    ON public.announcements
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_owners WHERE user_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_delegates WHERE user_id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can insert announcements"
    ON public.announcements
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organization_owners WHERE user_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_delegates WHERE user_id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can update announcements"
    ON public.announcements
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_owners WHERE user_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_delegates WHERE user_id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can delete announcements"
    ON public.announcements
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_owners WHERE user_id = auth.uid()
            UNION
            SELECT organization_id FROM public.organization_delegates WHERE user_id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    );

-- Updated at trigger
CREATE TRIGGER set_announcements_updated_at
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT SELECT ON public.announcements TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.announcements TO authenticated;

COMMENT ON TABLE public.announcements IS 'Announcements for mosque communications with multi-language support';
