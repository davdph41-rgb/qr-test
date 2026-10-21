const { MENU, db } = require("../lib/shared");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Metode tidak diizinkan" });
  try {
    const { nama, meja, wa, catatan, items } = req.body || {};
    if (!nama || !meja || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "Data pesanan belum lengkap" });
    }
    const lines = [];
    let total = 0;
    for (const it of items) {
      const m = MENU[it.id];
      const q = parseInt(it.qty, 10);
      if (!m || !(q > 0) || q > 50) return res.status(400).json({ error: "Item tidak valid" });
      lines.push({ id: Number(it.id), name: m.n, price: m.p, qty: q });
      total += m.p * q;
    }
    const id = "SB-" + Date.now().toString(36).toUpperCase();
    const order = {
      id,
      nama: String(nama).slice(0, 30),
      meja: String(meja).slice(0, 4),
      wa: String(wa || "").slice(0, 16),
      catatan: String(catatan || "").slice(0, 140),
      items: lines,
      total,
      status: "menunggu",
      createdAt: new Date().toISOString()
    };
    await db.saveOrder(order);

    const auth = Buffer.from(process.env.MIDTRANS_SERVER_KEY + ":").toString("base64");
    const r = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: "Basic " + auth },
      body: JSON.stringify({
        transaction_details: { order_id: id, gross_amount: total },
        customer_details: { first_name: order.nama },
        item_details: lines.map(l => ({ id: String(l.id), price: l.price, quantity: l.qty, name: l.name.slice(0, 50) }))
      })
    });
    const j = await r.json();
    if (!j.token) return res.status(502).json({ error: "Midtrans menolak permintaan", detail: j });
    res.status(200).json({ token: j.token, orderId: id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
