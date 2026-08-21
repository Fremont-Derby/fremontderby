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

type SortKey = 'name' | 'wins' | 'avg' | 'rank'
type AvailFilter = 'all' | 'available' | 'free-agent'

const players = [
  { rank: 1,  name: 'D. Morales',   team: 'Break Artists',      wins: 16, played: 24, avg: 6.0, available: true,  freeAgent: false },
  { rank: 2,  name: 'T. Nakamura',  team: 'Chalk Outlaws',       wins: 14, played: 24, avg: 5.5, available: true,  freeAgent: false },
  { rank: 3,  name: 'R. Okafor',    team: 'Eight Ball Wizards',  wins: 13, played: 24, avg: 5.1, available: false, freeAgent: false },
  { rank: 4,  name: 'S. Petrov',    team: 'Break Artists',       wins: 13, played: 22, avg: 5.0, available: false, freeAgent: false },
  { rank: 5,  name: 'M. Delgado',   team: 'Corner Pocket Co.',   wins: 12, played: 22, avg: 4.8, available: true,  freeAgent: false },
  { rank: 6,  name: 'J. Williams',  team: 'Straight Shooters',   wins: 11, played: 22, avg: 4.4, available: true,  freeAgent: false },
  { rank: 7,  name: 'A. Chen',      team: 'Eight Ball Wizards',  wins: 11, played: 24, avg: 4.1, available: false, freeAgent: false },
  { rank: 8,  name: 'H. Muller',    team: 'Eight Ball Wizards',  wins: 10, played: 22, avg: 4.0, available: true,  freeAgent: false },
  { rank: 9,  name: 'C. Burrows',   team: 'Chalk Outlaws',       wins: 10, played: 24, avg: 3.9, available: true,  freeAgent: false },
  { rank: 10, name: 'K. Ibrahim',   team: 'Rack Pack',           wins: 9,  played: 22, avg: 3.6, available: false, freeAgent: false },
  { rank: 11, name: 'L. Park',      team: 'Rack Pack',           wins: 9,  played: 24, avg: 3.4, available: true,  freeAgent: false },
  { rank: 12, name: 'P. Singh',     team: 'Chalk Outlaws',       wins: 9,  played: 24, avg: 3.5, available: false, freeAgent: false },
  { rank: 13, name: 'J. Osei',      team: null,                  wins: 7,  played: 18, avg: 3.2, available: true,  freeAgent: true  },
  { rank: 14, name: 'L. Reeves',    team: null,                  wins: 5,  played: 14, avg: 2.9, available: true,  freeAgent: true  },
  { rank: 15, name: 'B. Kamau',     team: 'Long Rail Legends',   wins: 6,  played: 20, avg: 3.0, available: true,  freeAgent: false },
  { rank: 16, name: 'K. Webb',      team: 'Side Pocket Kings',   wins: 8,  played: 22, avg: 3.3, available: false, freeAgent: false },
  { rank: 17, name: 'D. Ferreira',  team: 'Side Pocket Kings',   wins: 8,  played: 22, avg: 3.1, available: true,  freeAgent: false },
  { rank: 18, name: 'M. Torres',    team: 'Chalk Outlaws',       wins: 8,  played: 24, avg: 3.0, available: false, freeAgent: false },
]

const teams = ['All teams', 'Break Artists', 'Chalk Outlaws', 'Eight Ball Wizards', 'Corner Pocket Co.', 'Straight Shooters', 'Rack Pack', 'Long Rail Legends', 'Side Pocket Kings', 'Free agents']

export default function FramePlayerDirectory() {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('rank')
  const [availFilter, setAvailFilter] = useState<AvailFilter>('all')
  const [teamFilter, setTeamFilter] = useState('All teams')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = players
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.team || '').toLowerCase().includes(search.toLowerCase())
      const matchAvail = availFilter === 'all' ? true :
        availFilter === 'available' ? p.available :
        p.freeAgent
      const matchTeam = teamFilter === 'All teams' ? true :
        teamFilter === 'Free agents' ? p.freeAgent :
        p.team === teamFilter
      return matchSearch && matchAvail && matchTeam
    })
    .sort((a, b) => {
      if (sort === 'rank') return a.rank - b.rank
      if (sort === 'wins') return b.wins - a.wins
      if (sort === 'avg') return b.avg - a.avg
      return a.name.localeCompare(b.name)
    })

  const availCount = players.filter(p => p.available).length
  const freeAgentCount = players.filter(p => p.freeAgent).length

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: neutral100, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: felt, padding: '48px 20px 20px', color: '#fff' }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>Metro Billiards League · 2026</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Players</h1>
          <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
            <span><strong style={{ color: '#4ade80' }}>{availCount}</strong> available</span>
            <span><strong style={{ color: '#fbbf24' }}>{freeAgentCount}</strong> free agents</span>
          </div>
        </div>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search players or teams…" style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
        </div>
        {/* Quick filters */}
        <div style={{ display: 'flex', gap: 6 }}>
          {([['all', 'All'], ['available', 'Available to sub'], ['free-agent', 'Free agents']] as [AvailFilter, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setAvailFilter(id)} style={{ padding: '5px 10px', border: 'none', borderRadius: 20, cursor: 'pointer', background: availFilter === id ? '#fff' : 'rgba(255,255,255,0.1)', color: availFilter === id ? felt : 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {label}
            </button>
          ))}
          <button onClick={() => setShowFilters(!showFilters)} style={{ marginLeft: 'auto', padding: '5px 10px', border: 'none', borderRadius: 20, cursor: 'pointer', background: showFilters ? '#fff' : 'rgba(255,255,255,0.1)', color: showFilters ? felt : 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 600 }}>
            Filters
          </button>
        </div>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div style={{ background: '#fff', padding: '14px 16px', borderBottom: `1px solid ${neutral200}` }}>
          <div style={{ marginBottom: 12 }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: neutral600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Sort by</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {([['rank', 'Standings rank'], ['wins', 'Wins'], ['avg', 'Win avg'], ['name', 'Name A–Z']] as [SortKey, string][]).map(([key, label]) => (
                <button key={key} onClick={() => setSort(key)} style={{ padding: '6px 11px', border: `1.5px solid ${sort === key ? felt : neutral200}`, borderRadius: 8, background: sort === key ? felt : '#fff', color: sort === key ? '#fff' : neutral900, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: neutral600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Team</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {teams.map(t => (
                <button key={t} onClick={() => setTeamFilter(t)} style={{ padding: '6px 11px', border: `1.5px solid ${teamFilter === t ? felt : neutral200}`, borderRadius: 8, background: teamFilter === t ? felt : '#fff', color: teamFilter === t ? '#fff' : neutral900, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '12px 16px 90px' }}>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: neutral600 }}>{filtered.length} player{filtered.length !== 1 ? 's' : ''} · no phone numbers shown</p>
        <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {/* Column header */}
          <div style={{ display: 'flex', padding: '8px 14px', background: neutral100, borderBottom: `1px solid ${neutral200}` }}>
            <span style={{ width: 28, fontSize: 11, fontWeight: 600, color: neutral600 }}>#</span>
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: neutral600 }}>Player</span>
            <span style={{ width: 34, textAlign: 'center', fontSize: 11, fontWeight: 600, color: neutral600 }}>W</span>
            <span style={{ width: 40, textAlign: 'right', fontSize: 11, fontWeight: 600, color: neutral600 }}>Avg</span>
          </div>

          {filtered.length === 0 ? (
            <p style={{ padding: '24px 16px', margin: 0, fontSize: 13, color: neutral600, textAlign: 'center' }}>No players match</p>
          ) : filtered.map((p, i) => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: i < filtered.length - 1 ? `1px solid ${neutral100}` : 'none', gap: 10 }}>
              <span style={{ width: 28, fontSize: 13, fontWeight: 700, color: p.rank <= 3 ? '#b45309' : neutral600 }}>{p.rank}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: neutral900 }}>{p.name}</span>
                  {p.available && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: green, background: greenLight, padding: '1px 5px', borderRadius: 4 }}>Available</span>
                  )}
                  {p.freeAgent && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#92400e', background: amberLight, padding: '1px 5px', borderRadius: 4 }}>Free agent</span>
                  )}
                </div>
                <span style={{ fontSize: 12, color: neutral600 }}>{p.team || 'No team'} · {p.played} matches</span>
              </div>
              <span style={{ width: 34, textAlign: 'center', fontSize: 14, color: neutral900, fontWeight: 600 }}>{p.wins}</span>
              <span style={{ width: 40, textAlign: 'right', fontSize: 14, fontWeight: 700, color: green }}>{p.avg.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: `1px solid ${neutral200}`, display: 'flex', padding: '8px 0 20px' }}>
        {[
          { id: 'home', label: 'Home', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
          { id: 'teams', label: 'Teams', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
          { id: 'standings', label: 'Standings', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
          { id: 'players', label: 'Players', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg> },
          { id: 'profile', label: 'Profile', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
        ].map(tab => (
          <button key={tab.id} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 0', color: tab.id === 'players' ? felt : neutral600 }}>
            {tab.icon}
            <span style={{ fontSize: 11, fontWeight: tab.id === 'players' ? 600 : 400 }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
