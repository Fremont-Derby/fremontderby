const persistentAuthSessionScript = `<script data-fd-persistent-auth>
(() => {
  const authKeys = new Set(['fd.accessToken', 'fd.refreshToken']);

  try {
    const tabStorage = window.sessionStorage;
    const durableStorage = window.localStorage;
    const storagePrototype = window.Storage && window.Storage.prototype;
    if (!storagePrototype) return;

    const getItem = storagePrototype.getItem;
    const setItem = storagePrototype.setItem;
    const removeItem = storagePrototype.removeItem;

    for (const key of authKeys) {
      const tabValue = getItem.call(tabStorage, key);
      const durableValue = getItem.call(durableStorage, key);
      if (tabValue) {
        try { setItem.call(durableStorage, key, tabValue); } catch {}
      } else if (durableValue) {
        setItem.call(tabStorage, key, durableValue);
      }
    }

    storagePrototype.setItem = function persistentSessionSetItem(key, value) {
      setItem.call(this, key, value);
      if (this === tabStorage && authKeys.has(key)) {
        try { setItem.call(durableStorage, key, value); } catch {}
      }
    };

    storagePrototype.removeItem = function persistentSessionRemoveItem(key) {
      removeItem.call(this, key);
      if (this === tabStorage && authKeys.has(key)) {
        try { removeItem.call(durableStorage, key); } catch {}
      }
    };
  } catch {
    // Persistent storage can be unavailable in hardened/private browsers.
    // Keep the existing sessionStorage-only behavior instead of breaking auth.
  }
})();
</script>`;

export async function injectPersistentAuthSession(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const headers = new Headers(response.headers);
  const html = await response.text();
  if (html.includes('data-fd-persistent-auth')) {
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  const withBootstrap = /<head(?:\s|>)/i.test(html)
    ? html.replace(/<head([^>]*)>/i, `<head$1>\n${persistentAuthSessionScript}`)
    : html.replace(/<body([^>]*)>/i, `${persistentAuthSessionScript}\n<body$1>`);

  return new Response(withBootstrap, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
