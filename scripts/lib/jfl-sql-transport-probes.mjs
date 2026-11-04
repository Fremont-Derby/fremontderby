// Reviewable source payloads for #3686; no transport, credentials or execution.
// A future service-owned transaction must be independently qualified. These
// payloads may not be submitted until the shared-history/exclusion gates pass.
import { createHash } from 'node:crypto';

export function buildJflSqlTransportProbes({ runId } = {}) {
  if (typeof runId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(runId)) {
    throw new Error('JFL_SQL_PROBE_INVALID_RUN');
  }
  const table = `transport_3686_${runId.replaceAll('-','')}`;
  const view = `${table}_dep`;
  const target = `jfl_private.${table}`, dependent = `jfl_private.${view}`;
  const marker = `JFL transport qualification #3686 ${runId}`;
  const settings = "SET LOCAL search_path = pg_catalog;\nSET LOCAL lock_timeout = '500ms';\nSET LOCAL statement_timeout = '1000ms';\nSET LOCAL idle_in_transaction_session_timeout = '2000ms';\n";
  const identityGuard = `IF current_user <> 'postgres' OR NOT EXISTS (
    SELECT 1 FROM pg_namespace WHERE nspname='jfl_private' AND nspowner='postgres'::regrole
  ) THEN RAISE EXCEPTION 'Unqualified JFL transport probe identity'; END IF;`;
  // Current PostgreSQL deparse is pinned deliberately: a different server
  // rendering refuses cleanup and needs review, never automatic adaptation.
  const viewDefinition = ` SELECT marker\n   FROM ${target};`;
  const relationGuard = (name, kind, comment) => `
DO $probe_guard$
DECLARE item pg_class%rowtype; expected_oid oid;
BEGIN
  ${identityGuard}
  SELECT * INTO item FROM pg_class WHERE oid=to_regclass('jfl_private.${name}');
  IF item.oid IS NULL OR item.relkind <> '${kind}' OR item.relowner <> 'postgres'::regrole
    ${kind === 'v' ? `OR pg_get_viewdef(item.oid,false) IS DISTINCT FROM E'${viewDefinition.replaceAll('\n','\\n')}'` : ''}
  THEN RAISE EXCEPTION 'Unqualified JFL transport probe catalog'; END IF;
  expected_oid := item.oid;
  LOCK TABLE jfl_private.${name} IN ACCESS EXCLUSIVE MODE;
  SELECT * INTO item FROM pg_class WHERE oid=to_regclass('jfl_private.${name}');
  IF item.oid IS NULL OR item.relkind <> '${kind}' OR item.relpersistence <> 'p'
    OR item.oid <> expected_oid
    OR item.relowner <> 'postgres'::regrole OR item.relispartition OR item.reloftype <> 0
    OR item.relrowsecurity IS DISTINCT FROM ${kind === 'r' ? 'true' : 'false'}
    OR item.relforcerowsecurity IS DISTINCT FROM ${kind === 'r' ? 'true' : 'false'}
    OR item.reloptions IS DISTINCT FROM ${kind === 'r' ? 'NULL::text[]' : "ARRAY['security_invoker=true']::text[]"}
    OR coalesce(item.relacl,acldefault('r',item.relowner)) IS DISTINCT FROM acldefault('r',item.relowner)
    OR obj_description(item.oid,'pg_class') IS DISTINCT FROM '${comment}'
    OR (SELECT count(*) FROM pg_attribute WHERE attrelid=item.oid AND attnum>0) <> 1
    OR NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid=item.oid AND attnum>0
      AND attname='marker' AND atttypid='uuid'::regtype AND atttypmod=-1 AND NOT attisdropped
      AND NOT attnotnull
      AND NOT atthasdef AND attidentity='' AND attgenerated='' AND attacl IS NULL
      AND attcollation=0 AND attndims=0 AND col_description(item.oid,attnum) IS NULL)
    OR EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid=item.oid)
    OR EXISTS (SELECT 1 FROM pg_index WHERE indrelid=item.oid)
    OR EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid=item.oid)
    OR EXISTS (SELECT 1 FROM pg_policy WHERE polrelid=item.oid)
    OR EXISTS (SELECT 1 FROM pg_inherits WHERE inhrelid=item.oid OR inhparent=item.oid)
    ${kind === 'r'
    ? 'OR EXISTS (SELECT 1 FROM pg_rewrite WHERE ev_class=item.oid)'
    : `OR (SELECT count(*) FROM pg_rewrite WHERE ev_class=item.oid) <> 1
    OR pg_get_viewdef(item.oid,false) IS DISTINCT FROM E'${viewDefinition.replaceAll('\n','\\n')}'`}
  THEN RAISE EXCEPTION 'Unqualified JFL transport probe catalog'; END IF;
  IF EXISTS (SELECT 1 FROM jfl_private.${name}) THEN
    RAISE EXCEPTION 'Unqualified nonempty JFL transport probe';
  END IF;
END;
$probe_guard$;
`;
  const tableGuard = relationGuard(table,'r',marker);
  const viewGuard = relationGuard(view,'v',`${marker} dependency`);
  const install = `${settings}
DO $probe_install$
BEGIN
  ${identityGuard}
  IF to_regclass('${target}') IS NOT NULL OR to_regclass('${dependent}') IS NOT NULL THEN
    RAISE EXCEPTION 'JFL transport probe already exists';
  END IF;
END;
$probe_install$;
CREATE TABLE ${target} (marker uuid);
ALTER TABLE ${target} ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${target} FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE ${target} FROM PUBLIC,anon,authenticated,service_role;
COMMENT ON TABLE ${target} IS '${marker}';
${tableGuard}`;
  const payloads = Object.freeze({
    install,
    failAfterInstall: `${install}\nSELECT 1/0;\n`,
    timeoutAfterInstall: `${install}\nSET LOCAL statement_timeout = '100ms';\nSELECT pg_sleep(1);\n`,
    cleanup: `${settings}${tableGuard}
DO $probe_dependency$
BEGIN
  IF to_regclass('${dependent}') IS NOT NULL THEN
    RAISE EXCEPTION 'JFL transport probe dependency remains';
  END IF;
END;
$probe_dependency$;
DROP TABLE ${target} RESTRICT;
`,
    dependencyInstall: `${settings}${tableGuard}
CREATE VIEW ${dependent} WITH (security_invoker=true) AS SELECT marker FROM ${target};
REVOKE ALL ON TABLE ${dependent} FROM PUBLIC,anon,authenticated,service_role;
COMMENT ON VIEW ${dependent} IS '${marker} dependency';
${viewGuard}`,
    dependencyCleanup: `${settings}${tableGuard}${viewGuard}\nDROP VIEW ${dependent} RESTRICT;\n`,
  });
  const digests = Object.freeze(Object.fromEntries(Object.entries(payloads).map(([name,sql]) =>
    [name,createHash('sha256').update(Buffer.from(sql,'utf8')).digest('hex')])));
  const migrationNames = Object.freeze(Object.fromEntries(Object.keys(payloads).map(name =>
    [name,`jfl_3686_${runId.replaceAll('-','')}_${name.replace(/[A-Z]/g,letter => '_'+letter.toLowerCase())}`])));
  return Object.freeze({ schemaVersion: 1, executionAuthorized: false,
    runId, project: 'oqkkvqkerusepyokzbmt', environment: 'jfl', schema: 'jfl_private',
    table, view, target, dependent, marker, payloads, digests, migrationNames,
  });
}
