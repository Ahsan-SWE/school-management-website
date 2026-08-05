CREATE OR REPLACE FUNCTION app_private.list_user_memberships(p_auth_user_id UUID)
RETURNS TABLE (
  membership_id UUID,
  school_id UUID,
  school_code VARCHAR,
  school_name VARCHAR,
  school_status TEXT,
  branch_id UUID,
  branch_code VARCHAR,
  branch_name VARCHAR,
  membership_type VARCHAR,
  membership_status TEXT,
  person_display_name VARCHAR
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, app_private
AS $$
  SELECT
    m.id AS membership_id,
    s.id AS school_id,
    s.code AS school_code,
    s.name AS school_name,
    s.status::text AS school_status,
    b.id AS branch_id,
    b.code AS branch_code,
    b.name AS branch_name,
    m.membership_type,
    m.status::text AS membership_status,
    sp.display_name AS person_display_name
  FROM public.user_accounts ua
  JOIN public.memberships m
    ON m.user_account_id = ua.id
  JOIN public.schools s
    ON s.id = m.school_id
  JOIN public.school_people sp
    ON sp.school_id = m.school_id
   AND sp.id = m.school_person_id
  LEFT JOIN public.branches b
    ON b.school_id = m.school_id
   AND b.id = m.branch_id
  WHERE ua.auth_user_id = p_auth_user_id
    AND ua.account_status = 'ACTIVE'
    AND m.status = 'ACTIVE'::public."MembershipStatus"
    AND (m.effective_to IS NULL OR m.effective_to > now())
  ORDER BY s.name, b.name NULLS FIRST;
$$;

CREATE OR REPLACE FUNCTION app_private.get_user_membership_context(
  p_auth_user_id UUID,
  p_membership_id UUID
)
RETURNS TABLE (
  membership_id UUID,
  school_id UUID,
  school_code VARCHAR,
  school_name VARCHAR,
  school_status TEXT,
  branch_id UUID,
  branch_code VARCHAR,
  branch_name VARCHAR,
  membership_type VARCHAR,
  membership_status TEXT,
  person_display_name VARCHAR
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, app_private
AS $$
  SELECT membership.*
  FROM app_private.list_user_memberships(p_auth_user_id) membership
  WHERE membership.membership_id = p_membership_id;
$$;

CREATE OR REPLACE FUNCTION app_private.provision_school_owner(
  p_auth_user_id UUID,
  p_email TEXT,
  p_owner_display_name TEXT,
  p_school_name TEXT,
  p_school_code TEXT,
  p_branch_name TEXT,
  p_branch_code TEXT
)
RETURNS TABLE (
  school_id UUID,
  branch_id UUID,
  membership_id UUID,
  school_code VARCHAR,
  school_name VARCHAR,
  branch_code VARCHAR,
  branch_name VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, app_private
AS $$
DECLARE
  v_user_account_id UUID;
  v_school_id UUID;
  v_branch_id UUID;
  v_person_id UUID;
  v_membership_id UUID;
  v_owner_role_id UUID;
  v_existing_school_id UUID;
  v_existing_branch_id UUID;
  v_existing_membership_id UUID;
BEGIN
  IF p_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Authenticated user ID is required';
  END IF;

  IF trim(p_school_name) = '' OR trim(p_school_code) = '' THEN
    RAISE EXCEPTION 'School name and code are required';
  END IF;

  SELECT
    s.id,
    b.id,
    m.id
  INTO
    v_existing_school_id,
    v_existing_branch_id,
    v_existing_membership_id
  FROM public.user_accounts ua
  JOIN public.memberships m
    ON m.user_account_id = ua.id
   AND m.membership_type = 'SCHOOL_OWNER'
  JOIN public.schools s
    ON s.id = m.school_id
   AND s.code = upper(trim(p_school_code))
  LEFT JOIN public.branches b
    ON b.school_id = m.school_id
   AND b.id = m.branch_id
  WHERE ua.auth_user_id = p_auth_user_id
  LIMIT 1;

  IF v_existing_school_id IS NOT NULL THEN
    RETURN QUERY
    SELECT
      s.id,
      b.id,
      v_existing_membership_id,
      s.code,
      s.name,
      b.code,
      b.name
    FROM public.schools s
    JOIN public.branches b
      ON b.school_id = s.id
     AND b.id = v_existing_branch_id
    WHERE s.id = v_existing_school_id;
    RETURN;
  END IF;

  INSERT INTO public.user_accounts AS account (
    auth_user_id,
    email,
    account_status,
    preferred_locale
  )
  VALUES (
    p_auth_user_id,
    NULLIF(trim(p_email), '')::citext,
    'ACTIVE',
    'bn-BD'
  )
  ON CONFLICT (auth_user_id)
  DO UPDATE SET
    email = COALESCE(EXCLUDED.email, account.email),
    account_status = 'ACTIVE',
    updated_at = now(),
    version = account.version + 1
  RETURNING id INTO v_user_account_id;

  INSERT INTO public.schools (
    code,
    name,
    status
  )
  VALUES (
    upper(trim(p_school_code)),
    trim(p_school_name),
    'ACTIVE'::public."TenantStatus"
  )
  RETURNING id INTO v_school_id;

  INSERT INTO public.branches (
    school_id,
    code,
    name,
    status
  )
  VALUES (
    v_school_id,
    upper(trim(p_branch_code)),
    trim(p_branch_name),
    'ACTIVE'::public."BranchStatus"
  )
  RETURNING id INTO v_branch_id;

  INSERT INTO public.school_people (
    school_id,
    user_account_id,
    person_type,
    display_name,
    status
  )
  VALUES (
    v_school_id,
    v_user_account_id,
    'SCHOOL_OWNER',
    trim(p_owner_display_name),
    'ACTIVE'::public."PersonStatus"
  )
  RETURNING id INTO v_person_id;

  INSERT INTO public.memberships (
    school_id,
    branch_id,
    user_account_id,
    school_person_id,
    membership_type,
    status
  )
  VALUES (
    v_school_id,
    v_branch_id,
    v_user_account_id,
    v_person_id,
    'SCHOOL_OWNER',
    'ACTIVE'::public."MembershipStatus"
  )
  RETURNING id INTO v_membership_id;

  INSERT INTO public.roles (
    school_id,
    code,
    name,
    role_type,
    status
  )
  VALUES (
    v_school_id,
    'SCHOOL_OWNER',
    'School Owner',
    'SYSTEM',
    'ACTIVE'
  )
  RETURNING id INTO v_owner_role_id;

  INSERT INTO public.permissions (key, description, risk_level)
  VALUES
    ('dashboard.read', 'Read the school dashboard', 'LOW'),
    ('school.settings.manage', 'Manage school and branch settings', 'HIGH'),
    ('school.members.manage', 'Manage school memberships and roles', 'HIGH'),
    ('academic.manage', 'Manage academic configuration', 'HIGH')
  ON CONFLICT (key) DO NOTHING;

  INSERT INTO public.role_permissions (role_id, permission_key, effect)
  SELECT v_owner_role_id, permission.key, 'ALLOW'
  FROM public.permissions permission
  WHERE permission.key IN (
    'dashboard.read',
    'school.settings.manage',
    'school.members.manage',
    'academic.manage'
  )
  ON CONFLICT (role_id, permission_key) DO NOTHING;

  INSERT INTO public.membership_roles (
    school_id,
    membership_id,
    role_id,
    scope_type,
    scope_reference_id
  )
  VALUES (
    v_school_id,
    v_membership_id,
    v_owner_role_id,
    'SCHOOL',
    v_school_id
  );

  INSERT INTO public.audit_events (
    school_id,
    actor_id,
    membership_id,
    action,
    resource_type,
    resource_id,
    outcome,
    metadata
  )
  VALUES (
    v_school_id,
    v_user_account_id,
    v_membership_id,
    'school.provisioned',
    'school',
    v_school_id,
    'SUCCESS',
    jsonb_build_object(
      'branch_id', v_branch_id,
      'source', 'self_service_onboarding'
    )
  );

  INSERT INTO public.outbox_events (
    school_id,
    event_type,
    aggregate_type,
    aggregate_id,
    payload,
    correlation_id
  )
  VALUES (
    v_school_id,
    'school.provisioned.v1',
    'school',
    v_school_id,
    jsonb_build_object(
      'schoolId', v_school_id,
      'branchId', v_branch_id,
      'ownerMembershipId', v_membership_id
    ),
    gen_random_uuid()::text
  );

  RETURN QUERY
  SELECT
    s.id,
    b.id,
    v_membership_id,
    s.code,
    s.name,
    b.code,
    b.name
  FROM public.schools s
  JOIN public.branches b
    ON b.school_id = s.id
   AND b.id = v_branch_id
  WHERE s.id = v_school_id;
END;
$$;

REVOKE ALL ON FUNCTION app_private.list_user_memberships(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.get_user_membership_context(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.provision_school_owner(
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION app_private.list_user_memberships(UUID) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION app_private.get_user_membership_context(UUID, UUID)
  TO postgres, service_role;
GRANT EXECUTE ON FUNCTION app_private.provision_school_owner(
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT
) TO postgres, service_role;
