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

type AuthState = 'signed-out' | 'signed-in-unclaimed' | 'signed-in'
type PaymentState = 'not-registered' | 'registered' | 'payment-due' | 'paid' | 'waived'

const paymentConfig: Record<PaymentState, { label: string; color: string; bg: string; desc: string }> = {
  'not-registered': { label: 'Not registered', color: neutral600, bg: neutral100, desc: 'Register for Season 2026 to play' },
  'registered':     { label: 'Registered',     color: amber,      bg: amberLight, desc: 'Payment of $40 due before Week 1' },
  'payment-due':    { label: 'Payment due',     color: red,        bg: redLight,   desc: '$40 individual entry — pay at venue' },
  'paid':           { label: 'Paid',            color: green,      bg: greenLight, desc: 'Entry confirmed for Season 2026' },
  'waived':         { label: 'Waived',          color: green,      bg: greenLight, desc: 'Entry fee waived by league admin' },
}

export default function FrameProfile() {
  const [authState, setAuthState] = useState<AuthState>('signed-out')
  const [payment, setPayment] = useState<PaymentState>('paid')
  const [fargoId, setFargoId] = useState('FR-88421')
  const [editingFargo, setEditingFargo] = useState(false)
  const [fargoInput, setFargoInput] = useState(fargoId)
  const [phone, setPhone] = useState('(510) 555-0172')
  const [editingPhone, setEditingPhone] = useState(false)
  const [phoneInput, setPhoneInput] = useState(phone)

  const pc = paymentConfig[payment]

  if (authState === 'signed-out') {
    return (
      <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: neutral100, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Hero */}
        <div style={{ background: felt, padding: '64px 24px 48px', color: '#fff', textAlign: 'center', flex: '0 0 auto' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 26, fontWeight: 800, color: '#fff' }}>FD</div>
          <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Fremont Derby</h1>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>Cash pool league · 8 teams · one venue · four tables</p>
        </div>

        {/* Sign in card */}
        <div style={{ padding: '24px 20px', flex: 1 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 16 }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: neutral900 }}>Sign in to play</h2>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: neutral600, lineHeight: 1.5 }}>Use your Google account. Your league identity is linked after sign-in.</p>
            <button onClick={() => setAuthState('signed-in-unclaimed')} style={{ width: '100%', padding: '14px', background: '#fff', color: neutral900, border: `1.5px solid ${neutral200}`, borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Sign in with Google
            </button>
          </div>

          {/* Public info */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Season 2026</p>
            {[
              { label: 'Season',   val: '12 weeks · Aug–Oct 2026' },
              { label: 'Format',   val: '7-round round robin + playoffs' },
              { label: 'Entry',    val: '$40 individual + $80 team' },
              { label: 'Venue',    val: 'Cue Club · Fremont, CA' },
              { label: 'Tables',   val: '4 reserved league tables' },
            ].map((r, i, arr) => (
              <div key={r.label} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: i < arr.length - 1 ? `1px solid ${neutral100}` : 'none' }}>
                <span style={{ flex: '0 0 80px', fontSize: 13, color: neutral600, fontWeight: 500 }}>{r.label}</span>
                <span style={{ fontSize: 13, color: neutral900 }}>{r.val}</span>
              </div>
            ))}
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, padding: '10px', background: felt, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>View standings</button>
              <button style={{ flex: 1, padding: '10px', background: neutral100, color: neutral900, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Read rules</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (authState === 'signed-in-unclaimed') {
    return (
      <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: neutral100, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: felt, padding: '48px 20px 20px', color: '#fff' }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>Profile</p>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff' }}>Welcome</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>Signed in as taylor.nakamura@gmail.com</p>
        </div>

        <div style={{ padding: '16px 16px 90px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Claim identity prompt */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: `1.5px solid ${amber}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: amberLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={amber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: neutral900 }}>Claim your league identity</p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: neutral600, lineHeight: 1.4 }}>The league admin may have created an identity for you. Claim it to access your match history and register for Season 2026.</p>
              </div>
            </div>
            <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: neutral600 }}>Unclaimed identities matching your name:</p>
            {[{ name: 'T. Nakamura', seasons: 'Seasons 2024–2025', matches: '42 matches', team: 'Chalk Outlaws' }].map(p => (
              <div key={p.name} style={{ background: neutral100, borderRadius: 10, padding: '12px', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: neutral200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: neutral600 }}>TN</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: neutral900 }}>{p.name}</p>
                    <p style={{ margin: 0, fontSize: 12, color: neutral600 }}>{p.team} · {p.seasons} · {p.matches}</p>
                  </div>
                </div>
                <button onClick={() => setAuthState('signed-in')} style={{ marginTop: 10, width: '100%', padding: '10px', background: felt, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Claim this identity
                </button>
              </div>
            ))}
            <button style={{ width: '100%', padding: '10px', background: 'none', color: neutral600, border: `1px solid ${neutral200}`, borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
              None of these are me
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Signed in, identity claimed
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: neutral100, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: felt, padding: '48px 20px 20px', color: '#fff' }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>Profile</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff', flexShrink: 0 }}>TN</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>T. Nakamura</h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>Chalk Outlaws · Captain · Season 2026</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 90px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Registration / payment */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Season 2026 registration</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: neutral900 }}>Individual entry</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: neutral600 }}>{pc.desc}</p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: pc.color, background: pc.bg, padding: '4px 10px', borderRadius: 99, whiteSpace: 'nowrap' }}>{pc.label}</span>
          </div>
          {/* Payment state switcher for demo */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(Object.keys(paymentConfig) as PaymentState[]).map(s => (
              <button key={s} onClick={() => setPayment(s)} style={{ padding: '4px 8px', border: `1px solid ${payment === s ? felt : neutral200}`, borderRadius: 6, background: payment === s ? felt : '#fff', color: payment === s ? '#fff' : neutral600, fontSize: 11, cursor: 'pointer' }}>
                {paymentConfig[s].label}
              </button>
            ))}
          </div>
          {payment === 'not-registered' && (
            <button style={{ marginTop: 12, width: '100%', padding: '12px', background: felt, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Register for Season 2026
            </button>
          )}
        </div>

        {/* Stats */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Your season stats</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[{ label: 'Individual rank', val: '2nd' }, { label: 'Record', val: '14W · 10L' }, { label: 'Points', val: '44' }, { label: 'Avg per match', val: '5.5' }].map(s => (
              <div key={s.label} style={{ background: neutral100, borderRadius: 10, padding: '12px' }}>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: neutral900 }}>{s.val}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: neutral600 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact phone */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>League contact</p>
            <button onClick={() => setEditingPhone(!editingPhone)} style={{ background: 'none', border: 'none', fontSize: 12, color: green, fontWeight: 600, cursor: 'pointer' }}>
              {editingPhone ? 'Cancel' : 'Edit'}
            </button>
          </div>
          {editingPhone ? (
            <div>
              <input value={phoneInput} onChange={e => setPhoneInput(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${felt}`, fontSize: 14, color: neutral900, boxSizing: 'border-box', marginBottom: 8 }} />
              <p style={{ margin: '0 0 10px', fontSize: 12, color: neutral600 }}>Used by captains and admins only. Never shown publicly.</p>
              <button onClick={() => { setPhone(phoneInput); setEditingPhone(false) }} style={{ width: '100%', padding: '10px', background: felt, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save phone</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={neutral600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6 19.79 19.79 0 0 1 1.63 5.04 2 2 0 0 1 3.6 2.87h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.5a16 16 0 0 0 6 6l.97-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 18a2 2 0 0 1 .27-.08z"/></svg>
              <span style={{ fontSize: 14, color: neutral900 }}>{phone}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: neutral600, background: neutral100, padding: '2px 8px', borderRadius: 99 }}>Private</span>
            </div>
          )}
        </div>

        {/* Fargo */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: neutral600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Fargo rating</p>
            <button onClick={() => setEditingFargo(!editingFargo)} style={{ background: 'none', border: 'none', fontSize: 12, color: green, fontWeight: 600, cursor: 'pointer' }}>
              {editingFargo ? 'Cancel' : 'Edit'}
            </button>
          </div>
          {editingFargo ? (
            <div>
              <input placeholder="Your Fargo ID (e.g. FR-88421)" value={fargoInput} onChange={e => setFargoInput(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${felt}`, fontSize: 14, color: neutral900, boxSizing: 'border-box', marginBottom: 8 }} />
              <p style={{ margin: '0 0 10px', fontSize: 12, color: neutral600 }}>Self-reported. Verified Fargo identity sourced separately by the league.</p>
              <button onClick={() => { setFargoId(fargoInput); setEditingFargo(false) }} style={{ width: '100%', padding: '10px', background: felt, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save Fargo ID</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, color: neutral900, fontWeight: 600 }}>{fargoId}</span>
              <span style={{ fontSize: 11, color: amber, background: amberLight, padding: '2px 8px', borderRadius: 99 }}>Self-reported</span>
            </div>
          )}
        </div>

        {/* Sign out */}
        <button onClick={() => setAuthState('signed-out')} style={{ padding: '12px', background: '#fff', color: red, border: `1px solid ${neutral200}`, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Sign out
        </button>
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: `1px solid ${neutral200}`, display: 'flex', padding: '8px 0 20px' }}>
        {[
          { id: 'home', label: 'Home', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
          { id: 'checkin', label: 'Check in', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
          { id: 'lineup', label: 'Lineup', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
          { id: 'messages', label: 'Messages', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
          { id: 'profile', label: 'Profile', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
        ].map(tab => (
          <button key={tab.id} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 0', color: tab.id === 'profile' ? felt : neutral600 }}>
            {tab.icon}
            <span style={{ fontSize: 11, fontWeight: tab.id === 'profile' ? 600 : 400 }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
