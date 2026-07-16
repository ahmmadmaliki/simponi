import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const dataJadwalPanen = [
  { kecamatan: "Poncol", padi: "Desember", palawija: "Desember", hortikultura: "Januari - Desember", tebu: "0", keterangan: "Tdk ada tan tebu" },
  { kecamatan: "Parang", padi: "Maret, Juni", palawija: "Januari, Oktober", hortikultura: "0", tebu: "Juni - Agustus", keterangan: "" },
  { kecamatan: "Lembeyan", padi: "Maret, Juni, Nop", palawija: "Januari, September", hortikultura: "0", tebu: "Juni - Agustus", keterangan: "" },
  { kecamatan: "Takeran", padi: "Maret, Juni", palawija: "Oktober", hortikultura: "0", tebu: "Juni - Agustus", keterangan: "" },
  { kecamatan: "Nguntoronadi", padi: "Pebruari, Oktober", palawija: "0", hortikultura: "0", tebu: "Juni - Agustus", keterangan: "" },
  { kecamatan: "Kawedanan", padi: "Maret, Juni, Nop", palawija: "Oktober", hortikultura: "0", tebu: "Juni - Agustus", keterangan: "" },
  { kecamatan: "Magetan", padi: "Maret, Juni", palawija: "Oktober", hortikultura: "0", tebu: "Juni - Agustus", keterangan: "" },
  { kecamatan: "Ngariboyo", padi: "Maret, Juni", palawija: "Oktober", hortikultura: "0", tebu: "Juni - Agustus", keterangan: "" },
  { kecamatan: "Plaosan", padi: "0", palawija: "0", hortikultura: "Januari - Desember", tebu: "0", keterangan: "" },
  { kecamatan: "Sidorejo", padi: "0", palawija: "0", hortikultura: "Januari - Desember", tebu: "Juni - Agustus", keterangan: "" },
  { kecamatan: "Panekan", padi: "Maret, Juni, Nop", palawija: "September", hortikultura: "Mei", tebu: "Juni - Agustus", keterangan: "" },
  { kecamatan: "Sukomoro", padi: "Maret, Juni", palawija: "September", hortikultura: "0", tebu: "Juni - Agustus", keterangan: "" },
  { kecamatan: "Bendo", padi: "Maret, Juni", palawija: "Oktober", hortikultura: "0", tebu: "Juni - Agustus", keterangan: "" },
  { kecamatan: "Maospati", padi: "Maret, Juni", palawija: "0", hortikultura: "0", tebu: "Juni - Agustus", keterangan: "" },
  { kecamatan: "Karangrejo", padi: "Maret, Juni, Nop", palawija: "0", hortikultura: "0", tebu: "Juni - Agustus", keterangan: "" },
  { kecamatan: "Karas", padi: "Maret, Juni, Nop", palawija: "0", hortikultura: "0", tebu: "Juni - Agustus", keterangan: "" },
  { kecamatan: "Barat", padi: "Maret, Juni, Nop", palawija: "0", hortikultura: "0", tebu: "Juni - Agustus", keterangan: "" },
  { kecamatan: "Kartoharjo", padi: "Maret, Juni, Nop", palawija: "0", hortikultura: "0", tebu: "Juni - Agustus", keterangan: "" }
];

async function main() {
  console.log("Memulai proses seeding Jadwal Panen...");
  
  for (const row of dataJadwalPanen) {
    await prisma.jadwalPanen.upsert({
      where: { kecamatan: row.kecamatan },
      update: row,
      create: row,
    });
    console.log(`Berhasil insert/update kecamatan ${row.kecamatan}`);
  }
  
  console.log("Seeding Jadwal Panen selesai!");
}

main()
  .catch((e) => {
    console.error("Error seeding Jadwal Panen:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
