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

type Role = 'player' | 'captain' | 'admin'
type Eligibility = 'eligible' | 'ineligible' | 'pending'

type Player = {
  id: number
  name: string
  email: string
  role: Role
  teams: string[]
  registered: boolean
  paid: boolean
  eligibility: Eligibility
  wins: number
  fargo?: string
  notes?: string
}

const players: Player[] = [
  { id: 1, name: 'T. Nakamura',  email: 'tnakamura@gmail.com',  role: 'captain', teams: ['Chalk Outlaws'],  registered: true,  paid: true,  eligibility: 'eligible',   wins: 14, fargo: 'FR-88421' },
  { id: 2, name: 'D. Morales',   email: 'dmorales@gmail.com',   role: 'captain', teams: ['Break Artists'],  registered: true,  paid: true,  eligibility: 'eligible',   wins: 16, fargo: 'FR-77203' },
  { id: 3, name: 'R. Okafor',    email: 'rokafor@gmail.com',    role: 'captain', teams: ['Eight Ball Wizards'], registered: true, paid: true, eligibility: 'eligible', wins: 13 },
  { id: 4, name: 'H. Muller',    email: 'hmuller@gmail.com',    role: 'player',  teams: ['Eight Ball Wizards'], registered: true, paid: true, eligibility: 'eligible', wins: 11 },
  { id: 5, name: 'C. Burrows',   email: 'cburrows@gmail.com',   role: 'player',  teams: ['Chalk Outlaws'],  registered: true,  paid: true,  eligibility: 'eligible',   wins: 10 },
  { id: 6, name: 'D. Ferreira',  email: 'dferreira@gmail.com',  role: 'player',  teams: ['Side Pocket Kings'], registered: true, paid: false, eligibility: 'pending', wins: 8, notes: 'Payment due' },
  { id: 7, name: 'J. Osei',      email: 'josei@gmail.com',      role: 'player',  teams: [],                registered: false, paid: false, eligibility: 'pending', wins: 7 },
  { id: 8, name: 'L. Park',      email: 'lpark@gmail.com',      role: 'captain', teams: ['Rack Pack'],      registered: true,  paid: true,  eligibility: 'eligible',   wins: 9 },
  { id: 9, name: 'K. Webb',      email: 'kwebb@gmail.com',      role: 'captain', teams: ['Side Pocket Kings'], registered: true, paid: true, eligibility: 'eligible', wins: 8, notes: 'Contact missing' },
  { id: 10, name: 'B. Kamau',    email: 'bkamau@gmail.com',     role: 'captain', teams: ['Long Rail Legends'], registered: true, paid: true, eligibility: 'eligible', wins: 6 },
]

const roleColors: Record<Role, { color: string; bg: string }> = {
  player:  { color: neutral600, bg: neutral100 },
  captain: { color: '#92400e', bg: '#fef3c7' },
  admin:   { color: '#1e3a5f', bg: '#dbeafe' },
}

const eligColors: Record<Eligibility, { color: string; bg: string; label: string }> = {
  eligible:   { color: green,  bg: greenLight, label: 'Eligible' },
  ineligible: { color: red,    bg: redLight,   label: 'Ineligible' },
  pending:    { color: amber,  bg: amberLight, label: 'Pending' },
}

export default function FrameAdminPlayers() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'flags' | 'captains'>('all')
  const [selected, setSelected] = useState<Player | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role>('player')

  const flagged = players.filter(p => !p.paid || p.eligibility !== 'eligible' || p.notes)
  const captains = players.filter(p => p.role === 'captain')

  const shown = (filter === 'flags' ? flagged : filter === 'captains' ? captains : players)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()))

  if (selected) {
    const rc = roleColors[selectedRole]
    const ec = eligColors[selected.eligibility]
    return (
      <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: neutral100, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: felt, padding: '48px 20px 20px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Admin → Players</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff' }}>
              {selected.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff' }}>{selected.name}</h1>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{selected.email}</p>
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 16px 90px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {selected.notes && (
            <div style={{ background: amberLight, borderRadius: 10, padding: '10px 14px', border: `1px solid ${amber}`, display: 'flex', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={amber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span style={{ fontSize: 13, color: '#92400e', fontWeight: 500 }}>{selected.notes}</span>
            </div>
          )}
          {/* Status row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Role',        val: selected.role, badge: roleColors[selected.role] },
              { label: 'Eligibility', val: eligColors[selected.eligibility].label, badge: eligColors[selected.eligibility] },
              { label: 'Payment',     val: selected.paid ? 'Paid' : 'Due', badge: selected.paid ? { color: green, bg: greenLight } : { color: red, bg: redLight } },
              { label: 'Season wins', val: `${selected.wins}W`, badge: null },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <p style={{ margin: '0 0 4px', fontSize: 11, color: neutral600 }}>{s.label}</p>
                {s.badge ? (
                  <span style={{ fontSize: 13, fontWeight: 700, color: s.badge.color, background: s.badge.bg, padding: '2px 9px', borderRadius: 99 }}>{s.val}</span>
                ) : (
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: neutral900 }}>{s.val}</p>
                )}
              </div>
            ))}
          </div>
          {/* Teams */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Team membership</p>
            {selected.teams.length > 0 ? selected.teams.map((t, i) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < selected.teams.length - 1 ? `1px solid ${neutral100}` : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: felt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                  {t.split(' ').map(w => w[0]).join('').slice(0, 3)}
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: neutral900 }}>{t}</span>
              </div>
            )) : <p style={{ margin: 0, fontSize: 13, color: neutral600 }}>No team — free agent</p>}
          </div>
          {/* Role management */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Role assignment</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {(['player', 'captain', 'admin'] as Role[]).map(r => (
                <button key={r} onClick={() => setSelectedRole(r)} style={{ flex: 1, padding: '8px', border: `1.5px solid ${selectedRole === r ? felt : neutral200}`, borderRadius: 8, background: selectedRole === r ? felt : '#fff', color: selectedRole === r ? '#fff' : neutral900, fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>{r}</button>
              ))}
            </div>
            <button style={{ width: '100%', padding: '11px', background: felt, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Save role
            </button>
          </div>
          {/* Fargo */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Fargo ID</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input defaultValue={selected.fargo || ''} placeholder="FR-XXXXX" style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${neutral200}`, fontSize: 14, color: neutral900 }} />
              <button style={{ padding: '10px 14px', background: felt, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save</button>
            </div>
            {selected.fargo && <p style={{ margin: '6px 0 0', fontSize: 11, color: amber }}>Self-reported — not yet verified</p>}
          </div>
          {/* Admin actions */}
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            {[
              { label: 'Waive entry fee', color: neutral900 },
              { label: 'Override eligibility', color: neutral900 },
              { label: 'Remove from season', color: red },
            ].map((a, i, arr) => (
              <button key={a.label} style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 500, color: a.color, borderBottom: i < arr.length - 1 ? `1px solid ${neutral100}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {a.label}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={neutral600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: neutral100, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: felt, padding: '48px 20px 20px', color: '#fff' }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>Admin</p>
        <h1 style={{ margin: '0 0 14px', fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Players</h1>
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…" style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ id: 'all', label: `All (${players.length})` }, { id: 'flags', label: `Flags (${flagged.length})` }, { id: 'captains', label: `Captains (${captains.length})` }].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id as any)} style={{ padding: '6px 12px', border: 'none', borderRadius: 20, cursor: 'pointer', background: filter === f.id ? '#fff' : 'rgba(255,255,255,0.1)', color: filter === f.id ? felt : 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 600 }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 16px 90px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 12 }}>
          {shown.map((p, i) => {
            const rc = roleColors[p.role]
            const ec = eligColors[p.eligibility]
            const hasFlag = !p.paid || p.eligibility !== 'eligible' || !!p.notes
            return (
              <button key={p.id} onClick={() => { setSelected(p); setSelectedRole(p.role) }} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '12px 16px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < shown.length - 1 ? `1px solid ${neutral100}` : 'none' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: neutral100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: neutral600, flexShrink: 0, position: 'relative' }}>
                  {p.name.split(' ').map(n => n[0]).join('')}
                  {hasFlag && <div style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: '50%', background: amber, border: '2px solid #fff' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: neutral900 }}>{p.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: rc.color, background: rc.bg, padding: '1px 5px', borderRadius: 4, textTransform: 'capitalize' }}>{p.role}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', overflow: 'hidden' }}>
                    <span style={{ fontSize: 11, color: ec.color, background: ec.bg, padding: '1px 6px', borderRadius: 99, fontWeight: 600, flexShrink: 0 }}>{ec.label}</span>
                    <span style={{ fontSize: 12, color: neutral600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.teams.length > 0 ? p.teams.join(', ') : 'Free agent'}</span>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={neutral600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            )
          })}
        </div>

        {/* Create unclaimed player */}
        <button style={{ background: 'none', border: `1.5px dashed ${neutral200}`, borderRadius: 12, padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: neutral100, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={neutral600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: neutral900 }}>Create unclaimed player</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: neutral600 }}>Pre-register a player identity for them to claim on sign-in</p>
          </div>
        </button>
      </div>

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
