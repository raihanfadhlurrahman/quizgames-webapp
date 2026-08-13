 1. Rekomendasi Struktur & Tata Letak UI Modern
A. Layout Utama (Sidebar Navigasi Kiri + Top Bar + Content Area)
Mengubah tata letak dari top tabs sederhana menjadi Admin Layout Berstandar Industri:

Left Sidebar Navigation (Desktop):

Logo Brand Admin KKN & Tag Status Supabase (Online / Connected).
Menu Navigasi Vertikal Ber-ikon:
📚 Bank Soal Kuis (Badge Jumlah Soal)
🏷️ Kelola Kategori (Badge Jumlah Kategori)
🎮 Sesi Room Live (Badge Sesi Aktif)
👥 Kelola Pemain & Skor (Badge Total Pemain)
Tombol Keluar Sesi Admin (Logout) di bagian bawah sidebar.
Top Bar Header:

Judul & Subjudul Halaman Aktif.
Indicator Sesi Admin Aktif (Avatar Admin & Role).
Tombol Akses Cepat (Primary Action Button) yang dinamis sesuai tab (misal: + Tambah Soal Baru / + Buat Room Live).
KPI Stat Summary Cards Grid (4 Kartu Metric): Di bagian atas konten, tampilkan 4 kartu statistik ringkas bergradien mewah:

Kartu 1: Total Bank Soal (dengan rincian 🕌 Islami, 🇲🇨 Kemerdekaan, 🎭 Kebudayaan).
Kartu 2: Total Kategori.
Kartu 3: Total Sesi Room Live.
Kartu 4: Total Pemain Terdaftar.
B. Desain Komponen Spesifik per Tab
Tab 1: Bank Soal Kuis
Filter Toolbar:
Filter Tema (Pill Buttons): Semua Tema, 🕌 Islami, 🇲🇨 Kemerdekaan, 🎭 Kebudayaan.
Kotak Cari Soal (Real-Time Search Bar) berdasarkan teks soal atau kategori.
Kelompok Tombol Aksi: Impor CSV / Copas, Export CSV, Sync Soal Bawaan.
Tabel Bank Soal Premium:
Badge Tema dengan warna khusus (Hijau Emerald untuk Islami, Merah Patriotik untuk Kemerdekaan, Cokelat Amber untuk Kebudayaan).
Badge Tingkat Kesulitan (Easy, Medium, Hard).
Kolom Pilihan Jawaban & Kunci Jawaban.
Kolom Penjelasan & Dalil/Rujukan.
Tombol Aksi Aksi Cepat (Edit & Hapus) dengan efek hover halus.
Tab 2: Kelola Kategori
Grid Kartu Kategori (Category Cards Grid) yang menampilkan Ikon Emoji besar, Tag Tema, Nama Kategori, dan Jumlah Soal di dalam kategori tersebut.
Tab 3: Sesi Room Live (Kahoot Mode)
Status Cards Sesi Room:
Kartu Room Kuis dengan PIN 6 Digit besar ber-aksen emas.
Badge Status (WAITING 🟡, PLAYING 🟢, FINISHED 🔴).
Tombol Buka Operator Controller Live untuk menjalankan kuis di proyektor.
Tab 4: Pemain & Papan Skor
Tabel Ranking Pemain dengan rincian Poin Amal, Poin Wawasan, Poin Kebudayaan, Level Pemain, dan Tombol Reset Leaderboard.