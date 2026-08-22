import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FileText, 
  Lock, 
  ShieldCheck, 
  Home, 
  Printer, 
  Copy, 
  Check, 
  RefreshCw, 
  Cog, 
  Search,
  X,
  ArrowUp,
  Bookmark,
  Building2,
  Calendar,
  AlertCircle,
  BookOpen
} from 'lucide-react';

interface LegalDocumentViewerProps {
  docType: 'terms' | 'privacy' | 'consent';
}

interface TocItem {
  id: string;
  title: string;
  level: number;
}

const docMeta = {
  terms: {
    title: 'Пользовательское соглашение (Оферта)',
    shortTitle: 'Пользовательское соглашение',
    fileName: 'terms.html',
    icon: FileText,
    accentColor: 'text-[#c5a059]',
    accentBg: 'bg-[#c5a059]',
    accentBorder: 'border-[#c5a059]',
    glowColor: 'shadow-[#c5a059]/10',
    description: 'Договор-оферта на оказание платных образовательных и консультационных услуг ИП Семёнов А.С.'
  },
  privacy: {
    title: 'Политика конфиденциальности',
    shortTitle: 'Политика конфиденциальности',
    fileName: 'privacy.html',
    icon: Lock,
    accentColor: 'text-[#3498db]',
    accentBg: 'bg-[#3498db]',
    accentBorder: 'border-[#3498db]',
    glowColor: 'shadow-[#3498db]/10',
    description: 'Порядок сбора, обработки и защиты персональных данных пользователей сайта и ботов BauSquad'
  },
  consent: {
    title: 'Согласие на обработку персональных данных',
    shortTitle: 'Согласие на обработку ПД',
    fileName: 'consent.html',
    icon: ShieldCheck,
    accentColor: 'text-[#2ecc71]',
    accentBg: 'bg-[#2ecc71]',
    accentBorder: 'border-[#2ecc71]',
    glowColor: 'shadow-[#2ecc71]/10',
    description: 'Условия согласия пользователя на обработку персональных данных в соответствии с 152-ФЗ'
  }
};

export const LegalDocumentViewer: React.FC<LegalDocumentViewerProps> = ({ docType }) => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');
  const [showTocMobile, setShowTocMobile] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const currentDoc = docMeta[docType] || docMeta.terms;

  const loadDocument = async () => {
    setLoading(true);
    setError(null);
    const timestamp = Date.now();
    try {
      // 1. Try dedicated API with cache busting
      const apiRes = await fetch(`/api/documents/${docType}?_t=${timestamp}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data && data.html) {
          processAndSetHtml(data.html);
          setLoading(false);
          return;
        }
      }

      // 2. Static fallbacks with cache busting
      let res = await fetch(`/docs/${currentDoc.fileName}?_t=${timestamp}`, { cache: 'no-store' });
      if (!res.ok) {
        res = await fetch(`/${currentDoc.fileName}?_t=${timestamp}`, { cache: 'no-store' });
      }

      if (!res.ok) {
        throw new Error(`Не удалось загрузить текст документа (${res.status})`);
      }

      const text = await res.text();
      processAndSetHtml(text);
    } catch (err: any) {
      console.error('[Document Load Error]', err);
      setError(err?.message || 'Ошибка загрузки документа');
    } finally {
      setLoading(false);
    }
  };

  const processAndSetHtml = (rawHtml: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml, 'text/html');

      // 1. Remove unwanted outer static navigation bars, script, style tags
      const body = doc.body;
      body.querySelectorAll('.nav-bar, nav, script, style, .nav-btn').forEach(el => el.remove());

      // If wrapped in .container, unwrap container
      const container = body.querySelector('.container');
      const rootNode = container || body;

      // 2. Remove all inline background colors & hardcoded fonts
      const allElements = rootNode.querySelectorAll('*');
      allElements.forEach((el) => {
        // Strip font tags
        if (el.tagName.toLowerCase() === 'font') {
          const span = doc.createElement('span');
          span.innerHTML = el.innerHTML;
          el.parentNode?.replaceChild(span, el);
        }
      });

      // Re-query after font tags unwrapping
      const updatedElements = rootNode.querySelectorAll('*');
      updatedElements.forEach((el) => {
        const style = el.getAttribute('style');
        if (style) {
          // Remove backgrounds, font-family, hardcoded font colors and extreme font sizes
          let cleanStyle = style
            .replace(/background(-color)?\s*:\s*[^;]+;?/gi, '')
            .replace(/font-family\s*:\s*[^;]+;?/gi, '')
            .replace(/color\s*:\s*(#000000|#060607|#1f1f22|#333333|black)[^;]*;?/gi, '')
            .replace(/font-size\s*:\s*(30pt|18pt|15pt|5|6)[^;]*;?/gi, '')
            .replace(/line-height\s*:\s*100%/gi, 'line-height: 1.65')
            .trim();
          
          if (cleanStyle) {
            el.setAttribute('style', cleanStyle);
          } else {
            el.removeAttribute('style');
          }
        }

        // Clean link attributes
        if (el.tagName.toLowerCase() === 'a') {
          const href = el.getAttribute('href');
          if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
            el.setAttribute('target', '_blank');
            el.setAttribute('rel', 'noopener noreferrer');
          }
        }
      });

      // 3. Process headings and TOC
      const paragraphs = Array.from(rootNode.querySelectorAll('p, h1, h2, h3'));
      let extractedToc: TocItem[] = [];
      let headingIndex = 0;

      paragraphs.forEach((p) => {
        const text = (p.textContent || '').trim();
        
        // Remove empty paragraph lines or artifacts
        if (!text || text === 'удачи') {
          p.remove();
          return;
        }

        // Detect main sections / headings
        const isHeading = p.tagName.toLowerCase() === 'h1' || 
                          p.tagName.toLowerCase() === 'h2' || 
                          p.tagName.toLowerCase() === 'h3' ||
                          p.querySelector('u > b') !== null ||
                          p.querySelector('b > u') !== null ||
                          /^(\d+\.|\d+\)|\bРаздел\b|\bТермины\b)/i.test(text);

        if (isHeading && text.length > 2 && text.length < 140) {
          headingIndex++;
          const id = `section-${headingIndex}`;
          p.setAttribute('id', id);
          p.classList.add('doc-heading');

          extractedToc.push({
            id,
            title: text.replace(/^(\d+[\.\)]\s*)/, '$1 ').trim(),
            level: p.tagName.toLowerCase() === 'h1' ? 1 : 2
          });
        }

        // Highlight term definitions
        if (text.startsWith('«') || text.includes('–') || text.includes(' - ')) {
          p.classList.add('term-definition');
        }
      });

      setToc(extractedToc);
      setHtmlContent(rootNode.innerHTML);
    } catch (parseErr) {
      console.warn('[Doc Parse Warning]', parseErr);
      setHtmlContent(rawHtml);
    }
  };

  useEffect(() => {
    loadDocument();
  }, [docType]);

  useEffect(() => {
    if (location.hash && !loading) {
      const targetId = location.hash.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, [location, loading, htmlContent]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      setActiveHeadingId(id);
      setShowTocMobile(false);
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const filteredHtml = useMemo(() => {
    if (!searchQuery.trim() || !htmlContent) return htmlContent;
    try {
      const query = searchQuery.trim();
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      
      // Simple HTML highlighter for text nodes
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');

      const walkTextNodes = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
          if (regex.test(node.nodeValue)) {
            const span = doc.createElement('span');
            span.innerHTML = node.nodeValue.replace(regex, '<mark class="doc-search-match">$1</mark>');
            node.parentNode?.replaceChild(span, node);
          }
        } else if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName.toLowerCase() !== 'script') {
          Array.from(node.childNodes).forEach(walkTextNodes);
        }
      };

      walkTextNodes(doc.body);
      return doc.body.innerHTML;
    } catch {
      return htmlContent;
    }
  }, [htmlContent, searchQuery]);

  const IconComponent = currentDoc.icon;

  return (
    <div className="min-h-screen bg-[#0d1217] text-[#ecf0f1] relative overflow-hidden py-6 px-3 sm:px-6">
      
      {/* ⚙️ SUBTLE INDUSTRIAL GEARS BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.03]">
        <Cog className="absolute -top-20 -left-20 w-[500px] h-[500px] text-[#c5a059] animate-[spin_50s_linear_infinite]" />
        <Cog className="absolute top-1/3 -right-32 w-[650px] h-[650px] text-[#3498db] animate-[spin_70s_linear_infinite_reverse]" />
        <Cog className="absolute -bottom-24 left-1/4 w-[550px] h-[550px] text-[#f1c40f] animate-[spin_60s_linear_infinite]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-4">
        
        {/* TOP COMPACT HEADER & CONTROLS */}
        <header className="bg-[#151c24] border-t-2 border-[#c5a059] p-4 sm:p-5 shadow-2xl rounded-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`p-2.5 bg-[#0d1217] border border-[#c5a059]/40 ${currentDoc.accentColor} rounded`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] uppercase font-extrabold tracking-wider text-[#c5a059] flex items-center gap-2">
                <span>Официальный юридический документ</span>
              </div>
              <h1 className="text-base sm:text-xl font-bold text-white leading-tight mt-0.5">
                {currentDoc.title}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* ACTION BUTTONS */}
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 bg-[#0d1217] hover:bg-[#1f2937] text-[#bdc3c7] hover:text-white border border-white/10 rounded flex items-center gap-1.5 transition-all shadow-sm"
              title="Скопировать ссылку на документ"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#2ecc71]" /> : <Copy className="w-3.5 h-3.5 text-[#c5a059]" />}
              <span>{copied ? 'Скопировано' : 'Копировать ссылку'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-[#0d1217] hover:bg-[#1f2937] text-[#bdc3c7] hover:text-white border border-white/10 rounded flex items-center gap-1.5 transition-all shadow-sm"
              title="Распечатать или сохранить в PDF"
            >
              <Printer className="w-3.5 h-3.5 text-[#3498db]" />
              <span>Печать / PDF</span>
            </button>

            <Link
              to="/"
              className="px-3.5 py-2 bg-[#2b3d4f] hover:bg-[#3d536b] text-white font-bold rounded uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md"
            >
              <Home className="w-3.5 h-3.5" />
              <span>На главную</span>
            </Link>
          </div>
        </header>

        {/* NAVIGATION TABS FOR ALL 3 AGREEMENTS */}
        <nav className="bg-[#151c24] p-2 sm:p-2.5 border border-[#232f3e] shadow-lg rounded flex flex-wrap items-center gap-2">
          <Link
            to="/terms"
            className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center gap-2 ${
              docType === 'terms'
                ? 'bg-[#c5a059] text-black font-black shadow-md'
                : 'bg-[#0d1217] text-[#bdc3c7] hover:text-white border border-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Пользовательское соглашение</span>
          </Link>

          <Link
            to="/privacy"
            className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center gap-2 ${
              docType === 'privacy'
                ? 'bg-[#3498db] text-white font-black shadow-md'
                : 'bg-[#0d1217] text-[#bdc3c7] hover:text-white border border-white/5'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Политика конфиденциальности</span>
          </Link>

          <Link
            to="/consent"
            className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center gap-2 ${
              docType === 'consent'
                ? 'bg-[#2ecc71] text-black font-black shadow-md'
                : 'bg-[#0d1217] text-[#bdc3c7] hover:text-white border border-white/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Согласие на обработку ПД</span>
          </Link>
        </nav>

        {/* SEARCH BAR & QUICK FILTERS */}
        <div className="bg-[#151c24] p-3 border border-[#232f3e] rounded flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-[#7f8c8d] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по тексту соглашения (например: возврат, оферта, бот, cookie)..."
              className="w-full pl-9 pr-8 py-2 bg-[#0d1217] border border-white/10 focus:border-[#c5a059] rounded text-xs text-white placeholder-[#7f8c8d] focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7f8c8d] hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {toc.length > 0 && (
            <button
              onClick={() => setShowTocMobile(!showTocMobile)}
              className="lg:hidden px-3 py-2 bg-[#0d1217] border border-[#c5a059]/40 text-[#c5a059] text-xs font-bold rounded flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Оглавление ({toc.length})</span>
            </button>
          )}
        </div>

        {/* MAIN LAYOUT: SIDEBAR TOC + MAIN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          
          {/* STICKY TABLE OF CONTENTS (DESKTOP) */}
          {toc.length > 0 && (
            <aside className={`lg:block ${showTocMobile ? 'block' : 'hidden'} lg:col-span-1 bg-[#151c24] border border-[#232f3e] rounded-sm p-4 sticky top-4 shadow-xl max-h-[85vh] overflow-y-auto space-y-3`}>
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-[#c5a059] tracking-wider">
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Разделы документа</span>
                </div>
                <span className="text-[10px] text-[#7f8c8d] font-mono">{toc.length} пунктов</span>
              </div>

              <div className="space-y-1 text-xs">
                {toc.map((item, idx) => {
                  const isActive = activeHeadingId === item.id;
                  return (
                    <button
                      key={idx}
                      onClick={() => scrollToHeading(item.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded transition-all text-[12px] leading-snug line-clamp-2 ${
                        isActive
                          ? 'bg-[#c5a059] text-black font-bold shadow-sm'
                          : 'text-[#bdc3c7] hover:text-white hover:bg-[#0d1217]'
                      }`}
                    >
                      {item.title}
                    </button>
                  );
                })}
              </div>

              {/* QUICK REQUISITES MINI BADGE */}
              <div className="pt-3 border-t border-white/10 text-[11px] text-[#7f8c8d] space-y-1">
                <div className="flex items-center gap-1.5 text-[#c5a059] font-bold">
                  <Building2 className="w-3 h-3" />
                  <span>ИП Семёнов А.С.</span>
                </div>
                <p>ИНН: 773395090916</p>
                <p>ОГРНИП: 326774600536097</p>
              </div>
            </aside>
          )}

          {/* MAIN DOCUMENT BODY */}
          <main className={`${toc.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'} bg-[#151c24] border-t-4 border-[#c5a059] p-5 sm:p-8 md:p-10 shadow-2xl rounded-sm relative min-h-[500px]`}>
            
            {loading && (
              <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#c5a059]">
                <Cog className="w-10 h-10 animate-spin" />
                <p className="text-sm font-mono tracking-wider">Загрузка текста соглашения...</p>
              </div>
            )}

            {error && (
              <div className="bg-[#2c1a1d] border border-[#e74c3c] p-6 text-center space-y-4 rounded">
                <AlertCircle className="w-8 h-8 text-[#e74c3c] mx-auto" />
                <p className="text-[#e74c3c] font-bold text-sm">
                  Ошибка при загрузке документа: {error}
                </p>
                <button
                  onClick={loadDocument}
                  className="px-4 py-2 bg-[#e74c3c] hover:bg-[#c0392b] text-white text-xs font-bold uppercase flex items-center gap-2 mx-auto rounded"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Попробовать снова</span>
                </button>
              </div>
            )}

            {!loading && !error && (
              <article 
                ref={contentRef}
                className="legal-doc-content text-[13.5px] leading-relaxed text-[#cfd8dc] space-y-4 font-sans"
                dangerouslySetInnerHTML={{ __html: filteredHtml }}
              />
            )}

            {/* DOCUMENT FOOTER WITH REQUISITES */}
            {!loading && !error && (
              <div className="mt-12 pt-8 border-t-2 border-[#2b3d4f] bg-[#0d1217] p-5 sm:p-6 rounded-sm border-l-4 border-l-[#c5a059] space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Building2 className="w-4 h-4 text-[#c5a059]" />
                  <span>Юридические реквизиты и контакты Оператора</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#bdc3c7]">
                  <div>
                    <p><strong className="text-white">Наименование:</strong> ИП СЕМЁНОВ АНДРЕЙ СЕРГЕЕВИЧ</p>
                    <p><strong className="text-white">Коммерческое обозначение:</strong> «AT Bausquad»</p>
                    <p><strong className="text-white">ИНН:</strong> 773395090916</p>
                    <p><strong className="text-white">ОГРНИП:</strong> 326774600536097</p>
                  </div>
                  <div>
                    <p><strong className="text-white">Адрес:</strong> 125310, г. Москва, ш. Пятницкое</p>
                    <p><strong className="text-white">Email поддержки:</strong> <a href="mailto:support@bausquad.org" className="text-[#c5a059] underline">support@bausquad.org</a></p>
                    <p><strong className="text-white">Email администрации:</strong> <a href="mailto:a.s.semyonov@mail.ru" className="text-[#c5a059] underline">a.s.semyonov@mail.ru</a></p>
                    <p><strong className="text-white">Telegram бот:</strong> <a href="https://t.me/BauSquadBot" target="_blank" rel="noopener noreferrer" className="text-[#3498db] underline">@BauSquadBot</a></p>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>

        {/* BOTTOM QUICK ACTIONS & JUMP TO TOP */}
        <footer className="bg-[#151c24] p-4 border border-[#232f3e] rounded flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="text-[#7f8c8d] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#c5a059]" />
            <span>AT Bausquad • Официальные правовые документы и регламенты</span>
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-3.5 py-1.5 bg-[#0d1217] hover:bg-[#2b3d4f] text-[#c5a059] hover:text-white border border-white/10 uppercase font-bold rounded flex items-center gap-1.5 transition-all"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Наверх страницы</span>
            </button>
          </div>
        </footer>

      </div>

      {/* REFINED INDUSTRIAL STYLES FOR PARSED LEGAL CONTENT */}
      <style>{`
        .legal-doc-content {
          color: #cfd8dc;
          line-height: 1.7;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        .legal-doc-content h1,
        .legal-doc-content .doc-heading-main {
          color: #ffffff;
          font-size: 19px;
          line-height: 1.4;
          margin: 20px 0 16px 0;
          text-align: center;
          font-weight: 800;
          letter-spacing: 0.2px;
          border-bottom: 2px solid rgba(197, 160, 89, 0.4);
          padding-bottom: 10px;
        }
        .legal-doc-content h2,
        .legal-doc-content .doc-heading {
          color: #c5a059;
          font-size: 15px;
          margin: 28px 0 14px 0;
          padding: 8px 12px;
          background: rgba(197, 160, 89, 0.08);
          border-left: 3px solid #c5a059;
          border-radius: 2px;
          font-weight: 700;
          letter-spacing: 0.3px;
          scroll-margin-top: 24px;
        }
        .legal-doc-content p {
          margin-bottom: 12px;
          color: #cfd8dc;
          text-align: justify;
          line-height: 1.7;
        }
        .legal-doc-content strong, 
        .legal-doc-content b {
          color: #ffffff;
          font-weight: 700;
        }
        .legal-doc-content em,
        .legal-doc-content i {
          color: #e2e8f0;
          font-style: italic;
        }
        .legal-doc-content u {
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .legal-doc-content a {
          color: #c5a059;
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: color 0.15s;
        }
        .legal-doc-content a:hover {
          color: #f1c40f;
          text-shadow: 0 0 8px rgba(241, 196, 15, 0.3);
        }
        .legal-doc-content ul {
          list-style-type: disc;
          margin-left: 24px;
          margin-bottom: 16px;
          space-y: 6px;
        }
        .legal-doc-content ol {
          list-style-type: decimal;
          margin-left: 24px;
          margin-bottom: 16px;
          space-y: 6px;
        }
        .legal-doc-content li {
          margin-bottom: 6px;
          color: #cfd8dc;
          line-height: 1.65;
          padding-left: 4px;
        }
        .legal-doc-content .term-definition {
          background: rgba(15, 20, 24, 0.6);
          border-left: 2px solid rgba(197, 160, 89, 0.4);
          padding: 8px 12px;
          margin-bottom: 10px;
          border-radius: 0 4px 4px 0;
        }
        .legal-doc-content .term-definition b,
        .legal-doc-content .term-definition strong {
          color: #c5a059;
        }
        .legal-doc-content mark.doc-search-match {
          background-color: #f1c40f;
          color: #000000;
          font-weight: bold;
          padding: 1px 4px;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};
