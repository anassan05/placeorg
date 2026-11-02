-- Privileged administrator, after migration. Do not use the app connection.
BEGIN;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='campusconnect_auth' AND NOT (rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls)) THEN RAISE EXCEPTION 'auth role missing or unsafe'; END IF;
  IF EXISTS (SELECT 1 FROM pg_auth_members WHERE member=(SELECT oid FROM pg_roles WHERE rolname='campusconnect_auth') OR roleid=(SELECT oid FROM pg_roles WHERE rolname='campusconnect_auth')) THEN RAISE EXCEPTION 'auth role must not have memberships'; END IF;
  IF has_schema_privilege('campusconnect_auth','public','CREATE') THEN RAISE EXCEPTION 'auth role must not have schema CREATE'; END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE oid IN ('public.colleges'::regclass,'public.users'::regclass,'public.auth_credentials'::regclass,'public.auth_sessions'::regclass,'public.auth_rate_limits'::regclass) AND relowner=(SELECT oid FROM pg_roles WHERE rolname='campusconnect_auth')) THEN RAISE EXCEPTION 'auth role must not own tables'; END IF;
END $$;
GRANT USAGE ON SCHEMA public TO campusconnect_auth;
GRANT SELECT (id,email,role,college_id) ON public.users TO campusconnect_auth;
GRANT SELECT ON public.auth_credentials TO campusconnect_auth;
GRANT SELECT,INSERT,DELETE ON public.auth_sessions TO campusconnect_auth;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.auth_rate_limits TO campusconnect_auth;
DO $$
DECLARE p text; t text;
BEGIN
  IF has_table_privilege('campusconnect_auth','public.users','SELECT') OR has_any_column_privilege('campusconnect_auth','public.users','UPDATE') OR has_table_privilege('campusconnect_auth','public.users','INSERT') OR has_table_privilege('campusconnect_auth','public.users','DELETE') OR has_any_column_privilege('campusconnect_auth','public.users','REFERENCES') THEN RAISE EXCEPTION 'excess user privilege'; END IF;
  IF has_table_privilege('campusconnect_auth','public.colleges','SELECT') THEN RAISE EXCEPTION 'auth role must not access colleges'; END IF;
  FOREACH t IN ARRAY ARRAY['users','colleges','auth_credentials','auth_sessions','auth_rate_limits'] LOOP
    FOREACH p IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] LOOP
      IF has_table_privilege('campusconnect_auth','public.'||t,p||' WITH GRANT OPTION') THEN RAISE EXCEPTION 'unexpected grant option'; END IF;
    END LOOP;
    FOREACH p IN ARRAY ARRAY['SELECT','INSERT','UPDATE','REFERENCES'] LOOP
      IF has_any_column_privilege('campusconnect_auth','public.'||t,p||' WITH GRANT OPTION') THEN RAISE EXCEPTION 'unexpected column grant option'; END IF;
    END LOOP;
  END LOOP;
  IF has_table_privilege('campusconnect_auth','public.auth_credentials','INSERT') OR has_table_privilege('campusconnect_auth','public.auth_credentials','UPDATE') OR has_table_privilege('campusconnect_auth','public.auth_credentials','DELETE') OR has_any_column_privilege('campusconnect_auth','public.auth_credentials','UPDATE') THEN RAISE EXCEPTION 'credentials must be read only'; END IF;
  FOREACH t IN ARRAY ARRAY['auth_credentials','auth_sessions','auth_rate_limits'] LOOP
    IF has_table_privilege('campusconnect_auth','public.'||t,'TRUNCATE') OR has_table_privilege('campusconnect_auth','public.'||t,'REFERENCES') OR has_table_privilege('campusconnect_auth','public.'||t,'TRIGGER') THEN RAISE EXCEPTION 'unexpected table privilege'; END IF;
  END LOOP;
  IF has_table_privilege('campusconnect_auth','public.auth_sessions','UPDATE') OR has_any_column_privilege('campusconnect_auth','public.auth_sessions','UPDATE') THEN RAISE EXCEPTION 'unexpected session update privilege'; END IF;
END $$;
COMMIT;
