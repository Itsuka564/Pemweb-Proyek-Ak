"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OfficerIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/petugas/dashboard");
  }, [router]);

  return (
    <div className="p-12 text-center text-xs text-[#5a6b78]">
      Mengalihkan ke Dashboard Petugas...
    </div>
  );
}
