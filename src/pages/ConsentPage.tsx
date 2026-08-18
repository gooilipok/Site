import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, FileText, Lock, ArrowUp, Cog, CheckCircle2, Home, FolderTree, ChevronRight, Copy, Check, Printer } from 'lucide-react';

export const ConsentPage: React.FC = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0f1418] text-[#ecf0f1] relative overflow-hidden py-8 px-4 sm:px-6">
      
      {/* ⚙️ SUBTLE BACKGROUND ROTATING GEARS */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.04]">
        <Cog className="absolute -top-24 -right-24 w-[550px] h-[550px] text-[#2ecc71] animate-[spin_50s_linear_infinite]" />
        <Cog className="absolute top-1/2 -left-32 w-[650px] h-[650px] text-[#c5a059] animate-[spin_70s_linear_infinite_reverse]" />
        <Cog className="absolute -bottom-20 right-1/4 w-[500px] h-[500px] text-[#3498db] animate-[spin_60s_linear_infinite]" />
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
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="px-2.5 py-1 bg-[#0f1418] hover:bg-[#2b3d4f] text-[#bdc3c7] border border-white/10 text-xs flex items-center gap-1 transition-all"
                  title="Скопировать ссылку"
                >
                  {copied ? <Check className="w-3 h-3 text-[#2ecc71]" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Скопировано' : 'Ссылка'}</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-2.5 py-1 bg-[#0f1418] hover:bg-[#2b3d4f] text-[#bdc3c7] border border-white/10 text-xs flex items-center gap-1 transition-all"
                  title="Распечатать документ"
                >
                  <Printer className="w-3 h-3" />
                  <span>Печать</span>
                </button>
                <span className="text-xs text-[#7f8c8d] ml-2">
                  Редакция: <strong className="text-white">01.08.2026</strong>
                </span>
              </div>
            </div>

            <h1 className="text-lg md:text-xl font-black text-white uppercase tracking-wide leading-snug">
              Согласие на обработку персональных данных Клиента платформы BauSquad
            </h1>
            <p className="text-xs text-[#bdc3c7] mt-2 leading-relaxed">
              Предоставляется Оператору — Индивидуальному предпринимателю Семёнову Даниилу Алексеевичу при регистрации, оформлении заказа или заполнении форм на сайте https://bausquad.org/ и в официальных ботах.
            </p>
          </div>

          {/* 🌳 CHAPTER NAVIGATION TREE */}
          <div className="bg-[#0f1418] border border-[#2ecc71]/40 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase font-extrabold text-[#2ecc71] border-b border-white/10 pb-2">
              <FolderTree className="w-4 h-4 text-[#2ecc71]" />
              <span>Дерево разделов Согласия</span>
            </div>
            
            <nav className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
              <a href="#consent-1" className="text-[#2ecc71] hover:text-[#f1c40f] hover:underline flex items-start gap-1.5 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-[#2ecc71] shrink-0 mt-0.5" />
                <span>1. Термины и субъект согласия</span>
              </a>
              <a href="#consent-2" className="text-[#2ecc71] hover:text-[#f1c40f] hover:underline flex items-start gap-1.5 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-[#2ecc71] shrink-0 mt-0.5" />
                <span>2. Перечень обрабатываемых персональных данных</span>
              </a>
              <a href="#consent-3" className="text-[#2ecc71] hover:text-[#f1c40f] hover:underline flex items-start gap-1.5 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-[#2ecc71] shrink-0 mt-0.5" />
                <span>3. Цели обработки персональных данных</span>
              </a>
              <a href="#consent-4" className="text-[#2ecc71] hover:text-[#f1c40f] hover:underline flex items-start gap-1.5 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-[#2ecc71] shrink-0 mt-0.5" />
                <span>4. Способы и перечень действий с данными</span>
              </a>
              <a href="#consent-5" className="text-[#2ecc71] hover:text-[#f1c40f] hover:underline flex items-start gap-1.5 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-[#2ecc71] shrink-0 mt-0.5" />
                <span>5. Срок действия и порядок отзыва согласия</span>
              </a>
              <a href="#consent-6" className="text-[#2ecc71] hover:text-[#f1c40f] hover:underline flex items-start gap-1.5 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-[#2ecc71] shrink-0 mt-0.5" />
                <span>6. Реквизиты Оператора персональных данных</span>
              </a>
            </nav>
          </div>

          {/* PREAMBLE STATEMENT */}
          <div className="bg-[#0f1418]/60 p-4 border-l-2 border-[#2ecc71] space-y-2">
            <p>
              Я, Пользователь веб-сайта <a href="https://bausquad.org/" className="text-[#2ecc71] hover:underline font-mono">https://bausquad.org/</a> и (или) официального Telegram-бота <code>@BauSquadBot</code>, свободно, своей волей и в своем интересе даю настоящее информированное и сознательное согласие <strong>Индивидуальному предпринимателю Семёнову Даниилу Алексеевичу</strong> (ИНН: 773395090916, ОГРНИП: 326774600536097, адрес: 125310, г. Москва, д. Митиностан, Email: <a href="mailto:a.s.semyonov@mail.ru" className="text-[#2ecc71] hover:underline">a.s.semyonov@mail.ru</a>, <a href="mailto:support@bausquad.org" className="text-[#2ecc71] hover:underline">support@bausquad.org</a>) на обработку моих персональных данных на следующих условиях:
            </p>
          </div>

          {/* 1. TERMS */}
          <section id="consent-1" className="space-y-4 pt-4 border-t border-[#2b3d4f]">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2b3d4f] pb-2">
              <span className="w-6 h-6 rounded bg-[#2ecc71] text-black flex items-center justify-center font-mono text-xs">1</span>
              1. Термины и субъект согласия
            </h2>
            <div className="space-y-3 pl-2 sm:pl-4">
              <p>
                <strong>1.1. Клиент</strong> — дееспособное физическое лицо, принявшее условия Пользовательского соглашения и оформившее заявку на получение консультационных услуг через Платформу или официальных ботов (в «VK», в «MAX», в «TELEGRAM» и др., официальный бот: <code>@BauSquadBot</code>).
              </p>
              <p>
                <strong>1.2. Заказ</strong> — заявка Клиента на оценку стоимости и оказание платных консультационных услуг.
              </p>
            </div>
          </section>

          {/* 2. DATA LIST */}
          <section id="consent-2" className="space-y-4 pt-4 border-t border-[#2b3d4f]">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2b3d4f] pb-2">
              <span className="w-6 h-6 rounded bg-[#2ecc71] text-black flex items-center justify-center font-mono text-xs">2</span>
              2. Перечень обрабатываемых персональных данных
            </h2>
            <div className="space-y-3 pl-2 sm:pl-4">
              <p>
                Настоящее согласие распространяется на следующие персональные данные:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[#bdc3c7]">
                <li>Адрес электронной почты (Email);</li>
                <li>Номер контактного телефона;</li>
                <li>Имя пользователя / логин в системе и мессенджерах (в т.ч. Telegram username);</li>
                <li>Данные о сделанных заказах, прикрепленные файлы ТЗ и сообщения в техподдержку;</li>
                <li>Технические данные: файлы cookie, IP-адрес, данные об устройстве, браузере и операционной системе.</li>
              </ul>
            </div>
          </section>

          {/* 3. PURPOSES */}
          <section id="consent-3" className="space-y-4 pt-4 border-t border-[#2b3d4f]">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2b3d4f] pb-2">
              <span className="w-6 h-6 rounded bg-[#2ecc71] text-black flex items-center justify-center font-mono text-xs">3</span>
              3. Цели обработки персональных данных
            </h2>
            <div className="space-y-3 pl-2 sm:pl-4">
              <p>
                Обработка персональных данных осуществляется Оператором в следующих целях:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[#bdc3c7]">
                <li>Регистрация и аутентификация Клиента на Сайте и в Telegram-боте;</li>
                <li>Прием, расчет стоимости и исполнение Заказов на оказание консультационных услуг;</li>
                <li>Информирование Клиента о статусе исполнения Заказа;</li>
                <li>Обработка платежей и ведение расчетов;</li>
                <li>Предоставление консультационной и технической поддержки;</li>
                <li>Разрешение претензий и спорных вопросов.</li>
              </ul>
            </div>
          </section>

          {/* 4. ACTIONS */}
          <section id="consent-4" className="space-y-4 pt-4 border-t border-[#2b3d4f]">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2b3d4f] pb-2">
              <span className="w-6 h-6 rounded bg-[#2ecc71] text-black flex items-center justify-center font-mono text-xs">4</span>
              4. Способы и перечень действий с данными
            </h2>
            <div className="space-y-3 pl-2 sm:pl-4">
              <p>
                Обработка персональных данных может осуществляться как с использованием средств автоматизации, так и без их использования, и включает в себя:
              </p>
              <p className="text-[#ecf0f1]">
                Сбор, запись, систематизацию, накопление, хранение, уточнение (обновление, изменение), извлечение, использование, передачу (предоставление, доступ), обезличивание, блокирование, удаление, уничтожение персональных данных.
              </p>
            </div>
          </section>

          {/* 5. VALIDITY & REVOCATION */}
          <section id="consent-5" className="space-y-4 pt-4 border-t border-[#2b3d4f]">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2b3d4f] pb-2">
              <span className="w-6 h-6 rounded bg-[#2ecc71] text-black flex items-center justify-center font-mono text-xs">5</span>
              5. Срок действия и порядок отзыва согласия
            </h2>
            <div className="space-y-3 pl-2 sm:pl-4">
              <p>
                <strong>5.1.</strong> Настоящее Согласие действует с момента его предоставления до момента достижения целей обработки либо до момента его отзыва Клиентом.
              </p>
              <p>
                <strong>5.2.</strong> Клиент вправе в любое время отозвать настоящее Согласие путем направления письменного заявления на адрес электронной почты службы поддержки:{' '}
                <a href="mailto:support@bausquad.org" className="text-[#2ecc71] hover:underline font-mono">support@bausquad.org</a>.
              </p>
              <p>
                <strong>5.3.</strong> В случае отзыва Согласия Оператор прекращает обработку данных и уничтожает их в срок, не превышающий 30 (тридцати) календарных дней с даты получения отзыва, за исключением случаев, когда обработка может быть продолжена в соответствии с законодательством РФ.
              </p>
            </div>
          </section>

          {/* 6. REQUISITES */}
          <section id="consent-6" className="space-y-4 pt-4 border-t border-[#2b3d4f]">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2b3d4f] pb-2">
              <span className="w-6 h-6 rounded bg-[#2ecc71] text-black flex items-center justify-center font-mono text-xs">6</span>
              6. Реквизиты Оператора персональных данных
            </h2>
            
            {/* REQUISITES BOX */}
            <div className="mt-4 bg-[#0f1418] border border-[#2ecc71] p-5 space-y-2 text-xs font-mono text-[#ecf0f1]">
              <div className="text-xs uppercase font-extrabold text-[#2ecc71] tracking-wider border-b border-white/10 pb-2 flex items-center gap-2 font-sans">
                <CheckCircle2 className="w-4 h-4 text-[#2ecc71]" />
                Официальные реквизиты Оператора
              </div>
              <p><strong>Оператор:</strong> Индивидуальный предприниматель Семёнов Даниил Алексеевич</p>
              <p><strong>Коммерческое обозначение:</strong> «AT Bausquad» (BauSquad)</p>
              <p><strong>ИНН:</strong> 773395090916</p>
              <p><strong>ОГРНИП:</strong> 326774600536097</p>
              <p><strong>Адрес:</strong> 125310, г. Москва, д. Митиностан</p>
              <p><strong>Служба поддержки:</strong> <a href="mailto:support@bausquad.org" className="text-[#2ecc71] hover:underline">support@bausquad.org</a></p>
              <p><strong>Email для обращений:</strong> <a href="mailto:a.s.semyonov@mail.ru" className="text-[#2ecc71] hover:underline">a.s.semyonov@mail.ru</a></p>
              <p><strong>Официальный сайт:</strong> <a href="https://bausquad.org/" className="text-[#2ecc71] hover:underline">https://bausquad.org/</a></p>
            </div>
          </section>

          {/* BOTTOM RETURN HOME */}
          <div className="pt-6 border-t border-[#2b3d4f] flex flex-wrap items-center justify-between gap-4">
            <Link
              to="/"
              className="px-6 py-3 bg-[#2ecc71] text-black font-extrabold uppercase shadow-lg hover:bg-[#27ae60] transition-all flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Вернуться на главную страницу BauSquad</span>
            </Link>
            <div className="text-xs text-[#7f8c8d]">
              © {new Date().getFullYear()} BauSquad. Все права защищены.
            </div>
          </div>

        </div>

      </div>

      {/* 🚀 SCROLL TO TOP BUTTON */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 bg-[#2ecc71] text-black shadow-2xl hover:bg-[#27ae60] transition-all z-50 rounded-none border border-black/20"
          title="Наверх страницы"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

    </div>
  );
};
