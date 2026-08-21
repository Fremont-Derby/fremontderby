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

type SlotState = 'Forming' | 'Qualified' | 'Accepted' | 'Waitlisted'

const slotConfig: Record<SlotState, { color: string; bg: string }> = {
  Forming:    { color: amber,    bg: amberLight },
  Qualified:  { color: green,    bg: greenLight },
  Accepted:   { color: green,    bg: '#dcfce7' },
  Waitlisted: { color: '#7c3aed', bg: '#ede9fe' },
}

type Team = {
  name: string
  abbr: string
  slot: SlotState
  captain: string
  captainOk: boolean
  players: number
  paid: number
  depth: boolean
  notes?: string
}

const initialTeams: Team[] = [
  { name: 'Break Artists',      abbr: 'BA',  slot: 'Accepted',   captain: 'D. Morales',  captainOk: true,  players: 5, paid: 5, depth: true },
  { name: 'Eight Ball Wizards', abbr: 'EBW', slot: 'Accepted',   captain: 'R. Okafor',   captainOk: true,  players: 4, paid: 4, depth: true },
  { name: 'Corner Pocket Co.',  abbr: 'CPC', slot: 'Accepted',   captain: 'M. Delgado',  captainOk: true,  players: 4, paid: 3, depth: true, notes: '1 payment pending' },
  { name: 'Chalk Outlaws',      abbr: 'CO',  slot: 'Accepted',   captain: 'T. Nakamura', captainOk: true,  players: 5, paid: 5, depth: true },
  { name: 'Straight Shooters',  abbr: 'SS',  slot: 'Accepted',   captain: 'J. Williams', captainOk: true,  players: 4, paid: 4, depth: true },
  { name: 'Side Pocket Kings',  abbr: 'SPK', slot: 'Forming',    captain: 'K. Webb',     captainOk: true,  players: 3, paid: 2, depth: false, notes: 'Needs 1 more player' },
  { name: 'Rack Pack',          abbr: 'RP',  slot: 'Accepted',   captain: 'L. Park',     captainOk: true,  players: 5, paid: 5, depth: true },
  { name: 'Long Rail Legends',  abbr: 'LRL', slot: 'Accepted',   captain: 'B. Kamau',    captainOk: true,  players: 4, paid: 4, depth: true },
]

const waitlisted: Team[] = [
  { name: 'Corner Shot Crew', abbr: 'CSC', slot: 'Waitlisted', captain: 'Unassigned', captainOk: false, players: 2, paid: 0, depth: false, notes: 'Slot 9 — waiting for dropout' },
]

export default function FrameAdminSeasonTeams() {
  const [teams, setTeams] = useState(initialTeams)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'flags'>('all')

  const flagged = teams.filter(t => !t.depth || t.paid < t.players || t.slot === 'Forming')
  const shown = filter === 'flags' ? flagged : teams

  const promoteSlot = (name: string, slot: SlotState) => {
    setTeams(ts => ts.map(t => t.name === name ? { ...t, slot } : t))
  }

  const slotsAccepted = teams.filter(t => t.slot === 'Accepted').length
  const slotsTotal = 8

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: neutral100, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: felt, padding: '48px 20px 20px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Admin</p>
        </div>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Season teams</h1>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>Season 2026 · Slot governance</p>

        {/* Slot summary */}
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 0, marginBottom: 14 }}>
          {[
            { label: 'Accepted', val: `${slotsAccepted} / ${slotsTotal}` },
            { label: 'Forming', val: `${teams.filter(t => t.slot === 'Forming').length}` },
            { label: 'Waitlisted', val: `${waitlisted.length}` },
            { label: 'Depth ready', val: `${teams.filter(t => t.depth).length} / ${slotsTotal}` },
          ].map((s, i) => (
            <div key={s.label} style={{ flex: 1, textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff' }}>{s.val}</p>
              <p style={{ margin: '1px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 3 }}>
          {[{ id: 'all', label: 'All teams' }, { id: 'flags', label: `Needs attention (${flagged.length})` }].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id as any)} style={{ flex: 1, padding: '7px 0', border: 'none', cursor: 'pointer', borderRadius: 6, background: filter === f.id ? '#fff' : 'transparent', color: filter === f.id ? felt : 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 16px 90px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Active teams */}
        {shown.map(team => {
          const isExpanded = expanded === team.name
          const sc = slotConfig[team.slot]
          const hasFlags = !team.depth || team.paid < team.players || team.slot === 'Forming'
          return (
            <div key={team.name} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <button onClick={() => setExpanded(isExpanded ? null : team.name)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 16px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: neutral100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: neutral600, flexShrink: 0 }}>
                    {team.abbr}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: neutral900 }}>{team.name}</span>
                      {hasFlags && <div style={{ width: 6, height: 6, borderRadius: '50%', background: amber }} />}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: sc.color, background: sc.bg, padding: '1px 7px', borderRadius: 99 }}>{team.slot}</span>
                      <span style={{ fontSize: 12, color: neutral600 }}>{team.players}P · {team.paid} paid</span>
                      {!team.depth && <span style={{ fontSize: 11, color: amber, fontWeight: 600 }}>Needs depth</span>}
                      {team.notes && <span style={{ fontSize: 11, color: neutral600 }}>{team.notes}</span>}
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={neutral600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExpanded ? 'rotate(180deg)' : undefined, flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </button>

              {isExpanded && (
                <div style={{ borderTop: `1px solid ${neutral100}`, padding: '14px 16px' }}>
                  {/* Detail rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                    {[
                      { label: 'Captain', val: `${team.captain}${team.captainOk ? '' : ' — contact missing'}` },
                      { label: 'Roster', val: `${team.players} players rostered` },
                      { label: 'Payments', val: `${team.paid} / ${team.players} confirmed` },
                      { label: 'Opening night', val: team.depth ? 'Ready (4+ players)' : 'Needs 1 more player' },
                    ].map(r => (
                      <div key={r.label} style={{ display: 'flex', gap: 12 }}>
                        <span style={{ flex: '0 0 100px', fontSize: 12, color: neutral600, fontWeight: 500 }}>{r.label}</span>
                        <span style={{ fontSize: 12, color: neutral900 }}>{r.val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Slot controls */}
                  <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: neutral600 }}>Change slot state</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    {(['Forming', 'Qualified', 'Accepted', 'Waitlisted'] as SlotState[]).map(s => (
                      <button key={s} onClick={() => promoteSlot(team.name, s)} style={{ padding: '5px 12px', border: `1.5px solid ${team.slot === s ? felt : neutral200}`, borderRadius: 8, background: team.slot === s ? felt : '#fff', color: team.slot === s ? '#fff' : neutral900, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        {s}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ flex: 1, padding: '9px', background: neutral100, color: neutral900, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Add players</button>
                    <button style={{ flex: 1, padding: '9px', background: neutral100, color: neutral900, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Message captain</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Waitlisted */}
        {filter === 'all' && waitlisted.length > 0 && (
          <div>
            <p style={{ margin: '4px 0 10px', fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Waitlist</p>
            {waitlisted.map(team => {
              const sc = slotConfig[team.slot]
              return (
                <div key={team.name} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: neutral100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: neutral600 }}>
                      {team.abbr}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: neutral900 }}>{team.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: sc.color, background: sc.bg, padding: '1px 7px', borderRadius: 99 }}>{team.slot}</span>
                        <span style={{ fontSize: 12, color: neutral600 }}>{team.notes}</span>
                      </div>
                    </div>
                    <button style={{ padding: '7px 12px', background: felt, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Promote</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add team */}
        <button style={{ background: 'none', border: `1.5px dashed ${neutral200}`, borderRadius: 12, padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: neutral100, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={neutral600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: neutral900 }}>Prepare a team</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: neutral600 }}>Create a prepared slot with optional captain assignment</p>
          </div>
        </button>
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
