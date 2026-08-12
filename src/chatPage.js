function browserConfig(env = {}) {
  return {
    supabaseUrl: env.SUPABASE_URL || '',
    supabasePublishableKey: env.SUPABASE_PUBLISHABLE_KEY || '',
  };
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, String.fromCharCode(92) + 'u003c');
}

export function renderChatPage(env = {}) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Messages · Fremont Derby</title>
  <style>
    :root {
      color-scheme: dark;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      background: #07150f;
      color: #f4f7f5;
      --panel: #0b2418;
      --panel-soft: #102d20;
      --line: #315d45;
      --muted: #afc1b6;
      --green: #39b979;
      --gold: #e9bd45;
      --danger: #ffaaa2;
    }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; background: radial-gradient(circle at 50% 0, #123b28, #07150f 34rem); }
    button, textarea, select { font: inherit; }
    button, select, textarea { border: 1px solid var(--line); border-radius: 11px; }
    button { min-height: 44px; cursor: pointer; font-weight: 850; }
    button:disabled { cursor: not-allowed; opacity: .55; }
    .app { width: min(1080px, 100%); margin: 0 auto; padding: 18px 16px 28px; }
    .heading { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
    h1 { margin: 0; font-size: clamp(1.8rem, 6vw, 2.8rem); letter-spacing: -.035em; }
    .subhead, .status, .empty { color: var(--muted); }
    .status[data-tone="error"] { color: var(--danger); }
    .status[data-tone="ok"] { color: #9ee5bd; }
    .state-card { margin: 14px 0; padding: 22px; display: grid; gap: 10px; border: 1px solid var(--line); border-radius: 16px; background: linear-gradient(145deg, rgba(16,45,32,.98), rgba(8,26,18,.98)); box-shadow: 0 18px 46px rgba(0,0,0,.22); }
    .state-card[data-tone="warning"] { border-color: #8a7133; box-shadow: inset 4px 0 #e9bd45, 0 18px 46px rgba(0,0,0,.22); }
    .state-card[data-tone="error"] { border-color: #87463f; box-shadow: inset 4px 0 #d66c62, 0 18px 46px rgba(0,0,0,.22); }
    .state-card h2 { margin: 0; font-size: 1.18rem; }
    .state-card p { margin: 0; color: #c6d5cc; line-height: 1.5; }
    .state-actions { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 3px; }
    .state-action { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; padding: 0 15px; border: 1px solid var(--green); border-radius: 11px; background: var(--green); color: #06120d; text-decoration: none; font-weight: 900; }
    .state-action.secondary { border-color: var(--line); background: #10291d; color: #e8f1eb; }
    .layout { min-height: min(720px, calc(100vh - 160px)); display: grid; grid-template-columns: 310px minmax(0, 1fr); border: 1px solid var(--line); border-radius: 16px; overflow: hidden; background: rgba(8, 27, 18, .94); box-shadow: 0 24px 70px rgba(0,0,0,.28); }
    .threads { border-right: 1px solid var(--line); background: #081a12; }
    .panel-title { min-height: 58px; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--line); font-weight: 900; }
    .panel-actions { display: flex; gap: 6px; }
    .panel-actions button { min-height: 36px; padding: 0 10px; background: transparent; color: #f4f7f5; }
    .new-direct { display: grid; gap: 8px; padding: 10px; border-bottom: 1px solid var(--line); background: #10251a; }
    .new-direct button { background: var(--green); color: #06120d; }
    .candidate-help { margin: 0; color: var(--muted); font-size: .82rem; line-height: 1.4; }
    .thread-list { display: grid; gap: 4px; padding: 8px; }
    .section-label { padding: 10px 10px 4px; color: var(--gold); font-size: .72rem; font-weight: 950; letter-spacing: .09em; text-transform: uppercase; }
    .thread { width: 100%; min-height: 70px; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-content: center; gap: 5px 10px; padding: 10px; text-align: left; color: #f4f7f5; background: transparent; border-color: transparent; }
    .thread:hover, .thread[data-active="true"] { background: var(--panel-soft); border-color: var(--line); }
    .thread-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .thread-preview { color: var(--muted); font-size: .82rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .unread { min-width: 24px; height: 24px; display: grid; place-items: center; padding: 0 7px; border-radius: 999px; background: var(--gold); color: #171307; font-size: .75rem; font-weight: 950; }
    .mobile-picker { display: none; padding: 10px; border-bottom: 1px solid var(--line); }
    select { width: 100%; min-height: 46px; padding: 0 10px; background: #0b2418; color: #f4f7f5; }
    .chat { min-width: 0; display: grid; grid-template-rows: auto minmax(260px, 1fr) auto; }
    .chat-title { display: grid; gap: 2px; min-width: 0; }
    .chat-title span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .chat-title small { color: var(--muted); font-weight: 650; }
    .block { min-height: 36px; padding: 0 10px; background: transparent; color: var(--danger); border-color: #7c413b; }
    .message-list { min-height: 0; overflow-y: auto; overscroll-behavior: contain; display: flex; flex-direction: column; gap: 10px; padding: 16px; }
    .older { align-self: center; min-height: 36px; padding: 0 12px; background: transparent; color: #cde3d5; }
    .message { max-width: min(78%, 600px); align-self: flex-start; padding: 10px 12px; border: 1px solid var(--line); border-radius: 14px 14px 14px 4px; background: #10291d; overflow-wrap: anywhere; }
    .message.mine { align-self: flex-end; border-radius: 14px 14px 4px 14px; background: #1f5f40; border-color: #3c8a60; }
    .message-meta { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 5px; color: #c8d8ce; font-size: .72rem; font-weight: 800; }
    .message-body { white-space: pre-wrap; line-height: 1.4; }
    .message-actions { display: flex; justify-content: flex-end; margin-top: 7px; }
    .report { min-height: 30px; padding: 0 8px; border: 0; background: transparent; color: #b9c8bf; font-size: .72rem; }
    .empty { margin: auto; max-width: 440px; padding: 24px; display: grid; gap: 12px; text-align: center; line-height: 1.55; }
    .empty strong { color: #f4f7f5; font-size: 1rem; }
    .empty-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
    .empty-actions button, .empty-actions a { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; padding: 0 13px; border: 1px solid var(--line); border-radius: 10px; background: #123522; color: #e8f1eb; text-decoration: none; font-weight: 850; }
    .empty-actions .primary { border-color: var(--green); background: var(--green); color: #06120d; }
    .composer { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; padding: 12px; border-top: 1px solid var(--line); background: #081a12; }
    textarea { width: 100%; min-height: 48px; max-height: 144px; resize: vertical; padding: 12px; background: #06110d; color: #f4f7f5; }
    .send { min-width: 92px; padding: 0 18px; border-color: var(--green); background: var(--green); color: #06120d; }
    dialog { width: min(440px, calc(100% - 24px)); padding: 0; border: 1px solid var(--line); border-radius: 16px; background: #0b2418; color: #f4f7f5; box-shadow: 0 24px 80px #000a; }
    dialog::backdrop { background: #020705c9; }
    .dialog-form { display: grid; gap: 12px; padding: 18px; }
    .dialog-form h2 { margin: 0; }
    .dialog-form label { display: grid; gap: 6px; color: var(--muted); font-weight: 750; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 8px; }
    .dialog-actions button { padding: 0 14px; background: transparent; color: #f4f7f5; }
    .dialog-actions .danger { background: #b84b42; border-color: #d36a61; }
    [hidden] { display: none !important; }
    button:focus-visible, textarea:focus-visible, select:focus-visible, a:focus-visible { outline: 3px solid #9ad6ae; outline-offset: 2px; }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; } }
    @media (max-width: 760px) {
      .app { padding: 12px 10px 18px; }
      .heading { align-items: start; display: grid; }
      .state-card { padding: 18px 16px; }
      .state-actions, .state-actions a, .state-actions button { width: 100%; }
      .layout { min-height: calc(100dvh - 175px); grid-template-columns: 1fr; }
      .threads { display: none; }
      .mobile-picker { display: grid; gap: 8px; }
      .mobile-picker .new-direct { padding: 0; border: 0; }
      .chat { grid-template-rows: auto auto minmax(260px, 1fr) auto; }
      .message-list { padding: 12px 10px; }
      .message { max-width: 88%; }
      .composer { position: sticky; bottom: 0; padding: 9px; grid-template-columns: minmax(0, 1fr) auto; }
      .send { min-width: 72px; padding: 0 12px; }
      .empty-actions, .empty-actions a, .empty-actions button { width: 100%; }
    }
  </style>
</head>
<body>
  <main class="app">
    <header class="heading">
      <div><h1>Messages</h1><div class="subhead">League, matchup, team, and player coordination without sharing phone numbers.</div></div>
      <div><a data-moderation-link href="/messages/moderation" hidden>Review reports</a><div class="status" data-status role="status" aria-live="polite" aria-atomic="true">Checking your messages…</div></div>
    </header>

    <section class="state-card" data-page-state data-tone="warning" hidden>
      <h2 data-page-state-title>Messages unavailable</h2>
      <p data-page-state-detail></p>
      <div class="state-actions" data-page-state-actions></div>
    </section>

    <section class="state-card" data-signed-out data-tone="warning" hidden>
      <h2 data-signed-out-title>Coordinate league night in one place</h2>
      <p data-signed-out-detail>Sign in to read league, matchup, team, and player messages without sharing your phone number.</p>
      <div class="state-actions"><a class="state-action" href="/profile">Sign in to message</a></div>
    </section>

    <section class="layout" data-chat-layout hidden>
      <aside class="threads" aria-label="Conversations">
        <div class="panel-title">
          <span>Conversations</span>
          <div class="panel-actions"><button type="button" data-new-message>New</button><button type="button" data-refresh>Refresh</button></div>
        </div>
        <form class="new-direct" data-new-direct hidden>
          <p class="candidate-help" data-candidate-help hidden>No other registered players are available to message yet.</p>
          <select data-candidate-select aria-label="Choose a league player"></select>
          <button type="submit">Start message</button>
        </form>
        <div class="thread-list" data-thread-list></div>
      </aside>

      <section class="chat" aria-label="Current conversation">
        <div class="mobile-picker">
          <select data-thread-select aria-label="Choose conversation"></select>
          <button type="button" data-mobile-new>New player message</button>
          <form class="new-direct" data-mobile-new-direct hidden>
            <p class="candidate-help" data-mobile-candidate-help hidden>No other registered players are available to message yet.</p>
            <select data-mobile-candidate-select aria-label="Choose a league player"></select>
            <button type="submit">Start message</button>
          </form>
        </div>
        <header class="panel-title">
          <div class="chat-title"><span data-chat-name>Select a conversation</span><small data-chat-season></small></div>
          <button class="block" data-block type="button" hidden>Block</button>
        </header>
        <div class="message-list" data-message-list role="log" aria-live="polite" aria-relevant="additions"><button class="older" type="button" data-load-older hidden>Load older messages</button></div>
        <form class="composer" data-composer>
          <textarea data-message-input maxlength="2000" rows="1" placeholder="Write a message" aria-label="Write a message" disabled></textarea>
          <button class="send" type="submit" disabled>Send</button>
        </form>
      </section>
    </section>

    <dialog data-report-dialog>
      <form class="dialog-form" data-report-form>
        <h2>Report message</h2>
        <div class="subhead">League admins can review the message and your report.</div>
        <label>Reason
          <select data-report-reason>
            <option value="harassment">Harassment</option>
            <option value="spam">Spam</option>
            <option value="privacy">Private information</option>
            <option value="threat">Threat or safety concern</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>Details (optional)
          <textarea data-report-details maxlength="1000" rows="4" placeholder="Add context for the league admins"></textarea>
        </label>
        <div class="dialog-actions">
          <button type="button" data-report-cancel>Cancel</button>
          <button class="danger" type="submit">Submit report</button>
        </div>
      </form>
    </dialog>
  </main>

  <script>
    const config = ${safeJson(browserConfig(env))};
    const statusEl = document.querySelector('[data-status]');
    const signedOutEl = document.querySelector('[data-signed-out]');
    const signedOutTitleEl = document.querySelector('[data-signed-out-title]');
    const signedOutDetailEl = document.querySelector('[data-signed-out-detail]');
    const pageStateEl = document.querySelector('[data-page-state]');
    const pageStateTitleEl = document.querySelector('[data-page-state-title]');
    const pageStateDetailEl = document.querySelector('[data-page-state-detail]');
    const pageStateActionsEl = document.querySelector('[data-page-state-actions]');
    const layoutEl = document.querySelector('[data-chat-layout]');
    const threadListEl = document.querySelector('[data-thread-list]');
    const threadSelectEl = document.querySelector('[data-thread-select]');
    const chatNameEl = document.querySelector('[data-chat-name]');
    const chatSeasonEl = document.querySelector('[data-chat-season]');
    const blockButtonEl = document.querySelector('[data-block]');
    const messageListEl = document.querySelector('[data-message-list]');
    const loadOlderButtonEl = document.querySelector('[data-load-older]');
    const composerEl = document.querySelector('[data-composer]');
    const messageInputEl = document.querySelector('[data-message-input]');
    const sendButtonEl = composerEl.querySelector('button[type="submit"]');
    const newMessageButtonEl = document.querySelector('[data-new-message]');
    const mobileNewMessageButtonEl = document.querySelector('[data-mobile-new]');
    const newDirectFormEl = document.querySelector('[data-new-direct]');
    const candidateSelectEl = document.querySelector('[data-candidate-select]');
    const candidateHelpEl = document.querySelector('[data-candidate-help]');
    const mobileNewDirectFormEl = document.querySelector('[data-mobile-new-direct]');
    const mobileCandidateSelectEl = document.querySelector('[data-mobile-candidate-select]');
    const mobileCandidateHelpEl = document.querySelector('[data-mobile-candidate-help]');
    const reportDialogEl = document.querySelector('[data-report-dialog]');
    const reportFormEl = document.querySelector('[data-report-form]');
    const reportReasonEl = document.querySelector('[data-report-reason]');
    const reportDetailsEl = document.querySelector('[data-report-details]');
    let threads = [];
    let candidates = [];
    let currentKey = '';
    let loadingMessages = false;
    let displayedMessages = [];
    let canLoadOlder = false;
    let reachedConversationStart = false;
    let reportingMessageId = '';

    function token() { return sessionStorage.getItem('fd.accessToken') || ''; }
    function refreshToken() { return sessionStorage.getItem('fd.refreshToken') || ''; }
    function setStatus(message, tone) {
      statusEl.textContent = message;
      statusEl.dataset.tone = tone || 'muted';
    }
    function clearSession() {
      sessionStorage.removeItem('fd.accessToken');
      sessionStorage.removeItem('fd.refreshToken');
    }
    function makeAction(label, { href, onClick, secondary = false } = {}) {
      const action = href ? document.createElement('a') : document.createElement('button');
      if (!href) action.type = 'button';
      action.className = 'state-action' + (secondary ? ' secondary' : '');
      action.textContent = label;
      if (href) action.href = href;
      if (onClick) action.addEventListener('click', onClick);
      return action;
    }
    function showPageState(title, detail, { tone = 'warning', actions = [] } = {}) {
      pageStateTitleEl.textContent = title;
      pageStateDetailEl.textContent = detail;
      pageStateEl.dataset.tone = tone;
      pageStateActionsEl.replaceChildren(...actions);
      pageStateEl.hidden = false;
    }
    function hidePageState() { pageStateEl.hidden = true; }
    function showSignedOut(expired = false) {
      clearSession();
      layoutEl.hidden = true;
      hidePageState();
      const matchupId = new URLSearchParams(location.search).get('matchup');
      signedOutTitleEl.textContent = expired ? 'Your sign-in expired' : (matchupId ? 'Sign in to open this matchup thread' : 'Coordinate league night in one place');
      signedOutDetailEl.textContent = expired
        ? 'Sign in again to reopen your conversations. Your messages were not changed.'
        : (matchupId
          ? 'After you sign in we will open the matchup conversation linked from the schedule.'
          : 'Sign in to read league, matchup, team, and player messages without sharing your phone number.');
      signedOutEl.hidden = false;
      setStatus(expired ? 'Sign in again to open messages' : 'Sign in to open messages', expired ? 'error' : 'muted');
    }
    async function parseJson(response) {
      const text = await response.text();
      if (!text) return {};
      try { return JSON.parse(text); } catch { return { error: text }; }
    }
    async function refreshSession() {
      if (!config.supabaseUrl || !config.supabasePublishableKey || !refreshToken()) return false;
      const response = await fetch(config.supabaseUrl.replace(/\\\/+$/, '') + '/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        headers: { apikey: config.supabasePublishableKey, 'content-type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken() }),
      });
      if (!response.ok) return false;
      const body = await parseJson(response);
      if (!body.access_token) return false;
      sessionStorage.setItem('fd.accessToken', body.access_token);
      if (body.refresh_token) sessionStorage.setItem('fd.refreshToken', body.refresh_token);
      return true;
    }
    async function api(path, options = {}, retry = true) {
      const accessToken = token();
      if (!accessToken) {
        const error = new Error('Sign in is required');
        error.code = 'session_required';
        throw error;
      }
      const response = await fetch(path, {
        ...options,
        headers: { authorization: 'Bearer ' + accessToken, 'content-type': 'application/json' },
      });
      if (response.status === 401 && retry) {
        if (await refreshSession()) return api(path, options, false);
        const error = new Error('Your sign-in expired');
        error.code = 'session_expired';
        throw error;
      }
      const body = await parseJson(response);
      if (!response.ok) throw new Error(body.error || 'Request failed');
      return body;
    }
    function formatTime(value) {
      if (!value) return '';
      const date = new Date(value);
      if (Number.isNaN(date.valueOf())) return '';
      return new Intl.DateTimeFormat([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
    }
    function emptyState(title, detail, actions = []) {
      const div = document.createElement('div');
      div.className = 'empty';
      const strong = document.createElement('strong');
      strong.textContent = title;
      const copy = document.createElement('span');
      copy.textContent = detail;
      div.append(strong, copy);
      if (actions.length) {
        const actionRow = document.createElement('div');
        actionRow.className = 'empty-actions';
        actionRow.append(...actions);
        div.append(actionRow);
      }
      return div;
    }
    function emptyLink(label, href, primary = false) {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      if (primary) link.className = 'primary';
      return link;
    }
    function emptyButton(label, handler, primary = false) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      if (primary) button.className = 'primary';
      button.addEventListener('click', handler);
      return button;
    }
    function currentThread() { return threads.find((thread) => thread.key === currentKey) || null; }
    function appendSection(label, sectionThreads, group) {
      if (!sectionThreads.length) return;
      const sectionLabel = document.createElement('div');
      sectionLabel.className = 'section-label';
      sectionLabel.textContent = label;
      threadListEl.append(sectionLabel);
      for (const thread of sectionThreads) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'thread';
        button.dataset.threadKey = thread.key;
        button.dataset.active = String(thread.key === currentKey);
        const name = document.createElement('strong');
        name.className = 'thread-name';
        name.textContent = thread.name;
        const preview = document.createElement('span');
        preview.className = 'thread-preview';
        preview.textContent = thread.canSend === false
          ? (thread.type === 'league' || thread.type === 'matchup' ? 'Read-only' : 'Messaging unavailable')
          : (thread.preview || 'No messages yet');
        button.append(name);
        if (Number(thread.unread) > 0) {
          const unread = document.createElement('span');
          unread.className = 'unread';
          unread.textContent = String(thread.unread);
          unread.setAttribute('aria-label', String(thread.unread) + ' unread messages');
          button.append(unread);
        } else {
          button.append(document.createElement('span'));
        }
        button.append(preview);
        threadListEl.append(button);

        const option = document.createElement('option');
        option.value = thread.key;
        option.textContent = thread.name + (Number(thread.unread) ? ' (' + thread.unread + ')' : '');
        option.selected = thread.key === currentKey;
        group.append(option);
      }
    }
    function openNewMessage() {
      if (!candidates.length) {
        setStatus('No other registered players are available to message yet');
        return;
      }
      newDirectFormEl.hidden = !newDirectFormEl.hidden;
    }
    function openMobileNewMessage() {
      if (!candidates.length) {
        setStatus('No other registered players are available to message yet');
        return;
      }
      mobileNewDirectFormEl.hidden = !mobileNewDirectFormEl.hidden;
    }
    function renderThreads() {
      threadListEl.replaceChildren();
      threadSelectEl.replaceChildren();
      if (!threads.length) {
        const actions = candidates.length
          ? [emptyButton('Start a player message', () => { newDirectFormEl.hidden = false; candidateSelectEl.focus(); }, true)]
          : [emptyLink('Open Teams', '/teams', true), emptyLink('See tonight', '/schedule')];
        threadListEl.append(emptyState(
          'No conversations yet',
          candidates.length
            ? 'You can start a private league message with an eligible player.'
            : 'Join a team or league-night matchup to unlock team, matchup, and player conversations.',
          actions,
        ));
        const option = document.createElement('option');
        option.textContent = 'No conversations';
        option.value = '';
        threadSelectEl.append(option);
        return;
      }
      const leagueGroup = document.createElement('optgroup');
      leagueGroup.label = 'League rooms';
      const matchupGroup = document.createElement('optgroup');
      matchupGroup.label = 'Matchup rooms';
      const directGroup = document.createElement('optgroup');
      directGroup.label = 'Player messages';
      const teamGroup = document.createElement('optgroup');
      teamGroup.label = 'Team chats';
      appendSection('League rooms', threads.filter((thread) => thread.type === 'league'), leagueGroup);
      appendSection('Matchup rooms', threads.filter((thread) => thread.type === 'matchup'), matchupGroup);
      appendSection('Player messages', threads.filter((thread) => thread.type === 'direct'), directGroup);
      appendSection('Team chats', threads.filter((thread) => thread.type === 'team'), teamGroup);
      if (leagueGroup.children.length) threadSelectEl.append(leagueGroup);
      if (matchupGroup.children.length) threadSelectEl.append(matchupGroup);
      if (directGroup.children.length) threadSelectEl.append(directGroup);
      if (teamGroup.children.length) threadSelectEl.append(teamGroup);
    }
    function renderCandidates() {
      const hasCandidates = candidates.length > 0;
      newMessageButtonEl.disabled = !hasCandidates;
      mobileNewMessageButtonEl.disabled = !hasCandidates;
      newMessageButtonEl.title = hasCandidates ? '' : 'No other registered players are available to message yet';
      mobileNewMessageButtonEl.title = newMessageButtonEl.title;
      candidateHelpEl.hidden = hasCandidates;
      mobileCandidateHelpEl.hidden = hasCandidates;
      if (!hasCandidates) {
        newDirectFormEl.hidden = true;
        mobileNewDirectFormEl.hidden = true;
      }
      for (const select of [candidateSelectEl, mobileCandidateSelectEl]) {
        select.replaceChildren();
        if (!hasCandidates) {
          const option = document.createElement('option');
          option.value = '';
          option.textContent = 'No eligible players to message';
          select.append(option);
          select.disabled = true;
          continue;
        }
        select.disabled = false;
        for (const candidate of candidates) {
          const option = document.createElement('option');
          option.value = candidate.season_id + '|' + candidate.player_id;
          option.textContent = candidate.display_name + ' · ' + candidate.season_name;
          select.append(option);
        }
      }
    }
    function renderMessages(messages, { keepPosition = false } = {}) {
      const nearBottom = messageListEl.scrollHeight - messageListEl.scrollTop - messageListEl.clientHeight < 100;
      messageListEl.replaceChildren();
      loadOlderButtonEl.hidden = !canLoadOlder;
      messageListEl.append(loadOlderButtonEl);
      if (!messages.length) {
        messageListEl.append(emptyState('No messages yet', 'Send the first message when you are ready.'));
        return;
      }
      for (const message of messages) {
        const article = document.createElement('article');
        article.className = 'message' + (message.is_own ? ' mine' : '');
        article.dataset.messageId = message.message_id;
        const meta = document.createElement('div');
        meta.className = 'message-meta';
        const author = document.createElement('span');
        author.textContent = message.author_display_name
          + (message.author_team_name ? ' · ' + message.author_team_name : '');
        const time = document.createElement('time');
        time.dateTime = message.created_at;
        time.textContent = formatTime(message.created_at);
        meta.append(author, time);
        const body = document.createElement('div');
        body.className = 'message-body';
        body.textContent = message.body;
        article.append(meta, body);
        if (!message.is_own) {
          const actions = document.createElement('div');
          actions.className = 'message-actions';
          const report = document.createElement('button');
          report.type = 'button';
          report.className = 'report';
          report.dataset.reportMessage = message.message_id;
          report.textContent = 'Report';
          actions.append(report);
          article.append(actions);
        }
        messageListEl.append(article);
      }
      if (!keepPosition && (nearBottom || messageListEl.dataset.initial !== 'done')) {
        messageListEl.scrollTop = messageListEl.scrollHeight;
      }
      messageListEl.dataset.initial = 'done';
    }
    function messagePath(thread, suffix = '') {
      const base = thread.type === 'team'
        ? '/api/teams/' + encodeURIComponent(thread.id)
        : (thread.type === 'direct'
          ? '/api/direct-conversations/' + encodeURIComponent(thread.id)
          : (thread.type === 'league'
            ? '/api/seasons/' + encodeURIComponent(thread.id)
            : '/api/team-matches/' + encodeURIComponent(thread.id)));
      return base + '/messages' + suffix;
    }
    async function markRead(thread, messages) {
      const latest = messages[messages.length - 1];
      if (!latest) return;
      await api(messagePath(thread, '/read'), {
        method: 'POST', body: JSON.stringify({ readAt: latest.created_at }),
      });
      window.dispatchEvent(new CustomEvent('fd:messages-read'));
    }
    async function loadMessages(quiet = false) {
      const thread = currentThread();
      if (!thread || loadingMessages) return;
      loadingMessages = true;
      const selectedKey = thread.key;
      try {
        if (!quiet) setStatus('Loading messages…');
        const body = await api(messagePath(thread) + '?limit=50');
        if (selectedKey !== currentKey) return;
        const messages = Array.isArray(body.messages) ? body.messages : [];
        if (quiet) {
          const byId = new Map(displayedMessages.map((message) => [message.message_id, message]));
          for (const message of messages) byId.set(message.message_id, message);
          displayedMessages = [...byId.values()].sort((a, b) =>
            a.created_at.localeCompare(b.created_at) || a.message_id.localeCompare(b.message_id));
          canLoadOlder = !reachedConversationStart && (canLoadOlder || messages.length === 50);
        } else {
          displayedMessages = messages;
          canLoadOlder = messages.length === 50;
          reachedConversationStart = messages.length < 50;
        }
        renderMessages(displayedMessages);
        await markRead(thread, displayedMessages);
        if (!quiet) setStatus('Messages loaded', 'ok');
      } finally {
        loadingMessages = false;
      }
    }
    async function loadOlderMessages() {
      const thread = currentThread();
      const oldest = displayedMessages[0];
      if (!thread || !oldest || !canLoadOlder || loadingMessages) return;
      loadingMessages = true;
      loadOlderButtonEl.disabled = true;
      const priorHeight = messageListEl.scrollHeight;
      try {
        const query = '?limit=50&before=' + encodeURIComponent(oldest.created_at)
          + '&beforeMessageId=' + encodeURIComponent(oldest.message_id);
        const body = await api(messagePath(thread) + query);
        const older = Array.isArray(body.messages) ? body.messages : [];
        const byId = new Map([...older, ...displayedMessages].map((message) => [message.message_id, message]));
        displayedMessages = [...byId.values()].sort((a, b) =>
          a.created_at.localeCompare(b.created_at) || a.message_id.localeCompare(b.message_id));
        canLoadOlder = older.length === 50;
        reachedConversationStart = older.length < 50;
        renderMessages(displayedMessages, { keepPosition: true });
        messageListEl.scrollTop = messageListEl.scrollHeight - priorHeight;
        setStatus(older.length ? 'Older messages loaded' : 'Beginning of conversation', 'ok');
      } finally {
        loadingMessages = false;
        loadOlderButtonEl.disabled = false;
      }
    }
    async function selectThread(key) {
      currentKey = key || '';
      const thread = currentThread();
      chatNameEl.textContent = thread ? thread.name : 'Select a conversation';
      chatSeasonEl.textContent = thread ? thread.season : '';
      const canSend = Boolean(thread && thread.canSend !== false);
      messageInputEl.disabled = !canSend;
      sendButtonEl.disabled = !canSend;
      messageInputEl.placeholder = canSend ? 'Write a message' : 'Messaging unavailable';
      blockButtonEl.hidden = !thread || thread.type !== 'direct' || (thread.canSend === false && !thread.blockedByMe);
      blockButtonEl.textContent = thread?.blockedByMe ? 'Unblock' : 'Block';
      messageListEl.dataset.initial = '';
      displayedMessages = [];
      canLoadOlder = false;
      reachedConversationStart = false;
      renderThreads();
      if (!thread) {
        const actions = candidates.length
          ? [emptyButton('Start a player message', () => { mobileNewDirectFormEl.hidden = false; mobileCandidateSelectEl.focus(); }, true)]
          : [emptyLink('Open Teams', '/teams', true), emptyLink('See tonight', '/schedule')];
        messageListEl.replaceChildren(emptyState(
          'No conversations yet',
          candidates.length
            ? 'Start a player message or wait for a team, matchup, or league room to appear.'
            : 'Join a team or league-night matchup to unlock conversations.',
          actions,
        ));
        return;
      }
      const url = new URL(location.href);
      url.searchParams.delete('team');
      url.searchParams.delete('direct');
      url.searchParams.delete('league');
      url.searchParams.delete('matchup');
      url.searchParams.set(thread.type, thread.id);
      history.replaceState({}, '', url.pathname + url.search);
      await loadMessages();
    }
    function normalizedTeamThreads(rows) {
      return rows.map((row) => ({ key: 'team:' + row.team_id, type: 'team', id: row.team_id, name: row.team_name, season: row.season_name, preview: row.last_message_body, unread: row.unread_count, canSend: true }));
    }
    function normalizedDirectThreads(rows) {
      return rows.map((row) => ({ key: 'direct:' + row.conversation_id, type: 'direct', id: row.conversation_id, otherPlayerId: row.other_player_id, name: row.other_display_name, season: row.season_name, preview: row.last_message_body, unread: row.unread_count, canSend: row.can_send, blockedByMe: row.blocked_by_me }));
    }
    function normalizedLeagueThreads(rows) {
      return rows.map((row) => ({ key: 'league:' + row.season_id, type: 'league', id: row.season_id, name: 'League room', season: row.season_name, preview: row.last_message_body, unread: row.unread_count, canSend: row.can_send }));
    }
    function normalizedMatchupThreads(rows) {
      return rows.map((row) => ({ key: 'matchup:' + row.team_match_id, type: 'matchup', id: row.team_match_id, name: row.team_a_name + ' vs ' + row.team_b_name, season: row.season_name + ' · Round ' + row.round_number, preview: row.last_message_body, unread: row.unread_count, canSend: row.can_send }));
    }
    async function loadThreads({ preserveSelection = true } = {}) {
      signedOutEl.hidden = true;
      hidePageState();
      layoutEl.hidden = false;
      setStatus('Loading conversations…');
      const [teamBody, directBody, leagueBody, matchupBody, candidateBody] = await Promise.all([
        api('/api/me/chat-threads'),
        api('/api/me/direct-message-inbox'),
        api('/api/me/league-chat-threads'),
        api('/api/me/matchup-chat-threads'),
        api('/api/me/direct-message-candidates'),
      ]);
      threads = [
        ...normalizedLeagueThreads(Array.isArray(leagueBody.threads) ? leagueBody.threads : []),
        ...normalizedMatchupThreads(Array.isArray(matchupBody.threads) ? matchupBody.threads : []),
        ...normalizedDirectThreads(Array.isArray(directBody.conversations) ? directBody.conversations : []),
        ...normalizedTeamThreads(Array.isArray(teamBody.threads) ? teamBody.threads : []),
      ];
      candidates = Array.isArray(candidateBody.candidates) ? candidateBody.candidates : [];
      renderCandidates();
      const params = new URLSearchParams(location.search);
      const requestedKey = params.get('direct')
        ? 'direct:' + params.get('direct')
        : (params.get('team')
          ? 'team:' + params.get('team')
          : (params.get('league')
            ? 'league:' + params.get('league')
            : (params.get('matchup') ? 'matchup:' + params.get('matchup') : '')));
      const existing = preserveSelection && threads.some((thread) => thread.key === currentKey) ? currentKey : '';
      const initial = existing
        || (threads.some((thread) => thread.key === requestedKey) ? requestedKey : '')
        || threads[0]?.key
        || '';
      await selectThread(initial);
      setStatus(threads.length ? 'Messages ready' : 'No conversations yet', threads.length ? 'ok' : 'muted');
    }
    async function refreshThreadMetadata() {
      const [teamBody, directBody, leagueBody, matchupBody, candidateBody] = await Promise.all([
        api('/api/me/chat-threads'), api('/api/me/direct-message-inbox'), api('/api/me/league-chat-threads'), api('/api/me/matchup-chat-threads'), api('/api/me/direct-message-candidates'),
      ]);
      threads = [
        ...normalizedLeagueThreads(Array.isArray(leagueBody.threads) ? leagueBody.threads : []),
        ...normalizedMatchupThreads(Array.isArray(matchupBody.threads) ? matchupBody.threads : []),
        ...normalizedDirectThreads(Array.isArray(directBody.conversations) ? directBody.conversations : []),
        ...normalizedTeamThreads(Array.isArray(teamBody.threads) ? teamBody.threads : []),
      ];
      candidates = Array.isArray(candidateBody.candidates) ? candidateBody.candidates : [];
      renderCandidates();
      renderThreads();
    }
    async function detectModerator() {
      try {
        await api('/api/admin/chat-reports?limit=1');
        document.querySelector('[data-moderation-link]').hidden = false;
      } catch (error) {
        if (!/League admin access/i.test(error.message)) throw error;
      }
    }
    async function sendMessage() {
      const thread = currentThread();
      const body = messageInputEl.value.trim();
      if (!thread || !body || thread.canSend === false) return;
      messageInputEl.disabled = true;
      sendButtonEl.disabled = true;
      setStatus('Sending…');
      try {
        await api(messagePath(thread), { method: 'POST', body: JSON.stringify({ body, clientMessageId: crypto.randomUUID() }) });
        messageInputEl.value = '';
        await loadThreads({ preserveSelection: true });
        setStatus('Sent', 'ok');
      } finally {
        const latestThread = currentThread();
        const enabled = Boolean(latestThread && latestThread.canSend !== false);
        messageInputEl.disabled = !enabled;
        sendButtonEl.disabled = !enabled;
        if (enabled) messageInputEl.focus();
      }
    }
    async function startDirectConversation(select) {
      const value = select.value;
      if (!value) throw new Error('Choose a player');
      const [seasonId, playerId] = value.split('|');
      setStatus('Starting player message…');
      const body = await api('/api/direct-conversations', { method: 'POST', body: JSON.stringify({ seasonId, playerId }) });
      newDirectFormEl.hidden = true;
      mobileNewDirectFormEl.hidden = true;
      currentKey = 'direct:' + body.conversation.conversation_id;
      await loadThreads({ preserveSelection: true });
    }
    async function toggleBlock() {
      const thread = currentThread();
      if (!thread || thread.type !== 'direct') return;
      const unblocking = Boolean(thread.blockedByMe);
      if (!unblocking && !window.confirm('Block ' + thread.name + '? You will not be able to message each other.')) return;
      await api('/api/players/' + encodeURIComponent(thread.otherPlayerId) + '/block', { method: unblocking ? 'DELETE' : 'POST', body: '{}' });
      await loadThreads({ preserveSelection: true });
      setStatus(unblocking ? 'Player unblocked' : 'Player blocked', 'ok');
    }
    function openReport(messageId) {
      reportingMessageId = messageId;
      reportReasonEl.value = 'harassment';
      reportDetailsEl.value = '';
      reportDialogEl.showModal();
    }
    async function submitReport() {
      const thread = currentThread();
      if (!thread || !reportingMessageId) return;
      await api('/api/chat-reports', {
        method: 'POST',
        body: JSON.stringify({ messageType: thread.type, messageId: reportingMessageId, reason: reportReasonEl.value, details: reportDetailsEl.value }),
      });
      reportDialogEl.close();
      reportingMessageId = '';
      setStatus('Report submitted to league admins', 'ok');
    }
    function friendlyFailure(error) {
      const message = String(error?.message || '');
      if (/supabase|bearer|uuid|rpc|permission denied|schema private|postgres|request failed/i.test(message)) return 'We could not load your conversations.';
      return message || 'We could not load your conversations.';
    }
    function handleError(error, { loadFailure = false } = {}) {
      if (error?.code === 'session_expired' || error?.code === 'session_required') {
        showSignedOut(error.code === 'session_expired');
        return;
      }
      const message = friendlyFailure(error);
      setStatus(message, 'error');
      if (loadFailure) {
        layoutEl.hidden = true;
        showPageState('Couldn’t load messages', 'Your conversations could not be loaded. Your sign-in is still active, so you can try again.', {
          tone: 'error',
          actions: [makeAction('Try again', { onClick: () => runLoadThreads() }), makeAction('See tonight', { href: '/schedule', secondary: true })],
        });
      }
    }
    async function run(action) {
      try { await action(); } catch (error) { handleError(error); }
    }
    async function runLoadThreads() {
      hidePageState();
      try { await loadThreads(); } catch (error) { handleError(error, { loadFailure: true }); }
    }

    threadListEl.addEventListener('click', (event) => {
      const button = event.target.closest('[data-thread-key]');
      if (button) run(() => selectThread(button.dataset.threadKey));
    });
    threadSelectEl.addEventListener('change', () => run(() => selectThread(threadSelectEl.value)));
    document.querySelector('[data-refresh]').addEventListener('click', runLoadThreads);
    newMessageButtonEl.addEventListener('click', openNewMessage);
    mobileNewMessageButtonEl.addEventListener('click', openMobileNewMessage);
    newDirectFormEl.addEventListener('submit', (event) => { event.preventDefault(); run(() => startDirectConversation(candidateSelectEl)); });
    mobileNewDirectFormEl.addEventListener('submit', (event) => { event.preventDefault(); run(() => startDirectConversation(mobileCandidateSelectEl)); });
    blockButtonEl.addEventListener('click', () => run(toggleBlock));
    loadOlderButtonEl.addEventListener('click', () => run(loadOlderMessages));
    messageListEl.addEventListener('click', (event) => {
      const button = event.target.closest('[data-report-message]');
      if (button) openReport(button.dataset.reportMessage);
    });
    document.querySelector('[data-report-cancel]').addEventListener('click', () => reportDialogEl.close());
    reportFormEl.addEventListener('submit', (event) => { event.preventDefault(); run(submitReport); });
    composerEl.addEventListener('submit', (event) => { event.preventDefault(); run(sendMessage); });
    messageInputEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); run(sendMessage); }
    });

    if (token()) {
      signedOutEl.hidden = true;
      layoutEl.hidden = false;
      runLoadThreads();
      run(detectModerator);
    } else {
      showSignedOut(false);
    }
    let pollCount = 0;
    setInterval(() => {
      if (!document.hidden && token() && currentKey) run(() => loadMessages(true));
      pollCount += 1;
      if (!document.hidden && token() && pollCount % 4 === 0) run(refreshThreadMetadata);
    }, 4000);
  </script>
</body>
</html>`;
}
