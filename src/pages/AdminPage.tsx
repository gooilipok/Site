import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Order, OrderStatus, AdminStats } from '../types';
import { Shield, Users, ShoppingBag, Search, Filter, Trash2, Edit2, CheckCircle, RefreshCw, Send, AlertTriangle, Cpu, Mail, Lock, Ban, UserCheck, DollarSign, X, Check, XCircle, RotateCcw, Archive } from 'lucide-react';
import { apiFetch } from '../utils/api';

export const AdminPage: React.FC = () => {
  const { user, tokens, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'orders' | 'users' | 'telegram'>('orders');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [ordersList, setOrdersList] = useState<Order[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'admin') {
      // Non-admin redirect
      return;
    }
    fetchAdminData();
  }, [user, isAuthenticated]);

  const fetchAdminData = async () => {
    if (!tokens?.access_token) return;
    setLoading(true);
    try {
      // Fetch Stats
      const statsResp = await apiFetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      if (statsResp.ok) {
        const statsData = await statsResp.json();
        setStats(statsData);
      }

      // Fetch Users
      const usersResp = await apiFetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      if (usersResp.ok) {
        const usersData = await usersResp.json();
        setUsersList(usersData.users || []);
      }

      // Fetch Orders
      const ordersResp = await apiFetch('/api/orders', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      if (ordersResp.ok) {
        const ordersData = await ordersResp.json();
        setOrdersList(ordersData.orders || []);
      }

    } catch {
      setMsg({ type: 'error', text: 'Ошибка загрузки данных панели администрирования' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const resp = await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.access_token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await resp.json();
      if (!resp.ok) {
        setMsg({ type: 'error', text: data.error || 'Ошибка изменения статуса' });
      } else {
        setMsg({ type: 'success', text: `Статус заказа #${orderId} изменён на ${newStatus}` });
        fetchAdminData();
      }
    } catch {
      setMsg({ type: 'error', text: 'Ошибка подключения к серверу' });
    }
  };

  const handleToggleUserBan = async (userId: string, currentStatus: string, username: string) => {
    const newStatus = currentStatus === 'banned' ? 'active' : 'banned';
    const actionText = newStatus === 'banned' ? 'заблокировать' : 'разблокировать';
    if (!confirm(`Вы действительно хотите ${actionText} пользователя ${username}?`)) return;

    try {
      const resp = await apiFetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.access_token}`
        },
        body: JSON.stringify({ account_status: newStatus })
      });

      const data = await resp.json();
      if (!resp.ok) {
        setMsg({ type: 'error', text: data.error || 'Ошибка изменения статуса бана' });
      } else {
        setMsg({ type: 'success', text: `Статус аккаунта ${username} изменён на ${newStatus}` });
        fetchAdminData();
      }
    } catch {
      setMsg({ type: 'error', text: 'Ошибка сети' });
    }
  };

  const [editingPriceOrder, setEditingPriceOrder] = useState<Order | null>(null);
  const [clientPriceInput, setClientPriceInput] = useState('');
  const [executerPriceInput, setExecuterPriceInput] = useState('');

  const openPriceModal = (ord: Order) => {
    setEditingPriceOrder(ord);
    setClientPriceInput(ord.client_price || ord.price || 'На обсуждении');
    setExecuterPriceInput(ord.executer_price || '');
  };

  const handleSavePrices = async (orderId: string) => {
    try {
      const resp = await apiFetch(`/api/orders/${orderId}/prices`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.access_token}`
        },
        body: JSON.stringify({
          client_price: clientPriceInput,
          executer_price: executerPriceInput
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        setMsg({ type: 'error', text: data.error || 'Ошибка сохранения цен' });
      } else {
        setMsg({ type: 'success', text: `Цены заказа #${orderId} успешно сохранены` });
        setEditingPriceOrder(null);
        fetchAdminData();
      }
    } catch {
      setMsg({ type: 'error', text: 'Ошибка сети при сохранении цен' });
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'customer' | 'admin') => {
    try {
      const resp = await apiFetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.access_token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      const data = await resp.json();
      if (!resp.ok) {
        setMsg({ type: 'error', text: data.error || 'Ошибка изменения роли' });
      } else {
        setMsg({ type: 'success', text: `Роль пользователя изменена на ${newRole}` });
        fetchAdminData();
      }
    } catch {
      setMsg({ type: 'error', text: 'Ошибка сети' });
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Удалить пользователя ${username}?`)) return;

    try {
      const resp = await apiFetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokens?.access_token}` }
      });

      const data = await resp.json();
      if (!resp.ok) {
        setMsg({ type: 'error', text: data.error || 'Ошибка удаления пользователя' });
      } else {
        setMsg({ type: 'success', text: `Пользователь ${username} успешно удален` });
        fetchAdminData();
      }
    } catch {
      setMsg({ type: 'error', text: 'Ошибка сети' });
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-[#1a252f] border-t-4 border-[#e74c3c] text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-[#e74c3c] mx-auto" />
        <h2 className="text-xl font-bold text-white uppercase">Доступ ограничен</h2>
        <p className="text-xs text-[#bdc3c7]">
          Панель администратора доступна только пользователям с ролью <strong className="text-[#ff6b00]">admin</strong>.
        </p>
      </div>
    );
  }

  // Filtered orders
  const filteredOrders = ordersList.filter(o => {
    const matchesSearch = o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.user_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.contact.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered users
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* HEADER & ADMIN BANNER */}
      <div className="bg-[#1a252f] border-t-4 border-[#ff6b00] p-6 md:p-8 shadow-2xl relative">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#ff6b00] text-white flex items-center justify-center font-black">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                Панель Администратора BauSquad
              </h1>
              <p className="text-xs text-[#bdc3c7]">Центр управления заказами, пользователями и Telegram Bot API</p>
            </div>
          </div>

          <button
            onClick={fetchAdminData}
            className="px-3 py-1.5 bg-[#2b3d4f] text-white font-bold text-xs uppercase hover:bg-[#3d536b] transition-all flex items-center gap-1.5 border border-white/10"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#f1c40f]" />
            <span>Обновить данные</span>
          </button>
        </div>

        {/* SYSTEM STATS METRICS GRID */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-6 pt-4 border-t border-white/10">
            <div className="p-3 bg-[#0f1418] border border-white/5">
              <span className="text-[10px] uppercase font-bold text-[#7f8c8d] block">Пользователи</span>
              <span className="text-xl font-black text-white">{stats.total_users}</span>
            </div>
            <div className="p-3 bg-[#0f1418] border border-white/5">
              <span className="text-[10px] uppercase font-bold text-[#7f8c8d] block">Всего заказов</span>
              <span className="text-xl font-black text-[#c5a059]">{stats.total_orders}</span>
            </div>
            <div className="p-3 bg-[#0f1418] border border-white/5">
              <span className="text-[10px] uppercase font-bold text-[#7f8c8d] block">Новые</span>
              <span className="text-xl font-black text-[#f1c40f]">{stats.orders_new}</span>
            </div>
            <div className="p-3 bg-[#0f1418] border border-white/5">
              <span className="text-[10px] uppercase font-bold text-[#7f8c8d] block">В работе</span>
              <span className="text-xl font-black text-[#3498db]">{stats.orders_in_progress}</span>
            </div>
            <div className="p-3 bg-[#0f1418] border border-white/5">
              <span className="text-[10px] uppercase font-bold text-[#7f8c8d] block">На доработке</span>
              <span className="text-xl font-black text-[#e67e22]">{stats.orders_revision || 0}</span>
            </div>
            <div className="p-3 bg-[#0f1418] border border-white/5">
              <span className="text-[10px] uppercase font-bold text-[#7f8c8d] block">Завершенные</span>
              <span className="text-xl font-black text-[#2ecc71]">{stats.orders_completed}</span>
            </div>
          </div>
        )}
      </div>

      {msg && (
        <div className={`p-4 text-xs font-bold uppercase flex items-center justify-between ${
          msg.type === 'success' ? 'bg-[#2ecc71]/10 border border-[#2ecc71] text-[#2ecc71]' : 'bg-[#e74c3c]/10 border border-[#e74c3c] text-[#e74c3c]'
        }`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="text-xs hover:underline">Закрыть</button>
        </div>
      )}

      {/* TABS SELECTOR */}
      <div className="flex border-b-2 border-[#2b3d4f] gap-2 text-xs font-bold uppercase">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-5 py-3 transition-all flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'bg-[#1a252f] text-[#ff6b00] border-t-2 border-[#ff6b00]'
              : 'text-[#bdc3c7] hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Управление заказами ({ordersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-3 transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-[#1a252f] text-[#ff6b00] border-t-2 border-[#ff6b00]'
              : 'text-[#bdc3c7] hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Пользователи ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('telegram')}
          className={`px-5 py-3 transition-all flex items-center gap-2 ${
            activeTab === 'telegram'
              ? 'bg-[#1a252f] text-[#ff6b00] border-t-2 border-[#ff6b00]'
              : 'text-[#bdc3c7] hover:text-white'
          }`}
        >
          <Send className="w-4 h-4 text-[#3498db]" />
          <span>Telegram Bot Логи</span>
        </button>
      </div>

      {/* TAB 1: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="bg-[#1a252f] p-6 shadow-2xl space-y-4">
          
          {/* SEARCH & FILTERS */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#0f1418] p-3 border border-white/5">
            <div className="relative w-full md:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию, автору или контакту..."
                className="w-full bg-[#1a252f] border border-[#3d4e5f] text-white p-2 pl-9 text-xs focus:border-[#ff6b00] focus:outline-none"
              />
              <Search className="w-4 h-4 text-[#bdc3c7] absolute left-2.5 top-2.5" />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto text-xs">
              <span className="text-[#bdc3c7]">Фильтр по статусу:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#1a252f] border border-[#3d4e5f] text-white p-2 focus:outline-none"
              >
                <option value="all">Все статусы</option>
                <option value="new">Новый</option>
                <option value="in_progress">В работе</option>
                <option value="revision">На доработке</option>
                <option value="completed">Завершён</option>
                <option value="cancelled">Отменён</option>
              </select>
            </div>
          </div>

          {/* ORDERS TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#bdc3c7]">
              <thead className="bg-[#0f1418] text-white uppercase text-[10px] tracking-wider border-b border-[#2b3d4f]">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Предмет & Описание</th>
                  <th className="p-3">Срок / Дедлайн</th>
                  <th className="p-3">Цена Клиента</th>
                  <th className="p-3">Цена Исполнителя</th>
                  <th className="p-3">Автор / Контакт</th>
                  <th className="p-3">Статус</th>
                  <th className="p-3 text-right">Управление</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#0f1418]/60 transition-colors">
                    <td className="p-3 font-mono text-[#c5a059] font-bold">#{ord.id}</td>
                    <td className="p-3 max-w-xs">
                      <div className="font-bold text-white text-sm truncate">{ord.title}</div>
                      <div className="text-[11px] text-[#7f8c8d] line-clamp-1">{ord.description}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <strong className="text-white">{ord.deadline}</strong>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="text-[#f1c40f] font-bold">{ord.client_price || ord.price || 'На обсуждении'}</span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="text-[#2ecc71] font-bold">{ord.executer_price || 'Не назначена'}</span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="text-white font-bold">{ord.user_username}</div>
                      <div className="text-[10px] text-[#3498db]">{ord.contact}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`badge-status badge-${ord.status}`}>
                        {ord.status === 'revision' || ord.status === 'rework' ? 'На доработке' :
                         ord.status === 'assigned' ? 'Назначен' :
                         ord.status === 'closed' ? 'Закрыт' : ord.status}
                      </span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {ord.status === 'closed' ? (
                          <span className="px-2.5 py-1 bg-[#2c3e50] text-[#7f8c8d] text-[10px] uppercase font-bold tracking-wider border border-white/5 inline-flex items-center gap-1" title="Заказ закрыт. Никакие действия более недоступны.">
                            <Archive className="w-3 h-3 text-[#7f8c8d]" />
                            <span>Закрыт (Заблокирован)</span>
                          </span>
                        ) : (
                          <>
                            {/* Price button available for active non-closed orders */}
                            <button
                              onClick={() => openPriceModal(ord)}
                              className="px-2 py-1 bg-[#2b3d4f] text-[#f1c40f] border border-[#c5a059]/40 hover:border-[#c5a059] text-[10px] uppercase font-bold inline-flex items-center gap-1 transition-all"
                              title="Задать цены клиенту и исполнителю"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>Цены</span>
                            </button>

                            {/* STATUS BUTTONS DEPENDING ON WORKFLOW STATE */}
                            {ord.status === 'new' ? (
                              <>
                                {/* NEW ORDER: 2 BUTTONS (ПРИНЯТЬ / ОТКЛОНИТЬ) */}
                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'in_progress')}
                                  className="px-2.5 py-1 bg-[#2ecc71] text-black font-extrabold text-[10px] uppercase hover:bg-[#27ae60] inline-flex items-center gap-1 shadow-sm transition-all"
                                  title="Принять заказ в работу"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Принять</span>
                                </button>

                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'cancelled')}
                                  className="px-2.5 py-1 bg-[#e74c3c] text-white font-extrabold text-[10px] uppercase hover:bg-[#c0392b] inline-flex items-center gap-1 shadow-sm transition-all"
                                  title="Отклонить и отменить заказ"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Отклонить</span>
                                </button>
                              </>
                            ) : (
                              <>
                                {/* ACCEPTED/ACTIVE/FINISHED ORDERS: 3 BUTTONS (ЗАВЕРШИТЬ / НА ДОРАБОТКУ / ЗАКРЫТЬ) */}
                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'completed')}
                                  className="px-2 py-1 bg-[#2ecc71] text-black font-extrabold text-[10px] uppercase hover:bg-[#27ae60] inline-flex items-center gap-1 transition-all"
                                  title="Отметить заказ полностью выполненным (статус completed)"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Завершить</span>
                                </button>

                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'rework')}
                                  className="px-2 py-1 bg-[#f1c40f] text-black font-extrabold text-[10px] uppercase hover:bg-[#f39c12] inline-flex items-center gap-1 transition-all"
                                  title="Отправить заказ на доработку (статус rework)"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>На доработку</span>
                                </button>

                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'closed')}
                                  className="px-2 py-1 bg-[#34495e] text-white font-extrabold text-[10px] uppercase hover:bg-[#2c3e50] inline-flex items-center gap-1 transition-all"
                                  title="Закрыть заказ (статус closed). После закрытия любые действия с заказом блокируются."
                                >
                                  <Archive className="w-3 h-3" />
                                  <span>Закрыть</span>
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 2: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-[#1a252f] p-6 shadow-2xl space-y-4">
          
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#0f1418] p-3 border border-white/5">
            <div className="relative w-full md:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск пользователя по email или логину..."
                className="w-full bg-[#1a252f] border border-[#3d4e5f] text-white p-2 pl-9 text-xs focus:border-[#ff6b00] focus:outline-none"
              />
              <Search className="w-4 h-4 text-[#bdc3c7] absolute left-2.5 top-2.5" />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#bdc3c7]">Фильтр по роли:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-[#1a252f] border border-[#3d4e5f] text-white p-2 focus:outline-none"
              >
                <option value="all">Все роли</option>
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#bdc3c7]">
              <thead className="bg-[#0f1418] text-white uppercase text-[10px] tracking-wider border-b border-[#2b3d4f]">
                <tr>
                  <th className="p-3">Логин / Ник</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Роль</th>
                  <th className="p-3">Статус Бана</th>
                  <th className="p-3">Заказов</th>
                  <th className="p-3">Регистрация</th>
                  <th className="p-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className={`hover:bg-[#0f1418]/60 transition-colors ${u.account_status === 'banned' ? 'bg-[#e74c3c]/10' : ''}`}>
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                      {u.account_status === 'banned' && <Ban className="w-3.5 h-3.5 text-[#e74c3c]" />}
                      <span>{u.username}</span>
                    </td>
                    <td className="p-3 text-[#3498db]">{u.email}</td>
                    <td className="p-3">
                      <span className={`badge-status ${u.role === 'admin' ? 'badge-admin' : 'badge-customer'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      {u.account_status === 'banned' ? (
                        <span className="px-2 py-0.5 bg-[#e74c3c] text-white font-bold text-[10px] uppercase rounded-xs">
                          БАН / Заблокирован
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-[#2ecc71]/20 text-[#2ecc71] font-bold text-[10px] uppercase border border-[#2ecc71]/40">
                          Активен
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-[#c5a059] font-bold">{u.order_count ?? 0}</td>
                    <td className="p-3 text-[11px] text-[#7f8c8d]">
                      {new Date(u.created_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleToggleUserBan(u.id, u.account_status || 'active', u.username)}
                        className={`px-2 py-1 text-[10px] uppercase font-bold transition-all inline-flex items-center gap-1 ${
                          u.account_status === 'banned'
                            ? 'bg-[#2ecc71] text-black hover:bg-[#27ae60]'
                            : 'bg-[#e74c3c] text-white hover:bg-[#c0392b]'
                        }`}
                        title={u.account_status === 'banned' ? 'Разблокировать возможность создавать заказы' : 'Заблокировать пользователя'}
                      >
                        {u.account_status === 'banned' ? <UserCheck className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                        <span>{u.account_status === 'banned' ? 'Разбанить' : 'Забанить'}</span>
                      </button>

                      <button
                        onClick={() => handleUpdateUserRole(u.id, u.role === 'admin' ? 'customer' : 'admin')}
                        className="px-2 py-1 bg-[#2b3d4f] text-white text-[10px] uppercase font-bold hover:bg-[#3d536b]"
                      >
                        Роль: {u.role === 'admin' ? 'customer' : 'admin'}
                      </button>
                      
                      {u.id !== user.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="p-1 bg-[#e74c3c]/20 text-[#e74c3c] hover:bg-[#e74c3c] hover:text-white transition-colors inline-flex items-center"
                          title="Удалить аккаунт"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 3: TELEGRAM BOT LOGS */}
      {activeTab === 'telegram' && (
        <div className="bg-[#1a252f] p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#2b3d4f] pb-3">
            <div>
              <h3 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                <Send className="w-5 h-5 text-[#3498db]" />
                Логи сообщений Telegram Bot API
              </h3>
              <p className="text-xs text-[#bdc3c7]">История отправленных уведомлений о заказах в закрытый канал управления</p>
            </div>

            <div className="px-3 py-1 bg-[#2ecc71]/10 border border-[#2ecc71] text-[#2ecc71] font-bold text-xs">
              Bot Active
            </div>
          </div>

          {stats?.telegram_recent_logs && stats.telegram_recent_logs.length > 0 ? (
            <div className="space-y-3 font-mono text-xs">
              {stats.telegram_recent_logs.map((log, idx) => (
                <div key={idx} className="p-4 bg-[#0f1418] border border-white/10 space-y-2">
                  <div className="text-[10px] text-[#7f8c8d] flex justify-between border-b border-white/5 pb-1">
                    <span>Message ID: {log.id}</span>
                    <span>{new Date(log.timestamp).toLocaleString('ru-RU')}</span>
                  </div>
                  <pre className="text-[#bdc3c7] whitespace-pre-wrap leading-relaxed">
                    {log.text.replace(/<[^>]*>/g, '')}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-[#7f8c8d] text-xs">
              Логи Telegram сообщений пока отсутствуют. Создайте новый заказ для проверки.
            </div>
          )}
        </div>
      )}

      {/* PRICE EDITING MODAL */}
      {editingPriceOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a252f] border-t-4 border-[#c5a059] p-6 max-w-md w-full shadow-2xl space-y-4 relative">
            <button
              onClick={() => setEditingPriceOrder(null)}
              className="absolute top-4 right-4 text-[#bdc3c7] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[#2b3d4f] pb-3">
              <h3 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#f1c40f]" />
                Установка цен заказа #{editingPriceOrder.id}
              </h3>
              <p className="text-xs text-[#bdc3c7] mt-1">{editingPriceOrder.title}</p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold uppercase text-[#f1c40f] mb-1">
                  Цена для Заказчика (Клиента)
                </label>
                <input
                  type="text"
                  value={clientPriceInput}
                  onChange={(e) => setClientPriceInput(e.target.value)}
                  placeholder="Например: 4500 ₽ или На обсуждении"
                  className="w-full bg-[#0f1418] border border-[#3d4e5f] text-white p-2.5 focus:border-[#c5a059] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#2ecc71] mb-1">
                  Цена для Исполнителя (Автора)
                </label>
                <input
                  type="text"
                  value={executerPriceInput}
                  onChange={(e) => setExecuterPriceInput(e.target.value)}
                  placeholder="Например: 2800 ₽"
                  className="w-full bg-[#0f1418] border border-[#3d4e5f] text-white p-2.5 focus:border-[#2ecc71] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setEditingPriceOrder(null)}
                className="px-4 py-2 bg-[#2b3d4f] text-white text-xs font-bold uppercase hover:bg-[#3d536b]"
              >
                Отмена
              </button>
              <button
                onClick={() => handleSavePrices(editingPriceOrder.id)}
                className="px-4 py-2 bg-[#ff6b00] text-white text-xs font-bold uppercase hover:bg-[#e05e00] shadow-[0_3px_0_#b34a00]"
              >
                Сохранить цены
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
