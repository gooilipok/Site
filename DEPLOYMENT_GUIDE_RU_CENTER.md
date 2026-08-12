# Полное руководство по настройке и деплою сайта на хостинг Ru-Center (nic.ru)

Данное руководство содержит пошаговые инструкции и **все необходимые SSH-команды** для развертывания веб-приложения BauSquad на виртуальном выделенном сервере (VDS/VPS) или выделенном сервере под управлением OS Linux (Ubuntu 22.04 LTS / Debian 11/12).

---

## 📋 Содержание
1. [Подключение к серверу по SSH](#1-подключение-к-серверу-по-ssh)
2. [Шаг 1. Предварительная подготовка сервера (SSH-команды)](#шаг-1-предварительная-подготовка-сервера-ssh-команды)
3. [Шаг 2. Загрузка и сборка проекта](#шаг-2-загрузка-и-сборка-проекта)
4. [Шаг 3. Конфигурация переменных окружения (.env)](#шаг-3-конфигурация-переменных-окружения-env)
5. [Шаг 4. Запуск сервера приложений через PM2](#шаг-4-запуск-сервера-приложений-через-pm2)
6. [Шаг 5. Настройка веб-сервера Nginx (Reverse Proxy)](#шаг-5-настройка-веб-сервера-nginx-reverse-proxy)
7. [Шаг 6. Настройка бесплатного SSL-сертификата (HTTPS Let's Encrypt)](#шаг-6-настройка-бесплатного-ssl-сертификата-https-lets-encrypt)
8. [Шаг 7. Настройка файрвола (UFW)](#шаг-7-настройка-файрвола-ufw)
9. [📌 Шпаргалка всех SSH-команд в одном блоке](#-шпаргалка-всех-ssh-команд-в-одном-блоке)

---

## 1. Подключение к серверу по SSH

После покупки VDS на **nic.ru (Ru-Center)**, в панели управления вы получите **IP-адрес сервера**, **логин** (обычно `root`) и **пароль** (или SSH-ключ).

Откройте терминал (macOS/Linux) или PowerShell / PuTTY (Windows) и выполните:

```bash
ssh root@YOUR_SERVER_IP
```
*(замените `YOUR_SERVER_IP` на IP-адрес вашего сервера в Ru-Center)*

---

## Шаг 1. Предварительная подготовка сервера (SSH-команды)

Последовательно введите следующие SSH-команды для обновления ОС, установки Node.js v20 LTS, Nginx, Git и PM2.

### 1.1. Обновление пакетов операционной системы
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential ufw software-properties-common
```

### 1.2. Установка Node.js 20 LTS и npm
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```
Проверьте корректность установки:
```bash
node -v   # должно выдать v20.x.x
npm -v    # должно выдать v10.x.x
```

### 1.3. Установка менеджер процессов PM2
```bash
sudo npm install -g pm2
```

### 1.4. Установка Nginx и Certbot для SSL
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

---

## Шаг 2. Загрузка и сборка проекта

### 2.1. Создание рабочей директории
```bash
sudo mkdir -p /var/www/bausquad
sudo chown -R $USER:$USER /var/www/bausquad
cd /var/www/bausquad
```

### 2.2. Загрузка файлов проекта
Вы можете склонировать репозиторий через Git или загрузить архив проекта:
```bash
# Вариант А: через Git
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .

# Вариант Б: Загрузка файлов через SFTP/SCP в директорию /var/www/bausquad
```

### 2.3. Установка зависимостей и сборка
```bash
npm install
npm run build
```
После выполнения `npm run build` создастся директория `dist/` с собранным бандлом `dist/server.cjs` и клиентом.

---

## Шаг 3. Конфигурация переменных окружения (.env)

Создайте файл `.env` в корне проекта (`/var/www/bausquad/.env`):

```bash
nano .env
```

Вставьте следующую конфигурацию:

```env
PORT=3000
NODE_ENV=production
SECRET_KEY=bausquad_super_secret_jwt_key_2026_nic_ru

# Настройки Telegram-бота (если используется для уведомлений)
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ
TELEGRAM_ADMIN_CHAT_ID=-100123456789

# Настройки SMTP Почты (для отправки кодов верификации)
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_USER=noreply@bausquad.ru
SMTP_PASS=your_app_password
```

Сохраните файл (`Ctrl + O`, затем `Enter`, для выхода `Ctrl + X`).

---

## Шаг 4. Запуск сервера приложений через PM2

### 4.1. Запуск приложения
```bash
pm2 start dist/server.cjs --name bausquad-app
```

### 4.2. Настройка автозапуска при перезагрузке VDS
```bash
pm2 startup
# Выполните команду, которую сгенерирует PM2 (например, sudo env PATH=... pm2 startup systemd -u root)
pm2 save
```

### 4.3. Полезные команды PM2:
```bash
pm2 status                  # Статус запущенных приложений
pm2 logs bausquad-app       # Просмотр логов в реальном времени
pm2 restart bausquad-app    # Перезапуск приложения
pm2 stop bausquad-app       # Остановка
```

---

## Шаг 5. Настройка веб-сервера Nginx (Reverse Proxy)

Создайте конфигурационный файл Nginx для вашего домена:

```bash
sudo nano /etc/nginx/sites-available/bausquad.ru
```

Вставьте следующую конфигурацию (замените `bausquad.ru` на ваш реальный домен, купленный в Ru-Center):

```nginx
server {
    listen 80;
    server_name bausquad.ru www.bausquad.ru;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Защита загружаемых файлов и статики
    location /uploads/ {
        alias /var/www/bausquad/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

Активируйте конфигурацию и проверьте синтаксис Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/bausquad.ru /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Шаг 6. Настройка бесплатного SSL-сертификата (HTTPS Let's Encrypt)

Перед выпуском SSL-сертификата убедитесь, что ваш домен в панели Ru-Center (nic.ru) указывает (A-запись) на IP-адрес вашего VDS!

Выполните команду получения SSL:

```bash
sudo certbot --nginx -d bausquad.ru -d www.bausquad.ru
```

Certbot автоматически изменит файл Nginx и включит редирект с HTTP на HTTPS.

Проверка автообновления сертификата:
```bash
sudo certbot renew --dry-run
```

---

## Шаг 7. Настройка файрвола (UFW)

Разрешите доступ к SSH, HTTP и HTTPS портам:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Проверьте статус фаервола:
```bash
sudo ufw status
```

---

## 📌 Шпаргалка всех SSH-команд в одном блоке

Ниже приведён единый скрипт для последовательного ввода в консоль SSH:

```bash
# 1. Обновление системы и установка утилит
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential ufw software-properties-common nginx certbot python3-certbot-nginx

# 2. Установка Node.js 20 LTS и PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# 3. Подготовка директории проекта
sudo mkdir -p /var/www/bausquad
sudo chown -R $USER:$USER /var/www/bausquad
cd /var/www/bausquad

# 4. Сборка проекта (после загрузки кода)
npm install
npm run build

# 5. Запуск через PM2 и автозапуск
pm2 start dist/server.cjs --name bausquad-app
pm2 startup
pm2 save

# 6. Настройка файрвола
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# 7. Настройка SSL через Certbot (после настройки Nginx)
sudo certbot --nginx -d YOUR_DOMAIN.RU -d www.YOUR_DOMAIN.RU
```

---

## 🛠 Порядок работы с кнопками в панели администрирования

- **Статус `new` (Новый заказ):**
  - **Принять** — переводит заказ в статус `in_progress`.
  - **Отклонить** — переводит заказ в статус `cancelled`.
- **Принятый заказ (`in_progress`, `assigned`, `rework`, `completed`, `cancelled`):**
  - **Завершить** — ставит статус `completed`.
  - **На доработку** — ставит статус `rework`.
  - **Закрыть** — ставит статус `closed`.
- **Закрытый заказ (`closed`):**
  - Заказ блокируется, надпись **"Закрыт (Заблокирован)"**. Никакие дальнейшие изменения статусов или цен невозможны.
