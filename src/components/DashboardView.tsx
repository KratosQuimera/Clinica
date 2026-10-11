import React from 'react';
import { 
  Users, Stethoscope, Calendar, Clock, CheckCircle2, 
  AlertCircle, Activity, ChevronRight, UserPlus, CalendarPlus, FileText,
  UserCheck, Shield, Sparkles, Pill, MessageCircle, Printer, Globe
} from 'lucide-react';
import { Doctor, Nurse, Patient, Appointment, User, Prescription } from '../types';

interface DashboardViewProps {
  doctors: Doctor[];
  nurses: Nurse[];
  patients: Patient[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  currentUser: User;
  onNavigate: (tab: string) => void;
  onUpdateAppointmentStatus: (id: number, status: any) => void;
  onOpenNewAppointment: () => void;
  onOpenNewPatient: () => void;
  onOpenNewPrescription: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  doctors,
  nurses,
  patients,
  appointments,
  prescriptions,
  currentUser,
  onNavigate,
  onUpdateAppointmentStatus,
  onOpenNewAppointment,
  onOpenNewPatient,
  onOpenNewPrescription,
}) => {
  const todayStr = '2026-10-10';
  const todayAppointments = appointments.filter(a => a.dataAgenda === todayStr);

  const totalHoje = todayAppointments.length;
  const atendidosHoje = todayAppointments.filter(a => a.status === 'CONCLUIDO').length;
  const emAndamentoHoje = todayAppointments.filter(a => a.status === 'EM_ATENDIMENTO').length;
  const confirmadosHoje = todayAppointments.filter(a => a.status === 'CONFIRMADO').length;
  const agendadosHoje = todayAppointments.filter(a => a.status === 'AGENDADO').length;

  const taxaPresenca = totalHoje > 0 
    ? Math.round(((atendidosHoje + emAndamentoHoje + confirmadosHoje) / totalHoje) * 100) 
    : 100;

  // Contagem por especialidade
  const especialidadesMap: Record<string, number> = {};
  appointments.forEach(a => {
    const esp = a.medicoEspecialidade || 'Clínica Geral';
    especialidadesMap[esp] = (especialidadesMap[esp] || 0) + 1;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Painel Clássico NetBeans: "Tela Bem-vindos" (Atalhos Centrais de Gerenciamento) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-xl border border-sky-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Stethoscope className="w-48 h-48 text-sky-400" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-sky-950/90 border border-sky-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.25)] shrink-0">
                <Globe className="w-6 h-6 text-sky-400 animate-spin" style={{ animationDuration: '20s' }} />
              </div>
              <div>
                <span className="text-[11px] font-mono tracking-wider text-sky-400 uppercase font-semibold flex items-center gap-1.5">
                  <span>Tela Bem-Vindos</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-emerald-400">Rede Global ClinEstudo</span>
                </span>
                <h1 className="text-xl font-bold text-white tracking-wide mt-0.5">
                  Sistema de Gerenciamento de: Consultas e Procedimentos Clínicos
                </h1>
              </div>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Usuário: <span className="text-emerald-400 font-bold">{currentUser.login}</span> ({currentUser.perfil})
            </div>
          </div>

          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            Selecione uma das opções rápidas abaixo ou utilize a barra superior de menus no formato original NetBeans (Cadastros, Relatórios, Ferramentas, Sair).
          </p>

          {/* Os 5 botões de atalho da TelaPrincipal */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 pt-1">
            <button
              onClick={() => onNavigate('medicos')}
              className="flex flex-col items-center justify-center p-4 bg-slate-950/80 hover:bg-sky-950/40 border border-sky-500/40 hover:border-sky-400 rounded-lg text-center transition-all group cursor-pointer shadow-sm"
            >
              <div className="p-3 bg-sky-500/10 rounded-full group-hover:scale-105 transition-transform text-sky-400 mb-2 border border-sky-500/20">
                <Stethoscope className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-white group-hover:text-sky-300">Cad. Médicos</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Corpo Clínico & CRM</span>
            </button>

            <button
              onClick={() => onNavigate('enfermeiros')}
              className="flex flex-col items-center justify-center p-4 bg-slate-950/80 hover:bg-purple-950/40 border border-purple-500/40 hover:border-purple-400 rounded-lg text-center transition-all group cursor-pointer shadow-sm"
            >
              <div className="p-3 bg-purple-500/10 rounded-full group-hover:scale-105 transition-transform text-purple-400 mb-2 border border-purple-500/20">
                <Activity className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-white group-hover:text-purple-300">Cad. Enfermeiras</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Setores & COREN</span>
            </button>

            <button
              onClick={() => onNavigate('pacientes')}
              className="flex flex-col items-center justify-center p-4 bg-slate-950/80 hover:bg-emerald-950/40 border border-emerald-500/40 hover:border-emerald-400 rounded-lg text-center transition-all group cursor-pointer shadow-sm"
            >
              <div className="p-3 bg-emerald-500/10 rounded-full group-hover:scale-105 transition-transform text-emerald-400 mb-2 border border-emerald-500/20">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-white group-hover:text-emerald-300">Cad. Pacientes</span>
              <span className="text-[10px] text-slate-400 mt-0.5">CPF Oficial & Contatos</span>
            </button>

            <button
              onClick={() => onNavigate('agenda')}
              className="flex flex-col items-center justify-center p-4 bg-slate-950/80 hover:bg-amber-950/40 border border-amber-500/40 hover:border-amber-400 rounded-lg text-center transition-all group cursor-pointer shadow-sm"
            >
              <div className="p-3 bg-amber-500/10 rounded-full group-hover:scale-105 transition-transform text-amber-400 mb-2 border border-amber-500/20">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-white group-hover:text-amber-300">Agenda Consultas</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Horários & Conflitos</span>
            </button>

            <button
              onClick={() => onNavigate('receitas')}
              className="flex flex-col items-center justify-center p-4 bg-slate-950/80 hover:bg-emerald-950/50 border border-emerald-500/50 hover:border-emerald-400 rounded-lg text-center transition-all group cursor-pointer shadow-sm col-span-2 sm:col-span-1"
            >
              <div className="p-3 bg-emerald-500/15 rounded-full group-hover:scale-105 transition-transform text-emerald-400 mb-2 border border-emerald-500/30">
                <Pill className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200">Receitas Médicas</span>
              <span className="text-[10px] text-slate-400 mt-0.5">QR Code & WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/60 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Consultas Hoje</div>
            <div className="text-2xl font-bold text-white mt-1">{totalHoje}</div>
            <div className="text-[11px] text-slate-400 mt-1">{atendidosHoje} concluídas · {emAndamentoHoje} em sala</div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded border border-emerald-500/20 text-emerald-400">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/60 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Pacientes Ativos</div>
            <div className="text-2xl font-bold text-white mt-1">{patients.filter(p => p.ativo).length}</div>
            <div className="text-[11px] text-slate-400 mt-1">Cadastros validados</div>
          </div>
          <div className="p-3 bg-sky-500/10 rounded border border-sky-500/20 text-sky-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/60 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Corpo Médico</div>
            <div className="text-2xl font-bold text-white mt-1">{doctors.filter(d => d.ativo).length}</div>
            <div className="text-[11px] text-slate-400 mt-1">Médicos credenciados</div>
          </div>
          <div className="p-3 bg-teal-500/10 rounded border border-teal-500/20 text-teal-400">
            <Stethoscope className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/60 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Equipe Enfermagem</div>
            <div className="text-2xl font-bold text-white mt-1">{nurses.filter(n => n.ativo).length}</div>
            <div className="text-[11px] text-slate-400 mt-1">Setores e triagem</div>
          </div>
          <div className="p-3 bg-purple-500/10 rounded border border-purple-500/20 text-purple-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/60 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Taxa de Presença</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{taxaPresenca}%</div>
            <div className="text-[11px] text-slate-400 mt-1">Conformidade de agenda</div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/60 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Receitas Emitidas</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{prescriptions.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">QR Code & WhatsApp</div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded border border-emerald-500/20 text-emerald-400">
            <Pill className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Agenda do Dia + Especialidades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agenda do Dia (2 colunas) */}
        <div className="lg:col-span-2 bg-slate-800/60 rounded-lg border border-slate-700/60 flex flex-col">
          <div className="p-4 border-b border-slate-700/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">Agenda e Atendimentos do Dia</h2>
            </div>
            <button
              onClick={() => onNavigate('agenda')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Abrir Agenda Completa</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-700/50 flex-1 overflow-y-auto max-h-[380px]">
            {todayAppointments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Nenhuma consulta agendada para o dia de hoje.
              </div>
            ) : (
              todayAppointments.map((app) => (
                <div key={app.id} className="p-4 hover:bg-slate-750/50 transition-colors flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="font-mono text-sm font-bold text-emerald-400 bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-700">
                      {app.horario}
                    </div>
                    <div>
                      <div className="font-medium text-white text-sm">
                        {app.pacienteNome}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Médico: <span className="text-slate-300">{app.medicoNome}</span> ({app.medicoEspecialidade})
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Motivo: <span className="text-slate-300">{app.motivo}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right text-xs mr-2 font-mono">
                      {app.status === 'EM_ATENDIMENTO' && (
                        <span className="text-amber-400 font-semibold">● Em Atendimento</span>
                      )}
                      {app.status === 'CONFIRMADO' && (
                        <span className="text-sky-400 font-semibold">● Confirmado</span>
                      )}
                      {app.status === 'AGENDADO' && (
                        <span className="text-slate-400">● Agendado</span>
                      )}
                      {app.status === 'CONCLUIDO' && (
                        <span className="text-emerald-400 font-semibold">✓ Concluído</span>
                      )}
                      {app.status === 'CANCELADO' && (
                        <span className="text-rose-400">✕ Cancelado</span>
                      )}
                    </div>

                    {app.status === 'AGENDADO' && (
                      <button
                        onClick={() => onUpdateAppointmentStatus(app.id, 'CONFIRMADO')}
                        className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 rounded border border-slate-600 transition-colors cursor-pointer"
                      >
                        Check-in
                      </button>
                    )}
                    {app.status === 'CONFIRMADO' && (
                      <button
                        onClick={() => onUpdateAppointmentStatus(app.id, 'EM_ATENDIMENTO')}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-xs text-white rounded font-medium transition-colors cursor-pointer"
                      >
                        Chamar
                      </button>
                    )}
                    {app.status === 'EM_ATENDIMENTO' && (
                      <button
                        onClick={() => onUpdateAppointmentStatus(app.id, 'CONCLUIDO')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-xs text-white rounded font-medium transition-colors cursor-pointer"
                      >
                        Finalizar
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Especialidades e Atalhos Clínicos (1 coluna) */}
        <div className="space-y-6">
          <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/60">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center justify-between">
              <span>Demanda por Especialidade</span>
              <span className="text-xs text-slate-400 font-normal">Agendamentos</span>
            </h3>

            <div className="space-y-3">
              {Object.entries(especialidadesMap).map(([esp, count]) => {
                const total = appointments.length || 1;
                const perc = Math.round((count / total) * 100);
                return (
                  <div key={esp} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{esp}</span>
                      <span className="text-slate-400 font-mono">{count} ({perc}%)</span>
                    </div>
                    <div className="w-full bg-slate-700/70 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${perc}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/60">
            <h3 className="text-sm font-semibold text-white mb-3">Módulos Administrativos</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onNavigate('usuarios')}
                className="p-3 bg-slate-700/50 hover:bg-slate-700 text-left rounded border border-slate-600/60 transition-colors text-slate-200 cursor-pointer"
              >
                <div className="font-semibold text-white">Usuários</div>
                <div className="text-[11px] text-slate-400">Perfis & Senhas</div>
              </button>
              <button
                onClick={() => onNavigate('relatorios')}
                className="p-3 bg-slate-700/50 hover:bg-slate-700 text-left rounded border border-slate-600/60 transition-colors text-slate-200 cursor-pointer"
              >
                <div className="font-semibold text-white">Relatórios</div>
                <div className="text-[11px] text-slate-400">Exportar CSV/PDF</div>
              </button>
              <button
                onClick={() => onNavigate('auditoria')}
                className="p-3 bg-slate-700/50 hover:bg-slate-700 text-left rounded border border-slate-600/60 transition-colors text-slate-200 cursor-pointer"
              >
                <div className="font-semibold text-white">Auditoria</div>
                <div className="text-[11px] text-slate-400">Trilha LGPD</div>
              </button>
              <button
                onClick={() => onNavigate('python_hub')}
                className="p-3 bg-emerald-950/40 hover:bg-emerald-900/50 text-left rounded border border-emerald-600/50 transition-colors text-slate-200 cursor-pointer"
              >
                <div className="font-semibold text-emerald-300">Python Hub</div>
                <div className="text-[11px] text-slate-400">Código & .EXE</div>
              </button>
              <button
                onClick={() => onNavigate('receitas')}
                className="p-3 bg-emerald-950/30 hover:bg-emerald-900/40 text-left rounded border border-emerald-700/50 transition-colors text-slate-200 cursor-pointer col-span-2"
              >
                <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Prescrições Médicas & Medicamentos para Casa</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Emissão de receituário com QR Code, envio para WhatsApp e guarda no cadastro do paciente
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
