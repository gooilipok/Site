# BauSquad — Платформа Заказа Студенческих Работ

**BauSquad** — Полностью переработанная полнофункциональная инженерная веб-платформа для заказа и автоматизации студенческих и научно-исследовательских работ. Проект построен на микросервисной архитектуре, полностью разделяющей Frontend и Backend, с поддержкой MySQL, Telegram Bot API, SMTP уведомлений и развёртыванием через Docker Compose на VPS.

---

## 🛠 Стек технологий

### Frontend
- **React 19** + **TypeScript**
- **Vite** (сборщик и Dev Сервер)
- **React Router 7** (маршрутизация)
- **Tailwind CSS 4** (стили)
- **Lucide React** (иконки)
- **JWT Authentication** (access + refresh токены с автоматическим продлением сессий)

### Backend (Production VPS)
- **Python 3.13** + **FastAPI**
- **SQLAlchemy 2.0 ORM** (работа с СУБД)
- **Alembic** (миграции структуры БД)
- **Pydantic v2** (валидация данных)
- **Passlib & bcrypt** (хэширование паролей)
- **python-telegram-bot / httpx** (Telegram Bot API)
- **SMTP mailer** (подтверждение почты кодом)

### База Данных & Инфраструктура
- **MySQL 8.0**
- **Docker & Docker Compose**

---

## 📁 Структура проекта

```
/
├── backend/                  # Исходный код Python FastAPI (VPS Production)
│   ├── app/
│   │   ├── api/v1/          # REST API Эндпоинты
│   │   ├── core/            # Настройки, JWT и безопасность (bcrypt)
│   │   ├── db/              # SQLAlchemy сессия и Base
│   │   ├── models/          # ORM Модели (User, Order, Agreements)
│   │   ├── schemas/         # Pydantic схемы
│   │   ├── services/        # Telegram Bot API & SMTP почтовый модуль
│   │   └── main.py          # Точка входа FastAPI
│   ├── Dockerfile           # Контейнер FastAPI
│   └── requirements.txt     # Зависимости Python
│
├── src/                      # Исходный код Frontend (React 19)
│   ├── components/          # Компоненты (Navbar, Footer, CookieBanner)
│   ├── context/             # React Context (AuthContext)
│   ├── pages/               # Страницы (HomePage, RegisterPage, ProfilePage, AdminPage и др.)
│   ├── types.ts             # TypeScript интерфейсы
│   └── index.css            # Инженерная металлическая тема (BauSquad Metal Dark)
│
├── server.ts                 # Fullstack Express API сервер
├── docker-compose.yml        # Docker Compose конфигурация для VPS
├── Dockerfile.frontend       # Контейнер Frontend
├── .env.example              # Пример переменных окружения
└── README.md
```

---

## 🚀 Развёртывание на VPS (Docker Compose)

### 1. Клонирование репозитория и настройка `.env`
```bash
git clone https://github.com/your-org/bausquad.git
cd bausquad
cp .env.example .env
```

Отредактируйте файл `.env`:
- Задайте ключ `SECRET_KEY`
- Укажите настройки `MYSQL_ROOT_PASSWORD` и `MYSQL_PASSWORD`
- Укажите `TELEGRAM_BOT_TOKEN` и `TELEGRAM_ADMIN_CHAT_ID`
- Задайте параметры `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`

### 2. Запуск через Docker Compose
```bash
docker compose up -d --build
```

### 3. Проверка статуса контейнеров
```bash
docker compose ps
```
После успешного запуска приложение доступно на порту `3000` (Frontend) и `8000` (Backend API).

---

## 🔐 Роли и Безопасность

- **`customer`**: Создание заказов, загрузка файлов, просмотр личной истории заказов и профиля.
- **`admin`**: Доступ к панели администратора `/admin`, изменение статусов заказов (Новый, В работе, Завершён, Отменён), управление пользователями, просмотр статистики и логов Telegram.

---

## 📡 REST API Эндпоинты

| Метод | URL | Описание |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Регистрация с обязательным подтверждением 3 соглашений |
| `POST` | `/api/auth/verify-code` | Проверка 6-значного кода подтверждения почты |
| `POST` | `/api/auth/login` | Авторизация и получение JWT токенов |
| `POST` | `/api/auth/refresh` | Обновление Access токена |
| `GET` | `/api/auth/me` | Данные текущего профиля |
| `GET/POST` | `/api/orders` | Получение списка и создание заказов |
| `PATCH` | `/api/orders/:id/status` | Изменение статуса заказа (Admin) |
| `GET` | `/api/admin/users` | Управление пользователями (Admin) |
| `GET` | `/api/agreements` | Тексты правовых соглашений |
| `POST` | `/api/cookies` | Настройки файлов Cookie |
