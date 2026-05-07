import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Inserting Target Opsen 2026...');
  
  // Clear old targets just in case
  await prisma.targetOpsen.deleteMany({ where: { tahun: 2026 } });

  await prisma.targetOpsen.createMany({
    data: [
      { jenisOpsen: 'PKB', tahun: 2026, triwulan: 1, targetRupiah: 53729789600 },
      { jenisOpsen: 'BBNKB', tahun: 2026, triwulan: 1, targetRupiah: 12803641100 }
    ]
  });

  console.log('Inserting Kegiatan Kinerja data...');
  
  await prisma.kegiatan.deleteMany({ where: { tahun: 2026 } });

  const kegiatanData = [
    { jenisKegiatan: 'Rekonsiliasi Pajak', targetJumlah: 12, realisasiJumlah: 1, tahun: 2026, bulan: 'Januari' },
    { jenisKegiatan: 'Sosialisasi Perpajakan', targetJumlah: 7, realisasiJumlah: 0, tahun: 2026, bulan: 'Januari' },
    { jenisKegiatan: 'Penyebarluasan Kebijakan melalui Media Cetak', targetJumlah: 12, realisasiJumlah: 2, tahun: 2026, bulan: 'Januari' },
    { jenisKegiatan: 'Penyebarluasan Kebijakan melalui Media Digital', targetJumlah: 4, realisasiJumlah: 0, tahun: 2026, bulan: 'Januari' },
    { jenisKegiatan: 'Operasi Gabungan', targetJumlah: 48, realisasiJumlah: 7, tahun: 2026, bulan: 'Januari' },
    { jenisKegiatan: 'Pendataan Objek Pajak Daerah', targetJumlah: 4, realisasiJumlah: 1, tahun: 2026, bulan: 'Januari' },
    { jenisKegiatan: 'Bimbingan Teknis Pengelolaan Pajak Daerah dan Opsen Pajak', targetJumlah: 1, realisasiJumlah: 0, tahun: 2026, bulan: 'Januari' },
    { jenisKegiatan: 'Apresiasi Wajib Pajak Patuh', targetJumlah: 12, realisasiJumlah: 1, tahun: 2026, bulan: 'Januari' },
    { jenisKegiatan: 'Pengadaan Sarana Prasarana Pendukung', targetJumlah: 1, realisasiJumlah: 0, tahun: 2026, bulan: 'Januari' },
  ];

  await prisma.kegiatan.createMany({ data: kegiatanData });

  console.log('Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
