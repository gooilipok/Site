# 🚀 Единое руководство по развёртыванию и сопровождению BauSquad

Данный документ содержит исчерпывающее описание архитектуры проекта, назначение каждого файла, пошаговое руководство по запуску на хостинге (**RU-CENTER / nic.ru**, **VPS** и любых PHP/MySQL серверах) и решение проблемы с таймаутом Telegram API.

---

## 📁 Подробная структура файлов проекта и их назначение

Проект спроектирован так, что может работать как на стандартном **PHP/MySQL хостинге** (через директорию `docs/` или корень `/`), так и на **Node.js VPS** (через `server.ts`).

| Файл / Каталог | Тип | Назначение и функции |
| :--- | :--- | :--- |
| **`api.php`** (и `docs/api.php`) | 🐘 PHP | **Главный REST API роутер**. Обрабатывает все входящие запросы к `/api/...`: двухэтапную регистрацию с подтверждением почты (`/auth/register`, `/auth/verify-code`), авторизацию (`/auth/login`, `/auth/refresh`, `/auth/me`), создание и список заказов (`/orders`), загрузку файлов (`/upload`), поддержку (`/support`) и сохранение согласий с законами РФ. |
| **`config.php`** (и `docs/config.php`) | ⚙️ PHP | **Загрузчик конфигурации и `.env`**. Автоматически находит и парсит файл `.env` на любом уровне вложенности. Инициализирует константы для MySQL, JWT, Telegram Bot API (включая прокси) и SMTP. |
| **`db.php`** (и `docs/db.php`) | 🗄️ PHP | **Слой работы с базой данных MySQL (PDO)**. Управляет подключением к СУБД, безопасными подготовленными запросами и функцией `ensureDatabaseSchema` для автоматического создания таблиц при первом запуске. |
| **`jwt.php`** (и `docs/jwt.php`) | 🔐 PHP | **Модуль аутентификации JWT**. Отвечает за генерацию, подпись HMAC-SHA256, расшифровку и проверку Access и Refresh токенов, а также извлечение токена из заголовка `Authorization: Bearer`. |
| **`telegram.php`** (и `docs/telegram.php`) | 🤖 PHP | **Сервис уведомлений Telegram Bot API**. Форматирует подробные карточки заказов, отправляет фото и документы в Telegram чат/канал, поддерживает **реверс-прокси (Cloudflare Worker)** и **cURL SOCKS5/HTTP прокси**, защищая сервер от зависаний сокетов и 502 Bad Gateway. |
| **`mail.php`** (и `docs/mail.php`) | 📧 PHP | **Модуль отправки Email**. Реализует прямое защищенное сокетное SMTP подключение через SSL/TLS (например, `mail.nic.ru:465`) с автоматическим резервным переключением на встроенную функцию PHP `mail()`. |
| **`diag.php`** (и `docs/diag.php`) | 🩺 PHP | **Панель системной диагностики хостинга**. Наглядно проверяет статус подключения к MySQL, права записи в папку загрузок `/uploads`, отправку почты, а также содержит **интерактивную форму тестирования Telegram API и произвольных Proxy**. |
| **`test.php`** (и `docs/test.php`) | 🧪 PHP | **Экспресс-тест PHP**. Возвращает легкий JSON с версией PHP, режимом SAPI и путями к DocumentRoot. |
| **`.htaccess`** (и `docs/.htaccess`) | 🌐 Apache | **Конфигурация веб-сервера**. Перенаправляет запросы к `/api/*` на `api.php`, защищает служебные файлы и направляет клиентские маршруты на `index.html` (SPA роутинг). |
| **`schema.sql`** | 🗄️ SQL | **Схема базы данных MySQL**. Содержит SQL-скрипт создания таблиц `users`, `orders`, `payments`, `support_requests`, `verification_codes` и начального администратора `BauAdmin`. |
| **`server.ts`** | 🟢 Node.js | **Full-stack Express сервер**. Используется для локальной разработки через Vite, а также для автономного запуска проекта на VPS в Node.js окружении. |
| **`src/`** | ⚛️ React 19 | **Исходный код фронтенда**. Компоненты, страницы (главная, регистрация, вход, профиль, админ-панель), контекст авторизации `AuthContext`, типы `types.ts` и стили Tailwind CSS. |
| **`public/`** | 📄 Статика | Юридические документы: `terms.html` (Пользовательское соглашение), `privacy.html` (Политика конфиденциальности), `consent.html` (Согласие на обработку ПДн), логотип `logo.svg`. |
| **`errors/`** | 🚫 Ошибки | Автономные HTML страницы ошибок 401, 403, 404, 500 для веб-серверов. |
| **`docs/`** | 📦 Сборка | **Готовый к размещению каталог сайта**. Содержит скомпилированный фронтенд и актуальные PHP скрипты, готовые для копирования в рабочую директорию хостинга nic.ru. |
| **`.env.example`** | 📋 Конфиг | Шаблон всех необходимых переменных окружения. |

---

## 🛠 Решение проблемы «Ошибка Telegram API: Connection timed out»

### Причина возникновения:
Хостинг-провайдеры в РФ (включая RU-CENTER / nic.ru) блокируют или фильтруют прямые TCP-соединения к `api.telegram.org:443`. Попытка прямого соединения приводит к таймауту сокета.

### ✅ Решение 1: Бесплатный Cloudflare Worker (Рекомендуется, 2 минуты)

Cloudflare предоставляет бесплатный запуск Workers, которые служат прозрачным HTTPS-прокси для Telegram API.

1. Зарегистрируйтесь / войдите в панель [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Перейдите в раздел **Workers & Pages** -> нажмите **Create Application** -> **Create Worker**.
3. Замените весь код воркера на следующий скрипт:

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Проксируем запрос на официальный Telegram API
    const targetUrl = 'https://api.telegram.org' + url.pathname + url.search;
    
    const newRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });

    return fetch(newRequest);
  }
};
```

4. Нажмите **Deploy**. Вы получите адрес воркера вида `https://ВАШ_ВОРКЕР.workers.dev/` (например, `https://odd.gooilipok2.workers.dev/`).
5. **(Важно для РФ)**: Если домен `*.workers.dev` также блокируется вашим провайдером, в настройках воркера в Cloudflare (вкладка **Settings** -> **Domains & Routes**) нажмите **Add** -> **Custom Domain** и привяжите любой поддомен вашего домена (например, `tg.bausquad.org`).
6. Укажите полученный адрес в файле `.env` на сервере:
```env
TELEGRAM_API_PROXY="https://odd.gooilipok2.workers.dev/"
# Или ваш привязанный поддомен:
# TELEGRAM_API_PROXY="https://tg.bausquad.org/"
```
7. Откройте страницу диагностики `https://bausquad.org/diag.php`, в блоке Telegram введите адрес прокси и нажмите **«Проверить (getMe)»** — вы увидите статус `OK` и имя вашего бота!

---

### ✅ Решение 2: Использование SOCKS5 или HTTP прокси

Если у вас есть сервер-прокси, вы можете указать его в `.env`:
```env
TELEGRAM_CURL_PROXY="socks5://user:password@ip_адрес:порт"
# или обычный HTTP прокси:
# TELEGRAM_CURL_PROXY="http://ip_адрес:порт"
```
Модуль `telegram.php` автоматически передаст параметры в `CURLOPT_PROXY`.

---

## 🚀 Пошаговое развёртывание на хостинге (RU-CENTER / nic.ru)

### Шаг 1. Настройка базы данных MySQL
1. В панели хостинга nic.ru откройте **phpMyAdmin**.
2. Выберите вашу базу данных `bau7824897_db`.
3. Во вкладке **«Импорт»** загрузите файл `schema.sql`.

### Шаг 2. Загрузка файлов
1. Скопируйте всё содержимое каталога **`docs/`** в корневую веб-папку вашего домена на хостинге (обычно `/home/login/bausquad.org/docs/` или `/public_html/`).
2. Создайте файл `.env` в этой папке со своими параметрами:

```env
# Параметры базы данных MySQL
MYSQL_HOST="mysql.hosting.nic.ru"
MYSQL_PORT=3306
MYSQL_DATABASE="bau7824897_db"
MYSQL_USER="bau7824897_mysql"
MYSQL_PASSWORD="ВАШ_ПАРОЛЬ_ОТ_БД"

# Telegram Bot API
TELEGRAM_BOT_TOKEN="8655510215:AAHD2y49HbYoXn1lXVbu81sf77Ng9rUPuW8"
TELEGRAM_ADMIN_CHAT_ID="-1003463870817"
TELEGRAM_API_PROXY="https://odd.gooilipok2.workers.dev/"

# Почтовый сервер SMTP
SMTP_HOST="mail.nic.ru"
SMTP_PORT=465
SMTP_USER="bausquadresponse@bausquad.org"
SMTP_PASSWORD="ВАШ_ПАРОЛЬ_ОТ_ПОЧТЫ"
SMTP_FROM="BauSquad <bausquadresponse@bausquad.org>"
```

### Шаг 3. Комплексная проверка системы
Откройте в браузере страницу **`https://bausquad.org/diag.php`**:
- **Скрипты**: убедитесь, что все PHP файлы отображаются со статусом `ДОСТУПЕН`.
- **База данных**: проверьте, что статус `ПОДКЛЮЧЕНО` и отображаются таблицы.
- **Telegram**: выполните тестовую отправку сообщения.
- **Email**: выполните отправку тестового письма.

После проверки сайт полностью готов к работе!


