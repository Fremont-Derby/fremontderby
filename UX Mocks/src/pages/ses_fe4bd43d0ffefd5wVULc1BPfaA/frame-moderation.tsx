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

type ReportStatus = 'pending' | 'resolved' | 'dismissed'

type Report = {
  id: number
  reportedBy: string
  reportedPlayer: string
  messageSnippet: string
  context: string
  time: string
  status: ReportStatus
  reason: string
}

const initialReports: Report[] = [
  {
    id: 1,
    reportedBy: 'C. Burrows',
    reportedPlayer: 'K. Webb',
    messageSnippet: 'That call was absolute trash and you know it',
    context: 'Chalk Outlaws vs Side Pocket Kings team chat',
    time: '2h ago',
    status: 'pending',
    reason: 'Harassment',
  },
  {
    id: 2,
    reportedBy: 'H. Muller',
    reportedPlayer: 'D. Ferreira',
    messageSnippet: 'Stop messaging me about this, I already said no',
    context: 'Direct message',
    time: '1d ago',
    status: 'pending',
    reason: 'Unwanted contact',
  },
  {
    id: 3,
    reportedBy: 'L. Park',
    reportedPlayer: 'J. Osei',
    messageSnippet: 'This league is run by idiots anyway',
    context: 'League-wide chat',
    time: '3d ago',
    status: 'resolved',
    reason: 'Conduct',
  },
  {
    id: 4,
    reportedBy: 'T. Nakamura',
    reportedPlayer: 'M. Torres',
    messageSnippet: 'Anyone want to buy my tickets to the game tonight?',
    context: 'Chalk Outlaws team chat',
    time: '5d ago',
    status: 'dismissed',
    reason: 'Off-topic',
  },
]

const statusConfig = {
  pending:   { label: 'Pending',   color: amber,  bg: amberLight },
  resolved:  { label: 'Resolved',  color: green,  bg: greenLight },
  dismissed: { label: 'Dismissed', color: neutral600, bg: neutral100 },
}

const resolutionOptions = [
  { value: 'warn',    label: 'Warn player', desc: 'Send a private warning — visible to admin only' },
  { value: 'remove',  label: 'Remove message', desc: 'Delete the reported message from the thread' },
  { value: 'block',   label: 'Block from league chat', desc: 'Restrict player to direct messages only' },
  { value: 'dismiss', label: 'Dismiss report', desc: 'No action — mark as reviewed' },
]

export default function FrameModeration() {
  const [reports, setReports] = useState(initialReports)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [resolution, setResolution] = useState<Record<number, string>>({})

  const resolve = (id: number, action: string) => {
    setReports(rs => rs.map(r => r.id === id ? { ...r, status: action === 'dismiss' ? 'dismissed' : 'resolved' } : r))
    setExpanded(null)
  }

  const shown = filter === 'pending' ? reports.filter(r => r.status === 'pending') : reports
  const pendingCount = reports.filter(r => r.status === 'pending').length

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: neutral100, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: felt, padding: '48px 20px 20px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Messages → Moderation</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Moderation queue</h1>
          {pendingCount > 0 && (
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: red, borderRadius: 99, padding: '2px 9px' }}>{pendingCount} pending</span>
          )}
        </div>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 3 }}>
          {[{ id: 'pending', label: `Pending (${pendingCount})` }, { id: 'all', label: `All reports (${reports.length})` }].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id as any)} style={{ flex: 1, padding: '7px 0', border: 'none', cursor: 'pointer', borderRadius: 6, background: filter === f.id ? '#fff' : 'transparent', color: filter === f.id ? felt : 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 16px 90px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {shown.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: '32px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: 0, fontSize: 14, color: neutral600 }}>No pending reports</p>
          </div>
        ) : shown.map(report => {
          const sc = statusConfig[report.status]
          const isOpen = expanded === report.id
          return (
            <div key={report.id} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <button onClick={() => setExpanded(isOpen ? null : report.id)} style={{ width: '100%', background: 'none', border: 'none', cursor: report.status === 'pending' ? 'pointer' : 'default', padding: '14px 16px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: sc.color, background: sc.bg, padding: '2px 8px', borderRadius: 99 }}>{sc.label}</span>
                    <span style={{ fontSize: 11, color: neutral600, background: neutral100, padding: '2px 8px', borderRadius: 99 }}>{report.reason}</span>
                  </div>
                  <span style={{ fontSize: 11, color: neutral600 }}>{report.time}</span>
                </div>
                {/* Reported message */}
                <div style={{ background: redLight, borderRadius: 8, padding: '10px 12px', marginBottom: 10, borderLeft: `3px solid ${red}` }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#7f1d1d', fontStyle: 'italic', lineHeight: 1.4 }}>"{report.messageSnippet}"</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, color: neutral600 }}>Reported: </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: neutral900 }}>{report.reportedPlayer}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: neutral600 }}>By: </span>
                    <span style={{ fontSize: 12, color: neutral600 }}>{report.reportedBy}</span>
                  </div>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: neutral600 }}>{report.context}</p>
              </button>

              {isOpen && report.status === 'pending' && (
                <div style={{ borderTop: `1px solid ${neutral100}`, padding: '14px 16px' }}>
                  <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: neutral600 }}>Moderator action</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    {resolutionOptions.map(opt => (
                      <button key={opt.value} onClick={() => setResolution(r => ({ ...r, [report.id]: opt.value }))} style={{ padding: '10px 12px', border: `1.5px solid ${resolution[report.id] === opt.value ? felt : neutral200}`, borderRadius: 10, background: resolution[report.id] === opt.value ? '#f0fdf4' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: neutral900 }}>{opt.label}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: neutral600 }}>{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => resolution[report.id] && resolve(report.id, resolution[report.id])} disabled={!resolution[report.id]} style={{ width: '100%', padding: '12px', background: resolution[report.id] ? felt : neutral200, color: resolution[report.id] ? '#fff' : neutral600, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: resolution[report.id] ? 'pointer' : 'not-allowed' }}>
                    Apply action
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: `1px solid ${neutral200}`, display: 'flex', padding: '8px 0 20px' }}>
        {[
          { id: 'home', label: 'Home', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
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
