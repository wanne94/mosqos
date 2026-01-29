-- ============================================================================
-- MOSQOS - MIGRATION 00022: EDUCATION MODULE - ASSESSMENT & TRACKING
-- Description: Attendance, evaluations, student notes, and tuition payments
-- ============================================================================

-- ============================================================================
-- SECTION 1: ATTENDANCE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Class and student
    scheduled_class_id UUID NOT NULL REFERENCES public.scheduled_classes(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

    -- Attendance details
    attendance_date DATE NOT NULL,

    -- Status
    status VARCHAR(50) DEFAULT 'present' CHECK (
        status IN ('present', 'absent', 'late', 'excused', 'early_leave')
    ),

    -- Time tracking
    check_in_time TIME,
    check_out_time TIME,
    late_minutes INTEGER DEFAULT 0,

    -- Notes
    notes TEXT,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Unique constraint: one attendance record per student per class per day
    CONSTRAINT uq_attendance_student_class_date UNIQUE (scheduled_class_id, member_id, attendance_date)
);

-- Indexes for attendance
CREATE INDEX IF NOT EXISTS idx_attendance_organization_id ON public.attendance(organization_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON public.attendance(scheduled_class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON public.attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(organization_id, attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON public.attendance(scheduled_class_id, attendance_date DESC);

-- Triggers for attendance
DROP TRIGGER IF EXISTS set_created_by_attendance ON public.attendance;
CREATE TRIGGER set_created_by_attendance
    BEFORE INSERT ON public.attendance
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

-- Comments
COMMENT ON TABLE public.attendance IS 'Daily attendance records for class sessions';
COMMENT ON COLUMN public.attendance.status IS 'Attendance status: present, absent, late, excused, early_leave';
COMMENT ON COLUMN public.attendance.late_minutes IS 'Number of minutes late (if status is late)';

-- ============================================================================
-- SECTION 2: EVALUATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Class and student
    scheduled_class_id UUID NOT NULL REFERENCES public.scheduled_classes(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

    -- Evaluation details
    evaluation_date DATE NOT NULL,
    evaluation_type VARCHAR(50) CHECK (
        evaluation_type IN ('quiz', 'test', 'exam', 'assignment', 'project', 'presentation', 'oral', 'participation', 'other')
    ),
    title VARCHAR(255),
    description TEXT,

    -- Scoring
    score DECIMAL(5,2),
    max_score DECIMAL(5,2) DEFAULT 100,
    percentage DECIMAL(5,2),
    grade VARCHAR(10),
    weight DECIMAL(3,2) DEFAULT 1.0,  -- Weight in final grade calculation

    -- Qualitative assessment
    feedback TEXT,
    strengths TEXT,
    areas_for_improvement TEXT,

    -- Rubric (optional structured assessment)
    rubric_scores JSONB DEFAULT '[]'::JSONB,

    -- Visibility
    is_visible_to_student BOOLEAN DEFAULT TRUE,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for evaluations
CREATE INDEX IF NOT EXISTS idx_evaluations_organization_id ON public.evaluations(organization_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_class_id ON public.evaluations(scheduled_class_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_member_id ON public.evaluations(member_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_date ON public.evaluations(organization_id, evaluation_date DESC);
CREATE INDEX IF NOT EXISTS idx_evaluations_type ON public.evaluations(organization_id, evaluation_type);
CREATE INDEX IF NOT EXISTS idx_evaluations_student_class ON public.evaluations(scheduled_class_id, member_id, evaluation_date DESC);

-- Triggers for evaluations
DROP TRIGGER IF EXISTS set_updated_at_evaluations ON public.evaluations;
CREATE TRIGGER set_updated_at_evaluations
    BEFORE UPDATE ON public.evaluations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_created_by_evaluations ON public.evaluations;
CREATE TRIGGER set_created_by_evaluations
    BEFORE INSERT ON public.evaluations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_updated_by_evaluations ON public.evaluations;
CREATE TRIGGER set_updated_by_evaluations
    BEFORE UPDATE ON public.evaluations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_by();

-- Comments
COMMENT ON TABLE public.evaluations IS 'Student evaluations, grades, and assessments';
COMMENT ON COLUMN public.evaluations.evaluation_type IS 'Type: quiz, test, exam, assignment, project, presentation, oral, participation, other';
COMMENT ON COLUMN public.evaluations.weight IS 'Weight in final grade calculation (0.0 to 1.0)';
COMMENT ON COLUMN public.evaluations.rubric_scores IS 'JSON array of rubric criteria scores';

-- ============================================================================
-- SECTION 3: STUDENT NOTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.student_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Student (required)
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

    -- Class (optional - can be class-specific or general)
    scheduled_class_id UUID REFERENCES public.scheduled_classes(id) ON DELETE CASCADE,

    -- Note details
    note_date DATE DEFAULT CURRENT_DATE,
    note_type VARCHAR(50) CHECK (
        note_type IN ('academic', 'behavior', 'achievement', 'concern', 'communication', 'progress', 'other')
    ),
    title VARCHAR(255),
    content TEXT NOT NULL,

    -- Visibility
    is_private BOOLEAN DEFAULT FALSE,  -- Private notes only visible to staff
    is_visible_to_parent BOOLEAN DEFAULT FALSE,  -- Visible to parent/guardian

    -- Follow-up
    requires_followup BOOLEAN DEFAULT FALSE,
    followup_date DATE,
    followup_completed BOOLEAN DEFAULT FALSE,
    followup_notes TEXT,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for student_notes
CREATE INDEX IF NOT EXISTS idx_student_notes_organization_id ON public.student_notes(organization_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_member_id ON public.student_notes(member_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_class_id ON public.student_notes(scheduled_class_id) WHERE scheduled_class_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_student_notes_date ON public.student_notes(organization_id, note_date DESC);
CREATE INDEX IF NOT EXISTS idx_student_notes_type ON public.student_notes(organization_id, note_type);
CREATE INDEX IF NOT EXISTS idx_student_notes_followup ON public.student_notes(organization_id, requires_followup, followup_date)
    WHERE requires_followup = TRUE AND followup_completed = FALSE;

-- Triggers for student_notes
DROP TRIGGER IF EXISTS set_updated_at_student_notes ON public.student_notes;
CREATE TRIGGER set_updated_at_student_notes
    BEFORE UPDATE ON public.student_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_created_by_student_notes ON public.student_notes;
CREATE TRIGGER set_created_by_student_notes
    BEFORE INSERT ON public.student_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_updated_by_student_notes ON public.student_notes;
CREATE TRIGGER set_updated_by_student_notes
    BEFORE UPDATE ON public.student_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_by();

-- Comments
COMMENT ON TABLE public.student_notes IS 'Notes and observations about students';
COMMENT ON COLUMN public.student_notes.note_type IS 'Type: academic, behavior, achievement, concern, communication, progress, other';
COMMENT ON COLUMN public.student_notes.is_private IS 'If true, only visible to staff/teachers';
COMMENT ON COLUMN public.student_notes.is_visible_to_parent IS 'If true, visible to parent/guardian in portal';

-- ============================================================================
-- SECTION 4: TUITION MONTHLY PAYMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tuition_monthly_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Enrollment reference
    enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,

    -- Student and class (denormalized for easier queries)
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    scheduled_class_id UUID REFERENCES public.scheduled_classes(id) ON DELETE SET NULL,

    -- Fund for tuition (optional - for tracking in finance)
    fund_id UUID REFERENCES public.funds(id) ON DELETE SET NULL,

    -- Payment period
    payment_month DATE NOT NULL,  -- First day of the month
    due_date DATE NOT NULL,

    -- Amount
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    scholarship_amount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) GENERATED ALWAYS AS (GREATEST(amount - discount_amount - scholarship_amount, 0)) STORED,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Payment details
    payment_date DATE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (
        status IN ('pending', 'paid', 'partial', 'overdue', 'waived', 'cancelled')
    ),
    payment_method VARCHAR(50) CHECK (
        payment_method IN ('cash', 'check', 'card', 'bank_transfer', 'online', 'other')
    ),
    reference_number VARCHAR(100),

    -- Link to donation (if payment recorded as donation)
    donation_id UUID REFERENCES public.donations(id) ON DELETE SET NULL,

    -- Notes
    notes TEXT,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Unique constraint: one payment per enrollment per month
    CONSTRAINT uq_tuition_enrollment_month UNIQUE (enrollment_id, payment_month)
);

-- Indexes for tuition_monthly_payments
CREATE INDEX IF NOT EXISTS idx_tuition_payments_organization_id ON public.tuition_monthly_payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_tuition_payments_enrollment_id ON public.tuition_monthly_payments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_tuition_payments_member_id ON public.tuition_monthly_payments(member_id);
CREATE INDEX IF NOT EXISTS idx_tuition_payments_class_id ON public.tuition_monthly_payments(scheduled_class_id) WHERE scheduled_class_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tuition_payments_fund_id ON public.tuition_monthly_payments(fund_id) WHERE fund_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tuition_payments_status ON public.tuition_monthly_payments(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_tuition_payments_month ON public.tuition_monthly_payments(organization_id, payment_month DESC);
CREATE INDEX IF NOT EXISTS idx_tuition_payments_due ON public.tuition_monthly_payments(due_date)
    WHERE status IN ('pending', 'overdue');
CREATE INDEX IF NOT EXISTS idx_tuition_payments_overdue ON public.tuition_monthly_payments(organization_id)
    WHERE status = 'overdue';

-- Triggers for tuition_monthly_payments
DROP TRIGGER IF EXISTS set_updated_at_tuition_monthly_payments ON public.tuition_monthly_payments;
CREATE TRIGGER set_updated_at_tuition_monthly_payments
    BEFORE UPDATE ON public.tuition_monthly_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_created_by_tuition_monthly_payments ON public.tuition_monthly_payments;
CREATE TRIGGER set_created_by_tuition_monthly_payments
    BEFORE INSERT ON public.tuition_monthly_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_updated_by_tuition_monthly_payments ON public.tuition_monthly_payments;
CREATE TRIGGER set_updated_by_tuition_monthly_payments
    BEFORE UPDATE ON public.tuition_monthly_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_by();

-- Comments
COMMENT ON TABLE public.tuition_monthly_payments IS 'Monthly tuition payment tracking for enrollments';
COMMENT ON COLUMN public.tuition_monthly_payments.payment_month IS 'First day of the billing month';
COMMENT ON COLUMN public.tuition_monthly_payments.final_amount IS 'Amount after discounts and scholarships';
COMMENT ON COLUMN public.tuition_monthly_payments.donation_id IS 'Link to donation if payment is recorded through donation system';

-- ============================================================================
-- SECTION 5: TRIGGER TO UPDATE ENROLLMENT TUITION BALANCE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_enrollment_tuition()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the enrollment's tuition_paid and tuition_balance
    UPDATE public.enrollments
    SET
        tuition_paid = (
            SELECT COALESCE(SUM(final_amount), 0)
            FROM public.tuition_monthly_payments
            WHERE enrollment_id = COALESCE(NEW.enrollment_id, OLD.enrollment_id)
            AND status = 'paid'
        ),
        tuition_balance = (
            SELECT COALESCE(SUM(final_amount), 0)
            FROM public.tuition_monthly_payments
            WHERE enrollment_id = COALESCE(NEW.enrollment_id, OLD.enrollment_id)
            AND status IN ('pending', 'overdue')
        )
    WHERE id = COALESCE(NEW.enrollment_id, OLD.enrollment_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_enrollment_tuition ON public.tuition_monthly_payments;
CREATE TRIGGER update_enrollment_tuition
    AFTER INSERT OR UPDATE OR DELETE ON public.tuition_monthly_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_enrollment_tuition();

-- ============================================================================
-- SECTION 6: TRIGGER TO UPDATE ENROLLMENT ATTENDANCE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_enrollment_attendance()
RETURNS TRIGGER AS $$
DECLARE
    v_enrollment_id UUID;
BEGIN
    -- Find the enrollment for this student in this class
    SELECT id INTO v_enrollment_id
    FROM public.enrollments
    WHERE scheduled_class_id = COALESCE(NEW.scheduled_class_id, OLD.scheduled_class_id)
    AND member_id = COALESCE(NEW.member_id, OLD.member_id)
    AND status = 'active';

    IF v_enrollment_id IS NOT NULL THEN
        UPDATE public.enrollments
        SET
            total_classes = (
                SELECT COUNT(*)
                FROM public.attendance
                WHERE scheduled_class_id = COALESCE(NEW.scheduled_class_id, OLD.scheduled_class_id)
                AND member_id = COALESCE(NEW.member_id, OLD.member_id)
            ),
            attended_classes = (
                SELECT COUNT(*)
                FROM public.attendance
                WHERE scheduled_class_id = COALESCE(NEW.scheduled_class_id, OLD.scheduled_class_id)
                AND member_id = COALESCE(NEW.member_id, OLD.member_id)
                AND status IN ('present', 'late')
            ),
            attendance_percentage = (
                SELECT
                    CASE
                        WHEN COUNT(*) = 0 THEN 0
                        ELSE ROUND(
                            (COUNT(*) FILTER (WHERE status IN ('present', 'late'))::DECIMAL / COUNT(*)::DECIMAL) * 100,
                            2
                        )
                    END
                FROM public.attendance
                WHERE scheduled_class_id = COALESCE(NEW.scheduled_class_id, OLD.scheduled_class_id)
                AND member_id = COALESCE(NEW.member_id, OLD.member_id)
            )
        WHERE id = v_enrollment_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_enrollment_attendance ON public.attendance;
CREATE TRIGGER update_enrollment_attendance
    AFTER INSERT OR UPDATE OR DELETE ON public.attendance
    FOR EACH ROW
    EXECUTE FUNCTION public.update_enrollment_attendance();

-- ============================================================================
-- SECTION 7: ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tuition_monthly_payments ENABLE ROW LEVEL SECURITY;

-- Attendance policies
CREATE POLICY "attendance_select_org" ON public.attendance
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "attendance_insert_org" ON public.attendance
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "attendance_update_org" ON public.attendance
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_organization(organization_id))
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "attendance_delete_org" ON public.attendance
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "attendance_platform_admin" ON public.attendance
    FOR ALL TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- Evaluations policies
CREATE POLICY "evaluations_select_org" ON public.evaluations
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "evaluations_insert_org" ON public.evaluations
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "evaluations_update_org" ON public.evaluations
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_organization(organization_id))
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "evaluations_delete_org" ON public.evaluations
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "evaluations_platform_admin" ON public.evaluations
    FOR ALL TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- Student notes policies
CREATE POLICY "student_notes_select_org" ON public.student_notes
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "student_notes_insert_org" ON public.student_notes
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "student_notes_update_org" ON public.student_notes
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_organization(organization_id))
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "student_notes_delete_org" ON public.student_notes
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "student_notes_platform_admin" ON public.student_notes
    FOR ALL TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- Tuition payments policies
CREATE POLICY "tuition_payments_select_org" ON public.tuition_monthly_payments
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "tuition_payments_insert_org" ON public.tuition_monthly_payments
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "tuition_payments_update_org" ON public.tuition_monthly_payments
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_organization(organization_id))
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "tuition_payments_delete_org" ON public.tuition_monthly_payments
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "tuition_payments_platform_admin" ON public.tuition_monthly_payments
    FOR ALL TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- ============================================================================
-- SECTION 8: GRANTS
-- ============================================================================

GRANT ALL ON public.attendance TO service_role;
GRANT ALL ON public.evaluations TO service_role;
GRANT ALL ON public.student_notes TO service_role;
GRANT ALL ON public.tuition_monthly_payments TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tuition_monthly_payments TO authenticated;

-- ============================================================================
-- SECTION 9: AUDIT TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS audit_trigger_attendance ON public.attendance;
CREATE TRIGGER audit_trigger_attendance
    AFTER INSERT OR UPDATE OR DELETE ON public.attendance
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_trigger_evaluations ON public.evaluations;
CREATE TRIGGER audit_trigger_evaluations
    AFTER INSERT OR UPDATE OR DELETE ON public.evaluations
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_trigger_student_notes ON public.student_notes;
CREATE TRIGGER audit_trigger_student_notes
    AFTER INSERT OR UPDATE OR DELETE ON public.student_notes
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_trigger_tuition_monthly_payments ON public.tuition_monthly_payments;
CREATE TRIGGER audit_trigger_tuition_monthly_payments
    AFTER INSERT OR UPDATE OR DELETE ON public.tuition_monthly_payments
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================================================
-- END OF MIGRATION 00022
-- ============================================================================
