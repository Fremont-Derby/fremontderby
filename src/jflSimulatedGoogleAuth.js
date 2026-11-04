import {
  jflSimulatedOidcEnabled,
} from './supabaseAuth.js';
import { enhanceJflModernProfile } from './jflModernProfileEnhancer.js';

function simulatedAuthScript() {
  return `<script data-fd-jfl-simulated-auth>
(() => {
  const updateSimulationCopy = () => {
    const signInButton = document.querySelector('[data-google-sign-in]');
    const signedOutCopy = document.querySelector('[data-signed-out-copy]');
    if (signInButton) signInButton.setAttribute('aria-label', 'Continue with Google — simulated JFL test login');
    if (signedOutCopy) {
      signedOutCopy.textContent = 'JFL test mode: Continue with Google simulates OIDC and signs in as the JFL admin test actor.';
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateSimulationCopy, { once: true });
  } else {
    updateSimulationCopy();
  }
})();
</script>`;
}

function repairJflProfileInlineAuthSyntax(html = '') {
  return String(html).replaceAll(
    "replace(//+$/, '')",
    "replace(/\\/+$/, '')",
  );
}

export async function injectJflSimulatedGoogleAuth(response, env = {}) {
  if (env.ENVIRONMENT !== 'jfl') return response;

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const headers = new Headers(response.headers);
  let html = repairJflProfileInlineAuthSyntax(await response.text());

  if (jflSimulatedOidcEnabled(env) && !html.includes('data-fd-jfl-simulated-auth')) {
    const script = simulatedAuthScript();
    html = /<\/head>/i.test(html)
      ? html.replace(/<\/head>/i, `${script}\n</head>`)
      : html.replace(/<body([^>]*)>/i, `${script}\n<body$1>`);
  }

  const withAuth = new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
  return enhanceJflModernProfile(withAuth, env);
}
