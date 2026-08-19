import { useState } from 'react'

const green = '#1a7a4a'
const greenLight = '#e8f5ee'
const felt = '#0f4c2a'
const feltDark = '#0a3320'
const neutral50 = '#fafafa'
const neutral100 = '#f4f4f5'
const neutral200 = '#e4e4e7'
const neutral600 = '#52525b'
const neutral900 = '#09090b'

const announcements = [
  { id: 1, type: 'result', text: 'Night 8 results posted — Week of Aug 12', time: '2h ago' },
  { id: 2, type: 'info', text: 'Playoffs bracket released. First round starts Sep 4', time: '1d ago' },
  { id: 3, type: 'alert', text: 'Venue change: Rack & Roll moves to 9 Elm St for Sep matches', time: '3d ago' },
]

const upcomingMatches = [
  { home: 'Chalk Outlaws', away: 'Side Pocket Kings', date: 'Wed Aug 21', time: '7:00 PM', venue: 'Cue Club' },
  { home: 'Break Artists', away: 'Corner Pocket Co.', date: 'Wed Aug 21', time: '7:30 PM', venue: 'Rack & Roll' },
  { home: 'Straight Shooters', away: 'Eight Ball Wizards', date: 'Thu Aug 22', time: '7:00 PM', venue: 'Cue Club' },
]

const leaders = [
  { rank: 1, name: 'D. Morales', team: 'Break Artists', pts: 48, wins: 16 },
  { rank: 2, name: 'T. Nakamura', team: 'Chalk Outlaws', pts: 44, wins: 14 },
  { rank: 3, name: 'R. Okafor', team: 'Eight Ball Wizards', pts: 41, wins: 13 },
]

export default function Frame() {
  const [bannerDismissed, setBannerDismissed] = useState(false)

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: neutral100, height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      {/* Admin status banner */}
      {!bannerDismissed && (
        <div style={{ background: '#1e3a5f', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p style={{ margin: 0, flex: 1, fontSize: 13, color: '#bfdbfe', lineHeight: 1.3 }}>Venue change: Rack &amp; Roll moves to 9 Elm St for all September matches</p>
          <button onClick={() => setBannerDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}
      {/* Header */}
      <div style={{ background: felt, padding: '48px 20px 20px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>Metro Billiards League</p>
            <h1 style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Season 2026</h1>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" color="rgba(255,255,255,0.7)"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
        </div>
        {/* Season progress */}
        <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Regular season</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>Week 8 of 12</span>
          </div>
          <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '66%', borderRadius: 99, background: '#4ade80' }} />
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
            {[{ label: 'Teams', val: '8' }, { label: 'Matches', val: '56' }, { label: 'My team', val: 'Chalk Outlaws' }].map(s => (
              <div key={s.label}>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff' }}>{s.val}</p>
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '16px 16px 90px' }}>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
          {[
            { label: 'Check in', sub: 'Week 9', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={felt} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
            { label: 'Lineup', sub: 'Set 3 players', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={felt} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
            { label: 'Score', sub: 'Enter results', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={felt} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
          ].map(a => (
            <button key={a.label} style={{ background: '#fff', border: 'none', borderRadius: 12, padding: '12px 10px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{a.icon}</div>
              <span style={{ fontSize: 13, fontWeight: 700, color: neutral900 }}>{a.label}</span>
              <span style={{ fontSize: 11, color: neutral600 }}>{a.sub}</span>
            </button>
          ))}
        </div>

        {/* Free agent callout */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: neutral900 }}>2 free agents available for Week 9</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: neutral600 }}>J. Osei · L. Reeves — marked available</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={neutral600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>

        {/* Next match card */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', color: neutral600, textTransform: 'uppercase' }}>Your next match</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: felt, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, margin: '0 auto 6px' }}>CO</div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: neutral900 }}>Chalk Outlaws</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: neutral600 }}>4th · 5W 3L</p>
            </div>
            <div style={{ textAlign: 'center', padding: '0 12px' }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: neutral900, letterSpacing: '0.04em' }}>VS</p>
              <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 600, color: green }}>Wed Aug 21 · 7 PM</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: neutral600 }}>Cue Club</p>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#374151', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, margin: '0 auto 6px' }}>SPK</div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: neutral900 }}>Side Pocket Kings</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: neutral600 }}>6th · 3W 5L</p>
            </div>
          </div>
        </div>

        {/* Points leaders */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', color: neutral600, textTransform: 'uppercase' }}>Points leaders</p>
            <span style={{ fontSize: 12, color: green, fontWeight: 500 }}>See all</span>
          </div>
          {leaders.map((p, i) => (
            <div key={p.rank}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                <span style={{ width: 20, fontSize: 13, fontWeight: 700, color: i === 0 ? '#b45309' : neutral600, textAlign: 'center' }}>{p.rank}</span>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: neutral100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: neutral600 }}>
                  {p.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: neutral900 }}>{p.name}</p>
                  <p style={{ margin: '1px 0 0', fontSize: 12, color: neutral600 }}>{p.team}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: neutral900 }}>{p.pts}</p>
                  <p style={{ margin: '1px 0 0', fontSize: 11, color: neutral600 }}>{p.wins}W</p>
                </div>
              </div>
              {i < leaders.length - 1 && <div style={{ height: 1, background: neutral100 }} />}
            </div>
          ))}
        </div>

        {/* Announcements */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', color: neutral600, textTransform: 'uppercase' }}>Announcements</p>
          {announcements.map((a, i) => (
            <div key={a.id}>
              <div style={{ display: 'flex', gap: 10, padding: '9px 0', alignItems: 'flex-start' }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                  background: a.type === 'alert' ? '#dc2626' : a.type === 'result' ? green : '#2563eb'
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, color: neutral900, lineHeight: 1.4 }}>{a.text}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: neutral600 }}>{a.time}</p>
                </div>
              </div>
              {i < announcements.length - 1 && <div style={{ height: 1, background: neutral100 }} />}
            </div>
          ))}
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
          <button key={tab.id} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 0', color: tab.id === 'home' ? felt : neutral600 }}>
            {tab.icon}
            <span style={{ fontSize: 11, fontWeight: tab.id === 'home' ? 600 : 400 }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
