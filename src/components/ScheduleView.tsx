import React, { useState } from 'react';
import { 
  Calendar, Clock, Plus, Search, Filter, AlertTriangle, 
  CheckCircle2, XCircle, FileText, ChevronLeft, ChevronRight, X, User, Pill, Stethoscope
} from 'lucide-react';
import { Appointment, Doctor, Patient, Nurse, AppointmentStatus, User as AppUser } from '../types';

interface ScheduleViewProps {
  appointments: Appointment[];
  doctors: Doctor[];
  patients: Patient[];
  nurses: Nurse[];
  currentUser: AppUser;
  onSaveAppointment: (appointment: Omit<Appointment, 'id' | 'criadoEm'>, id?: number) => { success: boolean; message: string };
  onUpdateStatus: (id: number, status: AppointmentStatus, obs?: string) => { success: boolean; message: string };
  onOpenCreatePrescription: (patientId: number, doctorId?: number) => void;
  onOpenAtendimento?: (patientId: number, doctorId?: number) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  appointments,
  doctors,
  patients,
  nurses,
  currentUser,
  onSaveAppointment,
  onUpdateStatus,
  onOpenCreatePrescription,
  onOpenAtendimento,
}) => {
  const [viewMode, setViewMode] = useState<'dia' | 'semana' | 'mes'>('dia');
  const [selectedDate, setSelectedDate] = useState('2026-10-10');
  const [filterDoctorId, setFilterDoctorId] = useState<string>('TODOS');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  const [showNewModal, setShowNewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState<Appointment | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states for appointment
  const [formPacienteId, setFormPacienteId] = useState<number>(patients[0]?.id || 1);
  const [formMedicoId, setFormMedicoId] = useState<number>(doctors[0]?.id || 1);
  const [formEnfermeiroId, setFormEnfermeiroId] = useState<number | undefined>(nurses[0]?.id);
  const [formDataAgenda, setFormDataAgenda] = useState('2026-10-10');
  const [formHorario, setFormHorario] = useState('11:00');
  const [formPeriodo, setFormPeriodo] = useState<'MANHÃ' | 'TARDE' | 'NOITE'>('MANHÃ');
  const [formMotivo, setFormMotivo] = useState('');
  const [formObservacoes, setFormObservacoes] = useState('');

  // Status modal state
  const [statusNovo, setStatusNovo] = useState<AppointmentStatus>('CONFIRMADO');
  const [statusObs, setStatusObs] = useState('');

  // Detecção preventiva de conflito em tempo real
  const conflitoDetectado = appointments.find(a => 
    a.medicoId === formMedicoId &&
    a.dataAgenda === formDataAgenda &&
    a.horario === formHorario &&
    a.status !== 'CANCELADO'
  );

  const filteredAppointments = appointments.filter(a => {
    const matchesSearch = 
      (a.pacienteNome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.medicoNome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.motivo || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDoctor = filterDoctorId === 'TODOS' || a.medicoId.toString() === filterDoctorId;
    const matchesStatus = filterStatus === 'TODOS' || a.status === filterStatus;
    const matchesDate = viewMode === 'dia' ? a.dataAgenda === selectedDate : true;
    return matchesSearch && matchesDoctor && matchesStatus && matchesDate;
  });

  const handleOpenCreate = () => {
    setFormPacienteId(patients[0]?.id || 1);
    setFormMedicoId(doctors[0]?.id || 1);
    setFormEnfermeiroId(nurses[0]?.id);
    setFormDataAgenda(selectedDate);
    setFormHorario('11:30');
    setFormPeriodo('MANHÃ');
    setFormMotivo('Consulta Médica Ambulatorial');
    setFormObservacoes('');
    setShowNewModal(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMotivo.trim()) {
      setFeedback({ type: 'error', message: 'O motivo da consulta é obrigatório.' });
      return;
    }

    // Validação rígida de conflito
    if (conflitoDetectado) {
      setFeedback({ 
        type: 'error', 
        message: `CONFLITO DE HORÁRIO: O médico já possui consulta agendada para ${conflitoDetectado.pacienteNome} nesta data e horário (${formHorario}). Escolha outro horário.` 
      });
      return;
    }

    const payload = {
      pacienteId: Number(formPacienteId),
      medicoId: Number(formMedicoId),
      enfermeiroId: formEnfermeiroId ? Number(formEnfermeiroId) : undefined,
      dataAgenda: formDataAgenda,
      horario: formHorario,
      periodo: formPeriodo,
      motivo: formMotivo.trim(),
      status: 'AGENDADO' as AppointmentStatus,
      observacoes: formObservacoes.trim(),
      criadoPor: currentUser.login,
    };

    const res = onSaveAppointment(payload);
    if (res.success) {
      setShowNewModal(false);
      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showStatusModal) return;

    const res = onUpdateStatus(showStatusModal.id, statusNovo, statusObs);
    if (res.success) {
      setShowStatusModal(null);
      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const canEdit = currentUser.perfil === 'ADMINISTRADOR' || currentUser.perfil === 'RECEPCIONISTA' || currentUser.perfil === 'MEDICO';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-white">Agenda & Gestão de Consultas</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Agendamento inteligente, prevenção de choque de horários, controle de filas e triagem.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        )}
      </div>

      {feedback && (
        <div className={`p-3 rounded text-xs flex items-center justify-between border ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/70 border-emerald-800 text-emerald-200' 
            : 'bg-rose-950/70 border-rose-800 text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Control Bar: Mode, Date Selector, Filters */}
      <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
        {/* Left: View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-700 rounded">
          <button
            onClick={() => setViewMode('dia')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'dia' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Diário
          </button>
          <button
            onClick={() => setViewMode('semana')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'semana' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Semanal
          </button>
          <button
            onClick={() => setViewMode('mes')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'mes' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Mensal
          </button>
        </div>

        {/* Center: Date picker */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Data de Referência:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        {/* Right: Doctor & Status Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-400">Médico:</label>
            <select
              value={filterDoctorId}
              onChange={(e) => setFilterDoctorId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="TODOS">Todos os Médicos</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id.toString()}>{d.nome}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-400">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="AGENDADO">Agendado</option>
              <option value="CONFIRMADO">Confirmado</option>
              <option value="EM_ATENDIMENTO">Em Atendimento</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="CANCELADO">Cancelado</option>
              <option value="FALTOU">Faltou</option>
            </select>
          </div>
        </div>
      </div>

      {/* List / Schedule Grid */}
      <div className="bg-slate-800/60 rounded-lg border border-slate-700/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] font-mono border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Horário / Data</th>
                <th className="py-3 px-4">Paciente</th>
                <th className="py-3 px-4">Médico Responsável</th>
                <th className="py-3 px-4">Motivo da Consulta</th>
                <th className="py-3 px-4">Enfermeiro Triagem</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Fluxo / Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Nenhum agendamento encontrado para o período ou critérios selecionados.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-750/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono text-sm font-bold text-emerald-400">{app.horario}</div>
                      <div className="text-[11px] font-mono text-slate-400">{app.dataAgenda} ({app.periodo})</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{app.pacienteNome}</div>
                      <div className="text-[11px] text-slate-400">Tel: {app.pacienteTelefone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-200 font-medium">{app.medicoNome}</div>
                      <div className="text-[11px] text-slate-400">{app.medicoEspecialidade}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-slate-300 truncate">{app.motivo}</div>
                      {app.observacoes && (
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">Obs: {app.observacoes}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {app.enfermeiroNome || 'Não atribuído'}
                    </td>
                    <td className="py-3 px-4 font-mono">
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
                      {app.status === 'FALTOU' && (
                        <span className="text-orange-400">⚠️ Faltou</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onOpenAtendimento && (
                          <button
                            onClick={() => onOpenAtendimento(app.pacienteId, app.medicoId)}
                            className="px-2.5 py-1.5 bg-sky-700/30 hover:bg-sky-600 text-sky-300 hover:text-white rounded text-xs font-semibold border border-sky-600/40 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Iniciar Atendimento Clínico & Prontuário"
                          >
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>Atender</span>
                          </button>
                        )}
                        <button
                          onClick={() => onOpenCreatePrescription(app.pacienteId, app.medicoId)}
                          className="px-2.5 py-1.5 bg-emerald-700/30 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded text-xs font-semibold border border-emerald-600/40 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Prescrever Receita Médica com QR Code e WhatsApp"
                        >
                          <Pill className="w-3.5 h-3.5" />
                          <span>Receita</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowStatusModal(app);
                            setStatusNovo(app.status);
                            setStatusObs(app.observacoes || '');
                          }}
                          className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white rounded text-xs font-medium border border-slate-600 transition-colors cursor-pointer"
                        >
                          Atualizar Status
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Agendamento */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-850 border border-slate-700 rounded-lg max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <span>Agendar Nova Consulta</span>
              </h2>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Paciente *</label>
                <select
                  value={formPacienteId}
                  onChange={(e) => setFormPacienteId(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {patients.filter(p => p.ativo).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nome} (CPF: {p.cpf}) - Convênio: {p.convenio}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Médico Responsável *</label>
                  <select
                    value={formMedicoId}
                    onChange={(e) => setFormMedicoId(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {doctors.filter(d => d.ativo).map(d => (
                      <option key={d.id} value={d.id}>
                        {d.nome} ({d.especialidade})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Enfermeiro Triagem</label>
                  <select
                    value={formEnfermeiroId || ''}
                    onChange={(e) => setFormEnfermeiroId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Não atribuído</option>
                    {nurses.filter(n => n.ativo).map(n => (
                      <option key={n.id} value={n.id}>
                        {n.nome} ({n.setor})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={formDataAgenda}
                    onChange={(e) => setFormDataAgenda(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Horário *</label>
                  <input
                    type="time"
                    required
                    value={formHorario}
                    onChange={(e) => setFormHorario(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Período *</label>
                  <select
                    value={formPeriodo}
                    onChange={(e) => setFormPeriodo(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="MANHÃ">Manhã</option>
                    <option value="TARDE">Tarde</option>
                    <option value="NOITE">Noite</option>
                  </select>
                </div>
              </div>

              {/* Conflito detection notice */}
              {conflitoDetectado && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 rounded text-rose-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-rose-300">Conflito de Horário Detectado!</div>
                    <div>
                      O médico já possui consulta agendada para <strong>{conflitoDetectado.pacienteNome}</strong> às {conflitoDetectado.horario}. O sistema impede duplicidade de horário.
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Motivo do Atendimento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Consulta Cardiológica de Rotina / Retorno"
                  value={formMotivo}
                  onChange={(e) => setFormMotivo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Observações Clínicas Preliminares</label>
                <textarea
                  rows={2}
                  placeholder="Sintomas relatados, necessidade de exames prévios, etc."
                  value={formObservacoes}
                  onChange={(e) => setFormObservacoes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!!conflitoDetectado}
                  className={`px-4 py-2 text-white rounded font-semibold shadow-sm transition-colors ${
                    conflitoDetectado 
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                      : 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer'
                  }`}
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Atualizar Status */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-850 border border-slate-700 rounded-lg max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Fluxo do Atendimento</h2>
                <div className="text-xs text-slate-400 mt-0.5">
                  Paciente: <span className="text-white">{showStatusModal.pacienteNome}</span> ({showStatusModal.horario})
                </div>
              </div>
              <button onClick={() => setShowStatusModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Novo Status da Consulta *</label>
                <select
                  value={statusNovo}
                  onChange={(e) => setStatusNovo(e.target.value as AppointmentStatus)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="AGENDADO">Agendado (Aguardando)</option>
                  <option value="CONFIRMADO">Confirmado (Paciente na Recepção)</option>
                  <option value="EM_ATENDIMENTO">Em Atendimento (Consultório Médico)</option>
                  <option value="CONCLUIDO">Concluído (Consulta Finalizada)</option>
                  <option value="CANCELADO">Cancelado (Pelo Paciente ou Clínica)</option>
                  <option value="FALTOU">Faltou (Não Compareceu)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {statusNovo === 'CANCELADO' ? 'Justificativa de Cancelamento *' : 'Observações do Atendimento / Conduta'}
                </label>
                <textarea
                  rows={3}
                  required={statusNovo === 'CANCELADO'}
                  placeholder={statusNovo === 'CANCELADO' ? 'Informe o motivo do cancelamento para registro em auditoria...' : 'Anotações da consulta, orientações ao paciente...'}
                  value={statusObs}
                  onChange={(e) => setStatusObs(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Botão de Prescrever Receita para o Paciente */}
              <div className="bg-emerald-950/40 p-3 rounded-lg border border-emerald-800/60 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-emerald-300 font-semibold flex items-center gap-1.5 text-xs">
                    <Pill className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Prescrever Medicamentos para Casa</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Gera receita oficial com QR Code e envio via WhatsApp para este paciente.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const pacId = showStatusModal.pacienteId;
                    const medId = showStatusModal.medicoId;
                    setShowStatusModal(null);
                    onOpenCreatePrescription(pacId, medId);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-colors shrink-0 cursor-pointer shadow-sm"
                >
                  Prescrever
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(null)}
                  className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-medium transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold shadow-sm transition-colors"
                >
                  Salvar Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
