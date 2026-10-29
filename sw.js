// Service worker Toko Pertanian MEKAR INDAH: membuat aplikasi bisa dibuka tanpa internet.
// Naikkan angka versi ini setiap kali Anda mengunggah index.html baru.
const CACHE = "mekarindah-v3";
const CORE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];
const CDN = ["cdn.tailwindcss.com", "fonts.googleapis.com", "fonts.gstatic.com", "www.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isCDN = CDN.includes(url.hostname);
  if (!sameOrigin && !isCDN) return;

  if (sameOrigin) {
    // File aplikasi: coba internet dulu supaya selalu versi terbaru, kalau offline pakai simpanan
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
          return res;
        })
        .catch(() => caches.match(req).then(hit => hit || caches.match("index.html")))
    );
  } else {
    // Tailwind dan font: pakai simpanan kalau ada, sambil memperbarui di belakang
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(req).then(hit => {
          const net = fetch(req)
            .then(res => { if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone()); return res; })
            .catch(() => hit);
          return hit || net;
        })
      )
    );
  }
});
