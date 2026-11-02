-- Administrator-only, before migrations. A login may be provisioned separately afterwards.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'campusconnect_runtime') THEN
    CREATE ROLE campusconnect_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'campusconnect_runtime'
    AND (rolcanlogin OR rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole OR rolreplication)) THEN
    RAISE EXCEPTION 'campusconnect_runtime must be NOLOGIN and unprivileged before migration';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_auth_members WHERE member = (SELECT oid FROM pg_roles WHERE rolname = 'campusconnect_runtime') OR roleid = (SELECT oid FROM pg_roles WHERE rolname = 'campusconnect_runtime')) THEN
    RAISE EXCEPTION 'campusconnect_runtime must not have role memberships';
  END IF;
END $$;
