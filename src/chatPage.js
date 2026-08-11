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
    .layout { min-height: min(720px, calc(100vh - 160px)); display: grid; grid-template-columns: 310px minmax(0, 1fr); border: 1px solid var(--line); border-radius: 16px; overflow: hidden; background: rgba(8, 27, 18, .94); box-shadow: 0 24px 70px rgba(0,0,0,.28); }
    .threads { border-right: 1px solid var(--line); background: #081a12; }
    .panel-title { min-height: 58px; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--line); font-weight: 900; }
    .panel-actions { display: flex; gap: 6px; }
    .panel-actions button { min-height: 36px; padding: 0 10px; background: transparent; color: #f4f7f5; }
    .new-direct { display: grid; gap: 8px; padding: 10px; border-bottom: 1px solid var(--line); background: #10251a; }
    .new-direct button { background: var(--green); color: #06120d; }
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
      .mobile-picker { display: grid; gap: 8px; }
      .mobile-picker .new-direct { padding: 0; border: 0; }
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
      <div><h1>Messages</h1><div class="subhead">Team and player coordination without sharing phone numbers.</div></div>
      <div class="status" data-status>Ready</div>
    </header>

    <div class="signed-out" data-signed-out hidden>
      <a href="/profile">Continue with Google</a> to open your messages.
    </div>

    <section class="layout" data-chat-layout hidden>
      <aside class="threads" aria-label="Conversations">
        <div class="panel-title">
          <span>Conversations</span>
          <div class="panel-actions"><button type="button" data-new-message>New</button><button type="button" data-refresh>Refresh</button></div>
        </div>
        <form class="new-direct" data-new-direct hidden>
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
            <select data-mobile-candidate-select aria-label="Choose a league player"></select>
            <button type="submit">Start message</button>
          </form>
        </div>
        <header class="panel-title">
          <div class="chat-title"><span data-chat-name>Select a conversation</span><small data-chat-season></small></div>
          <button class="block" data-block type="button" hidden>Block</button>
        </header>
        <div class="message-list" data-message-list role="log" aria-live="polite" aria-relevant="additions"></div>
        <form class="composer" data-composer>
          <textarea data-message-input maxlength="2000" rows="1" placeholder="Write a message" aria-label="Write a message" disabled></textarea>
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
    const blockButtonEl = document.querySelector('[data-block]');
    const messageListEl = document.querySelector('[data-message-list]');
    const composerEl = document.querySelector('[data-composer]');
    const messageInputEl = document.querySelector('[data-message-input]');
    const sendButtonEl = composerEl.querySelector('button[type="submit"]');
    const newDirectFormEl = document.querySelector('[data-new-direct]');
    const candidateSelectEl = document.querySelector('[data-candidate-select]');
    const mobileNewDirectFormEl = document.querySelector('[data-mobile-new-direct]');
    const mobileCandidateSelectEl = document.querySelector('[data-mobile-candidate-select]');
    let threads = [];
    let candidates = [];
    let currentKey = '';
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
        preview.textContent = thread.canSend === false ? 'Messaging unavailable' : (thread.preview || 'No messages yet');
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
    function renderThreads() {
      threadListEl.replaceChildren();
      threadSelectEl.replaceChildren();
      if (!threads.length) {
        threadListEl.append(emptyState('Join a team or start a player message.'));
        const option = document.createElement('option');
        option.textContent = 'No conversations';
        option.value = '';
        threadSelectEl.append(option);
        return;
      }
      const directGroup = document.createElement('optgroup');
      directGroup.label = 'Player messages';
      const teamGroup = document.createElement('optgroup');
      teamGroup.label = 'Team chats';
      appendSection('Player messages', threads.filter((thread) => thread.type === 'direct'), directGroup);
      appendSection('Team chats', threads.filter((thread) => thread.type === 'team'), teamGroup);
      if (directGroup.children.length) threadSelectEl.append(directGroup);
      if (teamGroup.children.length) threadSelectEl.append(teamGroup);
    }
    function renderCandidates() {
      for (const select of [candidateSelectEl, mobileCandidateSelectEl]) {
        select.replaceChildren();
        if (!candidates.length) {
          const option = document.createElement('option');
          option.value = '';
          option.textContent = 'No available players';
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
    function renderMessages(messages) {
      const nearBottom = messageListEl.scrollHeight - messageListEl.scrollTop - messageListEl.clientHeight < 100;
      messageListEl.replaceChildren();
      if (!messages.length) {
        messageListEl.append(emptyState('No messages yet. Start the conversation.'));
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
    function messagePath(thread, suffix = '') {
      const base = thread.type === 'team'
        ? '/api/teams/' + encodeURIComponent(thread.id)
        : '/api/direct-conversations/' + encodeURIComponent(thread.id);
      return base + '/messages' + suffix;
    }
    async function markRead(thread, messages) {
      const latest = messages[messages.length - 1];
      if (!latest) return;
      await api(messagePath(thread, '/read'), {
        method: 'POST', body: JSON.stringify({ readAt: latest.created_at }),
      });
    }
    async function loadMessages(quiet = false) {
      const thread = currentThread();
      if (!thread || loadingMessages) return;
      loadingMessages = true;
      const selectedKey = thread.key;
      try {
        if (!quiet) setStatus('Loading messages...');
        const body = await api(messagePath(thread) + '?limit=100');
        if (selectedKey !== currentKey) return;
        const messages = Array.isArray(body.messages) ? body.messages : [];
        renderMessages(messages);
        await markRead(thread, messages);
        if (!quiet) setStatus('Messages loaded', 'ok');
      } finally {
        loadingMessages = false;
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
      renderThreads();
      if (!thread) {
        messageListEl.replaceChildren(emptyState('Choose a conversation.'));
        return;
      }
      const url = new URL(location.href);
      url.searchParams.delete('team');
      url.searchParams.delete('direct');
      url.searchParams.set(thread.type, thread.id);
      history.replaceState({}, '', url.pathname + url.search);
      await loadMessages();
    }
    function normalizedTeamThreads(rows) {
      return rows.map((row) => ({
        key: 'team:' + row.team_id,
        type: 'team',
        id: row.team_id,
        name: row.team_name,
        season: row.season_name,
        preview: row.last_message_body,
        unread: row.unread_count,
        canSend: true,
      }));
    }
    function normalizedDirectThreads(rows) {
      return rows.map((row) => ({
        key: 'direct:' + row.conversation_id,
        type: 'direct',
        id: row.conversation_id,
        otherPlayerId: row.other_player_id,
        name: row.other_display_name,
        season: row.season_name,
        preview: row.last_message_body,
        unread: row.unread_count,
        canSend: row.can_send,
        blockedByMe: row.blocked_by_me,
      }));
    }
    async function loadThreads({ preserveSelection = true } = {}) {
      setStatus('Loading conversations...');
      const [teamBody, directBody, candidateBody] = await Promise.all([
        api('/api/me/chat-threads'),
        api('/api/me/direct-message-inbox'),
        api('/api/me/direct-message-candidates'),
      ]);
      threads = [
        ...normalizedDirectThreads(Array.isArray(directBody.conversations) ? directBody.conversations : []),
        ...normalizedTeamThreads(Array.isArray(teamBody.threads) ? teamBody.threads : []),
      ];
      candidates = Array.isArray(candidateBody.candidates) ? candidateBody.candidates : [];
      renderCandidates();
      const params = new URLSearchParams(location.search);
      const requestedKey = params.get('direct')
        ? 'direct:' + params.get('direct')
        : (params.get('team') ? 'team:' + params.get('team') : '');
      const existing = preserveSelection && threads.some((thread) => thread.key === currentKey)
        ? currentKey
        : '';
      const initial = existing
        || (threads.some((thread) => thread.key === requestedKey) ? requestedKey : '')
        || threads[0]?.key
        || '';
      await selectThread(initial);
      setStatus(threads.length ? 'Messages ready' : 'No conversations yet', threads.length ? 'ok' : 'muted');
    }
    async function sendMessage() {
      const thread = currentThread();
      const body = messageInputEl.value.trim();
      if (!thread || !body || thread.canSend === false) return;
      messageInputEl.disabled = true;
      sendButtonEl.disabled = true;
      setStatus('Sending...');
      try {
        await api(messagePath(thread), {
          method: 'POST',
          body: JSON.stringify({ body, clientMessageId: crypto.randomUUID() }),
        });
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
      setStatus('Starting player message...');
      const body = await api('/api/direct-conversations', {
        method: 'POST',
        body: JSON.stringify({ seasonId, playerId }),
      });
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
      await api('/api/players/' + encodeURIComponent(thread.otherPlayerId) + '/block', {
        method: unblocking ? 'DELETE' : 'POST',
        body: '{}',
      });
      await loadThreads({ preserveSelection: true });
      setStatus(unblocking ? 'Player unblocked' : 'Player blocked', 'ok');
    }
    async function run(action) {
      try { await action(); } catch (error) { setStatus(error.message, 'error'); }
    }

    threadListEl.addEventListener('click', (event) => {
      const button = event.target.closest('[data-thread-key]');
      if (button) run(() => selectThread(button.dataset.threadKey));
    });
    threadSelectEl.addEventListener('change', () => run(() => selectThread(threadSelectEl.value)));
    document.querySelector('[data-refresh]').addEventListener('click', () => run(() => loadThreads()));
    document.querySelector('[data-new-message]').addEventListener('click', () => { newDirectFormEl.hidden = !newDirectFormEl.hidden; });
    document.querySelector('[data-mobile-new]').addEventListener('click', () => { mobileNewDirectFormEl.hidden = !mobileNewDirectFormEl.hidden; });
    newDirectFormEl.addEventListener('submit', (event) => { event.preventDefault(); run(() => startDirectConversation(candidateSelectEl)); });
    mobileNewDirectFormEl.addEventListener('submit', (event) => { event.preventDefault(); run(() => startDirectConversation(mobileCandidateSelectEl)); });
    blockButtonEl.addEventListener('click', () => run(toggleBlock));
    composerEl.addEventListener('submit', (event) => { event.preventDefault(); run(sendMessage); });
    messageInputEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); run(sendMessage); }
    });

    signedOutEl.hidden = Boolean(token());
    layoutEl.hidden = !token();
    if (token()) run(() => loadThreads());
    setInterval(() => {
      if (!document.hidden && token() && currentKey) run(() => loadMessages(true));
    }, 4000);
  </script>
</body>
</html>`;
}
