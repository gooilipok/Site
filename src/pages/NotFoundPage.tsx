import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cpu } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 text-center">
      <div className="bg-[#1a252f] border-t-4 border-[#c5a059] max-w-md w-full p-8 shadow-2xl space-y-4 relative">
        <div className="w-16 h-16 bg-[#2b3d4f] border border-[#c5a059] flex items-center justify-center text-[#f1c40f] mx-auto text-2xl font-mono font-bold">
          404
        </div>
        <h1 className="text-2xl font-black uppercase text-white">Страница не найдена</h1>
        <p className="text-xs text-[#bdc3c7]">
          Запрошенная страница не существует, была перемещена или удалена из инфраструктуры BauSquad.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#2b3d4f] text-white font-bold text-xs uppercase border-b-2 border-[#1a252f] hover:bg-[#3d536b] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Вернуться на главную</span>
        </Link>
      </div>
    </div>
  );
};
