import React, { useState, useEffect } from 'react';
import { Shield, Lock, User, AlertTriangle, CheckCircle2, Key, Info } from 'lucide-react';
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
      setErrorMessage('Credenciais inválidas. Usuário ou senha incorretos.');
      return;
    }

    if (!foundUser.ativo) {
      setErrorMessage('Conta desativada pelo administrador do sistema.');
      return;
    }

    // Senhas esperadas de demonstração
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
        onRecordAudit('LOGIN_BLOQUEIO', 'USUARIOS', `Conta ${login} bloqueada por 15 minutos após 3 falhas consecutivas.`);
        setErrorMessage('Conta bloqueada temporariamente por 15 minutos após 3 tentativas inválidas consecutivas.');
      } else {
        onRecordAudit('LOGIN_FALHA', 'USUARIOS', `Senha incorreta para ${login} (tentativa ${currentFails}/3)`);
        setErrorMessage(`Credenciais inválidas. Tentativa ${currentFails} de 3.`);
      }
      return;
    }

    // Sucesso
    setFailedAttempts(prev => ({ ...prev, [login]: 0 }));
    onRecordAudit('LOGIN_SUCESSO', 'USUARIOS', `Login efetuado com perfil ${foundUser.perfil}`);
    onLoginSuccess(foundUser);
  };

  const handleQuickSelect = (userLogin: string, defaultPass: string) => {
    setLogin(userLogin);
    setSenha(defaultPass);
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl max-w-md w-full p-8 shadow-2xl space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-1">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ClinEstudo Desktop</h1>
          <p className="text-xs text-slate-400">
            Sistema Integrado de Gestão Médica & Atendimento Ambulatorial
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-lg text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Countdown notice if locked */}
        {remainingSeconds > 0 && (
          <div className="p-3 bg-amber-950/60 border border-amber-800 rounded-lg text-amber-300 text-xs text-center font-mono">
            Tempo restante para liberação: {Math.floor(remainingSeconds / 60)}m {remainingSeconds % 60}s
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Usuário do Sistema</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="ex: admin ou medico.silva"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Senha de Acesso</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={remainingSeconds > 0}
            className={`w-full py-2.5 rounded-lg text-xs font-semibold shadow-md transition-colors ${
              remainingSeconds > 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
            }`}
          >
            Acessar Sistema
          </button>
        </form>

        {/* Quick Role Tester Bar */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-emerald-400" />
            <span>Acesso Rápido para Teste de Perfis (RBAC):</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickSelect('admin', 'admin123')}
              className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded text-left transition-colors cursor-pointer"
            >
              <div className="font-semibold text-emerald-400 text-[11px]">admin</div>
              <div className="text-[10px] text-slate-400">Administrador Geral</div>
            </button>
            <button
              onClick={() => handleQuickSelect('medico.silva', 'medico123')}
              className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded text-left transition-colors cursor-pointer"
            >
              <div className="font-semibold text-teal-400 text-[11px]">medico.silva</div>
              <div className="text-[10px] text-slate-400">Dr. Roberto (Cardio)</div>
            </button>
            <button
              onClick={() => handleQuickSelect('enf.carla', 'enf123')}
              className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded text-left transition-colors cursor-pointer"
            >
              <div className="font-semibold text-purple-400 text-[11px]">enf.carla</div>
              <div className="text-[10px] text-slate-400">Enfª Carla (Triagem)</div>
            </button>
            <button
              onClick={() => handleQuickSelect('recepcao', 'rec123')}
              className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded text-left transition-colors cursor-pointer"
            >
              <div className="font-semibold text-sky-400 text-[11px]">recepcao</div>
              <div className="text-[10px] text-slate-400">Mariana (Recepção)</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
