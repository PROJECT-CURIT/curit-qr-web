const CACHE = "curit-qr-v1"
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll([
          "/",
          "/manifest.webmanifest",
          "/app-icon-192.png",
          "/app-icon-512.png",
        ]),
      ),
  )
  self.skipWaiting()
})
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("curit-qr-") && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/src/") ||
    url.pathname.startsWith("/@") ||
    url.pathname.includes("node_modules")
  )
    return
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE).then((cache) => cache.put("/", clone))
          }
          return response
        })
        .catch(() => caches.match("/")),
    )
    return
  }
  if (
    !url.pathname.startsWith("/assets/") &&
    !url.pathname.startsWith("/artworks/") &&
    !url.pathname.startsWith("/app-icon-")
  )
    return
  event.respondWith(caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE).then((cache) => cache.put(event.request, clone))
          }
          return response
        }),
    ))
})
