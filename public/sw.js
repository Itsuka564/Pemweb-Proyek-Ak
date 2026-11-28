// Service Worker untuk Web Push Notification - SewaAset
// Kelompok 10

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Tangani event push dari server/worker
self.addEventListener("push", (event) => {
  let data = {
    title: "SewaAset Notification",
    body: "Ada pembaruan status penyewaan aset Anda.",
    url: "/penyewa/dashboard",
    tag: "sewaaset-notification",
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body || data.message || "",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: data.tag || "sewaaset-notification",
    renotify: true,
    data: {
      url: data.url || data.target_url || "/penyewa/dashboard",
    },
    actions: [
      {
        action: "open",
        title: "Buka Detail",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Tangani event klik notifikasi
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/penyewa/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Jika tab sudah terbuka pada target url atau origin yang sama, fokuskan tab
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      // Jika belum ada tab yang cocok, buka tab baru
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
