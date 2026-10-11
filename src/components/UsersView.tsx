import React, { useState } from 'react';
import { 
  Shield, Plus, Lock, Unlock, Key, CheckCircle2, 
  AlertTriangle, X, ShieldCheck, UserCheck, UserX
} from 'lucide-react';
import { User, UserRole } from '../types';

interface UsersViewProps {
  users: User[];
  currentUser: User;
  onSaveUser: (user: Omit<User, 'id' | 'criadoEm'>, id?: number) => { success: boolean; message: string };
  onToggleUserStatus: (id: number) => { success: boolean; message: string };
  onResetLockout: (id: number) => { success: boolean; message: string };
  onResetPassword: (id: number, novaSenha: string) => { success: boolean; message: string };
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  currentUser,
  onSaveUser,
  onToggleUserStatus,
  onResetLockout,
  onResetPassword,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordModalUser, setPasswordModalUser] = useState<User | null>(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [formNome, setFormNome] = useState('');
  const [formLogin, setFormLogin] = useState('');
  const [formPerfil, setFormPerfil] = useState<UserRole>('RECEPCIONISTA');
  const [formAtivo, setFormAtivo] = useState(true);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormNome('');
    setFormLogin('');
    setFormPerfil('RECEPCIONISTA');
    setFormAtivo(true);
    setShowModal(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormNome(u.nome);
    setFormLogin(u.login);
    setFormPerfil(u.perfil);
    setFormAtivo(u.ativo);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || !formLogin.trim()) {
      setFeedback({ type: 'error', message: 'Nome e login são obrigatórios.' });
      return;
    }

    const payload = {
      nome: formNome.trim(),
      login: formLogin.trim().toLowerCase(),
      perfil: formPerfil,
      ativo: formAtivo,
      tentativasFalhas: editingUser ? editingUser.tentativasFalhas : 0,
      bloqueadoAte: editingUser ? editingUser.bloqueadoAte : null,
    };

    const res = onSaveUser(payload, editingUser ? editingUser.id : undefined);
    if (res.success) {
      setShowModal(false);
      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleExecutePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;
    if (novaSenha.length < 6) {
      setFeedback({ type: 'error', message: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }
    const res = onResetPassword(passwordModalUser.id, novaSenha);
    setPasswordModalUser(null);
    setNovaSenha('');
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-white">Gestão de Usuários & Perfis (RBAC)</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Controle de acesso baseado em papéis, desbloqueio de contas, redefinição de senhas e auditoria de tentativas.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Usuário</span>
        </button>
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

      {/* Users table */}
      <div className="bg-slate-800/60 rounded-lg border border-slate-700/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] font-mono border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Nome do Operador</th>
                <th className="py-3 px-4">Login de Acesso</th>
                <th className="py-3 px-4">Perfil / Papel</th>
                <th className="py-3 px-4">Segurança / Bloqueio</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações Administrativas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {users.map((u) => {
                const isBloqueado = u.tentativasFalhas >= 3 || !!u.bloqueadoAte;
                return (
                  <tr key={u.id} className="hover:bg-slate-750/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{u.nome}</div>
                      <div className="text-[11px] text-slate-400">Criado em: {new Date(u.criadoEm).toLocaleDateString()}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                      {u.login}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-200">{u.perfil}</span>
                    </td>
                    <td className="py-3 px-4">
                      {isBloqueado ? (
                        <div className="flex items-center gap-1.5 text-rose-400">
                          <Lock className="w-3.5 h-3.5" />
                          <span className="font-semibold text-xs">Bloqueado ({u.tentativasFalhas} falhas)</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">Tentativas: {u.tentativasFalhas}/3</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {u.ativo ? (
                        <span className="text-emerald-400 font-mono font-medium">● Ativo</span>
                      ) : (
                        <span className="text-rose-400 font-mono">○ Inativo</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {isBloqueado && (
                        <button
                          onClick={() => {
                            const res = onResetLockout(u.id);
                            setFeedback(res.success ? { type: 'success', message: res.message } : { type: 'error', message: res.message });
                          }}
                          className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-medium transition-colors"
                          title="Desbloquear Conta"
                        >
                          Desbloquear
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setPasswordModalUser(u);
                          setNovaSenha('');
                        }}
                        className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-700 rounded transition-colors"
                        title="Redefinir Senha"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          const res = onToggleUserStatus(u.id);
                          setFeedback(res.success ? { type: 'success', message: res.message } : { type: 'error', message: res.message });
                        }}
                        className={`p-1.5 rounded transition-colors ${
                          u.ativo 
                            ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-700' 
                            : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-700'
                        }`}
                        title={u.ativo ? 'Desativar Usuário' : 'Ativar Usuário'}
                      >
                        {u.ativo ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RBAC Matrix Card */}
      <div className="bg-slate-800/60 p-5 rounded-lg border border-slate-700/60 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Matriz de Permissões por Função (RBAC)</h2>
        </div>
        <p className="text-xs text-slate-400">
          As permissões são validadas de ponta a ponta no backend antes de qualquer mutação ou consulta de dados.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-1">
            <div className="font-semibold text-emerald-400 font-mono">ADMINISTRADOR</div>
            <ul className="text-slate-300 space-y-0.5 text-[11px]">
              <li>✓ Gestão de usuários e senhas</li>
              <li>✓ Cadastro e exclusão de médicos</li>
              <li>✓ Cadastro de enfermeiros</li>
              <li>✓ Auditoria e relatórios completos</li>
              <li>✓ Configurações do sistema</li>
            </ul>
          </div>

          <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-1">
            <div className="font-semibold text-teal-400 font-mono">MÉDICO</div>
            <ul className="text-slate-300 space-y-0.5 text-[11px]">
              <li>✓ Prontuário de pacientes</li>
              <li>✓ Sua própria agenda de consultas</li>
              <li>✓ Conclusão com anotação clínica</li>
              <li>✗ Não cria outros médicos</li>
              <li>✗ Não altera usuários</li>
            </ul>
          </div>

          <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-1">
            <div className="font-semibold text-purple-400 font-mono">ENFERMEIRO</div>
            <ul className="text-slate-300 space-y-0.5 text-[11px]">
              <li>✓ Visualização da lista de pacientes</li>
              <li>✓ Alerta de alergias & triagem</li>
              <li>✓ Visualização da agenda geral</li>
              <li>✗ Não altera status final de consulta</li>
              <li>✗ Não altera cadastros médicos</li>
            </ul>
          </div>

          <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-1">
            <div className="font-semibold text-sky-400 font-mono">RECEPCIONISTA</div>
            <ul className="text-slate-300 space-y-0.5 text-[11px]">
              <li>✓ Cadastro completo de pacientes</li>
              <li>✓ Agendamento e confirmação</li>
              <li>✓ Cancelamento com justificativa</li>
              <li>✓ Consulta de horários livres</li>
              <li>✗ Não acessa logs de auditoria</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal Criar / Editar Usuário */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-850 border border-slate-700 rounded-lg max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h2 className="text-base font-bold text-white">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário do Sistema'}
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
                  placeholder="Ex: João da Silva"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Login de Acesso *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: joao.silva"
                  value={formLogin}
                  onChange={(e) => setFormLogin(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Perfil de Acesso (RBAC) *</label>
                <select
                  value={formPerfil}
                  onChange={(e) => setFormPerfil(e.target.value as UserRole)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ADMINISTRADOR">Administrador Geral</option>
                  <option value="MEDICO">Médico</option>
                  <option value="ENFERMEIRO">Enfermeiro</option>
                  <option value="RECEPCIONISTA">Recepcionista</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkAtivoUser"
                  checked={formAtivo}
                  onChange={(e) => setFormAtivo(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                />
                <label htmlFor="chkAtivoUser" className="text-slate-300 text-xs">
                  Conta de usuário ativa e autorizada para login
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
                  Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Redefinição de Senha Administrada */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-850 border border-slate-700 rounded-lg max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <span>Redefinir Senha</span>
              </h2>
              <button onClick={() => setPasswordModalUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecutePasswordReset} className="space-y-4 text-xs">
              <p className="text-slate-300">
                Defina uma nova senha segura para o operador <strong>{passwordModalUser.login}</strong>. Ela será armazenada com hash PBKDF2 e novo salt individual.
              </p>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Nova Senha (mínimo 6 caracteres) *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold shadow-sm transition-colors"
                >
                  Gravar Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
