# Dokumen Dokumentasi & Evaluasi Proyek
## Aplikasi Web "Islamic Millionaire" - KKN Wedomartani 2026

Dokumen ini berisi rekapitulasi lengkap dari seluruh fitur yang telah dibangun, komponen yang saat ini dikunci/belum diaktifkan (*Coming Soon*), serta analisis rekomendasi perbaikan dan pengembangan di masa depan.

---

## 1. 📌 Overview & Teknologi Utama (Tech Stack)

Aplikasi web **Islamic Millionaire** dirancang sebagai media sosialisasi dan edukasi keislaman interaktif berbasis kuis interaktif 15 pertanyaan (adaptasi format *Who Wants to Be a Millionaire*).

- **Framework Utama**: Next.js 15 (App Router) & React 18
- **Bahasa Pemrograman**: TypeScript (Strongly Typed)
- **Styling & Desain**: Vanilla CSS, Utility-first Tailwind CSS, CSS 3D Buttons (`globals.css`)
- **Animasi & Interaktivitas**: Framer Motion & Canvas-Confetti
- **Basis Data & Persistensi**: Supabase Cloud PostgreSQL (Tabel `questions`, `players`, `game_results`) & LocalStorage Fallback
- **Rendering Sertifikat**: HTML5 Canvas API (Dynamic Export PNG)

---

## 2. 🚀 Rekapitulasi Fitur yang Telah 100% Selesai Dibuat

### A. Main Menu & Header Profil Real (`WelcomeScreen.tsx`)
- **Visual & Animasi Logo**: Logo 3D `/image/logo.png` dengan animasi entrance slide-up dan floating loop (*Framer Motion*).
- **Header Profil Real**: Widget di pojok kanan atas merender Nama Pemain, Avatar Character PNG terpilih, Level XP, dan Poin Amal secara real-time.
- **Kartu Profil Interaktif**: Mengklik kartu profil header di pojok kanan atas langsung membuka pop-up modal **"Profil Saya"**.
- **Tombol Navigasi Utama**: Tombol 3D *Mulai Bermain* (Hijau), *Leaderboard* (Krem), *Pengaturan* (Sky Blue), dan *Tentang Kami*.

### B. Pop-Up Modal "Profil Saya" (`UserProfileModal.tsx`)
- **Ribbon Header Biru Melengkung**: Badge pita biru gradien `⭐ Profil Saya ⭐` lengkap dengan tombol close `✖` di kanan atas.
- **Sistem 20 Character Avatar PNG**:
  - Bingkai foto avatar melingkar emas.
  - Tombol Kamera `📷` di sudut kanan avatar untuk **membuka grid 20 pilihan Character Avatar PNG** (`1.png` – `20.png`).
- **Fitur Inline Edit Nama (✏️)**: Pemain dapat mengubah nama akun secara langsung menggunakan tombol pensil.
- **Level & XP Progress Bar**: Menampilkan `⭐ Lv. X`, progress bar XP, dan perolehan `💚 X Amal Point`.
- **Doa Penuntut Ilmu**: Kotak doa berisikan teks Arab **رَبِّ زِدْنِي عِلْمًا** beserta arti *"Ya Tuhanku, tambahkanlah kepadaku ilmu." (QS. Taha: 114)*.
- **4 Kartu Statistik Real (Tanpa Tab Bawah)**:
  1. 🏆 **Quiz Dimenangkan**: Total sesi kuis dimainkan
  2. 🎯 **Jawaban Benar**: Perbandingan jawaban benar (contoh: *42 / 50 Soal*)
  3. 📊 **Akurasi Benar**: Persentase nilai benar (contoh: *84%*)
  4. ⭐ **Poin Amal**: Total Poin Amal yang dikumpulkan

### C. Redesain Layar Pemilihan Kategori (`SetupScreen.tsx`)
- **Latar Belakang & Layout**: Menggunakan background `/image/mainmenubg1.jpg`, wadah krem (`#FFFDF3`), dan ribbon hijau `⭐ Pilih Kategori Kuis ⭐`.
- **Penyederhanaan Form**: Menghapus form input nama & avatar (karena sudah dikelola persisten oleh sistem profil), berfokus 100% pada **Pemilihan Bidang Keilmuan Islami**.
- **Kategori Kuis**: Campuran, Aqidah, Akhlak, Al-Qur'an, Nabi & Rasul, Ramadhan, Rukun Islam, Shalat, Doa Harian, Adab, dan Kehidupan Sehari-hari.
- **Tombol Masuk Arena**: Tombol 3D hijau berukuran besar **`MASUK ARENA KUIS ➔`**.

### D. Redesain Arena Kuis (`QuizArena.tsx` & `LadderPanel.tsx`)
- **Visual Arena**: Background `/image/backgroundGame2.jpg`, logo resmi `/image/logoarena.png`, dan gambar ustadz virtual `/image/tanyaustadz.png`.
- **Panel Tangga Poin Amal**: 15 Level (0 s/d 10.000 Poin Amal) dengan milestone aman di Level 5, 10, dan 15.
- **Timer Countdown**: 20 detik/soal.
- **Grid 4 Opsi Warna 3D**: Opsi A (Biru), B (Hijau), C (Emas/Oranye), D (Merah).
- **2 Lifelines (Bantuan)**:
  1. `50 : 50`: Eliminasi 2 pilihan jawaban salah (1x per sesi game).
  2. `Tanya Ustadz`: Modal petunjuk nasihat ustadz virtual (1x per sesi game).
- **Modal Pengaturan saat Bermain**: Opsi Mute/Unmute audio dan tombol **`🏠 KEMBALI KE MENU UTAMA`**.

### E. Redesain Pop-Up Penjelasan Jawaban (`AnswerFeedbackModal.tsx`)
- **Curved Ribbon Header**: Badge ribbon melengkung `Jawaban Benar!` (Hijau) atau `Jawaban Kurang Tepat` (Merah).
- **Ikon Utama 3D**: Centang hijau besar `✔` atau silang merah besar `✖`.
- **Box Komparasi Jawaban**: Menampilkan *Jawaban yang benar adalah:* (Badge Hijau) dan *Jawabanmu:* (Badge Merah) saat salah.
- **Box Penjelasan & Dalil**: Penjelasan edukatif `📗` dan kutipan Dalil `🏮` dengan gambar ikon `/image/lenteraicon.png`.
- **Aksi Tunggal**: 1 Tombol utama di kanan bawah **`Lanjut ke Soal Berikutnya ➔`** (tanpa tombol X dan tanpa tombol Pelajari Lagi).

### F. Summary Screen & Sertifikat Kelulusan Digital (`CertificateGenerator.tsx` & `page.tsx`)
- **Background Summary**: Gambar resmi `/image/backgroundSummary.jpg` dengan ornamen lentera gantung.
- **4 Stat Cards**: Total Skor, Jumlah Benar, Jumlah Salah, dan Waktu Pengerjaan.
- **Canvas Sertifikat Digital**:
  - Background `/image/backgroundGame2.jpg`.
  - Teks perolehan skor dibuat **Ultra Bold 900** (`1500 POIN`).
  - Fitur tombol **`UNDUH SERTIFIKAT (PNG)`**.
- **3 Tombol Navigasi**: `MAIN LAGI`, `LIHAT LEADERBOARD`, `KE MENU UTAMA`.

### G. Admin Dashboard & Bank Soal (`/admin`)
- **Autentikasi Passcode**: Passcode `ceritawedomartani`.
- **Manajemen Bank Soal**: CRUD persisten ke Supabase DB.
- **Fitur Massal**: Import CSV & Tombol **Download Template CSV** (`/template_soal.csv`).

---

## 3. 🔒 Fitur yang Dikunci / Belum Dibuka (Scope Limit)

Beberapa modul di dalam aplikasi saat ini sengaja dikunci dengan badge `🔒 COMING SOON` untuk menjaga fokus sosialisasi KKN 2026 pada mode kuis utama:

1. **Materi Islami**: Modul e-book/ringkasan materi keislaman per kategori.
2. **Daily Challenge**: Misi harian kuis dengan hadiah Poin Amal ganda.
3. **Badge & Achievement**: Pin/medali penghargaan berdasarkan pencapaian kuis.
4. **Toko (Shop Poin Amal)**: Fitur penukaran Poin Amal dengan avatar eksklusif atau tema arena.

---

## 4. 💡 Rekomendasi Perbaikan & Pengembangan Kedepannya

Untuk pengembangan versi berikutnya (pasca-KKN atau skala nasional), berikut beberapa rekomendasi teknis dan fitur yang disarankan:

### A. Keamanan Data & Autentikasi Akun (Security & Auth)
- **Supabase Auth Integration**: Saat ini profil tersimpan secara lokal & di-upsert ke Supabase melalui ID acak local storage. Disarankan menambahkan autentikasi Email/Google OAuth agar pemain dapat mengakses profil mereka di perangkat berbeda.
- **Server-Side Point Validation**: Membuat Supabase Edge Functions untuk memverifikasi perolehan Poin Amal secara server-side guna mencegah manipulasi skor dari sisi client.

### B. Fitur & Pengalaman Pengguna (User Experience)
- **Voice-over / Text-to-Speech (TTS) Ustadz**: Menambahkan efek suara pembacaan nasihat ustadz saat lifeline *Tanya Ustadz* digunakan.
- **Mode Battle Quiz 1v1 (Multiplayer Real-time)**: Memanfaatkan *Supabase Realtime WebSocket* agar dua pemain dapat bertanding kuis secara langsung dalam waktu bersamaan.
- **Aktivasi Modul Coming Soon**: Membuka modul *Materi Islami* agar pemain yang salah menjawab soal dapat langsung membaca ringkasan materi secara mendalam.

### C. Kinerja & Pembungkusan Aplikasi (Performance & Distribution)
- **PWA (Progressive Web App)**: Menambahkan `manifest.json` dan Service Worker agar aplikasi web ini dapat di-install langsung di HP Android/iOS layaknya aplikasi native tanpa melalui browser address bar.
- **Asset Preloading & Image Optimization**: Menggunakan Next.js `<Image />` optimization untuk mempercepat waktu *First Contentful Paint (FCP)* pada jaringan lambat saat sosialisasi lapangan.