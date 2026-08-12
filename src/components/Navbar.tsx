import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BauSquadLogo } from './BauSquadLogo';
import { Shield, User as UserIcon, LogOut, PlusCircle, Menu, X, FileText, Settings, ShieldCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, toggleDemoRole } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#0f1418]/95 backdrop-blur-md border-b-2 border-[#2b3d4f] px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* LOGO */}
        <Link to="/" className="group flex items-center">
          <BauSquadLogo size="sm" />
        </Link>

        {/* DESKTOP NAV LINKS */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#bdc3c7]">
        </nav>

        {/* AUTH / PROFILE BLOCK */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              
              {/* Role Toggle Switch for Demo/Testing */}
              <button
                onClick={toggleDemoRole}
                title="Нажмите для смены роли (customer / admin) для тестирования"
                className="text-[10px] px-2 py-1 bg-[#1a252f] text-[#bdc3c7] border border-white/10 hover:border-[#c5a059] transition-all flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3 h-3 text-[#c5a059]" />
                <span>Тест роли: <strong className="text-white capitalize">{user.role}</strong></span>
              </button>

              {/* Admin Panel Link */}
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="px-3 py-1.5 bg-[#ff6b00] text-white font-bold text-xs uppercase tracking-wider shadow-[0_4px_0_#b34a00] active:translate-y-0.5 active:shadow-[0_2px_0_#b34a00] flex items-center gap-1.5 hover:brightness-110 transition-all"
                >
                  <Shield className="w-4 h-4" />
                  <span>Админ</span>
                </Link>
              )}

              {/* User Badge Token */}
              <Link to="/profile" className="user-nick-token">
                <UserIcon className="w-4 h-4 text-[#c5a059]" />
                <span>{user.username}</span>
              </Link>

              {/* Logout Button */}
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="p-2 border border-[#454d55] text-[#bdc3c7] hover:text-white hover:border-[#c5a059] transition-all"
                title="Выход из системы"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 border-2 border-[#c5a059] text-[#c5a059] hover:bg-[#c5a059] hover:text-black font-bold text-xs uppercase tracking-wider transition-all"
              >
                Вход
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-[#2b3d4f] text-white border-b-4 border-[#1a252f] font-bold text-xs uppercase tracking-wider hover:bg-[#3d536b] transition-all"
              >
                Регистрация
              </Link>
            </div>
          )}
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#c5a059] border border-[#2b3d4f]"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-[#2b3d4f] space-y-3 bg-[#1a252f] p-4 text-sm font-semibold">
          {isAuthenticated && user ? (
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-[#c5a059] font-bold">
                <span className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  {user.username} ({user.role})
                </span>
                <button
                  onClick={toggleDemoRole}
                  className="text-[10px] px-2 py-1 bg-black/40 text-[#f1c40f] border border-[#c5a059]/30"
                >
                  Сменить роль
                </button>
              </div>

              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2 bg-[#ff6b00] text-white font-bold uppercase text-xs"
                >
                  Панель Администратора
                </Link>
              )}

              <Link
                to="/order/create"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 bg-[#2b3d4f] text-[#f1c40f] font-bold uppercase text-xs border border-[#c5a059]"
              >
                + Создать заказ
              </Link>

              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 bg-[#1a252f] text-white font-bold uppercase text-xs border border-white/10"
              >
                Мой профиль
              </Link>

              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                  navigate('/');
                }}
                className="w-full py-2 border border-[#e74c3c] text-[#e74c3c] font-bold text-xs uppercase"
              >
                Выйти
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2 border border-[#c5a059] text-[#c5a059] font-bold text-xs uppercase"
              >
                Вход
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2 bg-[#2b3d4f] text-white font-bold text-xs uppercase"
              >
                Регистрация
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
