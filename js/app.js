/* ============================================================
   FinKu — Logika aplikasi utama
   ============================================================ */
"use strict";

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

let state = loadState();
let currentView = "dashboard";
let currentPeriod = "month"; // 'month' | 'all'
let editingTxType = "expense";
let cashflowChart = null;
let expenseChart = null;

/* ---------- State & storage ---------- */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.transactions)) return parsed;
    }
  } catch (e) { /* abaikan */ }
  return seedState();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ---------- Format ---------- */
function fmtRp(n) {
  const v = Math.round(Number(n) || 0);
  return "Rp" + v.toLocaleString("id-ID");
}

function fmtRpShort(n) {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e9) return "Rp" + (v / 1e9).toFixed(1).replace(".", ",").replace(/,0$/, "") + " M";
  if (Math.abs(v) >= 1e6) return "Rp" + (v / 1e6).toFixed(1).replace(".", ",").replace(/,0$/, "") + " jt";
  if (Math.abs(v) >= 1e3) return "Rp" + (v / 1e3).toFixed(0) + " rb";
  return fmtRp(v);
}

function fmtDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function monthKey(iso) { return iso.slice(0, 7); }

function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---------- Toast ---------- */
let toastTimer = null;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2400);
}

/* ---------- Agregasi ---------- */
function inPeriod(tx) {
  if (currentPeriod === "all") return true;
  return monthKey(tx.date) === currentMonthKey();
}

function totals(list) {
  let income = 0, expense = 0;
  for (const t of list) {
    if (t.type === "income") income += Number(t.amount) || 0;
    else expense += Number(t.amount) || 0;
  }
  return { income, expense, balance: income - expense };
}

function sortedTx(list) {
  return [...list].sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
}

/* ---------- Render: Dashboard ---------- */
function renderDashboard() {
  const all = state.transactions;
  const periodList = all.filter(inPeriod);
  const t = totals(periodList);
  const allTotals = totals(all);
  const periodName = currentPeriod === "month" ? "bulan ini" : "semua waktu";

  $("#statBalance").textContent = fmtRp(allTotals.balance);
  $("#statBalanceSub").textContent = `${all.length} transaksi tercatat`;
  $("#statIncome").textContent = fmtRp(t.income);
  $("#statIncomeSub").textContent = `Pemasukan ${periodName}`;
  $("#statExpense").textContent = fmtRp(t.expense);
  $("#statExpenseSub").textContent = `Pengeluaran ${periodName}`;
  const ratio = t.income > 0 ? Math.max(0, Math.round(((t.income - t.expense) / t.income) * 100)) : 0;
  $("#statSavings").textContent = ratio + "%";
  $("#statSavingsSub").textContent = t.income > 0 ? `${fmtRp(t.income - t.expense)} tersisa ${periodName}` : "Belum ada pemasukan";

  $("#expenseCatPeriod").textContent = currentPeriod === "month" ? "Bulan ini" : "Semua waktu";

  renderRecentTx();
  renderBudgetOverview();
  renderGoalsOverview();
  renderCharts();
}

function txItemHTML(t, withActions) {
  const cat = categoryById(t.category);
  const sign = t.type === "income" ? "+" : "−";
  const cls = t.type === "income" ? "text-green" : "text-red";
  return `
    <li class="tx-item" data-id="${t.id}">
      <span class="tx-emoji" aria-hidden="true">${cat.emoji}</span>
      <div class="tx-main">
        <p class="tx-note">${esc(t.note) || esc(cat.name)}</p>
        <p class="tx-meta">${esc(cat.name)} · ${fmtDate(t.date)}</p>
      </div>
      <span class="tx-amount ${cls}">${sign}${fmtRp(t.amount)}</span>
      ${withActions ? `
      <span class="tx-actions">
        <button class="tx-action-btn" data-edit="${t.id}" title="Ubah" aria-label="Ubah transaksi">✎</button>
        <button class="tx-action-btn danger" data-del="${t.id}" title="Hapus" aria-label="Hapus transaksi">🗑</button>
      </span>` : ""}
    </li>`;
}

function renderRecentTx() {
  const recent = sortedTx(state.transactions).slice(0, 6);
  $("#recentTxList").innerHTML = recent.length
    ? recent.map((t) => txItemHTML(t, false)).join("")
    : `<li class="muted small" style="padding:12px 8px">Belum ada transaksi.</li>`;
}

function renderBudgetOverview() {
  const mk = currentMonthKey();
  const spent = {};
  for (const t of state.transactions) {
    if (t.type === "expense" && monthKey(t.date) === mk) {
      spent[t.category] = (spent[t.category] || 0) + (Number(t.amount) || 0);
    }
  }
  const rows = CATEGORIES.expense
    .map((c) => ({ cat: c, budget: Number(state.budgets[c.id]) || 0, used: spent[c.id] || 0 }))
    .filter((r) => r.budget > 0)
    .sort((a, b) => (b.used / (b.budget || 1)) - (a.used / (a.budget || 1)))
    .slice(0, 5);

  $("#budgetOverview").innerHTML = rows.length
    ? rows.map((r) => {
        const pct = r.budget > 0 ? Math.min(100, Math.round((r.used / r.budget) * 100)) : 0;
        const cls = r.used > r.budget ? "over" : pct >= 80 ? "warn" : "";
        return `
          <div class="budget-row">
            <div class="budget-row-head">
              <span>${r.cat.emoji}</span><span class="b-name">${esc(r.cat.name)}</span>
              <span class="b-amounts"><strong>${fmtRpShort(r.used)}</strong> / ${fmtRpShort(r.budget)}</span>
            </div>
            <div class="progress"><div class="progress-bar ${cls}" style="width:${pct}%"></div></div>
          </div>`;
      }).join("")
    : `<p class="muted small">Belum ada budget. Atur di menu Budget.</p>`;
}

function goalCardHTML(g, full) {
  const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
  const done = pct >= 100;
  return `
    <article class="goal-card">
      <div class="goal-top">
        <span class="goal-emoji" aria-hidden="true">${esc(g.emoji) || "🎯"}</span>
        <div>
          <p class="goal-name">${esc(g.name)}</p>
          <p class="goal-pct">${done ? "🎉 Target tercapai!" : pct + "% terkumpul"}</p>
        </div>
      </div>
      <div class="progress"><div class="progress-bar ${done ? "" : ""}" style="width:${pct}%"></div></div>
      <div class="goal-amounts">
        <span><strong>${fmtRpShort(g.current)}</strong></span>
        <span>dari ${fmtRpShort(g.target)}</span>
      </div>
      ${full ? `
      <div class="goal-actions">
        <button class="btn btn-outline" data-goal-add="${g.id}">+ Tambah</button>
        <button class="btn btn-ghost" data-goal-edit="${g.id}">Ubah</button>
        <button class="btn btn-danger" data-goal-del="${g.id}">Hapus</button>
      </div>` : ""}
    </article>`;
}

function renderGoalsOverview() {
  const goals = state.goals || [];
  $("#goalsOverview").innerHTML = goals.length
    ? goals.slice(0, 3).map((g) => goalCardHTML(g, false)).join("")
    : `<p class="muted small">Belum ada target tabungan.</p>`;
}

/* ---------- Render: Transaksi ---------- */
function renderTransactions() {
  const q = $("#searchInput").value.trim().toLowerCase();
  const type = $("#filterType").value;
  const cat = $("#filterCategory").value;
  const month = $("#filterMonth").value;

  let list = sortedTx(state.transactions);
  if (type !== "all") list = list.filter((t) => t.type === type);
  if (cat !== "all") list = list.filter((t) => t.category === cat);
  if (month !== "all") list = list.filter((t) => monthKey(t.date) === month);
  if (q) list = list.filter((t) => (t.note || "").toLowerCase().includes(q) || categoryById(t.category).name.toLowerCase().includes(q));

  const t = totals(list);
  $("#txSummary").innerHTML = `
    <span>Menampilkan <strong>${list.length}</strong> transaksi</span>
    <span class="text-green">+${fmtRp(t.income)}</span>
    <span class="text-red">−${fmtRp(t.expense)}</span>`;

  $("#fullTxList").innerHTML = list.map((x) => txItemHTML(x, true)).join("");
  $("#txEmpty").hidden = list.length > 0;
}

function refreshFilterOptions() {
  const catSel = $("#filterCategory");
  const prev = catSel.value;
  const all = [...CATEGORIES.income, ...CATEGORIES.expense];
  catSel.innerHTML = `<option value="all">Semua kategori</option>` +
    all.map((c) => `<option value="${c.id}">${c.emoji} ${esc(c.name)}</option>`).join("");
  catSel.value = [...catSel.options].some((o) => o.value === prev) ? prev : "all";

  const months = [...new Set(state.transactions.map((t) => monthKey(t.date)))].sort().reverse();
  const mSel = $("#filterMonth");
  const prevM = mSel.value;
  mSel.innerHTML = `<option value="all">Semua bulan</option>` +
    months.map((m) => `<option value="${m}">${monthLabel(m)}</option>`).join("");
  mSel.value = [...mSel.options].some((o) => o.value === prevM) ? prevM : "all";
}

/* ---------- Render: Budget ---------- */
function renderBudget() {
  const mk = currentMonthKey();
  $("#budgetMonthLabel").textContent = monthLabel(mk);
  const spent = {};
  for (const t of state.transactions) {
    if (t.type === "expense" && monthKey(t.date) === mk) {
      spent[t.category] = (spent[t.category] || 0) + (Number(t.amount) || 0);
    }
  }

  $("#budgetList").innerHTML = CATEGORIES.expense.map((c) => {
    const budget = Number(state.budgets[c.id]) || 0;
    const used = spent[c.id] || 0;
    const pct = budget > 0 ? Math.min(100, Math.round((used / budget) * 100)) : 0;
    const cls = used > budget ? "over" : pct >= 80 ? "warn" : "";
    const status = budget === 0 ? "Belum diatur" : used > budget ? "⚠️ Melebihi budget" : pct >= 80 ? "Hampir habis" : "Aman";
    return `
      <div class="budget-row">
        <div class="budget-row-head">
          <span>${c.emoji}</span><span class="b-name">${esc(c.name)}</span>
          <span class="b-amounts"><strong>${fmtRp(used)}</strong> / ${budget > 0 ? fmtRp(budget) : "—"} · ${status}</span>
        </div>
        <div class="progress"><div class="progress-bar ${cls}" style="width:${pct}%"></div></div>
      </div>`;
  }).join("");

  $("#budgetEditor").innerHTML = CATEGORIES.expense.map((c) => `
    <div class="budget-edit-item">
      <label for="budget-${c.id}">${c.emoji} ${esc(c.name)}</label>
      <input type="number" id="budget-${c.id}" data-budget="${c.id}" min="0" step="any" inputmode="numeric"
        value="${Number(state.budgets[c.id]) || 0}" placeholder="0 = tidak diatur" />
    </div>`).join("");
}

/* ---------- Render: Target ---------- */
function renderGoals() {
  const goals = state.goals || [];
  $("#goalsFull").innerHTML = goals.map((g) => goalCardHTML(g, true)).join("");
  $("#goalsEmpty").hidden = goals.length > 0;
}

/* ---------- Charts ---------- */
function lastNMonths(n) {
  const out = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const key = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
    out.push({ key, label: x.toLocaleDateString("id-ID", { month: "short" }) });
  }
  return out;
}

function chartColors() {
  const dark = document.documentElement.dataset.theme === "dark";
  return {
    grid: dark ? "rgba(148,163,184,.15)" : "rgba(100,116,139,.15)",
    ticks: dark ? "#94a3b8" : "#64748b",
  };
}

function renderCharts() {
  if (typeof Chart === "undefined") return;
  const c = chartColors();
  Chart.defaults.font.family = "'Plus Jakarta Sans', system-ui, sans-serif";
  Chart.defaults.color = c.ticks;

  // Arus kas 6 bulan
  const months = lastNMonths(6);
  const inc = months.map((m) => totals(state.transactions.filter((t) => t.type === "income" && monthKey(t.date) === m.key)).income);
  const exp = months.map((m) => totals(state.transactions.filter((t) => t.type === "expense" && monthKey(t.date) === m.key)).expense);

  const ctx1 = $("#cashflowChart");
  if (ctx1) {
    if (cashflowChart) cashflowChart.destroy();
    cashflowChart = new Chart(ctx1, {
      type: "line",
      data: {
        labels: months.map((m) => m.label),
        datasets: [
          { label: "Pemasukan", data: inc, borderColor: "#16a34a", backgroundColor: "rgba(22,163,74,.12)", fill: true, tension: .35, pointRadius: 3, pointBackgroundColor: "#16a34a" },
          { label: "Pengeluaran", data: exp, borderColor: "#dc2626", backgroundColor: "rgba(220,38,38,.10)", fill: true, tension: .35, pointRadius: 3, pointBackgroundColor: "#dc2626" },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8 } },
          tooltip: { callbacks: { label: (i) => ` ${i.dataset.label}: ${fmtRpShort(i.parsed.y)}` } },
        },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: c.grid }, ticks: { callback: (v) => fmtRpShort(v) }, border: { display: false } },
        },
      },
    });
  }

  // Donat kategori pengeluaran
  const scope = state.transactions.filter((t) => t.type === "expense" && inPeriod(t));
  const byCat = {};
  for (const t of scope) byCat[t.category] = (byCat[t.category] || 0) + (Number(t.amount) || 0);
  const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 7);
  const totalExp = entries.reduce((s, [, v]) => s + v, 0);

  const ctx2 = $("#expenseChart");
  if (ctx2) {
    if (expenseChart) expenseChart.destroy();
    expenseChart = new Chart(ctx2, {
      type: "doughnut",
      data: {
        labels: entries.map(([id]) => categoryById(id).name),
        datasets: [{
          data: entries.map(([, v]) => v),
          backgroundColor: entries.map(([id], i) => categoryById(id).color || CHART_COLORS[i % CHART_COLORS.length]),
          borderWidth: 2,
          borderColor: getComputedStyle(document.body).getPropertyValue("--card") || "#fff",
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: "62%",
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (i) => ` ${i.label}: ${fmtRpShort(i.parsed)}` } },
        },
      },
    });
  }

  $("#expenseLegend").innerHTML = entries.length
    ? entries.map(([id, v]) => {
        const cat = categoryById(id);
        const pct = totalExp > 0 ? Math.round((v / totalExp) * 100) : 0;
        return `<li><span class="legend-dot" style="background:${cat.color}"></span>${cat.emoji} ${esc(cat.name)}<span class="legend-amount">${fmtRpShort(v)} · ${pct}%</span></li>`;
      }).join("")
    : `<li class="muted small">Belum ada data pengeluaran.</li>`;
}

/* ---------- Navigasi ---------- */
function showView(name) {
  currentView = name;
  $$(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
  $$(".nav-btn, .bottomnav-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (name === "dashboard") renderDashboard();
  if (name === "transaksi") { refreshFilterOptions(); renderTransactions(); }
  if (name === "budget") renderBudget();
  if (name === "target") renderGoals();
}

/* ---------- Modal helpers ---------- */
function openModal(id) { $("#" + id).hidden = false; }
function closeModal(id) { $("#" + id).hidden = true; }

/* ---------- Form transaksi ---------- */
function fillCategoryOptions(type) {
  const sel = $("#txCategory");
  sel.innerHTML = CATEGORIES[type].map((c) => `<option value="${c.id}">${c.emoji} ${esc(c.name)}</option>`).join("");
}

function openTxModal(tx) {
  const isEdit = Boolean(tx);
  $("#txModalTitle").textContent = isEdit ? "Ubah Transaksi" : "Transaksi Baru";
  $("#txId").value = isEdit ? tx.id : "";
  editingTxType = isEdit ? tx.type : "expense";
  $$(".type-btn").forEach((b) => b.classList.toggle("active", b.dataset.type === editingTxType));
  fillCategoryOptions(editingTxType);
  $("#txAmount").value = isEdit ? tx.amount : "";
  $("#txCategory").value = isEdit ? tx.category : CATEGORIES[editingTxType][0].id;
  $("#txDate").value = isEdit ? tx.date : isoDate(new Date());
  $("#txNote").value = isEdit ? (tx.note || "") : "";
  openModal("txModal");
  setTimeout(() => $("#txAmount").focus(), 50);
}

function saveTx(e) {
  e.preventDefault();
  const id = $("#txId").value;
  const amount = Number($("#txAmount").value);
  const category = $("#txCategory").value;
  const date = $("#txDate").value;
  const note = $("#txNote").value.trim();
  if (!amount || amount <= 0 || !date) { toast("Isi jumlah dan tanggal dengan benar."); return; }

  if (id) {
    const t = state.transactions.find((x) => x.id === id);
    if (t) Object.assign(t, { type: editingTxType, amount, category, date, note });
    toast("Transaksi diperbarui ✓");
  } else {
    state.transactions.push({ id: uid(), type: editingTxType, amount, category, date, note });
    toast("Transaksi ditambahkan ✓");
  }
  saveState();
  closeModal("txModal");
  refreshAll();
}

/* ---------- Form target ---------- */
function openGoalModal(goal) {
  $("#goalModalTitle").textContent = goal ? "Ubah Target" : "Target Baru";
  $("#goalId").value = goal ? goal.id : "";
  $("#goalName").value = goal ? goal.name : "";
  $("#goalTarget").value = goal ? goal.target : "";
  $("#goalCurrent").value = goal ? goal.current : "";
  $("#goalEmoji").value = goal ? (goal.emoji || "") : "";
  openModal("goalModal");
}

function saveGoal(e) {
  e.preventDefault();
  const id = $("#goalId").value;
  const name = $("#goalName").value.trim();
  const target = Number($("#goalTarget").value);
  const current = Number($("#goalCurrent").value) || 0;
  const emoji = $("#goalEmoji").value.trim() || "🎯";
  if (!name || !target || target <= 0) { toast("Isi nama dan target dengan benar."); return; }
  if (id) {
    const g = state.goals.find((x) => x.id === id);
    if (g) Object.assign(g, { name, target, current, emoji });
    toast("Target diperbarui ✓");
  } else {
    state.goals.push({ id: uid(), name, target, current, emoji });
    toast("Target dibuat ✓");
  }
  saveState();
  closeModal("goalModal");
  refreshAll();
}

/* ---------- Export / Import ---------- */
function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportCsv() {
  const rows = [["Tanggal", "Tipe", "Kategori", "Catatan", "Jumlah (Rp)"]];
  for (const t of sortedTx(state.transactions)) {
    rows.push([t.date, t.type === "income" ? "Pemasukan" : "Pengeluaran", categoryById(t.category).name, (t.note || "").replace(/"/g, '""'), t.amount]);
  }
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  download("finku-transaksi.csv", "\uFEFF" + csv, "text/csv;charset=utf-8");
  toast("CSV diunduh ✓");
}

function exportJson() {
  download("finku-backup.json", JSON.stringify(state, null, 2), "application/json");
  toast("Backup JSON diunduh ✓");
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!parsed || !Array.isArray(parsed.transactions)) throw new Error("Format tidak valid");
      state = {
        transactions: parsed.transactions,
        budgets: parsed.budgets || {},
        goals: parsed.goals || [],
        theme: parsed.theme || state.theme || "light",
      };
      saveState();
      applyTheme(state.theme);
      refreshAll();
      $("#settingsMsg").textContent = "Import berhasil ✓";
      toast("Data berhasil diimpor ✓");
    } catch (err) {
      $("#settingsMsg").textContent = "Gagal import: file tidak valid.";
    }
  };
  reader.readAsText(file);
}

/* ---------- Tema ---------- */
function applyTheme(theme) {
  state.theme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = state.theme;
  $("#iconMoon").style.display = state.theme === "dark" ? "none" : "";
  $("#iconSun").style.display = state.theme === "dark" ? "" : "none";
  saveState();
  if (currentView === "dashboard") renderCharts();
}

/* ---------- Refresh semua ---------- */
function refreshAll() {
  refreshFilterOptions();
  if (currentView === "dashboard") renderDashboard();
  else if (currentView === "transaksi") renderTransactions();
  else if (currentView === "budget") renderBudget();
  else if (currentView === "target") renderGoals();
  // dashboard charts tetap segar saat kembali
  if (currentView !== "dashboard") renderDashboard();
}

/* ---------- Init ---------- */
function init() {
  $("#todayLabel").textContent = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  applyTheme(state.theme || "light");

  // Navigasi
  $$(".nav-btn, .bottomnav-btn").forEach((b) => b.addEventListener("click", () => showView(b.dataset.view)));
  $$("[data-goto]").forEach((b) => b.addEventListener("click", () => showView(b.dataset.goto)));

  // Periode
  $$(".period-btn").forEach((b) => b.addEventListener("click", () => {
    currentPeriod = b.dataset.period;
    $$(".period-btn").forEach((x) => x.classList.toggle("active", x === b));
    renderDashboard();
  }));

  // Tombol tambah
  $("#addTxBtn").addEventListener("click", () => openTxModal(null));
  $("#addTxBtn2").addEventListener("click", () => openTxModal(null));
  $("#addGoalBtn").addEventListener("click", () => openGoalModal(null));

  // Tipe transaksi
  $$(".type-btn").forEach((b) => b.addEventListener("click", () => {
    editingTxType = b.dataset.type;
    $$(".type-btn").forEach((x) => x.classList.toggle("active", x === b));
    fillCategoryOptions(editingTxType);
  }));

  // Form
  $("#txForm").addEventListener("submit", saveTx);
  $("#goalForm").addEventListener("submit", saveGoal);

  // Tutup modal
  $$("[data-close]").forEach((b) => b.addEventListener("click", () => closeModal(b.dataset.close)));
  $$(".modal-backdrop").forEach((m) => m.addEventListener("click", (e) => { if (e.target === m) m.hidden = true; }));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") $$(".modal-backdrop").forEach((m) => { m.hidden = true; });
  });

  // Filter transaksi
  ["searchInput", "filterType", "filterCategory", "filterMonth"].forEach((id) => {
    $("#" + id).addEventListener("input", renderTransactions);
    $("#" + id).addEventListener("change", renderTransactions);
  });

  // Aksi per baris (delegasi)
  document.addEventListener("click", (e) => {
    const editBtn = e.target.closest("[data-edit]");
    const delBtn = e.target.closest("[data-del]");
    const gAdd = e.target.closest("[data-goal-add]");
    const gEdit = e.target.closest("[data-goal-edit]");
    const gDel = e.target.closest("[data-goal-del]");
    if (editBtn) {
      const t = state.transactions.find((x) => x.id === editBtn.dataset.edit);
      if (t) openTxModal(t);
    }
    if (delBtn) {
      if (confirm("Hapus transaksi ini?")) {
        state.transactions = state.transactions.filter((x) => x.id !== delBtn.dataset.del);
        saveState(); refreshAll(); toast("Transaksi dihapus");
      }
    }
    if (gAdd) {
      const g = state.goals.find((x) => x.id === gAdd.dataset.goalAdd);
      if (g) {
        const add = Number(prompt(`Tambah ke "${g.name}" (Rp):`, "100000"));
        if (add > 0) { g.current = (Number(g.current) || 0) + add; saveState(); refreshAll(); toast("Progres ditambahkan ✓"); }
      }
    }
    if (gEdit) {
      const g = state.goals.find((x) => x.id === gEdit.dataset.goalEdit);
      if (g) openGoalModal(g);
    }
    if (gDel) {
      if (confirm("Hapus target ini?")) {
        state.goals = state.goals.filter((x) => x.id !== gDel.dataset.goalDel);
        saveState(); refreshAll(); toast("Target dihapus");
      }
    }
  });

  // Budget editor (delegasi change)
  $("#budgetEditor").addEventListener("change", (e) => {
    const input = e.target.closest("[data-budget]");
    if (!input) return;
    const v = Number(input.value) || 0;
    state.budgets[input.dataset.budget] = v;
    saveState();
    renderBudget();
    toast("Budget disimpan ✓");
  });

  // Tema
  $("#themeToggle").addEventListener("click", () => {
    applyTheme(state.theme === "dark" ? "light" : "dark");
  });

  // Pengaturan
  $("#settingsBtn").addEventListener("click", () => { $("#settingsMsg").textContent = ""; openModal("settingsModal"); });
  $("#exportCsvBtn").addEventListener("click", exportCsv);
  $("#exportJsonBtn").addEventListener("click", exportJson);
  $("#importFile").addEventListener("change", (e) => { if (e.target.files[0]) importJson(e.target.files[0]); e.target.value = ""; });
  $("#seedBtn").addEventListener("click", () => {
    if (confirm("Muat ulang data contoh? Data saat ini akan diganti.")) {
      state = seedState();
      saveState(); applyTheme(state.theme); refreshAll();
      $("#settingsMsg").textContent = "Data contoh dimuat ✓";
    }
  });
  $("#resetBtn").addEventListener("click", () => {
    if (confirm("Hapus SEMUA data? Tindakan ini tidak bisa dibatalkan.")) {
      state = { transactions: [], budgets: {}, goals: [], theme: state.theme };
      saveState(); refreshAll();
      $("#settingsMsg").textContent = "Semua data dihapus.";
    }
  });

  refreshFilterOptions();
  renderDashboard();
}

document.addEventListener("DOMContentLoaded", init);
