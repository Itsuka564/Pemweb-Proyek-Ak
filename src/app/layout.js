import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "SewaAset — Sistem Informasi Penyewaan Aset (Kelompok 10)",
  description:
    "Platform digital terintegrasi untuk pengelolaan, pengajuan, persetujuan, dan pencatatan penyewaan aset.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
