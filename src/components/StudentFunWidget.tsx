import React, { useState } from 'react';
import { Coffee, Flame, Sparkles, Smile, RefreshCw, Zap, ShieldCheck, Heart, AlertTriangle } from 'lucide-react';

const FUN_EXCUSES = [
  "«Файл курса зашифровался из-за магнитной вспышки на Солнце»",
  "«Кот заснул на клавише Delete и отредактировал 3-ю главу»",
  "«Ноутбук ушел в глубокую технологическую медитацию»",
  "«Методические указания вступили в философский конфликт с реальным миром»",
  "«Флешка случайно улетела в другое измерение вместе со вторым носком»",
  "«Библиографический список отказался оформляться без чашечки эспрессо»",
  "«Графики ушли на самоизоляцию в графическом редакторе»"
];

export const StudentFunWidget: React.FC<{ onCreateOrder: () => void }> = ({ onCreateOrder }) => {
  const [panicLevel, setPanicLevel] = useState<number>(45);
  const [coffeeCount, setCoffeeCount] = useState<number>(3);
  const [currentExcuse, setCurrentExcuse] = useState<string>(FUN_EXCUSES[0]);
  const [isPanicReset, setIsPanicReset] = useState<boolean>(false);

  const getPanicStatus = (level: number) => {
    if (level < 25) return { label: 'Спокойствие и дзен 🧘', color: 'text-[#2ecc71]', border: 'border-[#2ecc71]' };
    if (level < 60) return { label: 'Легкий дедлайновый мандраж ⚡', color: 'text-[#f1c40f]', border: 'border-[#f1c40f]' };
    if (level < 85) return { label: 'Академическая тревога 😱', color: 'text-[#e67e22]', border: 'border-[#e67e22]' };
    return { label: 'КРИТИЧЕСКАЯ ПАНИКА! ДЕДЛАЙН ВЧЕРА! 🔥🔥🔥', color: 'text-[#e74c3c]', border: 'border-[#e74c3c]' };
  };

  const handleCoffeeClick = () => {
    setCoffeeCount(prev => prev + 1);
  };

  const handleNewExcuse = () => {
    const randomIndex = Math.floor(Math.random() * FUN_EXCUSES.length);
    setCurrentExcuse(FUN_EXCUSES[randomIndex]);
  };

  const handlePanicReset = () => {
    setPanicLevel(0);
    setIsPanicReset(true);
    setTimeout(() => setIsPanicReset(false), 5000);
  };

  const status = getPanicStatus(panicLevel);

  return (
    <div className="bg-[#1a252f] border-2 border-[#2b3d4f] p-6 md:p-8 shadow-2xl relative overflow-hidden font-sans my-8">
      
      {/* Top Banner */}
      <div className="flex items-center justify-between gap-2 border-b border-[#2b3d4f] pb-3 mb-6">
        <div className="flex items-center gap-2 text-[#c5a059] font-mono text-xs font-bold uppercase tracking-widest">
          <Sparkles className="w-4 h-4 text-[#f1c40f]" />
          <span>БЕСПОЛЕЗНЫЙ, НО ОЧЕНЬ ВАЖНЫЙ СТУДЕНЧЕСКИЙ СТРЕСС-РЕАКТОР</span>
        </div>
        <span className="text-[10px] text-[#7f8c8d] font-mono uppercase bg-[#0f1418] px-2 py-0.5 border border-white/5">
          v2.0 FUN-EDITION
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Module 1: Panic Meter */}
        <div className="bg-[#0f1418] p-5 border border-[#2b3d4f] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2 font-mono">
              <span className="text-xs font-bold uppercase text-[#c5a059] flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#e74c3c]" />
                Уровень паники
              </span>
              <span className={`text-xs font-bold ${status.color}`}>
                {panicLevel}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={panicLevel}
              onChange={(e) => setPanicLevel(Number(e.target.value))}
              className="w-full h-2 bg-[#2b3d4f] rounded-lg appearance-none cursor-pointer accent-[#c5a059]"
            />

            <div className={`mt-3 p-2.5 bg-[#1a252f] border ${status.border} text-xs font-bold text-center ${status.color}`}>
              {status.label}
            </div>
          </div>

          <button
            onClick={handlePanicReset}
            className="w-full py-2.5 bg-[#e74c3c] hover:bg-[#c0392b] text-white font-black uppercase text-xs tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
          >
            <Zap className="w-4 h-4" />
            <span>Сбросить панику в 0%!</span>
          </button>
        </div>

        {/* Module 2: Coffee Reactor */}
        <div className="bg-[#0f1418] p-5 border border-[#2b3d4f] flex flex-col justify-between text-center space-y-3">
          <div>
            <span className="text-xs font-mono font-bold uppercase text-[#c5a059] block mb-2 flex items-center justify-center gap-1.5">
              <Coffee className="w-4 h-4 text-[#c5a059]" />
              Кофейный Симулятор
            </span>

            <div className="text-4xl font-black text-white font-mono my-2 drop-shadow-[0_0_10px_rgba(197,160,89,0.5)]">
              ☕ {coffeeCount}
            </div>
            <p className="text-[11px] text-[#bdc3c7]">
              Чашек кофе выпито во время попыток написать работу самостоятельно
            </p>
          </div>

          <button
            onClick={handleCoffeeClick}
            className="w-full py-2.5 bg-[#2b3d4f] hover:bg-[#3d536b] text-[#c5a059] border border-[#c5a059] font-bold uppercase text-xs transition-all flex items-center justify-center gap-2"
          >
            <Coffee className="w-4 h-4" />
            <span>+1 Чашка кофе</span>
          </button>
        </div>

        {/* Module 3: Excuse Generator */}
        <div className="bg-[#0f1418] p-5 border border-[#2b3d4f] flex flex-col justify-between space-y-3">
          <div>
            <span className="text-xs font-mono font-bold uppercase text-[#c5a059] block mb-2 flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-[#f1c40f]" />
              Генератор отговорок
            </span>

            <div className="p-3 bg-[#1a252f] border border-white/10 text-xs italic text-[#bdc3c7] my-2 min-h-[64px] flex items-center justify-center text-center">
              {currentExcuse}
            </div>
          </div>

          <button
            onClick={handleNewExcuse}
            className="w-full py-2 bg-[#1a252f] hover:bg-[#2b3d4f] text-white border border-[#3d4e5f] font-bold uppercase text-[11px] transition-all flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#f1c40f]" />
            <span>Сгенерировать отговорку</span>
          </button>
        </div>

      </div>

      {/* Panic Reset Notification Card */}
      {isPanicReset && (
        <div className="mt-4 p-4 bg-[#0d211a] border-2 border-[#2ecc71] text-xs text-[#2ecc71] font-mono flex items-center justify-between gap-3 animate-bounce">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#2ecc71]" />
            <span>ПАНИКА СБРОШЕНА! Команда BauSquad взяла ваши учебные заботы под свой контроль. Выдыхайте!</span>
          </div>
          <button 
            onClick={onCreateOrder}
            className="px-3 py-1 bg-[#2ecc71] text-black font-bold uppercase text-[11px] hover:bg-[#27ae60]"
          >
            Оформить заказ
          </button>
        </div>
      )}

    </div>
  );
};
