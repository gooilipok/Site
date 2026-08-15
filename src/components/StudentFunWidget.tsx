import React, { useState } from 'react';
import { Coffee, Flame, Sparkles, Smile, RefreshCw, Zap, ShieldCheck } from 'lucide-react';

// Tier 1: Light / Everyday / Academic Excuses (0-2 coffee cups or low panic)
const TIER1_EXCUSES = [
  "«Библиографический список отказался оформляться без чашечки эспрессо»",
  "«Сосед за стеной включил перфоратор ровно в момент моего интеллектуального озарения»",
  "«Форматирование по ГОСТу съехало при пересылке файла с Windows на Mac»",
  "«Учебник из научной библиотеки оказался написан на древнеарамейском»",
  "«Преподаватель ушел на срочную конференцию в неизвестном направлении»",
  "«Маркер для доски высох на середине ключевого чертежа»",
  "«Собака проявила повышенный гастрономический интерес к распечатанному титульному листу»",
  "«Мышка потеряла связь с компьютером из-за низкого заряда батарейки»",
  "«Ноутбук решил именно сейчас установить масштабное обновление драйверов»"
];

// Tier 2: Weird / Bizarre Academic Excuses (3-5 coffee cups or medium panic)
const TIER2_EXCUSES = [
  "«Методические указания вступили в философский конфликт с реальным миром»",
  "«Графики и диаграммы ушли на самоизоляцию в графическом редакторе»",
  "«Нейросеть устала и ушла в бессрочный отпуск до следующего семестра»",
  "«Кот заснул на клавише Delete и профессионально отредактировал 3-ю главу»",
  "«Флешка с исходниками улетела в другое измерение вместе со вторым носком»",
  "«Курсовой проект ушел искать вдохновение на Лазурный берег»",
  "«Формулы в Mathcad обрели разум и категорически отказались делиться на ноль»",
  "«Теорема Пифагора подала на меня в суд за нарушение авторских прав»",
  "«Системный блок начал издавать реалистичные звуки закипающего чайника»"
];

// Tier 3: Extreme Surreal & Absurd Excuses (6+ coffee cups or high panic)
const TIER3_EXCUSES = [
  "«Файл курса зашифровался из-за мощной магнитной вспышки на Солнце»",
  "«Уравнения Шрёдингера одновременно решились и не решились во всех параллельных мирах»",
  "«Инопланетяне похитили чертеж диплома для постройки летающей тарелки»",
  "«Локальная гравитационная аномалия притянула кружку кофе прямо в центр клавиатуры»",
  "«Экзистенциальный кризис домашнего кота заставил переосмыслить всю экономику РФ»",
  "«Матрица переполнилась, пришлось сделать экстренную перезагрузку Вселенной»",
  "«Чайник закипел на частоте резонанса с курсовой и стерилизовал жесткий диск»",
  "«Духи великих ученых явились во сне и запретили сдавать эту работу без спецов BauSquad»",
  "«Пространственно-временной континуум свернулся в бублик прямо над моим рабочим столом»"
];

interface StudentFunWidgetProps {
  onCreateOrder: () => void;
  panicLevel?: number;
  coffeeCount?: number;
  onChangePanic?: (val: number) => void;
  onChangeCoffee?: (val: number) => void;
}

export const StudentFunWidget: React.FC<StudentFunWidgetProps> = ({
  onCreateOrder,
  panicLevel: controlledPanic,
  coffeeCount: controlledCoffee,
  onChangePanic,
  onChangeCoffee
}) => {
  const [internalPanic, setInternalPanic] = useState<number>(45);
  const [internalCoffee, setInternalCoffee] = useState<number>(0);
  const [currentExcuse, setCurrentExcuse] = useState<string>(TIER1_EXCUSES[0]);
  const [calculatedAdvice, setCalculatedAdvice] = useState<string | null>(null);

  const panicLevel = controlledPanic !== undefined ? controlledPanic : internalPanic;
  const coffeeCount = controlledCoffee !== undefined ? controlledCoffee : internalCoffee;

  const setPanic = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    if (onChangePanic) onChangePanic(clamped);
    else setInternalPanic(clamped);
    generateExcuse(clamped, coffeeCount);
  };

  const setCoffee = (val: number) => {
    const clamped = Math.max(0, val);
    if (onChangeCoffee) onChangeCoffee(clamped);
    else setInternalCoffee(clamped);
    generateExcuse(panicLevel, clamped);
  };

  // Classic panic level ranges
  const getPanicStatus = (level: number) => {
    if (level <= 25) {
      return { label: 'Спокойствие и дзен 🧘', color: 'text-[#2ecc71]', border: 'border-[#2ecc71]' };
    }
    if (level <= 60) {
      return { label: 'Легкий дедлайновый мандраж ⚡', color: 'text-[#f1c40f]', border: 'border-[#f1c40f]' };
    }
    if (level <= 85) {
      return { label: 'Академическая тревога 😱', color: 'text-[#e67e22]', border: 'border-[#e67e22]' };
    }
    return { label: 'КРИТИЧЕСКАЯ ПАНИКА! ДЕДЛАЙН ВЧЕРА! 🔥🔥🔥', color: 'text-[#e74c3c]', border: 'border-[#e74c3c]' };
  };

  const handleCoffeeClick = () => {
    setCoffee(coffeeCount + 1);
  };

  const generateExcuse = (currentPanic: number, currentCoffee: number) => {
    const absurdityFactor = Math.floor(currentPanic / 30) + currentCoffee;
    let pool = TIER1_EXCUSES;
    if (absurdityFactor >= 5) {
      pool = TIER3_EXCUSES;
    } else if (absurdityFactor >= 2) {
      pool = TIER2_EXCUSES;
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    setCurrentExcuse(pool[randomIndex]);
  };

  const handleNewExcuse = () => {
    generateExcuse(panicLevel, coffeeCount);
  };

  // Calculation of panic reduction method
  const handleCalculateReduction = () => {
    if (panicLevel <= 20) {
      setCalculatedAdvice('💡 РЕКОМЕНДАЦИЯ: Ваши учебные показатели в норме! Лучший метод сейчас — хорошо поспать, выпить чаю и отдохнуть.');
    } else if (panicLevel <= 40) {
      setCalculatedAdvice('💡 РЕКОМЕНДАЦИЯ: Рекомендуется сделать перерыв на отдых, а по наиболее сложным и проблемным предметам передать задачу командам BauSquad!');
    } else if (panicLevel <= 80) {
      setCalculatedAdvice('💡 РЕКОМЕНДАЦИЯ: Грамотно расставьте приоритеты! Горящие курсовые и чертежи стоит немедленно направить на выполнение авторам BauSquad.');
    } else {
      setCalculatedAdvice('🚨 ЭКСТРЕННЫЙ ВЫЗОВ: СРОЧНО ВЫЗЫВАЙТЕ БРИГАДУ ПОМОЩИ BAUSQUAD! Оформляйте заявку прямо сейчас, пока дедлайн окончательно не сгорел!');
    }
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
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={panicLevel}
                  onChange={(e) => setPanic(Number(e.target.value))}
                  className={`w-14 px-1.5 py-0.5 bg-[#1a252f] border border-white/20 text-xs font-bold font-mono text-center ${status.color} focus:outline-none focus:border-[#c5a059]`}
                />
                <span className="text-xs text-[#bdc3c7] font-mono">%</span>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={panicLevel}
              onChange={(e) => setPanic(Number(e.target.value))}
              className="w-full h-2 bg-[#2b3d4f] rounded-lg appearance-none cursor-pointer accent-[#c5a059]"
            />

            <div className={`mt-3 p-2.5 bg-[#1a252f] border ${status.border} text-xs font-bold text-center ${status.color}`}>
              {status.label}
            </div>
          </div>

          <button
            onClick={handleCalculateReduction}
            className="w-full py-2.5 bg-[#c5a059] hover:bg-[#d4af37] text-black font-black uppercase text-xs tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
          >
            <Zap className="w-4 h-4" />
            <span>Расчёт метода снижения паники</span>
          </button>
        </div>

        {/* Module 2: Coffee Reactor */}
        <div className="bg-[#0f1418] p-5 border border-[#2b3d4f] flex flex-col justify-between text-center space-y-3">
          <div>
            <span className="text-xs font-mono font-bold uppercase text-[#c5a059] block mb-2 flex items-center justify-center gap-1.5">
              <Coffee className="w-4 h-4 text-[#c5a059]" />
              Кофейный Симулятор
            </span>

            <div className="flex items-center justify-center gap-2 my-2">
              <input
                type="number"
                min="0"
                value={coffeeCount}
                onChange={(e) => setCoffee(Number(e.target.value))}
                className="w-20 text-3xl font-black text-center text-white bg-transparent border-b-2 border-[#c5a059] font-mono drop-shadow-[0_0_10px_rgba(197,160,89,0.5)] focus:outline-none"
              />
              <span className="text-2xl">☕</span>
            </div>
            <p className="text-[11px] text-[#bdc3c7]">
              Чашек кофе выпито во время попыток написать работу самостоятельно
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCoffee(Math.max(0, coffeeCount - 1))}
                className="px-2.5 py-1.5 bg-[#1a252f] hover:bg-[#2b3d4f] text-[#bdc3c7] border border-[#3d4e5f] font-mono text-xs font-bold"
                title="Убавить 1 чашку"
              >
                -1
              </button>
              <button
                onClick={handleCoffeeClick}
                className="flex-1 py-1.5 bg-[#2b3d4f] hover:bg-[#3d536b] text-[#c5a059] border border-[#c5a059] font-bold uppercase text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>+1 Чашка</span>
              </button>
              <button
                onClick={() => setCoffee(coffeeCount + 10)}
                className="px-2.5 py-1.5 bg-[#1a252f] hover:bg-[#2b3d4f] text-[#f1c40f] border border-[#3d4e5f] font-mono text-xs font-bold"
                title="Добавить сразу 10 чашек"
              >
                +10
              </button>
            </div>
          </div>
        </div>

        {/* Module 3: Excuse Generator */}
        <div className="bg-[#0f1418] p-5 border border-[#2b3d4f] flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2 font-mono">
              <span className="text-xs font-bold uppercase text-[#c5a059] flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-[#f1c40f]" />
                Генератор отговорок
              </span>
              <span className="text-[10px] text-[#7f8c8d]">
                {coffeeCount + Math.floor(panicLevel / 30) >= 5 ? 'Уровень: Абсурд 🔥' : 'Уровень: Обычный'}
              </span>
            </div>

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

      {/* Calculated Advice Card */}
      {calculatedAdvice && (
        <div className="mt-4 p-4 bg-[#0d1b2a] border-2 border-[#c5a059] text-xs text-white font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-5 h-5 text-[#c5a059] shrink-0 mt-0.5" />
            <span className="leading-relaxed">{calculatedAdvice}</span>
          </div>
          <button 
            onClick={onCreateOrder}
            className="px-4 py-2 bg-[#c5a059] text-black font-black uppercase text-[11px] hover:bg-[#d4af37] shrink-0"
          >
            Оформить заказ
          </button>
        </div>
      )}

    </div>
  );
};

