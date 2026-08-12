# Инструкция по развертыванию приложения BauSquad на хостинге RU-CENTER (nic.ru) и сторонних серверах

Настоящая инструкция описывает процесс публикации и запуска веб-приложения BauSquad на хостинге **RU-CENTER (nic.ru)**, а также на любом независимом Linux VPS / стороннем виртуальном хостинге.

---

## 🏛️ Особенности развертывания на хостинге RU-CENTER (nic.ru)

### 1. Импорт базы данных MySQL в RU-CENTER:
1. Войдите в панель управления хостингом **RU-CENTER (nic.ru)**.
2. Перейдите в раздел **Базы данных MySQL** и откройте **phpMyAdmin** (адрес сервера БД обычно вида `mysql.hosting.nic.ru`).
3. Выберите вашу базу данных (например, `bau7824897_db`).
4. Нажмите вкладку **Импорт**, выберите файл `database.sql` из корня этого репозитория и нажмите **Вперед** / **Импортировать**.

### 2. Настройка переменных окружения `.env`:
Создайте файл `.env` в корневом каталоге проекта со следующими данными вашего аккаунта RU-CENTER:

```env
# Параметры подключения к MySQL хостинга RU-CENTER (nic.ru)
MYSQL_HOST="mysql.hosting.nic.ru"
MYSQL_PORT=3306
MYSQL_DATABASE="bau7824897_db"
MYSQL_USER="bau7824897_mysql"
MYSQL_PASSWORD="AhTFV6g/"

# Telegram Бот
TELEGRAM_BOT_TOKEN="8655510215:AAHD2y49HbYoXn1lXVbu81sf77Ng9rUPuW8"
TELEGRAM_ADMIN_CHAT_ID="-1003817358324"

# Порт приложения
PORT=3000
```

### 3. Запуск приложения на VDS/VPS или Node.js хостинге RU-CENTER:
1. Подключитесь к серверу по SSH или открыв терминал панели RU-CENTER.
2. Установите зависимости и скомпилируйте бандл:
   ```bash
   npm install
   npm run build
   ```
3. Запустите приложение с помощью менеджера процессов **PM2**:
   ```bash
   npm install -g pm2
   pm2 start dist/server.cjs --name bausquad
   pm2 save
   ```

---

## Вариант 1. Запуск через Docker & Docker Compose (Рекомендуемый для VDS/VPS)

### Требования:
- Установленные `docker` и `docker-compose` на вашем сервере.

### Шаги установки:
1. Загрузите файлы проекта на ваш сервер.
2. Склонируйте конфигурацию `.env.example` в `.env`:
   ```bash
   cp .env.example .env
   ```
3. Укажите ваши реальные ключи Telegram бота и параметры почты в `.env`:
   ```env
   TELEGRAM_BOT_TOKEN="ВАШ_ТОКЕН_БОТА"
   TELEGRAM_ADMIN_CHAT_ID="ВАШ_CHAT_ID"
   ```
4. Запустите контейнеры:
   ```bash
   docker-compose up -d --build
   ```
5. При первом старте контейнер `db` автоматически развернёт схему MySQL из файла `database.sql`.
6. Приложение будет доступно по адресу: `http://ИП_ВАШЕГО_СЕРВЕРА:3000`.

---

## Вариант 2. Прямой запуск через Node.js и MySQL

### Требования:
- Node.js версии 18+ или 20+
- Сервер базы данных MySQL 5.7+ или 8.0+

### Шаги установки:
1. Импортируйте дамп базы данных `database.sql` в вашу БД MySQL:
   ```bash
   mysql -u имя_пользователя -p имя_базы < database.sql
   ```
2. Установите зависимости:
   ```bash
   npm install
   ```
3. Скомпилируйте проект для продакшена:
   ```bash
   npm run build
   ```
4. Запустите продакшен сервер:
   ```bash
   npm start
   ```
   Или используйте PM2 для фонового процесса:
   ```bash
   npm install -g pm2
   pm2 start dist/server.cjs --name bausquad
   ```

---

## Настройка Nginx и SSL (HTTPS)

Для работы по защищённому протоколу HTTPS и домену (например, `https://bausquad.ru`), настройте проксирование в Nginx:

```nginx
server {
    listen 80;
    server_name bausquad.ru www.bausquad.ru;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Для бесплатного получения SSL сертификата используйте Certbot:
```bash
sudo certbot --nginx -d bausquad.ru -d www.bausquad.ru
```
