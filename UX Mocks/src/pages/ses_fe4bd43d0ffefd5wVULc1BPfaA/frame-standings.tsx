import { useState } from 'react'

const felt = '#0f4c2a'
const greenLight = '#e8f5ee'
const neutral50 = '#fafafa'
const neutral100 = '#f4f4f5'
const neutral200 = '#e4e4e7'
const neutral600 = '#52525b'
const neutral900 = '#09090b'
const green = '#1a7a4a'

const teams = [
  { rank: 1, name: 'Break Artists', played: 8, wins: 7, losses: 1, pts: 21, pct: .875, streak: '4W', change: 0 },
  { rank: 2, name: 'Eight Ball Wizards', played: 8, wins: 6, losses: 2, pts: 18, pct: .750, streak: '2W', change: 1 },
  { rank: 3, name: 'Corner Pocket Co.', played: 8, wins: 6, losses: 2, pts: 18, pct: .750, streak: '1L', change: -1 },
  { rank: 4, name: 'Chalk Outlaws', played: 8, wins: 5, losses: 3, pts: 15, pct: .625, streak: '1W', change: 0 },
  { rank: 5, name: 'Straight Shooters', played: 8, wins: 4, losses: 4, pts: 12, pct: .500, streak: '3L', change: 1 },
  { rank: 6, name: 'Side Pocket Kings', played: 8, wins: 3, losses: 5, pts: 9, pct: .375, streak: '2L', change: -1 },
  { rank: 7, name: 'Rack Pack', played: 8, wins: 2, losses: 6, pts: 6, pct: .250, streak: '1L', change: 0 },
  { rank: 8, name: 'Long Rail Legends', played: 8, wins: 1, losses: 7, pts: 3, pct: .125, streak: '5L', change: 0 },
]

const initials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2)

export default function FrameStandings() {
  const [view, setView] = useState<'teams' | 'players'>('teams')

  const playerRows = [
    { rank: 1, name: 'D. Morales', team: 'Break Artists', pts: 48, wins: 16, avg: 6.0 },
    { rank: 2, name: 'T. Nakamura', team: 'Chalk Outlaws', pts: 44, wins: 14, avg: 5.5 },
    { rank: 3, name: 'R. Okafor', team: 'Eight Ball Wizards', pts: 41, wins: 13, avg: 5.1 },
    { rank: 4, name: 'S. Petrov', team: 'Break Artists', pts: 40, wins: 13, avg: 5.0 },
    { rank: 5, name: 'M. Delgado', team: 'Corner Pocket Co.', pts: 38, wins: 12, avg: 4.8 },
    { rank: 6, name: 'J. Williams', team: 'Straight Shooters', pts: 35, wins: 11, avg: 4.4 },
    { rank: 7, name: 'A. Chen', team: 'Eight Ball Wizards', pts: 33, wins: 11, avg: 4.1 },
    { rank: 8, name: 'K. Ibrahim', team: 'Rack Pack', pts: 29, wins: 9, avg: 3.6 },
  ]

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: neutral100, height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ background: felt, padding: '48px 20px 20px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" color="rgba(255,255,255,0.6)"><polyline points="15 18 9 12 15 6"/></svg>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>Metro Billiards League</p>
        </div>
        <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Standings</h1>
        {/* Tabs */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 3 }}>
          {['teams', 'players'].map(v => (
            <button key={v} onClick={() => setView(v as any)} style={{
              flex: 1, padding: '7px 0', border: 'none', cursor: 'pointer', borderRadius: 6,
              background: view === v ? '#fff' : 'transparent',
              color: view === v ? felt : 'rgba(255,255,255,0.7)',
              fontSize: 13, fontWeight: 600, textTransform: 'capitalize'
            }}>
              {v === 'teams' ? 'Teams' : 'Players'}
            </button>
          ))}
        </div>
      </div>

      {view === 'teams' && (
        <div style={{ flex: 1, padding: '14px 16px 24px' }}>
          {/* Playoff cutoff label */}
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            {/* Header row */}
            <div style={{ display: 'flex', padding: '8px 12px', background: neutral100, borderBottom: `1px solid ${neutral200}` }}>
              <span style={{ width: 26, fontSize: 11, fontWeight: 600, color: neutral600 }}>#</span>
              <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: neutral600 }}>Team</span>
              <span style={{ width: 30, textAlign: 'center', fontSize: 11, fontWeight: 600, color: neutral600 }}>W</span>
              <span style={{ width: 30, textAlign: 'center', fontSize: 11, fontWeight: 600, color: neutral600 }}>L</span>
              <span style={{ width: 36, textAlign: 'center', fontSize: 11, fontWeight: 600, color: neutral600 }}>Pts</span>
              <span style={{ width: 40, textAlign: 'right', fontSize: 11, fontWeight: 600, color: neutral600 }}>Str</span>
            </div>
            {teams.map((t, i) => (
              <div key={t.rank}>
                {i === 4 && (
                  <div style={{ background: '#fffbeb', padding: '5px 12px', borderTop: `1px dashed #fbbf24`, borderBottom: `1px dashed #fbbf24` }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#92400e' }}>Playoff cutoff</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', background: t.name === 'Chalk Outlaws' ? greenLight : '#fff', borderBottom: i < teams.length - 1 ? `1px solid ${neutral100}` : 'none' }}>
                  <div style={{ width: 26, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: neutral900 }}>{t.rank}</span>
                    {t.change !== 0 && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill={t.change > 0 ? green : '#dc2626'} style={{ transform: t.change < 0 ? 'rotate(180deg)' : undefined }}>
                        <path d="M12 2l8 18H4z" />
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: t.name === 'Chalk Outlaws' ? felt : neutral200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: t.name === 'Chalk Outlaws' ? '#fff' : neutral600, flexShrink: 0 }}>
                      {initials(t.name)}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: t.name === 'Chalk Outlaws' ? 700 : 500, color: neutral900 }}>{t.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: neutral600 }}>{(t.pct * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <span style={{ width: 30, textAlign: 'center', fontSize: 14, fontWeight: 600, color: green }}>{t.wins}</span>
                  <span style={{ width: 30, textAlign: 'center', fontSize: 14, color: neutral600 }}>{t.losses}</span>
                  <span style={{ width: 36, textAlign: 'center', fontSize: 14, fontWeight: 700, color: neutral900 }}>{t.pts}</span>
                  <span style={{ width: 40, textAlign: 'right', fontSize: 12, fontWeight: 600, color: t.streak.includes('W') ? green : '#dc2626' }}>{t.streak}</span>
                </div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 11, color: neutral600, marginTop: 12 }}>Highlighted row = your team · Top 4 advance to playoffs</p>
        </div>
      )}

      {view === 'players' && (
        <div style={{ flex: 1, padding: '14px 16px 24px' }}>
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', padding: '8px 12px', background: neutral100, borderBottom: `1px solid ${neutral200}` }}>
              <span style={{ width: 26, fontSize: 11, fontWeight: 600, color: neutral600 }}>#</span>
              <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: neutral600 }}>Player</span>
              <span style={{ width: 36, textAlign: 'center', fontSize: 11, fontWeight: 600, color: neutral600 }}>W</span>
              <span style={{ width: 36, textAlign: 'center', fontSize: 11, fontWeight: 600, color: neutral600 }}>Pts</span>
              <span style={{ width: 40, textAlign: 'right', fontSize: 11, fontWeight: 600, color: neutral600 }}>Avg</span>
            </div>
            {playerRows.map((p, i) => (
              <div key={p.rank} style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderBottom: i < playerRows.length - 1 ? `1px solid ${neutral100}` : 'none' }}>
                <span style={{ width: 26, fontSize: 14, fontWeight: 700, color: i < 3 ? '#b45309' : neutral600 }}>{p.rank}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: neutral900 }}>{p.name}</p>
                  <p style={{ margin: '1px 0 0', fontSize: 11, color: neutral600 }}>{p.team}</p>
                </div>
                <span style={{ width: 36, textAlign: 'center', fontSize: 14, color: neutral600 }}>{p.wins}</span>
                <span style={{ width: 36, textAlign: 'center', fontSize: 14, fontWeight: 700, color: neutral900 }}>{p.pts}</span>
                <span style={{ width: 40, textAlign: 'right', fontSize: 13, fontWeight: 600, color: green }}>{p.avg.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: `1px solid ${neutral200}`, display: 'flex', padding: '8px 0 20px' }}>
        {[
          { id: 'home', label: 'Home', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
          { id: 'standings', label: 'Standings', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
          { id: 'schedule', label: 'Schedule', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
          { id: 'players', label: 'Players', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
        ].map(tab => (
          <button key={tab.id} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 0', color: tab.id === 'standings' ? felt : neutral600 }}>
            {tab.icon}
            <span style={{ fontSize: 11, fontWeight: tab.id === 'standings' ? 600 : 400 }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
