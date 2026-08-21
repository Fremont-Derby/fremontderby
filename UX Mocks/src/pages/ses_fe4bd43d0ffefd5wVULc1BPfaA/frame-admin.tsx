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

type Destination = {
  label: string
  sublabel: string
  badge?: { text: string; color: string; bg: string }
  icon: JSX.Element
  adminOnly?: boolean
}

const destinations: Destination[] = [
  {
    label: 'Season setup',
    sublabel: 'Configure, publish, and close the active season',
    badge: { text: 'Active', color: green, bg: greenLight },
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 1.41 13.14"/><path d="M4.93 19.07a10 10 0 0 1-1.41-13.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M8.46 15.54a5 5 0 0 1 0-7.07"/></svg>,
    adminOnly: true,
  },
  {
    label: 'Season teams',
    sublabel: 'Manage team slots, qualification, and waitlist',
    badge: { text: '1 action', color: amber, bg: amberLight },
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    adminOnly: true,
  },
  {
    label: 'Players',
    sublabel: 'Search, manage roles, eligibility, and exceptions',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    adminOnly: true,
  },
  {
    label: 'Operations',
    sublabel: 'Readiness triage, exception queue, and health signals',
    badge: { text: '3 flags', color: red, bg: redLight },
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    adminOnly: true,
  },
  {
    label: 'Find seasons',
    sublabel: 'Look up any season by name or status',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    adminOnly: true,
  },
  {
    label: 'Prize configuration',
    sublabel: 'Set pool amounts and finalize payouts',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
    adminOnly: true,
  },
]

const readinessFlags = [
  { team: 'Side Pocket Kings', issue: 'Only 3 rostered players — needs 4 for opening night', severity: 'warn' as const },
  { team: 'D. Ferreira',       issue: 'Payment due — not confirmed for Season 2026',          severity: 'warn' as const },
  { team: 'All teams',         issue: 'Week 9 scores not yet finalized (1 pending)',            severity: 'info' as const },
]

export default function FrameAdmin() {
  const [activeSection, setActiveSection] = useState<'gateway' | 'ops'>('gateway')
  const [bannerText, setBannerText] = useState('Venue change: Rack & Roll moves to 9 Elm St for all September matches')
  const [bannerActive, setBannerActive] = useState(true)
  const [editingBanner, setEditingBanner] = useState(false)
  const [bannerInput, setBannerInput] = useState(bannerText)

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: neutral100, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: felt, padding: '48px 20px 0', color: '#fff' }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>Metro Billiards League</p>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Admin</h1>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>League director · Season 2026</p>
        <div style={{ display: 'flex' }}>
          {[{ id: 'gateway', label: 'Gateway' }, { id: 'ops', label: 'Operations' }].map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id as any)} style={{ flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', background: 'transparent', color: activeSection === s.id ? '#fff' : 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: activeSection === s.id ? 700 : 400, borderBottom: activeSection === s.id ? '2px solid #4ade80' : '2px solid transparent' }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 90px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {activeSection === 'gateway' && (
          <>
            {/* Season status banner */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: green, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: neutral900 }}>Season 2026 — Active</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: neutral600 }}>Week 8 of 12 · Regular season · 8 teams participating</p>
              </div>
            </div>

            {/* Destinations */}
            <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              {destinations.map((d, i) => (
                <button key={d.label} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 16px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < destinations.length - 1 ? `1px solid ${neutral100}` : 'none' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: neutral100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: felt, flexShrink: 0 }}>
                    {d.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: neutral900 }}>{d.label}</span>
                      {d.badge && <span style={{ fontSize: 11, fontWeight: 600, color: d.badge.color, background: d.badge.bg, padding: '1px 7px', borderRadius: 99 }}>{d.badge.text}</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: neutral600, lineHeight: 1.3 }}>{d.sublabel}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={neutral600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              ))}
            </div>
          </>
        )}

        {activeSection === 'ops' && (
          <>
            {/* Season health summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Teams registered', val: '8 / 8', ok: true },
                { label: 'Payment confirmed', val: '22 / 24', ok: false },
                { label: 'Week 9 check-ins', val: '19 / 24', ok: true },
                { label: 'Pending scores', val: '1', ok: false },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: s.ok ? neutral900 : amber }}>{s.val}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: neutral600 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Flags */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Readiness flags</p>
              {readinessFlags.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '9px 0', borderBottom: i < readinessFlags.length - 1 ? `1px solid ${neutral100}` : 'none', alignItems: 'flex-start' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: f.severity === 'warn' ? amber : '#3b82f6', marginTop: 5, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: neutral900 }}>{f.team}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: neutral600, lineHeight: 1.3 }}>{f.issue}</p>
                  </div>
                  <button style={{ background: 'none', border: `1px solid ${neutral200}`, borderRadius: 6, padding: '4px 10px', fontSize: 12, color: neutral600, cursor: 'pointer', flexShrink: 0 }}>Fix</button>
                </div>
              ))}
            </div>

            {/* Status banner control */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>League status banner</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: bannerActive ? green : neutral600 }}>{bannerActive ? 'Live' : 'Hidden'}</span>
                  <button onClick={() => setBannerActive(!bannerActive)} style={{ width: 38, height: 22, borderRadius: 11, background: bannerActive ? green : neutral200, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.15s' }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: bannerActive ? 19 : 3, transition: 'left 0.15s' }} />
                  </button>
                </div>
              </div>
              {bannerActive && (
                <div style={{ background: '#dbeafe', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#1e3a5f' }}>{bannerText}</p>
                </div>
              )}
              {editingBanner ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={bannerInput} onChange={e => setBannerInput(e.target.value)} style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${felt}`, fontSize: 13 }} />
                  <button onClick={() => { setBannerText(bannerInput); setEditingBanner(false); setBannerActive(true) }} style={{ padding: '9px 12px', background: felt, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Publish</button>
                </div>
              ) : (
                <button onClick={() => { setEditingBanner(true); setBannerInput(bannerText) }} style={{ width: '100%', padding: '9px', background: neutral100, color: neutral900, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {bannerActive ? 'Edit banner' : 'Write new banner'}
                </button>
              )}
            </div>

            {/* Quick actions */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Season actions</p>              {[
                { label: 'Publish Week 9 schedule', status: 'Published', done: true },
                { label: 'Finalize Week 8 scores', status: '1 pending', done: false },
                { label: 'Playoff bracket', status: 'Published', done: true },
                { label: 'Close regular season', status: 'After Week 12', done: false },
              ].map((a, i, arr) => (
                <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < arr.length - 1 ? `1px solid ${neutral100}` : 'none' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: a.done ? green : neutral200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {a.done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <span style={{ flex: 1, fontSize: 13, color: neutral900 }}>{a.label}</span>
                  <span style={{ fontSize: 12, color: a.done ? green : amber, fontWeight: 500 }}>{a.status}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: `1px solid ${neutral200}`, display: 'flex', padding: '8px 0 20px' }}>
        {[
          { id: 'home', label: 'Home', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
          { id: 'teams', label: 'Teams', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
          { id: 'schedule', label: 'Schedule', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
          { id: 'messages', label: 'Messages', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
          { id: 'admin', label: 'Admin', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
        ].map(tab => (
          <button key={tab.id} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 0', color: tab.id === 'admin' ? felt : neutral600 }}>
            {tab.icon}
            <span style={{ fontSize: 11, fontWeight: tab.id === 'admin' ? 600 : 400 }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
