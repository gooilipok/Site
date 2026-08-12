import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, FileText, Lock, ArrowUp, Cog, CheckCircle2, Home, FolderTree, ChevronRight } from 'lucide-react';

export const ConsentPage: React.FC = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0f1418] text-[#ecf0f1] relative overflow-hidden py-8 px-4 sm:px-6">
      
      {/* ⚙️ SUBTLE BACKGROUND ROTATING GEARS (OPACITY REDUCED) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.04]">
        <Cog className="absolute -top-20 -right-20 w-[500px] h-[500px] text-[#2ecc71] animate-[spin_45s_linear_infinite]" />
        <Cog className="absolute top-1/2 -left-32 w-[650px] h-[650px] text-[#3498db] animate-[spin_65s_linear_infinite_reverse]" />
        <Cog className="absolute -bottom-24 right-1/3 w-[550px] h-[550px] text-[#c5a059] animate-[spin_55s_linear_infinite]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10 space-y-6">
        
        {/* 🧭 NAVIGATION BAR AT THE TOP */}
        <div className="bg-[#1a252f] border-b-2 border-[#2ecc71] p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs uppercase font-bold text-[#2ecc71]">
            <Cog className="w-4 h-4 animate-[spin_12s_linear_infinite]" />
            <span>Документы и Соглашения BauSquad</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link
              to="/terms"
              className="px-3 py-1.5 bg-[#0f1418] text-[#bdc3c7] hover:text-white border border-white/10 uppercase font-bold flex items-center gap-1.5 transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-[#c5a059]" />
              <span>Пользовательское соглашение</span>
            </Link>

            <Link
              to="/privacy"
              className="px-3 py-1.5 bg-[#0f1418] text-[#bdc3c7] hover:text-white border border-white/10 uppercase font-bold flex items-center gap-1.5 transition-all"
            >
              <Lock className="w-3.5 h-3.5 text-[#3498db]" />
              <span>Политика конфиденциальности</span>
            </Link>

            <Link
              to="/consent"
              className="px-3 py-1.5 bg-[#2ecc71] text-black font-extrabold uppercase shadow-md flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Согласие на обработку ПД</span>
            </Link>

            <Link
              to="/"
              className="px-3 py-1.5 bg-[#2b3d4f] text-white hover:bg-[#3d536b] uppercase font-bold flex items-center gap-1.5 transition-all ml-auto"
            >
              <Home className="w-3.5 h-3.5" />
              <span>На главную</span>
            </Link>
          </div>
        </div>

        {/* 📄 FULL CONTINUOUS LEGAL DOCUMENT */}
        <div className="bg-[#1a252f] border-t-4 border-[#2ecc71] p-6 md:p-12 shadow-2xl space-y-8 relative font-sans text-xs text-[#bdc3c7] leading-relaxed">
          
          {/* DOCUMENT HEADER */}
          <div className="border-b border-[#2b3d4f] pb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
              <span className="px-3 py-1 bg-[#2ecc71]/20 border border-[#2ecc71] text-[#2ecc71] text-xs font-mono uppercase font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Официальный документ • Согласие
              </span>
              <span className="text-xs text-[#7f8c8d]">
                Дата обновления: <strong className="text-white">01.08.2026</strong>
              </span>
            </div>

            <h1 className="text-lg md:text-xl font-black text-white uppercase tracking-wide leading-snug">
              Согласие на обработку персональных данных Пользователя
            </h1>
            <p className="text-xs text-[#bdc3c7] mt-2 leading-relaxed">
              Выражение согласия Пользователя на обработку персональных данных в соответствии с требованиями Федерального закона № 152-ФЗ «О персональных данных».
            </p>
          </div>

          {/* 🌳 CHAPTER NAVIGATION TREE */}
          <div className="bg-[#0f1418] border border-[#2ecc71]/40 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase font-extrabold text-[#2ecc71] border-b border-white/10 pb-2">
              <FolderTree className="w-4 h-4 text-[#2ecc71]" />
              <span>Дерево глав и оглавление документа</span>
            </div>
            
            <nav className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
              <a href="#consent-1" className="text-[#2ecc71] hover:text-[#f1c40f] hover:underline flex items-start gap-1.5 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-[#2ecc71] shrink-0 mt-0.5" />
                <span>1. Субъект и Оператор персональных данных</span>
              </a>
              <a href="#consent-2" className="text-[#2ecc71] hover:text-[#f1c40f] hover:underline flex items-start gap-1.5 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-[#2ecc71] shrink-0 mt-0.5" />
                <span>2. Перечень персональных данных и Цели</span>
              </a>
              <a href="#consent-3" className="text-[#consent-3] hover:text-[#f1c40f] hover:underline flex items-start gap-1.5 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-[#2ecc71] shrink-0 mt-0.5" />
                <span>3. Срок действия согласия и Отзыв</span>
              </a>
            </nav>
          </div>

          {/* 📄 FULL TEXT OF CONSENT */}
          <div className="space-y-4 text-justify leading-relaxed">
            
            <p>
              Настоящим Пользователь, проставляя отметку («галочку») в специальном поле на ресурсах <a href="https://bausquad.org/" className="text-[#2ecc71] underline">https://bausquad.org/</a> и (или) оформляя заказ в официальных ботах Plattform BauSquad, свободно, своей волей и в своем интересе дает свое согласие Оператору — <strong>ИП СЕМЁНОВ АНДРЕЙ СЕРГЕЕВИЧ</strong> на обработку своих персональных данных.
            </p>

            <h2 id="consent-1" className="text-sm font-extrabold text-[#2ecc71] uppercase pt-4 border-b border-white/10 pb-1">
              1. Субъект и Оператор персональных данных
            </h2>
            <p>1.1. Оператор: ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ СЕМЁНОВ АНДРЕЙ СЕРГЕЕВИЧ (ОГРНИП: 326774600536097, ИНН: 773395090916).</p>
            <p>1.2. Субъект персональных данных: Физическое лицо, являющееся пользователем ресурсов BauSquad и акцептовавшее Пользовательское соглашение.</p>

            <h2 id="consent-2" className="text-sm font-extrabold text-[#2ecc71] uppercase pt-4 border-b border-white/10 pb-1">
              2. Перечень персональных данных и Цели
            </h2>
            <p>2.1. Перечень обрабатываемых данных: фамилия, имя, адрес электронной почты, контактный телефон, никнейм/ID в мессенджерах (Telegram, VK), сведений об аккаунте и совершенных заказах.</p>
            <p>2.2. Обработка осуществляется в целях предоставления услуг консультационного и обучающего характера, сопровождения заказов, рассылки уведомлений о статусе выполнения заказов.</p>

            <h2 id="consent-3" className="text-sm font-extrabold text-[#2ecc71] uppercase pt-4 border-b border-white/10 pb-1">
              3. Срок действия согласия и Отзыв
            </h2>
            <p>3.1. Настоящее согласие действует с момента его предоставления до момента достижения целей обработки или отзыва согласия Субъектом.</p>
            <p>3.2. Согласие может быть отозвано Субъектом путем направления письменного уведомления Оператору на почту support@bausquad.org.</p>

            <div className="p-4 bg-[#0f1418] border border-white/10 space-y-1 font-mono text-[11px] text-[#bdc3c7] mt-6">
              <p><strong>ОПЕРАТОР:</strong> ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ СЕМЁНОВ АНДРЕЙ СЕРГЕЕВИЧ</p>
              <p><strong>ЭЛЕКТРОННАЯ ПОЧТА:</strong> <a href="mailto:support@bausquad.org" className="text-[#2ecc71] underline">support@bausquad.org</a></p>
              <p><strong>ОГРНИП:</strong> 326774600536097 | <strong>ИНН:</strong> 773395090916</p>
            </div>

          </div>

          {/* FOOTER NAV IN DOCUMENT */}
          <div className="pt-6 border-t border-[#2b3d4f] flex flex-wrap items-center justify-between gap-4">
            <Link
              to="/terms"
              className="text-xs text-[#2ecc71] hover:underline flex items-center gap-1 uppercase font-bold"
            >
              ← К Пользовательскому соглашению
            </Link>
            <div className="flex gap-4 text-xs">
              <Link to="/privacy" className="text-[#3498db] hover:underline">Политика конфиденциальности →</Link>
            </div>
          </div>

        </div>

      </div>

      {/* ⬆️ SCROLL TO TOP BUTTON */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 bg-[#2ecc71] text-black font-extrabold shadow-2xl hover:bg-[#27ae60] transition-all z-50 uppercase text-xs flex items-center gap-1 border border-black/20"
          title="Наверх"
        >
          <ArrowUp className="w-5 h-5" />
          <span className="hidden sm:inline">Наверх</span>
        </button>
      )}

    </div>
  );
};
