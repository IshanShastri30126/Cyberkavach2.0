const CACHE_NAME = "cyberkavach-v2-cache";
const OFFLINE_URLS = [
  "/dashboard/attendance",
  "/favicon.ico",
  "/file.svg"
];

// Install Event - cache core pages
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - cache first for static resources, network first for pages
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip POST requests and external APIs
  if (event.request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful requests dynamically
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          
          // Custom offline fallback if matching dashboard page
          if (url.pathname.includes("/attendance")) {
            return caches.match("/dashboard/attendance");
          }
        });
      })
  );
});

// Listen to Push Notifications
self.addEventListener("push", (event) => {
  let data = { title: "CyberKavach Broadcast", body: "Incoming operational transmission..." };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "/file.svg",
    badge: "/file.svg",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "1"
    },
    actions: [
      { action: "explore", title: "View Dashboard" },
      { action: "close", title: "Close" }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle Notification Clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "explore") {
    event.waitUntil(
      self.clients.openWindow("/dashboard")
    );
  }
});
