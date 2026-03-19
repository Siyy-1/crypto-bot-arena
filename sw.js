// 크립토 봇 아레나 Service Worker — Web Push 수신
self.addEventListener('push', function(event) {
  if (!event.data) return;
  var data;
  try { data = event.data.json(); } catch(e) { data = { title:'🤖 봇 아레나', body: event.data.text() }; }

  var title = data.title || '🤖 크립토 봇 아레나';
  var options = {
    body: data.body || '봇이 기다려요!',
    icon: 'https://siyy-1.github.io/crypto-bot-arena/icon.png',
    badge: 'https://siyy-1.github.io/crypto-bot-arena/icon.png',
    data: { url: data.url || 'https://siyy-1.github.io/crypto-bot-arena/' },
    vibrate: [100, 50, 100],
    tag: 'bot-arena-daily',
    renotify: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url)
    || 'https://siyy-1.github.io/crypto-bot-arena/';
  event.waitUntil(clients.openWindow(url));
});
