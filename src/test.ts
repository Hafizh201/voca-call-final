import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({
  path: path.resolve(process.cwd(), "../.env"),
});

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log("URL:", url);
console.log("KEY:", key ? `${key.slice(0, 20)}...` : "TIDAK ADA");

if (!url || !key) {
  console.error("❌ .env tidak terbaca");
  process.exit(1);
}

const supabase = createClient(url, key);

console.log("\n🔎 Testing tabel users...");

const { data, error } = await supabase
  .from("users")
  .select("*")
  .limit(10);

if (error) {
  console.error("❌ GAGAL:");
  console.error(error);
  process.exit(1);
}

console.log("✅ BERHASIL!");
console.table(data);