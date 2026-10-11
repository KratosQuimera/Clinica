import React, { useState } from 'react';
import { Activity, Plus, Search, Edit2, Trash2, CheckCircle2, AlertTriangle, Phone, X } from 'lucide-react';
import { Nurse, User } from '../types';
import { validarCOREN, formatarTelefone } from '../utils/validators';

interface NursesViewProps {
  nurses: Nurse[];
  currentUser: User;
  onSaveNurse: (nurse: Omit<Nurse, 'id'>, id?: number) => { success: boolean; message: string };
  onDeleteNurse: (id: number) => { success: boolean; message: string };
}

export const NursesView: React.FC<NursesViewProps> = ({
  nurses,
  currentUser,
  onSaveNurse,
  onDeleteNurse,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSetor, setFilterSetor] = useState('TODOS');
  const [showModal, setShowModal] = useState(false);
  const [editingNurse, setEditingNurse] = useState<Nurse | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Form states
  const [formNome, setFormNome] = useState('');
  const [formCoren, setFormCoren] = useState('');
  const [formUfCoren, setFormUfCoren] = useState('SP');
  const [formSetor, setFormSetor] = useState('Triagem e Acolhimento');
  const [formTurno, setFormTurno] = useState<Nurse['turno']>('MANHÃ');
  const [formTelefone, setFormTelefone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAtivo, setFormAtivo] = useState(true);

  const setoresList = [
    'Triagem e Acolhimento',
    'Ambulatório e Curativos',
    'Urgência e Emergência',
    'Centro Cirúrgico',
    'UTI Adulto',
    'Pediatria e Vacinação',
  ];

  const filteredNurses = nurses.filter(n => {
    const matchesSearch = 
      n.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.coren.includes(searchTerm) ||
      n.setor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSetor = filterSetor === 'TODOS' || n.setor === filterSetor;
    return matchesSearch && matchesSetor;
  });

  const handleOpenCreate = () => {
    setEditingNurse(null);
    setFormNome('');
    setFormCoren('');
    setFormUfCoren('SP');
    setFormSetor('Triagem e Acolhimento');
    setFormTurno('MANHÃ');
    setFormTelefone('');
    setFormEmail('');
    setFormAtivo(true);
    setShowModal(true);
  };

  const handleOpenEdit = (nurse: Nurse) => {
    setEditingNurse(nurse);
    setFormNome(nurse.nome);
    setFormCoren(nurse.coren);
    setFormUfCoren(nurse.uf_coren);
    setFormSetor(nurse.setor);
    setFormTurno(nurse.turno);
    setFormTelefone(nurse.telefone);
    setFormEmail(nurse.email);
    setFormAtivo(nurse.ativo);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || formNome.trim().length < 3) {
      setFeedback({ type: 'error', message: 'O nome do profissional de enfermagem deve ter ao menos 3 caracteres.' });
      return;
    }
    const checkCoren = validarCOREN(formCoren);
    if (!checkCoren.valido) {
      setFeedback({ type: 'error', message: checkCoren.mensagem });
      return;
    }

    const payload = {
      nome: formNome.trim(),
      coren: formCoren.trim(),
      uf_coren: formUfCoren,
      setor: formSetor,
      turno: formTurno,
      telefone: formTelefone.trim(),
      email: formEmail.trim(),
      ativo: formAtivo,
    };

    const res = onSaveNurse(payload, editingNurse ? editingNurse.id : undefined);
    if (res.success) {
      setShowModal(false);
      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleExecuteDelete = (id: number) => {
    const res = onDeleteNurse(id);
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-white">Equipe de Enfermagem</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastro, credenciamento COREN, setor de atuação clínica e escala de turnos.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Enfermeiro</span>
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
            placeholder="Buscar por nome, COREN ou setor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Setor:</label>
          <select
            value={filterSetor}
            onChange={(e) => setFilterSetor(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="TODOS">Todos os Setores</option>
            {setoresList.map(s => (
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
                <th className="py-3 px-4">Profissional</th>
                <th className="py-3 px-4">COREN / UF</th>
                <th className="py-3 px-4">Setor Hospitalar</th>
                <th className="py-3 px-4">Turno</th>
                <th className="py-3 px-4">Contato</th>
                <th className="py-3 px-4">Status</th>
                {canManage && <th className="py-3 px-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredNurses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Nenhum profissional de enfermagem encontrado.
                  </td>
                </tr>
              ) : (
                filteredNurses.map((nurse) => (
                  <tr key={nurse.id} className="hover:bg-slate-750/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{nurse.nome}</div>
                      <div className="text-[11px] text-slate-400">{nurse.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="text-purple-400 font-semibold">{nurse.coren}</span>
                      <span className="text-slate-500">/{nurse.uf_coren}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      {nurse.setor}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {nurse.turno}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{nurse.telefone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {nurse.ativo ? (
                        <span className="text-emerald-400 font-mono font-medium">● Ativo</span>
                      ) : (
                        <span className="text-rose-400 font-mono">○ Inativo</span>
                      )}
                    </td>
                    {canManage && (
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(nurse)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(nurse.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded transition-colors"
                          title="Desativar"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-850 border border-slate-700 rounded-lg max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h2 className="text-base font-bold text-white">
                {editingNurse ? 'Editar Enfermeiro' : 'Cadastrar Profissional de Enfermagem'}
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
                  placeholder="Ex: Carla Santos"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">COREN (números) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 456789"
                    value={formCoren}
                    onChange={(e) => setFormCoren(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">UF *</label>
                  <select
                    value={formUfCoren}
                    onChange={(e) => setFormUfCoren(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE', 'DF', 'GO'].map(uf => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Setor Clínico *</label>
                  <select
                    value={formSetor}
                    onChange={(e) => setFormSetor(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {setoresList.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Turno de Trabalho *</label>
                  <select
                    value={formTurno}
                    onChange={(e) => setFormTurno(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="MANHÃ">Manhã (07h às 13h)</option>
                    <option value="TARDE">Tarde (13h às 19h)</option>
                    <option value="NOITE">Noite (19h às 07h)</option>
                    <option value="12X36 DIURNO">12x36 Diurno</option>
                    <option value="12X36 NOTURNO">12x36 Noturno</option>
                    <option value="INTEGRAL">Integral Comercial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Telefone *</label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 95432-1098"
                    value={formTelefone}
                    onChange={(e) => setFormTelefone(formatarTelefone(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="enfermagem@clinestudo.com.br"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkAtivoEnf"
                  checked={formAtivo}
                  onChange={(e) => setFormAtivo(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                />
                <label htmlFor="chkAtivoEnf" className="text-slate-300 text-xs">
                  Profissional ativo em plantão
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
                  {editingNurse ? 'Salvar Alterações' : 'Cadastrar Enfermeiro'}
                </button>
              </div>
            </form>
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
              O profissional será desativado logicamente sem exclusão destrutiva para atender aos requisitos de conformidade e auditoria.
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
