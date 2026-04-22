const CACHE_VERSION = 'v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  let payload = null;

  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: 'Michels Travel',
      body: event.data.text(),
      tag: `owner-push-${Date.now()}`,
      url: '/admin-app?tab=alertas',
    };
  }

  const title = payload?.title || 'Michels Travel';
  const options = {
    body: payload?.body || 'Novo alerta do Owner Desk.',
    tag: payload?.tag || `owner-push-${Date.now()}`,
    icon: payload?.icon || '/icons/icon-192.png',
    badge: payload?.badge || '/favicon.png',
    data: {
      url: payload?.url || '/admin-app?tab=alertas',
      category: payload?.category || 'alert',
      level: payload?.level || 'info',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/admin-app?tab=alertas';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    })
  );
});
