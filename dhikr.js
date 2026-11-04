// ─────────────────────────────────────────────────────────────
//  DHIKR — the cards you scroll through on the Tasbeeh screen.
//  target = default count (33, 100 …). You can change it in the
//  app with the "Target" button. Add new ones the same way.
// ─────────────────────────────────────────────────────────────
const DHIKR = [
  {
    id: "subhanallah",
    arabic: "سُبْحَانَ اللَّهِ",
    translit: "SubhanAllah",
    meaning: "Glory be to Allah",
    virtue: "33 after each prayer",
    target: 33
  },
  {
    id: "alhamdulillah",
    arabic: "الْحَمْدُ لِلَّهِ",
    translit: "Alhamdulillah",
    meaning: "All praise is for Allah",
    virtue: "33 after each prayer",
    target: 33
  },
  {
    id: "allahuakbar",
    arabic: "اللَّهُ أَكْبَرُ",
    translit: "Allahu Akbar",
    meaning: "Allah is the Greatest",
    virtue: "33 after prayer · 34 at bedtime",
    target: 33
  },
  {
    id: "astaghfirullah",
    arabic: "أَسْتَغْفِرُ اللَّهَ",
    translit: "Astaghfirullah",
    meaning: "I seek Allah's forgiveness",
    virtue: "The Prophet ﷺ sought forgiveness 100 times a day",
    target: 100
  },
  {
    id: "lailaha",
    arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ",
    translit: "La ilaha illallah",
    meaning: "There is no god but Allah",
    virtue: "The best dhikr",
    target: 100
  },
  {
    id: "subhanallahi-wabihamdihi",
    arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    translit: "SubhanAllahi wa bihamdihi",
    meaning: "Glory be to Allah, and praise be to Him",
    virtue: "100 a day — sins forgiven (Bukhari 6405)",
    target: 100
  },
  {
    id: "la-hawla",
    arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    translit: "La hawla wa la quwwata illa billah",
    meaning: "No power and no strength except through Allah",
    virtue: "A treasure of Paradise (Bukhari 6384)",
    target: 33
  },
  {
    id: "salawat",
    arabic: "اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ",
    translit: "Allahumma salli 'ala Muhammad",
    meaning: "O Allah, send blessings upon Muhammad",
    virtue: "Allah sends ten blessings for each one (Muslim 408)",
    target: 33
  }
];
