import { useState } from 'react'

// NOTE: /trades was retired in PR #447. Formal player-for-player trade
// HTTP entry points return 404 in production. Roster changes now use
// team membership requests, invitations, and captain roster management
// (see frame-team-join.tsx). This frame is preserved as a historical
// reference for the old trade UI pattern only.

const felt = '#0f4c2a'
const neutral100 = '#f4f4f5'
const neutral200 = '#e4e4e7'
const neutral600 = '#52525b'
const neutral900 = '#09090b'
const green = '#1a7a4a'
const greenLight = '#e8f5ee'
const amber = '#f59e0b'
const amberLight = '#fef3c7'

type TradeStatus = 'pending' | 'accepted' | 'rejected'

type Trade = {
  id: number
  fromTeam: string
  fromPlayer: string
  toTeam: string
  toPlayer: string
  status: TradeStatus
  initiatedBy: string
  date: string
  accepts: string[]  // names who have accepted
  required: string[] // names who must accept
}

const myTrades: Trade[] = [
  {
    id: 1,
    fromTeam: 'Chalk Outlaws',
    fromPlayer: 'M. Torres',
    toTeam: 'Side Pocket Kings',
    toPlayer: 'R. Vidal',
    status: 'pending',
    initiatedBy: 'T. Nakamura',
    date: 'Aug 18',
    accepts: ['T. Nakamura', 'R. Vidal'],
    required: ['T. Nakamura', 'M. Torres', 'K. Webb (SPK cap)', 'R. Vidal'],
  },
]

const leagueTrades: Trade[] = [
  {
    id: 2,
    fromTeam: 'Break Artists',
    fromPlayer: 'G. Santos',
    toTeam: 'Eight Ball Wizards',
    toPlayer: 'H. Müller',
    status: 'accepted',
    initiatedBy: 'D. Morales',
    date: 'Aug 15',
    accepts: ['D. Morales', 'G. Santos', 'R. Okafor', 'H. Müller'],
    required: ['D. Morales', 'G. Santos', 'R. Okafor', 'H. Müller'],
  },
]

const allTeams = ['Chalk Outlaws', 'Side Pocket Kings', 'Break Artists', 'Eight Ball Wizards', 'Corner Pocket Co.', 'Straight Shooters']
const myNonCaptainPlayers = ['C. Burrows', 'P. Singh', 'M. Torres', 'F. Amara']
const otherTeamPlayers: Record<string, string[]> = {
  'Side Pocket Kings': ['R. Vidal', 'N. Dube', 'L. Park'],
  'Break Artists': ['G. Santos', 'S. Petrov'],
  'Eight Ball Wizards': ['H. Müller', 'A. Chen'],
  'Corner Pocket Co.': ['M. Delgado', 'O. Svensson'],
  'Straight Shooters': ['J. Williams', 'P. Russo'],
}

const statusBadge = (s: TradeStatus) => {
  if (s === 'accepted') return { label: 'Completed', color: green, bg: greenLight }
  if (s === 'rejected') return { label: 'Rejected', color: '#991b1b', bg: '#fee2e2' }
  return { label: 'Pending', color: '#92400e', bg: amberLight }
}

export default function FrameTrades() {
  const [proposeOpen, setProposeOpen] = useState(false)
  const [myTeamPlayer, setMyTeamPlayer] = useState('')
  const [otherTeam, setOtherTeam] = useState('')
  const [otherPlayer, setOtherPlayer] = useState('')
  const [proposed, setProposed] = useState(false)

  const canPropose = myTeamPlayer && otherTeam && otherPlayer

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: neutral100, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: felt, padding: '48px 20px 20px', color: '#fff' }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>Metro Billiards League</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Trades</h1>
          <button onClick={() => { setProposeOpen(!proposeOpen); setProposed(false) }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {proposeOpen ? 'Cancel' : 'Propose trade'}
          </button>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Player-for-player swaps. Both players + both captains must accept. Captains cannot be traded.</p>
      </div>

      <div style={{ padding: '16px 16px 90px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Propose form */}
        {proposeOpen && !proposed && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: neutral900 }}>New trade proposal</p>

            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: neutral600, marginBottom: 6 }}>Your player (non-captain)</label>
            <select value={myTeamPlayer} onChange={e => setMyTeamPlayer(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${neutral200}`, fontSize: 14, color: neutral900, marginBottom: 12, background: '#fff' }}>
              <option value="">Select player…</option>
              {myNonCaptainPlayers.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: neutral600, marginBottom: 6 }}>Other team</label>
            <select value={otherTeam} onChange={e => { setOtherTeam(e.target.value); setOtherPlayer('') }} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${neutral200}`, fontSize: 14, color: neutral900, marginBottom: 12, background: '#fff' }}>
              <option value="">Select team…</option>
              {allTeams.filter(t => t !== 'Chalk Outlaws').map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: neutral600, marginBottom: 6 }}>Their player (non-captain)</label>
            <select value={otherPlayer} onChange={e => setOtherPlayer(e.target.value)} disabled={!otherTeam} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${neutral200}`, fontSize: 14, color: neutral900, marginBottom: 16, background: '#fff', opacity: otherTeam ? 1 : 0.5 }}>
              <option value="">Select player…</option>
              {otherTeam && (otherTeamPlayers[otherTeam] || []).map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {canPropose && (
              <div style={{ background: neutral100, borderRadius: 10, padding: '12px', marginBottom: 14 }}>
                <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: neutral600 }}>Trade summary</p>
                <p style={{ margin: 0, fontSize: 14, color: neutral900 }}>
                  <strong>Chalk Outlaws</strong> sends <strong>{myTeamPlayer}</strong>{' '}
                  for <strong>{otherPlayer}</strong> from <strong>{otherTeam}</strong>
                </p>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: neutral600 }}>Requires 4 acceptances: both players + both captains</p>
              </div>
            )}

            <button onClick={() => setProposed(true)} disabled={!canPropose} style={{ width: '100%', padding: '12px', background: canPropose ? felt : neutral200, color: canPropose ? '#fff' : neutral600, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: canPropose ? 'pointer' : 'not-allowed' }}>
              Send proposal
            </button>
          </div>
        )}

        {proposed && (
          <div style={{ background: greenLight, borderRadius: 12, padding: '16px', border: `1.5px solid ${green}`, textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#065f46' }}>Trade proposed</p>
            <p style={{ margin: 0, fontSize: 13, color: green }}>All four parties have been notified and must accept.</p>
          </div>
        )}

        {/* My trades */}
        <div>
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', color: neutral600, textTransform: 'uppercase' }}>My trades</p>
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            {myTrades.map((t, i) => {
              const badge = statusBadge(t.status)
              return (
                <div key={t.id} style={{ padding: '14px 16px', borderBottom: i < myTrades.length - 1 ? `1px solid ${neutral100}` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: neutral900 }}>{t.fromPlayer}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={neutral600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        <span style={{ fontSize: 14, fontWeight: 700, color: neutral900 }}>{t.toPlayer}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: neutral600 }}>{t.fromTeam} ↔ {t.toTeam} · {t.date}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: badge.color, background: badge.bg, padding: '3px 9px', borderRadius: 99, whiteSpace: 'nowrap' }}>{badge.label}</span>
                  </div>
                  {/* Acceptance tracker */}
                  <div>
                    <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: neutral600 }}>Acceptances ({t.accepts.length}/{t.required.length})</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {t.required.map(name => {
                        const accepted = t.accepts.includes(name)
                        return (
                          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 18, height: 18, borderRadius: '50%', background: accepted ? green : neutral200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {accepted && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                            </div>
                            <span style={{ fontSize: 13, color: accepted ? neutral900 : neutral600 }}>{name}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  {/* Action button for my player */}
                  {t.status === 'pending' && !t.accepts.includes('M. Torres') && (
                    <button style={{ marginTop: 12, width: '100%', padding: '10px', background: felt, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Accept as M. Torres
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* League-wide recent trades */}
        <div>
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', color: neutral600, textTransform: 'uppercase' }}>Recent league trades</p>
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            {leagueTrades.map((t, i) => {
              const badge = statusBadge(t.status)
              return (
                <div key={t.id} style={{ padding: '14px 16px', borderBottom: i < leagueTrades.length - 1 ? `1px solid ${neutral100}` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: neutral900 }}>{t.fromPlayer}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={neutral600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        <span style={{ fontSize: 14, fontWeight: 600, color: neutral900 }}>{t.toPlayer}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: neutral600 }}>{t.fromTeam} ↔ {t.toTeam} · {t.date}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: badge.color, background: badge.bg, padding: '3px 9px', borderRadius: 99, whiteSpace: 'nowrap' }}>{badge.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
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
          <button key={tab.id} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 0', color: tab.id === 'more' ? felt : neutral600 }}>
            {tab.icon}
            <span style={{ fontSize: 11, fontWeight: tab.id === 'more' ? 600 : 400 }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
