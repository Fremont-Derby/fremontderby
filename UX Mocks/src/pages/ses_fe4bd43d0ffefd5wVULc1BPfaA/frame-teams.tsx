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

type SlotState = 'Forming' | 'Qualified' | 'Accepted' | 'Waitlisted'

const slotConfig: Record<SlotState, { color: string; bg: string; desc: string }> = {
  Forming:    { color: amber,   bg: amberLight, desc: 'Needs captain + 3 rostered players' },
  Qualified:  { color: green,   bg: greenLight, desc: 'Meets requirements — not yet confirmed' },
  Accepted:   { color: green,   bg: '#dcfce7',  desc: 'Season slot confirmed' },
  Waitlisted: { color: '#7c3aed', bg: '#ede9fe', desc: 'All slots full — on the waitlist' },
}

const teams = [
  { name: 'Break Artists',      abbr: 'BA',  record: '7–1', rank: 1, slot: 'Accepted' as SlotState, captain: 'D. Morales',  players: 5, open: false, depth: true,  playoffSpot: true,  matchesForUs: 21, matchesElsewhere: 3 },
  { name: 'Eight Ball Wizards', abbr: 'EBW', record: '6–2', rank: 2, slot: 'Accepted' as SlotState, captain: 'R. Okafor',   players: 4, open: true,  depth: true,  playoffSpot: true,  matchesForUs: 18, matchesElsewhere: 6 },
  { name: 'Corner Pocket Co.',  abbr: 'CPC', record: '6–2', rank: 3, slot: 'Accepted' as SlotState, captain: 'M. Delgado',  players: 4, open: true,  depth: true,  playoffSpot: true,  matchesForUs: 18, matchesElsewhere: 3 },
  { name: 'Chalk Outlaws',      abbr: 'CO',  record: '5–3', rank: 4, slot: 'Accepted' as SlotState, captain: 'T. Nakamura', players: 5, open: false, depth: true,  playoffSpot: true,  matchesForUs: 15, matchesElsewhere: 9 },
  { name: 'Straight Shooters',  abbr: 'SS',  record: '4–4', rank: 5, slot: 'Accepted' as SlotState, captain: 'J. Williams', players: 4, open: true,  depth: true,  playoffSpot: false, matchesForUs: 12, matchesElsewhere: 6 },
  { name: 'Side Pocket Kings',  abbr: 'SPK', record: '3–5', rank: 6, slot: 'Accepted' as SlotState, captain: 'K. Webb',     players: 3, open: true,  depth: false, playoffSpot: false, matchesForUs: 9,  matchesElsewhere: 3 },
  { name: 'Rack Pack',          abbr: 'RP',  record: '2–6', rank: 7, slot: 'Accepted' as SlotState, captain: 'L. Park',     players: 5, open: false, depth: true,  playoffSpot: false, matchesForUs: 6,  matchesElsewhere: 3 },
  { name: 'Long Rail Legends',  abbr: 'LRL', record: '1–7', rank: 8, slot: 'Accepted' as SlotState, captain: 'B. Kamau',    players: 4, open: true,  depth: true,  playoffSpot: false, matchesForUs: 3,  matchesElsewhere: 3 },
]

const MY_TEAM = 'Chalk Outlaws'

export default function FrameTeams() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'open'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = teams.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || t.open
    return matchSearch && matchFilter
  })

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: neutral100, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: felt, padding: '48px 20px 20px', color: '#fff' }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>Metro Billiards League · 2026</p>
        <h1 style={{ margin: '0 0 14px', fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Teams</h1>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teams…" style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 3 }}>
          {[{ id: 'all', label: 'All teams' }, { id: 'open', label: 'Open rosters' }].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id as any)} style={{ flex: 1, padding: '7px 0', border: 'none', cursor: 'pointer', borderRadius: 6, background: filter === f.id ? '#fff' : 'transparent', color: filter === f.id ? felt : 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 16px 90px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Create team CTA */}
        <button style={{ background: 'none', border: `1.5px dashed ${neutral200}`, borderRadius: 12, padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: neutral100, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={neutral600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: neutral900 }}>Start a new team</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: neutral600 }}>You'll be set as captain</p>
          </div>
        </button>

        {/* Team cards */}
        {filtered.map(team => {
          const isExpanded = expanded === team.name
          const isMyTeam = team.name === MY_TEAM
          const sc = slotConfig[team.slot]
          return (
            <div key={team.name} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: isMyTeam ? `0 0 0 2px ${felt}` : '0 1px 4px rgba(0,0,0,0.06)' }}>
              <button onClick={() => setExpanded(isExpanded ? null : team.name)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 16px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: isMyTeam ? felt : neutral100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: isMyTeam ? '#fff' : neutral600, flexShrink: 0 }}>
                    {team.abbr}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: neutral900 }}>{team.name}</span>
                      {isMyTeam && <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: felt, padding: '1px 6px', borderRadius: 4 }}>My team</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                       <span style={{ fontSize: 12, color: neutral600 }}>#{team.rank} · {team.record}</span>
                       <span style={{ fontSize: 11, fontWeight: 600, color: sc.color, background: sc.bg, padding: '1px 7px', borderRadius: 99 }}>{team.slot}</span>
                       {!team.depth && <span style={{ fontSize: 11, color: amber, fontWeight: 500 }}>Needs depth</span>}
                       {team.playoffSpot && <span style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed', background: '#ede9fe', padding: '1px 7px', borderRadius: 99 }}>Playoffs</span>}
                     </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={neutral600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExpanded ? 'rotate(180deg)' : undefined, flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </button>

              {isExpanded && (
                <div style={{ borderTop: `1px solid ${neutral100}`, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                    {[{ label: 'Captain', val: team.captain }, { label: 'Roster', val: `${team.players} players` }, { label: 'Opening night', val: team.depth ? 'Ready' : 'Needs depth' }].map(s => (
                      <div key={s.label} style={{ flex: 1, background: neutral100, borderRadius: 8, padding: '8px 10px' }}>
                        <p style={{ margin: 0, fontSize: 11, color: neutral600 }}>{s.label}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600, color: neutral900 }}>{s.val}</p>
                      </div>
                    ))}
                  </div>
                  {/* Match counts + playoff qualification */}
                  <div style={{ background: neutral100, borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: neutral600 }}>Individual matches played</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div>
                        <span style={{ fontSize: 18, fontWeight: 800, color: neutral900 }}>{team.matchesForUs}</span>
                        <span style={{ fontSize: 11, color: neutral600, marginLeft: 4 }}>for this team</span>
                      </div>
                      <div>
                        <span style={{ fontSize: 18, fontWeight: 800, color: neutral600 }}>{team.matchesElsewhere}</span>
                        <span style={{ fontSize: 11, color: neutral600, marginLeft: 4 }}>elsewhere</span>
                      </div>
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {team.playoffSpot ? (
                        <>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>Qualified for playoffs — seed {team.rank}</span>
                        </>
                      ) : (
                        <>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: neutral600, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: neutral600 }}>Outside playoff cutoff — currently {team.rank - 4} back</span>
                        </>
                      )}
                    </div>
                  </div>
                  {!isMyTeam && team.open && (
                    <button style={{ width: '100%', padding: '11px', background: felt, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                      Request to join
                    </button>
                  )}
                  {!isMyTeam && !team.open && (
                    <p style={{ margin: 0, fontSize: 13, color: neutral600, textAlign: 'center' }}>Roster is full — message the captain to ask about sub spots</p>
                  )}
                  {isMyTeam && (
                    <button style={{ width: '100%', padding: '11px', background: neutral100, color: neutral900, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                      Manage roster
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: `1px solid ${neutral200}`, display: 'flex', padding: '8px 0 20px' }}>
        {[
          { id: 'home', label: 'Home', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
          { id: 'teams', label: 'Teams', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
          { id: 'schedule', label: 'Schedule', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
          { id: 'messages', label: 'Messages', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
          { id: 'profile', label: 'Profile', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
        ].map(tab => (
          <button key={tab.id} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 0', color: tab.id === 'teams' ? felt : neutral600 }}>
            {tab.icon}
            <span style={{ fontSize: 11, fontWeight: tab.id === 'teams' ? 600 : 400 }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
