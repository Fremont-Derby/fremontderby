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
    .layout { min-height: min(720px, calc(100vh - 160px)); display: grid; grid-template-columns: 300px minmax(0, 1fr); border: 1px solid var(--line); border-radius: 16px; overflow: hidden; background: rgba(8, 27, 18, .94); box-shadow: 0 24px 70px rgba(0,0,0,.28); }
    .threads { border-right: 1px solid var(--line); background: #081a12; }
    .panel-title { min-height: 58px; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--line); font-weight: 900; }
    .thread-list { display: grid; gap: 4px; padding: 8px; }
    .thread { width: 100%; min-height: 70px; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-content: center; gap: 5px 10px; padding: 10px; text-align: left; color: #f4f7f5; background: transparent; border-color: transparent; }
    .thread:hover, .thread[data-active="true"] { background: var(--panel-soft); border-color: var(--line); }
    .thread-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .thread-preview { color: var(--muted); font-size: .82rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .unread { min-width: 24px; height: 24px; display: grid; place-items: center; padding: 0 7px; border-radius: 999px; background: var(--gold); color: #171307; font-size: .75rem; font-weight: 950; }
    .mobile-picker { display: none; padding: 10px; border-bottom: 1px solid var(--line); }
    select { width: 100%; min-height: 46px; padding: 0 10px; background: #0b2418; color: #f4f7f5; }
    .chat { min-width: 0; display: grid; grid-template-rows: auto minmax(260px, 1fr) auto; }
    .chat-title { display: grid; gap: 2px; }
    .chat-title small { color: var(--muted); font-weight: 650; }
    .message-list { min-height: 0; overflow-y: auto; overscroll-behavior: contain; display: flex; flex-direction: column; gap: 10px; padding: 16px; }
    .message { max-width: min(78%, 600px); align-self: flex-start; padding: 10px 12px; border: 1px solid var(--line); border-radius: 14px 14px 14px 4px; background: #10291d; overflow-wrap: anywhere; }
    .message.mine { align-self: flex-end; border-radius: 14px 14px 4px 14px; background: #1f5f40; border-color: #3c8a60; }
    .message-meta { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 5px; color: #c8d8ce; font-size: .72rem; font-weight: 800; }
    .message-body { white-space: pre-wrap; line-height: 1.4; }
    .empty { margin: auto; max-width: 440px; padding: 24px; text-align: center; line-height: 1.55; }
    .composer { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; padding: 12px; border-top: 1px solid var(--line); background: #081a12; }
    textarea { width: 100%; min-height: 48px; max-height: 144px; resize: vertical; padding: 12px; background: #06110d; color: #f4f7f5; }
    .send { min-width: 92px; padding: 0 18px; border-color: var(--green); background: var(--green); color: #06120d; }
    .signed-out { margin: 14px 0; padding: 14px; border: 1px solid var(--gold); border-radius: 12px; background: #2a2311; color: #f6df9d; }
    .signed-out a { color: #fff2bf; font-weight: 900; }
    [hidden] { display: none !important; }
    button:focus-visible, textarea:focus-visible, select:focus-visible, a:focus-visible { outline: 3px solid #9ad6ae; outline-offset: 2px; }
    @media (max-width: 760px) {
      .app { padding: 12px 10px 18px; }
      .heading { align-items: start; display: grid; }
      .layout { min-height: calc(100dvh - 175px); grid-template-columns: 1fr; }
      .threads { display: none; }
      .mobile-picker { display: block; }
      .chat { grid-template-rows: auto auto minmax(260px, 1fr) auto; }
      .message-list { padding: 12px 10px; }
      .message { max-width: 88%; }
      .composer { position: sticky; bottom: 0; padding: 9px; grid-template-columns: minmax(0, 1fr) auto; }
      .send { min-width: 72px; padding: 0 12px; }
    }
  </style>
</head>
<body>
  <main class="app">
    <header class="heading">
      <div><h1>Messages</h1><div class="subhead">Private team coordination without sharing phone numbers.</div></div>
      <div class="status" data-status>Ready</div>
    </header>

    <div class="signed-out" data-signed-out hidden>
      <a href="/profile">Continue with Google</a> to open your team messages.
    </div>

    <section class="layout" data-chat-layout hidden>
      <aside class="threads" aria-label="Team conversations">
        <div class="panel-title"><span>Team chats</span><button type="button" data-refresh>Refresh</button></div>
        <div class="thread-list" data-thread-list></div>
      </aside>

      <section class="chat" aria-label="Current team chat">
        <div class="mobile-picker"><label><span hidden>Team chat</span><select data-thread-select aria-label="Choose team chat"></select></label></div>
        <header class="panel-title">
          <div class="chat-title"><span data-chat-name>Select a team</span><small data-chat-season></small></div>
        </header>
        <div class="message-list" data-message-list role="log" aria-live="polite" aria-relevant="additions"></div>
        <form class="composer" data-composer>
          <textarea data-message-input maxlength="2000" rows="1" placeholder="Message your team" aria-label="Message your team" disabled></textarea>
          <button class="send" type="submit" disabled>Send</button>
        </form>
      </section>
    </section>
  </main>

  <script>
    const config = ${safeJson(browserConfig(env))};
    const statusEl = document.querySelector('[data-status]');
    const signedOutEl = document.querySelector('[data-signed-out]');
    const layoutEl = document.querySelector('[data-chat-layout]');
    const threadListEl = document.querySelector('[data-thread-list]');
    const threadSelectEl = document.querySelector('[data-thread-select]');
    const chatNameEl = document.querySelector('[data-chat-name]');
    const chatSeasonEl = document.querySelector('[data-chat-season]');
    const messageListEl = document.querySelector('[data-message-list]');
    const composerEl = document.querySelector('[data-composer]');
    const messageInputEl = document.querySelector('[data-message-input]');
    const sendButtonEl = composerEl.querySelector('button[type="submit"]');
    let threads = [];
    let currentTeamId = '';
    let loadingMessages = false;

    function token() { return sessionStorage.getItem('fd.accessToken') || ''; }
    function refreshToken() { return sessionStorage.getItem('fd.refreshToken') || ''; }
    function setStatus(message, tone) {
      statusEl.textContent = message;
      statusEl.dataset.tone = tone || 'muted';
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
      if (!accessToken) throw new Error('Sign in is required');
      const response = await fetch(path, {
        ...options,
        headers: { authorization: 'Bearer ' + accessToken, 'content-type': 'application/json' },
      });
      if (response.status === 401 && retry && await refreshSession()) return api(path, options, false);
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
    function emptyState(message) {
      const div = document.createElement('div');
      div.className = 'empty';
      div.textContent = message;
      return div;
    }
    function currentThread() { return threads.find((thread) => thread.team_id === currentTeamId) || null; }
    function renderThreads() {
      threadListEl.replaceChildren();
      threadSelectEl.replaceChildren();
      if (!threads.length) {
        threadListEl.append(emptyState('Join a team to start chatting.'));
        const option = document.createElement('option');
        option.textContent = 'No team chats';
        option.value = '';
        threadSelectEl.append(option);
        return;
      }
      for (const thread of threads) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'thread';
        button.dataset.teamId = thread.team_id;
        button.dataset.active = String(thread.team_id === currentTeamId);
        const name = document.createElement('strong');
        name.className = 'thread-name';
        name.textContent = thread.team_name;
        const preview = document.createElement('span');
        preview.className = 'thread-preview';
        preview.textContent = thread.last_message_body || 'No messages yet';
        button.append(name);
        if (Number(thread.unread_count) > 0) {
          const unread = document.createElement('span');
          unread.className = 'unread';
          unread.textContent = String(thread.unread_count);
          unread.setAttribute('aria-label', String(thread.unread_count) + ' unread messages');
          button.append(unread);
        } else {
          button.append(document.createElement('span'));
        }
        button.append(preview);
        threadListEl.append(button);

        const option = document.createElement('option');
        option.value = thread.team_id;
        option.textContent = thread.team_name + (Number(thread.unread_count) ? ' (' + thread.unread_count + ')' : '');
        option.selected = thread.team_id === currentTeamId;
        threadSelectEl.append(option);
      }
    }
    function renderMessages(messages) {
      const nearBottom = messageListEl.scrollHeight - messageListEl.scrollTop - messageListEl.clientHeight < 100;
      messageListEl.replaceChildren();
      if (!messages.length) {
        messageListEl.append(emptyState('No messages yet. Start the team conversation.'));
        return;
      }
      for (const message of messages) {
        const article = document.createElement('article');
        article.className = 'message' + (message.is_own ? ' mine' : '');
        article.dataset.messageId = message.message_id;
        const meta = document.createElement('div');
        meta.className = 'message-meta';
        const author = document.createElement('span');
        author.textContent = message.author_display_name;
        const time = document.createElement('time');
        time.dateTime = message.created_at;
        time.textContent = formatTime(message.created_at);
        meta.append(author, time);
        const body = document.createElement('div');
        body.className = 'message-body';
        body.textContent = message.body;
        article.append(meta, body);
        messageListEl.append(article);
      }
      if (nearBottom || messageListEl.dataset.initial !== 'done') {
        messageListEl.scrollTop = messageListEl.scrollHeight;
      }
      messageListEl.dataset.initial = 'done';
    }
    async function markRead(messages) {
      const latest = messages[messages.length - 1];
      if (!latest || !currentTeamId) return;
      await api('/api/teams/' + encodeURIComponent(currentTeamId) + '/messages/read', {
        method: 'POST', body: JSON.stringify({ readAt: latest.created_at }),
      });
    }
    async function loadMessages(quiet = false) {
      if (!currentTeamId || loadingMessages) return;
      loadingMessages = true;
      try {
        if (!quiet) setStatus('Loading messages...');
        const selectedTeamId = currentTeamId;
        const body = await api('/api/teams/' + encodeURIComponent(selectedTeamId) + '/messages?limit=100');
        if (selectedTeamId !== currentTeamId) return;
        const messages = Array.isArray(body.messages) ? body.messages : [];
        renderMessages(messages);
        await markRead(messages);
        if (!quiet) setStatus('Messages loaded', 'ok');
      } finally {
        loadingMessages = false;
      }
    }
    async function selectThread(teamId) {
      currentTeamId = teamId || '';
      const thread = currentThread();
      chatNameEl.textContent = thread ? thread.team_name : 'Select a team';
      chatSeasonEl.textContent = thread ? thread.season_name : '';
      messageInputEl.disabled = !thread;
      sendButtonEl.disabled = !thread;
      messageListEl.dataset.initial = '';
      renderThreads();
      if (!thread) {
        messageListEl.replaceChildren(emptyState('Choose a team conversation.'));
        return;
      }
      const url = new URL(location.href);
      url.searchParams.set('team', currentTeamId);
      history.replaceState({}, '', url.pathname + url.search);
      await loadMessages();
    }
    async function loadThreads({ preserveSelection = true } = {}) {
      setStatus('Loading team chats...');
      const body = await api('/api/me/chat-threads');
      threads = Array.isArray(body.threads) ? body.threads : [];
      const requested = new URLSearchParams(location.search).get('team') || '';
      const existing = preserveSelection && threads.some((thread) => thread.team_id === currentTeamId) ? currentTeamId : '';
      const initial = existing || (threads.some((thread) => thread.team_id === requested) ? requested : '') || threads[0]?.team_id || '';
      await selectThread(initial);
      setStatus(threads.length ? 'Team chat ready' : 'No team chats yet', threads.length ? 'ok' : 'muted');
    }
    async function sendMessage() {
      const body = messageInputEl.value.trim();
      if (!body) return;
      messageInputEl.disabled = true;
      sendButtonEl.disabled = true;
      setStatus('Sending...');
      try {
        await api('/api/teams/' + encodeURIComponent(currentTeamId) + '/messages', {
          method: 'POST',
          body: JSON.stringify({ body, clientMessageId: crypto.randomUUID() }),
        });
        messageInputEl.value = '';
        await loadMessages(true);
        await loadThreads({ preserveSelection: true });
        setStatus('Sent', 'ok');
      } finally {
        messageInputEl.disabled = false;
        sendButtonEl.disabled = false;
        messageInputEl.focus();
      }
    }
    async function run(action) {
      try { await action(); } catch (error) { setStatus(error.message, 'error'); }
    }

    threadListEl.addEventListener('click', (event) => {
      const button = event.target.closest('[data-team-id]');
      if (button) run(() => selectThread(button.dataset.teamId));
    });
    threadSelectEl.addEventListener('change', () => run(() => selectThread(threadSelectEl.value)));
    document.querySelector('[data-refresh]').addEventListener('click', () => run(() => loadThreads()));
    composerEl.addEventListener('submit', (event) => { event.preventDefault(); run(sendMessage); });
    messageInputEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); run(sendMessage); }
    });

    signedOutEl.hidden = Boolean(token());
    layoutEl.hidden = !token();
    if (token()) run(() => loadThreads());
    setInterval(() => {
      if (!document.hidden && token() && currentTeamId) run(() => loadMessages(true));
    }, 4000);
  </script>
</body>
</html>`;
}
