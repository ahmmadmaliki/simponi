import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendWhatsAppAlert, sendEmailAlert } from './notificationService.js';

const prisma = new PrismaClient();

const evaluateTargets = async () => {
  console.log('[CRON] Mengevaluasi target capaian...');
  try {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const today = new Date();
    const diffTime = Math.abs(today - startOfYear);
    const dayOfYear = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Asumsi linear growth
    const expectedRatio = dayOfYear / 365;

    // Hitung total realisasi PKB & BBNKB
    const aggregateRealisasi = await prisma.realisasiOpsen.aggregate({
      _sum: { opsenPkb: true, opsenBbnkb: true }
    });
    const realisasiPKB = Number(aggregateRealisasi._sum.opsenPkb || 0);
    const realisasiBBNKB = Number(aggregateRealisasi._sum.opsenBbnkb || 0);
    const realisasiTotal = realisasiPKB + realisasiBBNKB;

    // Ambil Target dari DB
    const targetPKBResult = await prisma.targetOpsen.aggregate({ _sum: { targetRupiah: true }, where: { jenisOpsen: 'PKB', tahun: currentYear } });
    const targetBBNKBResult = await prisma.targetOpsen.aggregate({ _sum: { targetRupiah: true }, where: { jenisOpsen: 'BBNKB', tahun: currentYear } });
    
    const targetPKB = Number(targetPKBResult._sum.targetRupiah || 0);
    const targetBBNKB = Number(targetBBNKBResult._sum.targetRupiah || 0);
    const targetTotal = targetPKB + targetBBNKB;

    const expectedRealisasi = targetTotal * expectedRatio;

    if (realisasiTotal < expectedRealisasi) {
      const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);
      
      const message = `*SIMPONI ALERT - Evaluasi Akhir Pekan*\n\n` +
        `Yth. Bapak/Ibu,\n\n` +
        `Sistem mendeteksi bahwa *Realisasi Total Opsen* saat ini belum memenuhi ambang batas *Pro-Rata* yang diharapkan hingga hari ini.\n\n` +
        `- *Ekspektasi Pro-Rata (Hari ke-${dayOfYear})*: ${formatRp(expectedRealisasi)}\n` +
        `- *Realisasi Aktual*: ${formatRp(realisasiTotal)}\n` +
        `- *Selisih/Kekurangan*: ${formatRp(expectedRealisasi - realisasiTotal)}\n\n` +
        `Mohon segera ditindaklanjuti untuk strategi minggu depan.\n\n` +
        `👉 *Lihat Rekomendasi Tindakan Operasi/Sosialisasi di sini:*\n` +
        `http://localhost:5173/rekomendasi\n\nTerima kasih.`;
      
      // Notify ALL users who have receiveNotif = true
      const usersToAlert = await prisma.user.findMany({
        where: { receiveNotif: true }
      });

      for (const user of usersToAlert) {
        if (user.noWa) {
          await sendWhatsAppAlert(user.noWa, message);
        }
        
        if (user.email) {
          await sendEmailAlert(user.email, 'Peringatan Target Evaluasi SIMPONI', message);
        }
      }
    } else {
      console.log('[CRON] Evaluasi aman, target terpenuhi.');
    }
  } catch (error) {
    console.error('[CRON] Error evaluating targets:', error);
  }
};

let currentJob = null;

export const startCronJobs = async () => {
  try {
    const setting = await prisma.notificationSetting.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, frequency: 'weekly', dayOfWeek: 6, dateOfMonth: 1, time: '08:00', cronString: '0 8 * * 6' }
    });

    if (currentJob) {
      currentJob.stop();
      console.log('[CRON] Jadwal lama dihentikan.');
    }

    currentJob = cron.schedule(setting.cronString, () => {
      evaluateTargets();
    });
    
    console.log(`[CRON] Penjadwalan Evaluasi Target aktif. Cron: ${setting.cronString} (${setting.frequency})`);
  } catch (err) {
    console.error('[CRON] Gagal menginisialisasi jadwal:', err);
  }
};

// Export juga fungsi manual trigger untuk kebutuhan testing
export { evaluateTargets };
