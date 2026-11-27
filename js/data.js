/* ============================================================
   FinKu — Data & konstanta
   ============================================================ */
"use strict";

const STORAGE_KEY = "finku-state-v1";

const CATEGORIES = {
  income: [
    { id: "gaji", name: "Gaji", emoji: "💼", color: "#0f766e" },
    { id: "freelance", name: "Freelance", emoji: "💻", color: "#2563eb" },
    { id: "bisnis", name: "Bisnis", emoji: "🏪", color: "#7c3aed" },
    { id: "investasi", name: "Investasi", emoji: "📊", color: "#0891b2" },
    { id: "hadiah", name: "Hadiah", emoji: "🎁", color: "#db2777" },
    { id: "lainnya-in", name: "Lainnya", emoji: "💵", color: "#64748b" },
  ],
  expense: [
    { id: "makanan", name: "Makanan", emoji: "🍜", color: "#ea580c" },
    { id: "transportasi", name: "Transportasi", emoji: "🛵", color: "#2563eb" },
    { id: "belanja", name: "Belanja", emoji: "🛍️", color: "#db2777" },
    { id: "tagihan", name: "Tagihan", emoji: "🧾", color: "#dc2626" },
    { id: "hiburan", name: "Hiburan", emoji: "🎬", color: "#7c3aed" },
    { id: "kesehatan", name: "Kesehatan", emoji: "💊", color: "#059669" },
    { id: "pendidikan", name: "Pendidikan", emoji: "📚", color: "#0891b2" },
    { id: "lainnya-out", name: "Lainnya", emoji: "📦", color: "#64748b" },
  ],
};

const CHART_COLORS = ["#0f766e", "#2563eb", "#ea580c", "#db2777", "#7c3aed", "#059669", "#d97706", "#64748b"];

function categoryById(id) {
  return [...CATEGORIES.income, ...CATEGORIES.expense].find((c) => c.id === id) || { id, name: id, emoji: "📦", color: "#64748b" };
}

function uid() {
  return "tx-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthsAgo(n, day = 5) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(Math.min(day, 28));
  return isoDate(d);
}

/* Data contoh realistis (Bahasa Indonesia) */
function seedState() {
  const tx = (type, amount, category, note, date) => ({ id: uid(), type, amount, category, note, date });
  const transactions = [
    // 5 bulan lalu
    tx("income", 7500000, "gaji", "Gaji bulanan", monthsAgo(5, 1)),
    tx("income", 1800000, "freelance", "Proyek landing page", monthsAgo(5, 12)),
    tx("expense", 1450000, "makanan", "Belanja bulanan", monthsAgo(5, 8)),
    tx("expense", 450000, "transportasi", "Bensin & parkir", monthsAgo(5, 10)),
    tx("expense", 350000, "tagihan", "Listrik & internet", monthsAgo(5, 15)),
    tx("expense", 280000, "hiburan", "Nonton & streaming", monthsAgo(5, 20)),
    // 4 bulan lalu
    tx("income", 7500000, "gaji", "Gaji bulanan", monthsAgo(4, 1)),
    tx("income", 950000, "freelance", "Desain logo kafe", monthsAgo(4, 18)),
    tx("expense", 1620000, "makanan", "Belanja bulanan", monthsAgo(4, 6)),
    tx("expense", 520000, "transportasi", "Bensin & parkir", monthsAgo(4, 11)),
    tx("expense", 380000, "tagihan", "Listrik & internet", monthsAgo(4, 14)),
    tx("expense", 650000, "belanja", "Sepatu baru", monthsAgo(4, 22)),
    tx("expense", 200000, "kesehatan", "Vitamin & obat", monthsAgo(4, 9)),
    // 3 bulan lalu
    tx("income", 7500000, "gaji", "Gaji bulanan", monthsAgo(3, 1)),
    tx("income", 2500000, "bisnis", "Penjualan online", monthsAgo(3, 16)),
    tx("expense", 1580000, "makanan", "Belanja bulanan", monthsAgo(3, 7)),
    tx("expense", 480000, "transportasi", "Bensin & parkir", monthsAgo(3, 13)),
    tx("expense", 360000, "tagihan", "Listrik & internet", monthsAgo(3, 15)),
    tx("expense", 300000, "hiburan", "Game & streaming", monthsAgo(3, 24)),
    tx("expense", 500000, "pendidikan", "Kursus online", monthsAgo(3, 10)),
    // 2 bulan lalu
    tx("income", 7500000, "gaji", "Gaji bulanan", monthsAgo(2, 1)),
    tx("income", 1200000, "freelance", "Maintenance website", monthsAgo(2, 20)),
    tx("expense", 1710000, "makanan", "Belanja bulanan", monthsAgo(2, 5)),
    tx("expense", 510000, "transportasi", "Bensin & parkir", monthsAgo(2, 12)),
    tx("expense", 390000, "tagihan", "Listrik & internet", monthsAgo(2, 15)),
    tx("expense", 750000, "belanja", "Pakaian & aksesoris", monthsAgo(2, 19)),
    tx("expense", 150000, "kesehatan", "Cek kesehatan", monthsAgo(2, 8)),
    // bulan lalu
    tx("income", 7500000, "gaji", "Gaji bulanan", monthsAgo(1, 1)),
    tx("income", 300000, "investasi", "Dividen saham", monthsAgo(1, 25)),
    tx("expense", 1490000, "makanan", "Belanja bulanan", monthsAgo(1, 6)),
    tx("expense", 470000, "transportasi", "Bensin & parkir", monthsAgo(1, 11)),
    tx("expense", 370000, "tagihan", "Listrik & internet", monthsAgo(1, 14)),
    tx("expense", 320000, "hiburan", "Konser & nonton", monthsAgo(1, 21)),
    tx("expense", 250000, "pendidikan", "Buku & e-book", monthsAgo(1, 17)),
    // bulan ini
    tx("income", 7500000, "gaji", "Gaji bulanan", monthsAgo(0, 1)),
    tx("income", 850000, "freelance", "Artikel & konten", monthsAgo(0, 10)),
    tx("expense", 820000, "makanan", "Belanja mingguan", monthsAgo(0, 3)),
    tx("expense", 180000, "transportasi", "Bensin", monthsAgo(0, 8)),
    tx("expense", 120000, "makanan", "Makan siang warteg", monthsAgo(0, 12)),
    tx("expense", 95000, "hiburan", "Kopi & streaming", monthsAgo(0, 15)),
    tx("expense", 65000, "transportasi", "Ojek online", monthsAgo(0, 18)),
    tx("expense", 150000, "tagihan", "Pulsa & kuota", monthsAgo(0, 20)),
  ];
  return {
    transactions,
    budgets: {
      makanan: 2000000,
      transportasi: 600000,
      belanja: 800000,
      tagihan: 500000,
      hiburan: 400000,
      kesehatan: 300000,
      pendidikan: 500000,
      "lainnya-out": 300000,
    },
    goals: [
      { id: uid(), name: "Dana Darurat", target: 20000000, current: 12500000, emoji: "🛟" },
      { id: uid(), name: "Liburan ke Bali", target: 8000000, current: 3200000, emoji: "✈️" },
      { id: uid(), name: "Laptop Baru", target: 12000000, current: 4500000, emoji: "💻" },
    ],
    theme: "light",
  };
}
