-- Administrator-only, after migration. Abort on unexpected effective access.
BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'campusconnect_runtime' AND NOT (rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole OR rolreplication)) THEN
    RAISE EXCEPTION 'runtime role missing or unsafe';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_auth_members WHERE member = (SELECT oid FROM pg_roles WHERE rolname = 'campusconnect_runtime') OR roleid = (SELECT oid FROM pg_roles WHERE rolname = 'campusconnect_runtime')) THEN
    RAISE EXCEPTION 'runtime role must not have memberships';
  END IF;
  IF has_schema_privilege('campusconnect_runtime', 'public', 'CREATE') THEN
    RAISE EXCEPTION 'runtime must not have schema CREATE';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE oid IN ('public.colleges'::regclass, 'public.users'::regclass) AND relowner = (SELECT oid FROM pg_roles WHERE rolname = 'campusconnect_runtime')) THEN
    RAISE EXCEPTION 'runtime must not own tenant tables';
  END IF;
END $$;
REVOKE ALL ON public.colleges, public.users FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO campusconnect_runtime;
GRANT SELECT ON public.colleges TO campusconnect_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO campusconnect_runtime;
DO $$
DECLARE priv text;
BEGIN
  FOREACH priv IN ARRAY ARRAY['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'] LOOP
    IF has_table_privilege('campusconnect_runtime', 'public.colleges', priv) THEN RAISE EXCEPTION 'unexpected colleges privilege: %', priv; END IF;
  END LOOP;
  FOREACH priv IN ARRAY ARRAY['TRUNCATE', 'REFERENCES', 'TRIGGER'] LOOP
    IF has_table_privilege('campusconnect_runtime', 'public.users', priv) THEN RAISE EXCEPTION 'unexpected users privilege: %', priv; END IF;
  END LOOP;
  FOREACH priv IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] LOOP
    IF has_table_privilege('campusconnect_runtime', 'public.colleges', priv || ' WITH GRANT OPTION') OR has_table_privilege('campusconnect_runtime', 'public.users', priv || ' WITH GRANT OPTION') THEN RAISE EXCEPTION 'unexpected grant option: %', priv; END IF;
  END LOOP;
  FOREACH priv IN ARRAY ARRAY['SELECT','INSERT','UPDATE','REFERENCES'] LOOP
    IF has_any_column_privilege('campusconnect_runtime', 'public.colleges', priv || ' WITH GRANT OPTION') OR has_any_column_privilege('campusconnect_runtime', 'public.users', priv || ' WITH GRANT OPTION') THEN RAISE EXCEPTION 'unexpected column grant option: %', priv; END IF;
  END LOOP;
  FOREACH priv IN ARRAY ARRAY['INSERT','UPDATE','REFERENCES'] LOOP
    IF has_any_column_privilege('campusconnect_runtime', 'public.colleges', priv) THEN RAISE EXCEPTION 'unexpected colleges column privilege: %', priv; END IF;
  END LOOP;
  IF has_any_column_privilege('campusconnect_runtime', 'public.users', 'REFERENCES') THEN RAISE EXCEPTION 'unexpected users column REFERENCES'; END IF;
END $$;
COMMIT;
