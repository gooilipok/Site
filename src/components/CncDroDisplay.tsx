import React, { useState } from 'react';
import { Cpu, RotateCcw, Clock, Sliders, ChevronLeft, ChevronRight, Activity, ShieldCheck, Sparkles } from 'lucide-react';

const WORK_TYPES = [
  'Задача',
  'Типовое ДЗ',
  'Курсовая работа',
  'Дипломная работа'
];

const COMPLEXITIES = [
  'Примитивное',
  'Базовое',
  'Повышенное',
  'Высокое',
  'Критически тяжёлое'
];

// Matrix mapping [xIndex][yIndex] -> Estimated deadline for Axis Z
const DEADLINE_MATRIX: string[][] = [
  // Задача (x = 0)
  ['3–6 часов', '6–12 часов', '12–24 часа', '1–2 дня', '2–3 дня'],
  // Типовое ДЗ (x = 1)
  ['6–12 часов', '1–2 дня', '2–3 дня', '3–5 дней', '5–7 дней'],
  // Курсовая работа (x = 2)
  ['2–3 дня', '3–5 дней', '5–7 дней', '1–2 недели', '2–3 недели'],
  // Дипломная работа (x = 3)
  ['1–2 недели', '2–3 недели', '3–4 недели', '1–2 месяца', '2–3 месяца']
];

export const CncDroDisplay: React.FC = () => {
  const [xIndex, setXIndex] = useState<number>(1); // Default: Типовое ДЗ
  const [yIndex, setYIndex] = useState<number>(1); // Default: Базовое

  // Angle calculations for the rotary knobs
  // Knob X (4 steps): -75deg to +75deg
  const knobXAngle = -75 + (xIndex / (WORK_TYPES.length - 1)) * 150;

  // Knob Y (5 steps): -80deg to +80deg
  const knobYAngle = -80 + (yIndex / (COMPLEXITIES.length - 1)) * 160;

  const currentDeadline = DEADLINE_MATRIX[xIndex][yIndex];

  const handleNextX = () => setXIndex(prev => (prev + 1) % WORK_TYPES.length);
  const handlePrevX = () => setXIndex(prev => (prev - 1 + WORK_TYPES.length) % WORK_TYPES.length);

  const handleNextY = () => setYIndex(prev => (prev + 1) % COMPLEXITIES.length);
  const handlePrevY = () => setYIndex(prev => (prev - 1 + COMPLEXITIES.length) % COMPLEXITIES.length);

  const resetAll = () => {
    setXIndex(0);
    setYIndex(0);
  };

  return (
    <div className="bg-[#131a21] border-4 border-[#2b3d4f] p-4 shadow-2xl rounded-sm max-w-4xl mx-auto my-8 relative overflow-hidden font-sans">
      
      {/* Top Header */}
      <div className="bg-gradient-to-r from-[#1a252f] via-[#2b3d4f] to-[#1a252f] p-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-black text-xs font-mono">
        <div className="flex items-center gap-2 text-[#c5a059] font-bold tracking-widest">
          <Cpu className="w-4 h-4 text-[#f1c40f]" />
          <span>ПАНЕЛЬ УЦИ-2000 // ИНТЕРАКТИВНЫЙ КАЛЬКУЛЯТОР СРОКОВ BAUSQUAD</span>
        </div>

        {/* LED STATUS INDICATORS */}
        <div className="flex items-center gap-3 text-[10px] font-bold">
          <div className="flex items-center gap-1.5 text-[#2ecc71]">
            <span className="w-2 h-2 rounded-full bg-[#2ecc71] animate-pulse" />
            <span>СИСТЕМА: ГОТОВА</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#3498db]">
            <span className="w-2 h-2 rounded-full bg-[#3498db]" />
            <span>АВТОРАСЧЁТ: СРОК Z</span>
          </div>
        </div>
      </div>

      {/* MAIN DIGITAL DISPLAY SCREEN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-[#0a0e12] border-2 border-[#1f2d3a] my-3 font-mono">
        
        {/* AXIS X: TYPE OF WORK */}
        <div className="p-3.5 bg-[#05080a] border border-[#1a2b38] flex flex-col justify-between relative group hover:border-[#2ecc71] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#c5a059] text-[11px] font-black uppercase tracking-wider">ОСЬ X (ТИП РАБОТЫ)</span>
            <span className="text-[10px] text-[#526373] bg-[#10171e] px-1.5 py-0.5 border border-white/5">
              [{xIndex + 1}/{WORK_TYPES.length}]
            </span>
          </div>
          <div className="text-xl md:text-2xl font-black text-[#2ecc71] tracking-wide my-1 drop-shadow-[0_0_8px_rgba(46,204,113,0.5)]">
            {WORK_TYPES[xIndex]}
          </div>
          <div className="text-[10px] text-[#526373] uppercase mt-1">
            Задаётся регулятором №1
          </div>
        </div>

        {/* AXIS Y: COMPLEXITY */}
        <div className="p-3.5 bg-[#05080a] border border-[#1a2b38] flex flex-col justify-between relative group hover:border-[#f1c40f] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#c5a059] text-[11px] font-black uppercase tracking-wider">ОСЬ Y (СЛОЖНОСТЬ)</span>
            <span className="text-[10px] text-[#526373] bg-[#10171e] px-1.5 py-0.5 border border-white/5">
              [{yIndex + 1}/{COMPLEXITIES.length}]
            </span>
          </div>
          <div className="text-xl md:text-2xl font-black text-[#f1c40f] tracking-wide my-1 drop-shadow-[0_0_8px_rgba(241,196,15,0.5)]">
            {COMPLEXITIES[yIndex]}
          </div>
          <div className="text-[10px] text-[#526373] uppercase mt-1">
            Задаётся регулятором №2
          </div>
        </div>

        {/* AXIS Z: AUTOMATIC TIMELINE */}
        <div className="p-3.5 bg-[#05080a] border-2 border-[#3498db]/60 flex flex-col justify-between relative group shadow-[0_0_15px_rgba(52,152,219,0.15)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#c5a059] text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#3498db]" />
              <span>ОСЬ Z (СРОК)</span>
            </span>
            <span className="text-[10px] text-[#2ecc71] bg-[#0d211a] px-1.5 py-0.5 border border-[#2ecc71]/30 font-bold uppercase">
              АВТОРАСЧЁТ
            </span>
          </div>
          <div className="text-xl md:text-2xl font-black text-[#3498db] tracking-wide my-1 drop-shadow-[0_0_10px_rgba(52,152,219,0.7)]">
            {currentDeadline}
          </div>
          <div className="text-[10px] text-[#3498db]/80 uppercase mt-1 font-bold">
            Рассчитано по осям X и Y
          </div>
        </div>

      </div>

      {/* ROTARY KNOBS CONTROL SECTION */}
      <div className="bg-[#1a252f] p-4 border border-[#2b3d4f] grid grid-cols-1 md:grid-cols-2 gap-6 my-2">
        
        {/* KNOB 1: AXIS X */}
        <div className="bg-[#0f1418] p-4 border border-[#2b3d4f] flex flex-col items-center justify-between text-center">
          <div className="text-xs font-mono font-bold text-[#c5a059] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#2ecc71]" />
            <span>Регулятор №1: Тип работы (Ось X)</span>
          </div>

          {/* ROTARY DIAL VISUALIZATION */}
          <div className="relative my-3 w-28 h-28 flex items-center justify-center select-none">
            {/* Ticks ring */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#2b3d4f] opacity-60" />
            
            {/* Knob body */}
            <div 
              onClick={handleNextX}
              title="Нажмите для переключения типа работы"
              className="w-20 h-20 rounded-full bg-gradient-to-b from-[#3d536b] via-[#1a252f] to-[#0f1418] border-4 border-[#c5a059] shadow-[0_6px_12px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.2)] cursor-pointer transition-transform duration-300 ease-out flex items-center justify-center relative hover:scale-105 active:scale-95"
              style={{ transform: `rotate(${knobXAngle}deg)` }}
            >
              {/* Knob Pointer Line */}
              <div className="absolute top-1 w-1.5 h-6 bg-[#2ecc71] rounded-full shadow-[0_0_6px_#2ecc71]" />
              <div className="w-8 h-8 rounded-full bg-[#0a0e12] border border-[#2b3d4f]" />
            </div>
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center gap-2 w-full mt-2">
            <button
              onClick={handlePrevX}
              className="p-2 bg-[#1a252f] hover:bg-[#2b3d4f] border border-[#3d4e5f] text-white text-xs font-mono font-bold flex-1 flex items-center justify-center gap-1"
            >
              <ChevronLeft className="w-4 h-4 text-[#2ecc71]" />
              <span>Пред.</span>
            </button>
            <span className="text-[11px] font-mono text-[#2ecc71] font-bold px-2 truncate max-w-[120px]">
              {WORK_TYPES[xIndex]}
            </span>
            <button
              onClick={handleNextX}
              className="p-2 bg-[#1a252f] hover:bg-[#2b3d4f] border border-[#3d4e5f] text-white text-xs font-mono font-bold flex-1 flex items-center justify-center gap-1"
            >
              <span>След.</span>
              <ChevronRight className="w-4 h-4 text-[#2ecc71]" />
            </button>
          </div>
        </div>

        {/* KNOB 2: AXIS Y */}
        <div className="bg-[#0f1418] p-4 border border-[#2b3d4f] flex flex-col items-center justify-between text-center">
          <div className="text-xs font-mono font-bold text-[#c5a059] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#f1c40f]" />
            <span>Регулятор №2: Сложность (Ось Y)</span>
          </div>

          {/* ROTARY DIAL VISUALIZATION */}
          <div className="relative my-3 w-28 h-28 flex items-center justify-center select-none">
            {/* Ticks ring */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#2b3d4f] opacity-60" />
            
            {/* Knob body */}
            <div 
              onClick={handleNextY}
              title="Нажмите для переключения сложности"
              className="w-20 h-20 rounded-full bg-gradient-to-b from-[#3d536b] via-[#1a252f] to-[#0f1418] border-4 border-[#f1c40f] shadow-[0_6px_12px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.2)] cursor-pointer transition-transform duration-300 ease-out flex items-center justify-center relative hover:scale-105 active:scale-95"
              style={{ transform: `rotate(${knobYAngle}deg)` }}
            >
              {/* Knob Pointer Line */}
              <div className="absolute top-1 w-1.5 h-6 bg-[#f1c40f] rounded-full shadow-[0_0_6px_#f1c40f]" />
              <div className="w-8 h-8 rounded-full bg-[#0a0e12] border border-[#2b3d4f]" />
            </div>
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center gap-2 w-full mt-2">
            <button
              onClick={handlePrevY}
              className="p-2 bg-[#1a252f] hover:bg-[#2b3d4f] border border-[#3d4e5f] text-white text-xs font-mono font-bold flex-1 flex items-center justify-center gap-1"
            >
              <ChevronLeft className="w-4 h-4 text-[#f1c40f]" />
              <span>Пред.</span>
            </button>
            <span className="text-[11px] font-mono text-[#f1c40f] font-bold px-2 truncate max-w-[120px]">
              {COMPLEXITIES[yIndex]}
            </span>
            <button
              onClick={handleNextY}
              className="p-2 bg-[#1a252f] hover:bg-[#2b3d4f] border border-[#3d4e5f] text-white text-xs font-mono font-bold flex-1 flex items-center justify-center gap-1"
            >
              <span>След.</span>
              <ChevronRight className="w-4 h-4 text-[#f1c40f]" />
            </button>
          </div>
        </div>

      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="bg-[#1a252f] p-3 border-t border-black flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-[#bdc3c7]">
          <Activity className="w-4 h-4 text-[#2ecc71]" />
          <span>КАЛИБРОВКА: <strong className="text-white">Внутренний стандарт качества BauSquad</strong></span>
        </div>

        <button
          onClick={resetAll}
          className="px-3 py-1.5 bg-[#0f1418] hover:bg-[#2b3d4f] border border-[#3d4e5f] text-[#c5a059] font-bold uppercase transition-all flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Сбросить в ноль</span>
        </button>
      </div>

    </div>
  );
};
