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

type Player = { name: string; role: string; available: boolean; wins: number; avg: number }

const roster: Player[] = [
  { name: 'T. Nakamura', role: 'Captain', available: true,  wins: 14, avg: 5.5 },
  { name: 'C. Burrows',  role: 'Player',  available: true,  wins: 10, avg: 3.9 },
  { name: 'P. Singh',    role: 'Player',  available: false, wins: 9,  avg: 3.5 },
  { name: 'M. Torres',   role: 'Player',  available: false, wins: 8,  avg: 3.0 },
  { name: 'F. Amara',    role: 'Sub',     available: true,  wins: 3,  avg: 2.8 },
]

const subs: Player[] = [
  { name: 'J. Osei',   role: 'Free agent', available: true, wins: 7, avg: 3.2 },
  { name: 'L. Reeves', role: 'Free agent', available: true, wins: 5, avg: 2.9 },
]

export default function FrameLineup() {
  // 3 lineup slots (null = empty)
  const [slots, setSlots] = useState<(Player | null)[]>([null, null, null])
  const [locked, setLocked] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const allPlayers = [...roster, ...subs]
  const available = allPlayers.filter(p => p.available)
  const inSlots = slots.filter(Boolean).map(p => p!.name)

  const fill = (player: Player) => {
    if (locked) return
    if (inSlots.includes(player.name)) {
      setSlots(slots.map(s => s?.name === player.name ? null : s))
      return
    }
    const firstEmpty = slots.findIndex(s => s === null)
    if (firstEmpty === -1) return
    const next = [...slots]
    next[firstEmpty] = player
    setSlots(next)
  }

  const clear = (idx: number) => {
    if (locked) return
    const next = [...slots]
    next[idx] = null
    setSlots(next)
  }

  const canLock = slots.every(s => s !== null)

  // Simulated opponent lineup (hidden until revealed)
  const opponentSlots = ['D. Ferreira', 'K. Holm', 'B. Eze']

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: neutral100, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: felt, padding: '48px 20px 20px', color: '#fff' }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>Chalk Outlaws · Week 9</p>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Set lineup</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>vs Side Pocket Kings · Wed Aug 21 · 7 PM</p>

        {/* Lock status banner */}
        {locked && (
          <div style={{ marginTop: 14, background: revealed ? greenLight : amberLight, borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: revealed ? green : amber, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: revealed ? '#065f46' : '#92400e' }}>
              {revealed ? 'Both lineups submitted — matchups revealed' : 'Lineup locked · Waiting for opponent'}
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: '16px 16px 90px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Slots */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', color: neutral600, textTransform: 'uppercase' }}>Your three slots</p>
            <span style={{ fontSize: 13, fontWeight: 700, color: inSlots.length === 3 ? green : neutral600 }}>{inSlots.length} / 3</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {slots.map((player, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: player ? greenLight : neutral100, border: `1.5px ${player ? 'solid ' + green : 'dashed ' + neutral200}` }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: player ? felt : neutral200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: player ? '#fff' : neutral600, flexShrink: 0 }}>
                  {player ? player.name.split(' ').map(n => n[0]).join('') : i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  {player ? (
                    <>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: neutral900 }}>{player.name}</p>
                      <p style={{ margin: 0, fontSize: 12, color: neutral600 }}>{player.avg.toFixed(1)} avg · {player.wins}W</p>
                    </>
                  ) : (
                    <p style={{ margin: 0, fontSize: 13, color: neutral600 }}>Slot {i + 1} — select a player below</p>
                  )}
                </div>
                {player && !locked && (
                  <button onClick={() => clear(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={neutral600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
                {/* Blind order note */}
                {locked && !revealed && player && (
                  <span style={{ fontSize: 11, color: '#92400e', fontWeight: 500 }}>Slot {i + 1}</span>
                )}
              </div>
            ))}
          </div>

          {/* Revealed matchups */}
          {revealed && (
            <div style={{ marginTop: 12 }}>
              <div style={{ height: 1, background: neutral200, margin: '0 0 12px' }} />
              <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Matchups</p>
              {slots.map((player, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: i < 2 ? `1px solid ${neutral100}` : 'none' }}>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: neutral900 }}>{player?.name}</span>
                  <span style={{ fontSize: 12, color: neutral600 }}>vs</span>
                  <span style={{ flex: 1, fontSize: 13, color: neutral900, textAlign: 'right' }}>{opponentSlots[i]}</span>
                </div>
              ))}
            </div>
          )}

          {/* Lock / reveal buttons */}
          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            {!locked ? (
              <button onClick={() => setLocked(true)} disabled={!canLock} style={{ flex: 1, padding: '12px', background: canLock ? felt : neutral200, color: canLock ? '#fff' : neutral600, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: canLock ? 'pointer' : 'not-allowed' }}>
                Lock lineup
              </button>
            ) : !revealed ? (
              <button onClick={() => setRevealed(true)} style={{ flex: 1, padding: '12px', background: amber, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Reveal matchups (both submitted)
              </button>
            ) : (
              <button style={{ flex: 1, padding: '12px', background: green, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Score this match
              </button>
            )}
          </div>
        </div>

        {/* Player pool */}
        {!locked && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', color: neutral600, textTransform: 'uppercase' }}>Select players</p>
            {available.map((p, i) => {
              const selected = inSlots.includes(p.name)
              const full = inSlots.length === 3 && !selected
              return (
                <div key={p.name}>
                  <button onClick={() => fill(p)} disabled={full} style={{ width: '100%', background: 'none', border: 'none', padding: '10px 0', cursor: full ? 'not-allowed' : 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, opacity: full ? 0.4 : 1 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: selected ? felt : neutral100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: selected ? '#fff' : neutral600, flexShrink: 0 }}>
                      {p.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: neutral900 }}>{p.name}</span>
                        {p.role === 'Captain' && <span style={{ fontSize: 10, fontWeight: 700, color: '#92400e', background: '#fef3c7', padding: '1px 5px', borderRadius: 4 }}>C</span>}
                        {p.role === 'Sub' || p.role === 'Free agent' ? <span style={{ fontSize: 10, color: neutral600, background: neutral100, padding: '1px 5px', borderRadius: 4 }}>{p.role}</span> : null}
                      </div>
                      <span style={{ fontSize: 12, color: neutral600 }}>{p.avg.toFixed(1)} avg · {p.wins}W</span>
                    </div>
                    {selected && (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </button>
                  {i < available.length - 1 && <div style={{ height: 1, background: neutral100 }} />}
                </div>
              )
            })}
            <p style={{ margin: '10px 0 0', fontSize: 12, color: neutral600 }}>
              {roster.filter(p => !p.available).length} rostered player(s) marked unavailable — not shown
            </p>
          </div>
        )}
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
          <button key={tab.id} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 0', color: tab.id === 'lineup' ? felt : neutral600 }}>
            {tab.icon}
            <span style={{ fontSize: 11, fontWeight: tab.id === 'lineup' ? 600 : 400 }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
