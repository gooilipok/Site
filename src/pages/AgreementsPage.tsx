import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FileText, Lock, ShieldCheck, Home, ChevronRight, Cog } from 'lucide-react';
import { LegalDocumentViewer } from '../components/LegalDocumentViewer';

export const AgreementsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const docParam = searchParams.get('doc') || 'terms';
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'consent'>(
    docParam === 'privacy' ? 'privacy' : docParam === 'consent' ? 'consent' : 'terms'
  );

  const handleTabChange = (tab: 'terms' | 'privacy' | 'consent') => {
    setActiveTab(tab);
    setSearchParams({ doc: tab });
  };

  return (
    <div className="min-h-screen bg-[#0f1418] text-[#ecf0f1] relative overflow-hidden py-6 px-4 sm:px-6">
      
      {/* ⚙️ BACKGROUND ROTATING GEARS */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.03]">
        <Cog className="absolute -top-20 -left-20 w-[500px] h-[500px] text-[#c5a059] animate-[spin_50s_linear_infinite]" />
        <Cog className="absolute top-1/3 -right-32 w-[650px] h-[650px] text-[#3498db] animate-[spin_70s_linear_infinite_reverse]" />
        <Cog className="absolute -bottom-24 left-1/4 w-[550px] h-[550px] text-[#f1c40f] animate-[spin_60s_linear_infinite]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10 space-y-4">
        
        {/* TOP NAVIGATION / BREADCRUMBS */}
        <div className="bg-[#1a252f] border-b-2 border-[#c5a059] p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs uppercase font-bold text-[#c5a059]">
            <ShieldCheck className="w-4 h-4 text-[#c5a059]" />
            <span>Правовые документы и соглашения BauSquad</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#bdc3c7]">
            <Link to="/" className="hover:text-white flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>Главная</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-[#7f8c8d]" />
            <span className="text-[#c5a059]">Юридические соглашения</span>
          </div>
        </div>

        {/* TABS SWITCHER */}
        <div className="bg-[#1a252f] p-3 border border-[#2b3d4f] shadow-lg flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleTabChange('terms')}
              className={`px-4 py-2 text-xs font-bold uppercase transition-all flex items-center gap-2 ${
                activeTab === 'terms'
                  ? 'bg-[#c5a059] text-black shadow-lg shadow-[#c5a059]/20 font-black'
                  : 'bg-[#0f1418] text-[#bdc3c7] hover:text-white border border-white/5'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Пользовательское соглашение</span>
            </button>

            <button
              onClick={() => handleTabChange('privacy')}
              className={`px-4 py-2 text-xs font-bold uppercase transition-all flex items-center gap-2 ${
                activeTab === 'privacy'
                  ? 'bg-[#3498db] text-white shadow-lg shadow-[#3498db]/20 font-black'
                  : 'bg-[#0f1418] text-[#bdc3c7] hover:text-white border border-white/5'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Политика конфиденциальности</span>
            </button>

            <button
              onClick={() => handleTabChange('consent')}
              className={`px-4 py-2 text-xs font-bold uppercase transition-all flex items-center gap-2 ${
                activeTab === 'consent'
                  ? 'bg-[#2ecc71] text-black shadow-lg shadow-[#2ecc71]/20 font-black'
                  : 'bg-[#0f1418] text-[#bdc3c7] hover:text-white border border-white/5'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Согласие на обработку ПД</span>
            </button>
          </div>
        </div>

        {/* ACTIVE DOCUMENT VIEW */}
        <div className="transition-all">
          <LegalDocumentViewer docType={activeTab} />
        </div>
      </div>
    </div>
  );
};
