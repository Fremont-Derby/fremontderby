import { useState } from 'react'

const felt = '#0f4c2a'
const neutral100 = '#f4f4f5'
const neutral200 = '#e4e4e7'
const neutral600 = '#52525b'
const neutral900 = '#09090b'
const green = '#1a7a4a'
const greenLight = '#e8f5ee'
const amber = '#f59e0b'
const amberLight = '#fef3c7'
const red = '#dc2626'
const redLight = '#fee2e2'

type LifecycleState = 'draft' | 'published' | 'playoffs' | 'closed'

const lifecycleConfig: Record<LifecycleState, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Draft',     color: neutral600, bg: neutral100 },
  published: { label: 'Active',    color: green,      bg: greenLight },
  playoffs:  { label: 'Playoffs',  color: '#7c3aed',  bg: '#ede9fe' },
  closed:    { label: 'Closed',    color: neutral600, bg: neutral200 },
}

const readinessItems = [
  { label: 'Season name and dates set',      done: true },
  { label: '8 teams assigned to season',     done: true },
  { label: 'All captains have phone on file', done: false },
  { label: '7-round schedule generated',     done: true },
  { label: 'Entry fees configured',          done: true },
  { label: 'Prize pool amounts set',         done: false },
  { label: 'Rules page up to date',          done: true },
]

const rounds = [
  { label: 'Round 1', date: 'Wed Jul 2',  status: 'played' },
  { label: 'Round 2', date: 'Wed Jul 9',  status: 'played' },
  { label: 'Round 3', date: 'Wed Jul 16', status: 'played' },
  { label: 'Round 4', date: 'Wed Jul 23', status: 'played' },
  { label: 'Round 5', date: 'Wed Jul 30', status: 'played' },
  { label: 'Round 6', date: 'Wed Aug 6',  status: 'played' },
  { label: 'Round 7', date: 'Wed Aug 13', status: 'played' },
  { label: 'Semis',   date: 'Wed Sep 4',  status: 'upcoming' },
  { label: 'Final',   date: 'Wed Sep 11', status: 'upcoming' },
]

export default function FrameSeasonSetup() {
  const [lifecycle, setLifecycle] = useState<LifecycleState>('published')
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'readiness' | 'lifecycle'>('overview')
  const [seasonName, setSeasonName] = useState('Season 2026')
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(seasonName)
  const [confirmClose, setConfirmClose] = useState(false)
  const [blackouts, setBlackouts] = useState<string[]>(['2026-08-27', '2026-09-03'])
  const [newBlackout, setNewBlackout] = useState('')
  const [blackoutNote, setBlackoutNote] = useState('')

  const lc = lifecycleConfig[lifecycle]
  const readinessPct = Math.round((readinessItems.filter(r => r.done).length / readinessItems.length) * 100)

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: neutral100, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: felt, padding: '48px 20px 0', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Admin → Season setup</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            {editingName ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input value={nameInput} onChange={e => setNameInput(e.target.value)} style={{ fontSize: 20, fontWeight: 700, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 6, padding: '4px 8px', outline: 'none', width: 200 }} />
                <button onClick={() => { setSeasonName(nameInput); setEditingName(false) }} style={{ background: '#4ade80', border: 'none', color: felt, borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Save</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>{seasonName}</h1>
                <button onClick={() => setEditingName(true)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.7)', borderRadius: 4, padding: '2px 6px', fontSize: 11, cursor: 'pointer' }}>Edit</button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: lc.color, background: lc.bg, padding: '2px 9px', borderRadius: 99 }}>{lc.label}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>8 teams · 7 rounds · Cue Club</span>
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex' }}>
          {[{ id: 'overview', label: 'Overview' }, { id: 'schedule', label: 'Schedule' }, { id: 'readiness', label: `Readiness ${readinessPct}%` }, { id: 'lifecycle', label: 'Lifecycle' }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{ flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', background: 'transparent', color: activeTab === t.id ? '#fff' : 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: activeTab === t.id ? 700 : 400, borderBottom: activeTab === t.id ? '2px solid #4ade80' : '2px solid transparent', whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 90px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {activeTab === 'overview' && (
          <>
            {/* Key stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Season start',     val: 'Jul 2, 2026' },
                { label: 'Season end',       val: 'Sep 11, 2026' },
                { label: 'Teams',            val: '8 / 8 slots' },
                { label: 'Entry fee',        val: '$40 individual' },
                { label: 'Rounds played',    val: '7 / 7' },
                { label: 'Scores finalized', val: '56 / 56' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: neutral900 }}>{s.val}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: neutral600 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Config fields */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Season configuration</p>
              {[
                { label: 'Format',       val: '8 teams · 7-round single round robin' },
                { label: 'Match format', val: '3 players per team · blind lineup' },
                { label: 'Venue',        val: 'Cue Club · Fremont, CA' },
                { label: 'Night',        val: 'Wednesdays · 7:00 PM start' },
                { label: 'Tables',       val: '4 reserved' },
                { label: 'Team entry',   val: '$80 per team' },
              ].map((r, i, arr) => (
                <div key={r.label} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: i < arr.length - 1 ? `1px solid ${neutral100}` : 'none' }}>
                  <span style={{ flex: '0 0 120px', fontSize: 13, color: neutral600, fontWeight: 500 }}>{r.label}</span>
                  <span style={{ fontSize: 13, color: neutral900 }}>{r.val}</span>
                </div>
              ))}
            </div>

            {/* Quick nav */}
            <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              {[
                { label: 'Manage season teams', desc: 'Slot assignment, qualification, waitlist' },
                { label: 'Standings', desc: 'Team and individual results' },
                { label: 'Prize configuration', desc: 'Pool amounts and payout finalization' },
                { label: 'Operations', desc: 'Readiness flags and action queue' },
              ].map((d, i, arr) => (
                <button key={d.label} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '13px 16px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, borderBottom: i < arr.length - 1 ? `1px solid ${neutral100}` : 'none' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: neutral900 }}>{d.label}</p>
                    <p style={{ margin: '1px 0 0', fontSize: 12, color: neutral600 }}>{d.desc}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={neutral600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              ))}
            </div>
          </>
        )}

        {activeTab === 'schedule' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '12px 16px', background: neutral100, borderBottom: `1px solid ${neutral200}`, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: neutral600 }}>9 nights scheduled</span>
                <button style={{ background: 'none', border: 'none', fontSize: 12, color: green, fontWeight: 600, cursor: 'pointer' }}>Regenerate</button>
              </div>
              {rounds.map((r, i) => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: i < rounds.length - 1 ? `1px solid ${neutral100}` : 'none', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.status === 'played' ? green : amber, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: neutral900 }}>{r.label}</p>
                    <p style={{ margin: '1px 0 0', fontSize: 12, color: neutral600 }}>{r.date} · Cue Club · 7 PM</p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: r.status === 'played' ? green : amber }}>
                    {r.status === 'played' ? 'Complete' : 'Upcoming'}
                  </span>
                </div>
              ))}
            </div>

            {/* Blackout dates */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Blackout / holiday dates</p>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: neutral600, lineHeight: 1.4 }}>Dates when the venue is unavailable or no league play occurs. Schedule regeneration skips these automatically.</p>
              {blackouts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  {blackouts.map(d => (
                    <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff7ed', borderRadius: 8, padding: '8px 12px', border: `1px solid #fed7aa` }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={amber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      <span style={{ flex: 1, fontSize: 13, color: neutral900 }}>{new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <button onClick={() => setBlackouts(bs => bs.filter(b => b !== d))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: neutral600, padding: 2 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input type="date" value={newBlackout} onChange={e => setNewBlackout(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${neutral200}`, fontSize: 14, boxSizing: 'border-box' }} />
                <input placeholder="Reason (e.g. Labor Day, venue unavailable)" value={blackoutNote} onChange={e => setBlackoutNote(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${neutral200}`, fontSize: 14, boxSizing: 'border-box' }} />
                <button onClick={() => { if (newBlackout && !blackouts.includes(newBlackout)) { setBlackouts(bs => [...bs, newBlackout].sort()); setNewBlackout(''); setBlackoutNote('') } }} disabled={!newBlackout} style={{ padding: '10px', background: newBlackout ? felt : neutral200, color: newBlackout ? '#fff' : neutral600, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: newBlackout ? 'pointer' : 'not-allowed' }}>
                  Add blackout date
                </button>
              </div>
              {blackouts.length > 0 && (
                <p style={{ margin: '10px 0 0', fontSize: 12, color: neutral600 }}>Regenerate the schedule above to apply these changes.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'readiness' && (
          <>
            {/* Progress bar */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: neutral900 }}>Publish / close readiness</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: readinessPct === 100 ? green : amber }}>{readinessPct}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: neutral100, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ height: '100%', width: `${readinessPct}%`, background: readinessPct === 100 ? green : amber, borderRadius: 99 }} />
              </div>
              {readinessItems.map((item, i) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < readinessItems.length - 1 ? `1px solid ${neutral100}` : 'none' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: item.done ? green : neutral200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.done ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : null}
                  </div>
                  <span style={{ fontSize: 13, color: item.done ? neutral900 : neutral600, flex: 1 }}>{item.label}</span>
                  {!item.done && <span style={{ fontSize: 11, color: amber, fontWeight: 600, background: amberLight, padding: '2px 7px', borderRadius: 99 }}>Action needed</span>}
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'lifecycle' && (
          <>
            {/* Current state */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Lifecycle state</p>
              <div style={{ display: 'flex', gap: 0, marginBottom: 16 }}>
                {(['draft', 'published', 'playoffs', 'closed'] as LifecycleState[]).map((s, i) => {
                  const cfg = lifecycleConfig[s]
                  const isActive = lifecycle === s
                  const stages = ['draft', 'published', 'playoffs', 'closed']
                  const isPast = stages.indexOf(s) < stages.indexOf(lifecycle)
                  return (
                    <div key={s} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: isActive ? felt : isPast ? green : neutral200, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px', border: isActive ? `2px solid ${green}` : 'none' }}>
                        {isPast ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? '#fff' : neutral600 }}>{i + 1}</span>}
                      </div>
                      {i < 3 && <div style={{ position: 'absolute', top: 13, left: '50%', right: '-50%', height: 2, background: isPast ? green : neutral200, zIndex: 0 }} />}
                      <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, color: isActive ? neutral900 : neutral600, textTransform: 'capitalize' }}>{s}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Actions */}
            <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              {lifecycle === 'draft' && (
                <div style={{ padding: '14px 16px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: neutral900 }}>Publish season</p>
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: neutral600, lineHeight: 1.5 }}>Publishing makes the schedule, standings, and registration visible to players. Complete the readiness checklist first.</p>
                  <button onClick={() => setLifecycle('published')} disabled={readinessPct < 100} style={{ width: '100%', padding: '12px', background: readinessPct === 100 ? felt : neutral200, color: readinessPct === 100 ? '#fff' : neutral600, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: readinessPct === 100 ? 'pointer' : 'not-allowed' }}>
                    Publish season
                  </button>
                </div>
              )}
              {lifecycle === 'published' && (
                <div style={{ padding: '14px 16px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: neutral900 }}>Start playoffs</p>
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: neutral600, lineHeight: 1.5 }}>Advances the season to playoffs phase. All 7 regular-season rounds must be finalized first.</p>
                  <button onClick={() => setLifecycle('playoffs')} style={{ width: '100%', padding: '12px', background: felt, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}>
                    Start playoffs
                  </button>
                </div>
              )}
              {lifecycle === 'playoffs' && (
                <div style={{ padding: '14px 16px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: neutral900 }}>Advance to championship</p>
                  <button onClick={() => {}} style={{ width: '100%', padding: '12px', background: felt, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}>
                    Advance to championship
                  </button>
                  <div style={{ height: 1, background: neutral100, margin: '14px 0' }} />
                  <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: neutral900 }}>Close season</p>
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: neutral600, lineHeight: 1.5 }}>Locks all results, finalizes prize payouts, and preserves full history. Cannot be undone.</p>
                  {!confirmClose ? (
                    <button onClick={() => setConfirmClose(true)} style={{ width: '100%', padding: '12px', background: '#fff', color: red, border: `1px solid ${neutral200}`, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                      Close season
                    </button>
                  ) : (
                    <div style={{ background: redLight, borderRadius: 10, padding: '14px', border: `1px solid #fca5a5` }}>
                      <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: red }}>Confirm close season?</p>
                      <p style={{ margin: '0 0 12px', fontSize: 12, color: neutral600 }}>This will lock all results and finalize payouts. Historical data is preserved.</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setLifecycle('closed')} style={{ flex: 1, padding: '10px', background: red, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Confirm close</button>
                        <button onClick={() => setConfirmClose(false)} style={{ flex: 1, padding: '10px', background: '#fff', color: neutral900, border: `1px solid ${neutral200}`, borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {lifecycle === 'closed' && (
                <div style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: neutral100, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={neutral600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: neutral900 }}>Season closed</p>
                  <p style={{ margin: 0, fontSize: 13, color: neutral600 }}>All results locked. History preserved in perpetuity.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: `1px solid ${neutral200}`, display: 'flex', padding: '8px 0 20px' }}>
        {[
          { id: 'home', label: 'Home', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
          { id: 'teams', label: 'Teams', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
          { id: 'schedule', label: 'Schedule', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
          { id: 'messages', label: 'Messages', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
          { id: 'admin', label: 'Admin', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
        ].map(tab => (
          <button key={tab.id} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 0', color: tab.id === 'admin' ? felt : neutral600 }}>
            {tab.icon}
            <span style={{ fontSize: 11, fontWeight: tab.id === 'admin' ? 600 : 400 }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
