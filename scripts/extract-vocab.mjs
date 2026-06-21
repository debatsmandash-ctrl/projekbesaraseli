import { readFileSync, writeFileSync } from "fs";

const html = readFileSync("/mnt/user-uploads/kamus_bintang_vocab.html", "utf-8");
const m = html.match(/const vocab=\[([\s\S]*?)\];/);
if (!m) throw new Error("vocab array not found");
// transform JS object literals to JSON
let body = m[1];
// keys
body = body.replace(/(\b)(t|en|cat|def)(\s*):/g, '$1"$2"$3:');
// remove trailing comma
body = body.replace(/,\s*$/, "");
const arr = JSON.parse("[" + body + "]");

// Domain mapping (cat → cluster matter domain key)
const catToDomain = {
  debat: "filsafat_mosi", // generic debate theory ↔ matter "filsafat_mosi" if exists, else filsafat
  filsafat: "filsafat",
  ekonomi: "ekonomi",
  hukum: "hukum",
  psikologi: "psikologi",
  sosiol: "sosial",
  retorika: "filsafat",
  logika: "filsafat",
};

// Merge with existing curated vocab (preserve original 120)
const existing = JSON.parse(readFileSync("src/data/raw/vocab.json", "utf-8"));
const seen = new Set(existing.map(v => v.term.toLowerCase()));

const added = [];
for (const v of arr) {
  const term = v.t;
  if (seen.has(term.toLowerCase())) continue;
  seen.add(term.toLowerCase());
  added.push({
    term,
    en: v.en,
    cat: v.cat,
    domain: catToDomain[v.cat] || null,
    def: v.def,
  });
}

// Existing entries don't have `domain` — infer from cat where possible
for (const v of existing) {
  if (!v.domain) v.domain = catToDomain[v.cat] || null;
}

const out = [...existing, ...added];
writeFileSync("src/data/raw/vocab.json", JSON.stringify(out, null, 2));
console.log("Existing:", existing.length, "Added:", added.length, "Total:", out.length);
