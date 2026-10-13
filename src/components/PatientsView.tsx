import React, { useState } from 'react';
import { 
  Users, Plus, Search, Edit2, Trash2, CheckCircle2, 
  AlertTriangle, Phone, Calendar, ShieldAlert, Heart, X, FileText,
  MessageCircle, Printer, Pill, ShieldCheck, Stethoscope
} from 'lucide-react';
import { Patient, Appointment, User, Prescription } from '../types';
import { validarCPF, formatarCPF, formatarTelefone } from '../utils/validators';

interface PatientsViewProps {
  patients: Patient[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  currentUser: User;
  onSavePatient: (patient: Omit<Patient, 'id' | 'criadoEm'>, id?: number) => { success: boolean; message: string };
  onDeletePatient: (id: number) => { success: boolean; message: string };
  onOpenCreatePrescription: (patientId: number) => void;
  onOpenViewPrescription: (prescription: Prescription) => void;
  onSendWhatsAppPrescription: (prescription: Prescription) => void;
  onOpenAtendimento?: (patientId: number) => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  patients,
  appointments,
  prescriptions,
  currentUser,
  onSavePatient,
  onDeletePatient,
  onOpenCreatePrescription,
  onOpenViewPrescription,
  onSendWhatsAppPrescription,
  onOpenAtendimento,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterConvenio, setFilterConvenio] = useState('TODOS');
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Form states
  const [formNome, setFormNome] = useState('');
  const [formCpf, setFormCpf] = useState('');
  const [formDataNasc, setFormDataNasc] = useState('');
  const [formSexo, setFormSexo] = useState<'M' | 'F' | 'O'>('F');
  const [formTelefone, setFormTelefone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formEndereco, setFormEndereco] = useState('');
  const [formBairro, setFormBairro] = useState('');
  const [formCidade, setFormCidade] = useState('São Paulo');
  const [formUf, setFormUf] = useState('SP');
  const [formAlergias, setFormAlergias] = useState('');
  const [formConvenio, setFormConvenio] = useState('PARTICULAR');
  const [formAtivo, setFormAtivo] = useState(true);

  // Validação CPF em tempo real
  const cpfLimpo = formCpf.replace(/\D/g, '');
  const isCpfValid = cpfLimpo.length === 11 ? validarCPF(cpfLimpo) : null;

  const conveniosList = Array.from(new Set(patients.map(p => p.convenio || 'PARTICULAR'))).sort();

  const filteredPatients = patients.filter(p => {
    const matchesSearch = 
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cpf.includes(searchTerm) ||
      p.telefone.includes(searchTerm);
    const matchesConv = filterConvenio === 'TODOS' || (p.convenio || 'PARTICULAR') === filterConvenio;
    return matchesSearch && matchesConv;
  });

  const handleOpenCreate = () => {
    setEditingPatient(null);
    setFormNome('');
    setFormCpf('');
    setFormDataNasc('1990-01-01');
    setFormSexo('F');
    setFormTelefone('');
    setFormEmail('');
    setFormEndereco('');
    setFormBairro('');
    setFormCidade('São Paulo');
    setFormUf('SP');
    setFormAlergias('');
    setFormConvenio('Unimed Saúde');
    setFormAtivo(true);
    setShowModal(true);
  };

  const handleOpenEdit = (p: Patient) => {
    setEditingPatient(p);
    setFormNome(p.nome);
    setFormCpf(p.cpf);
    setFormDataNasc(p.dataNascimento);
    setFormSexo(p.sexo);
    setFormTelefone(p.telefone);
    setFormEmail(p.email);
    setFormEndereco(p.endereco);
    setFormBairro(p.bairro);
    setFormCidade(p.cidade);
    setFormUf(p.uf);
    setFormAlergias(p.alergias || '');
    setFormConvenio(p.convenio);
    setFormAtivo(p.ativo);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || formNome.trim().length < 3) {
      setFeedback({ type: 'error', message: 'Nome do paciente é obrigatório e deve ter no mínimo 3 caracteres.' });
      return;
    }
    if (formCpf.trim()) {
      if (!validarCPF(formCpf)) {
        setFeedback({ type: 'error', message: 'CPF inválido matematicamente pelo algoritmo da Receita Federal.' });
        return;
      }
    }

    const payload = {
      nome: formNome.trim(),
      cpf: formatarCPF(formCpf.trim()),
      dataNascimento: formDataNasc,
      sexo: formSexo,
      telefone: formTelefone.trim(),
      email: formEmail.trim(),
      endereco: formEndereco.trim(),
      bairro: formBairro.trim(),
      cidade: formCidade.trim(),
      uf: formUf,
      alergias: formAlergias.trim(),
      convenio: formConvenio.trim(),
      ativo: formAtivo,
    };

    const res = onSavePatient(payload, editingPatient ? editingPatient.id : undefined);
    if (res.success) {
      setShowModal(false);
      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleExecuteDelete = (id: number) => {
    const res = onDeletePatient(id);
    setConfirmDeleteId(null);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const canManage = currentUser.perfil === 'ADMINISTRADOR' || currentUser.perfil === 'RECEPCIONISTA';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-white">Cadastro & Prontuário de Pacientes</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Identificação segura com validação oficial de CPF, alerta de alergias e histórico ambulatorial.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Paciente</span>
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

      {/* Filter and Search */}
      <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Convênio:</label>
          <select
            value={filterConvenio}
            onChange={(e) => setFilterConvenio(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="TODOS">Todos os Convênios</option>
            {conveniosList.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 rounded-lg border border-slate-700/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] font-mono border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Paciente</th>
                <th className="py-3 px-4">CPF</th>
                <th className="py-3 px-4">Telefone / Contato</th>
                <th className="py-3 px-4">Convênio / Plano</th>
                <th className="py-3 px-4">Alergias Clínicas</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Nenhum paciente localizado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-750/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-white flex items-center gap-1.5">
                        <span>{p.nome}</span>
                        {p.alergias && p.alergias.toLowerCase() !== 'nenhuma alergia conhecida' && (
                          <span title={`Alergia: ${p.alergias}`} className="inline-flex">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          </span>
                        )}
                        {prescriptions.filter(pr => pr.pacienteId === p.id).length > 0 && (
                          <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800 px-1.5 py-0.2 rounded font-mono" title="Receitas médicas cadastradas">
                            {prescriptions.filter(pr => pr.pacienteId === p.id).length} rec
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Nasc: {p.dataNascimento} ({p.sexo})
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {p.cpf}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.telefone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      {p.convenio}
                    </td>
                    <td className="py-3 px-4">
                      {p.alergias && p.alergias.toLowerCase() !== 'nenhuma alergia conhecida' ? (
                        <span className="text-amber-400 font-medium">⚠️ {p.alergias}</span>
                      ) : (
                        <span className="text-slate-500">Nenhuma relatada</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {p.ativo ? (
                        <span className="text-emerald-400 font-mono font-medium">● Ativo</span>
                      ) : (
                        <span className="text-rose-400 font-mono">○ Inativo</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {/* Atender Paciente / Prontuário */}
                      {onOpenAtendimento && (
                        <button
                          onClick={() => onOpenAtendimento(p.id)}
                          className="p-1.5 text-sky-400 hover:text-white hover:bg-sky-600/40 rounded transition-colors inline-block"
                          title="Iniciar / Ver Atendimento Médico & Prontuário"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {/* Prescrever / Ver Receita */}
                      <button
                        onClick={() => onOpenCreatePrescription(p.id)}
                        className="p-1.5 text-emerald-400 hover:text-white hover:bg-emerald-600/40 rounded transition-colors inline-block"
                        title="Prescrever Receita / Medicamentos para Casa"
                      >
                        <Pill className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setViewingPatient(p)}
                        className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-700 rounded transition-colors inline-block"
                        title="Ver Ficha Clínica & Histórico de Receitas"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      {canManage && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded transition-colors inline-block"
                            title="Editar Dados"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded transition-colors inline-block"
                            title="Desativar Paciente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-850 border border-slate-700 rounded-lg max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h2 className="text-base font-bold text-white">
                {editingPatient ? 'Editar Cadastro do Paciente' : 'Cadastrar Novo Paciente'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Ana Paula Ferreira"
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Sexo *</label>
                  <select
                    value={formSexo}
                    onChange={(e) => setFormSexo(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="F">Feminino</option>
                    <option value="M">Masculino</option>
                    <option value="O">Outro / Não Declarar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-medium">CPF (validação módulo 11) *</label>
                    {isCpfValid === true && (
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Válido
                      </span>
                    )}
                    {isCpfValid === false && (
                      <span className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Inválido
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={formCpf}
                    onChange={(e) => setFormCpf(formatarCPF(e.target.value))}
                    className={`w-full bg-slate-900 border rounded px-3 py-2 text-white font-mono focus:outline-none ${
                      isCpfValid === false ? 'border-rose-500 focus:border-rose-400' : 'border-slate-700 focus:border-emerald-500'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Data de Nascimento *</label>
                  <input
                    type="date"
                    required
                    value={formDataNasc}
                    onChange={(e) => setFormDataNasc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 98765-4321"
                    value={formTelefone}
                    onChange={(e) => setFormTelefone(formatarTelefone(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="paciente@email.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Endereço Residencial</label>
                  <input
                    type="text"
                    placeholder="Av. Paulista, 1000 - Apto 82"
                    value={formEndereco}
                    onChange={(e) => setFormEndereco(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Bairro</label>
                  <input
                    type="text"
                    placeholder="Bela Vista"
                    value={formBairro}
                    onChange={(e) => setFormBairro(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Convênio / Plano de Saúde</label>
                  <input
                    type="text"
                    placeholder="Unimed, Bradesco, Particular..."
                    value={formConvenio}
                    onChange={(e) => setFormConvenio(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Alergias Medicamentosas / Outras</label>
                  <input
                    type="text"
                    placeholder="Ex: Penicilina, Iodo, Dipirona..."
                    value={formAlergias}
                    onChange={(e) => setFormAlergias(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkAtivoPac"
                  checked={formAtivo}
                  onChange={(e) => setFormAtivo(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                />
                <label htmlFor="chkAtivoPac" className="text-slate-300 text-xs">
                  Paciente ativo no cadastro da clínica
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold shadow-sm transition-colors"
                >
                  {editingPatient ? 'Salvar Alterações' : 'Concluir Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer / Modal Ficha Clínica */}
      {viewingPatient && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-850 border border-slate-700 rounded-lg max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{viewingPatient.nome}</span>
                  {viewingPatient.alergias && (
                    <span className="text-xs bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded">
                      ⚠️ Alergia
                    </span>
                  )}
                </h2>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  CPF: {viewingPatient.cpf} · Nasc: {viewingPatient.dataNascimento} ({viewingPatient.sexo})
                </div>
              </div>
              <button onClick={() => setViewingPatient(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-900 p-3 rounded border border-slate-800 space-y-1">
                <div className="text-slate-400">Contato & Endereço:</div>
                <div className="text-white font-medium">{viewingPatient.telefone} · {viewingPatient.email || 'Sem e-mail'}</div>
                <div className="text-slate-300">{viewingPatient.endereco}, {viewingPatient.bairro} - {viewingPatient.cidade}/{viewingPatient.uf}</div>
              </div>

              <div className="bg-slate-900 p-3 rounded border border-slate-800 space-y-1">
                <div className="text-slate-400">Alergias Registradas:</div>
                <div className="text-amber-300 font-medium">{viewingPatient.alergias || 'Nenhuma alergia conhecida'}</div>
              </div>

              {/* HISTÓRICO DE RECEITAS E PRESCRIÇÕES MÉDICAS GUARDADAS NO CADASTRO DO PACIENTE */}
              <div className="border-t border-slate-700/80 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-white">
                      Receitas & Medicamentos para Casa ({prescriptions.filter(pr => pr.pacienteId === viewingPatient.id).length})
                    </h3>
                  </div>
                  <button
                    onClick={() => onOpenCreatePrescription(viewingPatient.id)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Prescrever Nova Receita</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto">
                  {prescriptions.filter(pr => pr.pacienteId === viewingPatient.id).length === 0 ? (
                    <div className="p-3 bg-slate-900 rounded border border-dashed border-slate-800 text-center space-y-1.5">
                      <div className="text-slate-400 text-xs">Nenhuma receita prescrita para este paciente até o momento.</div>
                      <button
                        onClick={() => onOpenCreatePrescription(viewingPatient.id)}
                        className="text-emerald-400 hover:text-emerald-300 text-xs font-medium underline"
                      >
                        + Prescrever agora a primeira receita médica
                      </button>
                    </div>
                  ) : (
                    prescriptions.filter(pr => pr.pacienteId === viewingPatient.id).map(pr => (
                      <div key={pr.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                {pr.codigoAutenticidade}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {pr.dataEmissao} às {pr.horaEmissao}
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-white mt-1">
                              Prescrito por: {pr.medicoNome} <span className="text-sky-300 text-[11px]">(CRM {pr.medicoCrm}/{pr.medicoUfCrm})</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onSendWhatsAppPrescription(pr)}
                              className="px-2 py-1 bg-emerald-700/40 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded text-[11px] font-semibold border border-emerald-600/40 transition-colors flex items-center gap-1"
                              title="Enviar via WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3 fill-current" />
                              <span>WhatsApp</span>
                            </button>
                            <button
                              onClick={() => onOpenViewPrescription(pr)}
                              className="px-2 py-1 bg-sky-700/40 hover:bg-sky-600 text-sky-300 hover:text-white rounded text-[11px] font-semibold border border-sky-600/40 transition-colors flex items-center gap-1"
                              title="Imprimir Receita com QR Code"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Imprimir / QR</span>
                            </button>
                          </div>
                        </div>

                        {/* Medicamentos prescritos */}
                        <div className="bg-slate-950/80 p-2 rounded border border-slate-850 space-y-1">
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Medicamentos para Casa:
                          </div>
                          {pr.medicamentos.map((m, i) => (
                            <div key={m.id || i} className="text-[11px] text-slate-200 pl-2 border-l border-emerald-600/70">
                              <span className="font-bold text-emerald-300">{m.nome}</span> {m.dosagem && <span>({m.dosagem})</span>} — <span>{m.frequencia}</span>
                              {m.instrucoesCasa && <span className="text-slate-400 italic block text-[10px]">↳ {m.instrucoesCasa}</span>}
                            </div>
                          ))}
                        </div>

                        {pr.orientacoesGerais && (
                          <div className="text-[11px] text-slate-400 italic">
                            Orientações: {pr.orientacoesGerais}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border-t border-slate-700/80 pt-2">
                <h3 className="text-xs font-semibold text-slate-300 mb-2">Histórico de Consultas & Agendamentos</h3>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {appointments.filter(a => a.pacienteId === viewingPatient.id).length === 0 ? (
                    <div className="text-slate-500 text-xs italic">Nenhum agendamento prévio registrado.</div>
                  ) : (
                    appointments.filter(a => a.pacienteId === viewingPatient.id).map(a => (
                      <div key={a.id} className="p-2.5 bg-slate-900/80 rounded border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">{a.dataAgenda} às {a.horario} - {a.medicoNome}</div>
                          <div className="text-[11px] text-slate-400">{a.motivo}</div>
                        </div>
                        <span className="text-[11px] font-mono font-medium text-emerald-400">{a.status}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-700">
              <button
                type="button"
                onClick={() => onOpenCreatePrescription(viewingPatient.id)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Receita para {viewingPatient.nome.split(' ')[0]}</span>
              </button>

              <button
                onClick={() => setViewingPatient(null)}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium cursor-pointer"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-850 border border-slate-700 rounded-lg max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Confirmar Desativação</span>
            </div>
            <p className="text-xs text-slate-300">
              O paciente será desativado logicamente sem exclusão destrutiva para atender aos requisitos de conformidade e prontuário médico.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleExecuteDelete(confirmDeleteId)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
