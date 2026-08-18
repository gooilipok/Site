import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Lock, ShieldCheck, ArrowUp, Cog, CheckCircle2, Home, FolderTree, ChevronRight, Copy, Check, Printer } from 'lucide-react';

export const TermsPage: React.FC = () => {
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
        <Cog className="absolute -top-20 -left-20 w-[500px] h-[500px] text-[#c5a059] animate-[spin_50s_linear_infinite]" />
        <Cog className="absolute top-1/3 -right-32 w-[650px] h-[650px] text-[#3498db] animate-[spin_70s_linear_infinite_reverse]" />
        <Cog className="absolute -bottom-24 left-1/4 w-[550px] h-[550px] text-[#f1c40f] animate-[spin_60s_linear_infinite]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10 space-y-6">
        
        {/* 🧭 NAVIGATION BAR AT THE TOP */}
        <div className="bg-[#1a252f] border-b-2 border-[#c5a059] p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs uppercase font-bold text-[#c5a059]">
            <Cog className="w-4 h-4 animate-[spin_12s_linear_infinite]" />
            <span>Документы и Соглашения BauSquad</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link
              to="/terms"
              className="px-3 py-1.5 bg-[#c5a059] text-black font-extrabold uppercase shadow-md flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
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
        <div className="bg-[#1a252f] border-t-4 border-[#c5a059] p-6 md:p-12 shadow-2xl space-y-8 relative font-sans text-xs text-[#bdc3c7] leading-relaxed">
          
          {/* DOCUMENT HEADER */}
          <div className="border-b border-[#2b3d4f] pb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
              <span className="px-3 py-1 bg-[#c5a059]/20 border border-[#c5a059] text-[#f1c40f] text-xs font-mono uppercase font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Публичная Оферта • Официальный документ
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
              Пользовательское соглашение с Индивидуальным предпринимателем Семёновым Даниилом Алексеевичем, использующим коммерческое обозначение: «AT Bausquad»
            </h1>
            <p className="text-xs text-[#bdc3c7] mt-2 leading-relaxed">
              (Публичная оферта на оказание платных консультационных услуг и предоставление доступа к сервисам платформы https://bausquad.org/ и официальных ботов)
            </p>
          </div>

          {/* 🌳 CHAPTER NAVIGATION TREE */}
          <div className="bg-[#0f1418] border border-[#c5a059]/40 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase font-extrabold text-[#c5a059] border-b border-white/10 pb-2">
              <FolderTree className="w-4 h-4 text-[#c5a059]" />
              <span>Дерево глав и оглавление соглашения</span>
            </div>
            
            <nav className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
              <a href="#terms-1" className="text-[#c5a059] hover:text-[#f1c40f] hover:underline flex items-start gap-1.5 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-[#c5a059] shrink-0 mt-0.5" />
                <span>1. Термины и определения</span>
              </a>
              <a href="#terms-2" className="text-[#c5a059] hover:text-[#f1c40f] hover:underline flex items-start gap-1.5 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-[#c5a059] shrink-0 mt-0.5" />
                <span>2. Предмет и порядок заключения соглашения</span>
              </a>
              <a href="#terms-3" className="text-[#c5a059] hover:text-[#f1c40f] hover:underline flex items-start gap-1.5 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-[#c5a059] shrink-0 mt-0.5" />
                <span>3. Функциональные возможности платформы</span>
              </a>
              <a href="#terms-4" className="text-[#c5a059] hover:text-[#f1c40f] hover:underline flex items-start gap-1.5 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-[#c5a059] shrink-0 mt-0.5" />
                <span>4. Ответственность и права сторон</span>
              </a>
              <a href="#terms-5" className="text-[#c5a059] hover:text-[#f1c40f] hover:underline flex items-start gap-1.5 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-[#c5a059] shrink-0 mt-0.5" />
                <span>5. Финансовые условия и порядок расчётов</span>
              </a>
              <a href="#terms-6" className="text-[#c5a059] hover:text-[#f1c40f] hover:underline flex items-start gap-1.5 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-[#c5a059] shrink-0 mt-0.5" />
                <span>6. Порядок разрешения споров</span>
              </a>
              <a href="#terms-7" className="text-[#c5a059] hover:text-[#f1c40f] hover:underline flex items-start gap-1.5 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-[#c5a059] shrink-0 mt-0.5" />
                <span>7. Конфиденциальность и интеллектуальные права</span>
              </a>
              <a href="#terms-8" className="text-[#c5a059] hover:text-[#f1c40f] hover:underline flex items-start gap-1.5 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-[#c5a059] shrink-0 mt-0.5" />
                <span>8. Срок действия и заключительные положения</span>
              </a>
            </nav>
          </div>

          {/* PREAMBLE */}
          <div className="bg-[#0f1418]/60 p-4 border-l-2 border-[#c5a059] space-y-2">
            <p>
              Настоящий документ, постоянно размещённый в сети Интернет по сетевому адресу{' '}
              <a href="https://bausquad.org/terms" className="text-[#c5a059] hover:underline font-mono">https://bausquad.org/terms</a>,{' '}
              является публичной офертой <strong>Индивидуального предпринимателя Семёнова Даниила Алексеевича</strong>{' '}
              (далее по тексту — «Исполнитель», коммерческое обозначение: «AT Bausquad», ИНН: 773395090916, ОГРНИП: 326774600536097) физическому лицу (далее по тексту — «Клиент», «Пользователь») заключить Пользовательское соглашение на оказание платных консультационных услуг на изложенных ниже условиях.
            </p>
            <p>
              В соответствии с пунктом 2 статьи 437 Гражданского кодекса Российской Федерации (ГК РФ) оформление заявки на Сайте или в официальном Telegram-боте (@BauSquadBot), авторизация либо осуществление оплаты является полным и безоговорочным акцептом настоящей оферты.
            </p>
          </div>

          {/* 1. TERMS & DEFINITIONS */}
          <section id="terms-1" className="space-y-4 pt-4 border-t border-[#2b3d4f]">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2b3d4f] pb-2">
              <span className="w-6 h-6 rounded bg-[#c5a059] text-black flex items-center justify-center font-mono text-xs">1</span>
              1. Термины и определения
            </h2>
            <div className="space-y-3 pl-2 sm:pl-4">
              <p>
                <strong>1.1. Платформа / Сайт</strong> — веб-сайт, расположенный в сети Интернет по адресу:{' '}
                <a href="https://bausquad.org/" className="text-[#c5a059] hover:underline">https://bausquad.org/</a>{' '}
                со всеми поддоменами, программным обеспечением, базами данных, графическими и текстовыми материалами.
              </p>
              <p>
                <strong>1.2. Исполнитель (Администрация)</strong> — Индивидуальный предприниматель Семёнов Даниил Алексеевич (ИНН 773395090916, ОГРНИП 326774600536097, адрес: 125310, г. Москва, д. Митиностан), осуществляющий деятельность под коммерческим обозначением «AT Bausquad» (BauSquad), обеспечивающий функционирование Сайта и оказание консультационных услуг.
              </p>
              <p>
                <strong>1.3. Консультационные услуги</strong> — услуги по подбору научной и учебной литературы, структурированию информации, составлению обзоров, анализу источников, макетированию, техническому редактированию и форматированию учебных и научно-исследовательских материалов.
              </p>
              <p>
                <strong>1.4. Клиент (Пользователь)</strong> — дееспособное физическое лицо, достигшее возраста 18 лет (или эмансипированное в установленном законом порядке), принявшее условия настоящего Соглашения и оформившее Заказ.
              </p>
              <p>
                <strong>1.5. Официальные боты и каналы</strong> — программные боты в мессенджерах (Telegram: <code>@BauSquadBot</code>, VK, MAX), через которые осуществляется прием заявок, коммуникация и информирование клиентов.
              </p>
              <p>
                <strong>1.6. Заказ</strong> — индивидуальная заявка Клиента, содержащая тему (предмет), описание, требования, сроки и контактные данные, направленная Исполнителю для оценки стоимости и выполнения.
              </p>
              <p>
                <strong>1.7. Техническое задание (ТЗ)</strong> — перечень исходных данных, методических требований, плана работы и критериев оформления, предоставленных Клиентом при оформлении Заказа.
              </p>
              <p>
                <strong>1.8. Макет работы (Результат услуг)</strong> — результат оказания консультационных услуг в виде структурированного текстового, аналитического или расчетного материала, предназначенного исключительно для использования в качестве вспомогательного образца или источника информации.
              </p>
            </div>
          </section>

          {/* 2. SUBJECT & CONCLUSION */}
          <section id="terms-2" className="space-y-4 pt-4 border-t border-[#2b3d4f]">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2b3d4f] pb-2">
              <span className="w-6 h-6 rounded bg-[#c5a059] text-black flex items-center justify-center font-mono text-xs">2</span>
              2. Предмет и порядок заключения пользовательского соглашения
            </h2>
            <div className="space-y-3 pl-2 sm:pl-4">
              <p>
                <strong>2.1.</strong> Исполнитель обязуется оказать Клиенту консультационные услуги в соответствии с согласованным ТЗ, а Клиент обязуется принять результат оказанных услуг и оплатить их стоимость в полном объеме.
              </p>
              <p>
                <strong>2.2.</strong> Оформление заявки на Сайте или через бота является подтверждением ознакомления и полного согласия Клиента с настоящим Соглашением, Политикой конфиденциальности и Согласием на обработку персональных данных.
              </p>
              <p>
                <strong>2.3.</strong> После получения заявки Исполнитель производит предварительную оценку стоимости и сроков выполнения Заказа. Окончательные условия фиксируются в Личном кабинете или в переписке с Клиентом.
              </p>
              <p>
                <strong>2.4.</strong> Обязательства Исполнителя по Заказу вступают в силу с момента внесения Клиентом согласованной предоплаты (или полной оплаты) и предоставления исчерпывающего Технического задания.
              </p>
              <p>
                <strong>2.5.</strong> В течение <strong>14 (четырнадцати) календарных дней</strong> с момента предоставления первоначального макета работы Клиент имеет право на бесплатные корректировки, если они строго соответствуют изначально предоставленному ТЗ. Корректировки, выходящие за рамки первоначального ТЗ, оплачиваются отдельно по согласованию сторон.
              </p>
            </div>
          </section>

          {/* 3. PLATFORM CAPABILITIES */}
          <section id="terms-3" className="space-y-4 pt-4 border-t border-[#2b3d4f]">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2b3d4f] pb-2">
              <span className="w-6 h-6 rounded bg-[#c5a059] text-black flex items-center justify-center font-mono text-xs">3</span>
              3. Функциональные возможности платформы AT Bausquad
            </h2>
            <div className="space-y-3 pl-2 sm:pl-4">
              <p>
                <strong>3.1.</strong> Платформа предоставляет Клиенту доступ к функционалу Личного кабинета, включающему создание заявок, прикрепление файлов ТЗ, отслеживание статуса исполнения, финансовую историю и обращение в службу технической поддержки.
              </p>
              <p>
                <strong>3.2.</strong> Администрация прилагает все разумные усилия для обеспечения круглосуточной бесперебойной работы Сайта, однако не несет ответственности за временные технические сбои, вызванные обстоятельствами непреодолимой силы или профилактическими работами провайдеров.
              </p>
            </div>
          </section>

          {/* 4. RIGHTS AND RESPONSIBILITIES */}
          <section id="terms-4" className="space-y-4 pt-4 border-t border-[#2b3d4f]">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2b3d4f] pb-2">
              <span className="w-6 h-6 rounded bg-[#c5a059] text-black flex items-center justify-center font-mono text-xs">4</span>
              4. Ответственность и права сторон
            </h2>
            <div className="space-y-3 pl-2 sm:pl-4">
              <p>
                <strong>4.1.</strong> Клиент обязуется своевременно предоставлять достоверные контактные данные, методические указания и уточнения, необходимые для качественного оказания консультационных услуг.
              </p>
              <p>
                <strong>4.2.</strong> Результаты консультационных услуг (макеты, расчеты, подборки) носят исключительно информационно-консультационный характер и предназначены для самостоятельной подготовки Клиента. Клиент самостоятельно принимает решение о способах использования полученных материалов.
              </p>
              <p>
                <strong>4.3.</strong> Исполнитель гарантирует соблюдение конфиденциальности всей переданной Клиентом информации и не передает данные третьим лицам без законных оснований.
              </p>
              <p>
                <strong>4.4.</strong> Клиент вправе в любой момент отказаться от исполнения Заказа до момента его завершения, оплатив Исполнителю фактически понесенные расходы и пропорциональную часть выполненной работы.
              </p>
            </div>
          </section>

          {/* 5. FINANCIAL CONDITIONS */}
          <section id="terms-5" className="space-y-4 pt-4 border-t border-[#2b3d4f]">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2b3d4f] pb-2">
              <span className="w-6 h-6 rounded bg-[#c5a059] text-black flex items-center justify-center font-mono text-xs">5</span>
              5. Финансовые условия и порядок расчетов
            </h2>
            <div className="space-y-3 pl-2 sm:pl-4">
              <p>
                <strong>5.1.</strong> Стоимость консультационных услуг по каждому Заказу формируется индивидуально на основании сложности темы, объема, требований к оформлению и срочности.
              </p>
              <p>
                <strong>5.2.</strong> Оплата производится в российских рублях безналичным расчетом через интегрированные платежные шлюзы, банковские переводы или электронные средства платежа.
              </p>
              <p>
                <strong>5.3.</strong> При возникновении спорных вопросов о качестве оказанных услуг Клиент вправе направить мотивированную претензию с указанием конкретных несоответствий первоначальному ТЗ.
              </p>
            </div>
          </section>

          {/* 6. DISPUTE RESOLUTION */}
          <section id="terms-6" className="space-y-4 pt-4 border-t border-[#2b3d4f]">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2b3d4f] pb-2">
              <span className="w-6 h-6 rounded bg-[#c5a059] text-black flex items-center justify-center font-mono text-xs">6</span>
              6. Порядок разрешения споров
            </h2>
            <div className="space-y-3 pl-2 sm:pl-4">
              <p>
                <strong>6.1.</strong> Все споры и разногласия, возникающие из настоящего Соглашения, подлежат разрешению в обязательном досудебном претензионном порядке.
              </p>
              <p>
                <strong>6.2.</strong> Претензия направляется Клиентом на официальный адрес электронной почты Исполнителя:{' '}
                <a href="mailto:support@bausquad.org" className="text-[#c5a059] hover:underline font-mono">support@bausquad.org</a>.
              </p>
              <p>
                <strong>6.3.</strong> Срок рассмотрения письменной претензии составляет <strong>14 (четырнадцать) календарных дней</strong> со дня её получения. При недостижении согласия спор передается на рассмотрение в суд по месту нахождения Исполнителя в соответствии с законодательством РФ.
              </p>
            </div>
          </section>

          {/* 7. CONFIDENTIALITY & INTELLECTUAL PROPERTY */}
          <section id="terms-7" className="space-y-4 pt-4 border-t border-[#2b3d4f]">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2b3d4f] pb-2">
              <span className="w-6 h-6 rounded bg-[#c5a059] text-black flex items-center justify-center font-mono text-xs">7</span>
              7. Конфиденциальность и интеллектуальные права
            </h2>
            <div className="space-y-3 pl-2 sm:pl-4">
              <p>
                <strong>7.1.</strong> Стороны признают конфиденциальной любую информацию, полученную друг от друга в процессе исполнения Заказа, включая персональные данные, тексты ТЗ и переписку.
              </p>
              <p>
                <strong>7.2.</strong> Все исключительные права на программное обеспечение Платформы, графический дизайн, товарные знаки и структуру базы данных принадлежат Исполнителю.
              </p>
            </div>
          </section>

          {/* 8. DURATION & DETAILS */}
          <section id="terms-8" className="space-y-4 pt-4 border-t border-[#2b3d4f]">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2b3d4f] pb-2">
              <span className="w-6 h-6 rounded bg-[#c5a059] text-black flex items-center justify-center font-mono text-xs">8</span>
              8. Срок действия соглашения и реквизиты Исполнителя
            </h2>
            <div className="space-y-3 pl-2 sm:pl-4">
              <p>
                <strong>8.1.</strong> Соглашение вступает в силу с момента акцепта оферты Клиентом и действует до полного исполнения Сторонами принятых обязательств.
              </p>
              <p>
                <strong>8.2.</strong> Исполнитель вправе в одностороннем порядке вносить изменения в настоящее Соглашение. Новая редакция вступает в силу с момента ее опубликования на Сайте.
              </p>
            </div>

            {/* REQUISITES BOX */}
            <div className="mt-6 bg-[#0f1418] border border-[#c5a059] p-5 space-y-2 text-xs font-mono text-[#ecf0f1]">
              <div className="text-xs uppercase font-extrabold text-[#c5a059] tracking-wider border-b border-white/10 pb-2 flex items-center gap-2 font-sans">
                <CheckCircle2 className="w-4 h-4 text-[#c5a059]" />
                Официальные реквизиты Исполнителя
              </div>
              <p><strong>Наименование:</strong> Индивидуальный предприниматель Семёнов Даниил Алексеевич</p>
              <p><strong>Коммерческое обозначение:</strong> «AT Bausquad» (BauSquad)</p>
              <p><strong>ИНН:</strong> 773395090916</p>
              <p><strong>ОГРНИП:</strong> 326774600536097</p>
              <p><strong>Адрес:</strong> 125310, г. Москва, д. Митиностан</p>
              <p><strong>Служба поддержки:</strong> <a href="mailto:support@bausquad.org" className="text-[#c5a059] hover:underline">support@bausquad.org</a></p>
              <p><strong>Email для обращений:</strong> <a href="mailto:a.s.semyonov@mail.ru" className="text-[#c5a059] hover:underline">a.s.semyonov@mail.ru</a></p>
              <p><strong>Официальный сайт:</strong> <a href="https://bausquad.org/" className="text-[#c5a059] hover:underline">https://bausquad.org/</a></p>
            </div>
          </section>

          {/* BOTTOM RETURN HOME */}
          <div className="pt-6 border-t border-[#2b3d4f] flex flex-wrap items-center justify-between gap-4">
            <Link
              to="/"
              className="px-6 py-3 bg-[#c5a059] text-black font-extrabold uppercase shadow-lg hover:bg-[#d4af37] transition-all flex items-center gap-2"
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
          className="fixed bottom-6 right-6 p-3 bg-[#c5a059] text-black shadow-2xl hover:bg-[#d4af37] transition-all z-50 rounded-none border border-black/20"
          title="Наверх страницы"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

    </div>
  );
};
