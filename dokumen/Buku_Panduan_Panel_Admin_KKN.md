# 📖 BUKU PANDUAN PENGGUNAAN PANEL ADMIN KKN
### Sistem Pengelolaan Kuis Edukasi Wedomartani (Islami, Kemerdekaan, & Kebudayaan)

---

## 📑 DAFTAR ISI

1. [BAB 1: Pendahuluan & Akses Administrator](#bab-1-pendahuluan--akses-administrator)
   - 1.1 Maksud dan Tujuan Buku Panduan
   - 1.2 Cara Masuk Sesi (*Login Admin*)
   - 1.3 Perangkat & Responsivitas (Laptop & Smartphone/HP)
2. [BAB 2: Antarmuka Dashboard Admin](#bab-2-antarmuka-dashboard-admin)
   - 2.1 Menu Navigasi Utama (Sidebar)
   - 2.2 Ringkasan Kartu KPI Statistik
   - 2.3 Baris Aksi Cepat (*Quick Action Bar*)
3. [BAB 3: Modul Bank Soal Kuis](#bab-3-modul-bank-soal-kuis)
   - 3.1 Langkah Menambah Soal Manual
   - 3.2 Panduan Impor Massal dari Excel / Google Sheets
   - 3.3 Format Struktur Kolom CSV
   - 3.4 Filter Tema, Pencarian, & Edit/Hapus Soal
4. [BAB 4: Modul Pengelolaan Kategori](#bab-4-modul-pengelolaan-kategori)
   - 4.1 Langkah Menambahkan Kategori Baru
   - 4.2 Penataan Emoji Ikon & Deskripsi Topik
   - 4.3 Mengedit Kategori
5. [BAB 5: Modul Sesi Room Live & Layar Proyektor](#bab-5-modul-sesi-room-live--layar-proyektor)
   - 5.1 Konsep Pertandingan Live Proyektor
   - 5.2 Langkah Membuat Room Live Baru & PIN 6-Digit
   - 5.3 Menayangkan Layar Proyektor (Host View)
   - 5.4 Mengendalikan Jalannya Pertandingan (Timer, Grafik, & Leaderboard Live)
6. [BAB 6: Modul Pemain & Rekapitulasi Skor](#bab-6-modul-pemain--rekapitulasi-skor)
   - 6.1 Daftar Akun Peserta Terdaftar
   - 6.2 Pemantauan Perolehan Poin Amal, Wawasan, & Budaya
   - 6.3 Pencarian Peserta
7. [BAB 7: Troubleshooting & Penanganan Kendala Teknis](#bab-7-troubleshooting--penanganan-kendala-teknis)

---

## BAB 1: Pendahuluan & Akses Administrator

### 1.1 Maksud dan Tujuan Buku Panduan
Buku Panduan ini disusun sebagai pedoman operasional lengkap bagi Panitia KKN Wedomartani, Pengajar/Guru, maupun Host Acara Kuis dalam mengelola seluruh konten kuis interaktif. Melalui Panel Admin ini, pengelola dapat menambahkan soal, mengatur kategori, melangsungkan pertandingan kuis live berbasis proyektor, hingga memantau statistik poin para peserta.

### 1.2 Cara Masuk Sesi (*Login Admin*)
1. Buka peramban (*browser*) web dan kunjungi alamat aplikasi admin:
   `http://localhost:3000/admin` (atau URL domain resmi aplikasi KKN).
2. Pada layar **Sesi Masuk Admin KKN**:
   - **Username**: `admin`
   - **Password**: `ceritawedomartani`
3. Klik tombol **MASUK PANEL ADMIN**.
4. Apabila kredensial benar, Anda akan langsung diarahkan ke Dashboard Pengelola.

### 1.3 Perangkat & Responsivitas (Laptop & Smartphone/HP)
- **Komputer / Laptop**: Direkomendasikan untuk pengelolaan konten massal (seperti impor CSV/Excel) dan mengoperasikan **Layar Proyektor Host View**.
- **Smartphone / HP / Tablet**: Panel Admin telah dilengkapi **Mobile Drawer Menu (`[ ☰ Menu ]`)** sehingga pengelola tetap dapat memantau atau menambah soal secara fleksibel dari smartphone.

---

## BAB 2: Antarmuka Dashboard Admin

### 2.1 Menu Navigasi Utama (Sidebar)
Terletak pada sisi kiri halaman (atau diakses via tombol `[ ☰ Menu ]` pada HP):
- 📚 **Bank Soal Kuis**: Tempat mengelola seluruh daftar soal.
- 🏷️ **Kelola Kategori**: Tempat mengatur topik kuis dan emoji ikon per tema.
- 🎮 **Sesi Room Live**: Tempat menerbitkan PIN pertandingan dan membuka Layar Proyektor Host.
- 👥 **Pemain & Skor**: Tempat melihat rekapitulasi poin seluruh peserta terdaftar.
- 📖 **Panduan Panel Admin**: Bantuan interaktif bertahap kapan saja.

### 2.2 Ringkasan Kartu KPI Statistik
Menampilkan rangkuman realtime statistik di bagian atas dashboard:
1. **Total Soal**: Jumlah keseluruhan soal aktif beserta rincian tema (🕌 Islami, 🇲🇨 Kemerdekaan, 🎭 Kebudayaan).
2. **Kategori**: Jumlah topik kategori yang terdaftar di sistem.
3. **Sesi Room Live**: Jumlah sesi room live yang pernah dibuat (Status Aktif vs Selesai).
4. **Pemain Terdaftar**: Jumlah total akun peserta yang terhubung dengan statistik leaderboard.

### 2.3 Baris Aksi Cepat (*Quick Action Bar*)
- **Google Sheets**: Membuka berkas template soal resmi di Google Sheets.
- **Download CSV**: Mengunduh berkas template `.csv` kosong ke perangkat.
- **Ekspor (CSV)**: Mengunduh data soal yang ada di database ke file CSV.
- **Impor (CSV)**: Membuka modal impor massal soal cepat.
- **Sync 15 Soal**: Sinkronisasi ulang 15 soal bawaan awal ke database.
- **+ Action Button**: Tombol kontekstual sesuai tab aktif (`+ Tambah Soal Baru`, `+ Tambah Kategori Baru`, atau `+ Buat Room Live`).

---

## BAB 3: Modul Bank Soal Kuis

### 3.1 Langkah Menambah Soal Manual
1. Pastikan Anda berada di tab **📚 Bank Soal Kuis**.
2. Klik tombol **`+ Tambah Soal Baru`** di pojok kanan atas.
3. Isikan formulir dengan rincian berikut:
   - **Tema Target**: Pilih salah satu dari *Mode Islami 🕌*, *Mode Kemerdekaan 🇲🇨*, atau *Mode Kebudayaan 🎭*.
   - **Kategori**: Masukkan nama kategori kuis (misal: *Aqidah*, *Sejarah Kemerdekaan*, *Pakaian Adat*).
   - **Tingkat Kesulitan**: Pilih *Mudah (Easy)*, *Sedang (Medium)*, atau *Sulit (Hard)*.
   - **Teks Pertanyaan**: Ketikkan kalimat pertanyaan kuis secara jelas.
   - **Pilihan Jawaban**: Isi Pilihan A, Pilihan B, Pilihan C, dan Pilihan D.
   - **Kunci Jawaban**: Tentukan opsi mana yang merupakan jawaban benar (A / B / C / D).
   - **Penjelasan & Dalil**: *(Sangat dianjurkan)* Masukkan teks penjelasan pembahasan, dalil/ayat/hadits, dan bantuan ustadz.
4. Klik **`SIMPAN SOAL`**.

### 3.2 Panduan Impor Massal dari Excel / Google Sheets
Untuk memasukkan puluhan hingga ratusan soal sekaligus tanpa mengetik satu per satu:
1. Klik tombol **`Impor (CSV)`** pada baris aksi cepat.
2. Buka aplikasi **Microsoft Excel** atau **Google Sheets** yang berisi data kuis Anda.
3. Blok baris data tabel soal (tanpa mengikutkan header judul kolom) ➔ Tekan **Ctrl + C**.
4. Pada modal Impor di aplikasi, tempelkan (**Ctrl + V**) data tersebut ke dalam kotak teks.
5. Klik **`PRATINJAU & VALIDASI TEKS`**.
6. Sistem akan mengecek keabsahan tiap kolom. Apabila status menunjukkan **Ready**, klik **`SIMPAN SOAL KE DATABASE`**.

### 3.3 Format Struktur Kolom CSV
Apabila Anda menggunakan berkas `.csv`, urutan kolom wajib disusun sebagai berikut:
`theme_id, category_name, difficulty, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, dalil, ustadz_hint`

*Contoh Baris Data CSV:*
`islamic,Rukun Islam,easy,Berapakah jumlah Rukun Islam?,4 perkara,5 perkara,6 perkara,7 perkara,B,Rukun Islam ada 5 perkara,HR. Bukhari,Syahadat`

### 3.4 Filter Tema, Pencarian, & Edit/Hapus Soal
- **Filter Tema**: Gunakan pill filter di bawah header (*Semua Soal*, *Aqidah & Islami*, *Kemerdekaan*, *Kebudayaan*) untuk memilah daftar soal.
- **Kolom Pencarian**: Ketikkan kata kunci pertanyaan pada kotak pencarian di kanan.
- **Edit Soal**: Klik ikon pensil (✏️) pada baris soal ➔ Perbarui data ➔ Klik **`SIMPAN PERUBAHAN`**.
- **Hapus Soal**: Klik ikon tong sampah (🗑️) pada baris soal ➔ Konfirmasi penghapusan.

---

## BAB 4: Modul Pengelolaan Kategori

### 4.1 Langkah Menambahkan Kategori Baru
1. Pindah ke tab **🏷️ Kelola Kategori** pada menu navigasi kiri.
2. Klik tombol **`+ Tambah Kategori Baru`**.
3. Lengkapi formulir kategori:
   - **Tema Kategori**: Tentukan tema utama (Islami / Kemerdekaan / Kebudayaan).
   - **Nama Kategori**: Masukkan nama topik (misal: *Fiqih Ibadah*, *Kuliner Nusantara*, *Pahlawan Nasional*).
   - **Ikon Emoji**: Pilih emoji pengenal (misal: 🕌, 🇮🇩, 🎭, 📜, 🏆, 🍜).
   - **Deskripsi**: Tuliskan penjelasan singkat isi kategori.
4. Klik **`SIMPAN KATEGORI`**.

### 4.2 Penataan Emoji Ikon & Deskripsi Topik
Ikon emoji dan deskripsi yang Anda atur akan langsung muncul pada beranda utama permainan peserta, memudahkan mereka dalam memilih topik kuis favorit.

### 4.3 Mengedit Kategori
- Klik tombol ikon pensil (✏️) pada kartu kategori yang ingin diperbarui.
- Ubah nama, emoji, atau deskripsi, lalu klik **`SIMPAN KATEGORI`**.

---

## BAB 5: Modul Sesi Room Live & Layar Proyektor

### 5.1 Konsep Pertandingan Live Proyektor
Mode Room Live dirancang untuk pertandingan kuis interaktif secara tatap muka (misal: di aula, masjid, atau panggung acara KKN). Layar laptop admin ditayangkan ke **Proyektor/TV Utama (Host View)**, sementara seluruh peserta menjawab soal secara bersamaan menggunakan smartphone masing-masing.

### 5.2 Langkah Membuat Room Live Baru & PIN 6-Digit
1. Buka tab **🎮 Sesi Room Live** ➔ Klik **`+ Buat Room Live`**.
2. Isikan rincian sesi:
   - **Judul Sesi**: Misal *Kuis Kemerdekaan RT 02* atau *Lomba Cerdas Cermat KKN*.
   - **Pilih Tema Soal**: Islami / Kemerdekaan / Kebudayaan.
   - **Timer Per Soal**: Tentukan durasi (misal: 15 detik, 20 detik, atau 30 detik).
3. Klik **`BUAT ROOM LIVE`**.
4. Sistem akan otomatis menerbitkan **Kode PIN 6-Digit** unik (misal: `742918`).

### 5.3 Menayangkan Layar Proyektor (Host View)
1. Sambungkan laptop admin ke Proyektor/TV Utama menggunakan kabel HDMI atau Screen Cast.
2. Pada tabel sesi room live di dashboard admin, klik tombol **`💻 Buka Layar Proyektor`**.
3. Layar proyektor fullscreen akan terbuka, menampilkan Kode PIN 6-Digit dan petunjuk bergabung bagi peserta.
4. Peserta membuka peramban di HP ➔ Memilih menu **`JOIN ROOM LIVE`** ➔ Memasukkan Kode PIN & Nama Panggilan.
5. Nama peserta yang berhasil bergabung akan muncul secara realtime di layar proyektor.

### 5.4 Mengendalikan Jalannya Pertandingan
1. Setelah semua peserta siap di layar tunggu, Host menekan tombol **`Mulai Pertandingan`**.
2. Soal kuis dan hitung mundur timer akan berjalan secara serentak di layar proyektor dan HP peserta.
3. Setelah timer soal habis, layar proyektor otomatis menayangkan **Grafik Realtime Distribusi Jawaban Peserta** dan **Pembahasan/Dalil**.
4. Klik **`Soal Berikutnya`** untuk melanjutkan ke pertanyaan selanjutnya.

### 5.5 Menuntaskan Pertandingan & Mengumumkan Pemenang
Pada akhir soal terakhir, layar proyektor akan menampilkan **Selebrasi Papan Skor Pemenang (Podium Juara 1, 2, dan 3)** secara spektakuler.

---

## BAB 6: Modul Pemain & Rekapitulasi Skor

### 6.1 Daftar Akun Peserta Terdaftar
Buka tab **👥 Pemain & Skor** untuk melihat seluruh akun peserta yang pernah terdaftar di aplikasi permainan.

### 6.2 Pemantauan Perolehan Poin Amal, Wawasan, & Budaya
Sistem secara otomatis mengelompokkan poin akumulasi peserta ke dalam 3 indikator utama:
- **Poin Amal**: Diperoleh dari ketepatan menjawab Kuis Islami.
- **Poin Wawasan**: Diperoleh dari ketepatan menjawab Kuis Kemerdekaan.
- **Poin Budaya**: Diperoleh dari ketepatan menjawab Kuis Kebudayaan.
- **Poin Total**: Penjumlahan keseluruhan poin yang menentukan posisi peserta di Leaderboard Utama.

### 6.3 Pencarian Peserta
Ketikkan nama peserta pada kolom pencarian di bagian kanan atas tabel untuk mengecek skor individu secara instan.

---

## BAB 7: Troubleshooting & Penanganan Kendala Teknis

| Kendala Teknis | Kemungkinan Penyebab | Solusi Penanganan |
| :--- | :--- | :--- |
| **Tidak Bisa Login Admin** | Salah mengetik username/password | Pastikan Username: `admin` dan Password: `ceritawedomartani`. |
| **Impor CSV Gagal / Error** | Format kolom CSV tidak sesuai | Pastikan urutan kolom sesuai standar: `theme_id, category_name, difficulty, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, dalil, ustadz_hint`. Gunakan fitur *Copas Langsung* dari Excel. |
| **Peserta Tidak Bisa Join Room Live** | Kode PIN salah atau sesi telah selesai | Pastikan peserta memasukkan Kode PIN 6-Digit yang aktif dan jaringan internet stabil. |
| **Soal Tidak Muncul di Layar Peserta** | Koneksi internet terputus | Minta peserta melakukan refresh (*F5* / tarik layar HP ke bawah). |

---

*Disusun oleh Tim KKN Wedomartani — Dokumentasi Resmi Aplikasi Kuis Edukasi Wedomartani.*
