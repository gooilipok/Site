import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FileText, Shield, Lock, ShieldCheck, CheckCircle, Clock } from 'lucide-react';
import { AgreementDocument } from '../types';

export const AgreementsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialDoc = searchParams.get('doc') || 'terms';

  const [activeTab, setActiveTab] = useState<string>(initialDoc);
  const [agreements, setAgreements] = useState<Record<string, AgreementDocument> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgreements();
  }, []);

  const fetchAgreements = async () => {
    try {
      const resp = await fetch('/api/agreements');
      if (resp.ok) {
        const data = await resp.json();
        setAgreements(data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const currentDoc = agreements ? agreements[activeTab] : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      
      {/* HEADER */}
      <div className="bg-[#1a252f] border-t-4 border-[#c5a059] p-8 shadow-2xl">
        <div className="flex items-center gap-3 text-white mb-2">
          <ShieldCheck className="w-8 h-8 text-[#c5a059]" />
          <h1 className="text-2xl font-black uppercase tracking-wider">Правовые соглашения и документы</h1>
        </div>
        <p className="text-xs text-[#bdc3c7]">
          Официальные юридические документы платформы BauSquad, регулирующие порядок оказания услуг, конфиденциальность и обработку данных.
        </p>

        {/* TABS SELECTOR */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-[#2b3d4f]">
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-4 py-2 text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
              activeTab === 'terms'
                ? 'bg-[#c5a059] text-black shadow-md'
                : 'bg-[#0f1418] text-[#bdc3c7] hover:text-white border border-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Пользовательское соглашение</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2 text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'bg-[#c5a059] text-black shadow-md'
                : 'bg-[#0f1418] text-[#bdc3c7] hover:text-white border border-white/5'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Политика конфиденциальности</span>
          </button>

          <button
            onClick={() => setActiveTab('consent')}
            className={`px-4 py-2 text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
              activeTab === 'consent'
                ? 'bg-[#c5a059] text-black shadow-md'
                : 'bg-[#0f1418] text-[#bdc3c7] hover:text-white border border-white/5'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Согласие на обработку ПД</span>
          </button>
        </div>
      </div>

      {/* DOCUMENT CONTENT PANEL */}
      <div className="bg-[#1a252f] p-8 shadow-2xl border border-[#2b3d4f] space-y-6">
        {loading ? (
          <div className="py-12 text-center text-[#bdc3c7] text-xs">Загрузка документов...</div>
        ) : currentDoc ? (
          <div>
            <div className="flex items-center justify-between border-b border-[#2b3d4f] pb-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-white uppercase">{currentDoc.title}</h2>
                <div className="flex items-center gap-3 text-[11px] text-[#7f8c8d] mt-1">
                  <span>Версия: <strong className="text-white">{currentDoc.version}</strong></span>
                  <span>Обновлено: <strong className="text-white">{currentDoc.last_updated}</strong></span>
                </div>
              </div>

              <div className="px-3 py-1 bg-[#2ecc71]/10 border border-[#2ecc71]/30 text-[#2ecc71] font-bold text-xs uppercase flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Действительный документ</span>
              </div>
            </div>

            <div className="space-y-6 text-sm text-[#bdc3c7] leading-relaxed">
              {currentDoc.sections.map((sec, idx) => (
                <div key={idx} className="p-4 bg-[#0f1418] border border-white/5 space-y-2">
                  <h3 className="font-bold text-white text-base uppercase text-[#c5a059]">{sec.heading}</h3>
                  <p className="text-xs text-[#bdc3c7] leading-relaxed">{sec.content}</p>
                </div>
              ))}
            </div>

          </div>
        ) : (
          <div className="py-12 text-center text-[#e74c3c] text-xs">Документ не найден</div>
        )}
      </div>

    </div>
  );
};
