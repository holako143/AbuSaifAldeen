// This script is designed to be imported by the main service worker.
// It adds a plugin to the workbox precaching route to broadcast progress.

// A plugin to broadcast a message after each asset is precached.
const broadcastPlugin = {
  cacheDidUpdate: async ({ cacheName, request }) => {
    // Ensure we only broadcast for precache events.
    if (cacheName.startsWith('workbox-precache')) {
      const clients = await self.clients.matchAll({ type: 'window' });
      if (clients && clients.length) {
        // Broadcast a message to all window clients.
        clients.forEach(client => {
          client.postMessage({ type: 'PRECACHE_PROGRESS' });
        });
      }
    }
  }
};

// A listener to respond to a request for the total number of precache items.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_PRECACHE_TOTAL') {
    const manifest = self.__WB_MANIFEST || [];
    // Respond to the specific client that sent the message.
    event.ports[0].postMessage({ type: 'PRECACHE_TOTAL_RESPONSE', total: manifest.length });
  }
});


// Add the plugin to the precaching strategy.
if (typeof workbox !== 'undefined' && workbox.precaching) {
  workbox.precaching.addPlugins([broadcastPlugin]);
}
