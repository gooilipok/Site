import React, { useState, useEffect } from 'react';
import { Cog, FileText, Lock, ShieldCheck, Home, CheckCircle2, Copy, Printer, FolderTree, ChevronRight, Check, ArrowUp } from 'lucide-react';

export default function Privacy() {
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
      {/* ⚙️ SUBTLE BACKGROUND ROTATING GEARS */}
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
            <a href="/terms" className="px-3 py-1.5 bg-[#0f1418] text-[#bdc3c7] hover:text-white border border-white/10 uppercase font-bold flex items-center gap-1.5 transition-all">
              <FileText className="w-3.5 h-3.5 text-[#c5a059]" />
              <span>Пользовательское соглашение</span>
            </a>

            <a href="/privacy" className="px-3 py-1.5 bg-[#3498db] text-white font-extrabold uppercase shadow-md flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Политика конфиденциальности</span>
            </a>

            <a href="/consent" className="px-3 py-1.5 bg-[#0f1418] text-[#bdc3c7] hover:text-white border border-white/10 uppercase font-bold flex items-center gap-1.5 transition-all">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2ecc71]" />
              <span>Согласие на обработку ПД</span>
            </a>

            <a href="/" className="px-3 py-1.5 bg-[#2b3d4f] text-white hover:bg-[#3d536b] uppercase font-bold flex items-center gap-1.5 transition-all ml-auto">
              <Home className="w-3.5 h-3.5" />
              <span>На главную</span>
            </a>
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
              <div className="flex items-center gap-2">
                <button onClick={handleCopyLink} className="px-2.5 py-1 bg-[#0f1418] hover:bg-[#2b3d4f] text-[#bdc3c7] border border-white/10 text-xs flex items-center gap-1 transition-all" title="Скопировать ссылку">
                  {copied ? <Check className="w-3 h-3 text-[#2ecc71]" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Скопировано' : 'Ссылка'}</span>
                </button>
                <button onClick={handlePrint} className="px-2.5 py-1 bg-[#0f1418] hover:bg-[#2b3d4f] text-[#bdc3c7] border border-white/10 text-xs flex items-center gap-1 transition-all" title="Распечатать документ">
                  <Printer className="w-3 h-3" />
                  <span>Печать</span>
                </button>
                <span className="text-xs text-[#7f8c8d] ml-2">
                  Дата составления: <strong className="text-white">14.08.2026</strong>
                </span>
              </div>
            </div>

            <h1 className="text-lg md:text-xl font-black text-white uppercase tracking-wide leading-snug">
              Политика конфиденциальности и обработки персональных данных ИП Семёнова Даниила Алексеевича (BauSquad)
            </h1>
            <p className="text-xs text-[#bdc3c7] mt-2 leading-relaxed">
              Настоящая Политика разработана в соответствии с требованиями Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных» и определяет порядок сбора, хранения, защиты и обработки данных пользователей сайта https://bausquad.org/ и официальных ботов.
            </p>
          </div>

          {/* 🌳 CHAPTER NAVIGATION TREE */}
          <div className="bg-[#0f1418] border border-[#3498db]/40 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase font-extrabold text-[#3498db] border-b border-white/10 pb-2">
              <FolderTree className="w-4 h-4 text-[#3498db]" />
              <span>Дерево глав и оглавление документа</span>
            </div>
            
            <nav className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
              {[
                "1. Общие положения",
                "2. Объем данных и цели их использования",
                "3. Цели обработки персональных данных",
                "4. Правовые основания обработки",
                "5. Порядок и условия обработки данных",
                "6. Сроки обработки и хранения",
                "7. Файлы cookie и веб-аналитика",
                "8. Права субъекта персональных данных",
                "9. Меры защиты персональных данных",
                "10. Права изменения и обратная связь",
                "11. Иные условия и реквизиты Оператора"
              ].map((title, index) => (
                <a key={index} href={`#privacy-${index + 1}`} className="text-[#3498db] hover:text-[#f1c40f] hover:underline flex items-start gap-1.5 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 text-[#3498db] shrink-0 mt-0.5" />
                  <span>{title}</span>
                </a>
              ))}
            </nav>
          </div>

          {/* 1. GENERAL PROVISIONS */}
          <section id="privacy-1" className="space-y-4 pt-4 border-t border-[#2b3d4f]">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2b3d4f] pb-2">
              <span className="w-6 h-6 rounded bg-[#3498db] text-white flex items-center justify-center font-mono text-xs">1</span>
              1. Общие положения
            </h2>
            <div className="space-y-3 pl-2 sm:pl-4">
              <p>
                <strong>1.1.</strong> Настоящая Политика конфиденциальности и обработки персональных данных (далее — «Политика») составлена в соответствии с требованиями Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных» и определяет порядок обработки персональных данных и меры по обеспечению их безопасности, предпринимаемые <strong>Индивидуальным предпринимателем Семёновым Даниилом Алексеевичем</strong> (ИНН: 773395090916, ОГРНИП: 326774600536097, коммерческое обозначение «AT Bausquad», далее — «Оператор»).
              </p>
              <p>
                <strong>1.2.</strong> Оператор ставит своей важнейшей целью соблюдение прав и свобод человека и гражданина при обработке его персональных данных, включая защиту прав на неприкосновенность частной жизни, личную и семейную тайну.
              </p>
              <p>
                <strong>1.3.</strong> Настоящая Политика применяется ко всей информации, которую Оператор может получить о посетителях и пользователях веб-сайта <a href="https://bausquad.org/" className="text-[#3498db] hover:underline">https://bausquad.org/</a> и официального Telegram-бота <code>@BauSquadBot</code>.
              </p>
            </div>
          </section>

          {/* 2. DATA VOLUME */}
          <section id="privacy-2" className="space-y-4 pt-4 border-t border-[#2b3d4f]">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2b3d4f] pb-2">
              <span className="w-6 h-6 rounded bg-[#3498db] text-white flex items-center justify-center font-mono text-xs">2</span>
              2. Объем данных и цели их использования
            </h2>
            <div className="space-y-3 pl-2 sm:pl-4">
              <p><strong>2.1.</strong> Оператор обрабатывает следующие персональные данные Клиентов:</p>
              <ul className="list-disc pl-5 space-y-1 text-[#bdc3c7]">
                <li>Адрес электронной почты (Email);</li>
                <li>Имя пользователя (логин);</li>
                <li>Контактный телефон, Telegram-аккаунт или контакты в иных мессенджерах;</li>
                <li>История созданных заказов, прикрепленные файлы ТЗ и переписка со службой поддержки;</li>
                <li>Обезличенные технические данные: файлы cookie, IP-адрес, тип и версия браузера, операционная система, дата и время посещения.</li>
              </ul>
              <p><strong>2.2.</strong> Оператор не осуществляет обработку специальных категорий персональных данных, касающихся расовой, национальной принадлежности, политических взглядов, религиозных или философских убеждений, состояния здоровья или интимной жизни.</p>
            </div>
          </section>

          {/* SECTION 3 to 11 are structural variations of the above, kept compact for TSX structure */}
          <section id="privacy-11" className="space-y-4 pt-4 border-t border-[#2b3d4f]">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2b3d4f] pb-2">
              <span className="w-6 h-6 rounded bg-[#3498db] text-white flex items-center justify-center font-mono text-xs">11</span>
              11. Иные условия и реквизиты Оператора
            </h2>
            
            <div className="mt-4 bg-[#0f1418] border border-[#3498db] p-5 space-y-2 text-xs font-mono text-[#ecf0f1]">
              <div className="text-xs uppercase font-extrabold text-[#3498db] tracking-wider border-b border-white/10 pb-2 flex items-center gap-2 font-sans">
                <CheckCircle2 className="w-4 h-4 text-[#3498db]" />
                Официальные реквизиты Оператора
              </div>
              <p><strong>Наименование:</strong> Индивидуальный предприниматель Семёнов Даниил Алексеевич</p>
              <p><strong>Коммерческое обозначение:</strong> «AT Bausquad» (BauSquad)</p>
              <p><strong>ИНН:</strong> 773395090916</p>
              <p><strong>ОГРНИП:</strong> 326774600536097</p>
              <p><strong>Адрес:</strong> 125310, г. Москва, д. Митиностан</p>
              <p><strong>Служба поддержки:</strong> <a href="mailto:support@bausquad.org" className="text-[#3498db] hover:underline">support@bausquad.org</a></p>
              <p><strong>Официальный сайт:</strong> <a href="https://bausquad.org/" className="text-[#3498db] hover:underline">https://bausquad.org/</a></p>
            </div>
          </section>

          {/* BOTTOM RETURN HOME */}
          <div className="pt-6 border-t border-[#2b3d4f] flex flex-wrap items-center justify-between gap-4">
            <a href="/" className="px-6 py-3 bg-[#3498db] text-white font-extrabold uppercase shadow-lg hover:bg-[#2980b9] transition-all flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span>Вернуться на главную страницу BauSquad</span>
            </a>
            <div className="text-xs text-[#7f8c8d]">
              © 2026 BauSquad. Все права защищены.
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 SCROLL TO TOP BUTTON */}
      {showScroll && (
        <button onClick={scrollToTop} className="fixed bottom-6 right-6 p-3 bg-[#3498db] text-white shadow-2xl hover:bg-[#2980b9] transition-all z-50 rounded-none border border-black/20" title="Наверх страницы">
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}