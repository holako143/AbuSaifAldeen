console.log('[SW-Progress] Custom progress script loaded.');

// A plugin to broadcast a message after each asset is successfully precached.
const broadcastPlugin = {
  handlerDidComplete: async ({ request, event }) => {
    const clients = await self.clients.matchAll({ type: 'window' });
    if (clients && clients.length) {
      // We can't easily get the total count here, so we just notify that *an* item was cached.
      // The client will be responsible for incrementing the count.
      console.log('[SW-Progress] Broadcasting PRECACHE_PROGRESS for URL:', request.url);
      clients.forEach(client => {
        client.postMessage({ type: 'PRECACHE_PROGRESS' });
      });
    }
    // The response must be returned to the next plugin in the chain.
    return event.response;
  },
};

// A listener to respond to a client's request for the total number of precache items.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_PRECACHE_TOTAL') {
    console.log('[SW-Progress] Received GET_PRECACHE_TOTAL request from client.');
    // The __WB_MANIFEST is a global variable injected by Workbox with the list of assets to precache.
    const manifest = self.__WB_MANIFEST || [];
    console.log(`[SW-Progress] Responding with total: ${manifest.length}`);
    // Respond to the specific client that sent the message.
    event.ports[0].postMessage({ type: 'PRECACHE_TOTAL_RESPONSE', total: manifest.length });
  }
});

// The 'install' event is the perfect place to add the plugin to the precaching routes.
self.addEventListener('install', () => {
  console.log('[SW-Progress] Service Worker install event fired.');
  if (typeof workbox !== 'undefined' && workbox.precaching) {
    console.log('[SW-Progress] Workbox found. Adding broadcast plugin to precaching.');
    workbox.precaching.addPlugins([broadcastPlugin]);
  } else {
    console.error('[SW-Progress] Workbox or workbox.precaching is not defined. Cannot add plugin.');
  }
});
