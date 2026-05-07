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
  console.log('[WhatsApp] Silakan Scan QR Code ini melalui HP Anda untuk menghubungkan SIMPONI:');
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
    const formattedNumber = phoneNumber.replace(/^[0|+]/, '62') + '@c.us';
    await waClient.sendMessage(formattedNumber, message);
    console.log(`[WhatsApp] Pesan berhasil dikirim ke ${phoneNumber}`);
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
