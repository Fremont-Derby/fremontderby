// LOCAL disposable PostgreSQL only. Simulated service-owned transactions do
// not establish Supabase migration atomicity, history or hosted acceptance.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { buildJflSqlTransportProbes } from './lib/jfl-sql-transport-probes.mjs';
const require = createRequire(import.meta.url);
const { Client } = require(process.env.PG_MODULE_PATH || 'pg');

async function main() {
  const port = Number(process.env.OWNERSHIP_TEST_PORT);
  assert.ok(Number.isInteger(port) && port >= 55000 && port <= 55999,'Explicit disposable local port required');
  const config = { host: '127.0.0.1', port, user: 'postgres', database: 'postgres' };
  const admin = new Client(config);
  await admin.connect();
  config.database = `transport_probe_${process.pid}_${Date.now()}`;
  await admin.query(`create database ${config.database}`);
  const db = new Client(config), reader = new Client(config);
  let passes = 0;
  try {
    await db.connect(); await reader.connect();
    let phase = 'baseline';
    const q = async (sql,values) => {
      try { return await db.query(sql,values); }
      catch (error) { error.message = `${phase}: ${error.message}`; throw error; }
    };
    assert.equal((await q("select count(*)::int n from pg_namespace where nspname in ('jfl_private','dru')")).rows[0].n,0);
    for (const role of ['anon','authenticated','service_role']) {
      if (!(await q('select 1 from pg_roles where rolname=$1',[role])).rowCount) await q(`create role ${role}`);
    }
    await q(`create schema jfl_private; create schema dru;
      create table dru.peer_marker(value int); insert into dru.peer_marker values(42);
      create table jfl_private.baseline_marker(value int); insert into jfl_private.baseline_marker values(17);
      alter default privileges in schema jfl_private grant all on tables to anon,authenticated,service_role`);
    const p = buildJflSqlTransportProbes({ runId: '11111111-2222-4333-8444-555555555555' });
    const snapshot = async (client = reader) => ({
      catalog: (await client.query(`select n.nspname,c.relname,c.relkind,c.relowner::regrole::text owner,
        c.relacl::text,c.relrowsecurity,c.relforcerowsecurity,c.reloptions,
        obj_description(c.oid,'pg_class') description,
        case when c.relkind='v' then pg_get_viewdef(c.oid,false) end definition,
        (select jsonb_agg(jsonb_build_object('name',a.attname,'type',a.atttypid::regtype::text,
          'acl',a.attacl::text,'notnull',a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid),
          'comment',col_description(c.oid,a.attnum)) order by a.attnum)
         from pg_attribute a left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
         where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped) columns,
        (select jsonb_agg(pg_get_constraintdef(x.oid) order by x.conname) from pg_constraint x where x.conrelid=c.oid) constraints,
        (select jsonb_agg(pg_get_indexdef(x.indexrelid) order by x.indexrelid) from pg_index x where x.indrelid=c.oid) indexes,
        (select jsonb_agg(to_jsonb(x)-'oid'-'polrelid' order by x.polname) from pg_policy x where x.polrelid=c.oid) policies
        from pg_class c join pg_namespace n on n.oid=c.relnamespace
        where n.nspname in ('jfl_private','dru') order by n.nspname,c.relname`)).rows,
      peer: (await client.query('select md5(jsonb_agg(value order by value)::text) hash from dru.peer_marker')).rows,
      baseline: (await client.query('select md5(jsonb_agg(value order by value)::text) hash from jfl_private.baseline_marker')).rows,
    });
    const baseline = await snapshot();
    const transact = sql => q(`begin;\n${sql}\ncommit;`);
    const refuse = async (sql,code) => {
      await assert.rejects(transact(sql),error => { assert.equal(error.code,code); return true; });
      await q('rollback');
    };
    phase = 'rollback-install';
    await q(`begin;${p.payloads.install}rollback;`);
    assert.deepEqual(await snapshot(),baseline); passes++;
    for (const [payload,code] of [[p.payloads.failAfterInstall,'22012'],[p.payloads.timeoutAfterInstall,'57014']]) {
      phase = `failure-${code}`;
      await refuse(payload,code);
      assert.deepEqual(await snapshot(),baseline); passes++;
    }
    phase = 'committed-install';
    await transact(p.payloads.install);
    const installed = await snapshot();
    assert.equal(installed.catalog.length,baseline.catalog.length+1);
    assert.deepEqual(installed.catalog.filter(row => row.relname !== p.table),baseline.catalog);
    for (const role of ['anon','authenticated','service_role']) {
      const grants = (await reader.query(`select has_table_privilege($1,$2,'SELECT') readable,
        has_column_privilege($1,$2,'marker','SELECT') column_readable`,[role,p.target])).rows[0];
      assert.deepEqual(grants,{ readable: false,column_readable: false });
    }
    assert.equal((await reader.query(`select count(*)::int n from ${p.target}`)).rows[0].n,0); passes++;
    phase = 'repeat-install';
    await refuse(p.payloads.install,'P0001'); assert.deepEqual(await snapshot(),installed); passes++;
    for (const role of ['anon','authenticated','service_role']) {
      phase = `wrong-role-${role}`;
      await refuse(`set local role ${role};${p.payloads.install}`,'P0001');
      assert.deepEqual(await snapshot(),installed); passes++;
    }
    const drifts = [
      `comment on table ${p.target} is 'changed'`,
      `alter table ${p.target} disable row level security`,
      `alter table ${p.target} no force row level security`,
      `grant select on ${p.target} to anon`,
      `grant select(marker) on ${p.target} to authenticated`,
      `alter table ${p.target} add column unexpected int`,
      `alter table ${p.target} alter column marker set default '${p.runId}'::uuid`,
      `comment on column ${p.target}.marker is 'changed'`,
      `create index on ${p.target}(marker)`,
      `create policy unexpected on ${p.target} using (true)`,
      `alter table ${p.target} add check (marker is not null)`,
      `alter table ${p.target} owner to service_role`,
      `insert into ${p.target} values('${p.runId}')`,
    ];
    for (const drift of drifts) {
      phase = `catalog-drift-${drifts.indexOf(drift)}`;
      await q('begin'); await q(drift);
      const before = await snapshot(db);
      await q('savepoint refusal');
      await assert.rejects(q(p.payloads.cleanup),error => { assert.equal(error.code,'P0001'); return true; });
      await q('rollback to savepoint refusal');
      assert.deepEqual(await snapshot(db),before);
      await q('rollback'); assert.deepEqual(await snapshot(),installed); passes++;
    }
    // A dependency outside the generated names must still make DROP RESTRICT
    // fail atomically; no relation or peer content may be removed.
    phase = 'unexpected-dependency';
    await q('begin');
    await q(`create view jfl_private.unexpected_consumer with(security_invoker=true) as select marker from ${p.target}`);
    const dependent = await snapshot(db);
    await q('savepoint refusal');
    await assert.rejects(q(p.payloads.cleanup),error => { assert.equal(error.code,'2BP01'); return true; });
    await q('rollback to savepoint refusal'); assert.deepEqual(await snapshot(db),dependent);
    await q('rollback'); passes++;
    phase = 'known-dependency-install';
    await transact(p.payloads.dependencyInstall);
    const knownDependency = await snapshot();
    await refuse(p.payloads.cleanup,'P0001'); assert.deepEqual(await snapshot(),knownDependency); passes++;
    phase = 'known-dependency-drift';
    await q('begin');
    await q(`create or replace view ${p.dependent} with(security_invoker=true) as select null::uuid marker`);
    const changedView = await snapshot(db);
    await q('savepoint refusal');
    await assert.rejects(q(p.payloads.dependencyCleanup),error => { assert.equal(error.code,'P0001'); return true; });
    await q('rollback to savepoint refusal'); assert.deepEqual(await snapshot(db),changedView);
    await q('rollback'); passes++;
    phase = 'committed-cleanup';
    await transact(p.payloads.dependencyCleanup); await transact(p.payloads.cleanup);
    assert.deepEqual(await snapshot(),baseline); passes++;
    // Simulate loss at the adapter result boundary only. This does not emulate
    // a hosted network fault or qualify the actual migration service.
    const writer = new Client(config); await writer.connect();
    try {
      await assert.rejects(writer.query(`begin;${p.payloads.install}commit;`).then(() => {
        throw new Error('INTENTIONAL_LOCAL_RESULT_DISCARD');
      }),/INTENTIONAL_LOCAL_RESULT_DISCARD/);
    } finally { await writer.end(); }
    assert.deepEqual(await snapshot(),installed);
    await transact(p.payloads.cleanup); assert.deepEqual(await snapshot(),baseline); passes++;
    await refuse(p.payloads.cleanup,'P0001'); assert.deepEqual(await snapshot(),baseline); passes++;
    // A concurrent uncommitted insertion cannot race the empty-state check:
    // Access Exclusive must time out without deleting the table or that row.
    await transact(p.payloads.install);
    const blocker = new Client(config); await blocker.connect();
    try {
      await blocker.query(`begin;insert into ${p.target} values('${p.runId}')`);
      await refuse(p.payloads.cleanup,'55P03');
      assert.equal((await blocker.query(`select count(*)::int n from ${p.target}`)).rows[0].n,1);
      assert.deepEqual(await snapshot(),installed);
    } finally { await blocker.query('rollback'); await blocker.end(); }
    await transact(p.payloads.cleanup); assert.deepEqual(await snapshot(),baseline); passes++;
    console.log(`${passes} native transport probe scenarios PASS; local simulation only, no hosted acceptance`);
  } finally {
    await db.end(); await reader.end();
    await admin.query(`drop database ${config.database}`); await admin.end();
  }
}
main().catch(error => {
  console.error(`Local probe qualification failed: ${error.code || 'assertion'} ${String(error.message).slice(0,240)}`);
  process.exitCode = 1;
});
