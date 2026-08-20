import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Lock, User, FileText, CheckCircle, AlertCircle, KeyRound, ArrowRight, ArrowLeft } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerStep1, verifyEmailCode } = useAuth();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const [step, setStep] = useState<'form' | 'verification'>('form');
  const [verificationCode, setVerificationCode] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Пароль должен содержать не менее 6 символов');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают. Пожалуйста, проверьте повторный ввод пароля.');
      return;
    }

    if (!termsAccepted || !privacyAccepted || !consentAccepted) {
      setError('Для регистрации вы должны отдельно подтвердить согласие с каждым из трёх документов.');
      return;
    }

    setLoading(true);
    const result = await registerStep1({
      email,
      username,
      password,
      terms_accepted: termsAccepted,
      privacy_accepted: privacyAccepted,
      consent_accepted: consentAccepted
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Ошибка при отправке данных');
    } else if (result.autoLoggedIn) {
      navigate('/profile');
    } else {
      setStep('verification');
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!verificationCode.trim()) {
      setError('Введите 6-значный код подтверждения');
      return;
    }

    setLoading(true);
    const result = await verifyEmailCode(email, verificationCode);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Неверный код подтверждения');
    } else {
      navigate('/profile');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase text-[#bdc3c7] hover:text-[#c5a059] transition-all bg-[#1a252f] px-3 py-2 border border-[#2b3d4f]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>На главную страницу</span>
        </Link>
      </div>

      <div className="bg-[#1a252f] border-t-4 border-[#c5a059] max-w-lg w-full p-8 shadow-2xl relative">
        
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#2b3d4f] border border-[#c5a059]/40 flex items-center justify-center text-[#c5a059] mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black uppercase text-white tracking-wider">Регистрация в BauSquad</h2>
          <p className="text-xs text-[#bdc3c7] mt-1">Создайте инженеру-студенту учетную запись</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#e74c3c]/10 border border-[#e74c3c]/40 text-[#e74c3c] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: FORM */}
        {step === 'form' ? (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            
            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase text-[#c5a059] mb-1">Email *</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  required
                  className="w-full bg-[#0f1418] border border-[#3d4e5f] text-white p-3 pl-10 focus:border-[#c5a059] focus:outline-none"
                />
                <Mail className="w-4 h-4 text-[#bdc3c7] absolute left-3 top-3.5" />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-bold uppercase text-[#c5a059] mb-1">Логин / Никнейм *</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Student_2026"
                  required
                  className="w-full bg-[#0f1418] border border-[#3d4e5f] text-white p-3 pl-10 focus:border-[#c5a059] focus:outline-none"
                />
                <User className="w-4 h-4 text-[#bdc3c7] absolute left-3 top-3.5" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase text-[#c5a059] mb-1">Пароль (не менее 6 символов) *</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-[#0f1418] border border-[#3d4e5f] text-white p-3 pl-10 focus:border-[#c5a059] focus:outline-none"
                />
                <Lock className="w-4 h-4 text-[#bdc3c7] absolute left-3 top-3.5" />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold uppercase text-[#c5a059] mb-1">Повторите пароль *</label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-[#0f1418] border border-[#3d4e5f] text-white p-3 pl-10 focus:border-[#c5a059] focus:outline-none"
                />
                <Lock className="w-4 h-4 text-[#bdc3c7] absolute left-3 top-3.5" />
              </div>
            </div>

            {/* MANDATORY SEPARATE AGREEMENT CHECKBOXES */}
            <div className="pt-3 border-t border-[#2b3d4f] space-y-3 text-xs">
              <span className="block font-bold text-white uppercase text-[11px] text-[#c5a059]">
                Подтверждение правовых соглашений (обязательно):
              </span>

              {/* Checkbox 1: Terms */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-[#c5a059]"
                />
                <span className="text-[#bdc3c7] leading-tight">
                  Я прочитал и принимаю{' '}
                  <Link to="/terms" target="_blank" className="text-[#c5a059] underline hover:text-white">
                    Пользовательское соглашение
                  </Link>
                </span>
              </label>

              {/* Checkbox 2: Privacy */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-[#c5a059]"
                />
                <span className="text-[#bdc3c7] leading-tight">
                  Я ознакомлен с{' '}
                  <Link to="/privacy" target="_blank" className="text-[#c5a059] underline hover:text-white">
                    Политикой конфиденциальности
                  </Link>
                </span>
              </label>

              {/* Checkbox 3: Personal Data Consent */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-[#c5a059]"
                />
                <span className="text-[#bdc3c7] leading-tight">
                  Даю согласие на{' '}
                  <Link to="/consent" target="_blank" className="text-[#c5a059] underline hover:text-white">
                    обработку персональных данных
                  </Link>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#2b3d4f] text-white font-bold text-sm uppercase tracking-wider border-b-4 border-[#1a252f] hover:bg-[#3d536b] transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Отправка...' : 'Зарегистрироваться'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2 text-xs text-[#bdc3c7]">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="text-[#c5a059] font-bold hover:underline">
                Войти в систему
              </Link>
            </div>

          </form>
        ) : (
          /* STEP 2: SMTP VERIFICATION CODE */
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            
            <div className="p-4 bg-[#0f1418] border border-[#2b3d4f] text-center space-y-2">
              <Mail className="w-8 h-8 text-[#f1c40f] mx-auto" />
              <h4 className="font-bold text-white text-sm">Подтверждение Почты</h4>
              <p className="text-xs text-[#bdc3c7]">
                Код подтверждения отправлен на <strong className="text-white">{email}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#c5a059] mb-1">6-значный код из письма *</label>
              <div className="relative">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="123456"
                  required
                  maxLength={6}
                  className="w-full bg-[#0f1418] border border-[#3d4e5f] text-white p-3 pl-10 text-center font-mono text-xl tracking-widest focus:border-[#c5a059] focus:outline-none"
                />
                <KeyRound className="w-5 h-5 text-[#bdc3c7] absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#2b3d4f] text-white font-bold text-sm uppercase tracking-wider border-b-4 border-[#1a252f] hover:bg-[#3d536b] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-[#2ecc71]" />
              <span>{loading ? 'Проверка...' : 'Подтвердить код'}</span>
            </button>

            <button
              type="button"
              onClick={() => setStep('form')}
              className="w-full py-2 text-xs text-[#bdc3c7] hover:text-white uppercase font-bold"
            >
              ← Изменить регистрационные данные
            </button>

          </form>
        )}

      </div>
    </div>
  );
};
