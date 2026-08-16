import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  Unlock, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Siren,
  Radio,
  Gauge,
  Activity,
  Terminal,
  Cpu
} from 'lucide-react';

interface EmergencySafetyButtonProps {
  regulator1: string; // Secret target: "Задача"
  regulator2: string; // Secret target: "Критически тяжёлое"
  panicLevel: number; // Secret target: 88
  coffeeCount: number; // Secret target: 39
}

export const EmergencySafetyButton: React.FC<EmergencySafetyButtonProps> = ({
  regulator1,
  regulator2,
  panicLevel,
  coffeeCount
}) => {
  // Silent condition validations (No hints provided to user)
  const isReg1Valid = regulator1.trim().toLowerCase() === 'задача';
  const isReg2Valid = regulator2.trim().toLowerCase().startsWith('критическ');
  const isPanicValid = panicLevel === 88;
  const isCoffeeValid = coffeeCount === 39;

  const isAllUnlocked = isReg1Valid && isReg2Valid && isPanicValid && isCoffeeValid;

  const [isCoverOpen, setIsCoverOpen] = useState<boolean>(false);
  const [isButtonPressed, setIsButtonPressed] = useState<boolean>(false);
  const [isAlarmActive, setIsAlarmActive] = useState<boolean>(false);
  const [shakeLock, setShakeLock] = useState<boolean>(false);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Direct and robust /alarm.mp3 playback
  const playAlarmSound = () => {
    if (soundMuted) return;

    try {
      if (!audioRef.current) {
        const audio = new Audio('/alarm.mp3');
        audio.loop = true;
        audioRef.current = audio;
      }
      
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[Audio Play /alarm.mp3]', err);
        });
      }
    } catch (err) {
      console.warn('[Audio Exception]', err);
    }
  };

  const stopAlarmSound = () => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } catch (e) {}
  };

  // Effect to react to soundMuted changes
  const toggleSoundMute = () => {
    const nextMuted = !soundMuted;
    setSoundMuted(nextMuted);
    if (nextMuted) {
      stopAlarmSound();
    } else if (isAlarmActive) {
      playAlarmSound();
    }
  };

  useEffect(() => {
    // Preload /alarm.mp3
    try {
      const audio = new Audio('/alarm.mp3');
      audio.loop = true;
      audio.preload = 'auto';
      audioRef.current = audio;
    } catch (e) {}

    return () => {
      stopAlarmSound();
    };
  }, []);

  // Handle Cover Interaction
  const toggleCover = () => {
    if (!isAllUnlocked) {
      setShakeLock(true);
      setTimeout(() => setShakeLock(false), 500);
      return;
    }
    setIsCoverOpen(!isCoverOpen);
  };

  // Handle Emergency Mushroom Button Press
  const handleButtonPress = () => {
    if (!isAllUnlocked) {
      setShakeLock(true);
      setTimeout(() => setShakeLock(false), 500);
      return;
    }

    if (!isCoverOpen) {
      setIsCoverOpen(true);
      return;
    }

    if (!isButtonPressed) {
      setIsButtonPressed(true);
      setIsAlarmActive(true);
      playAlarmSound();
    }
  };

  // Reset / Rotate to Release
  const handleResetButton = () => {
    setIsButtonPressed(false);
    setIsAlarmActive(false);
    stopAlarmSound();
  };

  return (
    <div className={`mt-14 mb-8 transition-all duration-500 relative ${isAlarmActive ? 'animate-pulse' : ''}`}>
      
      {/* 🚨 ACTIVE ALARM FULL-WIDTH FLASHING BANNER */}
      {isAlarmActive && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-950 via-red-600 to-red-950 border-4 border-yellow-400 text-white shadow-[0_0_50px_rgba(231,76,60,0.8)] text-center animate-bounce">
          <div className="flex items-center justify-center gap-3 text-lg sm:text-2xl font-black font-mono tracking-widest uppercase text-yellow-300">
            <Siren className="w-8 h-8 animate-spin" />
            <span>⚠️ CODE ROT! KOMMUNIKATIONSKANAL WIEDER GEÖFFNET! ⚠️</span>
            <Siren className="w-8 h-8 animate-spin" />
          </div>
          <p className="text-xs font-mono font-bold mt-1 text-white uppercase tracking-wider">
            ALLE RESERVEN MOBILISIEREN // GÖTTERDÄMMERUNG LOOMS
          </p>
        </div>
      )}

      {/* 🛡️ HEAVY WEATHERED SCRATCHED METAL MAIN CHASSIS */}
      <div className={`relative p-6 md:p-8 rounded-sm transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.25)] border-4 ${
        isAllUnlocked 
          ? (isAlarmActive ? 'border-red-500 shadow-[0_0_35px_rgba(231,76,60,0.6)]' : 'border-[#2ecc71] shadow-[0_0_30px_rgba(46,204,113,0.4)]') 
          : 'border-[#3a4454]'
      }`}
      style={{
        background: `
          radial-gradient(ellipse at top left, rgba(255,255,255,0.08) 0%, transparent 60%),
          radial-gradient(ellipse at bottom right, rgba(0,0,0,0.6) 0%, transparent 70%),
          repeating-linear-gradient(45deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 4px),
          repeating-linear-gradient(-45deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 2px, transparent 2px, transparent 6px),
          linear-gradient(180deg, #2b333e 0%, #1c222b 40%, #151b22 75%, #0f1318 100%)
        `
      }}>
        
        {/* CORNER RIVETS / INDUSTRIAL BOLTS */}
        {/* Top Left Bolt */}
        <div className="absolute top-2.5 left-2.5 w-4 h-4 rounded-full bg-gradient-to-br from-slate-400 via-slate-600 to-slate-800 border border-black/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_2px_4px_rgba(0,0,0,0.8)] flex items-center justify-center pointer-events-none">
          <div className="w-2.5 h-[1.5px] bg-[#111] rotate-45" />
        </div>
        {/* Top Right Bolt */}
        <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-gradient-to-br from-slate-400 via-slate-600 to-slate-800 border border-black/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_2px_4px_rgba(0,0,0,0.8)] flex items-center justify-center pointer-events-none">
          <div className="w-2.5 h-[1.5px] bg-[#111] -rotate-12" />
        </div>
        {/* Bottom Left Bolt */}
        <div className="absolute bottom-2.5 left-2.5 w-4 h-4 rounded-full bg-gradient-to-br from-slate-400 via-slate-600 to-slate-800 border border-black/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_2px_4px_rgba(0,0,0,0.8)] flex items-center justify-center pointer-events-none">
          <div className="w-2.5 h-[1.5px] bg-[#111] rotate-90" />
        </div>
        {/* Bottom Right Bolt */}
        <div className="absolute bottom-2.5 right-2.5 w-4 h-4 rounded-full bg-gradient-to-br from-slate-400 via-slate-600 to-slate-800 border border-black/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_2px_4px_rgba(0,0,0,0.8)] flex items-center justify-center pointer-events-none">
          <div className="w-2.5 h-[1.5px] bg-[#111] rotate-30" />
        </div>

        {/* Worn Weathered Metal Scratches & Hazard Edge Bars */}
        <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-8 right-8 h-1 bg-gradient-to-r from-transparent via-black/60 to-transparent pointer-events-none" />
        
        {/* Faded Industrial Warning Band Top/Bottom */}
        <div className="absolute top-1 left-8 right-8 h-1.5 bg-[repeating-linear-gradient(45deg,#d4ac0d,#d4ac0d_8px,#1a1a1a_8px,#1a1a1a_16px)] opacity-40 mix-blend-screen" />
        <div className="absolute bottom-1 left-8 right-8 h-1.5 bg-[repeating-linear-gradient(45deg,#d4ac0d,#d4ac0d_8px,#1a1a1a_8px,#1a1a1a_16px)] opacity-40 mix-blend-screen" />

        {/* 🏷️ PANEL HEADER & ENGRAVED SERIAL PLATE */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6 relative z-10">
          
          <div className="flex items-center gap-3.5">
            {/* Weathered Engraved Emblem */}
            <div className={`p-3 border-2 ${
              isAllUnlocked 
                ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(231,76,60,0.4)]' 
                : 'bg-[#141920] text-[#a0aab8] border-white/15 shadow-inner'
            } rounded-sm`}>
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div>
              {/* Technical German Sub-heading */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-widest text-[#c5a059] drop-shadow">
                  ANLAGE // SCHUTZSCHALTER SYSTEM-4
                </span>
                <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase border rounded-xs ${
                  isAllUnlocked 
                    ? 'bg-[#2ecc71]/20 text-[#2ecc71] border-[#2ecc71]/60 animate-pulse' 
                    : 'bg-black/60 text-[#7f8c8d] border-white/10'
                }`}>
                  {isAllUnlocked ? '● BEREIT (ARMED)' : '● GESPERRT (LOCKED)'}
                </span>
              </div>
              
              {/* Main Panel Title: Verlorene Geschichte */}
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-wider text-slate-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] font-mono">
                Verlorene Geschichte
              </h3>
            </div>
          </div>

          {/* Sound Mute Toggle Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSoundMute}
              className="p-2 bg-[#141920] hover:bg-[#202833] border border-white/15 text-[#bdc3c7] text-xs font-mono shadow-md transition-all active:scale-95"
              title={soundMuted ? "Включить звук" : "Выключить звук"}
            >
              {soundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#2ecc71]" />}
            </button>
          </div>

        </div>

        {/* 🎛️ MAIN WORKSPACE: WEATHERED INSTRUMENTATION DECK */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* LEFT: SCRATCHED METAL ANALOG TELEMETRY BLOCK (7 Columns) */}
          <div className="lg:col-span-7 bg-gradient-to-b from-[#12171e] via-[#0d1116] to-[#0a0d10] border-2 border-white/10 p-5 rounded-sm shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] relative space-y-4">
            
            {/* Scratched Brushed Metal Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)] pointer-events-none rounded-sm" />
            
            {/* Top Apparatus Bar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5 relative z-10 text-xs font-mono">
              <span className="text-[#a0aab8] font-bold uppercase flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#c5a059]" />
                STEUERMODUL // HAUPTRELAIS
              </span>
              <span className="text-[10px] text-[#6c7a89] tracking-wider">
                SERIEN-NR. VG-1987-X4
              </span>
            </div>

            {/* Vintage Analog Relay Channel Monitors (Completely cryptic, NO hints) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 relative z-10">
              
              {/* Channel A */}
              <div className="p-3 bg-[#0a0d11] border border-white/10 rounded-xs flex flex-col justify-between h-24 shadow-inner">
                <div className="flex items-center justify-between text-[9px] font-mono text-[#7f8c8d]">
                  <span>KANAL I</span>
                  <Activity className="w-3 h-3 text-[#566573]" />
                </div>
                <div className="my-auto flex items-center justify-center">
                  <div className={`w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
                    isReg1Valid 
                      ? 'bg-[#2ecc71] border-[#2ecc71] shadow-[0_0_8px_#2ecc71]' 
                      : 'bg-[#1b222c] border-white/10'
                  }`} />
                </div>
                <div className="text-[8px] font-mono text-center text-[#566573] uppercase tracking-tighter">
                  SIGNAL A
                </div>
              </div>

              {/* Channel B */}
              <div className="p-3 bg-[#0a0d11] border border-white/10 rounded-xs flex flex-col justify-between h-24 shadow-inner">
                <div className="flex items-center justify-between text-[9px] font-mono text-[#7f8c8d]">
                  <span>KANAL II</span>
                  <Gauge className="w-3 h-3 text-[#566573]" />
                </div>
                <div className="my-auto flex items-center justify-center">
                  <div className={`w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
                    isReg2Valid 
                      ? 'bg-[#2ecc71] border-[#2ecc71] shadow-[0_0_8px_#2ecc71]' 
                      : 'bg-[#1b222c] border-white/10'
                  }`} />
                </div>
                <div className="text-[8px] font-mono text-center text-[#566573] uppercase tracking-tighter">
                  SIGNAL B
                </div>
              </div>

              {/* Channel C */}
              <div className="p-3 bg-[#0a0d11] border border-white/10 rounded-xs flex flex-col justify-between h-24 shadow-inner">
                <div className="flex items-center justify-between text-[9px] font-mono text-[#7f8c8d]">
                  <span>KANAL III</span>
                  <Radio className="w-3 h-3 text-[#566573]" />
                </div>
                <div className="my-auto flex items-center justify-center">
                  <div className={`w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
                    isPanicValid 
                      ? 'bg-[#2ecc71] border-[#2ecc71] shadow-[0_0_8px_#2ecc71]' 
                      : 'bg-[#1b222c] border-white/10'
                  }`} />
                </div>
                <div className="text-[8px] font-mono text-center text-[#566573] uppercase tracking-tighter">
                  SIGNAL C
                </div>
              </div>

              {/* Channel D */}
              <div className="p-3 bg-[#0a0d11] border border-white/10 rounded-xs flex flex-col justify-between h-24 shadow-inner">
                <div className="flex items-center justify-between text-[9px] font-mono text-[#7f8c8d]">
                  <span>KANAL IV</span>
                  <Cpu className="w-3 h-3 text-[#566573]" />
                </div>
                <div className="my-auto flex items-center justify-center">
                  <div className={`w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
                    isCoffeeValid 
                      ? 'bg-[#2ecc71] border-[#2ecc71] shadow-[0_0_8px_#2ecc71]' 
                      : 'bg-[#1b222c] border-white/10'
                  }`} />
                </div>
                <div className="text-[8px] font-mono text-center text-[#566573] uppercase tracking-tighter">
                  SIGNAL D
                </div>
              </div>

            </div>

            {/* Engraved Vintage Industrial Metal Warning Plate */}
            <div className="relative p-3.5 bg-gradient-to-b from-[#181f28] to-[#10141a] border border-white/15 rounded-xs font-mono text-xs shadow-inner">
              <div className="flex items-center gap-2 text-[#c5a059] font-bold text-[11px] uppercase tracking-wider mb-1">
                <span>ACHTUNG // SICHERHEITSHINWEIS:</span>
              </div>
              <p className="text-[11px] text-[#8a9ba8] leading-relaxed">
                Der Notabschaltmechanismus ist mechanisch verriegelt. Die Freigabe der Schutzabdeckung erfolgt automatisch bei Erreichen der kalibrierten Resonanzfrequenzen.
              </p>
            </div>

            {/* Bottom Status / Reset Bar */}
            {isButtonPressed && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleResetButton}
                  className="px-3.5 py-1.5 bg-red-900/80 hover:bg-red-800 text-white text-[11px] font-bold uppercase font-mono border border-red-500/50 flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Emergency Lock</span>
                </button>
              </div>
            )}

          </div>

          {/* RIGHT: 3D REALISTIC EMERGENCY BUTTON HARDWARE (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-2">
            
            <div className={`relative flex flex-col items-center select-none ${shakeLock ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
              
              {/* STATUS LOCK BADGE */}
              <div className="mb-3">
                <button
                  onClick={toggleCover}
                  className={`px-3.5 py-1.5 text-xs font-mono font-black uppercase tracking-wider border rounded-xs flex items-center gap-2 shadow-lg transition-all ${
                    isAllUnlocked 
                      ? (isCoverOpen 
                          ? 'bg-[#2ecc71] text-black border-[#2ecc71] hover:bg-[#27ae60]' 
                          : 'bg-[#f1c40f] text-black border-[#f1c40f] hover:bg-[#d4af37] animate-pulse') 
                      : 'bg-[#141920] text-red-400 border-red-500/30 cursor-not-allowed opacity-80'
                  }`}
                >
                  {isAllUnlocked ? (
                    isCoverOpen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4 text-red-500" />
                  )}
                  <span>
                    {isAllUnlocked 
                      ? (isCoverOpen ? 'SCHUTZABDECKUNG OFFEN' : 'ENTRIEGELT') 
                      : 'VERRIEGELT'}
                  </span>
                </button>
              </div>

              {/* INDUSTRIAL BUTTON MECHANISM CONTAINER */}
              <div className="relative w-64 h-64 flex items-center justify-center">
                
                {/* 1. BLUE BASE CONTACT BLOCK (DKC MC-NOPP) */}
                <div className="absolute bottom-4 w-36 h-28 bg-[#1e3c72] border-4 border-[#0e2144] rounded-md shadow-2xl flex flex-col justify-between p-2 z-0">
                  <div className="flex justify-between text-[9px] font-mono font-bold text-white/70 border-b border-white/20 pb-1">
                    <span>MC-NOPP</span>
                    <span>DKC 3 NO 4</span>
                  </div>
                  <div className="text-[8px] font-mono text-white/50 leading-tight">
                    Ui:660V Ith:25A<br />
                    AC-15 Ue/Ie:230V/22A<br />
                    DC-13 Ue/Ie:24V/25A
                  </div>
                  {/* Screws / Terminal clips */}
                  <div className="flex justify-between">
                    <div className="w-3 h-3 rounded-full bg-[#3498db] border border-black shadow-inner" />
                    <div className="w-3 h-3 rounded-full bg-[#3498db] border border-black shadow-inner" />
                  </div>
                </div>

                {/* 2. INDUSTRIAL YELLOW BASE COLLAR RING */}
                <div className="absolute top-12 w-48 h-48 rounded-full bg-gradient-to-b from-[#f1c40f] via-[#d4ac0d] to-[#b7950b] border-4 border-[#7d6608] shadow-[0_12px_24px_rgba(0,0,0,0.8),inset_0_4px_8px_rgba(255,255,255,0.4)] flex items-center justify-center z-10">
                  
                  {/* Ring Embossing / Markings */}
                  <div className="absolute inset-2 rounded-full border-2 border-dashed border-[#7d6608]/50 pointer-events-none" />
                  
                  {/* Left & Right Padlock / Latch Ears */}
                  <div className="absolute -left-3 w-6 h-8 bg-[#d4ac0d] border-2 border-[#7d6608] rounded-l-full flex items-center justify-center shadow-md">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#111820] border border-[#7d6608]" />
                  </div>
                  <div className="absolute -right-3 w-6 h-8 bg-[#d4ac0d] border-2 border-[#7d6608] rounded-r-full flex items-center justify-center shadow-md">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#111820] border border-[#7d6608]" />
                  </div>

                  {/* Top Hinge Point */}
                  <div className="absolute -top-3 w-10 h-6 bg-[#b7950b] border-2 border-[#7d6608] rounded-t-md shadow-md flex items-center justify-center">
                    <div className="w-6 h-1.5 bg-[#4d3d05] rounded-full" />
                  </div>

                  {/* 3. RED ANODIZED MUSHROOM EMERGENCY BUTTON */}
                  <div 
                    onClick={handleButtonPress}
                    className={`relative w-36 h-36 rounded-full cursor-pointer transition-all duration-200 z-20 flex items-center justify-center ${
                      isButtonPressed 
                        ? 'translate-y-3 scale-95 shadow-[0_2px_8px_rgba(0,0,0,0.9),inset_0_8px_16px_rgba(0,0,0,0.8)]' 
                        : 'shadow-[0_12px_24px_rgba(0,0,0,0.9),inset_0_4px_10px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95'
                    } ${
                      isAlarmActive 
                        ? 'bg-gradient-to-b from-red-500 via-red-600 to-red-900 border-4 border-yellow-300' 
                        : 'bg-gradient-to-b from-[#e74c3c] via-[#c0392b] to-[#922b21] border-4 border-[#641e16]'
                    }`}
                  >
                    {/* Metal knurled outer rim */}
                    <div className="absolute inset-1 rounded-full border-4 border-dashed border-black/30 pointer-events-none" />

                    {/* Circular Mushroom Cap Crown */}
                    <div className="w-28 h-28 rounded-full bg-gradient-to-b from-[#c0392b] to-[#78281f] border-2 border-black/40 shadow-inner flex flex-col items-center justify-center p-2 text-center text-white font-mono">
                      
                      {/* Top Arrow & Text */}
                      <span className="text-[10px] font-black tracking-widest leading-none drop-shadow flex items-center gap-1">
                        <span>⟳</span> NOT-AUS <span>⟳</span>
                      </span>

                      {/* Center White Push Target Indicator */}
                      <div className={`w-8 h-8 rounded-full my-1.5 border-2 border-black/40 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] ${
                        isButtonPressed ? 'bg-yellow-400 animate-ping' : 'bg-white/90'
                      }`}>
                        <div className="w-3 h-3 rounded-full bg-red-600 shadow-inner" />
                      </div>

                      {/* Bottom Text & Reset Arrow */}
                      <span className="text-[10px] font-black tracking-widest leading-none drop-shadow flex items-center gap-1">
                        <span>STOP</span>
                      </span>
                    </div>
                  </div>

                  {/* 4. TRANSPARENT HINGED SAFETY FLIP-UP COVER */}
                  <div 
                    onClick={toggleCover}
                    className={`absolute inset-0 rounded-full border-4 cursor-pointer transition-all duration-500 ease-out z-30 flex items-center justify-center ${
                      isCoverOpen 
                        ? '-translate-y-24 translate-x-12 -rotate-45 opacity-60 scale-105 border-white/60 bg-cyan-400/10 backdrop-blur-[1px] shadow-2xl pointer-events-auto' 
                        : 'border-white/40 bg-gradient-to-br from-white/30 via-cyan-300/15 to-transparent backdrop-blur-[2px] shadow-[inset_0_0_20px_rgba(255,255,255,0.4),0_10px_20px_rgba(0,0,0,0.5)]'
                    }`}
                  >
                    {/* Glass reflection highlight streaks */}
                    <div className="absolute top-2 left-6 right-6 h-8 rounded-full bg-gradient-to-b from-white/50 to-transparent pointer-events-none" />
                    
                    {/* Cover Lock Tab / Hasp */}
                    <div className="absolute -top-3 w-8 h-8 rounded-full border-2 border-white/50 bg-white/20 flex items-center justify-center shadow-inner">
                      <div className="w-3 h-3 rounded-full bg-[#111820]/60 border border-white/40" />
                    </div>

                    {!isCoverOpen && (
                      <div className="text-center font-mono text-[9px] font-black text-white/90 uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] bg-black/40 px-2 py-1 border border-white/20">
                        {isAllUnlocked ? 'SCHUTZHAUBE ÖFFNEN' : 'SCHUTZHAUBE'}
                      </div>
                    )}
                  </div>

                </div>

              </div>

              {/* Bottom Instructions / Feedback */}
              <div className="mt-4 text-center">
                {isAlarmActive ? (
                  <button
                    onClick={handleResetButton}
                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-yellow-500 text-black font-black text-xs font-mono uppercase tracking-wider hover:brightness-110 shadow-lg flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Срочное закрытие канала связи (Emergency Close)</span>
                  </button>
                ) : (
                  <p className="text-[11px] font-mono text-[#8a9ba8]">
                    {isAllUnlocked 
                      ? '⚠️ (нем.) Канал связи разблокирован. Активировать только в безвыходных ситуациях.' 
                      : '🔒 Механизм заблокирован.'}
                  </p>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
