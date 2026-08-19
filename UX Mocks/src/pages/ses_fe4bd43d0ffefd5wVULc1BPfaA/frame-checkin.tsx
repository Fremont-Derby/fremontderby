import { useState } from 'react'

const felt = '#0f4c2a'
const neutral100 = '#f4f4f5'
const neutral200 = '#e4e4e7'
const neutral600 = '#52525b'
const neutral900 = '#09090b'
const green = '#1a7a4a'
const greenLight = '#e8f5ee'

type Status = 'in' | 'maybe' | 'out' | null

const rounds = [
  { id: 1, label: 'Week 9', date: 'Wed Aug 21', time: '7:00 PM', venue: 'Cue Club' },
  { id: 2, label: 'Week 10', date: 'Wed Aug 28', time: '7:00 PM', venue: 'Cue Club' },
]

const teamRoster = [
  { name: 'T. Nakamura', role: 'Captain', status: 'in' as Status },
  { name: 'C. Burrows', role: 'Player', status: 'in' as Status },
  { name: 'P. Singh', role: 'Player', status: 'maybe' as Status },
  { name: 'M. Torres', role: 'Player', status: 'out' as Status },
  { name: 'F. Amara', role: 'Sub', status: null as Status },
]

const statusConfig = {
  in:    { label: "I'll be there", color: green,     bg: greenLight,         dot: green },
  maybe: { label: 'Not sure',      color: '#92400e', bg: '#fef3c7',          dot: '#f59e0b' },
  out:   { label: "Can't make it", color: '#991b1b', bg: '#fee2e2',          dot: '#dc2626' },
}

export default function FrameCheckin() {
  const [selectedRound, setSelectedRound] = useState(rounds[0].id)
  const [myStatus, setMyStatus] = useState<Status>('in')
  const [roster, setRoster] = useState(teamRoster)

  const round = rounds.find(r => r.id === selectedRound)!
  const inCount  = roster.filter(p => p.status === 'in').length
  const maybeCount = roster.filter(p => p.status === 'maybe').length
  const outCount = roster.filter(p => p.status === 'out').length

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: neutral100, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: felt, padding: '48px 20px 20px', color: '#fff' }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>Metro Billiards League</p>
        <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Check in</h1>

        {/* Round picker */}
        <div style={{ display: 'flex', gap: 8 }}>
          {rounds.map(r => (
            <button key={r.id} onClick={() => setSelectedRound(r.id)} style={{
              flex: 1, padding: '9px 12px', border: 'none', borderRadius: 8, cursor: 'pointer',
              background: selectedRound === r.id ? '#fff' : 'rgba(255,255,255,0.1)',
              color: selectedRound === r.id ? felt : 'rgba(255,255,255,0.75)',
              fontSize: 13, fontWeight: 600, textAlign: 'left',
            }}>
              <div>{r.label}</div>
              <div style={{ fontSize: 11, fontWeight: 400, marginTop: 1, opacity: 0.7 }}>{r.date}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 90px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Match info */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: neutral900 }}>{round.label} — Chalk Outlaws</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: neutral600 }}>{round.date} · {round.time} · {round.venue}</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: neutral600 }}>vs Side Pocket Kings</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: green, background: greenLight, padding: '3px 8px', borderRadius: 99 }}>Upcoming</span>
          </div>
        </div>

        {/* My RSVP */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', color: neutral600, textTransform: 'uppercase' }}>Your response</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['in', 'maybe', 'out'] as const).map(s => {
              const cfg = statusConfig[s]
              const active = myStatus === s
              return (
                <button key={s} onClick={() => setMyStatus(s)} style={{
                  flex: 1, padding: '10px 6px', border: `2px solid ${active ? cfg.dot : neutral200}`,
                  borderRadius: 10, cursor: 'pointer', background: active ? cfg.bg : '#fff',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: active ? cfg.dot : neutral200 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: active ? cfg.color : neutral600, textAlign: 'center', lineHeight: 1.3 }}>{cfg.label}</span>
                </button>
              )
            })}
          </div>
          {myStatus && (
            <p style={{ margin: '10px 0 0', fontSize: 12, color: neutral600, textAlign: 'center' }}>
              Marked as <strong style={{ color: statusConfig[myStatus].color }}>{statusConfig[myStatus].label}</strong> — captain can see this now
            </p>
          )}
        </div>

        {/* Team roster status */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', color: neutral600, textTransform: 'uppercase' }}>Team availability</p>
            <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
              <span style={{ color: green, fontWeight: 700 }}>{inCount} in</span>
              <span style={{ color: '#f59e0b', fontWeight: 700 }}>{maybeCount} maybe</span>
              <span style={{ color: '#dc2626', fontWeight: 700 }}>{outCount} out</span>
            </div>
          </div>
          {roster.map((p, i) => {
            const cfg = p.status ? statusConfig[p.status] : null
            return (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < roster.length - 1 ? `1px solid ${neutral100}` : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: p.role === 'Captain' ? felt : neutral100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: p.role === 'Captain' ? '#fff' : neutral600, flexShrink: 0 }}>
                  {p.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: neutral900 }}>{p.name}</span>
                    {p.role === 'Captain' && <span style={{ fontSize: 10, fontWeight: 700, color: '#92400e', background: '#fef3c7', padding: '1px 5px', borderRadius: 4 }}>C</span>}
                    {p.role === 'Sub' && <span style={{ fontSize: 10, color: neutral600, background: neutral100, padding: '1px 5px', borderRadius: 4 }}>Sub</span>}
                  </div>
                </div>
                {cfg ? (
                  <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg, padding: '3px 9px', borderRadius: 99 }}>{cfg.label}</span>
                ) : (
                  <span style={{ fontSize: 12, color: neutral600, background: neutral100, padding: '3px 9px', borderRadius: 99 }}>No response</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Free agent pool */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', color: neutral600, textTransform: 'uppercase' }}>Available subs & free agents</p>
          {[
            { name: 'J. Osei', status: 'in' as const, note: 'Free agent' },
            { name: 'L. Reeves', status: 'in' as const, note: 'Free agent' },
            { name: 'B. Kamau', status: 'maybe' as const, note: 'Sub pool' },
          ].map((p, i, arr) => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < arr.length - 1 ? `1px solid ${neutral100}` : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: neutral100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: neutral600 }}>
                {p.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: neutral900 }}>{p.name}</span>
                <p style={{ margin: '1px 0 0', fontSize: 12, color: neutral600 }}>{p.note}</p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: statusConfig[p.status].color, background: statusConfig[p.status].bg, padding: '3px 9px', borderRadius: 99 }}>{statusConfig[p.status].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: `1px solid ${neutral200}`, display: 'flex', padding: '8px 0 20px' }}>
        {[
          { id: 'home', label: 'Home', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
          { id: 'checkin', label: 'Check in', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
          { id: 'lineup', label: 'Lineup', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
          { id: 'score', label: 'Score', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
          { id: 'more', label: 'More', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg> },
        ].map(tab => (
          <button key={tab.id} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 0', color: tab.id === 'checkin' ? felt : neutral600 }}>
            {tab.icon}
            <span style={{ fontSize: 11, fontWeight: tab.id === 'checkin' ? 600 : 400 }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
