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
const red = '#dc2626'
const redLight = '#fee2e2'

type Notice = {
  id: number
  kind: 'admin' | 'result' | 'alert' | 'system'
  title: string
  body: string
  time: string
  read: boolean
}

const initialNotices: Notice[] = [
  { id: 1, kind: 'alert',  title: 'Venue change — Week 10',         body: 'Rack & Roll has moved to 9 Elm St for all September matches. Parking is free in the rear lot.',  time: '2h ago',  read: false },
  { id: 2, kind: 'result', title: 'Week 8 results posted',           body: 'Final standings and individual stats for Week 8 are now live. You moved up to 2nd in individual rankings.',        time: '5h ago',  read: false },
  { id: 3, kind: 'admin',  title: 'Playoffs bracket released',       body: 'Chalk Outlaws qualified at seed 4. Semifinals are Sep 4 at 7 PM vs Break Artists (seed 1).',         time: '1d ago',  read: true },
  { id: 4, kind: 'system', title: 'Lineup reminder',                 body: 'Deadline to lock your lineup for Week 9 is Wednesday at 6:30 PM — 30 minutes before match time.',    time: '1d ago',  read: true },
  { id: 5, kind: 'admin',  title: 'Season 2026 entry fees',          body: 'Individual entries ($40) and team entries ($80) are due by Week 1. Pay at venue. See Profile for status.',   time: '3d ago',  read: true },
  { id: 6, kind: 'result', title: 'Trade completed — EBW / BA',      body: 'G. Santos (Break Artists) and H. Müller (Eight Ball Wizards) completed a roster swap. Standings updated.',  time: '4d ago',  read: true },
  { id: 7, kind: 'system', title: 'Check-in open for Week 9',        body: 'Mark your availability now so captains can set lineups before Wednesday.',                          time: '5d ago',  read: true },
]

const kindConfig = {
  admin:  { color: '#1e3a5f', bg: '#dbeafe', label: 'Admin' },
  result: { color: green,     bg: greenLight, label: 'Result' },
  alert:  { color: red,       bg: redLight,   label: 'Alert' },
  system: { color: neutral600, bg: neutral100, label: 'Notice' },
}

export default function FrameNotifications() {
  const [notices, setNotices] = useState(initialNotices)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const unreadCount = notices.filter(n => !n.read).length

  const markAllRead = () => setNotices(ns => ns.map(n => ({ ...n, read: true })))
  const markRead = (id: number) => setNotices(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))

  const shown = filter === 'unread' ? notices.filter(n => !n.read) : notices

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: neutral100, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: felt, padding: '48px 20px 20px', color: '#fff' }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>Metro Billiards League</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Notices</h1>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
              Mark all read
            </button>
          )}
        </div>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 3 }}>
          {[{ id: 'all', label: 'All notices' }, { id: 'unread', label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` }].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id as any)} style={{ flex: 1, padding: '7px 0', border: 'none', cursor: 'pointer', borderRadius: 6, background: filter === f.id ? '#fff' : 'transparent', color: filter === f.id ? felt : 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 16px 90px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {shown.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: '32px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: 0, fontSize: 14, color: neutral600 }}>No unread notices</p>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            {shown.map((n, i) => {
              const cfg = kindConfig[n.kind]
              return (
                <button key={n.id} onClick={() => markRead(n.id)} style={{ width: '100%', background: n.read ? '#fff' : '#f0fdf4', border: 'none', cursor: 'pointer', padding: '14px 16px', textAlign: 'left', display: 'flex', gap: 12, alignItems: 'flex-start', borderBottom: i < shown.length - 1 ? `1px solid ${neutral100}` : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, paddingTop: 2 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.read ? 'transparent' : red, border: n.read ? `1.5px solid ${neutral200}` : 'none', flexShrink: 0 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '1px 7px', borderRadius: 4 }}>{cfg.label}</span>
                      <span style={{ fontSize: 11, color: neutral600 }}>{n.time}</span>
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: n.read ? 500 : 700, color: neutral900, lineHeight: 1.3 }}>{n.title}</p>
                    <p style={{ margin: 0, fontSize: 13, color: neutral600, lineHeight: 1.4 }}>{n.body}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: `1px solid ${neutral200}`, display: 'flex', padding: '8px 0 20px' }}>
        {[
          { id: 'home', label: 'Home', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
          { id: 'teams', label: 'Teams', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
          { id: 'schedule', label: 'Schedule', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
          { id: 'messages', label: 'Messages', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
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
