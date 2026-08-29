# Spesifikasi Elemen UI — `/public/image/elemenbuku`

Dokumen ini mendefinisikan aturan penggunaan setiap aset visual dalam folder `elemenbuku` agar tampilan UI tidak berantakan di berbagai ukuran layar.

---

## Konvensi Penulisan

| Kolom | Keterangan |
|---|---|
| **Tipe** | background / button / icon / illustration / panel |
| **Aspect Ratio** | Rasio lebar:tinggi asli gambar yang harus dijaga |
| **Boleh Stretch?** | Apakah gambar boleh di-stretch bebas (object-fill/object-cover) |
| **Min Size** | Ukuran minimum agar masih terbaca |
| **Max Size** | Ukuran maksimum agar tidak memakan layar |
| **Responsive Rule** | Aturan saat layar mengecil (mobile) |
| **Crop Rule** | Boleh terpotong atau harus terlihat seluruhnya |
| **Positioning Rule** | Cara penempatan di dalam layout |

---

## 1. `buku.png` — Buku Terbuka

| Atribut | Nilai |
|---|---|
| **Tipe** | Background / Illustration Panel |
| **Aspect Ratio** | ~4:3 (landscape, lebar > tinggi) |
| **Boleh Stretch?** | ❌ Tidak — `object-contain` wajib. Jika di-stretch, buku akan terlihat gepeng |
| **Min Size** | Lebar min 320px |
| **Max Size** | Lebar max 90vw, tinggi max 75vh |
| **Responsive Rule** | Biarkan mengecil proporsional. Di mobile (<640px) bisa dibuat 100vw tapi tetap `object-contain` |
| **Crop Rule** | Harus terlihat seluruhnya — termasuk sudut emas dan spine tengah |
| **Positioning Rule** | `relative` wrapper + `absolute inset-0` untuk konten di atasnya |
| **Catatan** | Konten halaman kiri/kanan harus diletakkan di atas gambar ini menggunakan `absolute` layer. Spine (garis tengah) berada di 50% horizontal. Margin atas ±7%, bawah ±10%, kiri/kanan ±6% dari ukuran gambar |

---

## 2. `backgroundChapter.png` — Banner/Pita Judul Kategori

| Atribut | Nilai |
|---|---|
| **Tipe** | Background Banner |
| **Aspect Ratio** | ~5:1 (sangat lebar, tipis) |
| **Boleh Stretch?** | ⚠️ Boleh horizontal saja — `object-fill` diizinkan karena dekorasi pinggir hampir simetris |
| **Min Size** | Lebar min 160px, tinggi min 40px |
| **Max Size** | Lebar max 500px, tinggi max 80px |
| **Responsive Rule** | Di mobile: `max-w-xs` (maks 240px), tinggi 48px |
| **Crop Rule** | Harus terlihat seluruhnya — terutama ujung pita di kiri-kanan |
| **Positioning Rule** | `relative` wrapper + `<img absolute inset-0 object-fill>` + teks `absolute` di atas |
| **Catatan** | ⚠️ PENTING: Area teks (pita merah datar) berada di **bagian atas 55–60%** gambar. Teks harus diposisikan dengan `pt-[10%]` hingga `pt-[15%]` — BUKAN di tengah-tengah, karena bagian bawah gambar adalah lipatan pita yang melengkung ke bawah. Gunakan `text-white font-black uppercase` |

---

## 3. `nohalaman.png` — Papan Nomor Halaman

| Atribut | Nilai |
|---|---|
| **Tipe** | Background Panel / Indicator |
| **Aspect Ratio** | ~4:3 (lebih lebar dari tinggi, dengan bookmark merah di bawah) |
| **Boleh Stretch?** | ⚠️ Boleh dengan `object-fill` — border relatif tipis sehingga distorsi tidak terlihat mencolok |
| **Min Size** | Lebar min 120px, tinggi min 50px |
| **Max Size** | Lebar max 220px, tinggi max 80px |
| **Responsive Rule** | Di mobile: lebar 140px, tinggi 56px |
| **Crop Rule** | Boleh sedikit crop di sisi kiri/kanan, tapi bookmark merah di bawah harus tampil |
| **Positioning Rule** | `relative` wrapper + `<img absolute inset-0 object-fill>` + teks `absolute` |
| **Catatan** | ⚠️ PENTING: Area teks (papan krem) hanya di **bagian atas 50–55%** gambar. Teks harus diposisikan dengan `pt-[8%]` hingga `pt-[12%]`. Bagian bawah adalah bookmark merah yang tidak boleh ditimpa teks. Gunakan `font-black text-amber-950 uppercase tracking-wider` |

---

## 4. `kembalibutton.png` — Tombol Kembali

| Atribut | Nilai |
|---|---|
| **Tipe** | Button |
| **Aspect Ratio** | ~2.5:1 (landscape, jauh lebih lebar dari tinggi) |
| **Boleh Stretch?** | ❌ Tidak — `object-contain` wajib |
| **Min Size** | Lebar min 100px, tinggi min 38px |
| **Max Size** | Lebar max 180px, tinggi max 56px |
| **Responsive Rule** | Desktop: `w-44 h-14`. Mobile: `w-32 h-11` |
| **Crop Rule** | Harus terlihat seluruhnya — teks "Kembali" dan ikon panah harus tampil |
| **Positioning Rule** | Normal flow / flex item, `flex-shrink-0` |
| **Catatan** | Jangan gunakan sebagai kotak persegi — tombol ini landscape. Tambahkan `hover:scale-105 active:scale-95 active:brightness-90 transition` |

---

## 5. `back.png` — Tombol Panah Kiri (Navigasi Halaman)

| Atribut | Nilai |
|---|---|
| **Tipe** | Button / Icon |
| **Aspect Ratio** | ~1:1 (hampir persegi, sedikit lebih lebar) |
| **Boleh Stretch?** | ❌ Tidak — `object-contain` |
| **Min Size** | 40×40px |
| **Max Size** | 80×80px |
| **Responsive Rule** | Desktop: `w-20 h-14`. Mobile: `w-14 h-10` |
| **Crop Rule** | Harus terlihat seluruhnya |
| **Positioning Rule** | Flex item dalam baris navigasi bawah |
| **Catatan** | Pasangan dengan `next.png`. Gunakan `opacity-40 pointer-events-none` saat sudah di halaman pertama |

---

## 6. `next.png` — Tombol Panah Kanan (Navigasi Halaman)

| Atribut | Nilai |
|---|---|
| **Tipe** | Button / Icon |
| **Aspect Ratio** | ~1:1 |
| **Boleh Stretch?** | ❌ Tidak — `object-contain` |
| **Min Size** | 40×40px |
| **Max Size** | 80×80px |
| **Responsive Rule** | Desktop: `w-20 h-14`. Mobile: `w-14 h-10` |
| **Crop Rule** | Harus terlihat seluruhnya |
| **Positioning Rule** | Flex item dalam baris navigasi bawah |
| **Catatan** | Gunakan `opacity-40 pointer-events-none` saat sudah di halaman terakhir |

---

## 7. `onspeak.png` / `offspeak.png` — Toggle Audio (Mute/Unmute)

| Atribut | Nilai |
|---|---|
| **Tipe** | Button / Icon |
| **Aspect Ratio** | 1:1 (bulat sempurna) |
| **Boleh Stretch?** | ❌ Tidak — harus tetap bulat. Gunakan `object-contain` dan container persegi |
| **Min Size** | 36×36px |
| **Max Size** | 56×56px |
| **Responsive Rule** | Desktop: `w-14 h-14`. Mobile: `w-10 h-10` |
| **Crop Rule** | Harus terlihat seluruhnya — terutama icon speaker di dalam lingkaran |
| **Positioning Rule** | Flex item di pojok kanan header. `flex-shrink-0` |
| **Catatan** | `offspeak.png` ukuran asli sangat besar (1MB+). Pastikan container dibatasi agar tidak full screen. Gunakan `hover:scale-105 active:scale-95 transition` |

---

## 8. `backgroundheadline.png` — Background Judul Konten Kanan

| Atribut | Nilai |
|---|---|
| **Tipe** | Background Label/Banner |
| **Aspect Ratio** | ~6:1 (sangat lebar dan tipis seperti pita) |
| **Boleh Stretch?** | ⚠️ Boleh horizontal — `object-fill`. Lencana ungu kiri harus tidak terpotong |
| **Min Size** | Lebar min 100px, tinggi min 24px |
| **Max Size** | Lebar max 100% lebar halaman kanan, tinggi max 36px |
| **Responsive Rule** | Ikuti lebar parent container, tinggi tetap ±28px di mobile hingga ±36px di desktop |
| **Crop Rule** | ⚠️ Jangan crop bagian kiri — lencana ungu di ujung kiri adalah penanda visual penting |
| **Positioning Rule** | `relative` wrapper dengan tinggi tetap + `<img absolute inset-0 object-fill>` + teks `absolute` |
| **Catatan** | Teks harus ditulis `text-white font-black` dan diposisikan secara `absolute` di tengah (bukan menggunakan background-image CSS). Padding kiri minimum `pl-6` untuk menghindari lencana |

---

## 9. `backgroundpoin.png` — Background Poin/Bullet Emas

| Atribut | Nilai |
|---|---|
| **Tipe** | Background Label (per baris) |
| **Aspect Ratio** | ~8:1 (sangat lebar, sangat tipis) |
| **Boleh Stretch?** | ⚠️ Boleh horizontal. Bintang emas di kiri tidak boleh terpotong |
| **Min Size** | Lebar min 80px, tinggi min 22px |
| **Max Size** | Lebar max 100% lebar konten, tinggi max 36px |
| **Responsive Rule** | Ikuti lebar parent, tinggi tetap ±28px |
| **Crop Rule** | ⚠️ Bintang emas di kiri harus selalu tampil. Teks harus dimulai dengan `pl-7` atau lebih |
| **Positioning Rule** | `relative` wrapper + `<img absolute inset-0 object-fill>` + teks `relative z-10 pl-7` |
| **Catatan** | Digunakan untuk setiap baris bullet point. Warna emas, teks `text-amber-950 font-bold text-xs` |

---

## 10. `backgroundpoin2.png` — Background Poin/Bullet Hijau (Alternatif)

| Atribut | Nilai |
|---|---|
| **Tipe** | Background Label (per baris) |
| **Aspect Ratio** | ~8:1 |
| **Boleh Stretch?** | ⚠️ Boleh horizontal. Bintang hijau di kiri tidak boleh terpotong |
| **Min Size** | Lebar min 80px, tinggi min 22px |
| **Max Size** | Lebar max 100% lebar konten, tinggi max 36px |
| **Responsive Rule** | Sama dengan `backgroundpoin.png` |
| **Crop Rule** | Bintang hijau di kiri harus tampil |
| **Positioning Rule** | Sama dengan `backgroundpoin.png` |
| **Catatan** | Alternatif warna hijau untuk variasi visual. Boleh digunakan bergantian dengan `backgroundpoin.png` |

---

## 11. `buttondalil.png` — Tombol Lihat Dalil

| Atribut | Nilai |
|---|---|
| **Tipe** | Button |
| **Aspect Ratio** | ~2:1 (landscape, seperti kapsul) |
| **Boleh Stretch?** | ❌ Tidak — `object-fill` boleh tapi hanya dalam range terbatas agar ikon buku di kiri tidak gepeng |
| **Min Size** | Lebar min 90px, tinggi min 34px |
| **Max Size** | Lebar max 140px, tinggi max 48px |
| **Responsive Rule** | Desktop: `w-32 h-10`. Mobile: `w-24 h-8` |
| **Crop Rule** | Harus terlihat seluruhnya — ikon buku di kiri adalah penanda visual |
| **Positioning Rule** | Flex item dalam baris tombol aksi di bawah konten kanan |
| **Catatan** | Teks "Lihat Dalil" harus diletakkan sebagai `relative z-10` di atas gambar. Gunakan `font-black text-amber-950 text-[9px]` |

---

## 12. `buttontahukahkamu.png` — Tombol Tahukah Kamu?

| Atribut | Nilai |
|---|---|
| **Tipe** | Button |
| **Aspect Ratio** | ~2.5:1 (landscape, lebih lebar dari buttondalil) |
| **Boleh Stretch?** | ❌ Tidak — ikon bola lampu di kiri harus proporsional |
| **Min Size** | Lebar min 90px, tinggi min 34px |
| **Max Size** | Lebar max 150px, tinggi max 48px |
| **Responsive Rule** | Desktop: `w-36 h-10`. Mobile: `w-28 h-8` |
| **Crop Rule** | Harus terlihat seluruhnya |
| **Positioning Rule** | Flex item di sebelah `buttondalil.png` |
| **Catatan** | Teks "Tahukah Kamu?" di atas gambar, `font-black text-white text-[9px]` |

---

## 13. `buttonnarator.png` — Background Tombol Narator TTS

| Atribut | Nilai |
|---|---|
| **Tipe** | Button Background |
| **Aspect Ratio** | ~3:1 (landscape, kapsul krem) |
| **Boleh Stretch?** | ⚠️ Boleh — ujung kiri dan kanan identik sehingga stretch horizontal tidak mencolok |
| **Min Size** | Lebar min 80px, tinggi min 28px |
| **Max Size** | Lebar max 160px, tinggi max 44px |
| **Responsive Rule** | Desktop: `w-36 h-10`. Mobile: `w-28 h-8` |
| **Crop Rule** | Harus terlihat seluruhnya |
| **Positioning Rule** | `relative` + `<img absolute inset-0 object-fill>` + konten `relative z-10 flex items-center gap-2` |
| **Catatan** | Digunakan bersamaan dengan `visualaudio.png`. Teks "Dengarkan" / "Stop" di dalamnya |

---

## 14. `visualaudio.png` — Ikon Gelombang Audio

| Atribut | Nilai |
|---|---|
| **Tipe** | Icon / Illustration |
| **Aspect Ratio** | ~2:1 (landscape, gelombang suara) |
| **Boleh Stretch?** | ❌ Tidak — `object-contain` |
| **Min Size** | 16×8px |
| **Max Size** | 32×16px |
| **Responsive Rule** | Tetap kecil, `w-5 h-5 object-contain` sudah cukup |
| **Crop Rule** | Harus terlihat seluruhnya |
| **Positioning Rule** | Inline flex item di dalam `buttonnarator.png` |
| **Catatan** | Tambahkan `animate-pulse` saat TTS sedang berjalan |

---

## 15. `judulmateri.png` — Lencana Judul Berbentuk Permata

| Atribut | Nilai |
|---|---|
| **Tipe** | Icon / Badge |
| **Aspect Ratio** | ~3:4 (portrait, lebih tinggi dari lebar) |
| **Boleh Stretch?** | ❌ Tidak — bentuknya unik (permata/crystal), harus `object-contain` |
| **Min Size** | 24×32px |
| **Max Size** | 48×64px |
| **Responsive Rule** | Ukuran tetap kecil (icon dekoratif) |
| **Crop Rule** | Harus terlihat seluruhnya |
| **Positioning Rule** | Decoration/icon, diletakkan di ujung label atau header |
| **Catatan** | Biasanya digunakan sebagai ikon dekoratif di ujung kiri `backgroundheadline.png` atau sebagai badge judul bab |

---

## 16. `logonomor1.png` / `logonomor2.png` — Ikon Bintang Nomor

| Atribut | Nilai |
|---|---|
| **Tipe** | Icon / Badge |
| **Aspect Ratio** | 1:1 (persegi — bintang) |
| **Boleh Stretch?** | ❌ Tidak — `object-contain` agar bintang tidak gepeng |
| **Min Size** | 16×16px |
| **Max Size** | 32×32px |
| **Responsive Rule** | Ukuran tetap kecil |
| **Crop Rule** | Harus terlihat seluruhnya |
| **Positioning Rule** | Inline icon, decoration |
| **Catatan** | `logonomor1.png` = bintang hijau, `logonomor2.png` = bintang (variasi warna). Digunakan sebagai penanda nomor urut atau poin |

---

## 17. `tahukahkamuicon.png` — Ikon Bola Lampu

| Atribut | Nilai |
|---|---|
| **Tipe** | Icon |
| **Aspect Ratio** | ~1:1 (persegi) |
| **Boleh Stretch?** | ❌ Tidak — `object-contain` |
| **Min Size** | 24×24px |
| **Max Size** | 48×48px |
| **Responsive Rule** | Desktop: `w-10 h-10`. Mobile: `w-8 h-8` |
| **Crop Rule** | Harus terlihat seluruhnya |
| **Positioning Rule** | Inline flex item di header modal Tahukah Kamu? |
| **Catatan** | Digunakan bersama judul modal "Tahukah Kamu?" |

---

## 18. `boxisibuku.png` — Kotak Konten Krem Simpel

| Atribut | Nilai |
|---|---|
| **Tipe** | Panel / Background |
| **Aspect Ratio** | ~2:1 (landscape, lebih lebar dari tinggi) |
| **Boleh Stretch?** | ✅ Ya — `object-fill` diizinkan. Sudut rounded sangat halus, distorsi tidak terlihat |
| **Min Size** | Lebar min 100px, tinggi min 50px |
| **Max Size** | Bebas sesuai kebutuhan konten |
| **Responsive Rule** | Ikuti ukuran konten di dalamnya |
| **Crop Rule** | Boleh crop, tepi sangat bersih |
| **Positioning Rule** | `relative` + `<img absolute inset-0 object-fill>` + konten `relative z-10` |
| **Catatan** | Digunakan sebagai background panel konten generik di dalam halaman buku. Paling fleksibel untuk di-stretch |

---

## 19. `box1.png` — Panel Kayu Emas (Border Frame)

| Atribut | Nilai |
|---|---|
| **Tipe** | Panel / Frame |
| **Aspect Ratio** | ~2:1 (landscape) |
| **Boleh Stretch?** | ⚠️ Hati-hati — sudut emas berukir akan terdistorsi jika di-stretch terlalu ekstrem. Stretch moderat diizinkan |
| **Min Size** | Lebar min 120px, tinggi min 60px |
| **Max Size** | Lebar max 600px |
| **Responsive Rule** | Ikuti konten, tapi jaga aspek ratio tidak jauh dari 2:1 |
| **Crop Rule** | Sudut emas di keempat pojok harus selalu tampil |
| **Positioning Rule** | `relative` + `<img absolute inset-0 object-fill>` + konten `relative z-10` dengan padding min `p-4` |
| **Catatan** | Digunakan untuk panel materi yang lebih dekoratif/formal. Ada 8 variasi (box1–box8) dengan tema warna berbeda |

---

## 20. `boxkayu.png` — Panel Papan Kayu

| Atribut | Nilai |
|---|---|
| **Tipe** | Panel / Background |
| **Aspect Ratio** | ~1:1 (hampir persegi) |
| **Boleh Stretch?** | ✅ Ya — serat kayu dan tepi bergerigi akan tetap terlihat alami saat di-stretch moderat |
| **Min Size** | 100×100px |
| **Max Size** | Bebas sesuai kebutuhan |
| **Responsive Rule** | Ikuti konten |
| **Crop Rule** | Tepi bergerigi (kayu) harus tampil untuk kesan autentik |
| **Positioning Rule** | `relative` + `<img absolute inset-0 object-fill>` + konten `relative z-10` |
| **Catatan** | Cocok untuk panel judul atau papan pengumuman bergaya rustic/kayu |

---

## 21. `boxkertas.png` — Kertas Perkamen (Scroll)

| Atribut | Nilai |
|---|---|
| **Tipe** | Panel / Background |
| **Aspect Ratio** | ~1:1 (hampir persegi) |
| **Boleh Stretch?** | ⚠️ Stretch terbatas — sudut perkamen yang menggulung (kanan bawah dan kiri bawah) akan terdistorsi jika di-stretch berlebihan |
| **Min Size** | 120×120px |
| **Max Size** | 400×400px |
| **Responsive Rule** | Gunakan ukuran tetap atau skala proporsional |
| **Crop Rule** | Sudut perkamen yang menggulung harus tampil — terutama kanan bawah |
| **Positioning Rule** | `relative` + `<img absolute inset-0 object-contain atau object-fill moderat>` |
| **Catatan** | Cocok untuk panel dalil, catatan penting, atau konten bergaya kuno/islami |

---

## Ringkasan Cepat — Boleh Stretch atau Tidak

| Aset | Boleh Stretch (`object-fill`)? |
|---|---|
| `buku.png` | ❌ TIDAK — `object-contain` wajib |
| `backgroundChapter.png` | ⚠️ Horisontal saja |
| `nohalaman.png` | ⚠️ Moderat |
| `kembalibutton.png` | ❌ TIDAK |
| `back.png` / `next.png` | ❌ TIDAK |
| `onspeak.png` / `offspeak.png` | ❌ TIDAK — harus bulat |
| `backgroundheadline.png` | ⚠️ Horisontal saja (lencana kiri jangan terpotong) |
| `backgroundpoin.png` / `backgroundpoin2.png` | ⚠️ Horisontal saja (bintang kiri jangan terpotong) |
| `buttondalil.png` | ❌ TIDAK |
| `buttontahukahkamu.png` | ❌ TIDAK |
| `buttonnarator.png` | ⚠️ Horisontal saja |
| `visualaudio.png` | ❌ TIDAK |
| `judulmateri.png` | ❌ TIDAK |
| `logonomor1/2.png` | ❌ TIDAK |
| `tahukahkamuicon.png` | ❌ TIDAK |
| `boxisibuku.png` | ✅ YA |
| `box1–8.png` | ⚠️ Moderat |
| `boxkayu.png` | ✅ YA |
| `boxkertas.png` | ⚠️ Moderat |

---

## Aturan Posisi Teks pada Asset yang Memiliki Area Khusus

> ⚠️ **KRITIKAL**: Beberapa aset memiliki dekorasi di bagian tertentu. Teks harus SELALU diposisikan ke area bersih, bukan di tengah gambar secara default.

| Aset | Area Teks yang Benar | Cara Teknis |
|---|---|---|
| `backgroundChapter.png` | **Atas 55%** (pita merah datar) | `pt-[10%]` dalam absolute container |
| `nohalaman.png` | **Atas 50%** (papan krem) | `pt-[8%]` hingga `pt-[12%]` |
| `backgroundheadline.png` | **Tengah vertikal, padding kiri** | `items-center pl-6` |
| `backgroundpoin.png` / `poin2.png` | **Tengah vertikal, padding kiri** | `items-center pl-7` (lewati bintang) |
| `buttondalil.png` | **Tengah**, bias ke kanan | `pl-8` (hindari ikon buku kiri) |
| `buttontahukahkamu.png` | **Tengah**, bias ke kanan | `pl-8` (hindari bola lampu kiri) |
| `buku.png` | **Absolute overlay** terpisah | Gunakan posisi `top/bottom/left/right` percent |
