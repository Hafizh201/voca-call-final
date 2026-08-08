import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("❌ Environment variable Supabase tidak ditemukan.");
  console.error("Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY tersedia.");
  process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
  console.log("🔎 Testing Supabase...\n");

  // =========================
  // TEST USERS
  // =========================

  const users = await supabase
    .from("users")
    .select("*")
    .limit(10);

  if (users.error) {
    console.error("❌ USERS ERROR:");
    console.error(users.error.message);
  } else {
    console.log("✅ USERS BERHASIL");
    console.table(users.data);
  }

  // =========================
  // TEST SISWA
  // =========================

  const siswa = await supabase
    .from("siswa")
    .select("*")
    .limit(20);

  if (siswa.error) {
    console.error("\n❌ SISWA ERROR:");
    console.error(siswa.error.message);
  } else {
    console.log("\n✅ SISWA BERHASIL");
    console.table(siswa.data);
  }

  // =========================
  // TEST KELAS
  // =========================

  const kelas = await supabase
    .from("kelas")
    .select("*")
    .limit(20);

  if (kelas.error) {
    console.error("\n❌ KELAS ERROR:");
    console.error(kelas.error.message);
  } else {
    console.log("\n✅ KELAS BERHASIL");
    console.table(kelas.data);
  }

  // =========================
  // TEST RELASI
  // =========================

  const relation = await supabase
    .from("siswa")
    .select(`
      id,
      nama,
      nis,
      kelas_id,
      kelas:kelas_id (
        id,
        nama_kelas,
        senin_pulang,
        selasa_pulang,
        rabu_pulang,
        kamis_pulang,
        jumat_pulang
      )
    `)
    .limit(20);

  if (relation.error) {
    console.error("\n❌ RELASI SISWA → KELAS ERROR:");
    console.error(relation.error.message);
  } else {
    console.log("\n✅ RELASI SISWA → KELAS BERHASIL");
    console.dir(relation.data, {
      depth: null,
      colors: true,
    });
  }

  console.log("\n🏁 Test selesai.");
}

test().catch((error) => {
  console.error("\n❌ ERROR TIDAK TERDUGA:");
  console.error(error);
  process.exit(1);
});