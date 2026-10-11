import React, { useState, useEffect, useRef } from 'react';
import { 
  Minus, Square, X, Shield, Activity, Users, Stethoscope, 
  Calendar, FileText, ShieldCheck, Terminal, LogOut, Clock, 
  Database, RefreshCw, Cpu, Layers, ChevronDown
} from 'lucide-react';
import { User } from '../types';

interface DesktopWindowProps {
  currentUser: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const DesktopWindow: React.FC<DesktopWindowProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  onLogout,
  children,
}) => {
  const [timeString, setTimeString] = useState('');
  const [isMaximized, setIsMaximized] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fecha menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.desktop-menu-bar')) {
        setOpenMenu(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Tela Bem-Vindos (Atalhos)', icon: Layers, roles: ['ADMINISTRADOR', 'MEDICO', 'ENFERMEIRO', 'RECEPCIONISTA'] },
    { id: 'medicos', label: 'Cad. Médicos', icon: Stethoscope, roles: ['ADMINISTRADOR', 'MEDICO', 'RECEPCIONISTA'] },
    { id: 'enfermeiros', label: 'Cad. Enfermeiras', icon: Activity, roles: ['ADMINISTRADOR', 'ENFERMEIRO', 'RECEPCIONISTA'] },
    { id: 'pacientes', label: 'Cad. Pacientes', icon: Users, roles: ['ADMINISTRADOR', 'MEDICO', 'ENFERMEIRO', 'RECEPCIONISTA'] },
    { id: 'agenda', label: 'Agenda de Consultas', icon: Calendar, roles: ['ADMINISTRADOR', 'MEDICO', 'ENFERMEIRO', 'RECEPCIONISTA'] },
    { id: 'relatorios', label: 'Relatórios & Exportação', icon: FileText, roles: ['ADMINISTRADOR', 'MEDICO', 'RECEPCIONISTA'] },
    { id: 'auditoria', label: 'Auditoria & LGPD', icon: ShieldCheck, roles: ['ADMINISTRADOR'] },
    { id: 'usuarios', label: 'Cad. Usuários (RBAC)', icon: Shield, roles: ['ADMINISTRADOR'] },
    { id: 'python_hub', label: 'Distribuição Python NetBeans', icon: Cpu, roles: ['ADMINISTRADOR', 'MEDICO', 'ENFERMEIRO', 'RECEPCIONISTA'] },
  ];

  const allowedNavItems = navItems.filter(item => item.roles.includes(currentUser.perfil));

  const toggleMenu = (menuName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  const handleSelectMenuItem = (tab: string) => {
    onTabChange(tab);
    setOpenMenu(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 select-none overflow-hidden">
      {/* 1. Title bar (Window Chrome) */}
      <div className="h-9 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-[10px]">
            C
          </div>
          <span className="text-xs font-semibold text-slate-200 tracking-wide">
            ClinEstudo - Sistema de Gerenciamento de Consultório (Java Swing / NetBeans Formato Adaptado)
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-[11px] text-slate-400 font-mono">
            {currentUser.login} ({currentUser.perfil})
          </span>
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-1 -mr-1">
          <button 
            onClick={() => {}}
            className="w-7 h-6 flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
            title="Minimizar"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setIsMaximized(!isMaximized)}
            className="w-7 h-6 flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
            title="Restaurar / Maximizar"
          >
            <Square className="w-3 h-3" />
          </button>
          <button 
            onClick={onLogout}
            className="w-7 h-6 flex items-center justify-center hover:bg-rose-600 text-slate-400 hover:text-white rounded transition-colors"
            title="Encerrar Sessão"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Menu Bar (Classic NetBeans Hierarchy) */}
      <div className="desktop-menu-bar h-7 bg-slate-925 border-b border-slate-800/80 flex items-center px-3 gap-1 text-[11px] text-slate-300 shrink-0 relative z-40">
        {/* Menu Cadastros */}
        <div className="relative">
          <button
            onClick={(e) => toggleMenu('cadastros', e)}
            className={`px-2 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer ${openMenu === 'cadastros' ? 'bg-slate-800 text-white' : ''}`}
          >
            Cadastros
          </button>
          {openMenu === 'cadastros' && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-slate-900 border border-slate-700 rounded shadow-2xl py-1 text-xs z-50">
              <button onClick={() => handleSelectMenuItem('medicos')} className="w-full text-left px-3 py-1.5 hover:bg-slate-800 hover:text-sky-300 flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5 text-sky-400" /> Médicos
              </button>
              <button onClick={() => handleSelectMenuItem('enfermeiros')} className="w-full text-left px-3 py-1.5 hover:bg-slate-800 hover:text-purple-300 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-purple-400" /> Enfermeiras
              </button>
              <button onClick={() => handleSelectMenuItem('pacientes')} className="w-full text-left px-3 py-1.5 hover:bg-slate-800 hover:text-emerald-300 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-emerald-400" /> Pacientes
              </button>
              {currentUser.perfil === 'ADMINISTRADOR' && (
                <button onClick={() => handleSelectMenuItem('usuarios')} className="w-full text-left px-3 py-1.5 hover:bg-slate-800 hover:text-amber-300 flex items-center gap-2 border-t border-slate-800 mt-0.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" /> Usuários (RBAC)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Menu Atendimento */}
        <div className="relative">
          <button
            onClick={(e) => toggleMenu('atendimento', e)}
            className={`px-2 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer ${openMenu === 'atendimento' ? 'bg-slate-800 text-white' : ''}`}
          >
            Atendimento
          </button>
          {openMenu === 'atendimento' && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-slate-900 border border-slate-700 rounded shadow-2xl py-1 text-xs z-50">
              <button onClick={() => handleSelectMenuItem('agenda')} className="w-full text-left px-3 py-1.5 hover:bg-slate-800 hover:text-amber-300 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> Agenda Consultas
              </button>
            </div>
          )}
        </div>

        {/* Menu Relatorios */}
        <div className="relative">
          <button
            onClick={(e) => toggleMenu('relatorios', e)}
            className={`px-2 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer ${openMenu === 'relatorios' ? 'bg-slate-800 text-white' : ''}`}
          >
            Relatórios
          </button>
          {openMenu === 'relatorios' && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-slate-900 border border-slate-700 rounded shadow-2xl py-1 text-xs z-50">
              <button onClick={() => handleSelectMenuItem('relatorios')} className="w-full text-left px-3 py-1.5 hover:bg-slate-800 hover:text-sky-300 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-sky-400" /> Produtividade & Faltas
              </button>
              {currentUser.perfil === 'ADMINISTRADOR' && (
                <button onClick={() => handleSelectMenuItem('auditoria')} className="w-full text-left px-3 py-1.5 hover:bg-slate-800 hover:text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Trilha Auditoria LGPD
                </button>
              )}
            </div>
          )}
        </div>

        {/* Menu Ferramentas */}
        <div className="relative">
          <button
            onClick={(e) => toggleMenu('ferramentas', e)}
            className={`px-2 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer ${openMenu === 'ferramentas' ? 'bg-slate-800 text-white' : ''}`}
          >
            Ferramentas
          </button>
          {openMenu === 'ferramentas' && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-slate-900 border border-slate-700 rounded shadow-2xl py-1 text-xs z-50">
              <button onClick={() => handleSelectMenuItem('dashboard')} className="w-full text-left px-3 py-1.5 hover:bg-slate-800 hover:text-sky-300 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-sky-400" /> Tela Bem-vindos (Atalhos)
              </button>
              <button onClick={() => handleSelectMenuItem('python_hub')} className="w-full text-left px-3 py-1.5 hover:bg-slate-800 hover:text-emerald-300 flex items-center gap-2 border-t border-slate-800 mt-0.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" /> Código Python NetBeans
              </button>
            </div>
          )}
        </div>

        {/* Menu Sair */}
        <div className="relative">
          <button
            onClick={onLogout}
            className="px-2 py-0.5 rounded hover:bg-rose-950/60 hover:text-rose-300 transition-colors cursor-pointer text-slate-400"
          >
            Sair
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2 text-slate-400">
          <span className="text-[10px] bg-sky-500/10 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded font-mono">
            ModeloBeans · ModeloDAO · ConexaoBD
          </span>
        </div>
      </div>

      {/* 3. Main Workspace: Sidebar + Viewport */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
          <div className="p-3 space-y-1 overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Módulos do Sistema
            </div>

            {allowedNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'bg-sky-600/15 text-sky-300 border border-sky-500/30 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* User profile card & Logout */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <div className="w-7 h-7 rounded-full bg-sky-600/30 border border-sky-500/50 flex items-center justify-center text-xs font-bold text-sky-300">
                {currentUser.nome.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white truncate">{currentUser.nome}</div>
                <div className="text-[10px] text-sky-400 font-mono uppercase">{currentUser.perfil}</div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/40 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Encerrar Sessão</span>
            </button>
          </div>
        </aside>

        {/* Viewport Content */}
        <main className="flex-1 bg-slate-950 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* 4. Bottom Status Bar */}
      <footer className="h-6 bg-slate-925 border-t border-slate-800 flex items-center justify-between px-3 text-[11px] text-slate-400 font-mono shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sky-400">
            <Database className="w-3 h-3" />
            <span>PostgreSQL: Conectado (Porta 5432)</span>
          </div>
          <span className="text-slate-600">·</span>
          <div className="text-slate-400">
            Contingência: SQLite Habilitado
          </div>
          <span className="text-slate-600">·</span>
          <div className="text-slate-400">
            Transações: ACID / Isolamento Read Committed
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-slate-400">
            Sessão Ativa: {currentUser.login}
          </div>
          <span className="text-slate-600">·</span>
          <div className="flex items-center gap-1 text-slate-300">
            <Clock className="w-3 h-3 text-sky-400" />
            <span>{timeString}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
