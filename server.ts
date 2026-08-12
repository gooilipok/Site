import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Setup file uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// In-Memory Database (simulating MySQL ORM for live interactive preview)
interface DBUser {
  id: string;
  email: string;
  username: string;
  passwordHash: string; // bcrypt/simulated hash
  role: 'customer' | 'admin';
  account_status: 'active' | 'banned' | 'deleted';
  is_verified: boolean;
  created_at: string;
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
    agreements: u.agreements,
    order_count
  };
}

// REST API ROUTES

// 1. AUTH: Register Step 1 (Send Email Verification Code)
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, username, password, terms_accepted, privacy_accepted, consent_accepted } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  }

  if (!terms_accepted || !privacy_accepted || !consent_accepted) {
    return res.status(400).json({
      error: 'Для регистрации необходимо отдельно подтвердить все 3 соглашения'
    });
  }

  const existingEmail = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingEmail) {
    return res.status(400).json({ error: 'Пользователь с таким Email уже зарегистрирован' });
  }

  const existingUsername = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (existingUsername) {
    return res.status(400).json({ error: 'Пользователь с таким Логином уже существует' });
  }

  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const now = new Date().toISOString();

  verificationCodes.set(email.toLowerCase(), {
    email: email.toLowerCase(),
    code,
    expires_at: Date.now() + 15 * 60 * 1000, // 15 mins
    payload: {
      email,
      username,
      passwordHash: password, // In production, hashed with bcrypt
      terms_accepted,
      terms_accepted_at: now,
      privacy_accepted,
      privacy_accepted_at: now,
      consent_accepted,
      consent_accepted_at: now
    }
  });

  console.log(`[SMTP Mailer] Verification code sent to ${email}: ${code}`);

  return res.json({
    message: 'Код подтверждения успешно отправлен на вашу почту',
    demo_code: code, // Shared for convenience in preview mode
    email
  });
});

// 2. AUTH: Verify Email Code & Complete Registration
app.post('/api/auth/verify-code', (req: Request, res: Response) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Укажите email и код подтверждения' });
  }

  const record = verificationCodes.get(email.toLowerCase());
  if (!record) {
    return res.status(400).json({ error: 'Код не запрашивался или срок действия истёк' });
  }

  if (record.code !== code.trim()) {
    return res.status(400).json({ error: 'Неверный код подтверждения' });
  }

  if (record.expires_at < Date.now()) {
    verificationCodes.delete(email.toLowerCase());
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

  users.push(newUser);
  verificationCodes.delete(email.toLowerCase());

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
});

// 3. AUTH: Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { login_identifier, password } = req.body;

  if (!login_identifier || !password) {
    return res.status(400).json({ error: 'Введите Email/Логин и Пароль' });
  }

  const query = login_identifier.toLowerCase();
  const user = users.find(u => u.email.toLowerCase() === query || u.username.toLowerCase() === query);

  if (!user || user.passwordHash !== password) {
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
app.get('/api/auth/me', authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user as DBUser;
  return res.json({ user: sanitizeUser(user) });
});

// 6. PROFILE: Update User Profile
app.put('/api/profile', authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user as DBUser;
  const { username, new_password } = req.body;

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

  return res.json({
    message: 'Профиль успешно обновлен',
    user: sanitizeUser(user)
  });
});

// 7. ORDERS: Get Orders List
app.get('/api/orders', authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user as DBUser;
  
  if (user.role === 'admin') {
    return res.json({ orders });
  } else {
    const userOrders = orders.filter(o => o.user_id === user.id);
    return res.json({ orders: userOrders });
  }
});

// 8. ORDERS: Create Order & Post to Telegram Bot API
app.post('/api/orders', authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user as DBUser;

  // BANNED USER CHECK
  if (user.account_status === 'banned') {
    return res.status(403).json({
      error: 'Ваш аккаунт заблокирован администратором. Вы не можете создавать новые заказы.'
    });
  }

  const { title, description, deadline, price, contact, files } = req.body;

  if (!title || !description || !contact) {
    return res.status(400).json({ error: 'Заполните обязательные поля: Предмет, Описание, Контакт' });
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
    user_id: user.id,
    user_email: user.email,
    user_username: user.username,
    files: Array.isArray(files) ? files : []
  };

  orders.unshift(newOrder);

  // Format Telegram notification message per user requirements
  const tgMessage = `📚 <b>Новый заказ #${newOrder.id}</b>\n\n` +
    `<b>Предмет:</b> ${newOrder.title}\n` +
    `<b>Описание:</b> ${newOrder.description}\n` +
    `<b>Дедлайн:</b> ${newOrder.deadline}\n` +
    `<b>Контакт:</b> ${newOrder.contact}\n` +
    `<b>Автор:</b> @${newOrder.user_username} (${newOrder.user_email})\n` +
    `<b>Дата:</b> ${new Date(newOrder.created_at).toLocaleString('ru-RU')}\n` +
    `<b>Файлов прикреплено:</b> ${newOrder.files.length}`;

  telegramLogs.unshift({
    id: `tg-${Date.now()}`,
    timestamp: new Date().toISOString(),
    text: tgMessage,
    files: newOrder.files.map(f => f.name)
  });

  console.log(`[Telegram Bot API] Message sent to Admin Chat:\n${tgMessage}`);

  return res.json({
    message: 'Заказ успешно создан и отправлен в BauSquad',
    order: newOrder,
    telegram_notified: true
  });
});

// 9. ORDERS: Update Order Status (Admin)
app.patch('/api/orders/:id/status', authenticateUser, requireAdmin, (req: Request, res: Response) => {
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

  return res.json({
    message: `Статус заказа #${id} изменён на ${status}`,
    order
  });
});

// 9b. ORDERS: Update Order Prices (Client Price & Executer Price) (Admin)
app.patch('/api/orders/:id/prices', authenticateUser, requireAdmin, (req: Request, res: Response) => {
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

// 14. ADMIN: Switch Role for Demo Testing
app.post('/api/admin/demo-toggle-role', authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user as DBUser;
  user.role = user.role === 'admin' ? 'customer' : 'admin';
  const access_token = generateToken(user.id, user.role, 'access');
  const refresh_token = generateToken(user.id, user.role, 'refresh');

  return res.json({
    message: `Роль переключена на ${user.role}`,
    user: sanitizeUser(user),
    tokens: { access_token, refresh_token, token_type: 'Bearer', expires_in: 1800 }
  });
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

// VITE MIDDLEWARE SETUP
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BauSquad Server] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
