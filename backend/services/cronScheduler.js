import { PrismaClient } from "@prisma/client";
import cron from "node-cron";
import { sendEmailAlert, sendWhatsAppAlert } from "./notificationService.js";
import { getBapendaToken, fetchMetricsForDateRange } from "./bapendaService.js";

const prisma = new PrismaClient();

const evaluateTargets = async () => {
  console.log("[CRON] Mengevaluasi target capaian...");
  try {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const today = new Date();
    const diffTime = Math.abs(today - startOfYear);
    const dayOfYear = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Asumsi linear growth
    const expectedRatio = dayOfYear / 365;

    // Hitung total realisasi PKB & BBNKB tahun berjalan secara Live
    const tglMulai = `${currentYear}-01-01`;
    const fmtDate = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dt = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dt}`;
    };
    const tglAkhir = fmtDate(today);

    const token = await getBapendaToken();
    const kodeKota = process.env.BAPENDA_KODE_KOTA || "";
    
    console.log(`[CRON] Menarik data live Bapenda dari ${tglMulai} s/d ${tglAkhir}...`);
    const metrics = await fetchMetricsForDateRange(tglMulai, tglAkhir, kodeKota, token);

    const realisasiPKB = metrics.realisasiPkb;
    const realisasiBBNKB = metrics.realisasiBbnkb;
    const realisasiTotal = realisasiPKB + realisasiBBNKB;

    // Ambil Target dari DB
    const targetPKBResult = await prisma.targetOpsen.aggregate({
      _sum: { targetRupiah: true },
      where: { jenisOpsen: "PKB", tahun: currentYear },
    });
    const targetBBNKBResult = await prisma.targetOpsen.aggregate({
      _sum: { targetRupiah: true },
      where: { jenisOpsen: "BBNKB", tahun: currentYear },
    });

    const targetPKB = Number(targetPKBResult._sum.targetRupiah || 0);
    const targetBBNKB = Number(targetBBNKBResult._sum.targetRupiah || 0);
    const targetTotal = targetPKB + targetBBNKB;

    const expectedRealisasi = targetTotal * expectedRatio;

    const formatRp = (num) =>
      new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(num);

    let message = "";
    let emailSubject = "";

    if (realisasiTotal < expectedRealisasi) {
      emailSubject = "Peringatan Target Evaluasi SIOPTIMA";
      message =
        `*SIOPTIMA ALERT - Evaluasi Akhir Pekan*\n\n` +
        `Yth. Bapak/Ibu,\n\n` +
        `Sistem mendeteksi bahwa *Realisasi Total Opsen* saat ini belum memenuhi ambang batas *Pro-Rata* yang diharapkan hingga hari ini.\n\n` +
        `- *Ekspektasi Pro-Rata (Hari ke-${dayOfYear})*: ${formatRp(expectedRealisasi)}\n` +
        `- *Realisasi Aktual*: ${formatRp(realisasiTotal)}\n` +
        `- *Selisih/Kekurangan*: ${formatRp(expectedRealisasi - realisasiTotal)}\n\n` +
        `Mohon segera ditindaklanjuti untuk strategi minggu depan.\n\n` +
        `👉 *LIHAT REKOMENDASI TINDAKAN DI SINI:*\n` +
        `${process.env.PUBLIC_URL || "http://localhost:5000"}/rekomendasi\n\nTerima kasih.`;
    } else {
      console.log("[CRON] Evaluasi aman, target terpenuhi. Mengirim notifikasi selamat.");
      emailSubject = "Laporan Evaluasi SIOPTIMA - Target Aman";
      message = 
        `*SIOPTIMA REPORT - Evaluasi Akhir Pekan*\n\n` +
        `Yth. Bapak/Ibu,\n\n` +
        `Selamat! Sistem mendeteksi bahwa *Realisasi Total Opsen* saat ini dalam kondisi AMAN dan telah memenuhi ambang batas *Pro-Rata* yang diharapkan hingga hari ini.\n\n` +
        `- *Ekspektasi Pro-Rata (Hari ke-${dayOfYear})*: ${formatRp(expectedRealisasi)}\n` +
        `- *Realisasi Aktual*: ${formatRp(realisasiTotal)}\n` +
        `- *Surplus/Kelebihan*: ${formatRp(realisasiTotal - expectedRealisasi)}\n\n` +
        `Pertahankan kinerja baik ini untuk strategi minggu depan.\n\n` +
        `👉 *LIHAT REKOMENDASI TINDAKAN DI SINI:*\n` +
        `${process.env.PUBLIC_URL || "http://localhost:5000"}/rekomendasi\n\nTerima kasih.`;
    }

    // Notify ALL users who have receiveNotif = true
    const usersToAlert = await prisma.user.findMany({
      where: { receiveNotif: true },
    });

    for (const user of usersToAlert) {
      if (user.noWa) {
        await sendWhatsAppAlert(user.noWa, message);
      }
      if (user.email) {
        await sendEmailAlert(user.email, emailSubject, message);
      }
    }
  } catch (error) {
    console.error("[CRON] Error evaluating targets:", error);
  }
};

let currentJob = null;

export const startCronJobs = async () => {
  try {
    const setting = await prisma.notificationSetting.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        frequency: "weekly",
        dayOfWeek: 6,
        dateOfMonth: 1,
        time: "08:00",
        cronString: "0 8 * * 6",
      },
    });

    if (currentJob) {
      currentJob.stop();
      console.log("[CRON] Jadwal lama dihentikan.");
    }

    currentJob = cron.schedule(setting.cronString, () => {
      evaluateTargets();
    });

    console.log(
      `[CRON] Penjadwalan Evaluasi Target aktif. Cron: ${setting.cronString} (${setting.frequency})`,
    );
  } catch (err) {
    console.error("[CRON] Gagal menginisialisasi jadwal:", err);
  }
};

// Export juga fungsi manual trigger untuk kebutuhan testing
export { evaluateTargets };
