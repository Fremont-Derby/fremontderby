const MARKER = 'data-season-lifecycle-workflow';

export async function enhanceSeasonLifecycle(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  let html = await response.text();
  if (html.includes(MARKER)) {
    return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
  }

  const ui = `
    <style data-season-lifecycle-style>
      [data-season-lifecycle-workflow]{margin-top:14px;padding:14px;display:grid;gap:12px}
      [data-season-lifecycle-workflow] .actions{display:flex;flex-wrap:wrap;gap:10px}
      [data-season-lifecycle-workflow] button{min-height:48px;min-width:44px;padding:0 16px}
      [data-season-lifecycle-workflow] textarea{min-height:88px;width:100%;padding:10px;border-radius:10px;border:1px solid var(--line);background:rgba(0,0,0,.2);color:inherit}
      [data-season-lifecycle-state]{line-height:1.45}
      @media(max-width:620px){[data-season-lifecycle-workflow] button{width:100%}}
    </style>
    <section ${MARKER} class="panel" aria-labelledby="season-lifecycle-title">
      <div>
        <strong id="season-lifecycle-title">Season lifecycle</strong>
        <p style="margin:6px 0 0;color:var(--muted);line-height:1.45">
          Cancel ends a season without the normal championship close. Archive is for historical visibility after close or cancel.
          Safe delete only removes empty draft/test seasons with no teams, memberships, or matches.
        </p>
      </div>
      <label for="season-lifecycle-select">Season
        <select id="season-lifecycle-select" data-lifecycle-season aria-label="Season for lifecycle actions"></select>
      </label>
      <div data-season-lifecycle-state role="status" aria-live="polite">Choose a season to load lifecycle options.</div>
      <label for="season-lifecycle-reason">Cancel reason
        <textarea id="season-lifecycle-reason" data-lifecycle-reason placeholder="Required for cancel (why this season will not complete)" aria-label="Cancel reason"></textarea>
      </label>
      <div class="actions">
        <button type="button" data-lifecycle-cancel>Cancel season</button>
        <button type="button" class="ghost" data-lifecycle-archive>Archive season</button>
        <button type="button" class="ghost" data-lifecycle-delete>Safe delete draft</button>
      </div>
    </section>
    <script data-season-lifecycle-script>
    (() => {
      const token = () => sessionStorage.getItem('fd.accessToken') || '';
      const select = document.querySelector('[data-lifecycle-season]');
      const state = document.querySelector('[data-season-lifecycle-state]');
      const reasonEl = document.querySelector('[data-lifecycle-reason]');
      const cancelBtn = document.querySelector('[data-lifecycle-cancel]');
      const archiveBtn = document.querySelector('[data-lifecycle-archive]');
      const deleteBtn = document.querySelector('[data-lifecycle-delete]');
      if (!select || !state) return;

      async function api(path, opts = {}) {
        const headers = { Accept: 'application/json' };
        if (token()) headers.Authorization = 'Bearer ' + token();
        if (opts.body) headers['Content-Type'] = 'application/json';
        const res = await fetch(path, { ...opts, headers });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || res.statusText || 'Request failed');
        return body;
      }

      function setState(msg) { state.textContent = msg || ''; }

      async function loadSeasons() {
        try {
          const body = await api('/api/admin/seasons');
          const seasons = body.seasons || [];
          select.replaceChildren();
          for (const s of seasons) {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = (s.name || 'Season') + ' — ' + (s.status || '');
            select.append(opt);
          }
          if (!seasons.length) setState('No seasons available.');
          else await refresh();
        } catch (e) {
          setState(e.message || 'Sign in as league admin to manage lifecycle.');
        }
      }

      async function refresh() {
        const id = select.value;
        if (!id) return;
        try {
          const body = await api('/api/admin/seasons/' + encodeURIComponent(id) + '/lifecycle-readiness');
          const r = body.readiness || {};
          const lines = [
            'Status: ' + (r.season_status || r.seasonStatus || 'unknown'),
            'Teams: ' + (r.team_count ?? r.teamCount ?? 0),
            'Memberships: ' + (r.membership_count ?? r.membershipCount ?? 0),
            'Team matches: ' + (r.team_match_count ?? r.teamMatchCount ?? 0),
            'Player matches: ' + (r.player_match_count ?? r.playerMatchCount ?? 0),
          ];
          cancelBtn.disabled = !(r.can_cancel ?? r.canCancel);
          archiveBtn.disabled = !(r.can_archive ?? r.canArchive);
          deleteBtn.disabled = !(r.can_safe_delete ?? r.canSafeDelete);
          setState(lines.join(' · '));
        } catch (e) {
          cancelBtn.disabled = true;
          archiveBtn.disabled = true;
          deleteBtn.disabled = true;
          setState(e.message);
        }
      }

      cancelBtn.addEventListener('click', async () => {
        const id = select.value;
        const reason = (reasonEl.value || '').trim();
        if (!id || cancelBtn.disabled) return;
        if (reason.length < 3) { setState('Enter a cancel reason (at least 3 characters).'); return; }
        if (!confirm('Cancel this season? Competition history is preserved. This is not the championship Close path.')) return;
        cancelBtn.disabled = true;
        try {
          await api('/api/admin/seasons/' + encodeURIComponent(id) + '/cancel', { method: 'POST', body: JSON.stringify({ reason }) });
          setState('Season cancelled.');
          await loadSeasons();
        } catch (e) {
          setState(e.message);
          cancelBtn.disabled = false;
        }
      });

      archiveBtn.addEventListener('click', async () => {
        const id = select.value;
        if (!id || archiveBtn.disabled) return;
        if (!confirm('Archive this season for historical visibility? Reads stay available.')) return;
        archiveBtn.disabled = true;
        try {
          await api('/api/admin/seasons/' + encodeURIComponent(id) + '/archive', { method: 'POST', body: '{}' });
          setState('Season archived.');
          await loadSeasons();
        } catch (e) {
          setState(e.message);
          archiveBtn.disabled = false;
        }
      });

      deleteBtn.addEventListener('click', async () => {
        const id = select.value;
        if (!id || deleteBtn.disabled) return;
        if (!confirm('Permanently delete this empty draft season? Only allowed when there are no teams, memberships, or matches.')) return;
        deleteBtn.disabled = true;
        try {
          await api('/api/admin/seasons/' + encodeURIComponent(id) + '/safe-delete', { method: 'POST', body: '{}' });
          setState('Draft season deleted.');
          await loadSeasons();
        } catch (e) {
          setState(e.message);
          deleteBtn.disabled = false;
        }
      });

      select.addEventListener('change', refresh);
      loadSeasons();
    })();
    </script>
  `;

  if (html.includes('</main>')) {
    html = html.replace('</main>', `${ui}</main>`);
  } else {
    html = html.replace('</body>', `${ui}</body>`);
  }
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
