import { useState } from 'react'

const felt = '#0f4c2a'
const neutral100 = '#f4f4f5'
const neutral200 = '#e4e4e7'
const neutral600 = '#52525b'
const neutral900 = '#09090b'
const green = '#1a7a4a'
const greenLight = '#e8f5ee'

type Thread = { id: string; name: string; kind: 'team' | 'league' | 'direct'; lastMsg: string; time: string; unread: number; initials: string }
type Message = { from: string; text: string; time: string; mine: boolean }

const threads: Thread[] = [
  { id: 'co',     name: 'Chalk Outlaws',     kind: 'team',   lastMsg: 'T. Nakamura: Lineup is set for Wednesday', time: '1h',  unread: 0, initials: 'CO' },
  { id: 'league', name: 'League announcements', kind: 'league', lastMsg: 'Admin: Week 9 schedule confirmed', time: '3h',  unread: 1, initials: 'MBL' },
  { id: 'dm-ro',  name: 'R. Okafor',         kind: 'direct', lastMsg: 'See you Wednesday!',              time: '1d',  unread: 0, initials: 'RO' },
  { id: 'dm-md',  name: 'M. Delgado',        kind: 'direct', lastMsg: 'Good match last week',            time: '3d',  unread: 2, initials: 'MD' },
  { id: 'dm-jw',  name: 'J. Williams',       kind: 'direct', lastMsg: 'Any sub spots open?',             time: '5d',  unread: 0, initials: 'JW' },
]

const conversationMap: Record<string, Message[]> = {
  'co': [
    { from: 'C. Burrows', text: 'Who\'s available Wednesday?', time: '10:00 AM', mine: false },
    { from: 'P. Singh', text: 'I\'m in', time: '10:04 AM', mine: false },
    { from: 'Me', text: 'All confirmed — lineup is set', time: '10:08 AM', mine: true },
    { from: 'M. Torres', text: 'I have a conflict, can\'t make it', time: '10:15 AM', mine: false },
    { from: 'Me', text: 'Check in on the app so I can see availability', time: '10:16 AM', mine: true },
  ],
  'league': [
    { from: 'Admin', text: 'Week 9 schedule confirmed. Cue Club, 7 PM as usual.', time: 'Yesterday', mine: false },
    { from: 'Admin', text: 'Reminder: scorecard must be submitted same night', time: '3h ago', mine: false },
  ],
  'dm-ro': [
    { from: 'R. Okafor', text: 'Good game last week', time: 'Mon', mine: false },
    { from: 'Me', text: 'You too — that last rack was close', time: 'Mon', mine: true },
    { from: 'R. Okafor', text: 'See you Wednesday!', time: 'Mon', mine: false },
  ],
  'dm-md': [
    { from: 'M. Delgado', text: 'Good match last week', time: '3d ago', mine: false },
    { from: 'M. Delgado', text: 'Your team is in good shape for the playoffs', time: '3d ago', mine: false },
  ],
  'dm-jw': [
    { from: 'J. Williams', text: 'Any sub spots open for week 9?', time: '5d ago', mine: false },
  ],
}

const kindLabels: Record<Thread['kind'], string> = {
  team: 'Team', league: 'League', direct: 'Direct',
}

const Nav = ({ active }: { active: string }) => {
  const neutral200 = '#e4e4e7'
  const neutral600 = '#52525b'
  const felt = '#0f4c2a'
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: `1px solid ${neutral200}`, display: 'flex', padding: '8px 0 20px' }}>
      {[
        { id: 'home', label: 'Home', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
        { id: 'teams', label: 'Teams', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
        { id: 'schedule', label: 'Schedule', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
        { id: 'messages', label: 'Messages', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
        { id: 'profile', label: 'Profile', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
      ].map(tab => (
        <button key={tab.id} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 0', color: tab.id === active ? felt : neutral600 }}>
          {tab.icon}
          <span style={{ fontSize: 11, fontWeight: tab.id === active ? 600 : 400 }}>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

export default function FrameMessages() {
  const [activeThread, setActiveThread] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const thread = threads.find(t => t.id === activeThread)
  const messages = activeThread ? (conversationMap[activeThread] || []) : []

  if (activeThread && thread) {
    return (
      <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: '#fff', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Thread header */}
        <div style={{ background: felt, padding: '48px 16px 14px', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setActiveThread(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {thread.initials}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff' }}>{thread.name}</p>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{kindLabels[thread.kind]} conversation</p>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: m.mine ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8 }}>
              {!m.mine && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: neutral100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: neutral600, flexShrink: 0 }}>
                  {m.from.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
              )}
              <div style={{ maxWidth: '72%' }}>
                {!m.mine && <p style={{ margin: '0 0 2px 4px', fontSize: 11, color: neutral600 }}>{m.from}</p>}
                <div style={{ background: m.mine ? felt : neutral100, color: m.mine ? '#fff' : neutral900, borderRadius: m.mine ? '16px 4px 16px 16px' : '4px 16px 16px 16px', padding: '10px 14px', fontSize: 14, lineHeight: 1.4 }}>
                  {m.text}
                </div>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: neutral600, textAlign: m.mine ? 'right' : 'left' }}>{m.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: '12px 16px 32px', borderTop: `1px solid ${neutral200}`, display: 'flex', gap: 8, alignItems: 'flex-end', background: '#fff' }}>
          <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Message…" style={{ flex: 1, padding: '10px 14px', borderRadius: 20, border: `1.5px solid ${neutral200}`, fontSize: 14, color: neutral900, outline: 'none', fontFamily: 'inherit' }} />
          <button disabled={!draft.trim()} style={{ width: 40, height: 40, borderRadius: '50%', background: draft.trim() ? felt : neutral200, border: 'none', cursor: draft.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    )
  }

  const totalUnread = threads.reduce((sum, t) => sum + t.unread, 0)

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: neutral100, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: felt, padding: '48px 20px 20px', color: '#fff' }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>Metro Billiards League</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Messages</h1>
          {totalUnread > 0 && (
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: '#dc2626', borderRadius: 99, padding: '2px 9px' }}>{totalUnread} new</span>
          )}
        </div>
      </div>

      <div style={{ padding: '14px 16px 90px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {threads.map((t, i) => (
            <button key={t.id} onClick={() => setActiveThread(t.id)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 16px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < threads.length - 1 ? `1px solid ${neutral100}` : 'none' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: t.kind === 'team' ? felt : t.kind === 'league' ? '#1e3a5f' : neutral200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: t.kind === 'direct' ? neutral600 : '#fff' }}>
                  {t.initials}
                </div>
                {t.unread > 0 && (
                  <div style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>{t.unread}</span>
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: t.unread > 0 ? 700 : 600, color: neutral900 }}>{t.name}</span>
                  <span style={{ fontSize: 11, color: neutral600, flexShrink: 0 }}>{t.time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: t.kind === 'team' ? felt : t.kind === 'league' ? '#1e3a5f' : neutral600, fontWeight: 500, background: t.kind === 'team' ? greenLight : t.kind === 'league' ? '#dbeafe' : neutral100, padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>{kindLabels[t.kind]}</span>
                  <span style={{ fontSize: 13, color: t.unread > 0 ? neutral900 : neutral600, fontWeight: t.unread > 0 ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.lastMsg}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <Nav active="messages" />
    </div>
  )
}
