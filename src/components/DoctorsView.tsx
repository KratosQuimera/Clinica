import React, { useState } from 'react';
import { Stethoscope, Plus, Search, Edit2, Trash2, CheckCircle2, AlertTriangle, Phone, Mail, X } from 'lucide-react';
import { Doctor, User } from '../types';
import { validarCRM, formatarTelefone } from '../utils/validators';

interface DoctorsViewProps {
  doctors: Doctor[];
  currentUser: User;
  onSaveDoctor: (doctor: Omit<Doctor, 'id'>, id?: number) => { success: boolean; message: string };
  onDeleteDoctor: (id: number) => { success: boolean; message: string };
}

export const DoctorsView: React.FC<DoctorsViewProps> = ({
  doctors,
  currentUser,
  onSaveDoctor,
  onDeleteDoctor,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('TODAS');
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Form states
  const [formNome, setFormNome] = useState('');
  const [formCrm, setFormCrm] = useState('');
  const [formUfCrm, setFormUfCrm] = useState('SP');
  const [formEspecialidade, setFormEspecialidade] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAtivo, setFormAtivo] = useState(true);
  const [formHorarioInicio, setFormHorarioInicio] = useState('08:00');
  const [formHorarioFim, setFormHorarioFim] = useState('17:00');

  const specialtiesList = Array.from(new Set(doctors.map(d => d.especialidade))).sort();

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = 
      doc.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.crm.includes(searchTerm) ||
      doc.especialidade.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpec = filterSpecialty === 'TODAS' || doc.especialidade === filterSpecialty;
    return matchesSearch && matchesSpec;
  });

  const handleOpenCreate = () => {
    setEditingDoctor(null);
    setFormNome('');
    setFormCrm('');
    setFormUfCrm('SP');
    setFormEspecialidade('Cardiologia');
    setFormTelefone('');
    setFormEmail('');
    setFormAtivo(true);
    setFormHorarioInicio('08:00');
    setFormHorarioFim('17:00');
    setShowModal(true);
  };

  const handleOpenEdit = (doc: Doctor) => {
    setEditingDoctor(doc);
    setFormNome(doc.nome);
    setFormCrm(doc.crm);
    setFormUfCrm(doc.uf_crm);
    setFormEspecialidade(doc.especialidade);
    setFormTelefone(doc.telefone);
    setFormEmail(doc.email);
    setFormAtivo(doc.ativo);
    setFormHorarioInicio(doc.horarioInicio || '08:00');
    setFormHorarioFim(doc.horarioFim || '17:00');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || formNome.trim().length < 3) {
      setFeedback({ type: 'error', message: 'O nome completo do médico deve conter ao menos 3 caracteres.' });
      return;
    }
    const checkCrm = validarCRM(formCrm);
    if (!checkCrm.valido) {
      setFeedback({ type: 'error', message: checkCrm.mensagem });
      return;
    }

    const payload = {
      nome: formNome.trim(),
      crm: formCrm.trim(),
      uf_crm: formUfCrm,
      especialidade: formEspecialidade.trim(),
      telefone: formTelefone.trim(),
      email: formEmail.trim(),
      ativo: formAtivo,
      horarioInicio: formHorarioInicio,
      horarioFim: formHorarioFim,
    };

    const result = onSaveDoctor(payload, editingDoctor ? editingDoctor.id : undefined);
    if (result.success) {
      setShowModal(false);
      setFeedback({ type: 'success', message: result.message });
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback({ type: 'error', message: result.message });
    }
  };

  const handleExecuteDelete = (id: number) => {
    const res = onDeleteDoctor(id);
    setConfirmDeleteId(null);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const canManage = currentUser.perfil === 'ADMINISTRADOR';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-white">Corpo Clínico & Médicos</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastro, credenciamento, especialidades, horários de atendimento e validação de CRM.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Médico</span>
          </button>
        )}
      </div>

      {/* Feedback banner */}
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

      {/* Filter and Search Bar */}
      <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, CRM ou especialidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Especialidade:</label>
          <select
            value={filterSpecialty}
            onChange={(e) => setFilterSpecialty(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="TODAS">Todas as Especialidades</option>
            {specialtiesList.map(s => (
              <option key={s} value={s}>{s}</option>
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
                <th className="py-3 px-4">Nome do Profissional</th>
                <th className="py-3 px-4">CRM / UF</th>
                <th className="py-3 px-4">Especialidade</th>
                <th className="py-3 px-4">Contato</th>
                <th className="py-3 px-4">Horário de Plantão</th>
                <th className="py-3 px-4">Status</th>
                {canManage && <th className="py-3 px-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Nenhum médico encontrado para os critérios de busca informados.
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-750/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{doc.nome}</div>
                      <div className="text-[11px] text-slate-400">{doc.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="text-emerald-400 font-semibold">{doc.crm}</span>
                      <span className="text-slate-500">/{doc.uf_crm}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      {doc.especialidade}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{doc.telefone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {doc.horarioInicio || '08:00'} às {doc.horarioFim || '17:00'}
                    </td>
                    <td className="py-3 px-4">
                      {doc.ativo ? (
                        <span className="text-emerald-400 font-mono font-medium">● Ativo</span>
                      ) : (
                        <span className="text-rose-400 font-mono">○ Inativo</span>
                      )}
                    </td>
                    {canManage && (
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(doc)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded transition-colors"
                          title="Editar Médico"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded transition-colors"
                          title="Desativar Médico"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
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
          <div className="bg-slate-850 border border-slate-700 rounded-lg max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h2 className="text-base font-bold text-white">
                {editingDoctor ? 'Editar Médico' : 'Cadastrar Novo Médico'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dr. Roberto Silva"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">CRM (somente números) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 123456"
                    value={formCrm}
                    onChange={(e) => setFormCrm(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">UF CRM *</label>
                  <select
                    value={formUfCrm}
                    onChange={(e) => setFormUfCrm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE', 'DF', 'GO'].map(uf => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Especialidade Principal *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cardiologia, Pediatria, Ortopedia..."
                  value={formEspecialidade}
                  onChange={(e) => setFormEspecialidade(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
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
                  <label className="block text-slate-300 font-medium mb-1">E-mail Profissional</label>
                  <input
                    type="email"
                    placeholder="medico@clinestudo.com.br"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Início do Plantão</label>
                  <input
                    type="time"
                    value={formHorarioInicio}
                    onChange={(e) => setFormHorarioInicio(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Término do Plantão</label>
                  <input
                    type="time"
                    value={formHorarioFim}
                    onChange={(e) => setFormHorarioFim(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkAtivo"
                  checked={formAtivo}
                  onChange={(e) => setFormAtivo(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                />
                <label htmlFor="chkAtivo" className="text-slate-300 text-xs">
                  Profissional ativo e apto para receber agendamentos de consultas
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
                  {editingDoctor ? 'Salvar Alterações' : 'Cadastrar Médico'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Exclusão Controlada */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-850 border border-slate-700 rounded-lg max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Confirmar Desativação</span>
            </div>
            <p className="text-xs text-slate-300">
              O médico será desativado logicamente (soft-delete). O histórico clínico e as consultas passadas serão integralmente preservados para auditoria LGPD.
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
                Confirmar Desativação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
