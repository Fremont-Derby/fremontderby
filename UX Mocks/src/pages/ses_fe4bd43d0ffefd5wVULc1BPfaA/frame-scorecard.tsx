import { useState } from 'react'

const felt = '#0f4c2a'
const neutral100 = '#f4f4f5'
const neutral200 = '#e4e4e7'
const neutral600 = '#52525b'
const neutral900 = '#09090b'
const green = '#1a7a4a'
const greenLight = '#e8f5ee'

type GameResult = { homeWon: boolean | null }

const RACES = [1, 2, 3, 4, 5, 6, 7, 8, 9]

const matchups = [
  { home: 'T. Nakamura', away: 'D. Ferreira', race: 7 },
  { home: 'C. Burrows',  away: 'K. Holm',     race: 5 },
  { home: 'F. Amara',    away: 'B. Eze',       race: 5 },
]

export default function FrameScorecard() {
  const [results, setResults] = useState<GameResult[]>(matchups.map(() => ({ homeWon: null })))
  const [submitted, setSubmitted] = useState(false)
  const [activeMatch, setActiveMatch] = useState(0)
  const [scores, setScores] = useState(matchups.map(m => ({ home: 0, away: 0 })))

  const setScore = (matchIdx: number, side: 'home' | 'away', val: number) => {
    const next = [...scores]
    next[matchIdx] = { ...next[matchIdx], [side]: val }
    setResults(prev => {
      const r = [...prev]
      const race = matchups[matchIdx].race
      const h = side === 'home' ? val : next[matchIdx].home
      const a = side === 'away' ? val : next[matchIdx].away
      r[matchIdx] = { homeWon: h === race ? true : a === race ? false : null }
      return r
    })
    setScores(next)
  }

  const homeWins = results.filter(r => r.homeWon === true).length
  const awayWins = results.filter(r => r.homeWon === false).length
  const allDone = results.every(r => r.homeWon !== null)

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: neutral100, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: felt, padding: '48px 20px 20px', color: '#fff' }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>Score a match · Week 9</p>
        <h1 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Scorecard</h1>

        {/* Team scoreboard */}
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 36, fontWeight: 800, color: '#fff' }}>{homeWins}</p>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Chalk Outlaws</p>
          </div>
          <div style={{ textAlign: 'center', padding: '0 16px' }}>
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>–</p>
            {allDone && (
              <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 600, color: homeWins > awayWins ? '#4ade80' : '#f87171' }}>
                {homeWins > awayWins ? 'Win' : homeWins < awayWins ? 'Loss' : 'Tie'}
              </p>
            )}
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 36, fontWeight: 800, color: '#fff' }}>{awayWins}</p>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Side Pocket Kings</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 90px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Individual matches */}
        {matchups.map((m, i) => {
          const res = results[i]
          const sc = scores[i]
          const isActive = activeMatch === i && !submitted
          const done = res.homeWon !== null

          return (
            <div key={i} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              {/* Match header row */}
              <button onClick={() => setActiveMatch(i)} style={{ width: '100%', background: done ? greenLight : isActive ? '#f0fdf4' : '#fff', border: 'none', cursor: 'pointer', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? green : isActive ? felt : neutral200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: done || isActive ? '#fff' : neutral600, flexShrink: 0 }}>
                  {done ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: res.homeWon === true ? 700 : 500, color: neutral900 }}>{m.home}</span>
                    <span style={{ fontSize: 12, color: neutral600 }}>vs</span>
                    <span style={{ fontSize: 13, fontWeight: res.homeWon === false ? 700 : 500, color: neutral900 }}>{m.away}</span>
                  </div>
                  <span style={{ fontSize: 11, color: neutral600 }}>Race to {m.race}</span>
                </div>
                {done && (
                  <span style={{ fontSize: 15, fontWeight: 800, color: neutral900 }}>{sc.home}–{sc.away}</span>
                )}
                {!done && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={neutral600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isActive ? 'rotate(180deg)' : undefined }}><polyline points="6 9 12 15 18 9"/></svg>
                )}
              </button>

              {/* Score entry */}
              {isActive && !done && (
                <div style={{ padding: '14px', borderTop: `1px solid ${neutral100}` }}>
                  {(['home', 'away'] as const).map(side => (
                    <div key={side} style={{ marginBottom: side === 'home' ? 12 : 0 }}>
                      <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: neutral600 }}>{side === 'home' ? m.home : m.away}</p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {Array.from({ length: m.race + 1 }, (_, n) => (
                          <button key={n} onClick={() => setScore(i, side, n)} style={{
                            width: 36, height: 36, borderRadius: 8, border: `2px solid ${sc[side] === n ? felt : neutral200}`,
                            background: sc[side] === n ? felt : '#fff', color: sc[side] === n ? '#fff' : neutral900,
                            fontSize: 14, fontWeight: 600, cursor: 'pointer',
                          }}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* Submit */}
        {!submitted ? (
          <button onClick={() => setSubmitted(true)} disabled={!allDone} style={{ padding: '14px', background: allDone ? felt : neutral200, color: allDone ? '#fff' : neutral600, border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: allDone ? 'pointer' : 'not-allowed' }}>
            Submit scorecard
          </button>
        ) : (
          <div style={{ background: greenLight, borderRadius: 12, padding: '16px', textAlign: 'center', border: `1.5px solid ${green}` }}>
            <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#065f46' }}>Scorecard submitted</p>
            <p style={{ margin: 0, fontSize: 13, color: green }}>Final: Chalk Outlaws {homeWins} – {awayWins} Side Pocket Kings</p>
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
          <button key={tab.id} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 0', color: tab.id === 'score' ? felt : neutral600 }}>
            {tab.icon}
            <span style={{ fontSize: 11, fontWeight: tab.id === 'score' ? 600 : 400 }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
