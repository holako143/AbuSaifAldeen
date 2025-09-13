console.log('[SW-Progress] Script loaded.');

// Using handlerDidComplete is more reliable as it fires after any request handled by the precache strategy.
const broadcastPlugin = {
  handlerDidComplete: async ({ request, event }) => {
    const clients = await self.clients.matchAll({ type: 'window' });
    if (clients && clients.length) {
      console.log('[SW-Progress] Broadcasting PRECACHE_PROGRESS for:', request.url);
      clients.forEach(client => {
        client.postMessage({ type: 'PRECACHE_PROGRESS', url: request.url });
      });
    }
    // The response must be returned to the next plugin in the chain.
    return event.response;
  },
};

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_PRECACHE_TOTAL') {
    console.log('[SW-Progress] Received GET_PRECACHE_TOTAL request.');
    const manifest = self.__WB_MANIFEST || [];
    console.log(`[SW-Progress] Manifest size: ${manifest.length}`);
    event.ports[0].postMessage({ type: 'PRECACHE_TOTAL_RESPONSE', total: manifest.length });
  }
});

self.addEventListener('install', () => {
  console.log('[SW-Progress] Install event triggered. Adding plugins.');
  if (typeof workbox !== 'undefined' && workbox.precaching) {
    workbox.precaching.addPlugins([broadcastPlugin]);
    console.log('[SW-Progress] Broadcast plugin added.');
  } else {
    console.error('[SW-Progress] Workbox or workbox.precaching is not defined.');
  }
});

self.addEventListener('activate', () => {
    console.log('[SW-Progress] Service worker activated.');
});
