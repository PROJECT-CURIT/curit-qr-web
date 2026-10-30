const CACHE = "curit-qr-v2"
const SCOPE = new URL(self.registration.scope)
const BASE_PATH = SCOPE.pathname.replace(/\/$/, "")
const scoped = (path = "") => `${BASE_PATH}/${path}`
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll([
          scoped(),
          scoped("manifest.webmanifest"),
          scoped("app-icon-192.png"),
          scoped("app-icon-512.png"),
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
            caches.open(CACHE).then((cache) => cache.put(scoped(), clone))
          }
          return response
        })
        .catch(() => caches.match(scoped())),
    )
    return
  }
  if (
    !url.pathname.startsWith(scoped("assets/")) &&
    !url.pathname.startsWith(scoped("artworks/")) &&
    !url.pathname.startsWith(scoped("app-icon-"))
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
