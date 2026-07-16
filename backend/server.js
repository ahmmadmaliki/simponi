import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import xlsx from "xlsx";

import axios from "axios";
import {
  decodeBapendaResponse,
  fetchMetricsForDateRange,
  getBapendaToken,
} from "./services/bapendaService.js";
import { evaluateTargets, startCronJobs } from "./services/cronScheduler.js";
import { waClient } from "./services/notificationService.js";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Basic endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "SIOPTIMA Backend is running." });
});

// Auth Login Route
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: "Username tidak ditemukan" });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Password salah" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({
      message: "Login berhasil",
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
});

const getMonthRange = (startMonth, endMonth) => {
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const startIndex = months.indexOf(startMonth);
  const endIndex = months.indexOf(endMonth);
  if (startIndex === -1 || endIndex === -1 || startIndex > endIndex)
    return months;
  return months.slice(startIndex, endIndex + 1);
};

// Dashboard Metrics Route
app.get("/api/dashboard/summary", async (req, res) => {
  try {
    const { tahun, bulanMulai, bulanAkhir } = req.query;

    let whereClause = {};
    if (tahun) whereClause.tahun = Number(tahun);
    if (bulanMulai && bulanAkhir) {
      whereClause.bulan = { in: getMonthRange(bulanMulai, bulanAkhir) };
    }

    const aggregate = await prisma.realisasiOpsen.aggregate({
      _sum: { opsenPkb: true, opsenBbnkb: true },
      where: whereClause,
    });

    let targetWhere = {};
    if (tahun) targetWhere.tahun = Number(tahun);

    // For targets, if it's quarterly, we might need a complex mapping or just sum the year's target for simplicity.
    // Assuming target is yearly per triwulan, we'll just sum it up for the year for now.
    const targetPKB = await prisma.targetOpsen.aggregate({
      _sum: { targetRupiah: true },
      where: { jenisOpsen: "PKB", ...targetWhere },
    });
    const targetBBNKB = await prisma.targetOpsen.aggregate({
      _sum: { targetRupiah: true },
      where: { jenisOpsen: "BBNKB", ...targetWhere },
    });

    res.json({
      targetPkb: targetPKB._sum.targetRupiah || 0,
      targetBbnkb: targetBBNKB._sum.targetRupiah || 0,
      realisasiPkb: aggregate._sum.opsenPkb || 0,
      realisasiBbnkb: aggregate._sum.opsenBbnkb || 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan" });
  }
});

const monthMap = {
  Januari: "01",
  Februari: "02",
  Maret: "03",
  April: "04",
  Mei: "05",
  Juni: "06",
  Juli: "07",
  Agustus: "08",
  September: "09",
  Oktober: "10",
  November: "11",
  Desember: "12",
};

// Live Dashboard Metrics Proxy
app.get("/api/dashboard/live-metrics", async (req, res) => {
  try {
    const { tahun, bulanMulai, bulanAkhir } = req.query;
    if (!tahun || !bulanMulai || !bulanAkhir)
      return res
        .status(400)
        .json({ message: "tahun, bulanMulai dan bulanAkhir wajib diisi" });

    const tahunNum = Number(tahun);
    const targetPKB = await prisma.targetOpsen.aggregate({
      _sum: { targetRupiah: true },
      where: { jenisOpsen: "PKB", tahun: tahunNum },
    });
    const targetBBNKB = await prisma.targetOpsen.aggregate({
      _sum: { targetRupiah: true },
      where: { jenisOpsen: "BBNKB", tahun: tahunNum },
    });

    const token = await getBapendaToken();
    const kodeKota = process.env.BAPENDA_KODE_KOTA || "";

    const mmMulai = monthMap[bulanMulai] || "01";
    const mmAkhir = monthMap[bulanAkhir] || "12";
    const tglMulai = `${tahun}-${mmMulai}-01`;

    const lastDayOfMonth = new Date(tahunNum, Number(mmAkhir), 0).getDate();
    let tglAkhirDate = new Date(tahunNum, Number(mmAkhir) - 1, lastDayOfMonth);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (tglAkhirDate > today) {
      tglAkhirDate = new Date();
    }

    const fmtDateStr = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dt = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dt}`;
    };
    const tglAkhir = fmtDateStr(tglAkhirDate);

    const { realisasiPkb, realisasiBbnkb } = await fetchMetricsForDateRange(
      tglMulai,
      tglAkhir,
      kodeKota,
      token,
    );

    res.json({
      targetPkb: targetPKB._sum.targetRupiah || 0,
      targetBbnkb: targetBBNKB._sum.targetRupiah || 0,
      realisasiPkb,
      realisasiBbnkb,
      isLive: true,
    });
  } catch (error) {
    console.error("Error fetching live metrics:", error.message);
    res
      .status(500)
      .json({ message: "Gagal menarik data Live dari Bapenda Jatim" });
  }
});

// Helper for date formatting
function getLastDayOfMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getMonthIndex(monthStr) {
  const m = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  return m.indexOf(monthStr) + 1;
}

// Kecamatan Data Route (LIVE BAPENDA API WITH FALLBACK)
app.get("/api/dashboard/kecamatan", async (req, res) => {
  try {
    const { tahun, bulanMulai, bulanAkhir } = req.query;
    
    if (!tahun || !bulanMulai || !bulanAkhir) {
      return res.status(400).json({ message: "Parameter tahun, bulanMulai, bulanAkhir diperlukan." });
    }

    const token = await getBapendaToken();
    const kodeKota = process.env.BAPENDA_KODE_KOTA || '3514';
    
    const startMonth = getMonthIndex(bulanMulai);
    const endMonthRequested = getMonthIndex(bulanAkhir);
    
    // STEP 1: Find the Last Available Month by checking when total stops changing
    let lastAvailableMonth = startMonth;
    let currentCheckMonth = endMonthRequested;
    let prevTotal = -1;
    let maxRetries = 12;
    let latestValidData = null;

    // We step backwards from endMonthRequested
    while (currentCheckMonth >= startMonth && maxRetries > 0) {
      const checkStartStr = `${tahun}-01-01`; // Always cumulative to compare totals
      const checkEndDay = getLastDayOfMonth(Number(tahun), currentCheckMonth);
      const checkEndStr = `${tahun}-${String(currentCheckMonth).padStart(2, '0')}-${checkEndDay}`;

      try {
        const response = await axios.get("https://simonas.dipendajatim.go.id/rest/api/v2026/opsen/summary-kecamatan", {
          headers: { Authorization: `Bearer ${token}` },
          params: { 
            tgbayar_awal: checkStartStr,
            tgbayar_akhir: checkEndStr,
            kode_kota: kodeKota 
          }
        });
        
        const decoded = decodeBapendaResponse(response.data);
        if (decoded && decoded.data && decoded.data.length > 0) {
          const currentTotal = decoded.summary?.total || 0;
          
          if (prevTotal === -1) {
             // First check (e.g. Dec)
             prevTotal = currentTotal;
             latestValidData = decoded;
             lastAvailableMonth = currentCheckMonth;
          } else if (currentTotal < prevTotal) {
             // We found a drop! This means the month AFTER this one was the first month of the plateau
             // Which means `currentCheckMonth + 1` is the true last available month!
             lastAvailableMonth = currentCheckMonth + 1;
             break;
          } else {
             // Still on the plateau
             lastAvailableMonth = currentCheckMonth;
          }
        } else {
           // No data at all for this month (e.g. earlier than January)
           break;
        }
      } catch (err) {
        // Error
      }

      currentCheckMonth--;
      maxRetries--;
    }

    if (!latestValidData) {
      return res.json({ data: [], lastSync: null });
    }

    // Now that we found the plateau start (lastAvailableMonth), the latestValidData we kept 
    // actually has the exact same data as the plateau start! We don't need another fetch.
    const finalEndDay = getLastDayOfMonth(Number(tahun), lastAvailableMonth);
    const finalSyncStr = `${tahun}-${String(lastAvailableMonth).padStart(2, '0')}-${finalEndDay}`;

    // Format data to match what the frontend expects
    const formattedData = latestValidData.data.map(item => {
      const opsenPkb = Number(item.opsen_pkb) || 0;
      const opsenBbnkb = Number(item.opsen_bbn) || 0;
      
      const pkbPokok = opsenPkb / 0.66;
      const bbnkbPokok = opsenBbnkb / 0.66;
      
      return {
        id: Number(item.kode_camat),
        name: item.nama_kecamatan,
        target: 5000000000, 
        pkbPokok: pkbPokok,
        opsenPkb: opsenPkb,
        bbnkbPokok: bbnkbPokok,
        opsenBbnkb: opsenBbnkb
      };
    });

    res.json({
      data: formattedData,
      lastSync: finalSyncStr // Real max date
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal menarik data kecamatan dari Bapenda." });
  }
});

// Trend Bulanan Route
app.get("/api/dashboard/trend", async (req, res) => {
  try {
    const { tahun, bulanMulai, bulanAkhir } = req.query;
    if (!tahun) return res.status(400).json({ message: "tahun wajib diisi" });
    const tahunNum = Number(tahun);

    const targetMonths =
      bulanMulai && bulanAkhir
        ? getMonthRange(bulanMulai, bulanAkhir)
        : Object.keys(monthMap);

    const token = await getBapendaToken();
    const kodeKota = process.env.BAPENDA_KODE_KOTA || "";

    const monthsMap = {
      Januari: "Jan",
      Februari: "Feb",
      Maret: "Mar",
      April: "Apr",
      Mei: "Mei",
      Juni: "Jun",
      Juli: "Jul",
      Agustus: "Agu",
      September: "Sep",
      Oktober: "Okt",
      November: "Nov",
      Desember: "Des",
    };

    const promises = targetMonths.map(async (month) => {
      const mm = monthMap[month];
      const tglMulai = `${tahunNum}-${mm}-01`;

      const lastDayOfMonth = new Date(tahunNum, Number(mm), 0).getDate();
      let tglAkhirDate = new Date(tahunNum, Number(mm) - 1, lastDayOfMonth);

      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const firstDayOfMonth = new Date(tahunNum, Number(mm) - 1, 1);
      if (firstDayOfMonth > today) {
        return { name: monthsMap[month], pkb: 0, bbnkb: 0 };
      }

      if (tglAkhirDate > today) {
        tglAkhirDate = new Date();
      }

      const fmtDateStr = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dt = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${dt}`;
      };
      const tglAkhir = fmtDateStr(tglAkhirDate);

      const metrics = await fetchMetricsForDateRange(
        tglMulai,
        tglAkhir,
        kodeKota,
        token,
      );

      return {
        name: monthsMap[month],
        pkb: metrics.realisasiPkb / 1000000,
        bbnkb: metrics.realisasiBbnkb / 1000000,
      };
    });

    const formattedData = await Promise.all(promises);

    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching live trend:", error.message);
    res.status(500).json({ message: "Gagal menarik data trend" });
  }
});

// Evaluasi Komparasi Route
app.get("/api/evaluasi/komparasi", async (req, res) => {
  try {
    const { tahun1, tahun2, opsenType } = req.query;
    const t1 = Number(tahun1) || new Date().getFullYear();
    const t2 = Number(tahun2) || t1 - 1;

    const rawData = await prisma.realisasiOpsen.groupBy({
      by: ["bulan", "tahun"],
      _sum: { opsenPkb: true, opsenBbnkb: true, totalOpsen: true },
      where: { tahun: { in: [t1, t2] } },
    });

    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    const monthsMap = {
      Januari: "Jan",
      Februari: "Feb",
      Maret: "Mar",
      April: "Apr",
      Mei: "Mei",
      Juni: "Jun",
      Juli: "Jul",
      Agustus: "Agu",
      September: "Sep",
      Oktober: "Okt",
      November: "Nov",
      Desember: "Des",
    };

    const formattedData = months.map((month) => {
      const dataT1 = rawData.find((d) => d.bulan === month && d.tahun === t1);
      const dataT2 = rawData.find((d) => d.bulan === month && d.tahun === t2);

      const getValue = (data) => {
        if (!data) return 0;
        let val = 0;
        if (opsenType === "PKB") val = Number(data._sum.opsenPkb);
        else if (opsenType === "BBNKB") val = Number(data._sum.opsenBbnkb);
        else val = Number(data._sum.totalOpsen);
        return val / 1000000; // Return in millions
      };

      return {
        name: monthsMap[month] || month.substring(0, 3),
        [t1]: getValue(dataT1),
        [t2]: getValue(dataT2),
      };
    });

    res.json(formattedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

// Kinerja Kegiatan Route
app.get("/api/kinerja", async (req, res) => {
  try {
    const { tahun } = req.query;

    let whereClause = {};
    if (tahun) whereClause.tahun = Number(tahun);

    const rawData = await prisma.kegiatan.groupBy({
      by: ["jenisKegiatan"],
      where: whereClause,
      _sum: { targetJumlah: true, realisasiJumlah: true },
    });

    const result = rawData.map((d, i) => ({
      id: i + 1,
      nama: d.jenisKegiatan,
      target: d._sum.targetJumlah || 0,
      realisasi: d._sum.realisasiJumlah || 0,
      jenis: "Program Kerja",
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

// Evaluasi Komparasi Live Proxy
app.get("/api/evaluasi/live-komparasi", async (req, res) => {
  try {
    const { tahun1, tahun2, opsenType } = req.query;
    const t1 = Number(tahun1) || new Date().getFullYear();
    const t2 = Number(tahun2) || t1 - 1;

    const token = await getBapendaToken();

    // Fetch Data Tahun 1
    const resT1 = await axios.get(
      "https://simonas.dipendajatim.go.id/rest/api/v2026/opsen/total",
      {
        params: {
          blbayar_awal: `${t1}-01`,
          blbayar_akhir: `${t1}-12`,
          kode_kota: process.env.BAPENDA_KODE_KOTA || "",
        },
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    // Fetch Data Tahun 2
    const resT2 = await axios.get(
      "https://simonas.dipendajatim.go.id/rest/api/v2026/opsen/total",
      {
        params: {
          blbayar_awal: `${t2}-01`,
          blbayar_akhir: `${t2}-12`,
          kode_kota: process.env.BAPENDA_KODE_KOTA || "",
        },
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const dataT1 = decodeBapendaResponse(resT1.data);
    const dataT2 = decodeBapendaResponse(resT2.data);

    const result = [];
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    months.forEach((m, idx) => {
      const monthNumStr = String(idx + 1);

      const filterT1 = dataT1.filter((d) => String(d.bulan) === monthNumStr);
      let sumT1 = 0;
      filterT1.forEach((d) => {
        if (opsenType === "PKB" || opsenType === "TOTAL")
          sumT1 += Number(d.total_opsen_pkb_tgbayar) || 0;
        if (opsenType === "BBNKB" || opsenType === "TOTAL")
          sumT1 += Number(d.total_opsen_bbn_tgbayar) || 0;
      });

      const filterT2 = dataT2.filter((d) => String(d.bulan) === monthNumStr);
      let sumT2 = 0;
      filterT2.forEach((d) => {
        if (opsenType === "PKB" || opsenType === "TOTAL")
          sumT2 += Number(d.total_opsen_pkb_tgbayar) || 0;
        if (opsenType === "BBNKB" || opsenType === "TOTAL")
          sumT2 += Number(d.total_opsen_bbn_tgbayar) || 0;
      });

      result.push({
        name: m,
        [t1]: sumT1,
        [t2]: sumT2,
      });
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching live evaluasi:", error.message);
    res
      .status(500)
      .json({ message: "Gagal menarik komparasi Live dari Bapenda Jatim" });
  }
});

// --- DATA PANEN & REKOMENDASI ---
// Sinkronisasi Data Tunggakan (Mundur Teratur)

app.post("/api/tunggakan/sync", async (req, res) => {
  try {
    const token = await getBapendaToken();
    let currentDate = new Date();
    let successData = null;
    let fallbackCount = 0;
    const MAX_FALLBACKS = 4; // Try up to 4 months back

    while (fallbackCount < MAX_FALLBACKS) {
      const targetMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
      const targetYear = String(currentDate.getFullYear());
      
      try {
        const response = await axios.get("https://simonas.dipendajatim.go.id/rest/api/v2026/opsen/summary-kecamatan", {
          headers: { Authorization: `Bearer ${token}` },
          params: { 
            bulan: targetMonth,
            tahun: targetYear,
            kode_kota: process.env.BAPENDA_KODE_KOTA || '3514' 
          }
        });
        
        const decoded = decodeBapendaResponse(response.data);
        if (decoded && decoded.data && decoded.data.length > 0) {
          successData = decoded;
          break; // Found data, exit loop!
        }
      } catch (err) {
        // If 404 or empty, ignore and continue to fallback
        if (err.response && err.response.status !== 404 && err.response.status !== 400) {
          console.error("[Bapenda Sync Error]", err.message);
        }
      }

      // Fallback 1 month
      currentDate.setMonth(currentDate.getMonth() - 1);
      fallbackCount++;
    }

    if (!successData) {
      return res.status(404).json({ message: "Gagal menarik data tunggakan, bahkan setelah proses mundur 4 bulan." });
    }

    // Process the successful data
    const syncDate = successData.filter?.date?.akhir || new Date().toISOString().split('T')[0];
    
    // Update all DataTunggakan
    for (const item of successData.data) {
      await prisma.dataTunggakan.upsert({
        where: { kecamatan: item.nama },
        update: {
          obyek: Number(item.objek) || 0,
          potensi: Number(item.potensi) || 0
        },
        create: {
          kecamatan: item.nama,
          obyek: Number(item.objek) || 0,
          potensi: Number(item.potensi) || 0
        }
      });
    }

    // Update metadata
    await prisma.systemMetadata.upsert({
      where: { id: "LAST_SYNC_TUNGGAKAN" },
      update: { value: syncDate },
      create: { id: "LAST_SYNC_TUNGGAKAN", value: syncDate }
    });

    res.json({ 
      message: "Sinkronisasi berhasil!", 
      syncedDate: syncDate,
      totalRows: successData.data.length
    });
  } catch (error) {
    console.error("Sync Tunggakan Error:", error);
    res.status(500).json({ message: "Terjadi kesalahan internal saat sinkronisasi." });
  }
});

app.get("/api/panen", async (req, res) => {
  const data = await prisma.jadwalPanen.findMany();
  res.json(data);
});

app.post("/api/upload/panen", upload.single("file"), async (req, res) => {
  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    for (const row of data) {
      if (!row.Kecamatan) continue;

      const rowData = {
        kecamatan: row.Kecamatan.toString(),
        padi: row["Tan. Padi"]?.toString() || "0",
        palawija: row["Tanaman Palawija"]?.toString() || "0",
        hortikultura: row["Tanaman Hortikultura"]?.toString() || "0",
        tebu: row["Tanaman Tebu"]?.toString() || "0",
        keterangan: row.Keterangan?.toString() || "",
      };

      await prisma.jadwalPanen.upsert({
        where: { kecamatan: rowData.kecamatan },
        update: rowData,
        create: rowData,
      });
    }

    res.json({ message: "Data Jadwal Panen berhasil diunggah" });
  } catch (error) {
    res.status(500).json({ message: "Gagal upload Data Panen" });
  }
});

// --- DATA TUNGGAKAN ---
app.get("/api/tunggakan", async (req, res) => {
  try {
    const data = await prisma.dataTunggakan.findMany();
    const metadata = await prisma.systemMetadata.findUnique({
      where: { id: "LAST_SYNC_TUNGGAKAN" }
    });
    res.json({ 
      data, 
      lastSync: metadata?.value || null 
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data tunggakan" });
  }
});
app.post("/api/upload/tunggakan", upload.single("file"), async (req, res) => {
  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    for (const row of data) {
      // Allow lowercase keys just in case
      const kecamatanRaw = row["Kecamatan"] || row["obyek"] || row["KECAMATAN"] || Object.values(row)[1];
      if (!kecamatanRaw) continue;

      // Excel parses dots in numbers based on locale, handle potential formats
      const cleanInt = (val) => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        return parseInt(val.toString().replace(/\D/g, ''), 10) || 0;
      };

      const obyekVal = cleanInt(row["Obyek"] || row["obyek"]);
      const potensiVal = cleanInt(row["Potensi"] || row["potensi"]);

      const rowData = {
        kecamatan: kecamatanRaw.toString().trim(),
        obyek: obyekVal,
        potensi: potensiVal,
      };

      await prisma.dataTunggakan.upsert({
        where: { kecamatan: rowData.kecamatan },
        update: rowData,
        create: rowData,
      });
    }
    res.json({ message: "Data Tunggakan berhasil diunggah" });
  } catch (error) {
    res.status(500).json({ message: "Gagal upload Data Tunggakan" });
  }
});

// --- DATA KINERJA KEGIATAN ---
app.get("/api/master/kinerja", async (req, res) => {
  const data = await prisma.kegiatan.findMany({
    orderBy: [{ tahun: "desc" }],
  });
  res.json(data);
});
app.post("/api/upload/kinerja", upload.single("file"), async (req, res) => {
  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const data = xlsx.utils.sheet_to_json(
      workbook.Sheets[workbook.SheetNames[0]],
    );
    const mapped = data.map((row) => ({
      jenisKegiatan: row["Jenis Kegiatan"]?.toString() || "",
      targetJumlah: Number(row["Target Jumlah"]) || 0,
      realisasiJumlah: Number(row["Realisasi Jumlah"]) || 0,
      tahun: Number(row["Tahun"]) || new Date().getFullYear(),
    }));
    for (const row of mapped) {
      const existing = await prisma.kegiatan.findFirst({
        where: {
          jenisKegiatan: row.jenisKegiatan,
          tahun: row.tahun,
        },
      });
      if (existing) {
        await prisma.kegiatan.update({
          where: { id: existing.id },
          data: row,
        });
      } else {
        await prisma.kegiatan.create({ data: row });
      }
    }
    res.json({ message: "Data Kinerja Kegiatan berhasil diunggah" });
  } catch (error) {
    res.status(500).json({ message: "Gagal upload Data Kinerja Kegiatan" });
  }
});

// --- DATA TARGET ---
app.get("/api/target", async (req, res) => {
  const data = await prisma.targetOpsen.findMany();
  res.json(data);
});
app.post("/api/upload/target", upload.single("file"), async (req, res) => {
  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const data = xlsx.utils.sheet_to_json(
      workbook.Sheets[workbook.SheetNames[0]],
    );
    const mapped = data.map((row) => ({
      jenisOpsen: row["Jenis Opsen"]?.toString() || "PKB",
      tahun: Number(row["Tahun"]) || new Date().getFullYear(),
      targetRupiah: Number(row["Target Rupiah"]) || 0,
    }));
    for (const row of mapped) {
      const existing = await prisma.targetOpsen.findFirst({
        where: { jenisOpsen: row.jenisOpsen, tahun: row.tahun },
      });
      if (existing) {
        await prisma.targetOpsen.update({
          where: { id: existing.id },
          data: row,
        });
      } else {
        await prisma.targetOpsen.create({ data: row });
      }
    }
    res.json({ message: "Data Target berhasil diunggah" });
  } catch (error) {
    res.status(500).json({ message: "Gagal upload Data Target" });
  }
});

// --- DATA REALISASI ---
app.get("/api/realisasi", async (req, res) => {
  const data = await prisma.realisasiOpsen.findMany();
  res.json(data);
});
app.post("/api/upload/realisasi", upload.single("file"), async (req, res) => {
  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const data = xlsx.utils.sheet_to_json(
      workbook.Sheets[workbook.SheetNames[0]],
    );
    const mappedData = data.map((row) => ({
      kecamatan: row["Kecamatan"]?.toString() || "",
      desaKelurahan: row["Desa/Kelurahan"]?.toString() || "-",
      tahun: Number(row["Tahun"]) || new Date().getFullYear(),
      bulan: row["Bulan"]?.toString() || "Januari",
      pkbPokok: Number(row["PKB Pokok"]) || 0,
      opsenPkb: Number(row["Opsen PKB"]) || 0,
      bbnkbPokok: Number(row["BBNKB Pokok"]) || 0,
      opsenBbnkb: Number(row["Opsen BBNKB"]) || 0,
      totalOpsen: Number(row["Total Realisasi Opsen"]) || 0,
    }));
    for (const row of mappedData) {
      const existing = await prisma.realisasiOpsen.findFirst({
        where: {
          kecamatan: row.kecamatan,
          desaKelurahan: row.desaKelurahan,
          tahun: row.tahun,
          bulan: row.bulan,
        },
      });
      if (existing) {
        await prisma.realisasiOpsen.update({
          where: { id: existing.id },
          data: row,
        });
      } else {
        await prisma.realisasiOpsen.create({ data: row });
      }
    }
    res.json({ message: "Data Realisasi berhasil diunggah" });
  } catch (error) {
    res.status(500).json({ message: "Gagal upload Data Realisasi" });
  }
});

// --- TEMPLATE DOWNLOAD ROUTES ---
const createTemplate = (res, filename, columns) => {
  const ws = xlsx.utils.aoa_to_sheet([columns]);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
  const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}.xlsx"`,
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.send(buffer);
};

app.get("/api/template/panen", (req, res) =>
  createTemplate(res, "Template_Panen", [
    "No",
    "Kecamatan",
    "Tan. Padi",
    "Tanaman Palawija",
    "Tanaman Hortikultura",
    "Tanaman Tebu",
    "Keterangan",
  ])
);
app.get("/api/template/tunggakan", (req, res) =>
  createTemplate(res, "Template_Tunggakan", [
    "No",
    "Kecamatan",
    "Obyek",
    "Potensi",
  ])
);
app.get("/api/template/target", (req, res) =>
  createTemplate(res, "Template_Target", [
    "Jenis Opsen",
    "Tahun",
    "Target Rupiah",
  ]),
);
app.get("/api/template/realisasi", (req, res) =>
  createTemplate(res, "Template_Realisasi", [
    "Kecamatan",
    "Desa/Kelurahan",
    "Tahun",
    "Bulan",
    "PKB Pokok",
    "Opsen PKB",
    "BBNKB Pokok",
    "Opsen BBNKB",
    "Total Realisasi Opsen",
  ]),
);
app.get("/api/template/kinerja", (req, res) =>
  createTemplate(res, "Template_Kinerja_Kegiatan", [
    "Jenis Kegiatan",
    "Target Jumlah",
    "Realisasi Jumlah",
    "Tahun",
  ]),
);

// Manual Trigger for Notification Testing
app.get("/api/test-notification", async (req, res) => {
  try {
    await evaluateTargets();
    res.json({
      message:
        "Evaluasi paksa (Force Evaluation) telah dijalankan. Periksa log terminal backend untuk detail QR WA dan URL Email.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan saat memicu evaluasi." });
  }
});

// --- REKOMENDASI TINDAKAN API ---
app.get("/api/rekomendasi", async (req, res) => {
  try {
    const jadwalPanenList = await prisma.jadwalPanen.findMany();
    const currentMonthIndex = new Date().getMonth(); // 0-11
    const months = [
      "januari", "pebruari", "maret", "april", "mei", "juni", 
      "juli", "agustus", "september", "oktober", "nopember", "desember"
    ];
    // Juga handle februari (kadang ditulis pebruari)
    const currentMonthStr = months[currentMonthIndex];
    const currentMonthAlternate = currentMonthIndex === 1 ? "februari" : currentMonthStr;

    // Helper untuk mengecek apakah bulan saat ini ada di dalam string jadwal
    const isHarvestingNow = (scheduleStr) => {
      if (!scheduleStr || scheduleStr === "0") return false;
      const str = scheduleStr.toLowerCase();
      
      // Cek exact match atau comma separated
      if (str.includes(currentMonthStr) || str.includes(currentMonthAlternate)) return true;
      
      // Cek rentang waktu (misal "Juni - Agustus")
      if (str.includes("-")) {
        const parts = str.split("-").map(p => p.trim());
        if (parts.length === 2) {
          let startIdx = months.indexOf(parts[0]);
          if (parts[0] === "februari") startIdx = 1;
          let endIdx = months.indexOf(parts[1]);
          if (parts[1] === "februari") endIdx = 1;

          if (startIdx !== -1 && endIdx !== -1) {
            // Handle cross-year (e.g., November - Februari)
            if (startIdx <= endIdx) {
              if (currentMonthIndex >= startIdx && currentMonthIndex <= endIdx) return true;
            } else {
              if (currentMonthIndex >= startIdx || currentMonthIndex <= endIdx) return true;
            }
          }
        }
      }
      return false;
    };

    const rekomendasiData = await Promise.all(jadwalPanenList.map(async (panen, index) => {
      const isPadi = isHarvestingNow(panen.padi);
      const isPalawija = isHarvestingNow(panen.palawija);
      const isHorti = isHarvestingNow(panen.hortikultura);
      const isTebu = isHarvestingNow(panen.tebu);

      const hasHarvest = isPadi || isPalawija || isHorti || isTebu;
      
      let activeCommodities = [];
      if (isPadi) activeCommodities.push("Padi");
      if (isPalawija) activeCommodities.push("Palawija");
      if (isHorti) activeCommodities.push("Hortikultura");
      if (isTebu) activeCommodities.push("Tebu");

      // Get real tunggakan data
      const tunggakanData = await prisma.dataTunggakan.findUnique({
        where: { kecamatan: panen.kecamatan }
      });

      // Format Potensi ke format Rupiah Miliaran/Jutaan agar lebih enak dibaca
      const formatRupiah = (num) => {
        if (!num) return "Rp 0";
        const val = Number(num);
        if (val >= 1000000000) {
          return `Rp ${(val / 1000000000).toFixed(2)} Miliar`;
        } else if (val >= 1000000) {
          return `Rp ${(val / 1000000).toFixed(2)} Juta`;
        }
        return `Rp ${val.toLocaleString('id-ID')}`;
      };

      const potensiStr = formatRupiah(tunggakanData?.potensi);
      const obyekCount = tunggakanData?.obyek || 0;

      let tipe = "";
      let alasan = "";
      let dataPanenStatus = hasHarvest ? "Sedang Panen" : "Belum Panen";
      
      let priorityLevel = 3; // 1 = Utama, 2 = Menengah, 3 = Rendah
      let priorityText = "";

      const ONE_BILLION = 1000000000;

      if (hasHarvest && tunggakanData?.potensi > ONE_BILLION) {
        priorityLevel = 1;
        priorityText = "Prioritas Utama";
        tipe = "Operasi Gabungan";
        alasan = `Wilayah ini sedang memasuki masa panen raya (${activeCommodities.join(", ")}). Daya beli masyarakat sedang tinggi, sangat ideal untuk penagihan aktif (Operasi Gabungan/Door-to-door) mengingat potensi tunggakan mencapai ${potensiStr} dari ${obyekCount.toLocaleString('id-ID')} obyek kendaraan.`;
      } else if (hasHarvest && tunggakanData?.potensi <= ONE_BILLION) {
        priorityLevel = 2;
        priorityText = "Prioritas Menengah";
        tipe = "Door-to-door";
        alasan = `Wilayah ini sedang panen raya (${activeCommodities.join(", ")}). Potensi tunggakan sebesar ${potensiStr} (${obyekCount.toLocaleString('id-ID')} obyek) dapat dimaksimalkan melalui pendekatan persuasif (Door-to-door).`;
      } else if (!hasHarvest && tunggakanData?.potensi > ONE_BILLION) {
        priorityLevel = 2;
        priorityText = "Prioritas Menengah";
        tipe = "Sosialisasi Khusus";
        alasan = `Meskipun belum memasuki masa panen, wilayah ini butuh perhatian khusus karena besarnya potensi tunggakan yang mencapai ${potensiStr} dari ${obyekCount.toLocaleString('id-ID')} obyek kendaraan.`;
      } else {
        priorityLevel = 3;
        priorityText = "Prioritas Rendah";
        tipe = "Sosialisasi Rutin";
        alasan = `Wilayah ini belum memasuki masa panen komoditas utama dan potensi tunggakan relatif terkendali (${potensiStr}). Sosialisasi PKB/BBNKB rutin disarankan.`;
      }

      return {
        id: panen.id,
        kecamatan: panen.kecamatan,
        tipe,
        alasan,
        dataPanen: dataPanenStatus,
        dataTunggakan: potensiStr, 
        priorityLevel,
        priorityText
      };
    }));

    // Sort by priority level (1 first, then 2, then 3) and then by potential tunggakan descending
    rekomendasiData.sort((a, b) => {
      if (a.priorityLevel !== b.priorityLevel) {
        return a.priorityLevel - b.priorityLevel;
      }
      // If same priority, could sort by something else, but this is fine for now.
      return 0;
    });

    res.json(rekomendasiData);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data rekomendasi" });
  }
});

// --- NOTIFICATION SETTING API ---

app.get("/api/settings/notification", async (req, res) => {
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
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil pengaturan." });
  }
});

app.put("/api/settings/notification", async (req, res) => {
  try {
    const { frequency, dayOfWeek, dateOfMonth, time } = req.body;

    // Parse time "HH:mm"
    const [hour, minute] = time.split(":");

    let cronString = "* * * * *"; // fallback
    if (frequency === "daily") {
      cronString = `${parseInt(minute)} ${parseInt(hour)} * * *`;
    } else if (frequency === "weekly") {
      cronString = `${parseInt(minute)} ${parseInt(hour)} * * ${parseInt(dayOfWeek)}`;
    } else if (frequency === "monthly") {
      cronString = `${parseInt(minute)} ${parseInt(hour)} ${parseInt(dateOfMonth)} * *`;
    }

    const updatedSetting = await prisma.notificationSetting.upsert({
      where: { id: 1 },
      update: {
        frequency,
        dayOfWeek: parseInt(dayOfWeek),
        dateOfMonth: parseInt(dateOfMonth),
        time,
        cronString,
      },
      create: {
        id: 1,
        frequency,
        dayOfWeek: parseInt(dayOfWeek),
        dateOfMonth: parseInt(dateOfMonth),
        time,
        cronString,
      },
    });

    // Restart cron background job so it uses the new string immediately
    startCronJobs();

    res.json(updatedSetting);
  } catch (error) {
    res.status(500).json({ message: "Gagal menyimpan pengaturan." });
  }
});

// --- USER MANAGEMENT API ---

app.get("/api/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        noWa: true,
        email: true,
        receiveNotif: true,
        createdAt: true,
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data pengguna." });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { username, password, role, noWa, email, receiveNotif } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: "Username sudah digunakan." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: role || "staff",
        noWa: noWa || null,
        email: email || null,
        receiveNotif: receiveNotif !== undefined ? receiveNotif : true,
      },
      select: {
        id: true,
        username: true,
        role: true,
        noWa: true,
        email: true,
        receiveNotif: true,
      },
    });
    res.json(newUser);
  } catch (error) {
    res.status(500).json({ message: "Gagal membuat pengguna baru." });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, noWa, email, receiveNotif } = req.body;

    const dataToUpdate = {
      username,
      role,
      noWa: noWa || null,
      email: email || null,
    };

    if (receiveNotif !== undefined) {
      dataToUpdate.receiveNotif = receiveNotif;
    }

    if (password && password.trim() !== "") {
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        role: true,
        noWa: true,
        email: true,
        receiveNotif: true,
      },
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui pengguna." });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { currentUserId } = req.query;

    if (currentUserId && parseInt(currentUserId) === parseInt(id)) {
      return res
        .status(400)
        .json({ message: "Tidak dapat menghapus akun Admin Anda sendiri." });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: "Pengguna berhasil dihapus." });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus pengguna." });
  }
});

app.get("/api/test-wa", async (req, res) => {
  try {
    const number = req.query.number || "088991360201";
    const formattedNumber = number.replace(/^[0|+]/, "62") + "@c.us";
    await waClient.sendMessage(
      formattedNumber,
      "*SIOPTIMA TEST* - Jika pesan ini masuk, berarti koneksi WA berjalan lancar.",
    );
    res.json({
      success: true,
      message: `Pesan sukses terkirim ke ${formattedNumber}`,
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.toString(),
      message: "Gagal mengirim pesan WA",
    });
  }
});

// Initialize WA and Cron Background Services
console.log("[SYSTEM] Memulai inisialisasi WA Client...");
waClient.initialize();
startCronJobs();

// --- PRODUCTION: SERVE FRONTEND ---
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// SPA Fallback: serve index.html for any unhandled routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(
    `[SERVER] SIOPTIMA Backend API running on http://localhost:${PORT}`,
  );
});

// --- GRACEFUL SHUTDOWN (Mencegah Zombie Process) ---
const gracefulShutdown = async (signal) => {
  console.log(
    `\n[SYSTEM] Menerima sinyal ${signal}. Menutup proses dengan aman agar tidak menjadi Zombie...`,
  );
  try {
    // Menutup koneksi browser Chromium dari waClient secara paksa
    await waClient.destroy();
    console.log("[SYSTEM] Browser WhatsApp berhasil ditutup.");
  } catch (error) {
    // Abaikan error jika waClient belum sempat terbuka
  }
  process.exit(0);
};

// Menangkap sinyal terminate dari terminal (Ctrl+C)
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
// Menangkap sinyal restart mendadak dari nodemon
process.on("SIGUSR2", () => gracefulShutdown("SIGUSR2"));
