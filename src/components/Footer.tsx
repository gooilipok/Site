import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, Lock, Send, ExternalLink } from 'lucide-react';
import { BauSquadLogo } from './BauSquadLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0a0e11] border-t border-[#2b3d4f] text-[#bdc3c7] text-sm py-10 px-4 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        
        {/* BRAND COL */}
        <div>
          <div className="mb-3">
            <BauSquadLogo size="sm" />
          </div>
          <p className="text-xs text-[#7f8c8d] leading-relaxed">
            Команда специалистов для решения студенческих и научно-исследовательских задач любой сложности. Соблюдение сроков, сдача под ключ и полная конфиденциальность.
          </p>
        </div>

        {/* LEGAL & AGREEMENTS LINKS */}
        <div>
          <h4 className="text-white font-bold uppercase text-xs tracking-wider mb-3 border-b border-[#2b3d4f] pb-1">
            Правовая информация
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/terms" className="hover:text-[#c5a059] transition-colors flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#c5a059]" />
                Пользовательское соглашение
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-[#c5a059] transition-colors flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#c5a059]" />
                Политика конфиденциальности
              </Link>
            </li>
            <li>
              <Link to="/consent" className="hover:text-[#c5a059] transition-colors flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#c5a059]" />
                Согласие на обработку персональных данных
              </Link>
            </li>
          </ul>
        </div>

        {/* TELEGRAM BOT SECTION */}
        <div>
          <h4 className="text-white font-bold uppercase text-xs tracking-wider mb-3 border-b border-[#2b3d4f] pb-1">
            Наш Телеграм-бот
          </h4>
          <p className="text-xs text-[#7f8c8d] mb-3 leading-relaxed">
            Удобный официальный Телеграм-бот для оперативных консультаций, вопросов по проектам и быстрой связи с нашей инженерной командой.
          </p>
          <a
            href="https://t.me/BauSquadBot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2b3d4f] border border-[#3498db] text-[#3498db] hover:bg-[#3498db] hover:text-white font-bold text-xs uppercase transition-all shadow-md"
          >
            <Send className="w-4 h-4" />
            <span>Открыть @BauSquadBot</span>
            <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </div>

      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#7f8c8d]">
        <p>© {new Date().getFullYear()} BauSquad. Все права защищены.</p>
      </div>
    </footer>
  );
};
