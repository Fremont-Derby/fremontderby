import { useState } from 'react'

const felt = '#0f4c2a'
const neutral100 = '#f4f4f5'
const neutral200 = '#e4e4e7'
const neutral600 = '#52525b'
const neutral900 = '#09090b'
const green = '#1a7a4a'
const greenLight = '#e8f5ee'
const red = '#dc2626'
const redLight = '#fee2e2'
const amber = '#f59e0b'
const amberLight = '#fef3c7'

// Match context: T. Nakamura vs D. Ferreira, Race to 7
const RACE = 7
const HOME = 'T. Nakamura'
const AWAY = 'D. Ferreira'
const HOME_TEAM = 'Chalk Outlaws'
const AWAY_TEAM = 'Side Pocket Kings'

type RackWinner = 'home' | 'away'
type Phase = 'scoring' | 'mismatch' | 'reconciled' | 'confirmed' | 'finalized'

// Each rack: which team's player won it
const initRacks: RackWinner[] = ['home', 'home', 'away', 'home', 'away', 'home', 'home']

export default function FrameScorecardLive() {
  const [myRacks, setMyRacks] = useState<RackWinner[]>([])
  const [opponentRacks] = useState<RackWinner[]>(initRacks) // simulated opponent submission
  const [phase, setPhase] = useState<Phase>('scoring')
  const [discipline, setDiscipline] = useState<'8' | '9'>('8')
  const [showOpponent, setShowOpponent] = useState(false)

  const homeScore = myRacks.filter(r => r === 'home').length
  const awayScore = myRacks.filter(r => r === 'away').length
  const isComplete = homeScore === RACE || awayScore === RACE
  const winner = homeScore === RACE ? HOME : awayScore === RACE ? AWAY : null

  const addRack = (winner: RackWinner) => {
    if (isComplete || phase !== 'scoring') return
    const next = [...myRacks, winner]
    setMyRacks(next)
    const h = next.filter(r => r === 'home').length
    const a = next.filter(r => r === 'away').length
    if (h === RACE || a === RACE) {
      // Check if matches opponent
      const oppH = opponentRacks.filter(r => r === 'home').length
      const oppA = opponentRacks.filter(r => r === 'away').length
      if (h === oppH && a === oppA) setPhase('reconciled')
      else setPhase('mismatch')
    }
  }

  const undoRack = () => {
    if (myRacks.length === 0 || phase !== 'scoring') return
    setMyRacks(myRacks.slice(0, -1))
  }

  const rackColor = (i: number, racks: RackWinner[]) => {
    if (i >= racks.length) return neutral100
    return racks[i] === 'home' ? felt : '#374151'
  }

  const rackLabel = (i: number, racks: RackWinner[]) => {
    if (i >= racks.length) return ''
    return racks[i] === 'home' ? HOME.split(' ')[1][0] : AWAY.split(' ')[1][0]
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: '#0a0a0a', height: '100%', display: 'flex', flexDirection: 'column', color: '#fff' }}>
      {/* Header */}
      <div style={{ background: felt, padding: '44px 18px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Match 1 of 3 · Week 9 · Chalk Outlaws vs SPK</span>
        </div>

        {/* Scoreboard */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{HOME}</p>
            <p style={{ margin: '4px 0', fontSize: 52, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{homeScore}</p>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{HOME_TEAM}</p>
          </div>
          <div style={{ textAlign: 'center', padding: '0 8px' }}>
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>–</p>
            <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 600, color: '#4ade80' }}>Race to {RACE}</p>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{AWAY}</p>
            <p style={{ margin: '4px 0', fontSize: 52, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{awayScore}</p>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{AWAY_TEAM}</p>
          </div>
        </div>

        {/* Rack ledger */}
        <div style={{ marginTop: 14, display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center' }}>
          {Array.from({ length: RACE * 2 - 1 }, (_, i) => (
            <div key={i} style={{ width: 28, height: 28, borderRadius: 6, background: rackColor(i, myRacks), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', border: i >= myRacks.length ? '1.5px dashed rgba(255,255,255,0.15)' : 'none' }}>
              {rackLabel(i, myRacks)}
            </div>
          ))}
        </div>

        {/* Discipline badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10, gap: 6 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Opening discipline:</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['8', '9'] as const).map(d => (
              <button key={d} onClick={() => myRacks.length === 0 && setDiscipline(d)} style={{ padding: '2px 9px', borderRadius: 4, border: 'none', cursor: 'pointer', background: discipline === d ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)', color: discipline === d ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600 }}>
                {d}-ball
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {/* Status */}
        {phase === 'scoring' && !isComplete && (
          <div style={{ background: '#1a1a1a', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Rack {myRacks.length + 1} — select who won the rack</span>
          </div>
        )}

        {phase === 'mismatch' && (
          <div style={{ background: '#2d1515', borderRadius: 10, padding: '12px 14px', marginBottom: 14, border: '1px solid #7f1d1d' }}>
            <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#fca5a5' }}>Score mismatch</p>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>Your submission does not match the opponent team. Review the rack history with the other captain and resubmit.</p>
            <button onClick={() => { setMyRacks([]); setPhase('scoring') }} style={{ marginTop: 10, padding: '8px 14px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Start over
            </button>
          </div>
        )}

        {phase === 'reconciled' && (
          <div style={{ background: '#0f2d1a', borderRadius: 10, padding: '12px 14px', marginBottom: 14, border: '1px solid #166534' }}>
            <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#4ade80' }}>Histories match — {winner} wins</p>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>Both teams submitted the same rack history. Confirm to finalize this match.</p>
            <button onClick={() => setPhase('confirmed')} style={{ marginTop: 10, width: '100%', padding: '11px', background: green, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Confirm result
            </button>
          </div>
        )}

        {phase === 'confirmed' && (
          <div style={{ background: '#0f2d1a', borderRadius: 10, padding: '12px 14px', marginBottom: 14, border: '1px solid #166534' }}>
            <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#4ade80' }}>Confirmed by both teams</p>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>Waiting for the match to be finalized. Once both confirmations are recorded, the result is official.</p>
            <button onClick={() => setPhase('finalized')} style={{ marginTop: 10, width: '100%', padding: '11px', background: green, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Finalize match
            </button>
          </div>
        )}

        {phase === 'finalized' && (
          <div style={{ background: '#0f2d1a', borderRadius: 10, padding: '16px', marginBottom: 14, border: '1px solid #166534', textAlign: 'center' }}>
            <p style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#4ade80' }}>Match finalized</p>
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{winner} wins {homeScore}–{awayScore}</p>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Result is official and locked</p>
          </div>
        )}

        {/* Rack entry buttons */}
        {phase === 'scoring' && !isComplete && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <button onClick={() => addRack('home')} style={{ flex: 1, padding: '18px 10px', background: felt, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Rack to</p>
              <p style={{ margin: '4px 0 0', fontSize: 17, fontWeight: 700 }}>{HOME}</p>
            </button>
            <button onClick={() => addRack('away')} style={{ flex: 1, padding: '18px 10px', background: '#374151', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Rack to</p>
              <p style={{ margin: '4px 0 0', fontSize: 17, fontWeight: 700 }}>{AWAY}</p>
            </button>
          </div>
        )}

        {/* Detailed rack history */}
        <div style={{ background: '#1a1a1a', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #2a2a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Rack history — my team</span>
            {myRacks.length > 0 && phase === 'scoring' && (
              <button onClick={undoRack} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.7)', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Undo last</button>
            )}
          </div>
          {myRacks.length === 0 ? (
            <p style={{ padding: '16px 14px', margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>No racks recorded yet</p>
          ) : (
            myRacks.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '9px 14px', borderBottom: i < myRacks.length - 1 ? '1px solid #222' : 'none' }}>
                <span style={{ width: 24, fontSize: 12, color: 'rgba(255,255,255,0.35)', fontVariantNumeric: 'tabular-nums' }}>R{i + 1}</span>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: r === 'home' ? '#4ade80' : '#f87171', marginRight: 10 }} />
                <span style={{ fontSize: 14, color: r === 'home' ? '#fff' : 'rgba(255,255,255,0.65)' }}>{r === 'home' ? HOME : AWAY}</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.3)', fontVariantNumeric: 'tabular-nums' }}>
                  {myRacks.slice(0, i + 1).filter(x => x === 'home').length}–{myRacks.slice(0, i + 1).filter(x => x === 'away').length}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Opponent comparison toggle */}
        {myRacks.length > 0 && (
          <button onClick={() => setShowOpponent(!showOpponent)} style={{ marginTop: 12, width: '100%', padding: '10px', background: '#1a1a1a', color: 'rgba(255,255,255,0.6)', border: '1px solid #2a2a2a', borderRadius: 10, fontSize: 13, cursor: 'pointer' }}>
            {showOpponent ? 'Hide' : 'Show'} opponent submission
          </button>
        )}

        {showOpponent && (
          <div style={{ background: '#1a1a1a', borderRadius: 12, overflow: 'hidden', marginTop: 8 }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #2a2a2a' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Rack history — opponent team</span>
            </div>
            {opponentRacks.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '9px 14px', borderBottom: i < opponentRacks.length - 1 ? '1px solid #222' : 'none' }}>
                <span style={{ width: 24, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>R{i + 1}</span>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: r === 'home' ? '#4ade80' : '#f87171', marginRight: 10 }} />
                <span style={{ fontSize: 14, color: r === 'home' ? '#fff' : 'rgba(255,255,255,0.65)' }}>{r === 'home' ? HOME : AWAY}</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                  {opponentRacks.slice(0, i + 1).filter(x => x === 'home').length}–{opponentRacks.slice(0, i + 1).filter(x => x === 'away').length}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
