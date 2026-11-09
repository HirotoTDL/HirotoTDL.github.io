// ブラウザ版の Service Worker：画面の部品（HTML・JS・CSS・絵）を手元に置く。
// 開くたびにネットから新しいものを取りにいき、つながらないときだけ手元の分を使う（古い画面が残り続けないように）
const CACHE = 'ma-web-1.0.9-mw8up03e';
const SHELL = ['./', 'index.html', 'app.js', 'styles.css', 'motion.css', 'manifest.webmanifest', 'icon.png', 'logo.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // 同期・AI・Google の通信には手を出さない
  e.respondWith(fetch(e.request).then((res) => {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
    return res;
  }).catch(() => caches.match(e.request).then((r) => r || caches.match('index.html'))));
});

// 通知（Web プッシュ）：送る係から届いたものを出す。押したらアプリを前に出す（無ければ開く）
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: 'メモアシスタント', body: e.data?.text() || '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'メモアシスタント', { body: d.body || '', tag: d.tag || undefined, icon: 'icon.png', badge: 'icon.png', data: { url: './' } }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ws) => {
    const w = ws.find((c) => c.url.includes(self.registration.scope));
    return w ? w.focus() : self.clients.openWindow('./');
  }));
});
