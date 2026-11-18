import { Suspense } from "react";
import OccupancyCalendarView from "./OccupancyCalendarView";
import { getAdminOccupancyCalendar } from "@/lib/db/admin";

export const metadata = {
  title: "Kalender Okupansi Aset — Admin Portal",
};

async function OccupancyCalendarContent({ searchParamsPromise }) {
  const resolvedParams = (await searchParamsPromise) || {};
  const month = resolvedParams.month ? Number(resolvedParams.month) : 11;
  const year = resolvedParams.year ? Number(resolvedParams.year) : 2026;
  const assetId = resolvedParams.assetId || "";

  const calendarData = await getAdminOccupancyCalendar({ month, year, assetId });

  return (
    <OccupancyCalendarView
      initialMonth={calendarData.month}
      initialYear={calendarData.year}
      assets={calendarData.assets}
      blocks={calendarData.blocks}
    />
  );
}

export default function AdminKalenderPage({ searchParams }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0a4a56]">
          Kalender Okupansi Aset
        </h1>
        <p className="text-xs text-[#5a6b78] mt-1">
          Pantau jadwal penyewaan, blokir aktif, dan buffer persiapan operasional seluruh aset secara visual.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="p-12 text-center text-xs text-[#5a6b78] bg-white rounded-xl border border-[#d9e1e7]">
            Memuat data kalender okupansi aset...
          </div>
        }
      >
        <OccupancyCalendarContent searchParamsPromise={searchParams} />
      </Suspense>
    </div>
  );
}
