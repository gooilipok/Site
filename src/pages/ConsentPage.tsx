import React, { useState, useEffect } from 'react';
import { Cog, FileText, Lock, ShieldCheck, Home, CheckCircle2, Copy, Printer, FolderTree, ChevronRight, Check, ArrowUp } from 'lucide-react';

export default function Consent() {
  const [showScroll, setShowScroll] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScroll(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-[#0f1418] text-[#ecf0f1] relative overflow-hidden py-8 px-4 sm:px-6">
      {/* ⚙️ BACKGROUND GEARS */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.04]">
        <Cog className="absolute -top-24 -right-24 w-[550px] h-[550px] text-[#2ecc71] animate-[spin_50s_linear_infinite]" />
        <Cog className="absolute top-1/2 -left-32 w-[650px] h-[650px] text-[#c5a059] animate-[spin_70s_linear_infinite_reverse]" />
        <Cog className="absolute -bottom-20 right-1/4 w-[500px] h-[500px] text-[#3498db] animate-[spin_60s_linear_infinite]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10 space-y-6">
        {/* 🧭 NAVIGATION BAR */}
        <div className="bg-[#1a252f] border-b-2 border-[#2ecc71] p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs uppercase font-bold text-[#2ecc71]">
            <Cog className="w-4 h-4 animate-[spin_12s_linear_infinite]" />
            <span>Документы и Соглашения BauSquad</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <a href="/terms" className="px-3 py-1.5 bg-[#0f1418] text-[#bdc3c7] hover:text-white border border-white/10 uppercase font-bold flex items-center gap-1.5 transition-all">
              <FileText className="w-3.5 h-3.5 text-[#c5a059]" />
              <span>Пользовательское соглашение</span>
            </a>
            <a href="/privacy" className="px-3 py-1.5 bg-[#0f1418] text-[#bdc3c7] hover:text-white border border-white/10 uppercase font-bold flex items-center gap-1.5 transition-all">
              <Lock className="w-3.5 h-3.5 text-[#3498db]" />
              <span>Политика конфиденциальности</span>
            </a>
            <a href="/consent" className="px-3 py-1.5 bg-[#2ecc71] text-black font-extrabold uppercase shadow-md flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Согласие на обработку ПД</span>
            </a>
            <a href="/" className="px-3 py-1.5 bg-[#2b3d4f] text-white hover:bg-[#3d536b] uppercase font-bold flex items-center gap-1.5 transition-all ml-auto">
              <Home className="w-3.5 h-3.5" />
              <span>На главную</span>
            </a>
          </div>
        </div>

        {/* 📄 DOCUMENT CONTENT */}
        <div className="bg-[#1a252f] border-t-4 border-[#2ecc71] p-6 md:p-12 shadow-2xl space-y-8 relative font-sans text-xs text-[#bdc3c7] leading-relaxed">
          <div className="border-b border-[#2b3d4f] pb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
              <span className="px-3 py-1 bg-[#2ecc71]/20 border border-[#2ecc71] text-[#2ecc71] text-xs font-mono uppercase font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Официальный документ • Согласие
              </span>
              <div className="flex items-center gap-2">
                <button onClick={handleCopyLink} className="px-2.5 py-1 bg-[#0f1418] hover:bg-[#2b3d4f] text-[#bdc3c7] border border-white/10 text-xs flex items-center gap-1 transition-all" title="Скопировать ссылку">
                  {copied ? <Check className="w-3 h-3 text-[#2ecc71]" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Скопировано' : 'Ссылка'}</span>
                </button>
                <button onClick={handlePrint} className="px-2.5 py-1 bg-[#0f1418] hover:bg-[#2b3d4f] text-[#bdc3c7] border border-white/10 text-xs flex items-center gap-1 transition-all" title="Распечатать документ">
                  <Printer className="w-3 h-3" />
                  <span>Печать</span>
                </button>
              </div>
            </div>

            <h1 className="text-lg md:text-xl font-black text-white uppercase tracking-wide leading-snug">
              Согласие на обработку персональных данных Клиента платформы BauSquad
            </h1>
            <p className="text-xs text-[#bdc3c7] mt-2 leading-relaxed">
              Предоставляется Оператору — Индивидуальному предпринимателю Семёнову Даниилу Алексеевичу при регистрации, оформлении заказа или заполнении форм на сайте https://bausquad.org/.
            </p>
          </div>

          <div className="bg-[#0f1418]/60 p-4 border-l-2 border-[#2ecc71] space-y-2">
            <p>Я, Пользователь веб-сайта свободно, своей волей и в своем интересе даю настоящее информированное и сознательное согласие на обработку моих персональных данных на следующих условиях.</p>
          </div>

          {/* 6. REQUISITES */}
          <section id="consent-6" className="space-y-4 pt-4 border-t border-[#2b3d4f]">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2b3d4f] pb-2">
              <span className="w-6 h-6 rounded bg-[#2ecc71] text-black flex items-center justify-center font-mono text-xs">6</span>
              6. Реквизиты Оператора персональных данных
            </h2>
            <div className="mt-4 bg-[#0f1418] border border-[#2ecc71] p-5 space-y-2 text-xs font-mono text-[#ecf0f1]">
              <div className="text-xs uppercase font-extrabold text-[#2ecc71] tracking-wider border-b border-white/10 pb-2 flex items-center gap-2 font-sans">
                <CheckCircle2 className="w-4 h-4 text-[#2ecc71]" />
                Официальные реквизиты Оператора
              </div>
              <p><strong>ИНН:</strong> 773395090916 | <strong>ОГРНИП:</strong> 326774600536097</p>
              <p><strong>Служба поддержки:</strong> support@bausquad.org</p>
            </div>
          </section>

          {/* BOTTOM RETURN HOME */}
          <div className="pt-6 border-t border-[#2b3d4f] flex flex-wrap items-center justify-between gap-4">
            <a href="/" className="px-6 py-3 bg-[#2ecc71] text-black font-extrabold uppercase shadow-lg hover:bg-[#27ae60] transition-all flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span>Вернуться на главную страницу BauSquad</span>
            </a>
          </div>
        </div>
      </div>

      {showScroll && (
        <button onClick={scrollToTop} className="fixed bottom-6 right-6 p-3 bg-[#2ecc71] text-black shadow-2xl hover:bg-[#27ae60] transition-all z-50 rounded-none border border-black/20" title="Наверх страницы">
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}