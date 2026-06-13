const CACHE_NAME = "az-clean-v2";
const ASSETS = ["./", "./index.html", "./manifest.json", "./db-ui.js"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request, { cache: "no-store" });
        const html = await response.text();
        const injected = html.includes("db-ui.js")
          ? html
          : html.replace("</body>", '<script src="/db-ui.js?v=2"></script></body>');

        return new Response(injected, {
          status: response.status,
          statusText: response.statusText,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      } catch {
        const cached = await caches.match("./index.html");
        if (!cached) throw new Error("Offline page unavailable");
        const html = await cached.text();
        const injected = html.includes("db-ui.js")
          ? html
          : html.replace("</body>", '<script src="/db-ui.js?v=2"></script></body>');
        return new Response(injected, { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }
    })());
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
