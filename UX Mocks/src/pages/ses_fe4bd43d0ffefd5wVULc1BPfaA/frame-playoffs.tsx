import { useState } from 'react'

const felt = '#0f4c2a'
const neutral100 = '#f4f4f5'
const neutral200 = '#e4e4e7'
const neutral600 = '#52525b'
const neutral900 = '#09090b'
const green = '#1a7a4a'
const greenLight = '#e8f5ee'
const amber = '#f59e0b'

type MatchNode = {
  home: string
  homeRecord?: string
  away: string
  awayRecord?: string
  homeScore?: number
  awayScore?: number
  status: 'completed' | 'upcoming' | 'tbd'
  date?: string
  winner?: string
}

const semis: MatchNode[] = [
  {
    home: 'Break Artists',      homeRecord: '7–1',
    away: 'Chalk Outlaws',      awayRecord: '5–3',
    homeScore: undefined, awayScore: undefined,
    status: 'upcoming', date: 'Sep 4',
    winner: undefined,
  },
  {
    home: 'Eight Ball Wizards', homeRecord: '6–2',
    away: 'Corner Pocket Co.',  awayRecord: '6–2',
    homeScore: undefined, awayScore: undefined,
    status: 'upcoming', date: 'Sep 4',
    winner: undefined,
  },
]

const championship: MatchNode = {
  home: 'TBD', away: 'TBD',
  status: 'tbd', date: 'Sep 11',
}

const MY_TEAM = 'Chalk Outlaws'

function TeamRow({ name, record, score, isWinner, isMyTeam }: { name: string; record?: string; score?: number; isWinner?: boolean; isMyTeam?: boolean }) {
  const tbd = name === 'TBD'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: isWinner ? greenLight : '#fff' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: isMyTeam ? felt : tbd ? neutral100 : neutral200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: isMyTeam ? '#fff' : neutral600, flexShrink: 0 }}>
        {tbd ? '?' : name.split(' ').map(w => w[0]).join('').slice(0, 2)}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: isMyTeam ? 700 : 500, color: tbd ? neutral600 : neutral900 }}>{name}</p>
        {record && <p style={{ margin: 0, fontSize: 11, color: neutral600 }}>{record}</p>}
      </div>
      {score !== undefined && (
        <span style={{ fontSize: 20, fontWeight: 800, color: isWinner ? green : neutral600 }}>{score}</span>
      )}
    </div>
  )
}

function BracketMatch({ match, label }: { match: MatchNode; label: string }) {
  const isMyMatch = match.home === MY_TEAM || match.away === MY_TEAM
  const homeWon = match.homeScore !== undefined && match.awayScore !== undefined && match.homeScore > match.awayScore
  const awayWon = match.homeScore !== undefined && match.awayScore !== undefined && match.awayScore > match.homeScore

  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: neutral600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
        {match.date && <span style={{ fontSize: 11, color: neutral600 }}>Sep {match.date.replace('Sep ', '')}</span>}
        {match.status === 'upcoming' && <span style={{ fontSize: 11, fontWeight: 600, color: green, background: greenLight, padding: '2px 7px', borderRadius: 99 }}>Upcoming</span>}
        {match.status === 'tbd' && <span style={{ fontSize: 11, color: neutral600 }}>TBD</span>}
      </div>
      <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: isMyMatch ? `0 0 0 2px ${felt}` : '0 1px 4px rgba(0,0,0,0.08)', border: isMyMatch ? `2px solid ${felt}` : 'none' }}>
        <TeamRow name={match.home} record={match.homeRecord} score={match.homeScore} isWinner={homeWon} isMyTeam={match.home === MY_TEAM} />
        <div style={{ height: 1, background: neutral100 }} />
        <TeamRow name={match.away} record={match.awayRecord} score={match.awayScore} isWinner={awayWon} isMyTeam={match.away === MY_TEAM} />
      </div>
    </div>
  )
}

export default function FramePlayoffs() {
  const [view, setView] = useState<'bracket' | 'info'>('bracket')

  const standingsTop4 = [
    { rank: 1, name: 'Break Artists',      record: '7–1', seed: 1 },
    { rank: 2, name: 'Eight Ball Wizards', record: '6–2', seed: 2 },
    { rank: 3, name: 'Corner Pocket Co.',  record: '6–2', seed: 3 },
    { rank: 4, name: 'Chalk Outlaws',      record: '5–3', seed: 4 },
  ]

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: neutral100, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: felt, padding: '48px 20px 20px', color: '#fff' }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>Metro Billiards League · 2026</p>
        <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Playoffs</h1>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 3 }}>
          {[{ id: 'bracket', label: 'Bracket' }, { id: 'info', label: 'Format & rosters' }].map(v => (
            <button key={v.id} onClick={() => setView(v.id as any)} style={{
              flex: 1, padding: '7px 0', border: 'none', cursor: 'pointer', borderRadius: 6,
              background: view === v.id ? '#fff' : 'transparent',
              color: view === v.id ? felt : 'rgba(255,255,255,0.7)',
              fontSize: 13, fontWeight: 600,
            }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'bracket' && (
        <div style={{ padding: '16px 16px 90px' }}>
          {/* Bracket legend */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 14, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: felt }} />
              <span style={{ fontSize: 11, color: neutral600 }}>Your team</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: neutral200 }} />
              <span style={{ fontSize: 11, color: neutral600 }}>Other team</span>
            </div>
          </div>

          {/* Semifinals */}
          <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: neutral900 }}>Semifinals — Sep 4</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            <BracketMatch match={semis[0]} label="SF1 · 1 vs 4" />
            <BracketMatch match={semis[1]} label="SF2 · 2 vs 3" />
          </div>

          {/* Connector arrow */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 1, height: 20, background: neutral200 }} />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={neutral600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              <span style={{ fontSize: 11, color: neutral600, fontWeight: 600 }}>Winners advance</span>
            </div>
          </div>

          {/* Championship */}
          <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: neutral900 }}>Championship — Sep 11</p>
          <BracketMatch match={championship} label="Final" />

          {/* Prize callout */}
          <div style={{ marginTop: 16, background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={amber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: neutral900 }}>Team prize pool</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: neutral600 }}>1st place · 2nd place payouts — see Prizes tab</p>
            </div>
          </div>
        </div>
      )}

      {view === 'info' && (
        <div style={{ padding: '16px 16px 90px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Format */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Postseason format</p>
            {[
              { label: 'Qualification', val: 'Top 4 teams by regular season record' },
              { label: 'Structure', val: 'Single elimination — semis then championship' },
              { label: 'Lineup', val: '4 players per team + 1 anchor designation' },
              { label: 'Anchor rule', val: 'Anchor plays slot 4; revealed after both lineups lock' },
              { label: 'Race', val: 'Race to 9 (all postseason matches)' },
              { label: 'Subs', val: 'Registered 4-player roster only — no subs' },
            ].map((row, i, arr) => (
              <div key={row.label} style={{ display: 'flex', padding: '9px 0', borderBottom: i < arr.length - 1 ? `1px solid ${neutral100}` : 'none', gap: 12 }}>
                <span style={{ flex: '0 0 130px', fontSize: 13, fontWeight: 600, color: neutral600 }}>{row.label}</span>
                <span style={{ flex: 1, fontSize: 13, color: neutral900 }}>{row.val}</span>
              </div>
            ))}
          </div>

          {/* Qualified teams */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Qualified teams</p>
            {standingsTop4.map((t, i) => (
              <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < standingsTop4.length - 1 ? `1px solid ${neutral100}` : 'none' }}>
                <span style={{ width: 22, fontSize: 13, fontWeight: 700, color: neutral600 }}>#{t.seed}</span>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: t.name === MY_TEAM ? felt : neutral200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: t.name === MY_TEAM ? '#fff' : neutral600, flexShrink: 0 }}>
                  {t.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <span style={{ flex: 1, fontSize: 14, fontWeight: t.name === MY_TEAM ? 700 : 500, color: neutral900 }}>{t.name}</span>
                <span style={{ fontSize: 13, color: neutral600 }}>{t.record}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
