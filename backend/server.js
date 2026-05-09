import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import xlsx from 'xlsx';

import { waClient } from './services/notificationService.js';
import { startCronJobs, evaluateTargets } from './services/cronScheduler.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Basic endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SIMPONI Backend is running.' });
});

// Auth Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: 'Username tidak ditemukan' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Password salah' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login berhasil',
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Dashboard Metrics Route
app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const aggregate = await prisma.realisasiOpsen.aggregate({
      _sum: { opsenPkb: true, opsenBbnkb: true }
    });
    const targetPKB = await prisma.targetOpsen.aggregate({ _sum: { targetRupiah: true }, where: { jenisOpsen: 'PKB' } });
    const targetBBNKB = await prisma.targetOpsen.aggregate({ _sum: { targetRupiah: true }, where: { jenisOpsen: 'BBNKB' } });

    res.json({
      targetPkb: targetPKB._sum.targetRupiah || 0,
      targetBbnkb: targetBBNKB._sum.targetRupiah || 0,
      realisasiPkb: aggregate._sum.opsenPkb || 0,
      realisasiBbnkb: aggregate._sum.opsenBbnkb || 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan' });
  }
});

// Kecamatan Data Route
app.get('/api/dashboard/kecamatan', async (req, res) => {
  try {
    const rawData = await prisma.realisasiOpsen.groupBy({
      by: ['kecamatan'],
      _sum: { pkbPokok: true, opsenPkb: true, bbnkbPokok: true, opsenBbnkb: true, totalOpsen: true }
    });
    
    if (rawData.length === 0) {
      return res.json([
        { id: 1, name: 'Magetan', target: 5000000000, pkbPokok: 1500000000, opsenPkb: 990000000, bbnkbPokok: 1200000000, opsenBbnkb: 792000000 },
        { id: 2, name: 'Maospati', target: 3500000000, pkbPokok: 1000000000, opsenPkb: 660000000, bbnkbPokok: 800000000, opsenBbnkb: 528000000 },
      ]);
    }

    const result = rawData.map((d, i) => ({
        id: i + 1,
        name: d.kecamatan,
        target: 2000000000, // mock dummy
        pkbPokok: Number(d._sum.pkbPokok) || 0,
        opsenPkb: Number(d._sum.opsenPkb) || 0,
        bbnkbPokok: Number(d._sum.bbnkbPokok) || 0,
        opsenBbnkb: Number(d._sum.opsenBbnkb) || 0
    }));

    res.json(result);
  } catch (error) {
     res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Kinerja Kegiatan Route
app.get('/api/kinerja', async (req, res) => {
  try {
    const rawData = await prisma.kegiatan.groupBy({
      by: ['jenisKegiatan'],
      where: { tahun: 2026 },
      _sum: { targetJumlah: true, realisasiJumlah: true }
    });
    
    const result = rawData.map((d, i) => ({
      id: i + 1,
      nama: d.jenisKegiatan,
      target: d._sum.targetJumlah || 0,
      realisasi: d._sum.realisasiJumlah || 0,
      jenis: 'Program Kerja'
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Excel Upload Route (Opsen)
app.post('/api/upload/opsen', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Tidak ada file yang diunggah' });
    }
    
    // Parse the file generically
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    // Map dynamically array records to Prisma models
    const mappedData = data.map(row => ({
      kecamatan: row['Kecamatan']?.toString() || 'Tidak Diketahui',
      desaKelurahan: row['Desa/Kelurahan']?.toString() || '-',
      tahun: Number(row['Tahun']) || new Date().getFullYear(),
      bulan: row['Bulan']?.toString() || 'Januari',
      pkbPokok: Number(row['PKB Pokok']) || 0,
      opsenPkb: Number(row['Opsen PKB']) || 0,
      bbnkbPokok: Number(row['BBNKB Pokok']) || 0,
      opsenBbnkb: Number(row['Opsen BBNKB']) || 0,
      totalOpsen: Number(row['Total Realisasi Opsen']) || 0
    }));

    if (mappedData.length > 0) {
      await prisma.realisasiOpsen.createMany({ data: mappedData });
    }

    res.json({ 
      message: 'File Excel berhasil dibaca dan ditambahkan ke database.',  
      rowCount: data.length,
      preview: data.slice(0, 2)
    });
  } catch (error) {
    console.error('Upload excel error:', error);
    res.status(500).json({ message: 'Gagal memproses file Excel, pastikan format valid.' });
  }
});

// Manual Trigger for Notification Testing
app.get('/api/test-notification', async (req, res) => {
  try {
    await evaluateTargets();
    res.json({ message: 'Evaluasi paksa (Force Evaluation) telah dijalankan. Periksa log terminal backend untuk detail QR WA dan URL Email.' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan saat memicu evaluasi.' });
  }
});

// --- NOTIFICATION SETTING API ---

app.get('/api/settings/notification', async (req, res) => {
  try {
    const setting = await prisma.notificationSetting.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, frequency: 'weekly', dayOfWeek: 6, dateOfMonth: 1, time: '08:00', cronString: '0 8 * * 6' }
    });
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil pengaturan.' });
  }
});

app.put('/api/settings/notification', async (req, res) => {
  try {
    const { frequency, dayOfWeek, dateOfMonth, time } = req.body;
    
    // Parse time "HH:mm"
    const [hour, minute] = time.split(':');
    
    let cronString = '* * * * *'; // fallback
    if (frequency === 'daily') {
      cronString = `${parseInt(minute)} ${parseInt(hour)} * * *`;
    } else if (frequency === 'weekly') {
      cronString = `${parseInt(minute)} ${parseInt(hour)} * * ${parseInt(dayOfWeek)}`;
    } else if (frequency === 'monthly') {
      cronString = `${parseInt(minute)} ${parseInt(hour)} ${parseInt(dateOfMonth)} * *`;
    }

    const updatedSetting = await prisma.notificationSetting.upsert({
      where: { id: 1 },
      update: { frequency, dayOfWeek: parseInt(dayOfWeek), dateOfMonth: parseInt(dateOfMonth), time, cronString },
      create: { id: 1, frequency, dayOfWeek: parseInt(dayOfWeek), dateOfMonth: parseInt(dateOfMonth), time, cronString }
    });

    // Restart cron background job so it uses the new string immediately
    startCronJobs();

    res.json(updatedSetting);
  } catch (error) {
    res.status(500).json({ message: 'Gagal menyimpan pengaturan.' });
  }
});

// --- USER MANAGEMENT API ---

app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, role: true, noWa: true, email: true, receiveNotif: true, createdAt: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data pengguna.' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, password, role, noWa, email, receiveNotif } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username sudah digunakan.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: role || 'staff',
        noWa: noWa || null,
        email: email || null,
        receiveNotif: receiveNotif !== undefined ? receiveNotif : true
      },
      select: { id: true, username: true, role: true, noWa: true, email: true, receiveNotif: true }
    });
    res.json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Gagal membuat pengguna baru.' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, noWa, email, receiveNotif } = req.body;

    const dataToUpdate = {
      username,
      role,
      noWa: noWa || null,
      email: email || null
    };

    if (receiveNotif !== undefined) {
      dataToUpdate.receiveNotif = receiveNotif;
    }

    if (password && password.trim() !== '') {
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: dataToUpdate,
      select: { id: true, username: true, role: true, noWa: true, email: true, receiveNotif: true }
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui pengguna.' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentUserId } = req.query;

    if (currentUserId && parseInt(currentUserId) === parseInt(id)) {
      return res.status(400).json({ message: 'Tidak dapat menghapus akun Admin Anda sendiri.' });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Pengguna berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus pengguna.' });
  }
});

app.get('/api/test-wa', async (req, res) => {
  try {
    const number = req.query.number || '088991360201';
    const formattedNumber = number.replace(/^[0|+]/, '62') + '@c.us';
    await waClient.sendMessage(formattedNumber, '*SIMPONI TEST* - Jika pesan ini masuk, berarti koneksi WA berjalan lancar.');
    res.json({ success: true, message: `Pesan sukses terkirim ke ${formattedNumber}` });
  } catch (error) {
    res.json({ success: false, error: error.toString(), message: 'Gagal mengirim pesan WA' });
  }
});


// Initialize WA and Cron Background Services
console.log('[SYSTEM] Memulai inisialisasi WA Client...');
waClient.initialize();
startCronJobs();

app.listen(PORT, () => {
  console.log(`[SERVER] SIMPONI Backend API running on http://localhost:${PORT}`);
});
