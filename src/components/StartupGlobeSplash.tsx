import React, { useState, useEffect } from 'react';
import { 
  Globe, ShieldCheck, Stethoscope, Sparkles, CheckCircle2, 
  ArrowRight, Activity, Terminal, Database, Lock, Cpu
} from 'lucide-react';

interface StartupGlobeSplashProps {
  onComplete: () => void;
  autoCloseDelayMs?: number;
}

export const StartupGlobeSplash: React.FC<StartupGlobeSplashProps> = ({
  onComplete,
  autoCloseDelayMs = 2800,
}) => {
  const [progress, setProgress] = useState(10);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const bootSteps = [
    { label: 'Estabelecendo Conexão de Rede Global ClinEstudo...', icon: Globe },
    { label: 'Carregando Módulos Clínicos & Prescrições com QR Code...', icon: Stethoscope },
    { label: 'Verificando Criptografia LGPD e Banco de Dados...', icon: ShieldCheck },
    { label: 'Sistema Inicializado com Sucesso!', icon: CheckCircle2 },
  ];

  useEffect(() => {
    // Animação de progresso suave
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const next = prev + Math.floor(Math.random() * 12) + 8;
        return next > 100 ? 100 : next;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress < 35) setCurrentStepIndex(0);
    else if (progress < 70) setCurrentStepIndex(1);
    else if (progress < 95) setCurrentStepIndex(2);
    else setCurrentStepIndex(3);
  }, [progress]);

  useEffect(() => {
    if (progress === 100) {
      const timer = setTimeout(() => {
        onComplete();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 select-none overflow-hidden font-sans">
      {/* Background glow com anéis concêntricos */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-30">
        <div className="w-[600px] h-[600px] rounded-full border border-sky-500/20 animate-ping duration-[4000ms]" />
        <div className="absolute w-[450px] h-[450px] rounded-full border border-teal-500/30 animate-pulse duration-1000" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-gradient-to-tr from-sky-600/10 via-emerald-500/15 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg w-full flex flex-col items-center text-center space-y-6">
        {/* LOGO DO GLOBO ANIMADO (Conforme solicitado pelo usuário) */}
        <div className="relative group">
          {/* Anel orbital externo rotativo */}
          <div className="w-32 h-32 rounded-full border-2 border-dashed border-sky-400/40 animate-[spin_12s_linear_infinite] flex items-center justify-center">
            {/* Ponto orbital */}
            <div className="absolute -top-1.5 w-3 h-3 bg-teal-400 rounded-full shadow-[0_0_12px_#2dd4bf] animate-pulse" />
          </div>

          {/* Núcleo do Globo com gradiente e profundidade */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-sky-950 via-slate-900 to-teal-950 border-2 border-sky-400 shadow-[0_0_35px_rgba(56,189,248,0.35)] flex items-center justify-center overflow-hidden">
            {/* SVG do Globo detalhado com meridianos e paralelos */}
            <svg 
              className="w-20 h-20 text-sky-400/90 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]" 
              viewBox="0 0 100 100" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Esfera base */}
              <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="2.5" opacity="0.9" />
              
              {/* Linha do Equador */}
              <line x1="6" y1="50" x2="94" y2="50" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 2" opacity="0.75" />
              
              {/* Trópicos / Paralelos */}
              <ellipse cx="50" cy="30" rx="38" ry="12" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
              <ellipse cx="50" cy="70" rx="38" ry="12" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
              
              {/* Meridianos curvos longitudinais */}
              <ellipse cx="50" cy="50" rx="22" ry="44" stroke="currentColor" strokeWidth="1.8" opacity="0.8" />
              <line x1="50" y1="6" x2="50" y2="94" stroke="currentColor" strokeWidth="2" opacity="0.85" />
              
              {/* Símbolo Médico / Cruz Clínica Central */}
              <path d="M45 42 H55 V47 H60 V53 H55 V58 H45 V53 H40 V47 H45 Z" fill="#38bdf8" opacity="0.95" />
            </svg>

            {/* Brilho dinâmico */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-400/10 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Identidade Visual ClinEstudo */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-500/40 text-sky-300 text-[11px] font-mono tracking-wider uppercase font-semibold">
            <Globe className="w-3.5 h-3.5 text-sky-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span>Rede Global de Gestão Clínica</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wider flex items-center justify-center gap-2">
            <span>CLINESTUDO</span>
            <span className="text-sky-400 font-light">DESKTOP</span>
          </h1>

          <p className="text-xs text-slate-400 max-w-sm">
            Sistema Integrado de Prontuários, Consultas e Prescrições Digitais com QR Code
          </p>
        </div>

        {/* Barra de Carregamento e Progresso */}
        <div className="w-full space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
            <div className="flex items-center gap-2">
              {React.createElement(bootSteps[currentStepIndex].icon, {
                className: "w-3.5 h-3.5 text-sky-400 animate-pulse"
              })}
              <span className="truncate max-w-[280px] sm:max-w-none text-left">
                {bootSteps[currentStepIndex].label}
              </span>
            </div>
            <span className="text-sky-400 font-bold">{progress}%</span>
          </div>

          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/80">
            <div 
              className="h-full bg-gradient-to-r from-sky-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-300 shadow-[0_0_12px_#38bdf8]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Status de Subsistemas */}
        <div className="grid grid-cols-3 gap-2 w-full pt-1 text-[11px]">
          <div className="bg-slate-900/90 border border-slate-800 rounded p-2 flex items-center gap-1.5 justify-center text-slate-300">
            <Database className="w-3 h-3 text-emerald-400" />
            <span>Banco OK</span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded p-2 flex items-center gap-1.5 justify-center text-slate-300">
            <Stethoscope className="w-3 h-3 text-sky-400" />
            <span>Receitas QR</span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded p-2 flex items-center gap-1.5 justify-center text-slate-300">
            <Lock className="w-3 h-3 text-purple-400" />
            <span>LGPD Ativa</span>
          </div>
        </div>

        {/* Botão de Entrada / Ignorar Espera */}
        <div className="pt-2">
          <button
            onClick={onComplete}
            className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-sky-600/20 transition-all cursor-pointer"
          >
            <span>Acessar Sistema Agora</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-[10px] text-slate-500 font-mono">
          ClinEstudo v2.4.0 · Arquitetura Compatível NetBeans Swing / Python PySide6
        </div>
      </div>
    </div>
  );
};
