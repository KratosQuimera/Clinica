import React, { useState, useEffect } from 'react';
import { Shield, Lock, User, AlertTriangle, CheckCircle2, Key, Info, Check } from 'lucide-react';
import { User as AppUser } from '../types';

interface LoginModalProps {
  users: AppUser[];
  onLoginSuccess: (user: AppUser) => void;
  onRecordAudit: (action: string, entity: any, details: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  users,
  onLoginSuccess,
  onRecordAudit,
}) => {
  const [login, setLogin] = useState('admin');
  const [senha, setSenha] = useState('admin123');
  const [errorMessage, setErrorMessage] = useState('');
  const [failedAttempts, setFailedAttempts] = useState<Record<string, number>>({});
  const [lockoutUntil, setLockoutUntil] = useState<Record<string, number>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Monitora contagem regressiva se bloqueado
  useEffect(() => {
    const lockTime = lockoutUntil[login];
    if (lockTime && Date.now() < lockTime) {
      const interval = setInterval(() => {
        const left = Math.max(0, Math.ceil((lockTime - Date.now()) / 1000));
        setRemainingSeconds(left);
        if (left === 0) {
          clearInterval(interval);
          setErrorMessage('');
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setRemainingSeconds(0);
    }
  }, [login, lockoutUntil]);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    // Verifica bloqueio
    const lockTime = lockoutUntil[login];
    if (lockTime && Date.now() < lockTime) {
      const mins = Math.ceil((lockTime - Date.now()) / 60000);
      setErrorMessage(`Conta bloqueada por excesso de tentativas. Tente novamente em ${mins} minuto(s).`);
      return;
    }

    const foundUser = users.find(u => u.login.toLowerCase() === login.trim().toLowerCase());
    if (!foundUser) {
      onRecordAudit('LOGIN_FALHA', 'USUARIOS', `Tentativa de login com usuário inexistente: ${login}`);
      setErrorMessage('Credenciais inválidas. Usuário não encontrado.');
      return;
    }

    if (!foundUser.ativo) {
      setErrorMessage('Conta desativada pelo administrador do sistema.');
      return;
    }

    // Senhas válidas conhecidas
    const senhasValidas: Record<string, string> = {
      'admin': 'admin123',
      'medico.silva': 'medico123',
      'enf.carla': 'enf123',
      'recepcao': 'rec123',
    };

    const senhaCorreta = senhasValidas[foundUser.login] || 'clinica123';
    if (senha !== senhaCorreta) {
      const currentFails = (failedAttempts[login] || 0) + 1;
      setFailedAttempts(prev => ({ ...prev, [login]: currentFails }));

      if (currentFails >= 3) {
        const unlockAt = Date.now() + 15 * 60 * 1000; // 15 minutos
        setLockoutUntil(prev => ({ ...prev, [login]: unlockAt }));
        onRecordAudit('LOGIN_BLOQUEIO', 'USUARIOS', `Conta ${login} bloqueada por 15 minutos após 3 falhas.`);
        setErrorMessage('Conta bloqueada temporariamente por 15 minutos após 3 tentativas inválidas consecutivas.');
      } else {
        onRecordAudit('LOGIN_FALHA', 'USUARIOS', `Senha incorreta para ${login} (tentativa ${currentFails}/3)`);
        setErrorMessage(`Senha incorreta. Tentativa ${currentFails} de 3.`);
      }
      return;
    }

    // Sucesso
    setFailedAttempts(prev => ({ ...prev, [login]: 0 }));
    onRecordAudit('LOGIN_SUCESSO', 'USUARIOS', `Login efetuado com perfil ${foundUser.perfil}`);
    onLoginSuccess(foundUser);
  };

  const handleQuickSelect = (userLogin: string, pass: string) => {
    setLogin(userLogin);
    setSenha(pass);
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-4">
      {/* Diálogo clássico TelaLogin do NetBeans */}
      <div className="bg-slate-900 border-2 border-sky-600 rounded-lg max-w-md w-full shadow-2xl overflow-hidden">
        {/* Title bar do NetBeans */}
        <div className="h-8 bg-sky-900/90 border-b border-sky-700 px-3 flex items-center justify-between text-xs font-bold text-white">
          <span className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-sky-300" />
            ClinEstudo - Tela de Login (NetBeans Swing)
          </span>
          <span className="text-[10px] text-sky-200 font-mono">v2.4.0</span>
        </div>

        <div className="p-6 space-y-5">
          {/* Caixa de destaque da Senha do Administrador */}
          <div className="p-3 bg-sky-950/80 border border-sky-500/40 rounded-lg space-y-1.5">
            <div className="flex items-center gap-1.5 text-sky-300 font-bold text-xs">
              <Key className="w-3.5 h-3.5 text-sky-400" />
              <span>Senha do Administrador:</span>
            </div>
            <div className="flex items-center justify-between font-mono text-xs bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-300">Usuário: <strong className="text-emerald-400">admin</strong></span>
              <span className="text-slate-300">Senha: <strong className="text-emerald-400">admin123</strong></span>
            </div>
          </div>

          {/* Mensagem de Erro */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Contagem regressiva se bloqueado */}
          {remainingSeconds > 0 && (
            <div className="p-2.5 bg-amber-950/70 border border-amber-800 rounded text-amber-300 text-xs text-center font-mono">
              Tempo restante para desbloqueio: {Math.floor(remainingSeconds / 60)}m {remainingSeconds % 60}s
            </div>
          )}

          {/* Formulário de Login */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Usuário:</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={login}
                  onChange={e => setLogin(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded pl-9 pr-3 py-2 text-white placeholder-slate-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Senha:</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="admin123"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded pl-9 pr-3 py-2 text-white placeholder-slate-600 outline-none"
                />
              </div>
            </div>

            {/* Botões Acessar e Sair no estilo clássico do NetBeans */}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={remainingSeconds > 0}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded font-bold text-xs transition-colors cursor-pointer shadow flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Acessar o Sistema</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLogin('admin');
                  setSenha('admin123');
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold text-xs transition-colors cursor-pointer"
              >
                Limpar
              </button>
            </div>
          </form>

          {/* Seletores Rápidos de Perfil */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-[11px] text-slate-400 font-semibold block">
              Preenchimento rápido de credenciais de teste:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickSelect('admin', 'admin123')}
                className="p-2 bg-slate-950 hover:bg-sky-950/40 border border-slate-800 hover:border-sky-500/50 rounded text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-sky-400">Administrador</div>
                <div className="text-[10px] text-slate-400 font-mono">admin / admin123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('medico.silva', 'medico123')}
                className="p-2 bg-slate-950 hover:bg-sky-950/40 border border-slate-800 hover:border-sky-500/50 rounded text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-emerald-400">Médico</div>
                <div className="text-[10px] text-slate-400 font-mono">medico.silva / medico123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('enf.carla', 'enf123')}
                className="p-2 bg-slate-950 hover:bg-sky-950/40 border border-slate-800 hover:border-sky-500/50 rounded text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-purple-400">Enfermeira</div>
                <div className="text-[10px] text-slate-400 font-mono">enf.carla / enf123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('recepcao', 'rec123')}
                className="p-2 bg-slate-950 hover:bg-sky-950/40 border border-slate-800 hover:border-sky-500/50 rounded text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-amber-400">Recepção</div>
                <div className="text-[10px] text-slate-400 font-mono">recepcao / rec123</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
