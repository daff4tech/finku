<div align="center">

<img src="https://img.shields.io/badge/FinKu-Dashboard%20Keuangan%20Pribadi-0f766e?style=flat-square" alt="FinKu" />

# 💰 FinKu — Dashboard Keuangan Pribadi

**Catat, pantau, dan raih tujuan finansialmu — semua dalam satu dashboard yang cantik dan cepat.**

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/id/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/id/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/id/docs/Web/JavaScript)
[![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat-square&logo=chart.js&logoColor=white)](https://www.chartjs.org/)
[![PWA](https://img.shields.io/badge/PWA-ready-12b76a?style=flat-square&logo=pwa&logoColor=white)](#-fitur)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](#-deploy)

[**Demo Live**](#-coba-sekarang) ·
[**Fitur**](#-fitur) ·
[**Quick Start**](#-quick-start) ·
[**Struktur Proyek**](#-struktur-proyek)

</div>

---

> **FinKu** adalah aplikasi web keuangan pribadi yang sepenuhnya berjalan di browser. Tanpa server, tanpa registrasi, tanpa langganan. Semua data tersimpan aman di perangkatmu (localStorage) — cepat, privat, dan bisa dipasang sebagai aplikasi (PWA).

## 📸 Tampilan

| Dashboard | Transaksi |
| :---: | :---: |
| Grafik arus kas 6 bulan, donat pengeluaran per kategori, dan ringkasan saldo | Cari, filter tipe/kategori/bulan, ubah & hapus transaksi |

| Budget | Target Tabungan |
| :---: | :---: |
| Progress bar per kategori dengan status aman / hampir habis / melebihi | Pantau progres dana darurat, liburan, gadget, dan lainnya |

## ✨ Fitur

- **📊 Dashboard interaktif** — Saldo total, pemasukan, pengeluaran, dan rasio tabungan dengan grafik arus kas (line) serta donat pengeluaran per kategori (Chart.js).
- **🧾 Manajemen transaksi lengkap** — Tambah, ubah, hapus pemasukan & pengeluaran dengan 14 kategori ber-emoji, pencarian, dan filter tipe/kategori/bulan.
- **🎯 Budget bulanan** — Atur batas per kategori dengan indikator progres berwarna (aman → hampir habis → melebihi).
- **🏆 Target tabungan** — Buat tujuan (dana darurat, liburan, laptop), tambah progres, dan rayakan saat tercapai.
- **🌙 Mode gelap/terang** — Tema elegan yang mengikuti preferensi, tersimpan otomatis.
- **🔒 100% privat & offline** — Data hanya di `localStorage` browsermu. Tidak ada server, tidak ada pelacakan.
- **⬇ Export & import** — Unduh transaksi ke CSV, backup & pulihkan data dengan JSON.
- **📱 PWA-ready & responsif** — Tampilan mobile-first dengan navigasi bawah, siap dipasang ke layar utama.
- **🇮🇩 Bahasa Indonesia penuh** — Format Rupiah (`Rp`), tanggal lokal, dan data contoh realistis.

## 🚀 Coba Sekarang

Buka `index.html` langsung di browser, atau jalankan server lokal:

```bash
# Python
python3 -m http.server 8000

# atau Node.js
npx serve .
```

Lalu buka [http://localhost:8000](http://localhost:8000). Data contoh akan dimuat otomatis pada kunjungan pertama.

## ⚡ Quick Start

Tidak perlu build step — cukup buka file-nya:

```bash
git clone https://github.com/daff4tech/finku.git
cd finku
# buka index.html di browser, atau:
python3 -m http.server 8000
```

## 🛠 Deploy

### Vercel (disarankan)

```bash
npm i -g vercel
vercel
```

Atau impor repositori ini di [vercel.com/new](https://vercel.com/new) — framework: **Other**, tanpa build command.

### GitHub Pages

```bash
# aktifkan Pages dari branch main, folder / (root)
```

### Netlify / Render / Docker statis

Serve folder root sebagai situs statis. Tidak ada dependensi server.

## 🗂 Struktur Proyek

```
finku/
├── index.html            # Struktur & tampilan (SPA 4 view)
├── css/
│   └── styles.css        # Seluruh gaya + tema gelap/terang
├── js/
│   ├── data.js           # Kategori, data contoh, util tanggal
│   └── app.js            # State, CRUD, filter, grafik, export/import
├── public/
│   └── manifest.json     # Manifest PWA
├── vercel.json           # Konfigurasi deploy Vercel
├── package.json
└── README.md
```

## 🧭 Cara Pakai

1. **Tambah transaksi** — Klik *Transaksi Baru*, pilih Pemasukan/Pengeluaran, isi jumlah, kategori, tanggal, dan catatan.
2. **Atur budget** — Buka menu *Budget*, isi batas untuk tiap kategori. Progress bar akan menandakan statusnya.
3. **Buat target** — Buka menu *Target*, tentukan nama, nominal target, dan progres awal. Gunakan *+ Tambah* untuk menambah tabungan.
4. **Backup data** — Buka ikon ⚙️ untuk export CSV/JSON, import backup, atau reset.

## 🔐 Privasi

Semua data disimpan di `localStorage` dengan kunci `finku-state-v1`. Tidak ada data yang dikirim ke mana pun. Untuk menghapus semua data, gunakan *Hapus Semua Data* di Pengaturan.

## 🗺 Roadmap

- [ ] Grafik mingguan & tahunan
- [ ] Pengingat tagihan berulang
- [ ] Multi-dompet / multi-akun lokal
- [ ] Sinkronisasi cloud opsional (Google Drive)
- [ ] Mode bahasa Inggris

## 📄 Lisensi

MIT — bebas digunakan untuk belajar dan proyek pribadi. Dibuat dengan ❤️ oleh [daff4tech](https://github.com/daff4tech).
