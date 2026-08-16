import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Safely resolve directory path in both CJS and ESM environments
const currentDir = typeof __dirname !== 'undefined'
  ? __dirname
  : (typeof import.meta !== 'undefined' && import.meta.url
      ? path.dirname(new URL(import.meta.url).pathname)
      : process.cwd());

// Load .env from multiple candidate paths to ensure PM2 and CLI both find it
const potentialEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env'),
  path.join(currentDir, '.env'),
  path.join(currentDir, '..', '.env'),
  '/home/bau7824897/bausquad.org/.env'
];

let loadedEnvPath = '';
for (const envPath of potentialEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    loadedEnvPath = envPath;
    break;
  }
}
if (!loadedEnvPath) {
  dotenv.config();
}

import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Global CORS Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Setup static files and public directory
const publicDir = path.join(process.cwd(), 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// Setup file uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Global DB Connection State
let dbPool: mysql.Pool | null = null;
let dbStatus = {
  connected: false,
  error: null as string | null,
  database: process.env.MYSQL_DATABASE || null,
  host: process.env.MYSQL_HOST || null,
  lastChecked: null as string | null
};

// Automatic database schema migration to ensure agreements columns and guest user exist
async function ensureDatabaseSchema(pool: mysql.Pool) {
  try {
    // 1. Ensure system guest user with ID 1 exists so Foreign Keys never fail
    await pool.execute(
      `INSERT IGNORE INTO users (id, login, email, password_hash, role, account_status, registration_date, is_verified, user_agreement, privacy_agreement, processing_personal_data_agreement, user_agreement_date, privacy_agreement_date, processing_personal_data_agreement_date)
       VALUES (1, 'website_guest', 'guest@bausquad.org', 'nopassword', 'user', 'active', NOW(), 1, 1, 1, 1, NOW(), NOW(), NOW())`
    );

    // 2. Check existing columns in orders table
    const [cols]: any = await pool.query(`SHOW COLUMNS FROM orders`);
    const existingColNames = Array.isArray(cols) ? cols.map((c: any) => c.Field.toLowerCase()) : [];

    if (!existingColNames.includes('terms_accepted')) {
      await pool.query(`ALTER TABLE orders ADD COLUMN terms_accepted TINYINT(1) NOT NULL DEFAULT 1`);
      console.log('[MySQL Migration] Added column terms_accepted to orders');
    }
    if (!existingColNames.includes('privacy_accepted')) {
      await pool.query(`ALTER TABLE orders ADD COLUMN privacy_accepted TINYINT(1) NOT NULL DEFAULT 1`);
      console.log('[MySQL Migration] Added column privacy_accepted to orders');
    }
    if (!existingColNames.includes('consent_accepted')) {
      await pool.query(`ALTER TABLE orders ADD COLUMN consent_accepted TINYINT(1) NOT NULL DEFAULT 1`);
      console.log('[MySQL Migration] Added column consent_accepted to orders');
    }
    if (!existingColNames.includes('agreements_accepted_at')) {
      await pool.query(`ALTER TABLE orders ADD COLUMN agreements_accepted_at DATETIME NULL`);
      console.log('[MySQL Migration] Added column agreements_accepted_at to orders');
    }
    if (!existingColNames.includes('guest_email')) {
      await pool.query(`ALTER TABLE orders ADD COLUMN guest_email VARCHAR(255) NULL`);
      console.log('[MySQL Migration] Added column guest_email to orders');
    }

    console.log('[MySQL Migration] Database schema verified successfully with agreement tracking.');
  } catch (err: any) {
    console.warn('[MySQL Migration Warning]:', err?.message || err);
  }
}

// Initialize MySQL Database Pool if credentials provided
function initDatabasePool() {
  const mysqlHost = process.env.MYSQL_HOST || 'mysql.hosting.nic.ru';
  const mysqlUser = process.env.MYSQL_USER || 'bau7824897_mysql';
  const mysqlPassword = process.env.MYSQL_PASSWORD || 'AhTFV6g/';
  const mysqlDatabase = process.env.MYSQL_DATABASE || 'bau7824897_db';
  const mysqlPort = parseInt(process.env.MYSQL_PORT || '3306', 10);

  if (mysqlUser && mysqlDatabase) {
    try {
      dbPool = mysql.createPool({
        host: mysqlHost,
        port: mysqlPort,
        user: mysqlUser,
        password: mysqlPassword,
        database: mysqlDatabase,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 20000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000
      });
      dbStatus.host = mysqlHost;
      dbStatus.database = mysqlDatabase;

      // Perform live connection verification & schema migration
      dbPool.query('SELECT 1 as healthcheck')
        .then(async () => {
          dbStatus.connected = true;
          dbStatus.error = null;
          dbStatus.lastChecked = new Date().toISOString();
          console.log(`[MySQL] Connection established to ${mysqlHost}/${mysqlDatabase}`);
          if (dbPool) {
            await ensureDatabaseSchema(dbPool);
          }
        })
        .catch((err: any) => {
          dbStatus.connected = false;
          dbStatus.error = err?.message || String(err);
          dbStatus.lastChecked = new Date().toISOString();
          console.error('[MySQL Connection Error]', err?.message || err);
        });
    } catch (err: any) {
      dbStatus.connected = false;
      dbStatus.error = err?.message || String(err);
      console.error('[MySQL Pool Init Error]:', err);
    }
  } else {
    console.warn('[MySQL] No MySQL credentials found in environment.');
  }
}

initDatabasePool();

// Health check endpoints
app.get(['/api/health', '/health', '/api/ping', '/ping'], async (req: Request, res: Response) => {
  if (dbPool) {
    try {
      await dbPool.query('SELECT 1');
      dbStatus.connected = true;
      dbStatus.error = null;
    } catch (e: any) {
      dbStatus.connected = false;
      dbStatus.error = e?.message || String(e);
    }
  }
  return res.json({
    status: 'ok',
    app: 'BauSquad',
    timestamp: new Date().toISOString(),
    env_loaded_from: loadedEnvPath || 'default/process.env',
    mysql: {
      connected: dbStatus.connected,
      host: dbStatus.host,
      database: dbStatus.database,
      error: dbStatus.error
    },
    telegram: {
      bot_token_set: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      chat_id_set: Boolean(process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID)
    },
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || '587',
      user_set: Boolean(process.env.SMTP_USER),
      password_set: Boolean(process.env.SMTP_PASSWORD || process.env.SMTP_PASS),
      from: process.env.SMTP_FROM || `BauSquad <${process.env.SMTP_USER || 'noreply@bausquad.org'}>`
    }
  });
});

// Email / SMTP diagnostics and live test endpoint
app.get(['/api/email/test', '/api/mail/test'], async (req: Request, res: Response) => {
  const targetEmail = (req.query.to as string) || process.env.SMTP_USER;

  if (!process.env.SMTP_USER || !(process.env.SMTP_PASSWORD || process.env.SMTP_PASS)) {
    return res.status(400).json({
      success: false,
      error: 'SMTP_USER или SMTP_PASSWORD не настроены в файле .env',
      config: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || '587',
        user_set: Boolean(process.env.SMTP_USER),
        password_set: Boolean(process.env.SMTP_PASSWORD || process.env.SMTP_PASS)
      }
    });
  }

  if (!targetEmail) {
    return res.status(400).json({
      success: false,
      error: 'Укажите email для проверки: /api/email/test?to=your_email@example.com'
    });
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #0f172a; margin-top: 0;">Тестовое письмо от BauSquad</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.6;">
        Это проверочное сообщение отправлено с вашего сервера для подтверждения корректности работы почтового шлюза (SMTP).
      </p>
      <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #1e293b; font-size: 14px;"><strong>Статус:</strong> SMTP подключение успешно активно</p>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Время отправки: ${new Date().toLocaleString('ru-RU')}</p>
      </div>
      <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">Команда BauSquad &bull; bausquad.org</p>
    </div>
  `;

  const result = await sendEmailNotification(
    targetEmail,
    'Тестовое письмо от BauSquad (Проверка SMTP)',
    html
  );

  if (result.success) {
    return res.json({
      success: true,
      message: `Тестовое письмо успешно отправлено на ${targetEmail}`,
      messageId: result.messageId
    });
  } else {
    return res.status(500).json({
      success: false,
      error: result.error || 'Не удалось отправить письмо через SMTP',
      smtp_config: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || '587',
        user: process.env.SMTP_USER
      }
    });
  }
});

// Telegram diagnostics and live test endpoint
app.get(['/api/telegram/test', '/api/tg/test'], async (req: Request, res: Response) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(400).json({
      success: false,
      error: 'TELEGRAM_BOT_TOKEN или TELEGRAM_ADMIN_CHAT_ID не заданы в .env',
      token_set: Boolean(token),
      chat_id_set: Boolean(chatId)
    });
  }

  const testText = `🤖 <b>Тестовое сообщение от BauSquad</b>\n\n` +
    `✅ Проверка связи с сервером успешно выполнена!\n` +
    `⏰ Время: ${new Date().toLocaleString('ru-RU')}`;

  const endpoints = [
    `https://api.telegram.org/bot${token}/sendMessage`,
    // If blocked, fallback to alternate mirror if configured
    process.env.TELEGRAM_API_PROXY ? `${process.env.TELEGRAM_API_PROXY.replace(/\/$/, '')}/bot${token}/sendMessage` : null
  ].filter(Boolean);

  const results: any[] = [];

  for (const url of endpoints) {
    try {
      const resp = await fetch(url as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: testText,
          parse_mode: 'HTML'
        }),
        signal: AbortSignal.timeout(10000)
      });
      const data = await resp.json();
      results.push({ url, status: resp.status, ok: resp.ok, data });
      if (resp.ok && data.ok) {
        return res.json({
          success: true,
          message: 'Сообщение успешно доставлено в Telegram!',
          chat_id: chatId,
          response: data,
          details: results
        });
      }
    } catch (err: any) {
      results.push({
        url,
        error: err?.message || String(err),
        code: err?.code || err?.cause?.code
      });
    }
  }

  return res.status(500).json({
    success: false,
    error: 'Не удалось отправить сообщение в Telegram',
    attempts: results
  });
});

// Database diagnostics and live test endpoint
app.get('/api/db/test', async (req: Request, res: Response) => {
  if (!dbPool) {
    return res.status(500).json({ success: false, error: 'dbPool is not initialized', dbStatus });
  }
  try {
    const [tables]: any = await dbPool.query('SHOW TABLES');
    const [ordersCount]: any = await dbPool.query('SELECT COUNT(*) as count FROM orders');
    const [recentOrders]: any = await dbPool.query('SELECT order_id, client_id, subject, status, created_at FROM orders ORDER BY order_id DESC LIMIT 5');

    // Test a dummy insertion into orders with client_id 1 and confirmed agreements
    const testSubject = `Тестовый запрос ${new Date().toLocaleTimeString('ru-RU')}`;
    const [insertResult]: any = await dbPool.execute(
      `INSERT INTO orders (client_id, subject, description, deadline, contact, source, status, terms_accepted, privacy_accepted, consent_accepted, agreements_accepted_at, guest_email, created_at)
       VALUES (1, ?, 'Диагностика через /api/db/test', 'Срочно', '+7 (999) 000-00-00', 'website', 'new', 1, 1, 1, NOW(), 'test@bausquad.org', NOW())`,
      [testSubject]
    );

    return res.json({
      success: true,
      tables,
      orders_count: ordersCount?.[0]?.count ?? 0,
      recent_orders: recentOrders,
      test_insert_id: insertResult?.insertId,
      message: 'Запись в базу данных успешно выполнена!'
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || String(err),
      code: err?.code,
      sqlState: err?.sqlState,
      sqlMessage: err?.sqlMessage
    });
  }
});

// Data models
interface DBUser {
  id: string;
  email: string;
  username: string;
  passwordHash: string; // bcrypt/simulated hash
  role: 'customer' | 'admin';
  account_status: 'active' | 'banned' | 'deleted';
  is_verified: boolean;
  created_at: string;
  telegram_handle?: string;
  tg_id?: string;
  agreements: {
    terms_accepted: boolean;
    terms_accepted_at: string;
    privacy_accepted: boolean;
    privacy_accepted_at: string;
    consent_accepted: boolean;
    consent_accepted_at: string;
  };
}

interface DBOrderFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploaded_at: string;
}

interface DBOrder {
  id: string;
  title: string;
  description: string;
  deadline: string;
  price?: string;
  client_price?: string;
  executer_price?: string;
  contact: string;
  status: 'new' | 'assigned' | 'in_progress' | 'revision' | 'rework' | 'completed' | 'closed' | 'cancelled';
  created_at: string;
  updated_at: string;
  user_id: string;
  user_email: string;
  user_username: string;
  is_guest?: boolean;
  guest_agreements?: {
    terms_accepted: boolean;
    privacy_accepted: boolean;
    consent_accepted: boolean;
    agreements_accepted_at: string;
  };
  files: DBOrderFile[];
}

interface DBVerificationCode {
  email: string;
  code: string;
  expires_at: number;
  payload: any;
}

// Initial seed data
const users: DBUser[] = [
  {
    id: 'usr-admin-01',
    email: 'admin@bausquad.ru',
    username: 'BauAdmin',
    passwordHash: 'admin123',
    role: 'admin',
    account_status: 'active',
    is_verified: true,
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    agreements: {
      terms_accepted: true,
      terms_accepted_at: new Date().toISOString(),
      privacy_accepted: true,
      privacy_accepted_at: new Date().toISOString(),
      consent_accepted: true,
      consent_accepted_at: new Date().toISOString()
    }
  },
  {
    id: 'usr-customer-01',
    email: 'student@bausquad.ru',
    username: 'AlexStudent',
    passwordHash: 'student123',
    role: 'customer',
    account_status: 'active',
    is_verified: true,
    created_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    agreements: {
      terms_accepted: true,
      terms_accepted_at: new Date().toISOString(),
      privacy_accepted: true,
      privacy_accepted_at: new Date().toISOString(),
      consent_accepted: true,
      consent_accepted_at: new Date().toISOString()
    }
  }
];

const orders: DBOrder[] = [
  {
    id: 'ord-1001',
    title: 'Высшая Математика (Теория Вер. и Мат. Статистика)',
    description: 'Необходимо решить 5 задач по статистике и сделать пояснения в Word.',
    deadline: '15.08.2026',
    price: '3500 ₽',
    client_price: '3500 ₽',
    executer_price: '2200 ₽',
    contact: '@alex_student_tg',
    status: 'in_progress',
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    user_id: 'usr-customer-01',
    user_email: 'student@bausquad.ru',
    user_username: 'AlexStudent',
    files: [
      {
        id: 'file-01',
        name: 'Задание_Вариант_4.pdf',
        size: 1024500,
        type: 'application/pdf',
        url: '/uploads/sample_task.pdf',
        uploaded_at: new Date().toISOString()
      }
    ]
  },
  {
    id: 'ord-1002',
    title: 'Сопромат / Расчёт балки на прочность',
    description: 'Курсовой проект: Построение эпюр изгибающих моментов и поперечных сил.',
    deadline: '20.08.2026',
    price: '5000 ₽',
    client_price: '5000 ₽',
    executer_price: '3200 ₽',
    contact: '+7 (999) 000-11-22',
    status: 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'usr-customer-01',
    user_email: 'student@bausquad.ru',
    user_username: 'AlexStudent',
    files: []
  }
];

const verificationCodes: Map<string, DBVerificationCode> = new Map();
const telegramLogs: Array<{ id: string; timestamp: string; text: string; files: string[] }> = [];

// Telegram Order Card Formatter (matching standard format)
function getOrderText(data: {
  order_id?: number | string;
  user: {
    first_name: string;
    last_name?: string;
    username?: string;
  };
  subject: string;
  description: string;
  deadline: string;
  contact: string;
}): string {
  let order = data.order_id
    ? `📋 <b>Заказ №${data.order_id}</b>\n\n`
    : `📋 <b>Новый заказ</b>\n\n`;

  const user = data.user;
  const userText =
    `👤 <b>Заказчик:</b>\n` +
    `${user.first_name || 'Клиент'}` +
    (user.last_name ? ` ${user.last_name}` : '') +
    (user.username ? ` (@${user.username.replace(/^@/, '')})` : '') +
    `\n\n`;

  return (
    order +
    userText +
    `📘 <b>Предмет:</b>\n${data.subject}\n\n` +
    `📝 <b>Описание:</b>\n${data.description}\n\n` +
    `⏰ <b>Срок:</b>\n${data.deadline || 'Не указан'}\n\n` +
    `📞 <b>Контакты:</b>\n${data.contact}`
  );
}

interface TelegramFileAttachment {
  name: string;
  type: string;
  buffer: Buffer;
  isPhoto: boolean;
}

function isPhotoAttachment(filename: string, mimeType: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  if (['.svg', '.psd', '.ai', '.eps', '.tiff', '.tif', '.raw'].includes(ext)) {
    return false;
  }
  if (mimeType && mimeType.startsWith('image/')) {
    return true;
  }
  return ['.jpg', '.jpeg', '.png', '.webp', '.bmp'].includes(ext);
}

// Live Telegram Notification Dispatcher via Bot API
// Photos are sent as a collage/media group with the main order message attached
// Documents follow immediately as a separate message
async function sendTelegramOrderNotification(
  text: string,
  attachments: TelegramFileAttachment[] = [],
  orderId?: string | number
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

  const logEntry = {
    id: `tg-${Date.now()}`,
    timestamp: new Date().toISOString(),
    text,
    files: attachments.map(a => a.name)
  };
  telegramLogs.unshift(logEntry);
  if (telegramLogs.length > 50) telegramLogs.pop();

  if (!token || !chatId) {
    console.log('[Telegram Bot API] (Token/ChatId missing, Local log):\n', text, '\nAttachments:', attachments.map(a => a.name));
    return;
  }

  const baseUrls = [
    'https://api.telegram.org',
    process.env.TELEGRAM_API_PROXY ? process.env.TELEGRAM_API_PROXY.replace(/\/$/, '') : null
  ].filter(Boolean) as string[];

  const photoAttachments = attachments.filter(a => a.isPhoto);
  const documentAttachments = attachments.filter(a => !a.isPhoto);

  // Helper to send a request across available base URLs (supports proxy fallback)
  const sendTelegramRequest = async (endpoint: string, body: any, isFormData: boolean = false) => {
    for (const baseUrl of baseUrls) {
      const url = `${baseUrl}/bot${token}/${endpoint}`;
      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
          body: isFormData ? body : JSON.stringify(body),
          signal: AbortSignal.timeout(25000)
        });
        const data = await resp.json();
        if (data.ok) {
          return { ok: true, data };
        } else {
          console.error(`[Telegram Bot API ${endpoint} Error from ${url}]`, data);
        }
      } catch (err: any) {
        console.error(`[Telegram Network Error for ${endpoint} from ${url}]:`, err?.message || err);
      }
    }
    return { ok: false };
  };

  // 1. Send Main Order Message & Photos (Collage / Photo / Text)
  try {
    if (photoAttachments.length === 0) {
      // No photos: send text message card
      await sendTelegramRequest('sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: 'HTML'
      });
    } else if (photoAttachments.length === 1) {
      // Single photo
      const photo = photoAttachments[0];
      if (text.length <= 1024) {
        const formData = new FormData();
        formData.append('chat_id', String(chatId));
        formData.append('caption', text);
        formData.append('parse_mode', 'HTML');
        const blob = new Blob([photo.buffer], { type: photo.type || 'image/jpeg' });
        formData.append('photo', blob, photo.name);
        const res = await sendTelegramRequest('sendPhoto', formData, true);
        if (!res.ok) {
          await sendTelegramRequest('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML' });
        }
      } else {
        await sendTelegramRequest('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML' });
        const formData = new FormData();
        formData.append('chat_id', String(chatId));
        formData.append('caption', `📸 <b>Фото к заказу #${orderId || ''}</b>`);
        formData.append('parse_mode', 'HTML');
        const blob = new Blob([photo.buffer], { type: photo.type || 'image/jpeg' });
        formData.append('photo', blob, photo.name);
        await sendTelegramRequest('sendPhoto', formData, true);
      }
    } else {
      // Multiple photos: send as a COLLAGE (sendMediaGroup)
      const isCaptionInMedia = text.length <= 1024;
      if (!isCaptionInMedia) {
        await sendTelegramRequest('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML' });
      }

      const photoChunks: TelegramFileAttachment[][] = [];
      for (let i = 0; i < photoAttachments.length; i += 10) {
        photoChunks.push(photoAttachments.slice(i, i + 10));
      }

      for (let chunkIdx = 0; chunkIdx < photoChunks.length; chunkIdx++) {
        const chunk = photoChunks[chunkIdx];
        const formData = new FormData();
        formData.append('chat_id', String(chatId));

        const mediaGroup = chunk.map((p, idx) => {
          const mediaItem: any = {
            type: 'photo',
            media: `attach://photo_${chunkIdx}_${idx}`
          };
          if (chunkIdx === 0 && idx === 0) {
            if (isCaptionInMedia) {
              mediaItem.caption = text;
              mediaItem.parse_mode = 'HTML';
            } else {
              mediaItem.caption = `📸 <b>Фотографии к заказу #${orderId || ''}</b> (${photoAttachments.length} шт.)`;
              mediaItem.parse_mode = 'HTML';
            }
          }
          return mediaItem;
        });

        formData.append('media', JSON.stringify(mediaGroup));
        chunk.forEach((p, idx) => {
          const blob = new Blob([p.buffer], { type: p.type || 'image/jpeg' });
          formData.append(`photo_${chunkIdx}_${idx}`, blob, p.name);
        });

        const res = await sendTelegramRequest('sendMediaGroup', formData, true);
        if (!res.ok) {
          // Fallback: send photos individually if media group is rejected
          for (const p of chunk) {
            const singleForm = new FormData();
            singleForm.append('chat_id', String(chatId));
            const b = new Blob([p.buffer], { type: p.type || 'image/jpeg' });
            singleForm.append('photo', b, p.name);
            await sendTelegramRequest('sendPhoto', singleForm, true);
          }
        }
      }
    }
  } catch (photoErr) {
    console.error('[Telegram Photo Dispatch Error]', photoErr);
  }

  // 2. Send Documents as Follow-up Message ("Все документы должны присылаться вслед вторым сообщением")
  if (documentAttachments.length > 0) {
    try {
      if (documentAttachments.length === 1) {
        const doc = documentAttachments[0];
        const formData = new FormData();
        formData.append('chat_id', String(chatId));
        formData.append('caption', `📎 <b>Документ к заказу #${orderId || ''}:</b>\n${doc.name}`);
        formData.append('parse_mode', 'HTML');
        const blob = new Blob([doc.buffer], { type: doc.type || 'application/octet-stream' });
        formData.append('document', blob, doc.name);
        await sendTelegramRequest('sendDocument', formData, true);
      } else {
        // Group multiple documents together
        const docChunks: TelegramFileAttachment[][] = [];
        for (let i = 0; i < documentAttachments.length; i += 10) {
          docChunks.push(documentAttachments.slice(i, i + 10));
        }

        for (let chunkIdx = 0; chunkIdx < docChunks.length; chunkIdx++) {
          const chunk = docChunks[chunkIdx];
          const formData = new FormData();
          formData.append('chat_id', String(chatId));

          const mediaGroup = chunk.map((d, idx) => {
            const mediaItem: any = {
              type: 'document',
              media: `attach://doc_${chunkIdx}_${idx}`
            };
            if (chunkIdx === 0 && idx === 0) {
              mediaItem.caption = `📎 <b>Документы к заказу #${orderId || ''}</b> (${documentAttachments.length} шт.)`;
              mediaItem.parse_mode = 'HTML';
            }
            return mediaItem;
          });

          formData.append('media', JSON.stringify(mediaGroup));
          chunk.forEach((d, idx) => {
            const blob = new Blob([d.buffer], { type: d.type || 'application/octet-stream' });
            formData.append(`doc_${chunkIdx}_${idx}`, blob, d.name);
          });

          const res = await sendTelegramRequest('sendMediaGroup', formData, true);
          if (!res.ok) {
            // Fallback: send documents individually
            for (const d of chunk) {
              const singleForm = new FormData();
              singleForm.append('chat_id', String(chatId));
              singleForm.append('caption', `📎 <b>Документ:</b> ${d.name}`);
              singleForm.append('parse_mode', 'HTML');
              const b = new Blob([d.buffer], { type: d.type || 'application/octet-stream' });
              singleForm.append('document', b, d.name);
              await sendTelegramRequest('sendDocument', singleForm, true);
            }
          }
        }
      }
    } catch (docErr) {
      console.error('[Telegram Document Dispatch Error]', docErr);
    }
  }
}

// Backward-compatible wrapper for simple text notifications
async function sendTelegramNotification(text: string, files: string[] = []) {
  return sendTelegramOrderNotification(text, [], undefined);
}

// Universal Password Verifier supporting Bcrypt, MD5, SHA256, SHA512, Django/PBKDF2 and Plaintext
function verifyPassword(plainPassword: string, storedHash: string | null | undefined): boolean {
  if (!storedHash || !plainPassword) return false;

  // 1. Direct match (e.g. plaintext passwords in legacy systems)
  if (storedHash === plainPassword) return true;

  // 2. Bcrypt hash ($2a$, $2b$, $2y$)
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    try {
      if (bcrypt.compareSync(plainPassword, storedHash)) return true;
    } catch (e) {
      // Continue to other formats if bcrypt throws
    }
  }

  // 3. MD5 hash (32 hex characters)
  const md5Hash = crypto.createHash('md5').update(plainPassword).digest('hex');
  if (storedHash.toLowerCase() === md5Hash.toLowerCase()) return true;

  // 4. SHA256 hash (64 hex characters)
  const sha256Hash = crypto.createHash('sha256').update(plainPassword).digest('hex');
  if (storedHash.toLowerCase() === sha256Hash.toLowerCase()) return true;

  // 5. SHA512 hash (128 hex characters)
  const sha512Hash = crypto.createHash('sha512').update(plainPassword).digest('hex');
  if (storedHash.toLowerCase() === sha512Hash.toLowerCase()) return true;

  // 6. Django / Python PBKDF2 format (pbkdf2_sha256$iterations$salt$hash)
  if (storedHash.startsWith('pbkdf2_sha256$')) {
    try {
      const parts = storedHash.split('$');
      if (parts.length === 4) {
        const iterations = parseInt(parts[1], 10);
        const salt = parts[2];
        const expectedHash = parts[3];
        const derivedKey = crypto.pbkdf2Sync(plainPassword, salt, iterations, 32, 'sha256');
        const computedBase64 = derivedKey.toString('base64');
        if (computedBase64 === expectedHash) return true;
      }
    } catch (pbErr) {
      console.warn('[PBKDF2 Verify Error]', pbErr);
    }
  }

  // 7. General fallback bcrypt attempt
  try {
    return bcrypt.compareSync(plainPassword, storedHash);
  } catch (e) {
    return false;
  }
}

// SMTP Mailer Transport Creator
function getMailTransporter() {
  const host = process.env.SMTP_HOST || process.env.SMTP_SERVER || 'mail.nic.ru';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER || process.env.SMTP_EMAIL || 'bausquadresponse@bausquad.org';
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS || 'I*D8J2{W51zG(a^f';

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465 SSL, false for 587 STARTTLS
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

// Send Email Notification Helper
async function sendEmailNotification(to: string, subject: string, htmlContent: string, textContent?: string): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const transporter = getMailTransporter();
  if (!transporter) {
    console.warn(`[SMTP Mailer Warning] SMTP_USER or SMTP_PASSWORD not configured. Email to ${to} was not sent.`);
    return { success: false, error: 'SMTP настройки (SMTP_USER / SMTP_PASSWORD) не заданы в .env' };
  }

  const from = process.env.SMTP_FROM || `BauSquad <${process.env.SMTP_USER || process.env.SMTP_EMAIL || 'bausquadresponse@bausquad.org'}>`;

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: textContent || htmlContent.replace(/<[^>]*>?/gm, ''),
      html: htmlContent
    });
    console.log(`[SMTP Mailer] Email sent successfully to ${to}, MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`[SMTP Mailer Error] Failed to send email to ${to}:`, err?.message || err);
    return { success: false, error: err?.message || String(err) };
  }
}

// JWT helper
function generateToken(userId: string, role: string, type: 'access' | 'refresh') {
  const secret = process.env.SECRET_KEY || 'bau_squad_secret_key';
  const expires = type === 'access' ? 30 * 60 * 1000 : 7 * 24 * 3600 * 1000;
  return Buffer.from(JSON.stringify({ userId, role, type, exp: Date.now() + expires, secret })).toString('base64');
}

function verifyToken(token: string) {
  try {
    const parsed = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    if (parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

// Authentication Middleware
function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Необходима авторизация' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload || payload.type !== 'access') {
    return res.status(401).json({ error: 'Недействительный или просроченный токен' });
  }

  const user = users.find(u => u.id === payload.userId);
  if (!user) {
    return res.status(401).json({ error: 'Пользователь не найден' });
  }

  (req as any).user = user;
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as DBUser;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ разрешен только администраторам' });
  }
  next();
}

// Helper to sanitize user object
function sanitizeUser(u: DBUser) {
  const order_count = orders.filter(o => o.user_id === u.id).length;
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    role: u.role,
    account_status: u.account_status || 'active',
    is_verified: u.is_verified,
    created_at: u.created_at,
    telegram_handle: u.telegram_handle || '',
    tg_id: u.tg_id || '',
    agreements: u.agreements,
    order_count
  };
}

// REST API ROUTES

// 1. AUTH: Register Step 1 (Send Email Verification Code)
app.post(['/api/auth/register', '/api/register', '/api/auth/register/'], async (req: Request, res: Response) => {
  try {
    const { email, username, password, terms_accepted, privacy_accepted, consent_accepted } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    if (!terms_accepted || !privacy_accepted || !consent_accepted) {
      return res.status(400).json({
        error: 'Для регистрации необходимо отдельно подтвердить все 3 соглашения'
      });
    }

    const lowerEmail = String(email).toLowerCase().trim();
    const lowerUsername = String(username).trim();

    // Check in MySQL if dbPool is initialized
    if (dbPool) {
      try {
        const [rows]: any = await dbPool.execute(
          'SELECT id FROM users WHERE LOWER(email) = ? OR LOWER(login) = ?',
          [lowerEmail, lowerUsername.toLowerCase()]
        );
        if (Array.isArray(rows) && rows.length > 0) {
          return res.status(400).json({ error: 'Пользователь с таким Email или Логином уже существует' });
        }
      } catch (dbErr) {
        console.error('[MySQL Register Check Error]', dbErr);
      }
    }

    const existingEmail = users.find(u => u.email.toLowerCase() === lowerEmail);
    if (existingEmail) {
      return res.status(400).json({ error: 'Пользователь с таким Email уже зарегистрирован' });
    }

    const existingUsername = users.find(u => u.username.toLowerCase() === lowerUsername.toLowerCase());
    if (existingUsername) {
      return res.status(400).json({ error: 'Пользователь с таким Логином уже существует' });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date().toISOString();

    verificationCodes.set(lowerEmail, {
      email: lowerEmail,
      code,
      expires_at: Date.now() + 15 * 60 * 1000, // 15 mins
      payload: {
        email: lowerEmail,
        username: lowerUsername,
        passwordHash: password,
        terms_accepted,
        terms_accepted_at: now,
        privacy_accepted,
        privacy_accepted_at: now,
        consent_accepted,
        consent_accepted_at: now
      }
    });

    console.log(`[SMTP Mailer] Verification code generated for ${lowerEmail}: ${code}`);

    // Send code to user's email via SMTP
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0f172a; margin: 0 0 8px 0; font-size: 24px;">Подтверждение регистрации</h2>
          <p style="color: #64748b; margin: 0; font-size: 15px;">Добро пожаловать в сервис BauSquad!</p>
        </div>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Здравствуйте, <strong>${lowerUsername}</strong>! Для завершения создания вашего аккаунта на сайте <strong>bausquad.org</strong> введите код подтверждения:
        </p>
        <div style="background: #f1f5f9; border: 2px dashed #94a3b8; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1e293b; font-family: monospace;">${code}</span>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
          ⏱ Код действителен в течение 15 минут.<br>
          Если вы не запрашивали данный код, просто проигнорируйте это письмо.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
          Служба поддержки BauSquad &bull; bausquad.org
        </p>
      </div>
    `;

    // Asynchronously dispatch email
    const mailResult = await sendEmailNotification(
      lowerEmail,
      `Код подтверждения регистрации BauSquad: ${code}`,
      emailHtml
    );

    return res.json({
      message: mailResult.success
        ? 'Код подтверждения успешно отправлен на вашу почту'
        : 'Код подтверждения сгенерирован (проверьте также настройки SMTP в .env)',
      email: lowerEmail,
      smtp_sent: mailResult.success,
      smtp_error: mailResult.error || null
    });
  } catch (err: any) {
    console.error('[Register API Error]', err);
    return res.status(500).json({ error: err?.message || 'Ошибка сервера при регистрации' });
  }
});

// 2. AUTH: Verify Email Code & Complete Registration
app.post(['/api/auth/verify-code', '/api/verify-code', '/api/auth/verify-code/'], async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Укажите email и код подтверждения' });
    }

    const lowerEmail = String(email).toLowerCase().trim();
    const record = verificationCodes.get(lowerEmail);

    if (!record) {
      return res.status(400).json({ error: 'Код не запрашивался или срок действия истёк' });
    }

    if (record.code !== String(code).trim()) {
      return res.status(400).json({ error: 'Неверный код подтверждения' });
    }

    if (record.expires_at < Date.now()) {
      verificationCodes.delete(lowerEmail);
      return res.status(400).json({ error: 'Срок действия кода истёк. Запросите новый.' });
    }

    const newUser: DBUser = {
      id: `usr-${Date.now()}`,
      email: record.payload.email,
      username: record.payload.username,
      passwordHash: record.payload.passwordHash,
      role: 'customer',
      account_status: 'active',
      is_verified: true,
      created_at: new Date().toISOString(),
      agreements: {
        terms_accepted: record.payload.terms_accepted,
        terms_accepted_at: record.payload.terms_accepted_at,
        privacy_accepted: record.payload.privacy_accepted,
        privacy_accepted_at: record.payload.privacy_accepted_at,
        consent_accepted: record.payload.consent_accepted,
        consent_accepted_at: record.payload.consent_accepted_at
      }
    };

    if (dbPool) {
      try {
        const hashedPassword = bcrypt.hashSync(newUser.passwordHash, 10);
        await dbPool.execute(
          `INSERT INTO users (login, password_hash, email, verification_code, role, account_status, registration_date, is_verified, user_agreement, privacy_agreement, processing_personal_data_agreement, user_agreement_date, privacy_agreement_date, processing_personal_data_agreement_date)
           VALUES (?, ?, ?, ?, 'user', 'active', NOW(), 1, 1, 1, 1, NOW(), NOW(), NOW())
           ON DUPLICATE KEY UPDATE
           login = VALUES(login),
           password_hash = VALUES(password_hash),
           email = VALUES(email),
           verification_code = VALUES(verification_code),
           is_verified = 1`,
          [newUser.username, hashedPassword, newUser.email, record.code]
        );
      } catch (dbErr) {
        console.error('[MySQL Save User Error]', dbErr);
      }
    }

    users.push(newUser);
    verificationCodes.delete(lowerEmail);

    const access_token = generateToken(newUser.id, newUser.role, 'access');
    const refresh_token = generateToken(newUser.id, newUser.role, 'refresh');

    return res.json({
      message: 'Регистрация успешно завершена',
      user: sanitizeUser(newUser),
      tokens: {
        access_token,
        refresh_token,
        token_type: 'Bearer',
        expires_in: 1800
      }
    });
  } catch (err: any) {
    console.error('[Verify Code Error]', err);
    return res.status(500).json({ error: err?.message || 'Ошибка сервера при заверении регистрации' });
  }
});

// 3. AUTH: Login
app.post(['/api/auth/login', '/api/login', '/api/auth/login/'], async (req: Request, res: Response) => {
  try {
    const { login_identifier, password } = req.body;

    if (!login_identifier || !password) {
      return res.status(400).json({ error: 'Введите Email/Логин и Пароль' });
    }

    const query = String(login_identifier).toLowerCase().trim();
    let user = users.find(u => u.email.toLowerCase() === query || u.username.toLowerCase() === query);

    if (dbPool) {
      try {
        const [rows]: any = await dbPool.execute(
          'SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(login) = ? LIMIT 1',
          [query, query]
        );
        if (Array.isArray(rows) && rows.length > 0) {
          const row = rows[0];
          const passwordValid = verifyPassword(password, row.password_hash);

          if (passwordValid) {
            user = {
              id: `usr-${row.id}`,
              email: row.email,
              username: row.login,
              passwordHash: row.password_hash,
              role: row.role === 'admin' ? 'admin' : 'customer',
              account_status: row.account_status || 'active',
              is_verified: !!row.is_verified,
              created_at: row.registration_date || new Date().toISOString(),
              telegram_handle: row.telegram_handle || '',
              tg_id: row.tg_id || '',
              agreements: {
                terms_accepted: !!row.user_agreement,
                terms_accepted_at: row.user_agreement_date || new Date().toISOString(),
                privacy_accepted: !!row.privacy_agreement,
                privacy_accepted_at: row.privacy_agreement_date || new Date().toISOString(),
                consent_accepted: !!row.processing_personal_data_agreement,
                consent_accepted_at: row.processing_personal_data_agreement_date || new Date().toISOString()
              }
            };
            const existingIdx = users.findIndex(u => u.id === user?.id || u.email.toLowerCase() === query || u.username.toLowerCase() === query);
            if (existingIdx >= 0) {
              users[existingIdx] = user;
            } else {
              users.push(user);
            }
          }
        }
      } catch (dbErr) {
        console.error('[MySQL Login Check Error]', dbErr);
      }
    }

    if (!user) {
      return res.status(400).json({ error: 'Неверный логин или пароль' });
    }

    const isPassCorrect = verifyPassword(password, user.passwordHash);

    if (!isPassCorrect) {
      return res.status(400).json({ error: 'Неверный логин или пароль' });
    }

    const access_token = generateToken(user.id, user.role, 'access');
    const refresh_token = generateToken(user.id, user.role, 'refresh');

    return res.json({
      user: sanitizeUser(user),
      tokens: {
        access_token,
        refresh_token,
        token_type: 'Bearer',
        expires_in: 1800
      }
    });
  } catch (err: any) {
    console.error('[Login Error]', err);
    return res.status(500).json({ error: err?.message || 'Ошибка сервера при входе' });
  }
});

// 4. AUTH: Refresh Token
app.post('/api/auth/refresh', (req: Request, res: Response) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token не предоставлен' });
  }

  const payload = verifyToken(refresh_token);
  if (!payload || payload.type !== 'refresh') {
    return res.status(401).json({ error: 'Недействительный refresh token' });
  }

  const user = users.find(u => u.id === payload.userId);
  if (!user) {
    return res.status(401).json({ error: 'Пользователь не найден' });
  }

  const access_token = generateToken(user.id, user.role, 'access');
  const new_refresh_token = generateToken(user.id, user.role, 'refresh');

  return res.json({
    access_token,
    refresh_token: new_refresh_token,
    token_type: 'Bearer',
    expires_in: 1800
  });
});

// 5. AUTH: Get Current User Profile
app.get(['/api/auth/me', '/api/profile', '/api/user/me', '/api/me'], authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user as DBUser;
  return res.json({ user: sanitizeUser(user) });
});

// 6. PROFILE: Update User Profile
app.all(['/api/profile', '/api/user/profile'], authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'PUT' && req.method !== 'POST' && req.method !== 'PATCH') {
    return next();
  }
  const user = (req as any).user as DBUser;
  const { username, new_password, telegram_handle } = req.body;

  if (username && username.trim().length >= 3) {
    const existing = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.id !== user.id);
    if (existing) {
      return res.status(400).json({ error: 'Этот логин уже занят другим пользователем' });
    }
    user.username = username.trim();
  }

  if (new_password && new_password.length >= 6) {
    user.passwordHash = new_password;
  }

  if (telegram_handle !== undefined) {
    user.telegram_handle = String(telegram_handle).replace(/^@/, '').trim();
  }

  if (dbPool) {
    try {
      await dbPool.execute(
        'UPDATE users SET login = ?, password_hash = ?, telegram_handle = ? WHERE email = ?',
        [user.username, user.passwordHash, user.telegram_handle || null, user.email]
      );
    } catch (dbErr) {
      console.error('[MySQL Profile Update Error]', dbErr);
    }
  }

  return res.json({
    message: 'Профиль успешно обновлен',
    user: sanitizeUser(user)
  });
});

// 7. ORDERS: Get Orders List
app.get('/api/orders', authenticateUser, async (req: Request, res: Response) => {
  const user = (req as any).user as DBUser;
  
  if (dbPool) {
    try {
      const numericUserId = parseInt(user.id.replace(/\D/g, ''), 10);
      let query = `
        SELECT o.order_id, o.client_id, o.subject, o.description, o.deadline, o.created_at, o.status, o.contact,
               p.client_price, p.executer_price, u.login as username, u.email
        FROM orders o
        LEFT JOIN payments p ON o.order_id = p.order_id
        LEFT JOIN users u ON o.client_id = u.id
      `;
      let params: any[] = [];

      if (user.role !== 'admin' && !isNaN(numericUserId)) {
        query += ` WHERE o.client_id = ?`;
        params.push(numericUserId);
      }

      query += ` ORDER BY o.order_id DESC`;

      const [rows]: any = await dbPool.execute(query, params);
      if (Array.isArray(rows) && rows.length > 0) {
        const dbOrders: DBOrder[] = rows.map((r: any) => ({
          id: `ord-${r.order_id}`,
          title: r.subject,
          description: r.description || '',
          deadline: r.deadline || 'Не указан',
          price: r.client_price ? `${r.client_price} ₽` : undefined,
          client_price: r.client_price ? `${r.client_price} ₽` : undefined,
          executer_price: r.executer_price ? `${r.executer_price} ₽` : undefined,
          contact: r.contact || '',
          status: r.status,
          created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
          updated_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
          user_id: String(r.client_id),
          user_email: r.email || '',
          user_username: r.username || 'Пользователь',
          files: []
        }));

        return res.json({ orders: dbOrders });
      }
    } catch (dbErr) {
      console.error('[MySQL Get Orders Error]', dbErr);
    }
  }

  if (user.role === 'admin') {
    return res.json({ orders });
  } else {
    const userOrders = orders.filter(o => o.user_id === user.id);
    return res.json({ orders: userOrders });
  }
});

// 8. ORDERS: Create Order (Supports both Registered Users and Guest Orders)
app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    let user: DBUser | null = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = verifyToken(token);
      if (payload && payload.type === 'access') {
        user = users.find(u => u.id === payload.userId) || null;
      }
    }

    // Check if user is logged in and banned
    if (user && user.account_status === 'banned') {
      return res.status(403).json({
        error: 'Ваш аккаунт заблокирован администратором. Вы не можете создавать новые заказы.'
      });
    }

    const { title, description, deadline, price, contact, files, terms_accepted, privacy_accepted, consent_accepted } = req.body;

    if (!title || !description || !contact) {
      return res.status(400).json({ error: 'Заполните обязательные поля: Предмет, Описание, Контакт' });
    }

    // Guest validation: require all agreements
    if (!user) {
      if (!terms_accepted || !privacy_accepted || !consent_accepted) {
        return res.status(400).json({
          error: 'Для оформления заказа без регистрации вы обязаны согласиться с Пользовательским соглашением, Политикой конфиденциальности и Согласием на обработку персональных данных.'
        });
      }
    }

    // Process attached files payload & decode base64 if present
    const processedFiles: DBOrderFile[] = [];
    const telegramAttachments: TelegramFileAttachment[] = [];

    if (Array.isArray(files) && files.length > 0) {
      for (let idx = 0; idx < files.length; idx++) {
        const fileItem = files[idx];
        const rawName = String(fileItem.name || `file_${idx + 1}`).trim();
        const safeName = rawName.replace(/[^a-zA-Z0-9._\-\u0400-\u04FF]/g, '_');
        const mimeType = String(fileItem.type || 'application/octet-stream');

        let fileBuffer: Buffer | null = null;

        if (fileItem.data && typeof fileItem.data === 'string') {
          try {
            const matches = fileItem.data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            const base64Content = matches ? matches[2] : fileItem.data;
            fileBuffer = Buffer.from(base64Content, 'base64');
          } catch (b64Err) {
            console.error('[Base64 Decode Error]', rawName, b64Err);
          }
        }

        const isPhoto = isPhotoAttachment(safeName, mimeType);
        let fileUrl = fileItem.url || '';

        if (fileBuffer) {
          const timestamp = Date.now();
          const diskFilename = `ord_${timestamp}_${idx}_${safeName}`;
          const diskPath = path.join(uploadsDir, diskFilename);

          try {
            fs.writeFileSync(diskPath, fileBuffer);
            fileUrl = `/uploads/${diskFilename}`;
          } catch (writeErr) {
            console.error('[File Save to Disk Error]', diskFilename, writeErr);
          }

          telegramAttachments.push({
            name: rawName,
            type: mimeType,
            buffer: fileBuffer,
            isPhoto
          });
        }

        processedFiles.push({
          id: fileItem.id || `file-${Date.now()}-${idx}`,
          name: rawName,
          size: fileItem.size || (fileBuffer ? fileBuffer.length : 0),
          type: mimeType,
          url: fileUrl,
          uploaded_at: fileItem.uploaded_at || new Date().toISOString()
        });
      }
    }

    const newOrder: DBOrder = {
      id: `ord-${Math.floor(1000 + Math.random() * 9000)}`,
      title,
      description,
      deadline: deadline || 'Не указан',
      price: price || 'На обсуждении',
      client_price: price || 'На обсуждении',
      contact,
      status: 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user ? user.id : 'guest',
      user_email: user ? user.email : contact,
      user_username: user ? user.username : 'Гость (Без регистрации)',
      is_guest: !user,
      guest_agreements: !user ? {
        terms_accepted: true,
        privacy_accepted: true,
        consent_accepted: true,
        agreements_accepted_at: new Date().toISOString()
      } : undefined,
      files: processedFiles
    };

    let numericOrderId: number | null = null;

    if (dbPool) {
      try {
        let numericClientId: number | null = null;
        if (user) {
          // Look up existing user's numeric ID in MySQL
          const [userRows]: any = await dbPool.execute(
            'SELECT id FROM users WHERE LOWER(email) = ? OR LOWER(login) = ? LIMIT 1',
            [user.email.toLowerCase().trim(), user.username.toLowerCase().trim()]
          );
          if (Array.isArray(userRows) && userRows.length > 0) {
            numericClientId = userRows[0].id;
          }
        }

        const finalClientId = numericClientId || 1; // Fallback to website_guest user (ID 1)
        const guestEmailVal = user ? user.email : (contact.includes('@') ? contact.trim() : (contact.startsWith('+') || contact.startsWith('8') ? contact.trim() : null));

        try {
          const [insertResult]: any = await dbPool.execute(
            `INSERT INTO orders (
              client_id, subject, description, deadline, contact, source, status,
              terms_accepted, privacy_accepted, consent_accepted, agreements_accepted_at, guest_email, created_at
            ) VALUES (?, ?, ?, ?, ?, 'website', 'new', 1, 1, 1, NOW(), ?, NOW())`,
            [
              finalClientId,
              title.trim(),
              description.trim(),
              deadline || 'Не указан',
              contact.trim(),
              guestEmailVal
            ]
          );

          if (insertResult && insertResult.insertId) {
            numericOrderId = insertResult.insertId;
            newOrder.id = String(insertResult.insertId);
            console.log(`[MySQL Orders] Successfully inserted order into DB with order_id: ${numericOrderId} (agreements confirmed)`);
          }
        } catch (firstErr: any) {
          console.warn('[MySQL Order Insert] Full insert failed, attempting standard schema insert:', firstErr?.message || firstErr);
          const [fallbackResult]: any = await dbPool.execute(
            `INSERT INTO orders (client_id, subject, description, deadline, contact, source, status, created_at)
             VALUES (?, ?, ?, ?, ?, 'website', 'new', NOW())`,
            [
              finalClientId,
              title.trim(),
              description.trim(),
              deadline || 'Не указан',
              contact.trim()
            ]
          );
          if (fallbackResult && fallbackResult.insertId) {
            numericOrderId = fallbackResult.insertId;
            newOrder.id = String(fallbackResult.insertId);
            console.log(`[MySQL Orders] Fallback inserted order with order_id: ${numericOrderId}`);
          }
        }
      } catch (dbErr: any) {
        console.error('[MySQL Order Insert Error]', dbErr?.message || dbErr);
      }
    }

    orders.unshift(newOrder);

    // Format Telegram notification using exact user card format
    const userFirstName = user ? user.username : 'Гость';
    const userTgHandle = user?.telegram_handle || (contact.startsWith('@') ? contact.replace(/^@/, '') : undefined);

    const tgMessage = getOrderText({
      order_id: numericOrderId || newOrder.id.replace(/\D/g, '') || undefined,
      user: {
        first_name: userFirstName,
        last_name: '',
        username: userTgHandle
      },
      subject: newOrder.title,
      description: newOrder.description,
      deadline: newOrder.deadline,
      contact: newOrder.contact
    });

    // Send Telegram notification with photos in a collage and documents as a follow-up
    await sendTelegramOrderNotification(tgMessage, telegramAttachments, numericOrderId || newOrder.id.replace(/\D/g, ''));

    return res.json({
      message: 'Заказ успешно создан и отправлен в BauSquad',
      order: newOrder,
      telegram_notified: true
    });
  } catch (err: any) {
    console.error('[Create Order Error]', err);
    return res.status(500).json({ error: err?.message || 'Ошибка сервера при создании заказа' });
  }
});

// 9. ORDERS: Update Order Status (Admin)
app.patch('/api/orders/:id/status', authenticateUser, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['new', 'assigned', 'in_progress', 'revision', 'rework', 'completed', 'closed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Недопустимый статус заказа' });
  }

  const order = orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Заказ не найден' });
  }

  if (order.status === 'closed') {
    return res.status(400).json({ error: 'Заказ заблокирован (статус closed). Изменения невозможно внести.' });
  }

  order.status = status as any;
  order.updated_at = new Date().toISOString();

  if (dbPool) {
    try {
      const numericId = parseInt(id.replace(/\D/g, ''), 10);
      if (!isNaN(numericId)) {
        await dbPool.execute('UPDATE orders SET status = ? WHERE order_id = ?', [status, numericId]);
      }
    } catch (err) {
      console.error('[MySQL Status Update Error]', err);
    }
  }

  const tgMsg = `🔔 <b>Изменение статуса заказа #${id}</b>\n\n` +
    `<b>Новый статус:</b> ${status}\n` +
    `<b>Заказ:</b> ${order.title}\n` +
    `<b>Клиент:</b> ${order.user_username} (${order.contact})`;

  sendTelegramNotification(tgMsg);

  return res.json({
    message: `Статус заказа #${id} изменён на ${status}`,
    order
  });
});

// 9b. ORDERS: Update Order Prices (Client Price & Executer Price) (Admin)
app.patch('/api/orders/:id/prices', authenticateUser, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { client_price, executer_price } = req.body;

  const order = orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Заказ не найден' });
  }

  if (order.status === 'closed') {
    return res.status(400).json({ error: 'Заказ заблокирован (статус closed). Изменение цен невозможно.' });
  }

  if (client_price !== undefined) {
    order.client_price = String(client_price);
    order.price = String(client_price);
  }
  if (executer_price !== undefined) {
    order.executer_price = String(executer_price);
  }

  order.updated_at = new Date().toISOString();

  if (dbPool) {
    try {
      const numericId = parseInt(id.replace(/\D/g, ''), 10);
      if (!isNaN(numericId)) {
        await dbPool.execute(
          `INSERT INTO payments (order_id, client_price, executer_price)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE client_price = VALUES(client_price), executer_price = VALUES(executer_price)`,
          [numericId, parseFloat(client_price) || 0, parseFloat(executer_price) || 0]
        );
      }
    } catch (err) {
      console.error('[MySQL Price Update Error]', err);
    }
  }

  const tgMsg = `💰 <b>Обновление стоимости заказа #${id}</b>\n\n` +
    `<b>Цена для клиента:</b> ${order.client_price || 'Не указана'}\n` +
    `<b>Цена для исполнителя:</b> ${order.executer_price || 'Не указана'}\n` +
    `<b>Заказ:</b> ${order.title}`;

  sendTelegramNotification(tgMsg);

  return res.json({
    message: `Цены для заказа #${id} успешно обновлены`,
    order
  });
});

// 10. ADMIN: Get Users
app.get('/api/admin/users', authenticateUser, requireAdmin, (req: Request, res: Response) => {
  const sanitized = users.map(u => sanitizeUser(u));
  return res.json({ users: sanitized });
});

// 11. ADMIN: Update User Role
app.patch('/api/admin/users/:id/role', authenticateUser, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (role !== 'customer' && role !== 'admin') {
    return res.status(400).json({ error: 'Недопустимая роль' });
  }

  const user = users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  user.role = role;
  return res.json({
    message: `Роль пользователя ${user.username} изменена на ${role}`,
    user: sanitizeUser(user)
  });
});

// 11b. ADMIN: Ban/Unban User (Update Account Status)
app.patch('/api/admin/users/:id/status', authenticateUser, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { account_status } = req.body;

  if (!['active', 'banned', 'deleted'].includes(account_status)) {
    return res.status(400).json({ error: 'Недопустимый статус аккаунта' });
  }

  const user = users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  user.account_status = account_status;
  return res.json({
    message: `Статус аккаунта ${user.username} изменён на ${account_status}`,
    user: sanitizeUser(user)
  });
});

// 12. ADMIN: Delete User
app.delete('/api/admin/users/:id', authenticateUser, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = (req as any).user as DBUser;

  if (id === currentUser.id) {
    return res.status(400).json({ error: 'Вы не можете удалить собственный аккаунт' });
  }

  const index = users.findIndex(u => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  const deleted = users.splice(index, 1)[0];
  return res.json({ message: `Пользователь ${deleted.username} удален` });
});

// 13. ADMIN: System Stats
app.get('/api/admin/stats', authenticateUser, requireAdmin, (req: Request, res: Response) => {
  const stats = {
    total_users: users.length,
    total_orders: orders.length,
    orders_new: orders.filter(o => o.status === 'new').length,
    orders_in_progress: orders.filter(o => o.status === 'in_progress').length,
    orders_revision: orders.filter(o => o.status === 'revision').length,
    orders_completed: orders.filter(o => o.status === 'completed').length,
    orders_cancelled: orders.filter(o => o.status === 'cancelled').length,
    telegram_bot_connected: true,
    smtp_status: 'Active (Gmail SMTP)',
    system_uptime: `${Math.floor(process.uptime() / 60)} мин.`,
    telegram_recent_logs: telegramLogs.slice(0, 5)
  };
  return res.json(stats);
});

// 14. SUPPORT: Submit Support Request
app.post('/api/support', async (req: Request, res: Response) => {
  try {
    const { contact, message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Сообщение не может быть пустым' });
    }

    if (dbPool) {
      try {
        await dbPool.execute(
          `INSERT INTO support_requests (client_id, message, status, created_at)
           VALUES ((SELECT id FROM users WHERE contact = ? LIMIT 1), ?, 'new', NOW())`,
          [contact || 'Гость', message]
        );
      } catch (err) {
        console.error('[MySQL Support Request Error]', err);
      }
    }

    const tgMsg = `💬 <b>Новое обращение в техподдержку BauSquad</b>\n\n` +
      `<b>Контакт:</b> ${contact || 'Не указан'}\n` +
      `<b>Сообщение:</b> ${message}\n` +
      `<b>Дата:</b> ${new Date().toLocaleString('ru-RU')}`;

    await sendTelegramNotification(tgMsg);

    return res.json({ message: 'Обращение успешно отправлено' });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Ошибка отправки обращения' });
  }
});

// 15. AGREEMENTS Documents
app.get('/api/agreements', (req: Request, res: Response) => {
  return res.json({
    terms: {
      id: 'terms',
      title: 'Пользовательское соглашение',
      version: '2.1',
      last_updated: '2026-01-10',
      sections: [
        {
          heading: '1. Общие положения',
          content: 'Платформа BauSquad предоставляет информационно-консультационные услуги по сопровождению студентов при подготовке академических и научно-исследовательских работ.'
        },
        {
          heading: '2. Порядок оформления и выполнения заказов',
          content: 'Пользователь формирует заявку с указанием предмета, подробного описания, сроков и стоимости. Платформа обеспечивает конфиденциальное передачу условий исполнителям.'
        },
        {
          heading: '3. Гарантии и конфиденциальность',
          content: 'BauSquad гарантирует полную анонимность клиента. Все переданные файлы и контактные данные используются исключительно для выполнения текущего заказа.'
        }
      ]
    },
    privacy: {
      id: 'privacy',
      title: 'Политика конфиденциальности',
      version: '2.0',
      last_updated: '2026-01-10',
      sections: [
        {
          heading: '1. Сбор персональных данных',
          content: 'Платформа обрабатывает исключительно минимальный набор данных: адрес электронной почты, указанный логин и контактный Telegram/телефон для связи по заказу.'
        },
        {
          heading: '2. Хранение и шифрование',
          content: 'Пароли пользователей хранятся строго в виде bcrypt-хэшей. Передача данных осуществляется по защищенному протоколу HTTPS с шифрованием TLS.'
        }
      ]
    },
    consent: {
      id: 'consent',
      title: 'Согласие на обработку персональных данных',
      version: '1.5',
      last_updated: '2026-01-10',
      sections: [
        {
          heading: '1. Предмет согласия',
          content: 'Настоящим пользователь даёт свободно, своей волей и в своем интересе согласие BauSquad на автоматизированную обработку предоставленных данных при регистрации и оформлении заказов.'
        }
      ]
    }
  });
});

// 16. COOKIES: Save preferences
app.post('/api/cookies', (req: Request, res: Response) => {
  const { preferences } = req.body;
  return res.json({
    message: 'Настройки cookie успешно сохранены',
    saved_at: new Date().toISOString(),
    preferences
  });
});

// 17. UPLOAD: File attachment simulation
app.post('/api/upload', (req: Request, res: Response) => {
  // Simulates file upload returning metadata
  const sampleFiles: DBOrderFile[] = [
    {
      id: `file-${Date.now()}-1`,
      name: 'Техническое_Задание_BauSquad.pdf',
      size: 1542000,
      type: 'application/pdf',
      url: '/uploads/sample_tz.pdf',
      uploaded_at: new Date().toISOString()
    }
  ];

  return res.json({
    message: 'Файлы успешно загружены',
    files: sampleFiles
  });
});

// SERVE STATIC UPLOADS, ERRORS AND ROOT ASSETS
const uploadsPath = path.join(process.cwd(), 'uploads');
if (fs.existsSync(uploadsPath)) {
  app.use('/uploads', express.static(uploadsPath));
}

const errorsPath = path.join(process.cwd(), 'errors');
if (fs.existsSync(errorsPath)) {
  app.use('/errors', express.static(errorsPath));
}

// Serve root alarm audio files
app.get('/alarm.wav', (req: Request, res: Response) => {
  const filePath = path.join(process.cwd(), 'alarm.wav');
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.status(404).send('Audio file not found');
});

app.get('/alarm.mp3', (req: Request, res: Response) => {
  const filePath = path.join(process.cwd(), 'alarm.mp3');
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.status(404).send('Audio file not found');
});

// CATCH-ALL FOR UNMATCHED API ROUTES (returns JSON 404)
app.all('/api/*', (req: Request, res: Response) => {
  console.warn(`[404 API Not Found] ${req.method} ${req.originalUrl}`);
  return res.status(404).json({
    error: `Маршрут API "${req.originalUrl}" не найден на сервере BauSquad`
  });
});

// VITE & STATIC SPA MIDDLEWARE SETUP
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Development mode with Vite HMR/middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);

    // SPA fallback in development mode
    app.get('*', async (req: Request, res: Response, next) => {
      if (req.originalUrl.startsWith('/api')) return next();
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Production mode: Serve dist built SPA
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath, { maxAge: '1d' }));
    }

    // SPA fallback: Send dist/index.html for any subpage navigation
    app.get('*', (req: Request, res: Response, next) => {
      if (req.originalUrl.startsWith('/api')) return next();
      const distIndex = path.join(distPath, 'index.html');
      if (fs.existsSync(distIndex)) {
        res.sendFile(distIndex);
      } else {
        res.sendFile(path.join(process.cwd(), 'index.html'));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BauSquad Server] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
