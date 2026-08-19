import { useState } from 'react'

const felt = '#0f4c2a'
const greenLight = '#e8f5ee'
const neutral100 = '#f4f4f5'
const neutral200 = '#e4e4e7'
const neutral600 = '#52525b'
const neutral900 = '#09090b'
const green = '#1a7a4a'

const recentMatches = [
  { opponent: 'Eight Ball Wizards', result: 'L', score: '5–7', date: 'Aug 14' },
  { opponent: 'Side Pocket Kings', result: 'W', score: '8–4', date: 'Aug 7' },
  { opponent: 'Long Rail Legends', result: 'W', score: '9–3', date: 'Jul 31' },
  { opponent: 'Break Artists', result: 'L', score: '5–7', date: 'Jul 24' },
  { opponent: 'Corner Pocket Co.', result: 'W', score: '6–6 (TB)', score2: 'W', date: 'Jul 17' },
]

const roster = [
  { name: 'T. Nakamura', role: 'Captain', pts: 44, wins: 14, avg: 5.5, form: ['W','W','L','W','W'] },
  { name: 'C. Burrows', role: 'Player', pts: 31, wins: 10, avg: 3.9, form: ['L','W','W','L','W'] },
  { name: 'P. Singh', role: 'Player', pts: 28, wins: 9, avg: 3.5, form: ['W','L','W','W','L'] },
  { name: 'M. Torres', role: 'Player', pts: 24, wins: 8, avg: 3.0, form: ['L','W','L','W','W'] },
  { name: 'F. Amara', role: 'Sub', pts: 11, wins: 3, avg: 2.8, form: ['W','L','—','W','—'] },
]

export default function FramePlayer() {
  const [activeSection, setActiveSection] = useState<'roster' | 'results' | 'stats'>('roster')

  const statBlocks = [
    { label: 'Rank', val: '4th' },
    { label: 'Record', val: '5–3' },
    { label: 'Points', val: '15' },
    { label: 'Streak', val: '1W' },
  ]

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: neutral100, height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ background: felt, padding: '48px 20px 0', color: '#fff' }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>Team profile</p>
        {/* Team identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
            CO
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Chalk Outlaws</h1>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>Open A Division · Cue Club</p>
          </div>
        </div>
        {/* Stat row */}
        <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '14px 0 0' }}>
          {statBlocks.map((s, i) => (
            <div key={s.label} style={{ flex: 1, textAlign: 'center', borderRight: i < statBlocks.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff' }}>{s.val}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{s.label}</p>
            </div>
          ))}
        </div>
        {/* Section tabs */}
        <div style={{ display: 'flex', marginTop: 16 }}>
          {[{ id: 'roster', label: 'Roster' }, { id: 'results', label: 'Results' }, { id: 'stats', label: 'Stats' }].map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id as any)} style={{
              flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', background: 'transparent',
              color: activeSection === s.id ? '#fff' : 'rgba(255,255,255,0.5)',
              fontSize: 14, fontWeight: activeSection === s.id ? 700 : 400,
              borderBottom: activeSection === s.id ? '2px solid #4ade80' : '2px solid transparent'
            }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: '16px 16px 90px' }}>
        {activeSection === 'roster' && (
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', padding: '8px 14px', background: neutral100, borderBottom: `1px solid ${neutral200}` }}>
              <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: neutral600 }}>Player</span>
              <span style={{ width: 36, textAlign: 'center', fontSize: 11, fontWeight: 600, color: neutral600 }}>W</span>
              <span style={{ width: 36, textAlign: 'center', fontSize: 11, fontWeight: 600, color: neutral600 }}>Pts</span>
              <span style={{ width: 40, textAlign: 'right', fontSize: 11, fontWeight: 600, color: neutral600 }}>Avg</span>
            </div>
            {roster.map((p, i) => (
              <div key={p.name} style={{ padding: '12px 14px', borderBottom: i < roster.length - 1 ? `1px solid ${neutral100}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: p.role === 'Captain' ? felt : neutral100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: p.role === 'Captain' ? '#fff' : neutral600, flexShrink: 0 }}>
                      {p.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: neutral900 }}>{p.name}</p>
                        {p.role === 'Captain' && <span style={{ fontSize: 10, fontWeight: 700, color: '#92400e', background: '#fef3c7', padding: '1px 5px', borderRadius: 4 }}>C</span>}
                        {p.role === 'Sub' && <span style={{ fontSize: 10, fontWeight: 600, color: neutral600, background: neutral100, padding: '1px 5px', borderRadius: 4 }}>Sub</span>}
                      </div>
                      {/* Form dots */}
                      <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                        {p.form.map((r, fi) => (
                          <div key={fi} style={{ width: 16, height: 16, borderRadius: '50%', background: r === 'W' ? green : r === 'L' ? '#dc2626' : neutral200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: r === '—' ? neutral600 : '#fff' }}>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span style={{ width: 36, textAlign: 'center', fontSize: 14, color: neutral600 }}>{p.wins}</span>
                  <span style={{ width: 36, textAlign: 'center', fontSize: 14, fontWeight: 700, color: neutral900 }}>{p.pts}</span>
                  <span style={{ width: 40, textAlign: 'right', fontSize: 14, fontWeight: 600, color: green }}>{p.avg.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'results' && (
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            {recentMatches.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', gap: 12, borderBottom: i < recentMatches.length - 1 ? `1px solid ${neutral100}` : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: m.result === 'W' ? green : '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{m.result}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: neutral900 }}>vs {m.opponent}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: neutral600 }}>{m.date}</p>
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, color: m.result === 'W' ? green : neutral900 }}>{m.score}</span>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'stats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Season summary */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', color: neutral600, textTransform: 'uppercase' }}>Season averages</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {[
                  { label: 'Pts / match', val: '11.2' },
                  { label: 'High score', val: '9' },
                  { label: 'Racks won', val: '56.3%' },
                  { label: 'Unfinished', val: '0' },
                ].map(s => (
                  <div key={s.label} style={{ flex: '1 1 40%', background: neutral100, borderRadius: 10, padding: '12px 14px' }}>
                    <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: neutral900 }}>{s.val}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: neutral600 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Win/loss bar */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', color: neutral600, textTransform: 'uppercase' }}>Racks breakdown</p>
              <div style={{ height: 10, borderRadius: 99, overflow: 'hidden', display: 'flex' }}>
                <div style={{ flex: 56, background: green }} />
                <div style={{ flex: 44, background: '#dc2626' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: green }} />
                  <span style={{ fontSize: 13, color: neutral600 }}>Won: 56%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626' }} />
                  <span style={{ fontSize: 13, color: neutral600 }}>Lost: 44%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: `1px solid ${neutral200}`, display: 'flex', padding: '8px 0 20px' }}>
        {[
          { id: 'home', label: 'Home', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
          { id: 'standings', label: 'Standings', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
          { id: 'schedule', label: 'Schedule', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
          { id: 'players', label: 'Players', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
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
