CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;

CREATE TYPE "TenantStatus" AS ENUM (
  'PENDING',
  'ACTIVE',
  'RESTRICTED',
  'SUSPENDED',
  'TERMINATED'
);

CREATE TYPE "BranchStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "PersonStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'ENDED');
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED');

CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  status "TenantStatus" NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(200) NOT NULL,
  status "BranchStatus" NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  UNIQUE (school_id, code),
  UNIQUE (school_id, id)
);

CREATE INDEX branches_school_status_idx ON branches (school_id, status);

CREATE TABLE user_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE,
  email CITEXT,
  phone VARCHAR(40),
  account_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  preferred_locale VARCHAR(20) NOT NULL DEFAULT 'bn-BD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE school_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  user_account_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
  person_type VARCHAR(40) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  status "PersonStatus" NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  UNIQUE (school_id, id)
);

CREATE INDEX school_people_school_name_idx ON school_people (school_id, display_name);
CREATE INDEX school_people_user_idx ON school_people (school_id, user_account_id);

CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  branch_id UUID,
  user_account_id UUID NOT NULL REFERENCES user_accounts(id) ON DELETE RESTRICT,
  school_person_id UUID NOT NULL,
  membership_type VARCHAR(40) NOT NULL,
  status "MembershipStatus" NOT NULL DEFAULT 'INVITED',
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  UNIQUE (school_id, id),
  CONSTRAINT memberships_branch_tenant_fk
    FOREIGN KEY (school_id, branch_id) REFERENCES branches(school_id, id) ON DELETE RESTRICT,
  CONSTRAINT memberships_person_tenant_fk
    FOREIGN KEY (school_id, school_person_id)
    REFERENCES school_people(school_id, id) ON DELETE RESTRICT
);

CREATE INDEX memberships_school_user_status_idx
  ON memberships (school_id, user_account_id, status);
CREATE INDEX memberships_school_person_idx
  ON memberships (school_id, school_person_id);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE RESTRICT,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(120) NOT NULL,
  role_type VARCHAR(40) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  UNIQUE (school_id, code)
);

CREATE INDEX roles_school_status_idx ON roles (school_id, status);

CREATE TABLE permissions (
  key VARCHAR(160) PRIMARY KEY,
  description VARCHAR(500) NOT NULL,
  risk_level VARCHAR(30) NOT NULL DEFAULT 'LOW',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_key VARCHAR(160) NOT NULL REFERENCES permissions(key) ON DELETE CASCADE,
  effect VARCHAR(10) NOT NULL DEFAULT 'ALLOW',
  PRIMARY KEY (role_id, permission_key)
);

CREATE TABLE membership_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  membership_id UUID NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  scope_type VARCHAR(40) NOT NULL,
  scope_reference_id UUID,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT membership_roles_membership_tenant_fk
    FOREIGN KEY (school_id, membership_id)
    REFERENCES memberships(school_id, id) ON DELETE CASCADE
);

CREATE INDEX membership_roles_membership_idx ON membership_roles (school_id, membership_id);
CREATE INDEX membership_roles_role_idx ON membership_roles (role_id);

CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  actor_id UUID,
  membership_id UUID,
  action VARCHAR(160) NOT NULL,
  resource_type VARCHAR(120) NOT NULL,
  resource_id UUID,
  outcome VARCHAR(30) NOT NULL,
  reason VARCHAR(500),
  request_id VARCHAR(120),
  trace_id VARCHAR(120),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX audit_events_school_created_idx ON audit_events (school_id, created_at);
CREATE INDEX audit_events_resource_idx
  ON audit_events (school_id, resource_type, resource_id);

CREATE TABLE outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  event_type VARCHAR(160) NOT NULL,
  aggregate_type VARCHAR(120) NOT NULL,
  aggregate_id UUID NOT NULL,
  payload JSONB NOT NULL,
  correlation_id VARCHAR(120) NOT NULL,
  status "OutboxStatus" NOT NULL DEFAULT 'PENDING',
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX outbox_events_status_available_idx ON outbox_events (status, available_at);
CREATE INDEX outbox_events_aggregate_idx
  ON outbox_events (school_id, aggregate_type, aggregate_id);

CREATE OR REPLACE FUNCTION app_private.current_school_id()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
  SELECT NULLIF(current_setting('app.school_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app_private.current_user_account_id()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
  SELECT NULLIF(current_setting('app.user_account_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app_private.current_membership_id()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
  SELECT NULLIF(current_setting('app.membership_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app_private.current_branch_id()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
  SELECT NULLIF(current_setting('app.branch_id', true), '')::uuid
$$;

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools FORCE ROW LEVEL SECURITY;
CREATE POLICY schools_tenant_isolation ON schools
  FOR ALL
  USING (id = app_private.current_school_id())
  WITH CHECK (id = app_private.current_school_id());

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches FORCE ROW LEVEL SECURITY;
CREATE POLICY branches_tenant_isolation ON branches
  FOR ALL
  USING (school_id = app_private.current_school_id())
  WITH CHECK (school_id = app_private.current_school_id());

ALTER TABLE school_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_people FORCE ROW LEVEL SECURITY;
CREATE POLICY school_people_tenant_isolation ON school_people
  FOR ALL
  USING (school_id = app_private.current_school_id())
  WITH CHECK (school_id = app_private.current_school_id());

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships FORCE ROW LEVEL SECURITY;
CREATE POLICY memberships_tenant_isolation ON memberships
  FOR ALL
  USING (school_id = app_private.current_school_id())
  WITH CHECK (school_id = app_private.current_school_id());

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles FORCE ROW LEVEL SECURITY;
CREATE POLICY roles_tenant_isolation ON roles
  FOR SELECT
  USING (
    school_id IS NULL OR school_id = app_private.current_school_id()
  );
CREATE POLICY roles_tenant_write ON roles
  FOR ALL
  USING (school_id = app_private.current_school_id())
  WITH CHECK (school_id = app_private.current_school_id());

ALTER TABLE membership_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_roles FORCE ROW LEVEL SECURITY;
CREATE POLICY membership_roles_tenant_isolation ON membership_roles
  FOR ALL
  USING (school_id = app_private.current_school_id())
  WITH CHECK (school_id = app_private.current_school_id());

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events FORCE ROW LEVEL SECURITY;
CREATE POLICY audit_events_tenant_isolation ON audit_events
  FOR ALL
  USING (school_id = app_private.current_school_id())
  WITH CHECK (school_id = app_private.current_school_id());

ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_events FORCE ROW LEVEL SECURITY;
CREATE POLICY outbox_events_tenant_isolation ON outbox_events
  FOR ALL
  USING (school_id = app_private.current_school_id())
  WITH CHECK (school_id = app_private.current_school_id());

ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts FORCE ROW LEVEL SECURITY;
CREATE POLICY user_accounts_self_read ON user_accounts
  FOR SELECT
  USING (id = app_private.current_user_account_id());
