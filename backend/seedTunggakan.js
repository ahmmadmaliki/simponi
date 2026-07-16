import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const dataTunggakan = [
  { kecamatan: "Magetan", obyek: 3457, potensi: 1547734000 },
  { kecamatan: "Panekan", obyek: 3062, potensi: 1181512000 },
  { kecamatan: "Plaosan", obyek: 2882, potensi: 1224490300 },
  { kecamatan: "Maospati", obyek: 2757, potensi: 1149204100 },
  { kecamatan: "Kawedanan", obyek: 2097, potensi: 821690750 },
  { kecamatan: "Ngariboyo", obyek: 2145, potensi: 816746800 },
  { kecamatan: "Takeran", obyek: 2206, potensi: 826381000 },
  { kecamatan: "Bendo", obyek: 1886, potensi: 641636300 },
  { kecamatan: "Parang", obyek: 1651, potensi: 641259700 },
  { kecamatan: "Sukomoro", obyek: 1839, potensi: 783744000 },
  { kecamatan: "Lembeyan", obyek: 1719, potensi: 757162850 },
  { kecamatan: "Barat", obyek: 1703, potensi: 632610150 },
  { kecamatan: "Karas", obyek: 1579, potensi: 675401750 },
  { kecamatan: "Sidorejo", obyek: 1504, potensi: 541803550 },
  { kecamatan: "Poncol", obyek: 1580, potensi: 605728450 },
  { kecamatan: "Karangrejo", obyek: 1383, potensi: 505773800 },
  { kecamatan: "Kartoharjo", obyek: 1151, potensi: 361782700 },
  { kecamatan: "Nguntoronadi", obyek: 1009, potensi: 478178200 }
];

async function main() {
  console.log("Memulai proses seeding Data Tunggakan...");
  
  for (const row of dataTunggakan) {
    await prisma.dataTunggakan.upsert({
      where: { kecamatan: row.kecamatan },
      update: row,
      create: row,
    });
    console.log(`Berhasil insert/update tunggakan kecamatan ${row.kecamatan}`);
  }
  
  console.log("Seeding Data Tunggakan selesai!");
}

main()
  .catch((e) => {
    console.error("Error seeding Data Tunggakan:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
