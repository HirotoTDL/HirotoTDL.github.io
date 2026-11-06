// ブラウザ版の Service Worker：画面の部品（HTML・JS・CSS・絵）を手元に置く。
// 開くたびにネットから新しいものを取りにいき、つながらないときだけ手元の分を使う（古い画面が残り続けないように）
const CACHE = 'ma-web-1.0.4-mw4fjacj';
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
