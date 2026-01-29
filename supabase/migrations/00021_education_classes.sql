-- ============================================================================
-- MOSQOS - MIGRATION 00021: EDUCATION MODULE - CLASSES & ENROLLMENTS
-- Description: Scheduled classes and student enrollments
-- ============================================================================

-- ============================================================================
-- SECTION 1: SCHEDULED CLASSES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.scheduled_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Course reference
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,

    -- Classroom and teacher
    classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,

    -- Class identity
    name VARCHAR(255) NOT NULL,  -- e.g., "Quran Memorization - Fall 2024"
    description TEXT,

    -- Date range
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- Schedule (recurring)
    day_of_week VARCHAR(20) CHECK (
        day_of_week IN ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')
    ),
    days_of_week VARCHAR(20)[],  -- For multiple days
    start_time TIME,
    end_time TIME,

    -- Capacity
    max_students INTEGER,
    current_enrollment INTEGER DEFAULT 0,

    -- Tuition (can override course tuition)
    tuition_fee DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    tuition_frequency VARCHAR(50) DEFAULT 'one_time' CHECK (
        tuition_frequency IN ('one_time', 'monthly', 'per_class', 'per_semester')
    ),

    -- Status
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (
        status IN ('draft', 'scheduled', 'active', 'completed', 'cancelled')
    ),

    -- Virtual class support
    is_virtual BOOLEAN DEFAULT FALSE,
    virtual_link TEXT,

    -- Settings
    auto_attendance BOOLEAN DEFAULT FALSE,
    attendance_required BOOLEAN DEFAULT TRUE,

    -- Notes
    notes TEXT,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for scheduled_classes
CREATE INDEX IF NOT EXISTS idx_scheduled_classes_organization_id ON public.scheduled_classes(organization_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_classes_course_id ON public.scheduled_classes(course_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_classes_classroom_id ON public.scheduled_classes(classroom_id) WHERE classroom_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scheduled_classes_teacher_id ON public.scheduled_classes(teacher_id) WHERE teacher_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scheduled_classes_status ON public.scheduled_classes(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_scheduled_classes_dates ON public.scheduled_classes(organization_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_classes_day ON public.scheduled_classes(day_of_week) WHERE day_of_week IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scheduled_classes_active ON public.scheduled_classes(organization_id) WHERE status = 'active';

-- Triggers for scheduled_classes
DROP TRIGGER IF EXISTS set_updated_at_scheduled_classes ON public.scheduled_classes;
CREATE TRIGGER set_updated_at_scheduled_classes
    BEFORE UPDATE ON public.scheduled_classes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_created_by_scheduled_classes ON public.scheduled_classes;
CREATE TRIGGER set_created_by_scheduled_classes
    BEFORE INSERT ON public.scheduled_classes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_updated_by_scheduled_classes ON public.scheduled_classes;
CREATE TRIGGER set_updated_by_scheduled_classes
    BEFORE UPDATE ON public.scheduled_classes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_by();

-- Comments
COMMENT ON TABLE public.scheduled_classes IS 'Scheduled class instances of courses';
COMMENT ON COLUMN public.scheduled_classes.day_of_week IS 'Primary day of week for the class';
COMMENT ON COLUMN public.scheduled_classes.days_of_week IS 'Array of days for classes that meet multiple times per week';
COMMENT ON COLUMN public.scheduled_classes.status IS 'Class status: draft, scheduled, active, completed, cancelled';
COMMENT ON COLUMN public.scheduled_classes.tuition_frequency IS 'How often tuition is charged: one_time, monthly, per_class, per_semester';
COMMENT ON COLUMN public.scheduled_classes.current_enrollment IS 'Current number of enrolled students';

-- ============================================================================
-- SECTION 2: ENROLLMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Class reference
    scheduled_class_id UUID NOT NULL REFERENCES public.scheduled_classes(id) ON DELETE CASCADE,

    -- Student reference
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

    -- Enrollment details
    enrollment_date DATE DEFAULT CURRENT_DATE,

    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (
        status IN ('pending', 'active', 'completed', 'withdrawn', 'suspended', 'waitlisted')
    ),

    -- Academic info
    grade VARCHAR(10),
    grade_points DECIMAL(3,2),
    completion_percentage DECIMAL(5,2) DEFAULT 0,

    -- Attendance summary (updated periodically)
    total_classes INTEGER DEFAULT 0,
    attended_classes INTEGER DEFAULT 0,
    attendance_percentage DECIMAL(5,2) DEFAULT 0,

    -- Financial
    tuition_paid DECIMAL(10,2) DEFAULT 0,
    tuition_balance DECIMAL(10,2) DEFAULT 0,
    scholarship_amount DECIMAL(10,2) DEFAULT 0,
    scholarship_notes TEXT,

    -- Withdrawal info
    withdrawal_date DATE,
    withdrawal_reason TEXT,

    -- Notes
    notes TEXT,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Unique constraint: one enrollment per student per class
    CONSTRAINT uq_enrollment_student_class UNIQUE (scheduled_class_id, member_id)
);

-- Indexes for enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_organization_id ON public.enrollments(organization_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON public.enrollments(scheduled_class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_member_id ON public.enrollments(member_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_date ON public.enrollments(organization_id, enrollment_date DESC);
CREATE INDEX IF NOT EXISTS idx_enrollments_active ON public.enrollments(scheduled_class_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_enrollments_with_balance ON public.enrollments(organization_id) WHERE tuition_balance > 0;

-- Triggers for enrollments
DROP TRIGGER IF EXISTS set_updated_at_enrollments ON public.enrollments;
CREATE TRIGGER set_updated_at_enrollments
    BEFORE UPDATE ON public.enrollments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_created_by_enrollments ON public.enrollments;
CREATE TRIGGER set_created_by_enrollments
    BEFORE INSERT ON public.enrollments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_updated_by_enrollments ON public.enrollments;
CREATE TRIGGER set_updated_by_enrollments
    BEFORE UPDATE ON public.enrollments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_by();

-- Comments
COMMENT ON TABLE public.enrollments IS 'Student enrollments in scheduled classes';
COMMENT ON COLUMN public.enrollments.status IS 'Enrollment status: pending, active, completed, withdrawn, suspended, waitlisted';
COMMENT ON COLUMN public.enrollments.grade IS 'Final grade (A, B, C, etc. or Pass/Fail)';
COMMENT ON COLUMN public.enrollments.grade_points IS 'Grade point average for this class';
COMMENT ON COLUMN public.enrollments.completion_percentage IS 'Course completion progress percentage';
COMMENT ON COLUMN public.enrollments.scholarship_amount IS 'Amount of scholarship applied to tuition';

-- ============================================================================
-- SECTION 3: TRIGGER TO UPDATE ENROLLMENT COUNT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.scheduled_classes
        SET current_enrollment = current_enrollment + 1
        WHERE id = NEW.scheduled_class_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.scheduled_classes
        SET current_enrollment = GREATEST(current_enrollment - 1, 0)
        WHERE id = OLD.scheduled_class_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle class change
        IF OLD.scheduled_class_id != NEW.scheduled_class_id THEN
            UPDATE public.scheduled_classes
            SET current_enrollment = GREATEST(current_enrollment - 1, 0)
            WHERE id = OLD.scheduled_class_id;

            UPDATE public.scheduled_classes
            SET current_enrollment = current_enrollment + 1
            WHERE id = NEW.scheduled_class_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_enrollment_count ON public.enrollments;
CREATE TRIGGER update_enrollment_count
    AFTER INSERT OR UPDATE OR DELETE ON public.enrollments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_enrollment_count();

-- ============================================================================
-- SECTION 4: ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE public.scheduled_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Scheduled classes policies
CREATE POLICY "scheduled_classes_select_org" ON public.scheduled_classes
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "scheduled_classes_insert_org" ON public.scheduled_classes
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "scheduled_classes_update_org" ON public.scheduled_classes
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_organization(organization_id))
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "scheduled_classes_delete_org" ON public.scheduled_classes
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "scheduled_classes_platform_admin" ON public.scheduled_classes
    FOR ALL TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- Enrollments policies
CREATE POLICY "enrollments_select_org" ON public.enrollments
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "enrollments_insert_org" ON public.enrollments
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "enrollments_update_org" ON public.enrollments
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_organization(organization_id))
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "enrollments_delete_org" ON public.enrollments
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "enrollments_platform_admin" ON public.enrollments
    FOR ALL TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- ============================================================================
-- SECTION 5: GRANTS
-- ============================================================================

GRANT ALL ON public.scheduled_classes TO service_role;
GRANT ALL ON public.enrollments TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_classes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;

-- ============================================================================
-- SECTION 6: AUDIT TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS audit_trigger_scheduled_classes ON public.scheduled_classes;
CREATE TRIGGER audit_trigger_scheduled_classes
    AFTER INSERT OR UPDATE OR DELETE ON public.scheduled_classes
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_trigger_enrollments ON public.enrollments;
CREATE TRIGGER audit_trigger_enrollments
    AFTER INSERT OR UPDATE OR DELETE ON public.enrollments
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================================================
-- END OF MIGRATION 00021
-- ============================================================================
