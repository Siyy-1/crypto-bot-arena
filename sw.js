// 크립토 봇 아레나 Service Worker
// ① 오프라인 캐싱 (TWA/Play Store 필수)
// ② Web Push 수신

var CACHE_NAME = 'bot-arena-v3';
var SHELL_URLS = [
  '/crypto-bot-arena/',
  '/crypto-bot-arena/index.html',
  '/crypto-bot-arena/manifest.json',
  '/crypto-bot-arena/offline.html',
  '/crypto-bot-arena/icons/icon-192.png',
];

// ── 설치: 셸 사전 캐시 ──
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) { return cache.addAll(SHELL_URLS); })
      .then(function() { return self.skipWaiting(); })
  );
});

// ── 활성화: 구버전 캐시 정리 ──
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys()
      .then(function(keys) {
        return Promise.all(
          keys.filter(function(k) { return k !== CACHE_NAME; })
              .map(function(k) { return caches.delete(k); })
        );
      })
      .then(function() { return self.clients.claim(); })
  );
});

// ── Fetch: 캐시 우선, 네트워크 폴백 ──
self.addEventListener('fetch', function(event) {
  // GET만 처리 / 외부 도메인(API, CDN) 제외
  if (event.request.method !== 'GET') return;
  var url = new URL(event.request.url);
  if (url.hostname !== self.location.hostname) return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      var networkFetch = fetch(event.request).then(function(response) {
        // 셸 URL 응답을 캐시 갱신
        if (response.ok) {
          var isShell = SHELL_URLS.some(function(u) {
            return event.request.url.endsWith(u) || event.request.url === u;
          });
          if (isShell) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(c) { c.put(event.request, clone); });
          }
        }
        return response;
      }).catch(function() {
        // 네트워크 실패 → 캐시 → offline.html 순 폴백
        return cached
          || caches.match('/crypto-bot-arena/')
          || caches.match('/crypto-bot-arena/offline.html');
      });

      // 캐시 있으면 즉시 반환 + 백그라운드 갱신 (stale-while-revalidate)
      return cached || networkFetch;
    })
  );
});

// ── Web Push 수신 ──
self.addEventListener('push', function(event) {
  if (!event.data) return;
  var data;
  try { data = event.data.json(); } catch(e) { data = { title: '🤖 봇 아레나', body: event.data.text() }; }

  var title = data.title || '🤖 크립토 봇 아레나';
  var options = {
    body: data.body || '봇이 기다려요!',
    icon: '/crypto-bot-arena/icons/icon-192.png',
    badge: '/crypto-bot-arena/icons/icon-192.png',
    data: { url: data.url || 'https://siyy-1.github.io/crypto-bot-arena/' },
    vibrate: [100, 50, 100],
    tag: 'bot-arena-daily',
    renotify: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ── 알림 클릭 ──
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url)
    || 'https://siyy-1.github.io/crypto-bot-arena/';
  event.waitUntil(clients.openWindow(url));
});
