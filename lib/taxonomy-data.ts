// Transcribed from UKM AktivUKM "Info Pembangunan Kurikulum" reference
// posters: Jadual Kata Kerja Taksonomi Kognitif (03/2025), Taksonomi
// Afektif (03/2025), Taksonomi Psikomotor (03/2025). The inline
// "(C4; PLO2)"-style code seen in official Table 4 CLO text refers to
// these — e.g. C4 = Cognitive level 4 (Menganalisis).

export type TaxonomyDomainKey = "KOGNITIF" | "AFEKTIF" | "PSIKOMOTOR";

export const TAXONOMY_CODE_PREFIX: Record<TaxonomyDomainKey, string> = {
  KOGNITIF: "C",
  AFEKTIF: "A",
  PSIKOMOTOR: "P",
};

export const TAXONOMY_DOMAIN_LABEL: Record<TaxonomyDomainKey, string> = {
  KOGNITIF: "Kognitif (Cognitive)",
  AFEKTIF: "Afektif (Affective)",
  PSIKOMOTOR: "Psikomotor (Psychomotor)",
};

export type TaxonomyLevelInfo = { level: number; name: string; verbs: string[] };

export const TAXONOMY_LEVELS: Record<TaxonomyDomainKey, TaxonomyLevelInfo[]> = {
  KOGNITIF: [
    { level: 1, name: "Mengingat", verbs: ["Mengatur", "Mentakrifkan", "Mengenal pasti", "Menyenaraikan", "Menyebut", "Mengimbas kembali", "Memilih", "Menyatakan", "Menggambarkan", "Melabel", "Menamakan", "Menggariskan", "Mengiktiraf", "Mengeluarkan semula", "Melakarkan", "Menghasilkan semula", "Memadankan", "Memerihal", "Mengetahui", "Mengumpul", "Menerangkan", "Mengulangi", "Merekodkan", "Menunjukkan"] },
    { level: 2, name: "Memahami", verbs: ["Menjelaskan", "Mentafsir", "Meringkaskan", "Memparafrasa", "Menukarkan", "Menyimpulkan", "Memberi contoh", "Meliputi", "Mempertahankan", "Membezakan", "Menganggarkan", "Melanjutkan", "Menggeneralisasi", "Menterjemahkan", "Meramal", "Menulis semula", "Membuat inferens", "Menerangkan", "Mengubah", "Mengklasifikasikan", "Mewajarkan", "Membincangkan", "Menyatakan", "Mengenal pasti", "Menegaskan", "Memilih", "Menentukan"] },
    { level: 3, name: "Mengaplikasi", verbs: ["Menggunakan", "Menunjukkan", "Menunjuk cara", "Membina", "Melaksanakan", "Menyediakan", "Menyelesaikan", "Memanipulasi", "Meneroka", "Menghitung", "Menghubungkait", "Mengitlak", "Mengubah suai", "Mengira", "Membuat penemuan", "Menghasilkan", "Mengaitkan", "Mengoperasi", "Mengaplikasi", "Menukar", "Memilih", "Melengkapkan", "Mengambil", "Meneliti", "Menggambarkan", "Mentafsir", "Mengamalkan", "Melakar", "Menguji"] },
    { level: 4, name: "Menganalisis", verbs: ["Menganalisis", "Membandingkan", "Membezakan", "Mengaitkan", "Menggaris", "Menggambarkan rajah", "Memisahkan", "Mengasingkan", "Menggambar rajah", "Memecahkan kepada elemen asas", "Mendiskriminasikan", "Mengenal pasti", "Menyimpulkan", "Melakarkan", "Membuat inferens", "Menghubungkait", "Menghuraikan", "Mengilustrasi", "Menjelaskan dengan gambar rajah", "Menunjukkan perbezaan", "Mengira", "Mengkategorikan", "Mengklasifikasikan", "Menyambung", "Mengkritik", "Membahagikan", "Menguji", "Meneliti", "Menyiasat", "Mempersoalkan", "Memeriksa", "Mengaitkan"] },
    { level: 5, name: "Menilai", verbs: ["Menilai", "Mengkritik", "Mempertahankan", "Membela", "Mengulas", "Menyokong", "Membuat keputusan", "Membuat pertimbangan", "Mewajarkan", "Membandingkan", "Menyimpulkan", "Membezakan", "Menerangkan", "Mentafsirkan", "Meringkaskan", "Mendiskriminasikan", "Menjelaskan", "Meramalkan", "Menaksir", "Mengadili", "Menghakimi", "Merumuskan", "Memberi hujah", "Melampirkan", "Meyakinkan", "Meramal", "Mengesyorkan", "Memberikan skor", "Memilih", "Meramal", "Menilai"] },
    { level: 6, name: "Mencipta", verbs: ["Mereka bentuk", "Mereka cipta", "Membina", "Membina semula", "Mencipta", "Menyiasat", "Merancang", "Menggabungkan", "Mengintegrasikan", "Mengumpul", "Menghimpunkan", "Membangunkan", "Menulis semula", "Mengarang", "Mengatur semula", "Menghubungkaitkan", "Mengaitkan", "Menghuraikan", "Mengorganisasi", "Mengurus", "Mengorganisasikan semula", "Mengubah suai", "Menjana", "Menyemak", "Merumuskan", "Membuat kesimpulan", "Berhujah", "Menubuhkan", "Membentuk", "Menghasilkan", "Menyediakan", "Mencadangkan", "Menilai semula", "Menjana"] },
  ],
  AFEKTIF: [
    { level: 1, name: "Menerima", verbs: ["Menerima", "Memberi perhatian", "Mengenal pasti", "Mematuhi", "Memilih", "Menunjukkan", "Meminta", "Menerangkan", "Memberi", "Memegang", "Mengesan", "Menamakan", "Mendirikan", "Menjawab", "Bertanya", "Menghuraikan", "Mengikut"] },
    { level: 2, name: "Bertindak Balas", verbs: ["Menjawab", "Menyumbang", "Membantu", "Menolong", "Berbincang", "Membincangkan", "Membaca", "Menyertai", "Memberikan jawapan", "Mematuhi", "Menyambut", "Melabel", "Melakukan", "Melaporkan", "Memilih", "Memberitahu", "Menulis", "Akur", "Melaksanakan", "Membentangkan", "Memberikan pertolongan", "Mendeklamasi", "Mengamalkan", "Mengucap selamat"] },
    { level: 3, name: "Menghargai", verbs: ["Menghormati", "Menyokong", "Memilih", "Berkongsi", "Mengkaji", "Melaksanakan tugas", "Menunjukkan cara", "Menunjuk cara", "Membezakan", "Menjelaskan", "Menerangkan", "Membentuk", "Memulakan", "Menjemput", "Melawat", "Menyertai", "Mewajarkan", "Mencadangkan", "Membaca", "Melapor", "Melaporkan", "Mengajuk", "Mengerjakan"] },
    { level: 4, name: "Menyusun Nilai", verbs: ["Membandingkan", "Membanding", "Menggabungkan", "Mencantum", "Menyatupadu", "Mempertahankan", "Merumuskan", "Merumus", "Menyusun semula", "Mengatur", "Berpegang teguh", "Setia", "Mengubah", "Mengubah suai", "Melengkapkan", "Menjelaskan", "Menggeneralisasi", "Membuat kesimpulan secara umum", "Mengenal pasti", "Menghubungkait", "Mengaitkan", "Menghurai", "Menghuraikan", "Menyediakan", "Menyelesaikan", "Perintah", "Berkaitan", "Mensistesis", "Membuat sintesis"] },
    { level: 5, name: "Menghayati Nilai", verbs: ["Memperlihatkan", "Menunjukkan integriti", "Mengesahkan", "Menjiwai", "Melaksanakan", "Berkhidmat", "Mengambil tindakan", "Mempengaruhi", "Mendiskriminasikan", "Memaparkan", "Mendengar", "Mengubah", "Mengubah suai", "Mengamalkan", "Mencadangkan", "Menyoal", "Menyemak semula", "Menyemak", "Menyelesaikan", "Melayan", "Memahami", "Mempamerkan", "Layak", "Membezakan", "Memupuk", "Membudayakan"] },
  ],
  PSIKOMOTOR: [
    { level: 1, name: "Persepsi", verbs: ["Mengenal pasti", "Membezakan", "Mengesan", "Memilih", "Menerangkan", "Mengasingkan", "Mengecam", "Menghubungkaitkan", "Mengaitkan", "Menyisihkan", "Berkaitan"] },
    { level: 2, name: "Kesediaan", verbs: ["Menunjukkan", "Memulakan", "Menyatakan", "Bersedia", "Menunjukkan kerelaan", "Sukarela", "Memaparkan", "Menjelaskan", "Melanjutkan", "Meneruskan", "Menghasilkan", "Bertindak balas", "Memberikan tindak balas", "Memindahkan", "Mempamerkan", "Menghuraikan"] },
    { level: 3, name: "Respons Berpandu", verbs: ["Menyalin", "Mengikut", "Mencuba", "Mematuhi", "Mengeluarkan semula", "Menghasilkan semula", "Mengesan", "Menjejak", "Memberi respons", "Memberikan tindak balas", "Maklum balas"] },
    { level: 4, name: "Mekanisme", verbs: ["Memanipulasi", "Menguraikan", "Merungkai", "Membaiki", "Pembaikan", "Menentukur", "Menentu ukur", "Memaparkan", "Mempamerkan", "Mengadun", "Mencampurkan", "Campuran", "Langkah-langkah", "Menganjurkan", "Mengorganisasi", "Mengorganisasikan", "Memanaskan", "Mencantum", "Mencantumkan", "Mengenakan", "Mengukur", "Menumbuk"] },
    { level: 5, name: "Respons Kompleks", verbs: ["Menyelaras", "Melaksanakan dengan lancar", "Membentuk corak gerakan", "Melakar", "Lakaran", "Memanipulasi", "Memasang", "Membaiki", "Pembaikan", "Membina", "Mengguna", "Mempamerkan", "Mencampurkan", "Mengadun", "Mencantum", "Mencantumkan", "Menentukur", "Menganjurkan", "Mengorganisasi", "Mengenakan", "Mengukur", "Merungkai", "Menyurai", "Memanaskan", "Langkah-langkah"] },
    { level: 6, name: "Penyesuaian", verbs: ["Mengubah", "Menyesuaikan", "Mengadaptasi", "Menyusun semula", "Mengatur semula", "Menyusunnya", "Menyemak semula", "Menyemak", "Mempelbagaikan", "Mengorganisasi semula", "Mengorganisasikan semula", "Mengubah suai", "Mengubahsuai", "Menukar", "Perubahan"] },
    { level: 7, name: "Naturalisasi", verbs: ["Menggabungkan", "Mencantum", "Mencantumkan", "Mereka bentuk", "Reka bentuk", "Memulakan", "Menggubah", "Mengatur", "Menyusun atur", "Membina", "Mewujudkan", "Membuat", "Membangunkan", "Mengarang", "Mengasaskan", "Mengubah", "Menyasarkan", "Mencipta"] },
  ],
};

export function taxonomyCode(domain: TaxonomyDomainKey, level: number): string {
  return `${TAXONOMY_CODE_PREFIX[domain]}${level}`;
}
