import { createClient } from "@/lib/supabase/server";

export async function getRenterTransactions(renterId) {
  try {
    const supabase = await createClient();
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id")) {
      return getMockRenterTransactions(renterId);
    }

    const { data, error } = await supabase
      .from("rental_transactions")
      .select(`
        id,
        transaction_code,
        start_date,
        end_date,
        rental_days,
        total_cost,
        status,
        purpose,
        submitted_at,
        created_at,
        items:rental_transaction_items(
          id,
          quantity,
          line_total,
          rate_amount_snapshot,
          asset:assets(id, asset_code, name, category:asset_categories(name))
        ),
        payments(id, status, amount, midtrans_order_id, payment_url)
      `)
      .eq("renter_id", renterId)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return getMockRenterTransactions(renterId);
    }

    return data.map(formatTransactionHeader);
  } catch {
    return getMockRenterTransactions(renterId);
  }
}

export async function getTransactionById(transactionId, renterId = null) {
  try {
    const supabase = await createClient();
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id")) {
      const mock = getMockRenterTransactions().find(
        (t) => t.id === transactionId || t.code === transactionId
      );
      return mock || null;
    }

    let query = supabase
      .from("rental_transactions")
      .select(`
        id,
        transaction_code,
        renter_id,
        start_date,
        end_date,
        rental_days,
        subtotal,
        total_cost,
        currency,
        purpose,
        status,
        renter_note,
        decision_note,
        processed_at,
        payment_due_at,
        submitted_at,
        created_at,
        renter:profiles!renter_id(id, full_name, phone, address),
        items:rental_transaction_items(
          id,
          quantity,
          rate_period,
          rate_amount_snapshot,
          line_total,
          asset:assets(id, asset_code, name, area_size, area_unit, location, category:asset_categories(name))
        ),
        history:rental_status_history(id, old_status, new_status, change_note, changed_at),
        payments(id, amount, status, midtrans_order_id, payment_type, payment_url, paid_at),
        contract:rental_contracts(id, contract_number, file_path, status, generated_at)
      `)
      .eq("id", transactionId);

    if (renterId) {
      query = query.eq("renter_id", renterId);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      const mock = getMockRenterTransactions().find(
        (t) => t.id === transactionId || t.code === transactionId
      );
      return mock || null;
    }

    return formatTransactionDetail(data);
  } catch {
    const mock = getMockRenterTransactions().find(
      (t) => t.id === transactionId || t.code === transactionId
    );
    return mock || null;
  }
}

function formatTransactionHeader(row) {
  const assetNames = row.items?.map((i) => i.asset?.name).filter(Boolean) || ["Aset Terdaftar"];
  const assetCodes = row.items?.map((i) => i.asset?.asset_code).filter(Boolean) || [];

  return {
    id: row.id,
    code: row.transaction_code,
    startDate: row.start_date,
    endDate: row.end_date,
    rentalDays: row.rental_days || 1,
    totalCost: Number(row.total_cost || 0),
    status: row.status,
    purpose: row.purpose,
    submittedAt: row.submitted_at || row.created_at,
    assetNames: assetNames.join(", "),
    assetCodes: assetCodes.join(", "),
    itemCount: row.items?.length || 1,
  };
}

function formatTransactionDetail(row) {
  const items = row.items?.map((item) => ({
    id: item.id,
    assetId: item.asset?.id,
    assetCode: item.asset?.asset_code,
    assetName: item.asset?.name,
    category: item.asset?.category?.name,
    location: item.asset?.location,
    areaSize: item.asset?.area_size ? `${item.asset.area_size} ${item.asset.area_unit || "m²"}` : "-",
    rateSnapshot: Number(item.rate_amount_snapshot || 0),
    lineTotal: Number(item.line_total || 0),
  })) || [];

  return {
    id: row.id,
    code: row.transaction_code,
    renterId: row.renter_id,
    renterName: row.renter?.full_name || "Penyewa",
    renterPhone: row.renter?.phone || "-",
    startDate: row.start_date,
    endDate: row.end_date,
    rentalDays: row.rental_days,
    subtotal: Number(row.subtotal || row.total_cost),
    totalCost: Number(row.total_cost),
    currency: row.currency || "IDR",
    purpose: row.purpose,
    renterNote: row.renter_note || "",
    decisionNote: row.decision_note || "",
    processedAt: row.processed_at,
    paymentDueAt: row.payment_due_at,
    status: row.status,
    submittedAt: row.submitted_at || row.created_at,
    items: items,
    history: row.history || [],
    payments: row.payments || [],
    contract: row.contract || null,
  };
}

function getMockRenterTransactions(renterId = "mock-renter") {
  return [
    {
      id: "trx-001",
      code: "SWA-2026-001",
      startDate: "2026-11-20",
      endDate: "2026-11-22",
      rentalDays: 3,
      totalCost: 45000000,
      status: "menunggu_persetujuan",
      purpose: "Penyelenggaraan Pameran Produk dan Bazaar Kampus",
      submittedAt: "2026-11-18T10:00:00Z",
      assetNames: "Gedung Pertemuan Graha Utama",
      assetCodes: "AST-001",
      itemCount: 1,
      items: [
        {
          id: "item-1",
          assetId: "ast-001",
          assetCode: "AST-001",
          assetName: "Gedung Pertemuan Graha Utama",
          category: "Gedung Pertemuan",
          location: "Jl. Sudirman No. 45",
          areaSize: "1200 m²",
          rateSnapshot: 15000000,
          lineTotal: 45000000,
        },
      ],
      history: [
        {
          id: "h-1",
          old_status: null,
          new_status: "menunggu_persetujuan",
          change_note: "Pengajuan sewa diajukan oleh penyewa.",
          changed_at: "2026-11-18T10:00:00Z",
        },
      ],
    },
    {
      id: "trx-002",
      code: "SWA-2026-002",
      startDate: "2026-11-25",
      endDate: "2026-11-26",
      rentalDays: 2,
      totalCost: 10000000,
      status: "disetujui",
      purpose: "Rapat Kerja Nasional Tahunan",
      submittedAt: "2026-11-17T14:30:00Z",
      assetNames: "Lahan Tanah Komersial Timur",
      assetCodes: "AST-002",
      itemCount: 1,
      items: [
        {
          id: "item-2",
          assetId: "ast-002",
          assetCode: "AST-002",
          assetName: "Lahan Tanah Komersial Timur",
          category: "Tanah",
          location: "Kawasan Bisnis Sektor Timur Blok C",
          areaSize: "3500 m²",
          rateSnapshot: 5000000,
          lineTotal: 10000000,
        },
      ],
      history: [
        {
          id: "h-2",
          old_status: "menunggu_persetujuan",
          new_status: "disetujui",
          change_note: "Disetujui oleh Admin Pengelola. Menunggu proses pembayaran.",
          changed_at: "2026-11-18T08:00:00Z",
        },
      ],
    },
  ];
}

