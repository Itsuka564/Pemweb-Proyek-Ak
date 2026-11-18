import crypto from "node:crypto";

const MIDTRANS_SANDBOX_SNAP_URL = "https://app.sandbox.midtrans.com/snap/v1/transactions";
const MIDTRANS_PRODUCTION_SNAP_URL = "https://app.midtrans.com/snap/v1/transactions";

export function getMidtransConfig() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

  const isConfigured = Boolean(
    serverKey &&
    !serverKey.includes("your-midtrans") &&
    !serverKey.includes("placeholder")
  );

  return {
    serverKey,
    clientKey,
    isProduction,
    isConfigured,
    snapUrl: isProduction ? MIDTRANS_PRODUCTION_SNAP_URL : MIDTRANS_SANDBOX_SNAP_URL,
  };
}

/**
 * Membuat transaksi Snap ke API Midtrans.
 * Memvalidasi kesesuaian antara gross_amount dan item_details.
 */
export async function createSnapTransaction({
  orderId,
  grossAmount,
  customerDetails = {},
  itemDetails = [],
}) {
  const config = getMidtransConfig();

  if (!config.isConfigured) {
    throw new Error(
      "MIDTRANS_SERVER_KEY belum dikonfigurasi di server. Pastikan kredensial Midtrans telah diisi."
    );
  }

  const roundedGross = Math.round(Number(grossAmount));
  if (roundedGross <= 0) {
    throw new Error("Nominal pembayaran (gross_amount) harus lebih dari 0.");
  }

  const formattedItems = itemDetails.map((item) => ({
    id: String(item.id || "item").substring(0, 50),
    price: Math.round(Number(item.price || 0)),
    quantity: Number(item.quantity || 1),
    name: String(item.name || "Sewa Aset").substring(0, 50),
  }));

  const itemsSum = formattedItems.reduce((acc, it) => acc + it.price * it.quantity, 0);

  if (formattedItems.length > 0 && itemsSum !== roundedGross) {
    throw new Error(
      `Inkonsistensi nominal Midtrans: total item_details (${itemsSum}) tidak sama dengan gross_amount (${roundedGross}).`
    );
  }

  const authHeader = Buffer.from(`${config.serverKey}:`).toString("base64");

  const payload = {
    transaction_details: {
      order_id: orderId,
      gross_amount: roundedGross,
    },
    customer_details: {
      first_name: customerDetails.fullName || "Penyewa Aset",
      email: customerDetails.email || "penyewa@example.com",
      phone: customerDetails.phone || "081234567890",
    },
    item_details: formattedItems,
  };

  const response = await fetch(config.snapUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${authHeader}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Midtrans Snap API Error [${response.status}]: ${data.error_messages?.join(", ") || JSON.stringify(data)}`
    );
  }

  return {
    token: data.token,
    redirect_url: data.redirect_url,
    isSimulation: false,
  };
}

/**
 * Verifikasi SHA512 signature key dari Webhook Midtrans:
 * SHA512(order_id + status_code + gross_amount + ServerKey)
 * Mengembalikan false jika serverKey tidak tersedia atau signature tidak cocok.
 */
export function verifyWebhookSignature({
  orderId,
  statusCode,
  grossAmount,
  signatureKey,
  serverKey,
}) {
  if (!signatureKey || !orderId || !statusCode) {
    return false;
  }

  const keyToUse = serverKey || process.env.MIDTRANS_SERVER_KEY || "";
  if (!keyToUse || keyToUse.includes("your-midtrans") || keyToUse.includes("placeholder")) {
    return false;
  }

  // Format 1: gross_amount bulat / persis string
  const baseGross = String(grossAmount);
  const hash1 = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${baseGross}${keyToUse}`)
    .digest("hex");

  if (hash1.toLowerCase() === signatureKey.toLowerCase()) {
    return true;
  }

  // Format 2: gross_amount dengan format pecahan .00 (standar respon beberapa channel Midtrans)
  const formattedGross = Number(grossAmount).toFixed(2);
  const hash2 = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${formattedGross}${keyToUse}`)
    .digest("hex");

  return hash2.toLowerCase() === signatureKey.toLowerCase();
}
