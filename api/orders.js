const { db } = require("../lib/shared");

module.exports = async (req, res) => {
  if (!process.env.DASHBOARD_PIN || req.headers["x-pin"] !== process.env.DASHBOARD_PIN) {
    return res.status(401).json({ error: "PIN salah" });
  }
  try {
    if (req.method === "POST") {
      const o = await db.getOrder((req.body || {}).id);
      if (o && o.status === "lunas") {
        o.status = "selesai";
        await db.updateOrder(o);
      }
      return res.status(200).json({ ok: true });
    }
    const all = await db.listOrders(50);
    res.status(200).json(all.filter(o => o.status === "lunas" || o.status === "selesai"));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
