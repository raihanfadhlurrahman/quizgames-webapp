import { EducationChapter } from '@/types/education';

export const ISLAMIC_CHAPTERS: EducationChapter[] = [
  {
    id: 'islamic-ch-1',
    themeId: 'islamic',
    chapterNumber: 1,
    title: 'Mengenal Rukun Islam & Rukun Iman',
    description: 'Pelajari 5 Pondasi Utama Agama Islam dan 6 Kepercayaan Hakiki Umat Muslim dengan cara visual dan menyenangkan.',
    icon: '🕌',
    targetAudience: 'SD-SMP',
    colorGradient: 'from-emerald-600 via-teal-700 to-emerald-900',
    borderColor: 'border-emerald-400/50',
    totalSlides: 4,
    slides: [
      {
        id: 'islam-1-1',
        slideNumber: 1,
        title: 'Apa itu Rukun Islam?',
        subtitle: '5 Pondasi Utama Bangunan Keislaman Kita',
        visualIcon: '🏛️',
        visualBadge: 'Fondasi Keagamaan',
        bulletPoints: [
          'Rukun Islam adalah lima amalan pokok yang wajib dilaksanakan oleh setiap muslim.',
          'Nabi Muhammad SAW mengibaratkan Islam seperti sebuah rumah yang berdiri kokoh di atas 5 tiang utama.',
          'Tanpa tiang ini, keislaman seseorang menjadi tidak sempurna.'
        ],
        dalil: {
          title: 'Hadits Rukun Islam (HR. Bukhari & Muslim)',
          arabicText: 'بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ: شَهَادَةِ أَنْ لاَ إِلَهَ إِلاَّ اللهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللهِ، وَإِقَامِ الصَّلاَةِ، وَإِيتَاءِ الزَّكَاةِ، وَحَجِّ الْبَيْتِ، وَصَوْمِ رَمَضَانَ',
          latinText: 'Buniyal-islaamu \'alaa khamsin: syahaadati al-laa ilaaha illallaah wa anna Muhammadar-rasuulullaah, wa iqaamis-shalaah, wa iitaa-iz-zakaah, wa hajjil-baiti, wa shaumi ramadhan.',
          translation: 'Islam dibangun di atas lima perkara: bersaksi bahwa tidak ada tuhan selain Allah dan Muhammad adalah utusan Allah, mendirikan shalat, menunaikan zakat, berhaji ke Baitullah, dan berpuasa Ramadhan.',
          source: 'Hadits Shahih Bukhari No. 8 & Muslim No. 16'
        },
        funFact: {
          title: 'Tahukah Kamu?',
          description: 'Sama seperti bangunan rumah, jika salah satu tiang pondasinya roboh, maka rumah tersebut akan rapuh!',
          icon: '💡'
        }
      },
      {
        id: 'islam-1-2',
        slideNumber: 2,
        title: 'Rincian 5 Rukun Islam',
        subtitle: 'Amalan Lahiriah Setiap Muslim',
        visualIcon: '✋',
        visualBadge: 'Amalan Pokok',
        bulletPoints: [
          '1. Syahadat: Mengucapkan dua kalimat persaksian kepada Allah & Rasul-Nya.',
          '2. Sholat: Beribadah 5 waktu sehari semalam (Subuh, Dzuhur, Ashar, Maghrib, Isya).',
          '3. Zakat: Menyisihkan sebagian harta untuk diberikan kepada saudara yang membutuhkan.',
          '4. Puasa Ramadhan: Menahan diri dari makan, minum, dan hawa nafsu dari fajar hingga maghrib.',
          '5. Naik Haji: Beribadah ke Tanah Suci Makkah bagi yang mampu secara fisik & finansial.'
        ],
        funFact: {
          title: 'Keutamaan Puasa',
          description: 'Pintu surga khusus bernama Ar-Rayyan disediakan Allah khusus bagi orang-orang yang rajin berpuasa!',
          icon: '✨'
        }
      },
      {
        id: 'islam-1-3',
        slideNumber: 3,
        title: 'Mengenal 6 Rukun Iman',
        subtitle: 'Kepercayaan Keyakinan Dalam Hati',
        visualIcon: '💖',
        visualBadge: 'Keyakinan Hati',
        bulletPoints: [
          'Jika Rukun Islam adalah amalan badan (fisik), maka Rukun Iman adalah kepercayan dalam HATI.',
          '1. Iman kepada Allah SWT (Pencipta Alam Semesta).',
          '2. Iman kepada Malaikat-Malaikat Allah (seperti Jibril, Mikail, Israfil).',
          '3. Iman kepada Kitab-Kitab Allah (Taurat, Zabur, Injil, dan Al-Qur\'an).',
          '4. Iman kepada Nabi & Rasul Utusan Allah.',
          '5. Iman kepada Hari Kiamat (Hari Akhir).',
          '6. Iman kepada Qada dan Qadar (Takdir Baik & Buruk dari Allah).'
        ],
        dalil: {
          title: 'Firman Allah SWT tentang Keimanan',
          arabicText: 'آمَنَ الرَّسُولُ بِمَا أُنْزِلَ إِلَيْهِ مِنْ رَبِّهِ وَالْمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ',
          latinText: 'Aamanar-rasuulu bimaa unzila ilaihi mir-rabbihii wal-mu\'minuun. Kullun aamana billaahi wa malaa-ikatihii wa kutubihii wa rusulih.',
          translation: 'Rasul telah beriman kepada Al-Qur\'an yang diturunkan kepadanya dari Tuhannya, demikian pula orang-orang yang beriman. Semuanya beriman kepada Allah, malaikat-malaikat-Nya, kitab-kitab-Nya dan rasul-rasul-Nya.',
          source: 'QS. Al-Baqarah: 285'
        }
      },
      {
        id: 'islam-1-4',
        slideNumber: 4,
        title: 'Perbedaan Rukun Islam & Rukun Iman',
        subtitle: 'Kombinasi Fisik dan Hati',
        visualIcon: '⚖️',
        visualBadge: 'Rangkuman Belajar',
        bulletPoints: [
          'Rukun Islam dilakukan oleh anggota badan (mulut mengucapkan, badan bergerak sholat, fisik berpuasa).',
          'Rukun Iman diyakini penuh oleh hati dan pikiran kita.',
          'Muslim sejati adalah orang yang memiliki Iman yang kuat di hati dan melaksanakan Rukun Islam dengan ikhlas!'
        ],
        funFact: {
          title: 'Catatan Malaikat',
          description: 'Malaikat Raqib mencatat setiap kebaikan sekecil apapun yang kita lakukan dengan penuh senyuman!',
          icon: '👼'
        }
      }
    ]
  },
  {
    id: 'islam-ch-2',
    themeId: 'islamic',
    chapterNumber: 2,
    title: 'Kisah Singkat Nabi & Rasul Utusan Allah',
    description: 'Meneladani keberanian, kesabaran, dan akhlak mulia para Nabi Ulul Azmi melalui cerita ringkas bergambar.',
    icon: '📜',
    targetAudience: 'SD-SMP',
    colorGradient: 'from-amber-600 via-emerald-800 to-slate-900',
    borderColor: 'border-amber-400/50',
    totalSlides: 4,
    slides: [
      {
        id: 'islam-2-1',
        slideNumber: 1,
        title: 'Nabi Adam AS - Manusia Pertama',
        subtitle: 'Bapak Seluruh Umat Manusia',
        visualIcon: '🌍',
        visualBadge: 'Kisah Nabi',
        bulletPoints: [
          'Nabi Adam AS diciptakan oleh Allah SWT dari tanah sebagai manusia pertama di muka bumi.',
          'Allah mengajarkan nama-nama benda kepada Nabi Adam sehingga para malaikat pun kagum.',
          'Nabi Adam dan Ibu Hawa diajarkan untuk selalu bertobat memohon ampunan ketika berbuat salah.'
        ],
        dalil: {
          title: 'Penciptaan Manusia Pertama',
          arabicText: 'وَإِذْ قَالَ رَبُّكَ لِلْمَلَائِكَةِ إِنِّي جَاعِلٌ فِي الْأَرْضِ خَلِيفَةً',
          latinText: 'Wa idz qaala rabbuka lil-malaa-ikati innii jaa\'ilun fil-ardhi khaliifah.',
          translation: 'Ingatlah ketika Tuhanmu berfirman kepada para Malaikat: "Sesungguhnya Aku hendak menjadikan seorang khalifah di muka bumi."',
          source: 'QS. Al-Baqarah: 30'
        },
        funFact: {
          title: 'Pelajaran Penting',
          description: 'Jika kita berbuat salah, jangan malu untuk segera minta maaf kepada Allah dan orang tua!',
          icon: '💡'
        }
      },
      {
        id: 'islam-2-2',
        slideNumber: 2,
        title: 'Nabi Nuh AS & Bahtera Raksasa',
        subtitle: 'Kesabaran Berdakwah Ratusan Tahun',
        visualIcon: '🚢',
        visualBadge: 'Ulul Azmi',
        bulletPoints: [
          'Nabi Nuh AS berdakwah selama 950 tahun dengan penuh kesabaran meski banyak yang mengejek.',
          'Allah memerintahkan Nabi Nuh membuat bahtera (kapal raksasa) di atas bukit.',
          'Saat banjir bandang tiba, hanya orang-orang beriman dan pasangan hewan yang selamat di dalam kapal.'
        ],
        funFact: {
          title: 'Mukjizat Kapal',
          description: 'Kapal Nabi Nuh berlabuh dengan selamat di atas Gunung Judi setelah banjir besar surut!',
          icon: '⛰️'
        }
      },
      {
        id: 'islam-2-3',
        slideNumber: 3,
        title: 'Nabi Musa AS & Tongkat Mukjizat',
        subtitle: 'Keberanian Melawan Raja Firaun yang Sombong',
        visualIcon: '🌊',
        visualBadge: 'Ulul Azmi',
        bulletPoints: [
          'Nabi Musa AS dibesarkan di istana Firaun namun tetap membela kebenaran agama Allah.',
          'Dengan izin Allah, tongkat Nabi Musa dapat berubah menjadi ular besar dan membelah Laut Merah.',
          'Kisah Nabi Musa mengajarkan kita agar tidak takut membela kebenaran.'
        ],
        dalil: {
          title: 'Membelah Laut Merah',
          arabicText: 'فَأَوْحَيْنَا إِلَىٰ مُوسَىٰ أَنِ اضْرِبْ بِعَصَاكَ الْبَحْرَ ۖ فَانْفَلَقَ فَكَانَ كُلُّ فِرْقٍ كَالطَّوْدِ الْعَظِيمِ',
          latinText: 'Fa-auhainaa ilaa Muusaa anidh-rib bi\'ashaakal-bahr, fanfalaqa fakaana kullu firqin kat-thaudil-\'azhiim.',
          translation: 'Lalu Kami wahyukan kepada Musa: "Pukullah laut itu dengan tongkatmu". Maka terbelahlah laut itu dan tiap-tiap belahan adalah seperti gunung yang besar.',
          source: 'QS. Asy-Syu\'ara: 63'
        }
      },
      {
        id: 'islam-2-4',
        slideNumber: 4,
        title: 'Nabi Muhammad SAW - Penutup Para Nabi',
        subtitle: 'Rahmatan lil \'Aalamin (Rahmat Bagi Seluruh Alam)',
        visualIcon: '⭐',
        visualBadge: 'Rasul Terakhir',
        bulletPoints: [
          'Nabi Muhammad SAW lahir di kota Makkah dan bergelar Al-Amin (Orang yang Sangat Terpercaya).',
          'Menerima wahyu Al-Qur\'an pertama di Gua Hira melalui Malaikat Jibril.',
          'Akhlak Nabi Muhammad SAW adalah Al-Qur\'an, senantiasa bersikap santun, penyayang, dan pemaaf.'
        ],
        funFact: {
          title: 'Akhlak Mulia',
          description: 'Nabi Muhammad tidak pernah membalas kejahatan dengan kejahatan, melainkan senantiasa mendoakan kebaikan bagi orang lain!',
          icon: '💖'
        }
      }
    ]
  },
  {
    id: 'islam-ch-3',
    themeId: 'islamic',
    chapterNumber: 3,
    title: 'Panduan Sholat 5 Waktu & Hafalan Surah Pendek',
    description: 'Panduan visual ibadah sholat harian serta hafalan surah favorit lengkap dengan bacaan Latin dan terjemahan.',
    icon: '📖',
    targetAudience: 'SD-SMP',
    colorGradient: 'from-teal-600 via-emerald-800 to-cyan-950',
    borderColor: 'border-teal-400/50',
    totalSlides: 4,
    slides: [
      {
        id: 'islam-3-1',
        slideNumber: 1,
        title: 'Sholat 5 Waktu Harian Kita',
        subtitle: 'Tiang Agama dan Komunikasi Langsung dengan Allah',
        visualIcon: '⏰',
        visualBadge: 'Ibadah Harian',
        bulletPoints: [
          '1. Subuh: 2 Rakaat (Sebelum terbit matahari).',
          '2. Dzuhur: 4 Rakaat (Siang hari saat matahari tergelincir).',
          '3. Ashar: 4 Rakaat (Sore hari).',
          '4. Maghrib: 3 Rakaat (Saat matahari terbenam).',
          '5. Isya: 4 Rakaat (Malam hari).'
        ],
        dalil: {
          title: 'Kewajiban Sholat Tepat Waktu',
          arabicText: 'إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا',
          latinText: 'Innas-shalaata kaanat \'alal-mu\'miniina kitaabam-mauquutaa.',
          translation: 'Sesungguhnya shalat itu adalah kewajiban yang ditentukan waktunya atas orang-orang yang beriman.',
          source: 'QS. An-Nisa: 103'
        },
        funFact: {
          title: 'Pahala Berjamaah',
          description: 'Sholat berjamaah di masjid atau bersama keluarga melipatgandakan pahala hingga 27 derajat!',
          icon: '🕌'
        }
      },
      {
        id: 'islam-3-2',
        slideNumber: 2,
        title: 'Surah Al-Ikhlas (Kemurnian Tauhid)',
        subtitle: 'Setara dengan 1/3 Isi Al-Qur\'an',
        visualIcon: '💎',
        visualBadge: 'Hafalan Surah',
        bulletPoints: [
          'Ayat 1: قُلْ هُوَ اللَّهُ أَحَدٌ (Katakanlah: Dia-lah Allah, Yang Maha Esa).',
          'Ayat 2: اللَّهُ الصَّمَدُ (Allah adalah Tuhan yang bergantung kepada-Nya segala sesuatu).',
          'Ayat 3: لَمْ يَلِدْ وَلَمْ يُولَدْ (Dia tiada beranak dan tidak pula diperanakkan).',
          'Ayat 4: وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ (Dan tidak ada seorang pun yang setara dengan Dia).'
        ],
        funFact: {
          title: 'Keutamaan Al-Ikhlas',
          description: 'Membaca Surah Al-Ikhlas 3 kali pahalanya seumpama khatam Al-Qur\'an secara utuh!',
          icon: '✨'
        }
      },
      {
        id: 'islam-3-3',
        slideNumber: 3,
        title: 'Surah Al-Kautsar (Nikmat yang Berlimpah)',
        subtitle: 'Surah Terpendek dalam Al-Qur\'an',
        visualIcon: '🌊',
        visualBadge: 'Hafalan Surah',
        bulletPoints: [
          'Ayat 1: إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ (Sesungguhnya Kami telah memberikan kepadamu nikmat yang banyak).',
          'Ayat 2: فَصَلِّ لِرَبِّكَ وَانْحَرْ (Maka dirikanlah shalat karena Tuhanmu; dan berkorbanlah).',
          'Ayat 3: إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ (Sesungguhnya orang-orang yang membenci kamu dialah yang terputus).'
        ],
        dalil: {
          title: 'Telaga Al-Kautsar di Surga',
          arabicText: 'الْكَوْثَرُ نَهَرٌ فِي الْجَنَّةِ وَعَدَنِيهِ رَبِّي',
          latinText: 'Al-Kautsaru naharun fil-jannati wa\'adanihii rabbii.',
          translation: 'Al-Kautsar adalah sungai di dalam surga yang dijanjikan oleh Tuhanku kepadaku.',
          source: 'Hadits Shahih HR. Ahmad'
        }
      },
      {
        id: 'islam-3-4',
        slideNumber: 4,
        title: 'Tips Agar Rajin Beribadah',
        subtitle: 'Menjadi Anak Soleh & Solehah Kesayangan Allah',
        visualIcon: '🌟',
        visualBadge: 'Amalan Praktis',
        bulletPoints: [
          '1. Pasang alarm sholat atau dengarkan suara adzan dengan khusyuk.',
          '2. Selalu patuh dan berbakti kepada kedua orang tua.',
          '3. Luangkan waktu 5 menit setiap hari untuk membaca atau muraja\'ah hafalan ayat Al-Qur\'an.',
          '4. Banyak tersenyum dan menebar kebaikan kepada teman-teman!'
        ],
        funFact: {
          title: 'Senyum itu Sedekah',
          description: 'Rasulullah SAW bersabda: Senyummu di hadapan saudaramu adalah bernilai sedekah!',
          icon: '😊'
        }
      }
    ]
  }
];
