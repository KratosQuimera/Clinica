import React, { useState } from 'react';
import { ShieldCheck, Search, Filter, ShieldAlert, Lock, User, Terminal } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditViewProps {
  logs: AuditLog[];
}

export const AuditView: React.FC<AuditViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('TODAS');

  const actionList = Array.from(new Set(logs.map(l => l.acao))).sort();

  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      l.loginUsuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.detalhes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.entidade.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === 'TODAS' || l.acao === filterAction;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-white">Trilha de Auditoria & Conformidade LGPD</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro imutável de operações clínicas e administrativas com omissão estrita de credenciais.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-emerald-950/60 border border-emerald-800 text-emerald-300 px-3 py-1.5 rounded">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Políticas de Privacidade Ativas: Sem exposição de senhas</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por usuário, ação ou detalhe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-400">Tipo de Ação:</label>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="TODAS">Todas as Ações</option>
            {actionList.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-800/60 rounded-lg border border-slate-700/60 overflow-hidden font-mono text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC/BR)</th>
                <th className="py-3 px-4">Operador</th>
                <th className="py-3 px-4">Evento / Ação</th>
                <th className="py-3 px-4">Entidade Afetada</th>
                <th className="py-3 px-4">Origem IP</th>
                <th className="py-3 px-4">Detalhes da Transação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                    Nenhum evento registrado com os parâmetros informados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isFail = log.acao.includes('FALHA') || log.acao.includes('BLOQUEIO');
                  const isSuccess = log.acao.includes('SUCESSO') || log.acao.includes('CRIAR');

                  return (
                    <tr key={log.id} className="hover:bg-slate-750/50 transition-colors">
                      <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                        {new Date(log.criadoEm).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-emerald-400">
                        {log.loginUsuario}
                      </td>
                      <td className="py-2.5 px-4 font-bold">
                        <span className={
                          isFail ? 'text-rose-400' :
                          isSuccess ? 'text-emerald-300' : 'text-sky-300'
                        }>
                          {log.acao}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-300">
                        {log.entidade}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                        {log.ipOrigem}
                      </td>
                      <td className="py-2.5 px-4 text-slate-300 font-sans text-xs">
                        {log.detalhes}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
