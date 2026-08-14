import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Order, OrderStatus } from '../types';
import { User as UserIcon, Mail, Shield, Calendar, Edit3, PlusCircle, CheckCircle2, Clock, XCircle, AlertCircle, FileText, Download, LogOut, Settings, Ban, Send, MessageSquare, ArrowLeft } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, tokens, logout, updateProfile, toggleDemoRole } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);

  // Edit profile state
  const [showEditModal, setShowEditModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Telegram link state
  const [telegramInput, setTelegramInput] = useState(user?.telegram_handle || '');
  const [tgSuccess, setTgSuccess] = useState<string | null>(null);
  const [tgError, setTgError] = useState<string | null>(null);
  const [savingTg, setSavingTg] = useState(false);

  // Filter orders by status
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user?.telegram_handle) {
      setTelegramInput(user.telegram_handle);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUserOrders();
  }, [user]);

  const fetchUserOrders = async () => {
    if (!tokens?.access_token) return;
    setLoadingOrders(true);
    try {
      const resp = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        setOrders(data.orders || []);
      }
    } catch {
      // Offline fallback
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setEditSuccess(null);

    setSaving(true);
    const result = await updateProfile(newUsername, newPassword);
    setSaving(false);

    if (!result.success) {
      setEditError(result.error || 'Ошибка при обновлении профиля');
    } else {
      setEditSuccess('Данные профиля успешно обновлены!');
      setTimeout(() => setShowEditModal(false), 1500);
    }
  };

  const handleSaveTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    setTgError(null);
    setTgSuccess(null);

    setSavingTg(true);
    const formattedHandle = telegramInput.replace(/^@/, '').trim();
    const result = await updateProfile(undefined, undefined, formattedHandle);
    setSavingTg(false);

    if (!result.success) {
      setTgError(result.error || 'Не удалось привязать Telegram');
    } else {
      setTgSuccess('Telegram аккаунт успешно привязан!');
      setTimeout(() => setTgSuccess(null), 3000);
    }
  };

  if (!user) return null;

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(o => o.status === statusFilter);

  const statsNew = orders.filter(o => o.status === 'new').length;
  const statsInProgress = orders.filter(o => o.status === 'in_progress').length;
  const statsRevision = orders.filter(o => o.status === 'revision').length;
  const statsCompleted = orders.filter(o => o.status === 'completed').length;
  const statsCancelled = orders.filter(o => o.status === 'cancelled').length;

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return <span className="badge-status badge-new">Новый</span>;
      case 'assigned':
        return <span className="badge-status badge-in_progress">Назначен</span>;
      case 'in_progress':
        return <span className="badge-status badge-in_progress">В работе</span>;
      case 'revision':
      case 'rework':
        return <span className="badge-status badge-revision">На доработке</span>;
      case 'completed':
        return <span className="badge-status badge-completed">Завершён</span>;
      case 'closed':
        return <span className="badge-status badge-completed">Закрыт</span>;
      case 'cancelled':
        return <span className="badge-status badge-cancelled">Отменён</span>;
      default:
        return <span className="badge-status badge-new">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* BACK TO HOME BUTTON */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase text-[#bdc3c7] hover:text-[#c5a059] transition-all bg-[#1a252f] px-3 py-2 border border-[#2b3d4f]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>На главную страницу</span>
        </Link>
      </div>

      {/* USER PROFILE HEADER CARD */}
      <div className="bg-[#1a252f] border-t-4 border-[#c5a059] p-6 md:p-8 shadow-2xl relative">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#2b3d4f] border-2 border-[#c5a059] flex items-center justify-center text-[#c5a059] text-2xl font-black">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white uppercase tracking-wider">{user.username}</h1>
                {user.role === 'admin' && (
                  <span className="badge-status badge-admin">
                    Администратор
                  </span>
                )}
                {user.account_status === 'banned' && (
                  <span className="px-2 py-0.5 bg-[#e74c3c] text-white font-bold text-[10px] uppercase rounded-xs flex items-center gap-1">
                    <Ban className="w-3 h-3" />
                    Заблокирован
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#bdc3c7] mt-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#c5a059]" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#c5a059]" />
                  Регистрация: {new Date(user.created_at).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => {
                setNewUsername(user.username);
                setNewPassword('');
                setShowEditModal(true);
              }}
              className="px-4 py-2 bg-[#2b3d4f] text-white font-bold text-xs uppercase border-b-2 border-[#1a252f] hover:bg-[#3d536b] transition-all flex items-center gap-1.5"
            >
              <Edit3 className="w-4 h-4" />
              <span>Редактировать профиль</span>
            </button>

            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="px-3 py-2 border border-[#e74c3c] text-[#e74c3c] font-bold text-xs uppercase hover:bg-[#e74c3c] hover:text-white transition-all flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              <span>Выйти</span>
            </button>
          </div>

        </div>

        {/* AGREEMENTS VERIFICATION STATUS */}
        <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#bdc3c7]">
          <div className="p-2 bg-[#0f1418] border border-white/5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2ecc71]" />
            <span>Соглашение с пользователем: <strong className="text-white">Принято</strong></span>
          </div>
          <div className="p-2 bg-[#0f1418] border border-white/5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2ecc71]" />
            <span>Политика конфиденциальности: <strong className="text-white">Принято</strong></span>
          </div>
          <div className="p-2 bg-[#0f1418] border border-white/5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2ecc71]" />
            <span>Согласие на обработку ПД: <strong className="text-white">Принято</strong></span>
          </div>
        </div>

        {/* TELEGRAM ACCOUNT LINKING CARD */}
        <div className="mt-6 pt-4 border-t border-white/10 bg-[#0f1418] p-4 border border-[#2b3d4f]">
          <div className="flex items-center gap-2 text-[#c5a059] font-bold text-xs uppercase mb-2">
            <MessageSquare className="w-4 h-4" />
            <span>Привязка Telegram аккаунта</span>
          </div>

          <form onSubmit={handleSaveTelegram} className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-[#bdc3c7] font-bold text-xs">@</span>
                <input
                  type="text"
                  value={telegramInput}
                  onChange={(e) => setTelegramInput(e.target.value)}
                  placeholder="ваш_telegram_username"
                  className="w-full bg-[#1a252f] border border-[#3d4e5f] text-white p-2 pl-7 text-xs focus:border-[#c5a059] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingTg}
                className="px-4 py-2 bg-[#c5a059] text-black font-black text-xs uppercase hover:bg-[#d4af37] transition-all flex items-center justify-center gap-1.5 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{savingTg ? 'Сохранение...' : user?.telegram_handle ? 'Обновить Telegram' : 'Привязать Telegram'}</span>
              </button>
            </div>

            {tgSuccess && (
              <p className="text-xs text-[#2ecc71] flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{tgSuccess}</span>
              </p>
            )}

            {tgError && (
              <p className="text-xs text-[#e74c3c] flex items-center gap-1 font-bold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{tgError}</span>
              </p>
            )}

            <p className="text-[11px] text-[#bdc3c7]">
              Привязка Telegram аккаунта необходима для моментального получения статусов заказов и быстрой связи с автором. Наш бот: <a href="https://t.me/bausquad_bot" target="_blank" rel="noopener noreferrer" className="text-[#3498db] underline font-bold">@bausquad_bot</a>
            </p>
          </form>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-[#1a252f] border-l-4 border-[#f1c40f] p-3.5 shadow-md">
          <span className="text-[10px] uppercase font-bold text-[#bdc3c7] block">Новые</span>
          <span className="text-xl font-black text-[#f1c40f]">{statsNew}</span>
        </div>
        <div className="bg-[#1a252f] border-l-4 border-[#3498db] p-3.5 shadow-md">
          <span className="text-[10px] uppercase font-bold text-[#bdc3c7] block">В работе</span>
          <span className="text-xl font-black text-[#3498db]">{statsInProgress}</span>
        </div>
        <div className="bg-[#1a252f] border-l-4 border-[#e67e22] p-3.5 shadow-md">
          <span className="text-[10px] uppercase font-bold text-[#bdc3c7] block">На доработке</span>
          <span className="text-xl font-black text-[#e67e22]">{statsRevision}</span>
        </div>
        <div className="bg-[#1a252f] border-l-4 border-[#2ecc71] p-3.5 shadow-md">
          <span className="text-[10px] uppercase font-bold text-[#bdc3c7] block">Завершено</span>
          <span className="text-xl font-black text-[#2ecc71]">{statsCompleted}</span>
        </div>
        <div className="bg-[#1a252f] border-l-4 border-[#e74c3c] p-3.5 shadow-md">
          <span className="text-[10px] uppercase font-bold text-[#bdc3c7] block">Отменено</span>
          <span className="text-xl font-black text-[#e74c3c]">{statsCancelled}</span>
        </div>
      </div>

      {/* ORDERS HISTORY SECTION */}
      <div className="bg-[#1a252f] p-6 shadow-2xl border border-[#2b3d4f]">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#2b3d4f]">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#c5a059]" />
              История ваших заказов
            </h2>
            <p className="text-xs text-[#bdc3c7] mt-0.5">Все созданные вами заявки и их статусы исполнения</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Filter buttons */}
            <div className="flex border border-[#2b3d4f] text-[11px] font-bold uppercase overflow-x-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 ${statusFilter === 'all' ? 'bg-[#c5a059] text-black' : 'text-[#bdc3c7] hover:text-white'}`}
              >
                Все ({orders.length})
              </button>
              <button
                onClick={() => setStatusFilter('in_progress')}
                className={`px-3 py-1.5 ${statusFilter === 'in_progress' ? 'bg-[#3498db] text-white' : 'text-[#bdc3c7] hover:text-white'}`}
              >
                В работе
              </button>
              <button
                onClick={() => setStatusFilter('revision')}
                className={`px-3 py-1.5 ${statusFilter === 'revision' ? 'bg-[#e67e22] text-white' : 'text-[#bdc3c7] hover:text-white'}`}
              >
                На доработке
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 ${statusFilter === 'completed' ? 'bg-[#2ecc71] text-black' : 'text-[#bdc3c7] hover:text-white'}`}
              >
                Завершенные
              </button>
            </div>

            <Link
              to="/order/create"
              className="px-4 py-2 bg-[#2b3d4f] text-[#f1c40f] font-bold text-xs uppercase border border-[#c5a059]/50 hover:border-[#c5a059] flex items-center gap-1.5 ml-auto md:ml-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Создать заказ</span>
            </Link>
          </div>
        </div>

        {/* ORDERS LIST */}
        {loadingOrders ? (
          <div className="text-center py-12 text-[#bdc3c7] text-sm animate-pulse">
            Загрузка списка заказов...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-[#0f1418] border border-white/5 space-y-3">
            <p className="text-sm text-[#bdc3c7]">Заказов в выбранной категории не найдено.</p>
            {statusFilter === 'all' && (
              <Link
                to="/order/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#2b3d4f] text-white font-bold text-xs uppercase border-b-2 border-[#1a252f]"
              >
                <PlusCircle className="w-4 h-4 text-[#f1c40f]" />
                Создать первый заказ
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((ord) => (
              <div key={ord.id} className="p-5 bg-[#0f1418] border border-[#2b3d4f] hover:border-[#c5a059]/50 transition-all space-y-3">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[#c5a059] font-bold">#{ord.id}</span>
                    <h3 className="font-bold text-white text-base">{ord.title}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(ord.status)}
                    <span className="text-xs text-[#7f8c8d]">
                      {new Date(ord.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#bdc3c7] leading-relaxed line-clamp-2">
                  {ord.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-4 text-xs pt-2 text-[#7f8c8d]">
                  <div className="flex flex-wrap gap-4">
                    <span>Дедлайн: <strong className="text-white">{ord.deadline}</strong></span>
                    <span>Стоимость: <strong className="text-[#f1c40f]">{ord.client_price || ord.price || 'На обсуждении'}</strong></span>
                    <span>Контакты: <strong className="text-white">{ord.contact}</strong></span>
                  </div>

                  {ord.files && ord.files.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-[#3498db]">
                      <Download className="w-3.5 h-3.5" />
                      <span>Прикреплено файлов: {ord.files.length} шт.</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a252f] border-t-4 border-[#c5a059] max-w-md w-full p-6 space-y-4 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-[#2b3d4f] pb-3">
              <h3 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#c5a059]" />
                Редактирование профиля
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-[#bdc3c7] hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-[#e74c3c]/10 border border-[#e74c3c] text-[#e74c3c] text-xs">
                {editError}
              </div>
            )}

            {editSuccess && (
              <div className="p-3 bg-[#2ecc71]/10 border border-[#2ecc71] text-[#2ecc71] text-xs">
                {editSuccess}
              </div>
            )}

            <form onSubmit={handleEditProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#c5a059] mb-1">Новый логин / никнейм</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-[#0f1418] border border-[#3d4e5f] text-white p-2.5 focus:border-[#c5a059] focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#c5a059] mb-1">Новый пароль (оставьте пустым если не хотите менять)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Оставьте пустым для сохранения текущего"
                  className="w-full bg-[#0f1418] border border-[#3d4e5f] text-white p-2.5 focus:border-[#c5a059] focus:outline-none text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-[#2b3d4f] text-white font-bold text-xs uppercase border-b-2 border-[#1a252f] hover:bg-[#3d536b]"
                >
                  {saving ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 bg-[#454d55] text-white font-bold text-xs uppercase hover:bg-[#5a636c]"
                >
                  Отмена
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
