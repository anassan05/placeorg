-- Administrator only. Identity lookup is a separate, highly sensitive capability.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'campusconnect_auth') THEN
    CREATE ROLE campusconnect_auth NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'campusconnect_auth' AND
    (rolcanlogin OR rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls)) THEN
    RAISE EXCEPTION 'campusconnect_auth must be NOLOGIN and unprivileged before migration';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_auth_members WHERE member=(SELECT oid FROM pg_roles WHERE rolname='campusconnect_auth') OR roleid=(SELECT oid FROM pg_roles WHERE rolname='campusconnect_auth')) THEN
    RAISE EXCEPTION 'campusconnect_auth must not have memberships';
  END IF;
END $$;
