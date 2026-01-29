-- ============================================================================
-- MOSQOS - MIGRATION 00020: EDUCATION MODULE - CORE TABLES
-- Description: Courses, classrooms, and teachers tables
-- ============================================================================

-- ============================================================================
-- SECTION 1: COURSES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Course identity
    name VARCHAR(255) NOT NULL,
    description TEXT,
    code VARCHAR(50),  -- Course code (e.g., QRN101)

    -- Classification
    level VARCHAR(50) CHECK (
        level IN ('beginner', 'intermediate', 'advanced', 'all_levels')
    ),
    subject VARCHAR(100),  -- Quran, Arabic, Islamic Studies, etc.
    category VARCHAR(100),  -- Kids, Youth, Adults, etc.

    -- Duration
    duration_weeks INTEGER,
    duration_hours INTEGER,  -- Total hours

    -- Tuition
    tuition_fee DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Capacity
    min_students INTEGER DEFAULT 1,
    max_students INTEGER,

    -- Prerequisites
    prerequisites JSONB DEFAULT '[]'::JSONB,  -- Array of course IDs

    -- Materials
    syllabus TEXT,
    materials JSONB DEFAULT '[]'::JSONB,  -- Array of material objects

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,

    -- Image
    image_url TEXT,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for courses
CREATE INDEX IF NOT EXISTS idx_courses_organization_id ON public.courses(organization_id);
CREATE INDEX IF NOT EXISTS idx_courses_level ON public.courses(organization_id, level);
CREATE INDEX IF NOT EXISTS idx_courses_subject ON public.courses(organization_id, subject) WHERE subject IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(organization_id, category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_courses_active ON public.courses(organization_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_courses_code ON public.courses(organization_id, code) WHERE code IS NOT NULL;

-- Triggers for courses
DROP TRIGGER IF EXISTS set_updated_at_courses ON public.courses;
CREATE TRIGGER set_updated_at_courses
    BEFORE UPDATE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_created_by_courses ON public.courses;
CREATE TRIGGER set_created_by_courses
    BEFORE INSERT ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_updated_by_courses ON public.courses;
CREATE TRIGGER set_updated_by_courses
    BEFORE UPDATE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_by();

-- Comments
COMMENT ON TABLE public.courses IS 'Educational courses offered by the organization';
COMMENT ON COLUMN public.courses.level IS 'Course difficulty: beginner, intermediate, advanced, all_levels';
COMMENT ON COLUMN public.courses.subject IS 'Subject area: Quran, Arabic, Islamic Studies, etc.';
COMMENT ON COLUMN public.courses.prerequisites IS 'JSON array of prerequisite course IDs';
COMMENT ON COLUMN public.courses.materials IS 'JSON array of course materials/resources';

-- ============================================================================
-- SECTION 2: CLASSROOMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Room identity
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),  -- Room number/code

    -- Location
    location VARCHAR(255),  -- Building, floor, etc.
    address TEXT,  -- Full address if off-site

    -- Capacity
    capacity INTEGER,

    -- Facilities
    facilities JSONB DEFAULT '[]'::JSONB,  -- Array of facility strings
    equipment JSONB DEFAULT '[]'::JSONB,  -- Array of equipment objects

    -- Virtual room support
    is_virtual BOOLEAN DEFAULT FALSE,
    virtual_link TEXT,  -- Zoom, Google Meet, etc.

    -- Availability
    availability JSONB DEFAULT '{}'::JSONB,  -- Weekly schedule

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Image
    image_url TEXT,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for classrooms
CREATE INDEX IF NOT EXISTS idx_classrooms_organization_id ON public.classrooms(organization_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_active ON public.classrooms(organization_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_classrooms_location ON public.classrooms(organization_id, location) WHERE location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_classrooms_virtual ON public.classrooms(organization_id, is_virtual);

-- Triggers for classrooms
DROP TRIGGER IF EXISTS set_updated_at_classrooms ON public.classrooms;
CREATE TRIGGER set_updated_at_classrooms
    BEFORE UPDATE ON public.classrooms
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_created_by_classrooms ON public.classrooms;
CREATE TRIGGER set_created_by_classrooms
    BEFORE INSERT ON public.classrooms
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_updated_by_classrooms ON public.classrooms;
CREATE TRIGGER set_updated_by_classrooms
    BEFORE UPDATE ON public.classrooms
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_by();

-- Comments
COMMENT ON TABLE public.classrooms IS 'Physical and virtual classroom/learning spaces';
COMMENT ON COLUMN public.classrooms.facilities IS 'JSON array of available facilities (whiteboard, projector, etc.)';
COMMENT ON COLUMN public.classrooms.availability IS 'JSON object with weekly availability schedule';
COMMENT ON COLUMN public.classrooms.is_virtual IS 'Whether this is a virtual/online classroom';

-- ============================================================================
-- SECTION 3: TEACHERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Link to member (optional)
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,

    -- Teacher identity (if not linked to member)
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),

    -- Professional info
    specialization VARCHAR(255),  -- Quran, Arabic, Fiqh, etc.
    qualifications TEXT,
    certifications JSONB DEFAULT '[]'::JSONB,
    bio TEXT,

    -- Availability
    availability JSONB DEFAULT '{}'::JSONB,  -- Weekly schedule
    max_hours_per_week INTEGER,

    -- Compensation
    hourly_rate DECIMAL(10,2),
    compensation_type VARCHAR(50) CHECK (
        compensation_type IN ('volunteer', 'hourly', 'monthly', 'per_class')
    ),
    currency VARCHAR(3) DEFAULT 'USD',

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    hire_date DATE,
    end_date DATE,

    -- Profile
    photo_url TEXT,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for teachers
CREATE INDEX IF NOT EXISTS idx_teachers_organization_id ON public.teachers(organization_id);
CREATE INDEX IF NOT EXISTS idx_teachers_member_id ON public.teachers(member_id) WHERE member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_teachers_active ON public.teachers(organization_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_teachers_specialization ON public.teachers(organization_id, specialization) WHERE specialization IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_teachers_email ON public.teachers(email) WHERE email IS NOT NULL;

-- Triggers for teachers
DROP TRIGGER IF EXISTS set_updated_at_teachers ON public.teachers;
CREATE TRIGGER set_updated_at_teachers
    BEFORE UPDATE ON public.teachers
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_created_by_teachers ON public.teachers;
CREATE TRIGGER set_created_by_teachers
    BEFORE INSERT ON public.teachers
    FOR EACH ROW
    EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_updated_by_teachers ON public.teachers;
CREATE TRIGGER set_updated_by_teachers
    BEFORE UPDATE ON public.teachers
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_by();

-- Comments
COMMENT ON TABLE public.teachers IS 'Teachers/instructors for educational programs';
COMMENT ON COLUMN public.teachers.member_id IS 'Optional link to member record if teacher is also a member';
COMMENT ON COLUMN public.teachers.specialization IS 'Teaching specialization: Quran, Arabic, Fiqh, etc.';
COMMENT ON COLUMN public.teachers.certifications IS 'JSON array of certification objects';
COMMENT ON COLUMN public.teachers.availability IS 'JSON object with weekly availability schedule';
COMMENT ON COLUMN public.teachers.compensation_type IS 'How teacher is compensated: volunteer, hourly, monthly, per_class';

-- ============================================================================
-- SECTION 4: ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Courses policies
CREATE POLICY "courses_select_org" ON public.courses
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "courses_insert_org" ON public.courses
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "courses_update_org" ON public.courses
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_organization(organization_id))
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "courses_delete_org" ON public.courses
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "courses_platform_admin" ON public.courses
    FOR ALL TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- Classrooms policies
CREATE POLICY "classrooms_select_org" ON public.classrooms
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "classrooms_insert_org" ON public.classrooms
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "classrooms_update_org" ON public.classrooms
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_organization(organization_id))
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "classrooms_delete_org" ON public.classrooms
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "classrooms_platform_admin" ON public.classrooms
    FOR ALL TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- Teachers policies
CREATE POLICY "teachers_select_org" ON public.teachers
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "teachers_insert_org" ON public.teachers
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "teachers_update_org" ON public.teachers
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_organization(organization_id))
    WITH CHECK (public.user_belongs_to_organization(organization_id));

CREATE POLICY "teachers_delete_org" ON public.teachers
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_organization(organization_id));

CREATE POLICY "teachers_platform_admin" ON public.teachers
    FOR ALL TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- ============================================================================
-- SECTION 5: GRANTS
-- ============================================================================

GRANT ALL ON public.courses TO service_role;
GRANT ALL ON public.classrooms TO service_role;
GRANT ALL ON public.teachers TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classrooms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teachers TO authenticated;

-- ============================================================================
-- SECTION 6: AUDIT TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS audit_trigger_courses ON public.courses;
CREATE TRIGGER audit_trigger_courses
    AFTER INSERT OR UPDATE OR DELETE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_trigger_classrooms ON public.classrooms;
CREATE TRIGGER audit_trigger_classrooms
    AFTER INSERT OR UPDATE OR DELETE ON public.classrooms
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_trigger_teachers ON public.teachers;
CREATE TRIGGER audit_trigger_teachers
    AFTER INSERT OR UPDATE OR DELETE ON public.teachers
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================================================
-- END OF MIGRATION 00020
-- ============================================================================
