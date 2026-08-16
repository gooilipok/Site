import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Clock, Award, Cpu, CheckCircle2, FileUp, Settings2, RefreshCw, BookOpen, Cog } from 'lucide-react';
import { CncDroDisplay, WORK_TYPES, COMPLEXITIES } from '../components/CncDroDisplay';
import { StudentFunWidget } from '../components/StudentFunWidget';
import { EmergencySafetyButton } from '../components/EmergencySafetyButton';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Synchronized state for CNC regulators and Student stress controls
  const [xIndex, setXIndex] = useState<number>(1); // 0 = 'Задача', 1 = 'Типовое ДЗ'
  const [yIndex, setYIndex] = useState<number>(1); // 4 = 'Критически тяжёлое'
  const [panicLevel, setPanicLevel] = useState<number>(45); // Target: 88
  const [coffeeCount, setCoffeeCount] = useState<number>(0); // Target: 39

  const handleCreateOrderClick = (presetTopic?: string) => {
    navigate('/order/create', { state: { presetTopic } });
  };

  const currentWorkType = WORK_TYPES[xIndex] || 'Задача';
  const currentComplexity = COMPLEXITIES[yIndex] || 'Критически тяжёлое';

  return (
    <div className="relative overflow-hidden">
      
      {/* ⚙️ BACKGROUND GEARS ANIMATION */}
      <div className="bg-animation">
        <div className="gear gear-1"></div>
        <div className="gear gear-2"></div>
        <div className="gear gear-3"></div>
      </div>

      {/* 🧠 HERO SECTION */}
      <section className="hero text-center pt-16 pb-10 px-4 max-w-5xl mx-auto relative">
        
        {/* ⚙️ ROTATING GEARS BEHIND / ABOVE HERO TITLE */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-full max-w-3xl h-36 pointer-events-none overflow-hidden flex items-center justify-between px-6 md:px-16 opacity-30 z-0">
          <div className="flex items-center gap-2 animate-[spin_18s_linear_infinite]">
            <Cog className="w-16 h-16 md:w-28 md:h-28 text-[#c5a059]" />
          </div>
          <div className="flex items-center gap-2 animate-[spin_12s_linear_infinite_reverse]">
            <Cog className="w-12 h-12 md:w-20 md:h-20 text-[#3498db]" />
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-wider text-white mb-4 drop-shadow-lg flex items-center justify-center gap-3">
            <Cog className="w-8 h-8 md:w-12 md:h-12 text-[#f1c40f] animate-[spin_10s_linear_infinite] inline-block" />
            <span>Помощь в пути!</span>
            <Cog className="w-8 h-8 md:w-12 md:h-12 text-[#f1c40f] animate-[spin_10s_linear_infinite_reverse] inline-block" />
          </h1>

          <p className="text-lg md:text-xl text-[#bdc3c7] max-w-3xl mx-auto mb-8 font-light leading-relaxed">
            <strong className="text-white font-semibold">BauSquad</strong> — слаженная команда авторов и экспертов для безупречного выполнения студенческих и научно-исследовательских работ по любым дисциплинам.
          </p>

          {/* ⚙️ INDUSTRIAL MACHINE BUTTON */}
          <div className="machine-btn-container">
            <button onClick={() => handleCreateOrderClick()} className="machine-btn group">
              <span className="btn-cap">
                Создать заказ
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* 🖥️ CNC DRO DISPLAY WIDGET (УЦИ - Устройство Цифровой Индикации) */}
      <section className="px-4">
        <CncDroDisplay 
          xIndex={xIndex}
          yIndex={yIndex}
          onChangeX={setXIndex}
          onChangeY={setYIndex}
        />
      </section>

      {/* ☕ STUDENT FUN STRESS-RELIEVER WIDGET */}
      <section className="max-w-5xl mx-auto px-4">
        <StudentFunWidget 
          onCreateOrder={() => handleCreateOrderClick()}
          panicLevel={panicLevel}
          coffeeCount={coffeeCount}
          onChangePanic={setPanicLevel}
          onChangeCoffee={setCoffeeCount}
        />
      </section>

      {/* 📦 INFO CARDS GRID */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="metal-card p-8 relative overflow-hidden group flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-[#2b3d4f] border border-[#c5a059]/40 flex items-center justify-center text-[#c5a059] mb-5 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white uppercase mb-3 flex items-center justify-center gap-2 text-center w-full">
              <span>Качество и Профессионализм</span>
            </h3>
            <p className="text-sm text-[#bdc3c7] leading-relaxed text-center">
              BauSquad — это команда специалистов, профессионально занимающихся выполнением студенческих работ любой сложности: от эссе и курсовых до комплексных исследований.
            </p>
          </div>

          <div className="metal-card p-8 relative overflow-hidden group flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-[#2b3d4f] border border-[#c5a059]/40 flex items-center justify-center text-[#c5a059] mb-5 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white uppercase mb-3 flex items-center justify-center gap-2 text-center w-full">
              <span>Соблюдение Сроков</span>
            </h3>
            <p className="text-sm text-[#bdc3c7] leading-relaxed text-center">
              Мы ценим ваше время. 98.1% заказов сдаются ощутимо раньше намеченного дедлайна. Ваша учеба находится под полным контролем нашей квалифицированной команды.
            </p>
          </div>

          <div className="metal-card p-8 relative overflow-hidden group flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-[#2b3d4f] border border-[#c5a059]/40 flex items-center justify-center text-[#c5a059] mb-5 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white uppercase mb-3 flex items-center justify-center gap-2 text-center w-full">
              <span>Полная Анонимность</span>
            </h3>
            <p className="text-sm text-[#bdc3c7] leading-relaxed text-center">
              Мы не требуем ваших персональных документов. Все заказы, файлы и условия передаются исключительно в зашифрованном виде.
            </p>
          </div>

        </div>
      </section>

      {/* 🚀 WORKFLOW STEPS */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-[#1a252f]/90 border-4 border-[#2b3d4f] p-8 md:p-12 shadow-2xl relative">
          
          {/* Top Track */}
          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#0f1418] via-[#2b3d4f] to-[#0f1418] border-b border-[#c5a059]/30 flex justify-between overflow-hidden">
            <div className="w-full h-full bg-[repeating-linear-gradient(90deg,transparent,transparent_20px,#c5a059_20px,#c5a059_24px)] opacity-30 animate-[slide_3s_linear_infinite]" />
          </div>

          <div className="text-center mb-10 pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0f1418] border border-[#c5a059]/40 text-[#c5a059] text-[10px] font-mono font-bold uppercase tracking-widest mb-3">
              <Settings2 className="w-3.5 h-3.5 text-[#f1c40f]" />
              <span>ПРОЦЕСС ВЫПОЛНЕНИЯ ЗАКАЗА BAUSQUAD</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-white">
              Как мы работаем над каждым заказом
            </h2>
            <p className="text-sm text-[#bdc3c7] mt-2">
              Прозрачный процесс от оформления заявки до получения безупречного результата для любых специальностей
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
            
            {/* Step 1 */}
            <div className="p-5 bg-[#0f1418] border-2 border-white/10 relative group hover:border-[#c5a059] transition-all flex flex-col items-center text-center">
              <span className="text-3xl font-black text-[#c5a059]/30 absolute top-3 right-3 font-mono">01</span>
              <FileUp className="w-8 h-8 text-[#c5a059] mb-3" />
              <h4 className="font-bold text-white uppercase text-sm mb-1 text-center">Подача заявки</h4>
              <p className="text-xs text-[#bdc3c7] text-center">Укажите предмет, описание задачи, дедлайн и прикрепите необходимые файлы и фото.</p>
            </div>

            {/* Step 2 */}
            <div className="p-5 bg-[#0f1418] border-2 border-white/10 relative group hover:border-[#3498db] transition-all flex flex-col items-center text-center">
              <span className="text-3xl font-black text-[#c5a059]/30 absolute top-3 right-3 font-mono">02</span>
              <RefreshCw className="w-8 h-8 text-[#3498db] mb-3" />
              <h4 className="font-bold text-white uppercase text-sm mb-1 text-center">Быстрая оценка задач</h4>
              <p className="text-xs text-[#bdc3c7] text-center">Заказ передаётся администрации, которая свяжется с вами для уточнений и выберет наиболее квалифицированного исполнителя.</p>
            </div>

            {/* Step 3 */}
            <div className="p-5 bg-[#0f1418] border-2 border-white/10 relative group hover:border-[#f1c40f] transition-all flex flex-col items-center text-center">
              <span className="text-3xl font-black text-[#c5a059]/30 absolute top-3 right-3 font-mono">03</span>
              <BookOpen className="w-8 h-8 text-[#f1c40f] mb-3" />
              <h4 className="font-bold text-white uppercase text-sm mb-1 text-center">Качественное выполнение</h4>
              <p className="text-xs text-[#bdc3c7] text-center">Подготовка работы со строгим соблюдением академических стандартов и оригинальности.</p>
            </div>

            {/* Step 4 */}
            <div className="p-5 bg-[#0f1418] border-2 border-white/10 relative group hover:border-[#2ecc71] transition-all flex flex-col items-center text-center">
              <span className="text-3xl font-black text-[#c5a059]/30 absolute top-3 right-3 font-mono">04</span>
              <CheckCircle2 className="w-8 h-8 text-[#2ecc71] mb-3" />
              <h4 className="font-bold text-white uppercase text-sm mb-1 text-center">Контроль качества и Выдача</h4>
              <p className="text-xs text-[#bdc3c7] text-center">Двухуровневая проверка результатов. Вы получаете качественно выполненную работу, готовую к сдаче.</p>
            </div>

          </div>

          {/* Bottom Roller Track */}
          <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#7f8c8d]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2ecc71]" />
              <span>СКОРОСТЬ ОБРАБОТКИ ЗАКАЗОВ: <strong className="text-white">МАКСИМАЛЬНАЯ</strong></span>
            </div>
            <span>ГАРАНТИЯ ДОРАБОТКИ: <strong className="text-[#f1c40f]">БЕСПЛАТНО ПРИ НЕОБХОДИМОСТИ</strong></span>
          </div>

        </div>
      </section>

      {/* 🛑 EMERGENCY STOP BUTTON (ПОД ПРОЦЕССОМ ВЫПОЛНЕНИЯ ЗАКАЗА) */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <EmergencySafetyButton 
          regulator1={currentWorkType}
          regulator2={currentComplexity}
          panicLevel={panicLevel}
          coffeeCount={coffeeCount}
        />
      </section>

    </div>
  );
};


