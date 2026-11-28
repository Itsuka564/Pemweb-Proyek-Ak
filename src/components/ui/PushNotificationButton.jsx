"use client";

import { useState, useEffect } from "react";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationButton({ className = "" }) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState("default");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);

      // Cek apakah sudah subscribe sebelumnya
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) {
            setIsSubscribed(true);
          }
        });
      });
    }
  }, []);

  const handleSubscribe = async () => {
    if (!isSupported) {
      alert("Browser Anda tidak mendukung Web Push Notification.");
      return;
    }

    if (!vapidPublicKey) {
      alert("NEXT_PUBLIC_VAPID_PUBLIC_KEY belum dikonfigurasi di .env.local.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // 1. Daftarkan Service Worker
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // 2. Minta izin notifikasi
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        setMessage("Izin notifikasi ditolak oleh pengguna.");
        setLoading(false);
        return;
      }

      // 3. Daftarkan Push Subscription melalui VAPID
      const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });

      // 4. Kirim ke backend untuk disimpan di PostgreSQL
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setIsSubscribed(true);
        setMessage("Notifikasi berhasil diaktifkan!");
        setTimeout(() => setMessage(""), 4000);
      } else {
        setMessage(json.error || "Gagal mendaftarkan notifikasi di server.");
      }
    } catch (err) {
      console.error("Gagal berlangganan push notification:", err);
      setMessage(err.message || "Gagal mengaktifkan notifikasi.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }
      setIsSubscribed(false);
      setMessage("Notifikasi dinonaktifkan.");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Gagal unregister push notification:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setLoading(true);
    setMessage("Mengirim job ke antrean worker...");
    try {
      const res = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Uji Notifikasi Web Push 🔔",
          message: "Halo! Background worker berhasil memproses notifikasi antrean Anda secara asynchronous.",
          url: "/penyewa/dashboard",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage("Job antrean dikirim! Cek terminal worker & notifikasi browser.");
        setTimeout(() => setMessage(""), 5000);
      } else {
        setMessage(data.error || "Gagal mengirim tes.");
      }
    } catch (e) {
      setMessage(e.message || "Gagal memanggil endpoint tes.");
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className={`inline-flex flex-col items-start gap-1.5 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        {isSubscribed ? (
          <>
            <button
              type="button"
              onClick={handleUnsubscribe}
              disabled={loading}
              title="Klik untuk menonaktifkan Web Push"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#00bf8a]/20 text-[#00bf8a] border border-[#00bf8a]/40 hover:bg-[#00bf8a]/30 transition-all cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#00bf8a] animate-pulse"></span>
              <span>🔔 Web Push Aktif</span>
            </button>

            <button
              type="button"
              onClick={handleTestNotification}
              disabled={loading}
              title="Kirim notifikasi uji coba melalui background worker"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-[#0a4a56] hover:bg-slate-100 shadow-sm border border-[#d9e1e7] transition-all cursor-pointer"
            >
              <span>🚀</span>
              <span>{loading ? "Mengirim..." : "Uji Notifikasi"}</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={loading}
            title="Aktifkan notifikasi Web Push untuk menerima kabar sewa aset secara real-time"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0a4a56] text-white hover:bg-[#0e6b7a] shadow-sm transition-all cursor-pointer"
          >
            <span>🔔</span>
            <span>{loading ? "Mendaftarkan..." : "Aktifkan Web Push"}</span>
          </button>
        )}
      </div>

      {message && (
        <span className="text-[11px] text-[#0a4a56] font-medium bg-white px-2 py-0.5 rounded shadow">
          {message}
        </span>
      )}
      {permission === "denied" && (
        <span className="text-[11px] text-red-600 font-medium">
          Izin notifikasi diblokir di browser. Buka setelan situs untuk mengizinkan.
        </span>
      )}
    </div>
  );
}
