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

type RequestState = 'idle' | 'pending' | 'accepted' | 'declined'
type CaptainAction = null | 'transfer' | 'step-down' | 'dissolve'

const pendingRequests = [
  { from: 'J. Osei', team: 'Eight Ball Wizards', sent: '2h ago', message: 'I saw you have an open roster spot — played 3 seasons and usually run around 5 wins per night.' },
]

const invites = [
  { from: 'R. Okafor (EBW cap)', team: 'Eight Ball Wizards', sent: '1d ago', message: 'We have a slot open for Week 9 onwards — interested?' },
]

export default function FrameTeamJoin() {
  const [requestState, setRequestState] = useState<RequestState>('idle')
  const [message, setMessage] = useState('')

  // Show captain's view of managing incoming requests by default
  const [captainView, setCaptainView] = useState(true)
  const [requestAction, setRequestAction] = useState<Record<string, 'accepted' | 'declined' | null>>({ 'J. Osei': null })
  const [inviteAction, setInviteAction] = useState<'accepted' | 'declined' | null>(null)
  const [captainAction, setCaptainAction] = useState<CaptainAction>(null)
  const [transferTarget, setTransferTarget] = useState('')
  const [captainActionDone, setCaptainActionDone] = useState(false)

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: neutral100, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: felt, padding: '48px 20px 20px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Teams</p>
        </div>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Roster & membership</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>Eight Ball Wizards</p>

        {/* View toggle for demo */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 3, marginTop: 14 }}>
          <button onClick={() => setCaptainView(true)} style={{ flex: 1, padding: '7px 0', border: 'none', cursor: 'pointer', borderRadius: 6, background: captainView ? '#fff' : 'transparent', color: captainView ? felt : 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>Captain view</button>
          <button onClick={() => setCaptainView(false)} style={{ flex: 1, padding: '7px 0', border: 'none', cursor: 'pointer', borderRadius: 6, background: !captainView ? '#fff' : 'transparent', color: !captainView ? felt : 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>Player view</button>
        </div>
      </div>

      <div style={{ padding: '16px 16px 90px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {captainView ? (
          <>
            {/* Roster health */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Roster status</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {[{ label: 'Rostered', val: '4', note: 'Opening-night ready' }, { label: 'Open slots', val: '1', note: 'Max 6 per team' }].map(s => (
                  <div key={s.label} style={{ flex: 1, background: neutral100, borderRadius: 10, padding: '12px' }}>
                    <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: neutral900 }}>{s.val}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: neutral600 }}>{s.label}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: green, fontWeight: 500 }}>{s.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Current roster */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Current roster</p>
              {[
                { name: 'R. Okafor',  role: 'Captain', wins: 13, registered: true },
                { name: 'H. Müller',  role: 'Player',  wins: 11, registered: true },
                { name: 'A. Chen',    role: 'Player',  wins: 11, registered: true },
                { name: 'D. Ferreira',role: 'Player',  wins: 8,  registered: false },
              ].map((p, i, arr) => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < arr.length - 1 ? `1px solid ${neutral100}` : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: p.role === 'Captain' ? felt : neutral100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: p.role === 'Captain' ? '#fff' : neutral600, flexShrink: 0 }}>
                    {p.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: neutral900 }}>{p.name}</span>
                      {p.role === 'Captain' && <span style={{ fontSize: 10, fontWeight: 700, color: '#92400e', background: '#fef3c7', padding: '1px 5px', borderRadius: 4 }}>C</span>}
                    </div>
                    <span style={{ fontSize: 12, color: neutral600 }}>{p.wins}W this season</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: p.registered ? green : amber, background: p.registered ? greenLight : amberLight, padding: '2px 8px', borderRadius: 99 }}>
                      {p.registered ? 'Paid' : 'Payment due'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Incoming requests */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Join requests</p>
                {pendingRequests.filter(r => !requestAction[r.from]).length > 0 && (
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{pendingRequests.filter(r => !requestAction[r.from]).length}</span>
                  </div>
                )}
              </div>
              {pendingRequests.map(req => {
                const action = requestAction[req.from]
                return (
                  <div key={req.from} style={{ background: neutral100, borderRadius: 10, padding: '12px', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: neutral200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: neutral600, flexShrink: 0 }}>
                        {req.from.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: neutral900 }}>{req.from}</p>
                        <p style={{ margin: 0, fontSize: 12, color: neutral600 }}>{req.sent}</p>
                      </div>
                    </div>
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: neutral900, lineHeight: 1.4, fontStyle: 'italic' }}>"{req.message}"</p>
                    {!action ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setRequestAction(r => ({ ...r, [req.from]: 'accepted' }))} style={{ flex: 1, padding: '9px', background: felt, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Accept</button>
                        <button onClick={() => setRequestAction(r => ({ ...r, [req.from]: 'declined' }))} style={{ flex: 1, padding: '9px', background: '#fff', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Decline</button>
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: action === 'accepted' ? green : '#dc2626', textAlign: 'center' }}>
                        {action === 'accepted' ? 'Accepted — player added to roster' : 'Declined'}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Captain lifecycle */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Captain actions</p>
              {captainActionDone ? (
                <div style={{ background: greenLight, borderRadius: 10, padding: '14px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#065f46' }}>
                    {captainAction === 'transfer' ? 'Captaincy transferred' : captainAction === 'step-down' ? 'You have stepped down' : 'Team dissolved'}
                  </p>
                  <p style={{ margin: 0, fontSize: 13, color: green }}>
                    {captainAction === 'transfer' ? `${transferTarget} is now captain of Eight Ball Wizards.` : captainAction === 'step-down' ? 'Team is now without a captain. Admin has been notified.' : 'Team has been dissolved. History is preserved.'}
                  </p>
                </div>
              ) : captainAction === null ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={() => setCaptainAction('transfer')} style={{ width: '100%', padding: '12px 14px', background: 'none', border: `1px solid ${neutral200}`, borderRadius: 10, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={neutral600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 3 19 6 16 9"/><line x1="13" y1="6" x2="22" y2="6"/></svg>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: neutral900 }}>Transfer captaincy</p>
                      <p style={{ margin: '1px 0 0', fontSize: 12, color: neutral600 }}>Assign captain role to another rostered player</p>
                    </div>
                  </button>
                  <button onClick={() => setCaptainAction('step-down')} style={{ width: '100%', padding: '12px 14px', background: 'none', border: `1px solid ${neutral200}`, borderRadius: 10, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={neutral600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: neutral900 }}>Step down as captain</p>
                      <p style={{ margin: '1px 0 0', fontSize: 12, color: neutral600 }}>Remain on roster but give up captaincy</p>
                    </div>
                  </button>
                  <button onClick={() => setCaptainAction('dissolve')} style={{ width: '100%', padding: '12px 14px', background: 'none', border: `1px solid #fca5a5`, borderRadius: 10, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: red }}>Dissolve team</p>
                      <p style={{ margin: '1px 0 0', fontSize: 12, color: neutral600 }}>Withdraw from the season. History is preserved.</p>
                    </div>
                  </button>
                </div>
              ) : captainAction === 'transfer' ? (
                <div>
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: neutral600, lineHeight: 1.4 }}>Select a rostered player to become captain. They must confirm before the change takes effect.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                    {['H. Müller', 'A. Chen', 'D. Ferreira'].map(name => (
                      <button key={name} onClick={() => setTransferTarget(name)} style={{ padding: '10px 12px', border: `1.5px solid ${transferTarget === name ? felt : neutral200}`, borderRadius: 10, background: transferTarget === name ? '#f0fdf4' : '#fff', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: transferTarget === name ? felt : neutral100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: transferTarget === name ? '#fff' : neutral600 }}>
                          {name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 500, color: neutral900 }}>{name}</span>
                        {transferTarget === name && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto' }}><polyline points="20 6 9 17 4 12"/></svg>}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { if (transferTarget) setCaptainActionDone(true) }} disabled={!transferTarget} style={{ flex: 1, padding: '11px', background: transferTarget ? felt : neutral200, color: transferTarget ? '#fff' : neutral600, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: transferTarget ? 'pointer' : 'not-allowed' }}>Transfer captaincy</button>
                    <button onClick={() => setCaptainAction(null)} style={{ padding: '11px 14px', background: '#fff', color: neutral600, border: `1px solid ${neutral200}`, borderRadius: 10, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : captainAction === 'step-down' ? (
                <div>
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: neutral600, lineHeight: 1.4 }}>You will remain on the roster but the team will have no captain until another player accepts the role or the league admin assigns one.</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setCaptainActionDone(true)} style={{ flex: 1, padding: '11px', background: amber, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Confirm step down</button>
                    <button onClick={() => setCaptainAction(null)} style={{ padding: '11px 14px', background: '#fff', color: neutral600, border: `1px solid ${neutral200}`, borderRadius: 10, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ background: redLight, borderRadius: 10, padding: '12px', marginBottom: 12 }}>
                    <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: red }}>This cannot be undone</p>
                    <p style={{ margin: 0, fontSize: 12, color: neutral600, lineHeight: 1.4 }}>All rostered players will be free agents. Season history is preserved. Any outstanding matches will be recorded as forfeits.</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setCaptainActionDone(true)} style={{ flex: 1, padding: '11px', background: red, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Dissolve team</button>
                    <button onClick={() => setCaptainAction(null)} style={{ padding: '11px 14px', background: '#fff', color: neutral600, border: `1px solid ${neutral200}`, borderRadius: 10, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Player view: incoming invite + send request */}
            {invites.map(inv => (
              <div key={inv.from} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: `1.5px solid ${amber}` }}>
                <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Invitation from {inv.team}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: neutral200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: neutral600 }}>RO</div>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: neutral900 }}>{inv.from}</p>
                    <p style={{ margin: 0, fontSize: 12, color: neutral600 }}>{inv.sent}</p>
                  </div>
                </div>
                <p style={{ margin: '0 0 12px', fontSize: 13, color: neutral900, lineHeight: 1.4, fontStyle: 'italic' }}>"{inv.message}"</p>
                {!inviteAction ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setInviteAction('accepted')} style={{ flex: 1, padding: '10px', background: felt, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Accept</button>
                    <button onClick={() => setInviteAction('declined')} style={{ flex: 1, padding: '10px', background: '#fff', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Decline</button>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: inviteAction === 'accepted' ? green : '#dc2626', textAlign: 'center' }}>
                    {inviteAction === 'accepted' ? 'Accepted — you\'ve joined Eight Ball Wizards' : 'Declined'}
                  </p>
                )}
              </div>
            ))}

            {/* Send a request */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Request to join a team</p>
              {requestState === 'idle' ? (
                <>
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: neutral600, lineHeight: 1.5 }}>Message the captain directly. Include your experience and availability.</p>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Introduce yourself — seasons played, win rate, availability…" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${neutral200}`, fontSize: 13, color: neutral900, resize: 'none', height: 80, boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 10 }} />
                  <button onClick={() => setRequestState('pending')} disabled={!message.trim()} style={{ width: '100%', padding: '12px', background: message.trim() ? felt : neutral200, color: message.trim() ? '#fff' : neutral600, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: message.trim() ? 'pointer' : 'not-allowed' }}>
                    Send request
                  </button>
                </>
              ) : (
                <div style={{ background: greenLight, borderRadius: 10, padding: '14px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#065f46' }}>Request sent</p>
                  <p style={{ margin: 0, fontSize: 13, color: green }}>The captain has been notified and will respond here.</p>
                </div>
              )}
            </div>

            {/* My pending requests */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>My requests</p>
              {requestState === 'pending' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: neutral100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: neutral600 }}>EBW</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: neutral900 }}>Eight Ball Wizards</p>
                    <p style={{ margin: 0, fontSize: 12, color: neutral600 }}>Awaiting captain response</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: amber, background: amberLight, padding: '3px 9px', borderRadius: 99 }}>Pending</span>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: neutral600 }}>No active requests</p>
              )}
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
          { id: 'profile', label: 'Profile', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
        ].map(tab => (
          <button key={tab.id} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 0', color: tab.id === 'teams' ? felt : neutral600 }}>
            {tab.icon}
            <span style={{ fontSize: 11, fontWeight: tab.id === 'teams' ? 600 : 400 }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
