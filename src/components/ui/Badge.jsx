"use client";

const BADGE_STYLES = {
  // Sukses / Hijau
  ok: "bg-[#dff3e8] text-[#17633c] border-[#b8e4cd]",
  tersedia: "bg-[#dff3e8] text-[#17633c] border-[#b8e4cd]",
  disetujui: "bg-[#dff3e8] text-[#17633c] border-[#b8e4cd]",
  dikembalikan: "bg-[#dff3e8] text-[#17633c] border-[#b8e4cd]",
  baik: "bg-[#dff3e8] text-[#17633c] border-[#b8e4cd]",
  aktif: "bg-[#dff3e8] text-[#17633c] border-[#b8e4cd]",
  dibayar: "bg-[#dff3e8] text-[#17633c] border-[#b8e4cd]",
  paid: "bg-[#dff3e8] text-[#17633c] border-[#b8e4cd]",

  // Peringatan / Kuning Amber
  warn: "bg-[#fff0cc] text-[#7a5200] border-[#fde199]",
  dipesan: "bg-[#fff0cc] text-[#7a5200] border-[#fde199]",
  menunggu: "bg-[#fff0cc] text-[#7a5200] border-[#fde199]",
  menunggu_persetujuan: "bg-[#fff0cc] text-[#7a5200] border-[#fde199]",
  menunggu_pembayaran: "bg-[#fff0cc] text-[#7a5200] border-[#fde199]",
  perlu_pemeriksaan: "bg-[#fff0cc] text-[#7a5200] border-[#fde199]",
  perlu_dikirim_ulang: "bg-[#fff0cc] text-[#7a5200] border-[#fde199]",

  // Informasi / Biru
  info: "bg-[#dce9f8] text-[#1f4f8f] border-[#b4d2f3]",
  sedang_disewa: "bg-[#dce9f8] text-[#1f4f8f] border-[#b4d2f3]",
  serah_terima: "bg-[#dce9f8] text-[#1f4f8f] border-[#b4d2f3]",
  rented: "bg-[#dce9f8] text-[#1f4f8f] border-[#b4d2f3]",

  // Bahaya / Merah
  bad: "bg-[#fadcdc] text-[#9c2222] border-[#f5b8b8]",
  ditolak: "bg-[#fadcdc] text-[#9c2222] border-[#f5b8b8]",
  rusak: "bg-[#fadcdc] text-[#9c2222] border-[#f5b8b8]",
  batal: "bg-[#fadcdc] text-[#9c2222] border-[#f5b8b8]",
  kedaluwarsa: "bg-[#fadcdc] text-[#9c2222] border-[#f5b8b8]",

  // Netral / Abu
  neutral: "bg-[#e6eaee] text-[#3f4c57] border-[#ced6dd]",
  perawatan: "bg-[#e6eaee] text-[#3f4c57] border-[#ced6dd]",
  tidak_tersedia: "bg-[#e6eaee] text-[#3f4c57] border-[#ced6dd]",
};

export default function Badge({ status, variant, children, className = "" }) {
  const key = (variant || status || "").toString().toLowerCase().replace(/\s+/g, "_");
  const colorClass = BADGE_STYLES[key] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${colorClass} ${className}`}
    >
      {children || status}
    </span>
  );
}

