CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE "AcademicYearStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED');
CREATE TYPE "AcademicPeriodType" AS ENUM ('TERM', 'SEMESTER', 'QUARTER', 'CUSTOM');
CREATE TYPE "AcademicRecordStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "AcademicOfferingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "TeachingAssignmentRole" AS ENUM ('LEAD', 'ASSISTANT');
CREATE TYPE "TeachingAssignmentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ENDED');

CREATE TABLE academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(200) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status "AcademicYearStatus" NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT academic_year_dates_valid CHECK (start_date <= end_date),
  UNIQUE (school_id, code),
  UNIQUE (school_id, id)
);

CREATE INDEX academic_years_school_status_start_idx
  ON academic_years (school_id, status, start_date);

ALTER TABLE academic_years
  ADD CONSTRAINT academic_years_no_overlapping_active
  EXCLUDE USING gist (
    school_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  )
  WHERE (status = 'ACTIVE'::"AcademicYearStatus");

CREATE TABLE academic_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  academic_year_id UUID NOT NULL,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(200) NOT NULL,
  period_type "AcademicPeriodType" NOT NULL,
  sequence_number INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status "AcademicRecordStatus" NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT academic_period_sequence_positive CHECK (sequence_number > 0),
  CONSTRAINT academic_period_dates_valid CHECK (start_date <= end_date),
  CONSTRAINT academic_period_year_tenant_fk
    FOREIGN KEY (school_id, academic_year_id)
    REFERENCES academic_years(school_id, id) ON DELETE RESTRICT,
  UNIQUE (school_id, academic_year_id, code),
  UNIQUE (school_id, academic_year_id, sequence_number),
  UNIQUE (school_id, id)
);

CREATE INDEX academic_periods_school_year_status_idx
  ON academic_periods (school_id, academic_year_id, status);

CREATE TABLE grade_level_masters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(200) NOT NULL,
  sequence_number INTEGER NOT NULL,
  status "AcademicRecordStatus" NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT grade_level_sequence_positive CHECK (sequence_number > 0),
  UNIQUE (school_id, code),
  UNIQUE (school_id, sequence_number),
  UNIQUE (school_id, id)
);

CREATE INDEX grade_level_masters_school_status_sequence_idx
  ON grade_level_masters (school_id, status, sequence_number);

CREATE TABLE class_offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  branch_id UUID NOT NULL,
  academic_year_id UUID NOT NULL,
  grade_level_id UUID NOT NULL,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(200) NOT NULL,
  capacity INTEGER NOT NULL,
  status "AcademicOfferingStatus" NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT class_offering_capacity_positive CHECK (capacity > 0),
  CONSTRAINT class_offering_branch_tenant_fk
    FOREIGN KEY (school_id, branch_id)
    REFERENCES branches(school_id, id) ON DELETE RESTRICT,
  CONSTRAINT class_offering_year_tenant_fk
    FOREIGN KEY (school_id, academic_year_id)
    REFERENCES academic_years(school_id, id) ON DELETE RESTRICT,
  CONSTRAINT class_offering_grade_tenant_fk
    FOREIGN KEY (school_id, grade_level_id)
    REFERENCES grade_level_masters(school_id, id) ON DELETE RESTRICT,
  UNIQUE (school_id, branch_id, academic_year_id, grade_level_id),
  UNIQUE (school_id, branch_id, academic_year_id, code),
  UNIQUE (school_id, id)
);

CREATE INDEX class_offerings_school_branch_year_status_idx
  ON class_offerings (school_id, branch_id, academic_year_id, status);

CREATE TABLE section_offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  class_offering_id UUID NOT NULL,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(200) NOT NULL,
  capacity INTEGER NOT NULL,
  status "AcademicOfferingStatus" NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT section_offering_capacity_positive CHECK (capacity > 0),
  CONSTRAINT section_offering_class_tenant_fk
    FOREIGN KEY (school_id, class_offering_id)
    REFERENCES class_offerings(school_id, id) ON DELETE RESTRICT,
  UNIQUE (school_id, class_offering_id, code),
  UNIQUE (school_id, id)
);

CREATE INDEX section_offerings_school_class_status_idx
  ON section_offerings (school_id, class_offering_id, status);

CREATE TABLE subject_masters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(200) NOT NULL,
  short_name VARCHAR(40) NOT NULL,
  status "AcademicRecordStatus" NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  UNIQUE (school_id, code),
  UNIQUE (school_id, id)
);

CREATE INDEX subject_masters_school_status_name_idx
  ON subject_masters (school_id, status, name);

CREATE TABLE subject_offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  branch_id UUID NOT NULL,
  academic_year_id UUID NOT NULL,
  class_offering_id UUID NOT NULL,
  subject_master_id UUID NOT NULL,
  compulsory BOOLEAN NOT NULL DEFAULT true,
  weekly_periods INTEGER NOT NULL,
  status "AcademicOfferingStatus" NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT subject_offering_weekly_periods_valid
    CHECK (weekly_periods > 0 AND weekly_periods <= 30),
  CONSTRAINT subject_offering_branch_tenant_fk
    FOREIGN KEY (school_id, branch_id)
    REFERENCES branches(school_id, id) ON DELETE RESTRICT,
  CONSTRAINT subject_offering_year_tenant_fk
    FOREIGN KEY (school_id, academic_year_id)
    REFERENCES academic_years(school_id, id) ON DELETE RESTRICT,
  CONSTRAINT subject_offering_class_tenant_fk
    FOREIGN KEY (school_id, class_offering_id)
    REFERENCES class_offerings(school_id, id) ON DELETE RESTRICT,
  CONSTRAINT subject_offering_subject_tenant_fk
    FOREIGN KEY (school_id, subject_master_id)
    REFERENCES subject_masters(school_id, id) ON DELETE RESTRICT,
  UNIQUE (school_id, class_offering_id, subject_master_id),
  UNIQUE (school_id, id)
);

CREATE INDEX subject_offerings_school_branch_year_status_idx
  ON subject_offerings (school_id, branch_id, academic_year_id, status);

CREATE TABLE teaching_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  branch_id UUID NOT NULL,
  subject_offering_id UUID NOT NULL,
  section_offering_id UUID NOT NULL,
  teacher_membership_id UUID NOT NULL,
  role "TeachingAssignmentRole" NOT NULL DEFAULT 'LEAD',
  effective_from DATE NOT NULL,
  effective_to DATE,
  status "TeachingAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT teaching_assignment_dates_valid
    CHECK (effective_to IS NULL OR effective_from <= effective_to),
  CONSTRAINT teaching_assignment_branch_tenant_fk
    FOREIGN KEY (school_id, branch_id)
    REFERENCES branches(school_id, id) ON DELETE RESTRICT,
  CONSTRAINT teaching_assignment_subject_tenant_fk
    FOREIGN KEY (school_id, subject_offering_id)
    REFERENCES subject_offerings(school_id, id) ON DELETE RESTRICT,
  CONSTRAINT teaching_assignment_section_tenant_fk
    FOREIGN KEY (school_id, section_offering_id)
    REFERENCES section_offerings(school_id, id) ON DELETE RESTRICT,
  CONSTRAINT teaching_assignment_membership_tenant_fk
    FOREIGN KEY (school_id, teacher_membership_id)
    REFERENCES memberships(school_id, id) ON DELETE RESTRICT,
  UNIQUE (
    school_id,
    subject_offering_id,
    section_offering_id,
    teacher_membership_id,
    effective_from
  ),
  UNIQUE (school_id, id)
);

CREATE INDEX teaching_assignments_school_branch_teacher_status_idx
  ON teaching_assignments (school_id, branch_id, teacher_membership_id, status);

CREATE OR REPLACE FUNCTION app_private.validate_academic_period()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public, app_private
AS $$
DECLARE
  v_year_start DATE;
  v_year_end DATE;
BEGIN
  SELECT start_date, end_date
  INTO v_year_start, v_year_end
  FROM public.academic_years
  WHERE school_id = NEW.school_id
    AND id = NEW.academic_year_id;

  IF v_year_start IS NULL THEN
    RAISE EXCEPTION 'Academic year not found';
  END IF;

  IF NEW.start_date < v_year_start OR NEW.end_date > v_year_end THEN
    RAISE EXCEPTION 'Academic period must be inside the academic year';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER academic_period_validate_dates
BEFORE INSERT OR UPDATE ON academic_periods
FOR EACH ROW EXECUTE FUNCTION app_private.validate_academic_period();

CREATE OR REPLACE FUNCTION app_private.validate_subject_offering()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public, app_private
AS $$
DECLARE
  v_class_branch_id UUID;
  v_class_year_id UUID;
BEGIN
  SELECT branch_id, academic_year_id
  INTO v_class_branch_id, v_class_year_id
  FROM public.class_offerings
  WHERE school_id = NEW.school_id
    AND id = NEW.class_offering_id;

  IF v_class_branch_id IS NULL THEN
    RAISE EXCEPTION 'Class offering not found';
  END IF;

  IF v_class_branch_id <> NEW.branch_id OR v_class_year_id <> NEW.academic_year_id THEN
    RAISE EXCEPTION 'Subject offering branch and academic year must match the class offering';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER subject_offering_validate_scope
BEFORE INSERT OR UPDATE ON subject_offerings
FOR EACH ROW EXECUTE FUNCTION app_private.validate_subject_offering();

CREATE OR REPLACE FUNCTION app_private.validate_teaching_assignment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public, app_private
AS $$
DECLARE
  v_subject_branch_id UUID;
  v_subject_class_id UUID;
  v_section_class_id UUID;
  v_teacher_branch_id UUID;
  v_teacher_type VARCHAR;
  v_teacher_status "MembershipStatus";
BEGIN
  SELECT branch_id, class_offering_id
  INTO v_subject_branch_id, v_subject_class_id
  FROM public.subject_offerings
  WHERE school_id = NEW.school_id
    AND id = NEW.subject_offering_id;

  SELECT class_offering_id
  INTO v_section_class_id
  FROM public.section_offerings
  WHERE school_id = NEW.school_id
    AND id = NEW.section_offering_id;

  SELECT branch_id, membership_type, status
  INTO v_teacher_branch_id, v_teacher_type, v_teacher_status
  FROM public.memberships
  WHERE school_id = NEW.school_id
    AND id = NEW.teacher_membership_id;

  IF v_subject_branch_id IS NULL OR v_section_class_id IS NULL OR v_teacher_type IS NULL THEN
    RAISE EXCEPTION 'Teaching assignment reference not found';
  END IF;

  IF v_subject_branch_id <> NEW.branch_id OR v_subject_class_id <> v_section_class_id THEN
    RAISE EXCEPTION 'Teaching assignment scope is inconsistent';
  END IF;

  IF v_teacher_status <> 'ACTIVE'::"MembershipStatus"
     OR v_teacher_type NOT IN ('TEACHER', 'EMPLOYEE') THEN
    RAISE EXCEPTION 'Selected membership is not an active teacher or employee';
  END IF;

  IF v_teacher_branch_id IS NOT NULL AND v_teacher_branch_id <> NEW.branch_id THEN
    RAISE EXCEPTION 'Teacher membership does not cover the selected branch';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER teaching_assignment_validate_scope
BEFORE INSERT OR UPDATE ON teaching_assignments
FOR EACH ROW EXECUTE FUNCTION app_private.validate_teaching_assignment();

CREATE OR REPLACE FUNCTION app_private.get_membership_authorization(
  p_auth_user_id UUID,
  p_membership_id UUID,
  p_permission_key TEXT
)
RETURNS TABLE (
  user_account_id UUID,
  membership_id UUID,
  school_id UUID,
  branch_id UUID,
  membership_type VARCHAR,
  person_display_name VARCHAR,
  permission_granted BOOLEAN
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, app_private
AS $$
  SELECT
    ua.id AS user_account_id,
    m.id AS membership_id,
    m.school_id,
    m.branch_id,
    m.membership_type,
    sp.display_name AS person_display_name,
    EXISTS (
      SELECT 1
      FROM public.membership_roles mr
      JOIN public.roles r
        ON r.id = mr.role_id
       AND r.status = 'ACTIVE'
      JOIN public.role_permissions rp
        ON rp.role_id = r.id
       AND rp.effect = 'ALLOW'
      WHERE mr.school_id = m.school_id
        AND mr.membership_id = m.id
        AND (
          rp.permission_key = p_permission_key
          OR (
            p_permission_key = 'academic.read'
            AND rp.permission_key = 'academic.manage'
          )
        )
        AND mr.effective_from <= now()
        AND (mr.effective_to IS NULL OR mr.effective_to > now())
        AND (
          mr.scope_type = 'SCHOOL'
          OR (
            mr.scope_type = 'BRANCH'
            AND mr.scope_reference_id = m.branch_id
          )
        )
    ) AS permission_granted
  FROM public.user_accounts ua
  JOIN public.memberships m
    ON m.user_account_id = ua.id
  JOIN public.schools s
    ON s.id = m.school_id
  JOIN public.school_people sp
    ON sp.school_id = m.school_id
   AND sp.id = m.school_person_id
  WHERE ua.auth_user_id = p_auth_user_id
    AND ua.account_status = 'ACTIVE'
    AND m.id = p_membership_id
    AND m.status = 'ACTIVE'::"MembershipStatus"
    AND s.status = 'ACTIVE'::"TenantStatus"
    AND (m.effective_to IS NULL OR m.effective_to > now());
$$;

REVOKE ALL ON FUNCTION app_private.get_membership_authorization(UUID, UUID, TEXT)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.get_membership_authorization(UUID, UUID, TEXT)
  TO postgres, service_role;

INSERT INTO permissions (key, description, risk_level)
VALUES
  ('academic.read', 'Read academic setup', 'LOW'),
  ('academic.manage', 'Manage academic configuration', 'HIGH')
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_key, effect)
SELECT role.id, permission.key, 'ALLOW'
FROM roles role
CROSS JOIN permissions permission
WHERE role.code = 'SCHOOL_OWNER'
  AND permission.key IN ('academic.read', 'academic.manage')
ON CONFLICT (role_id, permission_key) DO NOTHING;

ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years FORCE ROW LEVEL SECURITY;
CREATE POLICY academic_years_tenant_isolation ON academic_years
  FOR ALL
  USING (school_id = app_private.current_school_id())
  WITH CHECK (school_id = app_private.current_school_id());

ALTER TABLE academic_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_periods FORCE ROW LEVEL SECURITY;
CREATE POLICY academic_periods_tenant_isolation ON academic_periods
  FOR ALL
  USING (school_id = app_private.current_school_id())
  WITH CHECK (school_id = app_private.current_school_id());

ALTER TABLE grade_level_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_level_masters FORCE ROW LEVEL SECURITY;
CREATE POLICY grade_level_masters_tenant_isolation ON grade_level_masters
  FOR ALL
  USING (school_id = app_private.current_school_id())
  WITH CHECK (school_id = app_private.current_school_id());

ALTER TABLE class_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_offerings FORCE ROW LEVEL SECURITY;
CREATE POLICY class_offerings_tenant_isolation ON class_offerings
  FOR ALL
  USING (school_id = app_private.current_school_id())
  WITH CHECK (school_id = app_private.current_school_id());

ALTER TABLE section_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_offerings FORCE ROW LEVEL SECURITY;
CREATE POLICY section_offerings_tenant_isolation ON section_offerings
  FOR ALL
  USING (school_id = app_private.current_school_id())
  WITH CHECK (school_id = app_private.current_school_id());

ALTER TABLE subject_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_masters FORCE ROW LEVEL SECURITY;
CREATE POLICY subject_masters_tenant_isolation ON subject_masters
  FOR ALL
  USING (school_id = app_private.current_school_id())
  WITH CHECK (school_id = app_private.current_school_id());

ALTER TABLE subject_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_offerings FORCE ROW LEVEL SECURITY;
CREATE POLICY subject_offerings_tenant_isolation ON subject_offerings
  FOR ALL
  USING (school_id = app_private.current_school_id())
  WITH CHECK (school_id = app_private.current_school_id());

ALTER TABLE teaching_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_assignments FORCE ROW LEVEL SECURITY;
CREATE POLICY teaching_assignments_tenant_isolation ON teaching_assignments
  FOR ALL
  USING (school_id = app_private.current_school_id())
  WITH CHECK (school_id = app_private.current_school_id());
