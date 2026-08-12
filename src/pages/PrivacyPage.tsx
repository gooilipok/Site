import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock, FileText, ShieldCheck, ArrowUp, Cog, CheckCircle2, Home, FolderTree, ChevronRight } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
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
        <Cog className="absolute -top-24 -right-24 w-[550px] h-[550px] text-[#3498db] animate-[spin_50s_linear_infinite]" />
        <Cog className="absolute top-1/2 -left-32 w-[650px] h-[650px] text-[#c5a059] animate-[spin_70s_linear_infinite_reverse]" />
        <Cog className="absolute -bottom-20 right-1/4 w-[500px] h-[500px] text-[#2ecc71] animate-[spin_60s_linear_infinite]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10 space-y-6">
        
        {/* 🧭 NAVIGATION BAR AT THE TOP */}
        <div className="bg-[#1a252f] border-b-2 border-[#3498db] p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs uppercase font-bold text-[#3498db]">
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
              className="px-3 py-1.5 bg-[#3498db] text-white font-extrabold uppercase shadow-md flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Политика конфиденциальности</span>
            </Link>

            <Link
              to="/consent"
              className="px-3 py-1.5 bg-[#0f1418] text-[#bdc3c7] hover:text-white border border-white/10 uppercase font-bold flex items-center gap-1.5 transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#2ecc71]" />
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
        <div className="bg-[#1a252f] border-t-4 border-[#3498db] p-6 md:p-12 shadow-2xl space-y-8 relative font-sans text-xs text-[#bdc3c7] leading-relaxed">
          
          {/* DOCUMENT HEADER */}
          <div className="border-b border-[#2b3d4f] pb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
              <span className="px-3 py-1 bg-[#3498db]/20 border border-[#3498db] text-[#3498db] text-xs font-mono uppercase font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Официальный документ • Конфиденциальность
              </span>
              <span className="text-xs text-[#7f8c8d]">
                Дата обновления: <strong className="text-white">01.08.2026</strong>
              </span>
            </div>

            <h1 className="text-lg md:text-xl font-black text-white uppercase tracking-wide leading-snug">
              Политика конфиденциальности и защиты персональных данных ИП СЕМЁНОВ АНДРЕЙ СЕРГЕЕВИЧ (BauSquad)
            </h1>
            <p className="text-xs text-[#bdc3c7] mt-2 leading-relaxed">
              Настоящая Политика определяет порядок обработки и защиты персональной информации пользователей ресурсов https://bausquad.org/ и официальных ботов платформы.
            </p>
          </div>

          {/* 🌳 CHAPTER NAVIGATION TREE */}
          <div className="bg-[#0f1418] border border-[#3498db]/40 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase font-extrabold text-[#3498db] border-b border-white/10 pb-2">
              <FolderTree className="w-4 h-4 text-[#3498db]" />
              <span>Дерево глав и оглавление документа</span>
            </div>
            
            <nav className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
              <a href="#privacy-1" className="text-[#3498db] hover:text-[#f1c40f] hover:underline flex items-start gap-1.5 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-[#3498db] shrink-0 mt-0.5" />
                <span>1. Общие положения и цели обработки</span>
              </a>
              <a href="#privacy-2" className="text-[#3498db] hover:text-[#f1c40f] hover:underline flex items-start gap-1.5 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-[#3498db] shrink-0 mt-0.5" />
                <span>2. Состав персональных данных и способы обработки</span>
              </a>
              <a href="#privacy-3" className="text-[#3498db] hover:text-[#f1c40f] hover:underline flex items-start gap-1.5 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-[#3498db] shrink-0 mt-0.5" />
                <span>3. Защита информации, шифрование и анонимность</span>
              </a>
              <a href="#privacy-4" className="text-[#3498db] hover:text-[#f1c40f] hover:underline flex items-start gap-1.5 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-[#3498db] shrink-0 mt-0.5" />
                <span>4. Порядок отзыва согласия и Контакты</span>
              </a>
            </nav>
          </div>

          {/* 📄 FULL TEXT OF PRIVACY POLICY */}
          <div className="space-y-4 text-justify leading-relaxed">
            
            <p>
              Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональной информации о физических лицах (далее — Пользователи), использующих сервисы сайта <a href="https://bausquad.org/" className="text-[#3498db] underline">https://bausquad.org/</a> и официальных ботов платформы BauSquad, принадлежащих «ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ СЕМЁНОВ АНДРЕЙ СЕРГЕЕВИЧ» (коммерческое обозначение «AT Bausquad»).
            </p>

            <h2 id="privacy-1" className="text-sm font-extrabold text-[#3498db] uppercase pt-4 border-b border-white/10 pb-1">
              1. Общие положения и цели обработки
            </h2>
            <p>1.1. Соблюдение прав и свобод человека является приоритетным условием деятельности ИП СЕМЁНОВ АНДРЕЙ СЕРГЕЕВИЧ при обработке персональных данных.</p>
            <p>1.2. Персональные данные пользователей обрабатываются исключительно в целях обеспечения функционирования сервисов BauSquad, исполнения заказов, консультационного сопровождения, ведения пользовательского учета и обратной связи.</p>

            <h2 id="privacy-2" className="text-sm font-extrabold text-[#3498db] uppercase pt-4 border-b border-white/10 pb-1">
              2. Состав персональных данных и способы обработки
            </h2>
            <p>2.1. Оператор обрабатывает следующие персональные данные Пользователя: адрес электронной почты, логин, контактный мессенджер (VK, Telegram), а также техническую информацию (IP-адрес, cookie, сведения о браузере).</p>
            <p>2.2. Обработка осуществляется как с использованием средств автоматизации, так и без использования таковых средств в соответствии с законодательством Российской Федерации.</p>

            <h2 id="privacy-3" className="text-sm font-extrabold text-[#3498db] uppercase pt-4 border-b border-white/10 pb-1">
              3. Защита информации, шифрование и анонимность
            </h2>
            <p>3.1. BauSquad принимает необходимые организационные и технические меры для защиты персональных данных Пользователя от неправомерного или случайного доступа, уничтожения, изменения, блокирования, копирования и распространения.</p>
            <p>3.2. Пароли пользователей и токены авторизации хранятся в зашифрованном виде. Доступ третьих лиц к персональным данным категорически ограничен.</p>

            <h2 id="privacy-4" className="text-sm font-extrabold text-[#3498db] uppercase pt-4 border-b border-white/10 pb-1">
              4. Порядок отзыва согласия и Контакты
            </h2>
            <p>4.1. Пользователь может в любой момент отозвать свое согласие на обработку персональных данных, направив соответствующее заявление по электронной почте support@bausquad.org.</p>

            <div className="p-4 bg-[#0f1418] border border-white/10 space-y-1 font-mono text-[11px] text-[#bdc3c7] mt-6">
              <p><strong>ОПЕРАТОР:</strong> ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ СЕМЁНОВ АНДРЕЙ СЕРГЕЕВИЧ</p>
              <p><strong>ЭЛЕКТРОННАЯ ПОЧТА:</strong> <a href="mailto:support@bausquad.org" className="text-[#3498db] underline">support@bausquad.org</a></p>
              <p><strong>ОГРНИП:</strong> 326774600536097 | <strong>ИНН:</strong> 773395090916</p>
            </div>

          </div>

          {/* FOOTER NAV IN DOCUMENT */}
          <div className="pt-6 border-t border-[#2b3d4f] flex flex-wrap items-center justify-between gap-4">
            <Link
              to="/terms"
              className="text-xs text-[#3498db] hover:underline flex items-center gap-1 uppercase font-bold"
            >
              ← К Пользовательскому соглашению
            </Link>
            <div className="flex gap-4 text-xs">
              <Link to="/consent" className="text-[#2ecc71] hover:underline">Согласие на обработку ПД →</Link>
            </div>
          </div>

        </div>

      </div>

      {/* ⬆️ SCROLL TO TOP BUTTON */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 bg-[#3498db] text-white font-extrabold shadow-2xl hover:bg-[#2980b9] transition-all z-50 uppercase text-xs flex items-center gap-1 border border-black/20"
          title="Наверх"
        >
          <ArrowUp className="w-5 h-5" />
          <span className="hidden sm:inline">Наверх</span>
        </button>
      )}

    </div>
  );
};
