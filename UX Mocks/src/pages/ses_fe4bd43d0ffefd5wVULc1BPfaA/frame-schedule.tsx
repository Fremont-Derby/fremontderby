import { useState } from 'react'

const felt = '#0f4c2a'
const greenLight = '#e8f5ee'
const neutral100 = '#f4f4f5'
const neutral200 = '#e4e4e7'
const neutral600 = '#52525b'
const neutral900 = '#09090b'
const green = '#1a7a4a'

type Week = {
  label: string
  date: string
  matches: Match[]
}

type Match = {
  id: number
  home: string
  homeAbbr: string
  homeScore?: number
  away: string
  awayAbbr: string
  awayScore?: number
  time: string
  venue: string
  status: 'completed' | 'upcoming' | 'live'
}

const schedule: Week[] = [
  {
    label: 'Week 9',
    date: 'Aug 21–22',
    matches: [
      { id: 1, home: 'Chalk Outlaws', homeAbbr: 'CO', away: 'Side Pocket Kings', awayAbbr: 'SPK', time: 'Wed 7:00 PM', venue: 'Cue Club', status: 'upcoming' },
      { id: 2, home: 'Break Artists', homeAbbr: 'BA', away: 'Corner Pocket Co.', awayAbbr: 'CPC', time: 'Wed 7:30 PM', venue: 'Rack & Roll', status: 'upcoming' },
      { id: 3, home: 'Straight Shooters', homeAbbr: 'SS', away: 'Eight Ball Wizards', awayAbbr: 'EBW', time: 'Thu 7:00 PM', venue: 'Cue Club', status: 'upcoming' },
      { id: 4, home: 'Rack Pack', homeAbbr: 'RP', away: 'Long Rail Legends', awayAbbr: 'LRL', time: 'Thu 7:30 PM', venue: 'Break Point Bar', status: 'upcoming' },
    ]
  },
  {
    label: 'Week 8',
    date: 'Aug 14–15',
    matches: [
      { id: 5, home: 'Break Artists', homeAbbr: 'BA', homeScore: 7, away: 'Chalk Outlaws', awayAbbr: 'CO', awayScore: 5, time: 'Wed 7:00 PM', venue: 'Cue Club', status: 'completed' },
      { id: 6, home: 'Eight Ball Wizards', homeAbbr: 'EBW', homeScore: 8, away: 'Rack Pack', awayAbbr: 'RP', awayScore: 4, time: 'Wed 7:30 PM', venue: 'Rack & Roll', status: 'completed' },
      { id: 7, home: 'Corner Pocket Co.', homeAbbr: 'CPC', homeScore: 6, away: 'Straight Shooters', awayAbbr: 'SS', awayScore: 6, time: 'Thu 7:00 PM', venue: 'Cue Club', status: 'completed' },
      { id: 8, home: 'Side Pocket Kings', homeAbbr: 'SPK', homeScore: 5, away: 'Long Rail Legends', awayAbbr: 'LRL', awayScore: 7, time: 'Thu 7:30 PM', venue: 'Break Point Bar', status: 'completed' },
    ]
  },
  {
    label: 'Week 7',
    date: 'Aug 7–8',
    matches: [
      { id: 9, home: 'Chalk Outlaws', homeAbbr: 'CO', homeScore: 9, away: 'Long Rail Legends', awayAbbr: 'LRL', awayScore: 3, time: 'Wed 7:00 PM', venue: 'Cue Club', status: 'completed' },
      { id: 10, home: 'Break Artists', homeAbbr: 'BA', homeScore: 7, away: 'Straight Shooters', awayAbbr: 'SS', awayScore: 5, time: 'Wed 7:30 PM', venue: 'Rack & Roll', status: 'completed' },
      { id: 11, home: 'Side Pocket Kings', homeAbbr: 'SPK', homeScore: 4, away: 'Eight Ball Wizards', awayAbbr: 'EBW', awayScore: 8, time: 'Thu 7:00 PM', venue: 'Cue Club', status: 'completed' },
      { id: 12, home: 'Rack Pack', homeAbbr: 'RP', homeScore: 3, away: 'Corner Pocket Co.', awayAbbr: 'CPC', awayScore: 9, time: 'Thu 7:30 PM', venue: 'Break Point Bar', status: 'completed' },
    ]
  }
]

const MY_TEAM = 'Chalk Outlaws'

export default function FrameSchedule() {
  const [filter, setFilter] = useState<'all' | 'my'>('all')
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null)
  const [rescheduleMatch, setRescheduleMatch] = useState<number | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [rescheduleVenue, setRescheduleVenue] = useState('')
  const [rescheduleNote, setRescheduleNote] = useState('')
  const [rescheduleState, setRescheduleState] = useState<'idle' | 'proposed' | 'accepted'>('idle')

  const getFiltered = (matches: Match[]) =>
    filter === 'my' ? matches.filter(m => m.home === MY_TEAM || m.away === MY_TEAM) : matches

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: neutral100, height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ background: felt, padding: '48px 20px 20px', color: '#fff' }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>Metro Billiards League</p>
        <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Schedule</h1>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 3 }}>
          {[{ id: 'all', label: 'All matches' }, { id: 'my', label: 'My team' }].map(v => (
            <button key={v.id} onClick={() => setFilter(v.id as any)} style={{
              flex: 1, padding: '7px 0', border: 'none', cursor: 'pointer', borderRadius: 6,
              background: filter === v.id ? '#fff' : 'transparent',
              color: filter === v.id ? felt : 'rgba(255,255,255,0.7)',
              fontSize: 13, fontWeight: 600,
            }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: '14px 16px 90px' }}>
        {schedule.map((week, wi) => {
          const filtered = getFiltered(week.matches)
          if (filtered.length === 0) return null
          return (
            <div key={week.label} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: neutral900 }}>{week.label}</span>
                  {wi === 0 && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: '#fff', background: green, borderRadius: 4, padding: '2px 7px' }}>Upcoming</span>}
                </div>
                <span style={{ fontSize: 12, color: neutral600 }}>{week.date}</span>
              </div>

              <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {filtered.map((match, mi) => {
                  const isMyMatch = match.home === MY_TEAM || match.away === MY_TEAM
                  const isExpanded = expandedMatch === match.id
                  const homeWon = match.homeScore !== undefined && match.awayScore !== undefined && match.homeScore > match.awayScore
                  const awayWon = match.homeScore !== undefined && match.awayScore !== undefined && match.awayScore > match.homeScore
                  return (
                    <div key={match.id}>
                      <div
                        onClick={() => setExpandedMatch(isExpanded ? null : match.id)}
                        style={{ padding: '12px 14px', background: isMyMatch ? greenLight : '#fff', borderBottom: mi < filtered.length - 1 || isExpanded ? `1px solid ${neutral100}` : 'none', cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {/* Home */}
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: isMyMatch && match.home === MY_TEAM ? felt : neutral200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: isMyMatch && match.home === MY_TEAM ? '#fff' : neutral600, flexShrink: 0 }}>
                              {match.homeAbbr}
                            </div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: match.home === MY_TEAM ? 700 : 500, color: neutral900 }}>{match.home}</p>
                          </div>
                          {/* Score or VS */}
                          <div style={{ textAlign: 'center', minWidth: 56 }}>
                            {match.status === 'completed' ? (
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: 18, fontWeight: 800, color: homeWon ? neutral900 : neutral600 }}>{match.homeScore}</span>
                                <span style={{ fontSize: 12, color: neutral600 }}>–</span>
                                <span style={{ fontSize: 18, fontWeight: 800, color: awayWon ? neutral900 : neutral600 }}>{match.awayScore}</span>
                              </div>
                            ) : (
                              <span style={{ fontSize: 13, fontWeight: 700, color: neutral600 }}>VS</span>
                            )}
                          </div>
                          {/* Away */}
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: match.away === MY_TEAM ? 700 : 500, color: neutral900, textAlign: 'right' }}>{match.away}</p>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: isMyMatch && match.away === MY_TEAM ? felt : neutral200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: isMyMatch && match.away === MY_TEAM ? '#fff' : neutral600, flexShrink: 0 }}>
                              {match.awayAbbr}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={neutral600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          <span style={{ fontSize: 12, color: neutral600 }}>{match.time}</span>
                          <span style={{ fontSize: 12, color: neutral600 }}>·</span>
                          <span style={{ fontSize: 12, color: neutral600 }}>{match.venue}</span>
                        </div>
                      </div>
                      {isExpanded && (
                        <div style={{ padding: '12px 14px', background: '#fafafa', borderBottom: mi < filtered.length - 1 ? `1px solid ${neutral100}` : 'none' }}>
                          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: neutral600 }}>Match details</p>
                          <div style={{ display: 'flex', gap: 12 }}>
                            {[
                              { label: 'Format', val: '8-ball · 9 rack' },
                              { label: 'Division', val: 'Open A' },
                              { label: 'Tables', val: '4 reserved' },
                            ].map(d => (
                              <div key={d.label} style={{ flex: 1, background: '#fff', borderRadius: 8, padding: '8px 10px', border: `1px solid ${neutral200}` }}>
                                <p style={{ margin: 0, fontSize: 11, color: neutral600 }}>{d.label}</p>
                                <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 600, color: neutral900 }}>{d.val}</p>
                              </div>
                            ))}
                          </div>
                          {match.status === 'upcoming' && isMyMatch && (
                            <>
                              {rescheduleMatch !== match.id ? (
                                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                                  <button style={{ flex: 1, padding: '10px', background: felt, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                                    Report score
                                  </button>
                                  <button onClick={() => { setRescheduleMatch(match.id); setRescheduleState('idle') }} style={{ padding: '10px 14px', background: '#fff', color: neutral900, border: `1px solid ${neutral200}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                                    Reschedule
                                  </button>
                                </div>
                              ) : (
                                <div style={{ marginTop: 12, background: '#fff', borderRadius: 10, padding: '14px', border: `1px solid ${neutral200}` }}>
                                  {rescheduleState === 'idle' && (
                                    <>
                                      <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: neutral900 }}>Propose alternate date</p>
                                      <p style={{ margin: '0 0 12px', fontSize: 12, color: neutral600, lineHeight: 1.4 }}>Both captains must accept. The round identity stays the same — only the date, time, and venue change.</p>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                                        <div>
                                          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: neutral600, marginBottom: 4 }}>Proposed date</label>
                                          <input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${neutral200}`, fontSize: 14, boxSizing: 'border-box' }} />
                                        </div>
                                        <div>
                                          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: neutral600, marginBottom: 4 }}>Start time</label>
                                          <input type="time" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${neutral200}`, fontSize: 14, boxSizing: 'border-box' }} />
                                        </div>
                                        <div>
                                          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: neutral600, marginBottom: 4 }}>Venue (leave blank to keep Cue Club)</label>
                                          <input placeholder="Alternate venue…" value={rescheduleVenue} onChange={e => setRescheduleVenue(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${neutral200}`, fontSize: 14, boxSizing: 'border-box' }} />
                                        </div>
                                        <div>
                                          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: neutral600, marginBottom: 4 }}>Note to other captain (optional)</label>
                                          <input placeholder="e.g. venue conflict, player travel…" value={rescheduleNote} onChange={e => setRescheduleNote(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${neutral200}`, fontSize: 14, boxSizing: 'border-box' }} />
                                        </div>
                                      </div>
                                      <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => { if (rescheduleDate) setRescheduleState('proposed') }} disabled={!rescheduleDate} style={{ flex: 1, padding: '10px', background: rescheduleDate ? felt : neutral200, color: rescheduleDate ? '#fff' : neutral600, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: rescheduleDate ? 'pointer' : 'not-allowed' }}>Send proposal</button>
                                        <button onClick={() => setRescheduleMatch(null)} style={{ padding: '10px 14px', background: '#fff', color: neutral600, border: `1px solid ${neutral200}`, borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                                      </div>
                                    </>
                                  )}
                                  {rescheduleState === 'proposed' && (
                                    <div>
                                      <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: neutral900 }}>Proposal sent</p>
                                      <p style={{ margin: '0 0 12px', fontSize: 12, color: neutral600 }}>Waiting for the other captain to accept. Both captains must confirm before the schedule updates.</p>
                                      <div style={{ background: neutral100, borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                                        <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: neutral900 }}>Your proposal</p>
                                        <p style={{ margin: 0, fontSize: 12, color: neutral600 }}>{rescheduleDate}{rescheduleTime ? ' · ' + rescheduleTime : ''}{rescheduleVenue ? ' · ' + rescheduleVenue : ' · Cue Club'}</p>
                                        {rescheduleNote && <p style={{ margin: '4px 0 0', fontSize: 12, color: neutral600, fontStyle: 'italic' }}>"{rescheduleNote}"</p>}
                                      </div>
                                      <button onClick={() => setRescheduleState('accepted')} style={{ width: '100%', padding: '10px', background: '#fff', color: neutral900, border: `1px solid ${neutral200}`, borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                                        Simulate: other captain accepts
                                      </button>
                                    </div>
                                  )}
                                  {rescheduleState === 'accepted' && (
                                    <div style={{ textAlign: 'center' }}>
                                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                      </div>
                                      <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#065f46' }}>Rescheduled</p>
                                      <p style={{ margin: 0, fontSize: 12, color: green }}>Both captains confirmed. Schedule updated.</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                          {match.status === 'upcoming' && !isMyMatch && (
                            <button style={{ marginTop: 10, width: '100%', padding: '10px', background: felt, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                              Report score
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: `1px solid ${neutral200}`, display: 'flex', padding: '8px 0 20px' }}>
        {[
          { id: 'home', label: 'Home', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
          { id: 'standings', label: 'Standings', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
          { id: 'schedule', label: 'Schedule', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
          { id: 'players', label: 'Players', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
        ].map(tab => (
          <button key={tab.id} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 0', color: tab.id === 'schedule' ? felt : neutral600 }}>
            {tab.icon}
            <span style={{ fontSize: 11, fontWeight: tab.id === 'schedule' ? 600 : 400 }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
