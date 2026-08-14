import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle, LogIn, Key, Sparkles, ArrowLeft } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setLoading(true);
    const result = await login(identifier, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Ошибка входа');
    } else {
      navigate('/profile');
    }
  };

  const fillDemoCreds = (demoEmail: string, demoPass: string) => {
    setIdentifier(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase text-[#bdc3c7] hover:text-[#c5a059] transition-all bg-[#1a252f] px-3 py-2 border border-[#2b3d4f]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>На главную страницу</span>
        </Link>
      </div>

      <div className="bg-[#1a252f] border-t-4 border-[#c5a059] max-w-md w-full p-8 shadow-2xl relative">
        
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#2b3d4f] border border-[#c5a059]/40 flex items-center justify-center text-[#c5a059] mx-auto mb-3">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black uppercase text-white tracking-wider">Вход в BauSquad</h2>
          <p className="text-xs text-[#bdc3c7] mt-1">Вход в личный кабинет пользователя</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#e74c3c]/10 border border-[#e74c3c]/40 text-[#e74c3c] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold uppercase text-[#c5a059] mb-1">Email или Логин *</label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="student@bausquad.ru"
                required
                className="w-full bg-[#0f1418] border border-[#3d4e5f] text-white p-3 pl-10 focus:border-[#c5a059] focus:outline-none"
              />
              <User className="w-4 h-4 text-[#bdc3c7] absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[#c5a059] mb-1">Пароль *</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#0f1418] border border-[#3d4e5f] text-white p-3 pl-10 focus:border-[#c5a059] focus:outline-none"
              />
              <Lock className="w-4 h-4 text-[#bdc3c7] absolute left-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#2b3d4f] text-white font-bold text-sm uppercase tracking-wider border-b-4 border-[#1a252f] hover:bg-[#3d536b] transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Проверка...' : 'Войти'}</span>
          </button>

          <div className="text-center pt-2 text-xs text-[#bdc3c7] space-y-1">
            <p>
              Ещё нет аккаунта?{' '}
              <Link to="/register" className="text-[#c5a059] font-bold hover:underline">
                Зарегистрироваться
              </Link>
            </p>
          </div>

        </form>

      </div>
    </div>
  );
};
