const crypto = require("crypto");
const { db } = require("../lib/shared");

module.exports = async (req, res) => {
  try {
    const n = req.body || {};
    const sig = crypto
      .createHash("sha512")
      .update(String(n.order_id) + String(n.status_code) + String(n.gross_amount) + process.env.MIDTRANS_SERVER_KEY)
      .digest("hex");
    if (sig !== n.signature_key) return res.status(403).json({ error: "Signature tidak cocok" });

    const o = await db.getOrder(n.order_id);
    if (!o) return res.status(404).json({ error: "Pesanan tidak ditemukan" });
    if (Number(n.gross_amount) !== o.total) return res.status(400).json({ error: "Jumlah tidak cocok" });

    const paid = n.transaction_status === "settlement" ||
      (n.transaction_status === "capture" && n.fraud_status === "accept");
    const failed = ["deny", "cancel", "expire", "failure"].includes(n.transaction_status);

    if (paid && o.status === "menunggu") {
      o.status = "lunas";
      o.paidAt = new Date().toISOString();
      await db.updateOrder(o);
    } else if (failed && o.status === "menunggu") {
      o.status = "gagal";
      await db.updateOrder(o);
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
