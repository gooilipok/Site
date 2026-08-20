import React, { useState, useEffect } from 'react';
import { Cookie, Settings, Check, X, Shield } from 'lucide-react';
import { CookiePreferences } from '../types';
import { apiFetch } from '../utils/api';

const COOKIE_PREFS_KEY = 'bausquad_cookie_consent_prefs';

export const CookieBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  const [analytics, setAnalytics] = useState<boolean>(true);
  const [marketing, setMarketing] = useState<boolean>(false);
  const [functional, setFunctional] = useState<boolean>(true);

  useEffect(() => {
    const saved = localStorage.getItem(COOKIE_PREFS_KEY);
    if (!saved) {
      setShowBanner(true);
    }
  }, []);

  const savePreferences = (accepted: boolean, customPrefs?: Partial<CookiePreferences>) => {
    const prefs: CookiePreferences = {
      accepted,
      necessary: true,
      analytics: customPrefs?.analytics ?? analytics,
      marketing: customPrefs?.marketing ?? marketing,
      functional: customPrefs?.functional ?? functional,
      saved_at: new Date().toISOString()
    };

    localStorage.setItem(COOKIE_PREFS_KEY, JSON.stringify(prefs));

    // Post to API asynchronously
    apiFetch('/api/cookies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences: prefs })
    }).catch(() => {});

    setShowBanner(false);
    setShowSettingsModal(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* MAIN BOTTOM BANNER */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-[#0f1418]/95 border-t-2 border-[#c5a059] backdrop-blur-lg shadow-2xl animate-fade-in">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          <div className="flex items-start gap-3 max-w-3xl">
            <div className="p-2.5 bg-[#1a252f] border border-[#c5a059]/40 shrink-0 text-[#f1c40f]">
              <Cookie className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold uppercase text-sm tracking-wider flex items-center gap-2">
                Файлы Cookie и конфиденциальность
              </h4>
              <p className="text-xs text-[#bdc3c7] mt-1 leading-relaxed">
                Мы используем технические файлы cookie для безопасной аутентификации пользователя (JWT tokens) и улучшения работы платформы. Вы можете принять все файлы cookie или настроить параметры.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={() => savePreferences(true, { analytics: true, marketing: true, functional: true })}
              className="flex-1 md:flex-none px-4 py-2 bg-[#2b3d4f] text-white border-b-2 border-[#1a252f] hover:bg-[#3d536b] font-bold text-xs uppercase tracking-wider transition-all"
            >
              Принять всё
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex-1 md:flex-none px-4 py-2 border border-[#c5a059] text-[#c5a059] hover:bg-[#c5a059] hover:text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Настроить</span>
            </button>

            <button
              onClick={() => savePreferences(false, { analytics: false, marketing: false, functional: false })}
              className="px-3 py-2 text-[#7f8c8d] hover:text-white font-bold text-xs uppercase transition-all"
            >
              Отказаться
            </button>
          </div>

        </div>
      </div>

      {/* CUSTOMIZE SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a252f] border-t-4 border-[#c5a059] max-w-lg w-full p-6 space-y-5 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-[#2b3d4f] pb-3">
              <h3 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#c5a059]" />
                Настройки файлов Cookie
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-[#bdc3c7] hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Necessary */}
              <div className="p-3 bg-[#0f1418] border border-white/5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white uppercase block">Обязательные (Сессия и JWT)</span>
                  <span className="text-[#7f8c8d]">Необходимы для работы входа и защиты аккаунта. Нельзя отключить.</span>
                </div>
                <span className="px-2 py-1 bg-[#2ecc71]/20 text-[#2ecc71] font-bold uppercase text-[10px] shrink-0 ml-3">
                  Включено
                </span>
              </div>

              {/* Functional */}
              <div className="p-3 bg-[#0f1418] border border-white/5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white uppercase block">Функциональные cookie</span>
                  <span className="text-[#7f8c8d]">Сохранение выбранного темы, формы заказов и фильтров.</span>
                </div>
                <input
                  type="checkbox"
                  checked={functional}
                  onChange={(e) => setFunctional(e.target.checked)}
                  className="w-4 h-4 accent-[#c5a059] shrink-0 ml-3 cursor-pointer"
                />
              </div>

              {/* Analytics */}
              <div className="p-3 bg-[#0f1418] border border-white/5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white uppercase block">Аналитические cookie</span>
                  <span className="text-[#7f8c8d]">Анонимная статистика посещаемости страниц.</span>
                </div>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="w-4 h-4 accent-[#c5a059] shrink-0 ml-3 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-[#2b3d4f]">
              <button
                onClick={() => savePreferences(true, { analytics, functional, marketing })}
                className="flex-1 py-2.5 bg-[#2b3d4f] text-white font-bold text-xs uppercase border-b-2 border-[#1a252f] hover:bg-[#3d536b]"
              >
                Сохранить настройки
              </button>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2.5 bg-[#454d55] text-white font-bold text-xs uppercase hover:bg-[#5a636c]"
              >
                Отмена
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
