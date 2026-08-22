var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_dotenv = __toESM(require("dotenv"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_express = __toESM(require("express"), 1);
var import_vite = require("vite");
var import_promise = __toESM(require("mysql2/promise"), 1);
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_nodemailer = __toESM(require("nodemailer"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_meta = {};
var currentDir = typeof __dirname !== "undefined" ? __dirname : typeof import_meta !== "undefined" && import_meta.url ? import_path.default.dirname(new URL(import_meta.url).pathname) : process.cwd();
var potentialEnvPaths = [
  import_path.default.resolve(process.cwd(), ".env"),
  import_path.default.resolve(process.cwd(), "..", ".env"),
  import_path.default.join(currentDir, ".env"),
  import_path.default.join(currentDir, "..", ".env"),
  "/home/bau7824897/bausquad.org/.env"
];
var loadedEnvPath = "";
for (const envPath of potentialEnvPaths) {
  if (import_fs.default.existsSync(envPath)) {
    import_dotenv.default.config({ path: envPath });
    loadedEnvPath = envPath;
    break;
  }
}
if (!loadedEnvPath) {
  import_dotenv.default.config();
}
var app = (0, import_express.default)();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "50mb" }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
var publicDir = import_path.default.join(process.cwd(), "public");
if (import_fs.default.existsSync(publicDir)) {
  app.use(import_express.default.static(publicDir));
}
var uploadsDir = import_path.default.join(process.cwd(), "uploads");
if (!import_fs.default.existsSync(uploadsDir)) {
  import_fs.default.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", import_express.default.static(uploadsDir));
var dbPool = null;
var dbStatus = {
  connected: false,
  error: null,
  database: process.env.MYSQL_DATABASE || null,
  host: process.env.MYSQL_HOST || null,
  lastChecked: null
};
async function ensureDatabaseSchema(pool) {
  try {
    await pool.execute(
      `INSERT IGNORE INTO users (id, login, email, password_hash, role, account_status, registration_date, is_verified, user_agreement, privacy_agreement, processing_personal_data_agreement, user_agreement_date, privacy_agreement_date, processing_personal_data_agreement_date)
       VALUES (1, 'website_guest', 'guest@bausquad.org', 'nopassword', 'user', 'active', NOW(), 1, 1, 1, 1, NOW(), NOW(), NOW())`
    );
    const [cols] = await pool.query(`SHOW COLUMNS FROM orders`);
    const existingColNames = Array.isArray(cols) ? cols.map((c) => c.Field.toLowerCase()) : [];
    if (!existingColNames.includes("terms_accepted")) {
      await pool.query(`ALTER TABLE orders ADD COLUMN terms_accepted TINYINT(1) NOT NULL DEFAULT 1`);
      console.log("[MySQL Migration] Added column terms_accepted to orders");
    }
    if (!existingColNames.includes("privacy_accepted")) {
      await pool.query(`ALTER TABLE orders ADD COLUMN privacy_accepted TINYINT(1) NOT NULL DEFAULT 1`);
      console.log("[MySQL Migration] Added column privacy_accepted to orders");
    }
    if (!existingColNames.includes("consent_accepted")) {
      await pool.query(`ALTER TABLE orders ADD COLUMN consent_accepted TINYINT(1) NOT NULL DEFAULT 1`);
      console.log("[MySQL Migration] Added column consent_accepted to orders");
    }
    if (!existingColNames.includes("agreements_accepted_at")) {
      await pool.query(`ALTER TABLE orders ADD COLUMN agreements_accepted_at DATETIME NULL`);
      console.log("[MySQL Migration] Added column agreements_accepted_at to orders");
    }
    if (!existingColNames.includes("guest_email")) {
      await pool.query(`ALTER TABLE orders ADD COLUMN guest_email VARCHAR(255) NULL`);
      console.log("[MySQL Migration] Added column guest_email to orders");
    }
    console.log("[MySQL Migration] Database schema verified successfully with agreement tracking.");
  } catch (err) {
    console.warn("[MySQL Migration Warning]:", err?.message || err);
  }
}
function initDatabasePool() {
  const mysqlHost = process.env.MYSQL_HOST || "mysql.hosting.nic.ru";
  const mysqlUser = process.env.MYSQL_USER || "bau7824897_mysql";
  const mysqlPassword = process.env.MYSQL_PASSWORD || "AhTFV6g/";
  const mysqlDatabase = process.env.MYSQL_DATABASE || "bau7824897_db";
  const mysqlPort = parseInt(process.env.MYSQL_PORT || "3306", 10);
  if (mysqlUser && mysqlDatabase) {
    try {
      dbPool = import_promise.default.createPool({
        host: mysqlHost,
        port: mysqlPort,
        user: mysqlUser,
        password: mysqlPassword,
        database: mysqlDatabase,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 2e4,
        enableKeepAlive: true,
        keepAliveInitialDelay: 1e4
      });
      dbStatus.host = mysqlHost;
      dbStatus.database = mysqlDatabase;
      dbPool.query("SELECT 1 as healthcheck").then(async () => {
        dbStatus.connected = true;
        dbStatus.error = null;
        dbStatus.lastChecked = (/* @__PURE__ */ new Date()).toISOString();
        console.log(`[MySQL] Connection established to ${mysqlHost}/${mysqlDatabase}`);
        if (dbPool) {
          await ensureDatabaseSchema(dbPool);
        }
      }).catch((err) => {
        dbStatus.connected = false;
        dbStatus.error = err?.message || String(err);
        dbStatus.lastChecked = (/* @__PURE__ */ new Date()).toISOString();
        console.error("[MySQL Connection Error]", err?.message || err);
      });
    } catch (err) {
      dbStatus.connected = false;
      dbStatus.error = err?.message || String(err);
      console.error("[MySQL Pool Init Error]:", err);
    }
  } else {
    console.warn("[MySQL] No MySQL credentials found in environment.");
  }
}
initDatabasePool();
app.get(["/api/health", "/health", "/api/ping", "/ping"], async (req, res) => {
  if (dbPool) {
    try {
      await dbPool.query("SELECT 1");
      dbStatus.connected = true;
      dbStatus.error = null;
    } catch (e) {
      dbStatus.connected = false;
      dbStatus.error = e?.message || String(e);
    }
  }
  return res.json({
    status: "ok",
    app: "BauSquad",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    env_loaded_from: loadedEnvPath || "default/process.env",
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
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || "587",
      user_set: Boolean(process.env.SMTP_USER),
      password_set: Boolean(process.env.SMTP_PASSWORD || process.env.SMTP_PASS),
      from: process.env.SMTP_FROM || `BauSquad <${process.env.SMTP_USER || "noreply@bausquad.org"}>`
    }
  });
});
app.get(["/api/email/test", "/api/mail/test"], async (req, res) => {
  const targetEmail = req.query.to || process.env.SMTP_USER;
  if (!process.env.SMTP_USER || !(process.env.SMTP_PASSWORD || process.env.SMTP_PASS)) {
    return res.status(400).json({
      success: false,
      error: "SMTP_USER \u0438\u043B\u0438 SMTP_PASSWORD \u043D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u044B \u0432 \u0444\u0430\u0439\u043B\u0435 .env",
      config: {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: process.env.SMTP_PORT || "587",
        user_set: Boolean(process.env.SMTP_USER),
        password_set: Boolean(process.env.SMTP_PASSWORD || process.env.SMTP_PASS)
      }
    });
  }
  if (!targetEmail) {
    return res.status(400).json({
      success: false,
      error: "\u0423\u043A\u0430\u0436\u0438\u0442\u0435 email \u0434\u043B\u044F \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438: /api/email/test?to=your_email@example.com"
    });
  }
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #0f172a; margin-top: 0;">\u0422\u0435\u0441\u0442\u043E\u0432\u043E\u0435 \u043F\u0438\u0441\u044C\u043C\u043E \u043E\u0442 BauSquad</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.6;">
        \u042D\u0442\u043E \u043F\u0440\u043E\u0432\u0435\u0440\u043E\u0447\u043D\u043E\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E \u0441 \u0432\u0430\u0448\u0435\u0433\u043E \u0441\u0435\u0440\u0432\u0435\u0440\u0430 \u0434\u043B\u044F \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F \u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u043E\u0441\u0442\u0438 \u0440\u0430\u0431\u043E\u0442\u044B \u043F\u043E\u0447\u0442\u043E\u0432\u043E\u0433\u043E \u0448\u043B\u044E\u0437\u0430 (SMTP).
      </p>
      <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #1e293b; font-size: 14px;"><strong>\u0421\u0442\u0430\u0442\u0443\u0441:</strong> SMTP \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0430\u043A\u0442\u0438\u0432\u043D\u043E</p>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">\u0412\u0440\u0435\u043C\u044F \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438: ${(/* @__PURE__ */ new Date()).toLocaleString("ru-RU")}</p>
      </div>
      <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">\u041A\u043E\u043C\u0430\u043D\u0434\u0430 BauSquad &bull; bausquad.org</p>
    </div>
  `;
  const result = await sendEmailNotification(
    targetEmail,
    "\u0422\u0435\u0441\u0442\u043E\u0432\u043E\u0435 \u043F\u0438\u0441\u044C\u043C\u043E \u043E\u0442 BauSquad (\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 SMTP)",
    html
  );
  if (result.success) {
    return res.json({
      success: true,
      message: `\u0422\u0435\u0441\u0442\u043E\u0432\u043E\u0435 \u043F\u0438\u0441\u044C\u043C\u043E \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E \u043D\u0430 ${targetEmail}`,
      messageId: result.messageId
    });
  } else {
    return res.status(500).json({
      success: false,
      error: result.error || "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u043F\u0438\u0441\u044C\u043C\u043E \u0447\u0435\u0440\u0435\u0437 SMTP",
      smtp_config: {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: process.env.SMTP_PORT || "587",
        user: process.env.SMTP_USER
      }
    });
  }
});
app.get(["/api/telegram/test", "/api/tg/test"], async (req, res) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return res.status(400).json({
      success: false,
      error: "TELEGRAM_BOT_TOKEN \u0438\u043B\u0438 TELEGRAM_ADMIN_CHAT_ID \u043D\u0435 \u0437\u0430\u0434\u0430\u043D\u044B \u0432 .env",
      token_set: Boolean(token),
      chat_id_set: Boolean(chatId)
    });
  }
  const testText = `\u{1F916} <b>\u0422\u0435\u0441\u0442\u043E\u0432\u043E\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u043E\u0442 BauSquad</b>

\u2705 \u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0441\u0432\u044F\u0437\u0438 \u0441 \u0441\u0435\u0440\u0432\u0435\u0440\u043E\u043C \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0430!
\u23F0 \u0412\u0440\u0435\u043C\u044F: ${(/* @__PURE__ */ new Date()).toLocaleString("ru-RU")}`;
  const endpoints = [
    `https://api.telegram.org/bot${token}/sendMessage`,
    // If blocked, fallback to alternate mirror if configured
    process.env.TELEGRAM_API_PROXY ? `${process.env.TELEGRAM_API_PROXY.replace(/\/$/, "")}/bot${token}/sendMessage` : null
  ].filter(Boolean);
  const results = [];
  for (const url of endpoints) {
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: testText,
          parse_mode: "HTML"
        }),
        signal: AbortSignal.timeout(1e4)
      });
      const data = await resp.json();
      results.push({ url, status: resp.status, ok: resp.ok, data });
      if (resp.ok && data.ok) {
        return res.json({
          success: true,
          message: "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043E \u0432 Telegram!",
          chat_id: chatId,
          response: data,
          details: results
        });
      }
    } catch (err) {
      results.push({
        url,
        error: err?.message || String(err),
        code: err?.code || err?.cause?.code
      });
    }
  }
  return res.status(500).json({
    success: false,
    error: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u0432 Telegram",
    attempts: results
  });
});
app.get("/api/db/test", async (req, res) => {
  if (!dbPool) {
    return res.status(500).json({ success: false, error: "dbPool is not initialized", dbStatus });
  }
  try {
    const [tables] = await dbPool.query("SHOW TABLES");
    const [ordersCount] = await dbPool.query("SELECT COUNT(*) as count FROM orders");
    const [recentOrders] = await dbPool.query("SELECT order_id, client_id, subject, status, created_at FROM orders ORDER BY order_id DESC LIMIT 5");
    const testSubject = `\u0422\u0435\u0441\u0442\u043E\u0432\u044B\u0439 \u0437\u0430\u043F\u0440\u043E\u0441 ${(/* @__PURE__ */ new Date()).toLocaleTimeString("ru-RU")}`;
    const [insertResult] = await dbPool.execute(
      `INSERT INTO orders (client_id, subject, description, deadline, contact, source, status, terms_accepted, privacy_accepted, consent_accepted, agreements_accepted_at, guest_email, created_at)
       VALUES (1, ?, '\u0414\u0438\u0430\u0433\u043D\u043E\u0441\u0442\u0438\u043A\u0430 \u0447\u0435\u0440\u0435\u0437 /api/db/test', '\u0421\u0440\u043E\u0447\u043D\u043E', '+7 (999) 000-00-00', 'website', 'new', 1, 1, 1, NOW(), 'test@bausquad.org', NOW())`,
      [testSubject]
    );
    return res.json({
      success: true,
      tables,
      orders_count: ordersCount?.[0]?.count ?? 0,
      recent_orders: recentOrders,
      test_insert_id: insertResult?.insertId,
      message: "\u0417\u0430\u043F\u0438\u0441\u044C \u0432 \u0431\u0430\u0437\u0443 \u0434\u0430\u043D\u043D\u044B\u0445 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0430!"
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err?.message || String(err),
      code: err?.code,
      sqlState: err?.sqlState,
      sqlMessage: err?.sqlMessage
    });
  }
});
var users = [
  {
    id: "usr-admin-01",
    email: "admin@bausquad.ru",
    username: "BauAdmin",
    passwordHash: "admin123",
    role: "admin",
    account_status: "active",
    is_verified: true,
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1e3).toISOString(),
    agreements: {
      terms_accepted: true,
      terms_accepted_at: (/* @__PURE__ */ new Date()).toISOString(),
      privacy_accepted: true,
      privacy_accepted_at: (/* @__PURE__ */ new Date()).toISOString(),
      consent_accepted: true,
      consent_accepted_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  },
  {
    id: "usr-customer-01",
    email: "student@bausquad.ru",
    username: "AlexStudent",
    passwordHash: "student123",
    role: "customer",
    account_status: "active",
    is_verified: true,
    created_at: new Date(Date.now() - 7 * 24 * 3600 * 1e3).toISOString(),
    agreements: {
      terms_accepted: true,
      terms_accepted_at: (/* @__PURE__ */ new Date()).toISOString(),
      privacy_accepted: true,
      privacy_accepted_at: (/* @__PURE__ */ new Date()).toISOString(),
      consent_accepted: true,
      consent_accepted_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  }
];
var orders = [
  {
    id: "ord-1001",
    title: "\u0412\u044B\u0441\u0448\u0430\u044F \u041C\u0430\u0442\u0435\u043C\u0430\u0442\u0438\u043A\u0430 (\u0422\u0435\u043E\u0440\u0438\u044F \u0412\u0435\u0440. \u0438 \u041C\u0430\u0442. \u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430)",
    description: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0440\u0435\u0448\u0438\u0442\u044C 5 \u0437\u0430\u0434\u0430\u0447 \u043F\u043E \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0435 \u0438 \u0441\u0434\u0435\u043B\u0430\u0442\u044C \u043F\u043E\u044F\u0441\u043D\u0435\u043D\u0438\u044F \u0432 Word.",
    deadline: "15.08.2026",
    price: "3500 \u20BD",
    client_price: "3500 \u20BD",
    executer_price: "2200 \u20BD",
    contact: "@alex_student_tg",
    status: "in_progress",
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1e3).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 3600 * 1e3).toISOString(),
    user_id: "usr-customer-01",
    user_email: "student@bausquad.ru",
    user_username: "AlexStudent",
    files: [
      {
        id: "file-01",
        name: "\u0417\u0430\u0434\u0430\u043D\u0438\u0435_\u0412\u0430\u0440\u0438\u0430\u043D\u0442_4.pdf",
        size: 1024500,
        type: "application/pdf",
        url: "/uploads/sample_task.pdf",
        uploaded_at: (/* @__PURE__ */ new Date()).toISOString()
      }
    ]
  },
  {
    id: "ord-1002",
    title: "\u0421\u043E\u043F\u0440\u043E\u043C\u0430\u0442 / \u0420\u0430\u0441\u0447\u0451\u0442 \u0431\u0430\u043B\u043A\u0438 \u043D\u0430 \u043F\u0440\u043E\u0447\u043D\u043E\u0441\u0442\u044C",
    description: "\u041A\u0443\u0440\u0441\u043E\u0432\u043E\u0439 \u043F\u0440\u043E\u0435\u043A\u0442: \u041F\u043E\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u0435 \u044D\u043F\u044E\u0440 \u0438\u0437\u0433\u0438\u0431\u0430\u044E\u0449\u0438\u0445 \u043C\u043E\u043C\u0435\u043D\u0442\u043E\u0432 \u0438 \u043F\u043E\u043F\u0435\u0440\u0435\u0447\u043D\u044B\u0445 \u0441\u0438\u043B.",
    deadline: "20.08.2026",
    price: "5000 \u20BD",
    client_price: "5000 \u20BD",
    executer_price: "3200 \u20BD",
    contact: "+7 (999) 000-11-22",
    status: "new",
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString(),
    user_id: "usr-customer-01",
    user_email: "student@bausquad.ru",
    user_username: "AlexStudent",
    files: []
  }
];
var verificationCodes = /* @__PURE__ */ new Map();
var telegramLogs = [];
function getOrderText(data) {
  let order = data.order_id ? `\u{1F4CB} <b>\u0417\u0430\u043A\u0430\u0437 \u2116${data.order_id}</b>

` : `\u{1F4CB} <b>\u041D\u043E\u0432\u044B\u0439 \u0437\u0430\u043A\u0430\u0437</b>

`;
  const user = data.user;
  const userText = `\u{1F464} <b>\u0417\u0430\u043A\u0430\u0437\u0447\u0438\u043A:</b>
${user.first_name || "\u041A\u043B\u0438\u0435\u043D\u0442"}` + (user.last_name ? ` ${user.last_name}` : "") + (user.username ? ` (@${user.username.replace(/^@/, "")})` : "") + `

`;
  return order + userText + `\u{1F4D8} <b>\u041F\u0440\u0435\u0434\u043C\u0435\u0442:</b>
${data.subject}

\u{1F4DD} <b>\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435:</b>
${data.description}

\u23F0 <b>\u0421\u0440\u043E\u043A:</b>
${data.deadline || "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"}

\u{1F4DE} <b>\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u044B:</b>
${data.contact}`;
}
function isPhotoAttachment(filename, mimeType) {
  const ext = import_path.default.extname(filename).toLowerCase();
  if ([".svg", ".psd", ".ai", ".eps", ".tiff", ".tif", ".raw"].includes(ext)) {
    return false;
  }
  if (mimeType && mimeType.startsWith("image/")) {
    return true;
  }
  return [".jpg", ".jpeg", ".png", ".webp", ".bmp"].includes(ext);
}
async function sendTelegramOrderNotification(text, attachments = [], orderId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
  const logEntry = {
    id: `tg-${Date.now()}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    text,
    files: attachments.map((a) => a.name)
  };
  telegramLogs.unshift(logEntry);
  if (telegramLogs.length > 50) telegramLogs.pop();
  if (!token || !chatId) {
    console.log("[Telegram Bot API] (Token/ChatId missing, Local log):\n", text, "\nAttachments:", attachments.map((a) => a.name));
    return;
  }
  const baseUrls = [
    "https://api.telegram.org",
    process.env.TELEGRAM_API_PROXY ? process.env.TELEGRAM_API_PROXY.replace(/\/$/, "") : null
  ].filter(Boolean);
  const photoAttachments = attachments.filter((a) => a.isPhoto);
  const documentAttachments = attachments.filter((a) => !a.isPhoto);
  const sendTelegramRequest = async (endpoint, body, isFormData = false) => {
    for (const baseUrl of baseUrls) {
      const url = `${baseUrl}/bot${token}/${endpoint}`;
      try {
        const resp = await fetch(url, {
          method: "POST",
          headers: isFormData ? void 0 : { "Content-Type": "application/json" },
          body: isFormData ? body : JSON.stringify(body),
          signal: AbortSignal.timeout(25e3)
        });
        const data = await resp.json();
        if (data.ok) {
          return { ok: true, data };
        } else {
          console.error(`[Telegram Bot API ${endpoint} Error from ${url}]`, data);
        }
      } catch (err) {
        console.error(`[Telegram Network Error for ${endpoint} from ${url}]:`, err?.message || err);
      }
    }
    return { ok: false };
  };
  try {
    if (photoAttachments.length === 0) {
      await sendTelegramRequest("sendMessage", {
        chat_id: chatId,
        text,
        parse_mode: "HTML"
      });
    } else if (photoAttachments.length === 1) {
      const photo = photoAttachments[0];
      if (text.length <= 1024) {
        const formData = new FormData();
        formData.append("chat_id", String(chatId));
        formData.append("caption", text);
        formData.append("parse_mode", "HTML");
        const blob = new Blob([photo.buffer], { type: photo.type || "image/jpeg" });
        formData.append("photo", blob, photo.name);
        const res = await sendTelegramRequest("sendPhoto", formData, true);
        if (!res.ok) {
          await sendTelegramRequest("sendMessage", { chat_id: chatId, text, parse_mode: "HTML" });
        }
      } else {
        await sendTelegramRequest("sendMessage", { chat_id: chatId, text, parse_mode: "HTML" });
        const formData = new FormData();
        formData.append("chat_id", String(chatId));
        formData.append("caption", `\u{1F4F8} <b>\u0424\u043E\u0442\u043E \u043A \u0437\u0430\u043A\u0430\u0437\u0443 #${orderId || ""}</b>`);
        formData.append("parse_mode", "HTML");
        const blob = new Blob([photo.buffer], { type: photo.type || "image/jpeg" });
        formData.append("photo", blob, photo.name);
        await sendTelegramRequest("sendPhoto", formData, true);
      }
    } else {
      const isCaptionInMedia = text.length <= 1024;
      if (!isCaptionInMedia) {
        await sendTelegramRequest("sendMessage", { chat_id: chatId, text, parse_mode: "HTML" });
      }
      const photoChunks = [];
      for (let i = 0; i < photoAttachments.length; i += 10) {
        photoChunks.push(photoAttachments.slice(i, i + 10));
      }
      for (let chunkIdx = 0; chunkIdx < photoChunks.length; chunkIdx++) {
        const chunk = photoChunks[chunkIdx];
        const formData = new FormData();
        formData.append("chat_id", String(chatId));
        const mediaGroup = chunk.map((p, idx) => {
          const mediaItem = {
            type: "photo",
            media: `attach://photo_${chunkIdx}_${idx}`
          };
          if (chunkIdx === 0 && idx === 0) {
            if (isCaptionInMedia) {
              mediaItem.caption = text;
              mediaItem.parse_mode = "HTML";
            } else {
              mediaItem.caption = `\u{1F4F8} <b>\u0424\u043E\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u0438 \u043A \u0437\u0430\u043A\u0430\u0437\u0443 #${orderId || ""}</b> (${photoAttachments.length} \u0448\u0442.)`;
              mediaItem.parse_mode = "HTML";
            }
          }
          return mediaItem;
        });
        formData.append("media", JSON.stringify(mediaGroup));
        chunk.forEach((p, idx) => {
          const blob = new Blob([p.buffer], { type: p.type || "image/jpeg" });
          formData.append(`photo_${chunkIdx}_${idx}`, blob, p.name);
        });
        const res = await sendTelegramRequest("sendMediaGroup", formData, true);
        if (!res.ok) {
          for (const p of chunk) {
            const singleForm = new FormData();
            singleForm.append("chat_id", String(chatId));
            const b = new Blob([p.buffer], { type: p.type || "image/jpeg" });
            singleForm.append("photo", b, p.name);
            await sendTelegramRequest("sendPhoto", singleForm, true);
          }
        }
      }
    }
  } catch (photoErr) {
    console.error("[Telegram Photo Dispatch Error]", photoErr);
  }
  if (documentAttachments.length > 0) {
    try {
      if (documentAttachments.length === 1) {
        const doc = documentAttachments[0];
        const formData = new FormData();
        formData.append("chat_id", String(chatId));
        formData.append("caption", `\u{1F4CE} <b>\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u043A \u0437\u0430\u043A\u0430\u0437\u0443 #${orderId || ""}:</b>
${doc.name}`);
        formData.append("parse_mode", "HTML");
        const blob = new Blob([doc.buffer], { type: doc.type || "application/octet-stream" });
        formData.append("document", blob, doc.name);
        await sendTelegramRequest("sendDocument", formData, true);
      } else {
        const docChunks = [];
        for (let i = 0; i < documentAttachments.length; i += 10) {
          docChunks.push(documentAttachments.slice(i, i + 10));
        }
        for (let chunkIdx = 0; chunkIdx < docChunks.length; chunkIdx++) {
          const chunk = docChunks[chunkIdx];
          const formData = new FormData();
          formData.append("chat_id", String(chatId));
          const mediaGroup = chunk.map((d, idx) => {
            const mediaItem = {
              type: "document",
              media: `attach://doc_${chunkIdx}_${idx}`
            };
            if (chunkIdx === 0 && idx === 0) {
              mediaItem.caption = `\u{1F4CE} <b>\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u043A \u0437\u0430\u043A\u0430\u0437\u0443 #${orderId || ""}</b> (${documentAttachments.length} \u0448\u0442.)`;
              mediaItem.parse_mode = "HTML";
            }
            return mediaItem;
          });
          formData.append("media", JSON.stringify(mediaGroup));
          chunk.forEach((d, idx) => {
            const blob = new Blob([d.buffer], { type: d.type || "application/octet-stream" });
            formData.append(`doc_${chunkIdx}_${idx}`, blob, d.name);
          });
          const res = await sendTelegramRequest("sendMediaGroup", formData, true);
          if (!res.ok) {
            for (const d of chunk) {
              const singleForm = new FormData();
              singleForm.append("chat_id", String(chatId));
              singleForm.append("caption", `\u{1F4CE} <b>\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442:</b> ${d.name}`);
              singleForm.append("parse_mode", "HTML");
              const b = new Blob([d.buffer], { type: d.type || "application/octet-stream" });
              singleForm.append("document", b, d.name);
              await sendTelegramRequest("sendDocument", singleForm, true);
            }
          }
        }
      }
    } catch (docErr) {
      console.error("[Telegram Document Dispatch Error]", docErr);
    }
  }
}
async function sendTelegramNotification(text, files = []) {
  return sendTelegramOrderNotification(text, [], void 0);
}
function verifyPassword(plainPassword, storedHash) {
  if (!storedHash || !plainPassword) return false;
  if (storedHash === plainPassword) return true;
  if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
    try {
      if (import_bcryptjs.default.compareSync(plainPassword, storedHash)) return true;
    } catch (e) {
    }
  }
  const md5Hash = import_crypto.default.createHash("md5").update(plainPassword).digest("hex");
  if (storedHash.toLowerCase() === md5Hash.toLowerCase()) return true;
  const sha256Hash = import_crypto.default.createHash("sha256").update(plainPassword).digest("hex");
  if (storedHash.toLowerCase() === sha256Hash.toLowerCase()) return true;
  const sha512Hash = import_crypto.default.createHash("sha512").update(plainPassword).digest("hex");
  if (storedHash.toLowerCase() === sha512Hash.toLowerCase()) return true;
  if (storedHash.startsWith("pbkdf2_sha256$")) {
    try {
      const parts = storedHash.split("$");
      if (parts.length === 4) {
        const iterations = parseInt(parts[1], 10);
        const salt = parts[2];
        const expectedHash = parts[3];
        const derivedKey = import_crypto.default.pbkdf2Sync(plainPassword, salt, iterations, 32, "sha256");
        const computedBase64 = derivedKey.toString("base64");
        if (computedBase64 === expectedHash) return true;
      }
    } catch (pbErr) {
      console.warn("[PBKDF2 Verify Error]", pbErr);
    }
  }
  try {
    return import_bcryptjs.default.compareSync(plainPassword, storedHash);
  } catch (e) {
    return false;
  }
}
function getMailTransporter() {
  const host = process.env.SMTP_HOST || process.env.SMTP_SERVER || "mail.nic.ru";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const user = process.env.SMTP_USER || process.env.SMTP_EMAIL || "bausquadresponse@bausquad.org";
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS || "I*D8J2{W51zG(a^f";
  if (!user || !pass) {
    return null;
  }
  return import_nodemailer.default.createTransport({
    host,
    port,
    secure: port === 465,
    // true for 465 SSL, false for 587 STARTTLS
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}
async function sendEmailNotification(to, subject, htmlContent, textContent) {
  const transporter = getMailTransporter();
  if (!transporter) {
    console.warn(`[SMTP Mailer Warning] SMTP_USER or SMTP_PASSWORD not configured. Email to ${to} was not sent.`);
    return { success: false, error: "SMTP \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 (SMTP_USER / SMTP_PASSWORD) \u043D\u0435 \u0437\u0430\u0434\u0430\u043D\u044B \u0432 .env" };
  }
  const from = process.env.SMTP_FROM || `BauSquad <${process.env.SMTP_USER || process.env.SMTP_EMAIL || "bausquadresponse@bausquad.org"}>`;
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: textContent || htmlContent.replace(/<[^>]*>?/gm, ""),
      html: htmlContent
    });
    console.log(`[SMTP Mailer] Email sent successfully to ${to}, MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[SMTP Mailer Error] Failed to send email to ${to}:`, err?.message || err);
    return { success: false, error: err?.message || String(err) };
  }
}
function generateToken(userId, role, type) {
  const secret = process.env.SECRET_KEY || "f8d9a2b7c4e109831a";
  const accessMins = process.env.ACCESS_TOKEN_EXPIRE_MINUTES ? parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES, 10) : 30;
  const refreshDays = process.env.REFRESH_TOKEN_EXPIRE_DAYS ? parseInt(process.env.REFRESH_TOKEN_EXPIRE_DAYS, 10) : 7;
  const expires = type === "access" ? accessMins * 60 * 1e3 : refreshDays * 24 * 3600 * 1e3;
  return Buffer.from(JSON.stringify({ userId, role, type, exp: Date.now() + expires, secret })).toString("base64");
}
function verifyToken(token) {
  try {
    const parsed = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    if (parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}
function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u0430 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F" });
  }
  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  if (!payload || payload.type !== "access") {
    return res.status(401).json({ error: "\u041D\u0435\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u0438\u043B\u0438 \u043F\u0440\u043E\u0441\u0440\u043E\u0447\u0435\u043D\u043D\u044B\u0439 \u0442\u043E\u043A\u0435\u043D" });
  }
  const user = users.find((u) => u.id === payload.userId);
  if (!user) {
    return res.status(401).json({ error: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
  }
  req.user = user;
  next();
}
function requireAdmin(req, res, next) {
  const user = req.user;
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "\u0414\u043E\u0441\u0442\u0443\u043F \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D \u0442\u043E\u043B\u044C\u043A\u043E \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430\u043C" });
  }
  next();
}
function sanitizeUser(u) {
  const order_count = orders.filter((o) => o.user_id === u.id).length;
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    role: u.role,
    account_status: u.account_status || "active",
    is_verified: u.is_verified,
    created_at: u.created_at,
    telegram_handle: u.telegram_handle || "",
    tg_id: u.tg_id || "",
    agreements: u.agreements,
    order_count
  };
}
app.post(["/api/auth/register", "/api/register", "/api/auth/register/"], async (req, res) => {
  try {
    const { email, username, password, terms_accepted, privacy_accepted, consent_accepted } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: "\u0417\u0430\u043F\u043E\u043B\u043D\u0438\u0442\u0435 \u0432\u0441\u0435 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u043F\u043E\u043B\u044F" });
    }
    if (!terms_accepted || !privacy_accepted || !consent_accepted) {
      return res.status(400).json({
        error: "\u0414\u043B\u044F \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438 \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C \u0432\u0441\u0435 3 \u0441\u043E\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u044F"
      });
    }
    const lowerEmail = String(email).toLowerCase().trim();
    const lowerUsername = String(username).trim();
    if (dbPool) {
      try {
        const [rows] = await dbPool.execute(
          "SELECT id FROM users WHERE LOWER(email) = ? OR LOWER(login) = ?",
          [lowerEmail, lowerUsername.toLowerCase()]
        );
        if (Array.isArray(rows) && rows.length > 0) {
          return res.status(400).json({ error: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0441 \u0442\u0430\u043A\u0438\u043C Email \u0438\u043B\u0438 \u041B\u043E\u0433\u0438\u043D\u043E\u043C \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442" });
        }
      } catch (dbErr) {
        console.error("[MySQL Register Check Error]", dbErr);
      }
    }
    const existingEmail = users.find((u) => u.email.toLowerCase() === lowerEmail);
    if (existingEmail) {
      return res.status(400).json({ error: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0441 \u0442\u0430\u043A\u0438\u043C Email \u0443\u0436\u0435 \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D" });
    }
    const existingUsername = users.find((u) => u.username.toLowerCase() === lowerUsername.toLowerCase());
    if (existingUsername) {
      return res.status(400).json({ error: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0441 \u0442\u0430\u043A\u0438\u043C \u041B\u043E\u0433\u0438\u043D\u043E\u043C \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442" });
    }
    const code = Math.floor(1e5 + Math.random() * 9e5).toString();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    verificationCodes.set(lowerEmail, {
      email: lowerEmail,
      code,
      expires_at: Date.now() + 15 * 60 * 1e3,
      // 15 mins
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
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0f172a; margin: 0 0 8px 0; font-size: 24px;">\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438</h2>
          <p style="color: #64748b; margin: 0; font-size: 15px;">\u0414\u043E\u0431\u0440\u043E \u043F\u043E\u0436\u0430\u043B\u043E\u0432\u0430\u0442\u044C \u0432 \u0441\u0435\u0440\u0432\u0438\u0441 BauSquad!</p>
        </div>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          \u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435, <strong>${lowerUsername}</strong>! \u0414\u043B\u044F \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0438\u044F \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0432\u0430\u0448\u0435\u0433\u043E \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430 \u043D\u0430 \u0441\u0430\u0439\u0442\u0435 <strong>bausquad.org</strong> \u0432\u0432\u0435\u0434\u0438\u0442\u0435 \u043A\u043E\u0434 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F:
        </p>
        <div style="background: #f1f5f9; border: 2px dashed #94a3b8; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1e293b; font-family: monospace;">${code}</span>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
          \u23F1 \u041A\u043E\u0434 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u0435\u043D \u0432 \u0442\u0435\u0447\u0435\u043D\u0438\u0435 15 \u043C\u0438\u043D\u0443\u0442.<br>
          \u0415\u0441\u043B\u0438 \u0432\u044B \u043D\u0435 \u0437\u0430\u043F\u0440\u0430\u0448\u0438\u0432\u0430\u043B\u0438 \u0434\u0430\u043D\u043D\u044B\u0439 \u043A\u043E\u0434, \u043F\u0440\u043E\u0441\u0442\u043E \u043F\u0440\u043E\u0438\u0433\u043D\u043E\u0440\u0438\u0440\u0443\u0439\u0442\u0435 \u044D\u0442\u043E \u043F\u0438\u0441\u044C\u043C\u043E.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
          \u0421\u043B\u0443\u0436\u0431\u0430 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0438 BauSquad &bull; bausquad.org
        </p>
      </div>
    `;
    const mailResult = await sendEmailNotification(
      lowerEmail,
      `\u041A\u043E\u0434 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438 BauSquad: ${code}`,
      emailHtml
    );
    return res.json({
      message: mailResult.success ? "\u041A\u043E\u0434 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D \u043D\u0430 \u0432\u0430\u0448\u0443 \u043F\u043E\u0447\u0442\u0443" : "\u041A\u043E\u0434 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F \u0441\u0433\u0435\u043D\u0435\u0440\u0438\u0440\u043E\u0432\u0430\u043D (\u043F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0442\u0430\u043A\u0436\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 SMTP \u0432 .env)",
      email: lowerEmail,
      smtp_sent: mailResult.success,
      smtp_error: mailResult.error || null
    });
  } catch (err) {
    console.error("[Register API Error]", err);
    return res.status(500).json({ error: err?.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430 \u043F\u0440\u0438 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438" });
  }
});
app.post(["/api/auth/verify-code", "/api/verify-code", "/api/auth/verify-code/"], async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "\u0423\u043A\u0430\u0436\u0438\u0442\u0435 email \u0438 \u043A\u043E\u0434 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F" });
    }
    const lowerEmail = String(email).toLowerCase().trim();
    const record = verificationCodes.get(lowerEmail);
    if (!record) {
      return res.status(400).json({ error: "\u041A\u043E\u0434 \u043D\u0435 \u0437\u0430\u043F\u0440\u0430\u0448\u0438\u0432\u0430\u043B\u0441\u044F \u0438\u043B\u0438 \u0441\u0440\u043E\u043A \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u0438\u0441\u0442\u0451\u043A" });
    }
    if (record.code !== String(code).trim()) {
      return res.status(400).json({ error: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043A\u043E\u0434 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F" });
    }
    if (record.expires_at < Date.now()) {
      verificationCodes.delete(lowerEmail);
      return res.status(400).json({ error: "\u0421\u0440\u043E\u043A \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u043A\u043E\u0434\u0430 \u0438\u0441\u0442\u0451\u043A. \u0417\u0430\u043F\u0440\u043E\u0441\u0438\u0442\u0435 \u043D\u043E\u0432\u044B\u0439." });
    }
    const newUser = {
      id: `usr-${Date.now()}`,
      email: record.payload.email,
      username: record.payload.username,
      passwordHash: record.payload.passwordHash,
      role: "customer",
      account_status: "active",
      is_verified: true,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
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
        const hashedPassword = import_bcryptjs.default.hashSync(newUser.passwordHash, 10);
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
        console.error("[MySQL Save User Error]", dbErr);
      }
    }
    users.push(newUser);
    verificationCodes.delete(lowerEmail);
    const access_token = generateToken(newUser.id, newUser.role, "access");
    const refresh_token = generateToken(newUser.id, newUser.role, "refresh");
    return res.json({
      message: "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430",
      user: sanitizeUser(newUser),
      tokens: {
        access_token,
        refresh_token,
        token_type: "Bearer",
        expires_in: 1800
      }
    });
  } catch (err) {
    console.error("[Verify Code Error]", err);
    return res.status(500).json({ error: err?.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430 \u043F\u0440\u0438 \u0437\u0430\u0432\u0435\u0440\u0435\u043D\u0438\u0438 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438" });
  }
});
app.post(["/api/auth/login", "/api/login", "/api/auth/login/"], async (req, res) => {
  try {
    const { login_identifier, password } = req.body;
    if (!login_identifier || !password) {
      return res.status(400).json({ error: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 Email/\u041B\u043E\u0433\u0438\u043D \u0438 \u041F\u0430\u0440\u043E\u043B\u044C" });
    }
    const query = String(login_identifier).toLowerCase().trim();
    let user = users.find((u) => u.email.toLowerCase() === query || u.username.toLowerCase() === query);
    if (dbPool) {
      try {
        const [rows] = await dbPool.execute(
          "SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(login) = ? LIMIT 1",
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
              role: row.role === "admin" ? "admin" : "customer",
              account_status: row.account_status || "active",
              is_verified: !!row.is_verified,
              created_at: row.registration_date || (/* @__PURE__ */ new Date()).toISOString(),
              telegram_handle: row.telegram_handle || "",
              tg_id: row.tg_id || "",
              agreements: {
                terms_accepted: !!row.user_agreement,
                terms_accepted_at: row.user_agreement_date || (/* @__PURE__ */ new Date()).toISOString(),
                privacy_accepted: !!row.privacy_agreement,
                privacy_accepted_at: row.privacy_agreement_date || (/* @__PURE__ */ new Date()).toISOString(),
                consent_accepted: !!row.processing_personal_data_agreement,
                consent_accepted_at: row.processing_personal_data_agreement_date || (/* @__PURE__ */ new Date()).toISOString()
              }
            };
            const existingIdx = users.findIndex((u) => u.id === user?.id || u.email.toLowerCase() === query || u.username.toLowerCase() === query);
            if (existingIdx >= 0) {
              users[existingIdx] = user;
            } else {
              users.push(user);
            }
          }
        }
      } catch (dbErr) {
        console.error("[MySQL Login Check Error]", dbErr);
      }
    }
    if (!user) {
      return res.status(400).json({ error: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043B\u043E\u0433\u0438\u043D \u0438\u043B\u0438 \u043F\u0430\u0440\u043E\u043B\u044C" });
    }
    const isPassCorrect = verifyPassword(password, user.passwordHash);
    if (!isPassCorrect) {
      return res.status(400).json({ error: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043B\u043E\u0433\u0438\u043D \u0438\u043B\u0438 \u043F\u0430\u0440\u043E\u043B\u044C" });
    }
    const access_token = generateToken(user.id, user.role, "access");
    const refresh_token = generateToken(user.id, user.role, "refresh");
    return res.json({
      user: sanitizeUser(user),
      tokens: {
        access_token,
        refresh_token,
        token_type: "Bearer",
        expires_in: 1800
      }
    });
  } catch (err) {
    console.error("[Login Error]", err);
    return res.status(500).json({ error: err?.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430 \u043F\u0440\u0438 \u0432\u0445\u043E\u0434\u0435" });
  }
});
app.post("/api/auth/refresh", (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ error: "Refresh token \u043D\u0435 \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D" });
  }
  const payload = verifyToken(refresh_token);
  if (!payload || payload.type !== "refresh") {
    return res.status(401).json({ error: "\u041D\u0435\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 refresh token" });
  }
  const user = users.find((u) => u.id === payload.userId);
  if (!user) {
    return res.status(401).json({ error: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
  }
  const access_token = generateToken(user.id, user.role, "access");
  const new_refresh_token = generateToken(user.id, user.role, "refresh");
  return res.json({
    access_token,
    refresh_token: new_refresh_token,
    token_type: "Bearer",
    expires_in: 1800
  });
});
app.get(["/api/auth/me", "/api/profile", "/api/user/me", "/api/me"], authenticateUser, (req, res) => {
  const user = req.user;
  return res.json({ user: sanitizeUser(user) });
});
app.all(["/api/profile", "/api/user/profile"], authenticateUser, async (req, res, next) => {
  if (req.method !== "PUT" && req.method !== "POST" && req.method !== "PATCH") {
    return next();
  }
  const user = req.user;
  const { username, new_password, telegram_handle } = req.body;
  if (username && username.trim().length >= 3) {
    const existing = users.find((u) => u.username.toLowerCase() === username.toLowerCase() && u.id !== user.id);
    if (existing) {
      return res.status(400).json({ error: "\u042D\u0442\u043E\u0442 \u043B\u043E\u0433\u0438\u043D \u0443\u0436\u0435 \u0437\u0430\u043D\u044F\u0442 \u0434\u0440\u0443\u0433\u0438\u043C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u043C" });
    }
    user.username = username.trim();
  }
  if (new_password && new_password.length >= 6) {
    user.passwordHash = new_password;
  }
  if (telegram_handle !== void 0) {
    user.telegram_handle = String(telegram_handle).replace(/^@/, "").trim();
  }
  if (dbPool) {
    try {
      await dbPool.execute(
        "UPDATE users SET login = ?, password_hash = ?, telegram_handle = ? WHERE email = ?",
        [user.username, user.passwordHash, user.telegram_handle || null, user.email]
      );
    } catch (dbErr) {
      console.error("[MySQL Profile Update Error]", dbErr);
    }
  }
  return res.json({
    message: "\u041F\u0440\u043E\u0444\u0438\u043B\u044C \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D",
    user: sanitizeUser(user)
  });
});
app.get("/api/orders", authenticateUser, async (req, res) => {
  const user = req.user;
  if (dbPool) {
    try {
      const numericUserId = parseInt(user.id.replace(/\D/g, ""), 10);
      let query = `
        SELECT o.order_id, o.client_id, o.subject, o.description, o.deadline, o.created_at, o.status, o.contact,
               p.client_price, p.executer_price, u.login as username, u.email
        FROM orders o
        LEFT JOIN payments p ON o.order_id = p.order_id
        LEFT JOIN users u ON o.client_id = u.id
      `;
      let params = [];
      if (user.role !== "admin" && !isNaN(numericUserId)) {
        query += ` WHERE o.client_id = ?`;
        params.push(numericUserId);
      }
      query += ` ORDER BY o.order_id DESC`;
      const [rows] = await dbPool.execute(query, params);
      if (Array.isArray(rows) && rows.length > 0) {
        const dbOrders = rows.map((r) => ({
          id: `ord-${r.order_id}`,
          title: r.subject,
          description: r.description || "",
          deadline: r.deadline || "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D",
          price: r.client_price ? `${r.client_price} \u20BD` : void 0,
          client_price: r.client_price ? `${r.client_price} \u20BD` : void 0,
          executer_price: r.executer_price ? `${r.executer_price} \u20BD` : void 0,
          contact: r.contact || "",
          status: r.status,
          created_at: r.created_at ? new Date(r.created_at).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
          updated_at: r.created_at ? new Date(r.created_at).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
          user_id: String(r.client_id),
          user_email: r.email || "",
          user_username: r.username || "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C",
          files: []
        }));
        return res.json({ orders: dbOrders });
      }
    } catch (dbErr) {
      console.error("[MySQL Get Orders Error]", dbErr);
    }
  }
  if (user.role === "admin") {
    return res.json({ orders });
  } else {
    const userOrders = orders.filter((o) => o.user_id === user.id);
    return res.json({ orders: userOrders });
  }
});
app.post("/api/orders", async (req, res) => {
  try {
    let user = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const payload = verifyToken(token);
      if (payload && payload.type === "access") {
        user = users.find((u) => u.id === payload.userId) || null;
      }
    }
    if (user && user.account_status === "banned") {
      return res.status(403).json({
        error: "\u0412\u0430\u0448 \u0430\u043A\u043A\u0430\u0443\u043D\u0442 \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u043E\u043C. \u0412\u044B \u043D\u0435 \u043C\u043E\u0436\u0435\u0442\u0435 \u0441\u043E\u0437\u0434\u0430\u0432\u0430\u0442\u044C \u043D\u043E\u0432\u044B\u0435 \u0437\u0430\u043A\u0430\u0437\u044B."
      });
    }
    const { title, description, deadline, price, contact, files, terms_accepted, privacy_accepted, consent_accepted } = req.body;
    if (!title || !description || !contact) {
      return res.status(400).json({ error: "\u0417\u0430\u043F\u043E\u043B\u043D\u0438\u0442\u0435 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u043F\u043E\u043B\u044F: \u041F\u0440\u0435\u0434\u043C\u0435\u0442, \u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435, \u041A\u043E\u043D\u0442\u0430\u043A\u0442" });
    }
    if (!user) {
      if (!terms_accepted || !privacy_accepted || !consent_accepted) {
        return res.status(400).json({
          error: "\u0414\u043B\u044F \u043E\u0444\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u044F \u0437\u0430\u043A\u0430\u0437\u0430 \u0431\u0435\u0437 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438 \u0432\u044B \u043E\u0431\u044F\u0437\u0430\u043D\u044B \u0441\u043E\u0433\u043B\u0430\u0441\u0438\u0442\u044C\u0441\u044F \u0441 \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u0441\u043A\u0438\u043C \u0441\u043E\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u0435\u043C, \u041F\u043E\u043B\u0438\u0442\u0438\u043A\u043E\u0439 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438 \u0438 \u0421\u043E\u0433\u043B\u0430\u0441\u0438\u0435\u043C \u043D\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0443 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445."
        });
      }
    }
    const processedFiles = [];
    const telegramAttachments = [];
    if (Array.isArray(files) && files.length > 0) {
      for (let idx = 0; idx < files.length; idx++) {
        const fileItem = files[idx];
        const rawName = String(fileItem.name || `file_${idx + 1}`).trim();
        const safeName = rawName.replace(/[^a-zA-Z0-9._\-\u0400-\u04FF]/g, "_");
        const mimeType = String(fileItem.type || "application/octet-stream");
        let fileBuffer = null;
        if (fileItem.data && typeof fileItem.data === "string") {
          try {
            const matches = fileItem.data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            const base64Content = matches ? matches[2] : fileItem.data;
            fileBuffer = Buffer.from(base64Content, "base64");
          } catch (b64Err) {
            console.error("[Base64 Decode Error]", rawName, b64Err);
          }
        }
        const isPhoto = isPhotoAttachment(safeName, mimeType);
        let fileUrl = fileItem.url || "";
        if (fileBuffer) {
          const timestamp = Date.now();
          const diskFilename = `ord_${timestamp}_${idx}_${safeName}`;
          const diskPath = import_path.default.join(uploadsDir, diskFilename);
          try {
            import_fs.default.writeFileSync(diskPath, fileBuffer);
            fileUrl = `/uploads/${diskFilename}`;
          } catch (writeErr) {
            console.error("[File Save to Disk Error]", diskFilename, writeErr);
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
          uploaded_at: fileItem.uploaded_at || (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    }
    const newOrder = {
      id: `ord-${Math.floor(1e3 + Math.random() * 9e3)}`,
      title,
      description,
      deadline: deadline || "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D",
      price: price || "\u041D\u0430 \u043E\u0431\u0441\u0443\u0436\u0434\u0435\u043D\u0438\u0438",
      client_price: price || "\u041D\u0430 \u043E\u0431\u0441\u0443\u0436\u0434\u0435\u043D\u0438\u0438",
      contact,
      status: "new",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString(),
      user_id: user ? user.id : "guest",
      user_email: user ? user.email : contact,
      user_username: user ? user.username : "\u0413\u043E\u0441\u0442\u044C (\u0411\u0435\u0437 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438)",
      is_guest: !user,
      guest_agreements: !user ? {
        terms_accepted: true,
        privacy_accepted: true,
        consent_accepted: true,
        agreements_accepted_at: (/* @__PURE__ */ new Date()).toISOString()
      } : void 0,
      files: processedFiles
    };
    let numericOrderId = null;
    if (dbPool) {
      try {
        let numericClientId = null;
        if (user) {
          const [userRows] = await dbPool.execute(
            "SELECT id FROM users WHERE LOWER(email) = ? OR LOWER(login) = ? LIMIT 1",
            [user.email.toLowerCase().trim(), user.username.toLowerCase().trim()]
          );
          if (Array.isArray(userRows) && userRows.length > 0) {
            numericClientId = userRows[0].id;
          }
        }
        const finalClientId = numericClientId || 1;
        const guestEmailVal = user ? user.email : contact.includes("@") ? contact.trim() : contact.startsWith("+") || contact.startsWith("8") ? contact.trim() : null;
        try {
          const [dupRows] = await dbPool.execute(
            "SELECT order_id FROM orders WHERE client_id = ? AND subject = ? AND description = ? AND contact = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 15 SECOND) ORDER BY order_id DESC LIMIT 1",
            [finalClientId, title.trim(), description.trim(), contact.trim()]
          );
          if (Array.isArray(dupRows) && dupRows.length > 0) {
            return res.status(200).json({
              message: "\u0417\u0430\u043A\u0430\u0437 \u0443\u0436\u0435 \u043F\u0440\u0438\u043D\u044F\u0442 \u0432 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0443",
              order_id: String(dupRows[0].order_id),
              duplicate: true
            });
          }
        } catch (dupErr) {
        }
        try {
          const [insertResult] = await dbPool.execute(
            `INSERT INTO orders (
              client_id, subject, description, deadline, contact, source, status,
              terms_accepted, privacy_accepted, consent_accepted, agreements_accepted_at, guest_email, created_at
            ) VALUES (?, ?, ?, ?, ?, 'website', 'new', 1, 1, 1, NOW(), ?, NOW())`,
            [
              finalClientId,
              title.trim(),
              description.trim(),
              deadline || "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D",
              contact.trim(),
              guestEmailVal
            ]
          );
          if (insertResult && insertResult.insertId) {
            numericOrderId = insertResult.insertId;
            newOrder.id = String(insertResult.insertId);
            console.log(`[MySQL Orders] Successfully inserted order into DB with order_id: ${numericOrderId} (agreements confirmed)`);
          }
        } catch (firstErr) {
          console.warn("[MySQL Order Insert] Full insert failed, attempting standard schema insert:", firstErr?.message || firstErr);
          const [fallbackResult] = await dbPool.execute(
            `INSERT INTO orders (client_id, subject, description, deadline, contact, source, status, created_at)
             VALUES (?, ?, ?, ?, ?, 'website', 'new', NOW())`,
            [
              finalClientId,
              title.trim(),
              description.trim(),
              deadline || "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D",
              contact.trim()
            ]
          );
          if (fallbackResult && fallbackResult.insertId) {
            numericOrderId = fallbackResult.insertId;
            newOrder.id = String(fallbackResult.insertId);
            console.log(`[MySQL Orders] Fallback inserted order with order_id: ${numericOrderId}`);
          }
        }
        if (numericOrderId) {
          try {
            await dbPool.execute(
              "INSERT INTO payments (order_id, client_price, executer_price) VALUES (?, 0.00, 0.00) ON DUPLICATE KEY UPDATE client_price = VALUES(client_price)",
              [numericOrderId]
            );
          } catch (payErr) {
            console.warn("[Payments Insert Notice]:", payErr);
          }
        }
      } catch (dbErr) {
        console.error("[MySQL Order Insert Error]", dbErr?.message || dbErr);
      }
    }
    orders.unshift(newOrder);
    const userFirstName = user ? user.username : "\u0413\u043E\u0441\u0442\u044C";
    const userTgHandle = user?.telegram_handle || (contact.startsWith("@") ? contact.replace(/^@/, "") : void 0);
    const tgMessage = getOrderText({
      order_id: numericOrderId || newOrder.id.replace(/\D/g, "") || void 0,
      user: {
        first_name: userFirstName,
        last_name: "",
        username: userTgHandle
      },
      subject: newOrder.title,
      description: newOrder.description,
      deadline: newOrder.deadline,
      contact: newOrder.contact
    });
    await sendTelegramOrderNotification(tgMessage, telegramAttachments, numericOrderId || newOrder.id.replace(/\D/g, ""));
    return res.json({
      message: "\u0417\u0430\u043A\u0430\u0437 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043E\u0437\u0434\u0430\u043D \u0438 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D \u0432 BauSquad",
      order: newOrder,
      telegram_notified: true
    });
  } catch (err) {
    console.error("[Create Order Error]", err);
    return res.status(500).json({ error: err?.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u0437\u0430\u043A\u0430\u0437\u0430" });
  }
});
app.patch("/api/orders/:id/status", authenticateUser, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ["new", "assigned", "in_progress", "revision", "rework", "completed", "closed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "\u041D\u0435\u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u044B\u0439 \u0441\u0442\u0430\u0442\u0443\u0441 \u0437\u0430\u043A\u0430\u0437\u0430" });
  }
  const order = orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: "\u0417\u0430\u043A\u0430\u0437 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
  }
  if (order.status === "closed") {
    return res.status(400).json({ error: "\u0417\u0430\u043A\u0430\u0437 \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D (\u0441\u0442\u0430\u0442\u0443\u0441 closed). \u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u043D\u0435\u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E \u0432\u043D\u0435\u0441\u0442\u0438." });
  }
  order.status = status;
  order.updated_at = (/* @__PURE__ */ new Date()).toISOString();
  if (dbPool) {
    try {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);
      if (!isNaN(numericId)) {
        await dbPool.execute("UPDATE orders SET status = ? WHERE order_id = ?", [status, numericId]);
      }
    } catch (err) {
      console.error("[MySQL Status Update Error]", err);
    }
  }
  const tgMsg = `\u{1F514} <b>\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u0441\u0442\u0430\u0442\u0443\u0441\u0430 \u0437\u0430\u043A\u0430\u0437\u0430 #${id}</b>

<b>\u041D\u043E\u0432\u044B\u0439 \u0441\u0442\u0430\u0442\u0443\u0441:</b> ${status}
<b>\u0417\u0430\u043A\u0430\u0437:</b> ${order.title}
<b>\u041A\u043B\u0438\u0435\u043D\u0442:</b> ${order.user_username} (${order.contact})`;
  sendTelegramNotification(tgMsg);
  return res.json({
    message: `\u0421\u0442\u0430\u0442\u0443\u0441 \u0437\u0430\u043A\u0430\u0437\u0430 #${id} \u0438\u0437\u043C\u0435\u043D\u0451\u043D \u043D\u0430 ${status}`,
    order
  });
});
app.patch("/api/orders/:id/prices", authenticateUser, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { client_price, executer_price } = req.body;
  const order = orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: "\u0417\u0430\u043A\u0430\u0437 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
  }
  if (order.status === "closed") {
    return res.status(400).json({ error: "\u0417\u0430\u043A\u0430\u0437 \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D (\u0441\u0442\u0430\u0442\u0443\u0441 closed). \u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u0446\u0435\u043D \u043D\u0435\u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E." });
  }
  if (client_price !== void 0) {
    order.client_price = String(client_price);
    order.price = String(client_price);
  }
  if (executer_price !== void 0) {
    order.executer_price = String(executer_price);
  }
  order.updated_at = (/* @__PURE__ */ new Date()).toISOString();
  if (dbPool) {
    try {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);
      if (!isNaN(numericId)) {
        await dbPool.execute(
          `INSERT INTO payments (order_id, client_price, executer_price)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE client_price = VALUES(client_price), executer_price = VALUES(executer_price)`,
          [numericId, parseFloat(client_price) || 0, parseFloat(executer_price) || 0]
        );
      }
    } catch (err) {
      console.error("[MySQL Price Update Error]", err);
    }
  }
  const tgMsg = `\u{1F4B0} <b>\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435 \u0441\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u0438 \u0437\u0430\u043A\u0430\u0437\u0430 #${id}</b>

<b>\u0426\u0435\u043D\u0430 \u0434\u043B\u044F \u043A\u043B\u0438\u0435\u043D\u0442\u0430:</b> ${order.client_price || "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u0430"}
<b>\u0426\u0435\u043D\u0430 \u0434\u043B\u044F \u0438\u0441\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044F:</b> ${order.executer_price || "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u0430"}
<b>\u0417\u0430\u043A\u0430\u0437:</b> ${order.title}`;
  sendTelegramNotification(tgMsg);
  return res.json({
    message: `\u0426\u0435\u043D\u044B \u0434\u043B\u044F \u0437\u0430\u043A\u0430\u0437\u0430 #${id} \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u044B`,
    order
  });
});
app.get("/api/admin/users", authenticateUser, requireAdmin, (req, res) => {
  const sanitized = users.map((u) => sanitizeUser(u));
  return res.json({ users: sanitized });
});
app.patch("/api/admin/users/:id/role", authenticateUser, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (role !== "customer" && role !== "admin") {
    return res.status(400).json({ error: "\u041D\u0435\u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u0430\u044F \u0440\u043E\u043B\u044C" });
  }
  const user = users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
  }
  user.role = role;
  return res.json({
    message: `\u0420\u043E\u043B\u044C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F ${user.username} \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0430 \u043D\u0430 ${role}`,
    user: sanitizeUser(user)
  });
});
app.patch("/api/admin/users/:id/status", authenticateUser, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { account_status } = req.body;
  if (!["active", "banned", "deleted"].includes(account_status)) {
    return res.status(400).json({ error: "\u041D\u0435\u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u044B\u0439 \u0441\u0442\u0430\u0442\u0443\u0441 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430" });
  }
  const user = users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
  }
  user.account_status = account_status;
  return res.json({
    message: `\u0421\u0442\u0430\u0442\u0443\u0441 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430 ${user.username} \u0438\u0437\u043C\u0435\u043D\u0451\u043D \u043D\u0430 ${account_status}`,
    user: sanitizeUser(user)
  });
});
app.delete("/api/admin/users/:id", authenticateUser, requireAdmin, (req, res) => {
  const { id } = req.params;
  const currentUser = req.user;
  if (id === currentUser.id) {
    return res.status(400).json({ error: "\u0412\u044B \u043D\u0435 \u043C\u043E\u0436\u0435\u0442\u0435 \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0430\u043A\u043A\u0430\u0443\u043D\u0442" });
  }
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
  }
  const deleted = users.splice(index, 1)[0];
  return res.json({ message: `\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C ${deleted.username} \u0443\u0434\u0430\u043B\u0435\u043D` });
});
app.get("/api/admin/stats", authenticateUser, requireAdmin, (req, res) => {
  const stats = {
    total_users: users.length,
    total_orders: orders.length,
    orders_new: orders.filter((o) => o.status === "new").length,
    orders_in_progress: orders.filter((o) => o.status === "in_progress").length,
    orders_revision: orders.filter((o) => o.status === "revision").length,
    orders_completed: orders.filter((o) => o.status === "completed").length,
    orders_cancelled: orders.filter((o) => o.status === "cancelled").length,
    telegram_bot_connected: true,
    smtp_status: "Active (Gmail SMTP)",
    system_uptime: `${Math.floor(process.uptime() / 60)} \u043C\u0438\u043D.`,
    telegram_recent_logs: telegramLogs.slice(0, 5)
  };
  return res.json(stats);
});
app.post("/api/support", async (req, res) => {
  try {
    const { contact, message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u043F\u0443\u0441\u0442\u044B\u043C" });
    }
    if (dbPool) {
      try {
        await dbPool.execute(
          `INSERT INTO support_requests (client_id, message, status, created_at)
           VALUES ((SELECT id FROM users WHERE contact = ? LIMIT 1), ?, 'new', NOW())`,
          [contact || "\u0413\u043E\u0441\u0442\u044C", message]
        );
      } catch (err) {
        console.error("[MySQL Support Request Error]", err);
      }
    }
    const tgMsg = `\u{1F4AC} <b>\u041D\u043E\u0432\u043E\u0435 \u043E\u0431\u0440\u0430\u0449\u0435\u043D\u0438\u0435 \u0432 \u0442\u0435\u0445\u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0443 BauSquad</b>

<b>\u041A\u043E\u043D\u0442\u0430\u043A\u0442:</b> ${contact || "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"}
<b>\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435:</b> ${message}
<b>\u0414\u0430\u0442\u0430:</b> ${(/* @__PURE__ */ new Date()).toLocaleString("ru-RU")}`;
    await sendTelegramNotification(tgMsg);
    return res.json({ message: "\u041E\u0431\u0440\u0430\u0449\u0435\u043D\u0438\u0435 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E" });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u043E\u0431\u0440\u0430\u0449\u0435\u043D\u0438\u044F" });
  }
});
app.get("/api/agreements", (req, res) => {
  return res.json({
    terms: {
      id: "terms",
      title: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u0441\u043A\u043E\u0435 \u0441\u043E\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u0435",
      version: "2.1",
      last_updated: "2026-01-10",
      sections: [
        {
          heading: "1. \u041E\u0431\u0449\u0438\u0435 \u043F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u044F",
          content: "\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430 BauSquad \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u0442 \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u043E\u043D\u043D\u043E-\u043A\u043E\u043D\u0441\u0443\u043B\u044C\u0442\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0435 \u0443\u0441\u043B\u0443\u0433\u0438 \u043F\u043E \u0441\u043E\u043F\u0440\u043E\u0432\u043E\u0436\u0434\u0435\u043D\u0438\u044E \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432 \u043F\u0440\u0438 \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0435 \u0430\u043A\u0430\u0434\u0435\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u0438 \u043D\u0430\u0443\u0447\u043D\u043E-\u0438\u0441\u0441\u043B\u0435\u0434\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u0441\u043A\u0438\u0445 \u0440\u0430\u0431\u043E\u0442."
        },
        {
          heading: "2. \u041F\u043E\u0440\u044F\u0434\u043E\u043A \u043E\u0444\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u044F \u0438 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F \u0437\u0430\u043A\u0430\u0437\u043E\u0432",
          content: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0444\u043E\u0440\u043C\u0438\u0440\u0443\u0435\u0442 \u0437\u0430\u044F\u0432\u043A\u0443 \u0441 \u0443\u043A\u0430\u0437\u0430\u043D\u0438\u0435\u043C \u043F\u0440\u0435\u0434\u043C\u0435\u0442\u0430, \u043F\u043E\u0434\u0440\u043E\u0431\u043D\u043E\u0433\u043E \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u044F, \u0441\u0440\u043E\u043A\u043E\u0432 \u0438 \u0441\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u0438. \u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430 \u043E\u0431\u0435\u0441\u043F\u0435\u0447\u0438\u0432\u0430\u0435\u0442 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0435 \u043F\u0435\u0440\u0435\u0434\u0430\u0447\u0443 \u0443\u0441\u043B\u043E\u0432\u0438\u0439 \u0438\u0441\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044F\u043C."
        },
        {
          heading: "3. \u0413\u0430\u0440\u0430\u043D\u0442\u0438\u0438 \u0438 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u044C",
          content: "BauSquad \u0433\u0430\u0440\u0430\u043D\u0442\u0438\u0440\u0443\u0435\u0442 \u043F\u043E\u043B\u043D\u0443\u044E \u0430\u043D\u043E\u043D\u0438\u043C\u043D\u043E\u0441\u0442\u044C \u043A\u043B\u0438\u0435\u043D\u0442\u0430. \u0412\u0441\u0435 \u043F\u0435\u0440\u0435\u0434\u0430\u043D\u043D\u044B\u0435 \u0444\u0430\u0439\u043B\u044B \u0438 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E\u0442\u0441\u044F \u0438\u0441\u043A\u043B\u044E\u0447\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0434\u043B\u044F \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F \u0442\u0435\u043A\u0443\u0449\u0435\u0433\u043E \u0437\u0430\u043A\u0430\u0437\u0430."
        }
      ]
    },
    privacy: {
      id: "privacy",
      title: "\u041F\u043E\u043B\u0438\u0442\u0438\u043A\u0430 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438",
      version: "2.0",
      last_updated: "2026-01-10",
      sections: [
        {
          heading: "1. \u0421\u0431\u043E\u0440 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445",
          content: "\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430 \u043E\u0431\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0435\u0442 \u0438\u0441\u043A\u043B\u044E\u0447\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0439 \u043D\u0430\u0431\u043E\u0440 \u0434\u0430\u043D\u043D\u044B\u0445: \u0430\u0434\u0440\u0435\u0441 \u044D\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u043E\u0439 \u043F\u043E\u0447\u0442\u044B, \u0443\u043A\u0430\u0437\u0430\u043D\u043D\u044B\u0439 \u043B\u043E\u0433\u0438\u043D \u0438 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u044B\u0439 Telegram/\u0442\u0435\u043B\u0435\u0444\u043E\u043D \u0434\u043B\u044F \u0441\u0432\u044F\u0437\u0438 \u043F\u043E \u0437\u0430\u043A\u0430\u0437\u0443."
        },
        {
          heading: "2. \u0425\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u0438 \u0448\u0438\u0444\u0440\u043E\u0432\u0430\u043D\u0438\u0435",
          content: "\u041F\u0430\u0440\u043E\u043B\u0438 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439 \u0445\u0440\u0430\u043D\u044F\u0442\u0441\u044F \u0441\u0442\u0440\u043E\u0433\u043E \u0432 \u0432\u0438\u0434\u0435 bcrypt-\u0445\u044D\u0448\u0435\u0439. \u041F\u0435\u0440\u0435\u0434\u0430\u0447\u0430 \u0434\u0430\u043D\u043D\u044B\u0445 \u043E\u0441\u0443\u0449\u0435\u0441\u0442\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u043F\u043E \u0437\u0430\u0449\u0438\u0449\u0435\u043D\u043D\u043E\u043C\u0443 \u043F\u0440\u043E\u0442\u043E\u043A\u043E\u043B\u0443 HTTPS \u0441 \u0448\u0438\u0444\u0440\u043E\u0432\u0430\u043D\u0438\u0435\u043C TLS."
        }
      ]
    },
    consent: {
      id: "consent",
      title: "\u0421\u043E\u0433\u043B\u0430\u0441\u0438\u0435 \u043D\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0443 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445",
      version: "1.5",
      last_updated: "2026-01-10",
      sections: [
        {
          heading: "1. \u041F\u0440\u0435\u0434\u043C\u0435\u0442 \u0441\u043E\u0433\u043B\u0430\u0441\u0438\u044F",
          content: "\u041D\u0430\u0441\u0442\u043E\u044F\u0449\u0438\u043C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0434\u0430\u0451\u0442 \u0441\u0432\u043E\u0431\u043E\u0434\u043D\u043E, \u0441\u0432\u043E\u0435\u0439 \u0432\u043E\u043B\u0435\u0439 \u0438 \u0432 \u0441\u0432\u043E\u0435\u043C \u0438\u043D\u0442\u0435\u0440\u0435\u0441\u0435 \u0441\u043E\u0433\u043B\u0430\u0441\u0438\u0435 BauSquad \u043D\u0430 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u0443\u044E \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0443 \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445 \u043F\u0440\u0438 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438 \u0438 \u043E\u0444\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u0438 \u0437\u0430\u043A\u0430\u0437\u043E\u0432."
        }
      ]
    }
  });
});
app.post("/api/cookies", (req, res) => {
  const { preferences } = req.body;
  return res.json({
    message: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 cookie \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u044B",
    saved_at: (/* @__PURE__ */ new Date()).toISOString(),
    preferences
  });
});
app.post("/api/upload", (req, res) => {
  const sampleFiles = [
    {
      id: `file-${Date.now()}-1`,
      name: "\u0422\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u043E\u0435_\u0417\u0430\u0434\u0430\u043D\u0438\u0435_BauSquad.pdf",
      size: 1542e3,
      type: "application/pdf",
      url: "/uploads/sample_tz.pdf",
      uploaded_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  ];
  return res.json({
    message: "\u0424\u0430\u0439\u043B\u044B \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u044B",
    files: sampleFiles
  });
});
var uploadsPath = import_path.default.join(process.cwd(), "uploads");
if (import_fs.default.existsSync(uploadsPath)) {
  app.use("/uploads", import_express.default.static(uploadsPath));
}
var errorsPath = import_path.default.join(process.cwd(), "errors");
if (import_fs.default.existsSync(errorsPath)) {
  app.use("/errors", import_express.default.static(errorsPath));
}
app.get("/alarm.wav", (req, res) => {
  const filePath = import_path.default.join(process.cwd(), "alarm.wav");
  if (import_fs.default.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.status(404).send("Audio file not found");
});
app.get("/alarm.mp3", (req, res) => {
  const filePath = import_path.default.join(process.cwd(), "alarm.mp3");
  if (import_fs.default.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.status(404).send("Audio file not found");
});
app.all("/api/*", (req, res) => {
  console.warn(`[404 API Not Found] ${req.method} ${req.originalUrl}`);
  return res.status(404).json({
    error: `\u041C\u0430\u0440\u0448\u0440\u0443\u0442 API "${req.originalUrl}" \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435 BauSquad`
  });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    app.get("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) return next();
      try {
        const url = req.originalUrl;
        let template = import_fs.default.readFileSync(import_path.default.join(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    if (import_fs.default.existsSync(distPath)) {
      app.use(import_express.default.static(distPath, { maxAge: "1d" }));
    }
    app.get("*", (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) return next();
      const distIndex = import_path.default.join(distPath, "index.html");
      if (import_fs.default.existsSync(distIndex)) {
        res.sendFile(distIndex);
      } else {
        res.sendFile(import_path.default.join(process.cwd(), "index.html"));
      }
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[BauSquad Server] Server listening on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
