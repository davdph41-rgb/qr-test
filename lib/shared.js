const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const MENU = {
  1: { n: "Kopi Susu Pasir Putih", p: 28000 },
  2: { n: "Americano Dingin", p: 24000 },
  3: { n: "Teh Melati Lemon", p: 20000 },
  4: { n: "Blue Lagoon", p: 32000 },
  5: { n: "Es Kelapa Muda", p: 25000 },
  6: { n: "Sunset Punch", p: 30000 },
  7: { n: "Nasi Goreng Seafood", p: 48000 },
  8: { n: "Ikan Bakar Rica", p: 65000 },
  9: { n: "Burger Pantai", p: 52000 },
  10: { n: "Kentang Goreng", p: 22000 },
  11: { n: "Pisang Goreng Madu", p: 24000 },
  12: { n: "Calamari Crispy", p: 38000 }
};

async function cmd(...args) {
  const r = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify(args)
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

const db = {
  async saveOrder(o) {
    await cmd("SET", "order:" + o.id, JSON.stringify(o));
    await cmd("LPUSH", "orders", o.id);
  },
  async updateOrder(o) {
    await cmd("SET", "order:" + o.id, JSON.stringify(o));
  },
  async getOrder(id) {
    const v = await cmd("GET", "order:" + id);
    return v ? JSON.parse(v) : null;
  },
  async listOrders(n = 50) {
    const ids = await cmd("LRANGE", "orders", "0", String(n - 1));
    if (!ids || !ids.length) return [];
    const vals = await cmd("MGET", ...ids.map(i => "order:" + i));
    return vals.filter(Boolean).map(v => JSON.parse(v));
  }
};

module.exports = { MENU, db };
