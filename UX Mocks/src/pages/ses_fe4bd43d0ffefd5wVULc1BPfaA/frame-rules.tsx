import { useState } from 'react'

const felt = '#0f4c2a'
const neutral100 = '#f4f4f5'
const neutral200 = '#e4e4e7'
const neutral600 = '#52525b'
const neutral900 = '#09090b'
const green = '#1a7a4a'
const greenLight = '#e8f5ee'

type Section = { id: string; title: string; content: { heading?: string; body: string }[] }

const sections: Section[] = [
  {
    id: 'format',
    title: 'League format',
    content: [
      { heading: 'Season structure', body: '8 teams. 7-round single round robin — every team plays every other team exactly once. Remaining calendar weeks are reserved for flexibility, makeup dates, and postseason.' },
      { heading: 'Match format', body: 'Each team matchup produces 3 individual player matches. Captains submit an ordered 3-player blind lineup before each match night. Opponent order stays hidden until both teams submit.' },
      { heading: 'Postseason', body: 'Top 4 teams by regular-season record advance to playoffs. Postseason uses a 4-player lineup with an anchor designation (slot 4). Anchor is revealed after both lineups are locked.' },
      { heading: 'Win/loss', body: 'Regular-season team matchups resolve to win or loss — never a draw. The team winning 2 of 3 individual matches wins the team matchup.' },
    ],
  },
  {
    id: 'scoring',
    title: 'Scoring',
    content: [
      { heading: 'Race format', body: 'Individual matches are races. Regular season uses race to 7 (open division). Postseason uses race to 9. Race length may be adjusted by the league director for specific match contexts.' },
      { heading: 'Discipline', body: 'Rounds 1–3 open with 8-ball; Rounds 4–7 open with 9-ball. Within an individual match, the opening discipline alternates from rack 4 onward (R1–R3 use opening discipline, R4+ use the other).' },
      { heading: 'Dual scoring', body: 'Each team owns and submits their own rack history independently. Both histories must reconcile exactly before a result is official. Both teams must confirm before the match is finalized.' },
      { heading: 'Corrections', body: 'Score corrections after finalization require league admin authorization. Normal players cannot modify a finalized result.' },
    ],
  },
  {
    id: 'rosters',
    title: 'Rosters & eligibility',
    content: [
      { heading: 'Roster size', body: 'No fixed roster cap. Teams may carry as many players as they like. Opening-night readiness requires at least 4 registered, paid players.' },
      { heading: 'Multi-team membership', body: 'A player may belong to more than one team. When both of their teams meet in a matchup, the player must choose one team to represent — they cannot appear on both sides.' },
      { heading: 'Free agents and subs', body: 'Players without a team can register as free agents, compete in individual standings, and sub for teams that need additional players. Subs must be registered for the season.' },
      { heading: 'Seven-match cap', body: 'No player may appear in the same team matchup more than once across the season. Free agents and subs are subject to the same cap rules.' },
      { heading: 'Captain', body: 'Each team must have a designated captain with a private contact phone on file. Captains submit lineups and authorize score submissions.' },
    ],
  },
  {
    id: 'entry',
    title: 'Entry & payment',
    content: [
      { heading: 'Individual entry', body: '$40 per player. Due before Week 1. Pay at the venue to the league director. Players who have not paid are ineligible to compete until payment is confirmed.' },
      { heading: 'Team entry', body: '$80 per team. Due before Week 1. Captains are responsible for confirming their team entry payment.' },
      { heading: 'Prize pool', body: 'The prize pool is split 45% team prizes and 55% individual prizes. Team prizes are awarded to 1st and 2nd place. Individual prizes are awarded to the top finishers in individual standings. See the Prizes page for the current season breakdown.' },
      { heading: 'Minimum matches', body: 'A player must play at least 6 individual matches to be eligible for individual prize payouts.' },
    ],
  },
  {
    id: 'conduct',
    title: 'Conduct',
    content: [
      { heading: 'Sportsmanship', body: 'Players are expected to conduct themselves professionally at all times. Disputes about rack outcomes should be resolved between the players directly before the rack is recorded.' },
      { heading: 'Disputes', body: 'If players cannot agree on a rack outcome, the captain of each team must be involved before any score is entered. The league director has final authority on disputed results.' },
      { heading: 'Communication', body: 'In-app messaging is provided to replace group texts. Personal contact information (phone numbers) is never shared publicly through the app.' },
      { heading: 'Reporting', body: 'Players may report abusive or inappropriate messages through the in-app reporting system. Reports are reviewed by the league moderator. Repeat violations may result in suspension.' },
    ],
  },
  {
    id: 'postseason',
    title: 'Postseason rules',
    content: [
      { heading: 'Qualification', body: 'Top 4 teams by regular-season win percentage advance to playoffs. Tiebreakers: head-to-head record, then total individual match wins.' },
      { heading: 'Bracket', body: 'Seed 1 vs Seed 4, Seed 2 vs Seed 3 in the semifinals. Winners meet in the championship. Single elimination.' },
      { heading: 'Postseason lineup', body: 'Captains submit a 4-player lineup and designate one player as the anchor (slot 4). The anchor designation stays hidden until both teams submit.' },
      { heading: 'Postseason race', body: 'All postseason individual matches use race to 9.' },
      { heading: 'Substitutions', body: 'Postseason rosters are locked at the end of the regular season. No subs may be added after the roster lock date.' },
    ],
  },
]

export default function FrameRules() {
  const [activeSection, setActiveSection] = useState('format')
  const [expanded, setExpanded] = useState<string | null>('Season structure')

  const section = sections.find(s => s.id === activeSection)!

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: neutral100, height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ background: felt, padding: '48px 20px 0', color: '#fff' }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>Metro Billiards League · Season 2026</p>
        <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Rules</h1>

        {/* Section tabs — horizontal scroll */}
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto', paddingBottom: 0, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => { setActiveSection(s.id); setExpanded(null) }} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', background: 'transparent', color: activeSection === s.id ? '#fff' : 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: activeSection === s.id ? 700 : 400, borderBottom: activeSection === s.id ? '2px solid #4ade80' : '2px solid transparent', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {s.title}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 90px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {section.content.map((item, i) => {
          const isOpen = expanded === item.heading
          return (
            <div key={i} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <button onClick={() => setExpanded(isOpen ? null : (item.heading || null))} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 16px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
                {item.heading && (
                  <>
                    <div style={{ width: 4, height: 20, borderRadius: 2, background: isOpen ? green : neutral200, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: neutral900 }}>{item.heading}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={neutral600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : undefined, flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
                  </>
                )}
              </button>
              {(isOpen || !item.heading) && (
                <div style={{ padding: item.heading ? '0 16px 16px 28px' : '14px 16px', borderTop: item.heading ? `1px solid ${neutral100}` : 'none' }}>
                  <p style={{ margin: 0, fontSize: 14, color: neutral600, lineHeight: 1.6 }}>{item.body}</p>
                </div>
              )}
            </div>
          )
        })}

        {/* Version notice */}
        <div style={{ background: greenLight, borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p style={{ margin: 0, fontSize: 13, color: green, lineHeight: 1.4 }}>These rules apply to Season 2026. The league director may issue amendments. Changes are announced in the Notices feed.</p>
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: `1px solid ${neutral200}`, display: 'flex', padding: '8px 0 20px' }}>
        {[
          { id: 'home', label: 'Home', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
          { id: 'standings', label: 'Standings', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
          { id: 'prizes', label: 'Prizes', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg> },
          { id: 'profile', label: 'Profile', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
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
