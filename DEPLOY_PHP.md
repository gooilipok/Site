# 🚀 Руководство по развертыванию BauSquad на PHP хостинге (включая RU-CENTER / nic.ru с папкой docs)

Данное руководство объясняет, как запустить сайт BauSquad на любом стандартном виртуальном хостинге с поддержкой **PHP (7.4, 8.0, 8.1, 8.2, 8.3)** и **MySQL** (например: **RU-CENTER / nic.ru**, **Beget**, **Timeweb**, **Reg.ru**, **cPanel**, **ISPmanager**).

---

## 📁 Структура файлов на хостинге

Если ваш хостинг (как в **RU-CENTER / nic.ru**) использует папку **`docs/`** как корневую папку сайта (DocumentRoot), все файлы бэкенда и фронтенда должны находиться внутри **`docs/`**:

```
папка_домена/
├── .env                          # Файл настроек (или внутри docs/.env)
└── docs/                         # КОРНЕВАЯ ВЕБ-ДИРЕКТОРИЯ ХОСТИНГА
    ├── .htaccess                 # Настройки перенаправления Apache (SPA + API)
    ├── index.html                # Скомпилированный фронтенд (React SPA)
    ├── assets/                   # Скомпилированные JS/CSS скрипты и стили
    ├── logo.svg                  # Логотипы и статические файлы
    ├── uploads/                  # Папка для загрузки вложений (права 755)
    │
    └── api/                      # 🐘 PHP БЭКЕНД (ОБЯЗАТЕЛЬНО ВНУТРИ docs/)
        ├── .htaccess             # Перенаправление запросов к index.php
        ├── index.php             # Главный REST API роутер
        ├── config.php            # Настройки и авто-чтение .env
        ├── db.php                # Подключение к базе данных PDO
        ├── jwt.php               # Авторизация и JWT токены
        ├── telegram.php          # Отправка заказов в Telegram (коллажи, фото, файлы)
        └── mail.php              # Отправка email кодов подтверждения (SMTP)
```

> ⚠️ **Важно**: Если папка `api/` или файл `.htaccess` окажутся снаружи папки `docs/` (на уровень выше), веб-сервер Apache не сможет их увидеть, и при отправке запросов сайт будет выдавать ошибку **«Нет связи с сервером»** или 404. Папка `api/` и `.htaccess` **всегда должны лежать прямо внутри `docs/` рядом с `index.html`**!

---

## ⚙️ Шаг 1. Настройка базы данных MySQL

1. Откройте панель управления хостингом и перейдите в **phpMyAdmin** (или раздел «Базы данных MySQL»).
2. Выберите вашу базу данных (например, `bau7824897_db`).
3. Перейдите во вкладку **«Импорт»** (Import) и загрузите файл `schema.sql`, либо выполните SQL-запрос из этого файла.
4. Будут созданы таблицы:
   - `users` — пользователи и администраторы (включая аккаунт администратора `BauAdmin` / пароль `admin123`)
   - `orders` — заказы с сохранением галочек соглашений и контактов
   - `payments` — цены для клиента и исполнителя
   - `support_requests` — обращения в техподдержку
   - `verification_codes` — одноразовые коды подтверждения почты

---

## ⚙️ Шаг 2. Настройка файла `.env`

Бэкенд PHP автоматически находит и загружает настройки из файла `.env`.
Вы можете поместить `.env` в папку `docs/.env` либо в корень сайта на уровень выше (`../.env`).

Содержимое файла `.env`:

```env
# App General
APP_NAME="BauSquad"
APP_ENV="production"
APP_URL="https://www.bausquad.org"
SECRET_KEY="f8d9a2b7c4e109831a"
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Server
PORT=3000
HOST="0.0.0.0"

# MySQL Database Configuration
MYSQL_HOST="mysql.hosting.nic.ru"
MYSQL_PORT=3306
MYSQL_DATABASE="bau7824897_db"
MYSQL_USER="bau7824897_mysql"
MYSQL_PASSWORD="AhTFV6g/"

# Telegram Bot API Settings
TELEGRAM_BOT_TOKEN="8655510215:AAHD2y49HbYoXn1lXVbu81sf77Ng9rUPuW8"
TELEGRAM_ADMIN_CHAT_ID="-1003817358324"
TELEGRAM_API_PROXY="https://odd.gooilipok2.workers.dev/"

# SMTP Mailer Settings
SMTP_HOST="mail.nic.ru"
SMTP_PORT=465
SMTP_USER="bausquadresponse@bausquad.org"
SMTP_PASSWORD="I*D8J2{W51zG(a^f"
SMTP_FROM="BauSquad <bausquadresponse@bausquad.org>"

# CORS Origins
ALLOWED_ORIGINS="http://localhost:3000,https://bausquad.org,https://www.bausquad.org,https://bausquad.ru,https://www.bausquad.ru"
```

*Все настройки подтягиваются автоматически без необходимости редактировать PHP файлы вручную.*

---

## ⚙️ Шаг 3. Загрузка файлов на хостинг

1. Скопируйте всё содержимое папки **`docs/`** в рабочую папку вашего домена на хостинге.
2. Убедитесь, что внутри лежат:
   - `docs/index.html`
   - `docs/.htaccess`
   - `docs/assets/`
   - `docs/api/` (со всеми файлами: `index.php`, `config.php`, `db.php`, `jwt.php`, `telegram.php`, `mail.php`, `.htaccess`)
   - `docs/uploads/` (установите права на запись `755` или `775`)
3. Загрузите файл `.env`.

---

## 🔍 Шаг 4. Проверка работоспособности бэкенда

После загрузки проверьте статус работы прямо в браузере:

- `https://ваш-домен.ru/api/health` — общая диагностика (должно вернуть `{"status":"ok", ...}`)
- `https://ваш-домен.ru/api/db/test` — тест чтения/записи базы данных
- `https://ваш-домен.ru/api/telegram/test` — тест отправки сообщения в Telegram чат
- `https://ваш-домен.ru/api/email/test?to=ваша_почта@mail.ru` — тест отправки письма через SMTP

---

## 🛠️ Решение проблемы «Нет связи с сервером»:

1. **Проверьте URL `/api/health`**: Откройте `https://bausquad.org/api/health` в браузере.
   - Если открывается белая страница, 404 или главная страница сайта — значит, папка `api/` или файл `.htaccess` не скопированы в папку `docs/` на хостинге.
   - Если возвращается JSON с `"status": "ok"` — бэкенд работает отлично!
2. **Проверьте `.htaccess`**: Убедитесь, что скрытый файл `docs/.htaccess` был загружен на хостинг (в некоторых FTP-клиентах скрытые файлы с точкой скрыты по умолчанию, включите «Показывать скрытые файлы / Show hidden files»).
3. **Права на папки**: Убедитесь, что для папки `docs/uploads/` установлены права `755`.
