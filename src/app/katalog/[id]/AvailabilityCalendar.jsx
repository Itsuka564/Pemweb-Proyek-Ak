"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";

export default function AvailabilityCalendar({ blocks = [], settings = { preparation_before_days: 1, preparation_after_days: 1 } }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Cek apakah tanggal terblokir oleh booking blocks
  const isDateBlocked = (day) => {
    const checkDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const checkDate = new Date(checkDateStr);

    for (const b of blocks) {
      if (b.startDate && b.endDateExclusive) {
        const start = new Date(b.startDate);
        const end = new Date(b.endDateExclusive);
        if (checkDate >= start && checkDate < end) {
          return true;
        }
      }
    }
    return false;
  };

  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  return (
    <div className="bg-white border border-[#d9e1e7] rounded-xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-[#0a4a56]">
            Kalender Ketersediaan Aset
          </h4>
          <p className="text-[11px] text-[#5a6b78]">
            Sistem sewa dihitung per hari kalender inklusif (00:00 - 23:59).
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-lg border border-[#d9e1e7] hover:bg-slate-100 text-[#16222b] text-xs font-bold"
            aria-label="Bulan sebelumnya"
          >
            ←
          </button>
          <span className="text-xs font-bold text-[#16222b] px-2 min-w-[120px] text-center">
            {monthNames[month]} {year}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-lg border border-[#d9e1e7] hover:bg-slate-100 text-[#16222b] text-xs font-bold"
            aria-label="Bulan berikutnya"
          >
            →
          </button>
        </div>
      </div>

      {/* Grid Kalender */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((dayName, idx) => (
          <div key={idx} className="font-bold text-[#5a6b78] py-1 text-[11px]">
            {dayName}
          </div>
        ))}

        {calendarDays.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} className="p-2"></div>;
          }

          const blocked = isDateBlocked(day);
          return (
            <div
              key={`day-${day}`}
              className={`p-2 rounded-lg font-bold text-xs transition-colors ${
                blocked
                  ? "bg-[#fadcdc] text-[#9c2222] border border-[#f5b8b8] line-through select-none cursor-not-allowed"
                  : "bg-[#f4f7f9] text-[#16222b] hover:bg-[#d7edf0] cursor-default"
              }`}
              title={blocked ? "Tanggal ini telah terpesan atau dalam masa buffer persiapan" : "Tersedia untuk disewa"}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="pt-3 border-t border-[#d9e1e7] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#f4f7f9] border border-[#d9e1e7]"></span>
            <span className="text-[#5a6b78] text-[11px]">Tersedia</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#fadcdc] border border-[#f5b8b8]"></span>
            <span className="text-[#9c2222] text-[11px] font-semibold">Terpesan / Buffer</span>
          </div>
        </div>

        <span className="text-[11px] text-[#5a6b78]">
          Buffer operasional: {settings.preparation_before_days} hari sebelum & {settings.preparation_after_days} hari sesudah.
        </span>
      </div>
    </div>
  );
}

