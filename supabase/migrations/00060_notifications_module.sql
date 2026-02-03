-- =============================================
-- Notifications Module
-- =============================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Notification content
    type TEXT NOT NULL CHECK (type IN (
        'donation_received',      -- New donation notification
        'event_reminder',         -- Event starting soon
        'event_rsvp',             -- Someone RSVP'd to your event
        'case_assigned',          -- Case assigned to you
        'case_updated',           -- Case you're involved in was updated
        'announcement',           -- New announcement
        'payment_received',       -- Payment received (tuition, etc.)
        'payment_due',            -- Payment reminder
        'class_reminder',         -- Class starting soon
        'class_cancelled',        -- Class cancelled
        'membership_expiring',    -- Membership expiring soon
        'general',                -- General notification
        'system'                  -- System notification
    )),
    title TEXT NOT NULL,
    body TEXT,

    -- Reference to related entity
    entity_type TEXT CHECK (entity_type IN (
        'donation', 'event', 'case', 'announcement', 'payment',
        'class', 'enrollment', 'member', 'household', 'organization'
    )),
    entity_id UUID,

    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,

    -- Action URL (optional - for deep linking)
    action_url TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT now()
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

    -- Notification type preferences
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'donation_received', 'event_reminder', 'event_rsvp', 'case_assigned',
        'case_updated', 'announcement', 'payment_received', 'payment_due',
        'class_reminder', 'class_cancelled', 'membership_expiring', 'general', 'system'
    )),

    -- Channels
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Unique constraint: one preference per type per person
    UNIQUE(person_id, notification_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_person_id ON notifications(person_id);
CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_person_unread ON notifications(person_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_person_id ON notification_preferences(person_id);

-- Trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Notifications policies

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (
        person_id IN (
            SELECT id FROM members WHERE user_id = auth.uid()
        )
    );

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    TO authenticated
    USING (
        person_id IN (
            SELECT id FROM members WHERE user_id = auth.uid()
        )
    );

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
    ON notifications FOR DELETE
    TO authenticated
    USING (
        person_id IN (
            SELECT id FROM members WHERE user_id = auth.uid()
        )
    );

-- System can create notifications for anyone (via service role or functions)
CREATE POLICY "Service role can create notifications"
    ON notifications FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Platform admins have full access
CREATE POLICY "Platform admins have full access to notifications"
    ON notifications FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM platform_admins
            WHERE user_id = auth.uid()
        )
    );

-- Notification preferences policies

-- Users can manage their own preferences
CREATE POLICY "Users can view their own notification preferences"
    ON notification_preferences FOR SELECT
    TO authenticated
    USING (
        person_id IN (
            SELECT id FROM members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own notification preferences"
    ON notification_preferences FOR INSERT
    TO authenticated
    WITH CHECK (
        person_id IN (
            SELECT id FROM members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own notification preferences"
    ON notification_preferences FOR UPDATE
    TO authenticated
    USING (
        person_id IN (
            SELECT id FROM members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own notification preferences"
    ON notification_preferences FOR DELETE
    TO authenticated
    USING (
        person_id IN (
            SELECT id FROM members WHERE user_id = auth.uid()
        )
    );

-- Platform admins have full access
CREATE POLICY "Platform admins have full access to notification preferences"
    ON notification_preferences FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM platform_admins
            WHERE user_id = auth.uid()
        )
    );

-- =============================================
-- Functions
-- =============================================

-- Function to get unread notification count for a user
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM notifications n
    JOIN members m ON m.id = n.person_id
    WHERE m.user_id = p_user_id
    AND n.is_read = false;

    RETURN v_count;
END;
$$;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE notifications
    SET is_read = true, read_at = now()
    WHERE person_id IN (
        SELECT id FROM members WHERE user_id = p_user_id
    )
    AND is_read = false;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
    p_person_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_body TEXT DEFAULT NULL,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_action_url TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
    v_org_id UUID;
BEGIN
    -- Get organization ID from member
    SELECT organization_id INTO v_org_id
    FROM members
    WHERE id = p_person_id;

    -- Check user preferences
    IF EXISTS (
        SELECT 1 FROM notification_preferences
        WHERE person_id = p_person_id
        AND notification_type = p_type
        AND in_app_enabled = false
    ) THEN
        -- User has disabled this notification type
        RETURN NULL;
    END IF;

    -- Create notification
    INSERT INTO notifications (
        person_id,
        organization_id,
        type,
        title,
        body,
        entity_type,
        entity_id,
        action_url,
        metadata
    )
    VALUES (
        p_person_id,
        v_org_id,
        p_type,
        p_title,
        p_body,
        p_entity_type,
        p_entity_id,
        p_action_url,
        p_metadata
    )
    RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
