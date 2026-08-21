import { useState } from 'react'

const felt = '#0f4c2a'
const neutral100 = '#f4f4f5'
const neutral200 = '#e4e4e7'
const neutral600 = '#52525b'
const neutral900 = '#09090b'
const green = '#1a7a4a'
const greenLight = '#e8f5ee'
const amber = '#f59e0b'

const ENTRY_FEE = 40
const TEAM_ENTRY = 80
const TOTAL_PLAYERS = 24
const ADMIN_PCT = 0.10

const totalPool = TOTAL_PLAYERS * ENTRY_FEE + 8 * TEAM_ENTRY
const adminCut = totalPool * ADMIN_PCT
const prizePool = totalPool - adminCut
const teamPool = prizePool * 0.45
const individualPool = prizePool * 0.55

const teamPayouts = [
  { place: '1st', pct: 60, amount: Math.round(teamPool * 0.60) },
  { place: '2nd', pct: 40, amount: Math.round(teamPool * 0.40) },
]

const individualPayouts = [
  { place: '1st', pct: 40, amount: Math.round(individualPool * 0.40) },
  { place: '2nd', pct: 25, amount: Math.round(individualPool * 0.25) },
  { place: '3rd', pct: 15, amount: Math.round(individualPool * 0.15) },
  { place: '4th', pct: 10, amount: Math.round(individualPool * 0.10) },
  { place: '5th–8th', pct: 10, amount: Math.round(individualPool * 0.10) },
]

const myProjected = {
  team: { place: '2nd', amount: teamPayouts[1].amount, share: '1/5 of team payout' },
  individual: { place: '2nd', amount: individualPayouts[1].amount, eligible: true },
}

const leaderboard = [
  { rank: 1, name: 'D. Morales', team: 'Break Artists',      wins: 16, pts: 48, pct: 71.4, eligible: true },
  { rank: 2, name: 'T. Nakamura', team: 'Chalk Outlaws',     wins: 14, pts: 44, pct: 62.5, eligible: true },
  { rank: 3, name: 'R. Okafor',  team: 'Eight Ball Wizards', wins: 13, pts: 41, pct: 59.1, eligible: true },
  { rank: 4, name: 'S. Petrov',  team: 'Break Artists',      wins: 13, pts: 40, pct: 57.8, eligible: true },
  { rank: 5, name: 'M. Delgado', team: 'Corner Pocket Co.',  wins: 12, pts: 38, pct: 54.5, eligible: true },
]

export default function FramePrizes() {
  const [tab, setTab] = useState<'pool' | 'individual' | 'team'>('pool')

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: neutral100, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: felt, padding: '48px 20px 20px', color: '#fff' }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>Metro Billiards League · 2026</p>
        <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Prizes</h1>
        {/* Pool summary */}
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ display: 'flex', gap: 0 }}>
            {[
              { label: 'Total pool', val: `$${totalPool.toLocaleString()}` },
              { label: 'Team prizes', val: `$${Math.round(teamPool).toLocaleString()}` },
              { label: 'Individual', val: `$${Math.round(individualPool).toLocaleString()}` },
            ].map((s, i) => (
              <div key={s.label} style={{ flex: 1, textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.12)' : 'none' }}>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff' }}>{s.val}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginTop: 16 }}>
          {[{ id: 'pool', label: 'Pool breakdown' }, { id: 'individual', label: 'Individual' }, { id: 'team', label: 'Team' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} style={{
              flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', background: 'transparent',
              color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.5)',
              fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
              borderBottom: tab === t.id ? '2px solid #4ade80' : '2px solid transparent',
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 90px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {tab === 'pool' && (
          <>
            {/* My projected earnings */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: `1.5px solid ${felt}` }}>
              <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Your projected earnings</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, background: greenLight, borderRadius: 10, padding: '12px' }}>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: green }}>${myProjected.individual.amount}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: green, fontWeight: 500 }}>Individual · {myProjected.individual.place}</p>
                </div>
                <div style={{ flex: 1, background: neutral100, borderRadius: 10, padding: '12px' }}>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: neutral900 }}>${Math.round(myProjected.team.amount / 5)}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: neutral600 }}>Team share · {myProjected.team.share}</p>
                </div>
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 11, color: neutral600 }}>Based on current standings. Standings can change through week 12.</p>
            </div>

            {/* Fee breakdown */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Pool breakdown</p>
              {[
                { label: `${TOTAL_PLAYERS} player entries × $${ENTRY_FEE}`, val: `$${TOTAL_PLAYERS * ENTRY_FEE}` },
                { label: '8 team entries × $80', val: `$${8 * TEAM_ENTRY}` },
                { label: 'Administration (10%)', val: `-$${Math.round(adminCut)}`, dim: true },
                { label: 'Prize pool', val: `$${Math.round(prizePool)}`, bold: true },
                { label: 'Team prizes (45%)', val: `$${Math.round(teamPool)}` },
                { label: 'Individual prizes (55%)', val: `$${Math.round(individualPool)}` },
              ].map((row, i, arr) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < arr.length - 1 ? `1px solid ${neutral100}` : 'none', borderTop: row.bold ? `1px solid ${neutral200}` : 'none', marginTop: row.bold ? 4 : 0 }}>
                  <span style={{ fontSize: 13, color: row.dim ? neutral600 : neutral900, fontWeight: row.bold ? 700 : 400 }}>{row.label}</span>
                  <span style={{ fontSize: 14, fontWeight: row.bold ? 800 : 600, color: row.dim ? '#dc2626' : row.bold ? neutral900 : neutral900 }}>{row.val}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'individual' && (
          <>
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Payout structure</p>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: neutral600 }}>Based on final individual standings. Minimum 6 matches to be eligible.</p>
              {individualPayouts.map((p, i) => (
                <div key={p.place} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < individualPayouts.length - 1 ? `1px solid ${neutral100}` : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: i === 0 ? '#fef9c3' : i === 1 ? neutral100 : neutral100, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? amber : neutral600 }}>{p.place}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 6, borderRadius: 99, background: neutral100, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${p.pct}%`, background: i === 0 ? amber : i === 1 ? felt : neutral600, borderRadius: 99 }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 800, color: neutral900 }}>${p.amount}</span>
                </div>
              ))}
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Current prize race</p>
              {leaderboard.map((p, i) => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < leaderboard.length - 1 ? `1px solid ${neutral100}` : 'none' }}>
                  <span style={{ width: 22, fontSize: 13, fontWeight: 700, color: i < 3 ? '#b45309' : neutral600 }}>{p.rank}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: p.name === 'T. Nakamura' ? 700 : 500, color: neutral900 }}>{p.name}</p>
                    <p style={{ margin: '1px 0 0', fontSize: 11, color: neutral600 }}>{p.team}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: neutral900 }}>{p.pts} pts</p>
                    <p style={{ margin: '1px 0 0', fontSize: 11, color: p.eligible ? green : '#dc2626', fontWeight: 500 }}>{p.eligible ? 'Eligible' : 'Ineligible'}</p>
                  </div>
                  {i < individualPayouts.length && (
                    <span style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? amber : neutral900, width: 44, textAlign: 'right' }}>${individualPayouts[i].amount}</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'team' && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Team payouts</p>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: neutral600 }}>Split equally among all rostered players on winning team.</p>
            {teamPayouts.map((p, i) => (
              <div key={p.place} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: i < teamPayouts.length - 1 ? `1px solid ${neutral100}` : 'none' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: i === 0 ? '#fef9c3' : neutral100, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: i === 0 ? amber : neutral600 }}>{p.place}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: neutral900 }}>${p.amount}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: neutral600 }}>≈ ${Math.round(p.amount / 5)} per player (5-person roster)</p>
                </div>
                <div style={{ height: 44, width: 6, borderRadius: 99, background: i === 0 ? amber : neutral200 }} />
              </div>
            ))}
            <div style={{ marginTop: 14, padding: '12px', background: neutral100, borderRadius: 10 }}>
              <p style={{ margin: 0, fontSize: 13, color: neutral600 }}>Payouts are finalized by the league admin after the championship. Collected in person at the venue.</p>
            </div>
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
          <button key={tab.id} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 0', color: neutral600 }}>
            {tab.icon}
            <span style={{ fontSize: 11 }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
