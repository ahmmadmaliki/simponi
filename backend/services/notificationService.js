import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import nodemailer from 'nodemailer';

// --- WHATSAPP SETUP ---
const waClient = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

let isWaReady = false;

waClient.on('qr', (qr) => {
  console.log('================================================================');
  console.log('[WhatsApp] Silakan Scan QR Code ini melalui HP Anda untuk menghubungkan SIOPTIMA:');
  qrcode.generate(qr, { small: true });
  console.log('================================================================');
});

waClient.on('ready', () => {
  console.log('[WhatsApp] Klien WA berhasil terhubung dan siap mengirim Notifikasi!');
  isWaReady = true;
});

waClient.on('disconnected', () => {
  console.log('[WhatsApp] Klien terputus dari WA.');
  isWaReady = false;
});

const sendWhatsAppAlert = async (phoneNumber, message) => {
  if (!isWaReady) {
    console.error('[WhatsApp] Gagal mengirim pesan: Client WA belum ready/belum di-scan.');
    return;
  }
  try {
    let cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '62' + cleanNumber.substring(1);
    } else if (!cleanNumber.startsWith('62')) {
      cleanNumber = '62' + cleanNumber;
    }
    const formattedNumber = cleanNumber + '@c.us';

    const isRegistered = await waClient.isRegisteredUser(formattedNumber);
    if (!isRegistered) {
      console.log(`[WhatsApp] Peringatan: Nomor ${phoneNumber} TIDAK TERDAFTAR di WhatsApp!`);
      return;
    }

    // Trik "Simulasi Mengetik" untuk mengelabui Anti-Spam Meta
    try {
      const chat = await waClient.getChatById(formattedNumber);
      await chat.sendStateTyping(); // Munculkan status "Sedang mengetik..."
      
      // Jeda waktu acak antara 3 hingga 6 detik agar persis seperti manusia mengetik lambat
      const randomDelay = Math.floor(Math.random() * (6000 - 3000 + 1)) + 3000;
      await new Promise(resolve => setTimeout(resolve, randomDelay));
      
      await chat.clearState(); // Bersihkan status mengetik
    } catch (chatError) {
      // Jika chat belum pernah ada sama sekali dan gagal mendapatkan objek chat,
      // kita gunakan jeda standar saja
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    await waClient.sendMessage(formattedNumber, message);
    console.log(`[WhatsApp] Pesan berhasil dikirim ke ${phoneNumber} (dengan Simulasi Natural)`);
  } catch (error) {
    console.error('[WhatsApp] Gagal mengirim pesan:', error);
  }
};

// --- EMAIL SETUP (MOCK MENTARA KARENA ETHEREAL TIMEOUT) ---
const initEmailProvider = async () => {
  console.log('[Email] Sistem email (Mock/Simulasi) berhasil disiapkan.');
};

initEmailProvider();

const sendEmailAlert = async (emailAddress, subject, message) => {
  try {
    console.log(`\n================= EMAIL PREVIEW =================`);
    console.log(`To: ${emailAddress}`);
    console.log(`Subject: ${subject}`);
    console.log(`\n${message}`);
    console.log(`=================================================\n`);
    console.log(`[Email] Berhasil dikirim ke ${emailAddress} (Simulasi)`);
  } catch (error) {
    console.error('[Email] Gagal mengirim email:', error);
  }
};

export { waClient, sendWhatsAppAlert, sendEmailAlert };
