import {
  JFL_SIMULATED_OIDC_ACCESS_TOKEN,
  jflSimulatedOidcEnabled,
} from './supabaseAuth.js';

function simulatedAuthScript() {
  const token = JSON.stringify(JFL_SIMULATED_OIDC_ACCESS_TOKEN);
  return `<script data-fd-jfl-simulated-auth>
(() => {
  const simulatedToken = ${token};

  function clearSimulatedSession() {
    try {
      window.sessionStorage.removeItem('fd.accessToken');
      window.sessionStorage.removeItem('fd.refreshToken');
    } catch {}
  }

  function beginSimulatedSession() {
    try {
      window.sessionStorage.setItem('fd.accessToken', simulatedToken);
      window.sessionStorage.removeItem('fd.refreshToken');
      window.location.assign('/profile');
    } catch {
      window.location.assign('/profile');
    }
  }

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    if (target.closest('[data-google-sign-in]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      beginSimulatedSession();
      return;
    }

    if (target.closest('[data-logout]')) {
      let currentToken = '';
      try { currentToken = window.sessionStorage.getItem('fd.accessToken') || ''; } catch {}
      if (currentToken !== simulatedToken) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      clearSimulatedSession();
      window.location.assign('/profile');
    }
  }, true);

  window.addEventListener('DOMContentLoaded', () => {
    const signInButton = document.querySelector('[data-google-sign-in]');
    const signedOutCopy = document.querySelector('[data-signed-out-copy]');
    if (signInButton) signInButton.setAttribute('aria-label', 'Continue with Google — simulated JFL test login');
    if (signedOutCopy) {
      signedOutCopy.textContent = 'JFL test mode: Continue with Google simulates OIDC and signs in as the JFL admin test actor.';
    }
  });
})();
</script>`;
}

export async function injectJflSimulatedGoogleAuth(response, env = {}) {
  if (!jflSimulatedOidcEnabled(env)) return response;

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const headers = new Headers(response.headers);
  const html = await response.text();
  if (html.includes('data-fd-jfl-simulated-auth')) {
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  const script = simulatedAuthScript();
  const withSimulatedAuth = /<\/head>/i.test(html)
    ? html.replace(/<\/head>/i, `${script}\n</head>`)
    : html.replace(/<body([^>]*)>/i, `${script}\n<body$1>`);

  return new Response(withSimulatedAuth, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
