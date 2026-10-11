import React, { useState } from 'react';
import { 
  FileText, Download, Printer, Filter, Calendar, 
  BarChart3, CheckCircle2, AlertTriangle, Users, Stethoscope
} from 'lucide-react';
import { Appointment, Doctor, Nurse, Patient } from '../types';

interface ReportsViewProps {
  appointments: Appointment[];
  doctors: Doctor[];
  patients: Patient[];
  nurses: Nurse[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  appointments,
  doctors,
  patients,
  nurses,
}) => {
  const [dataInicio, setDataInicio] = useState('2026-10-01');
  const [dataFim, setDataFim] = useState('2026-10-31');
  const [medicoId, setMedicoId] = useState('TODOS');
  const [statusFiltro, setStatusFiltro] = useState('TODOS');

  const filteredAppointments = appointments.filter(a => {
    const matchesInicio = !dataInicio || a.dataAgenda >= dataInicio;
    const matchesFim = !dataFim || a.dataAgenda <= dataFim;
    const matchesMedico = medicoId === 'TODOS' || a.medicoId.toString() === medicoId;
    const matchesStatus = statusFiltro === 'TODOS' || a.status === statusFiltro;
    return matchesInicio && matchesFim && matchesMedico && matchesStatus;
  });

  const total = filteredAppointments.length;
  const concluidos = filteredAppointments.filter(a => a.status === 'CONCLUIDO').length;
  const cancelados = filteredAppointments.filter(a => a.status === 'CANCELADO').length;
  const faltas = filteredAppointments.filter(a => a.status === 'FALTOU').length;
  const emAndamento = filteredAppointments.filter(a => a.status === 'EM_ATENDIMENTO').length;

  const taxaConclusao = total > 0 ? Math.round((concluidos / total) * 100) : 0;
  const taxaCancelamento = total > 0 ? Math.round((cancelados / total) * 100) : 0;

  const handleExportCSV = () => {
    const headers = ['ID', 'Data', 'Horário', 'Paciente', 'CPF', 'Médico', 'Especialidade', 'Status', 'Motivo', 'Observações'];
    const rows = filteredAppointments.map(a => [
      a.id,
      a.dataAgenda,
      a.horario,
      `"${a.pacienteNome || ''}"`,
      `"${a.pacienteCpf || ''}"`,
      `"${a.medicoNome || ''}"`,
      `"${a.medicoEspecialidade || ''}"`,
      a.status,
      `"${(a.motivo || '').replace(/"/g, '""')}"`,
      `"${(a.observacoes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_clinestudo_${dataInicio}_${dataFim}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header (No print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-white">Relatórios Clínicos & Exportação</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Geração de relatórios gerenciais, absenteísmo, produtividade médica e exportação oficial CSV e impressão.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 rounded text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* Filter bar (No print) */}
      <div className="no-print bg-slate-800/80 p-4 rounded-lg border border-slate-700/80 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-slate-400 mb-1">Data Inicial:</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Data Final:</label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Médico:</label>
          <select
            value={medicoId}
            onChange={(e) => setMedicoId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="TODOS">Todos os Médicos</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id.toString()}>{d.nome} ({d.especialidade})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Status:</label>
          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="CONCLUIDO">Concluído</option>
            <option value="EM_ATENDIMENTO">Em Atendimento</option>
            <option value="CONFIRMADO">Confirmado</option>
            <option value="AGENDADO">Agendado</option>
            <option value="CANCELADO">Cancelado</option>
            <option value="FALTOU">Faltou</option>
          </select>
        </div>
      </div>

      {/* KPI Cards (No print) */}
      <div className="no-print grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/60">
          <div className="text-xs text-slate-400">Total Filtrado</div>
          <div className="text-2xl font-bold text-white mt-1">{total}</div>
          <div className="text-[11px] text-slate-400 mt-1">Consultas no período</div>
        </div>
        <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/60">
          <div className="text-xs text-slate-400">Taxa de Conclusão</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{taxaConclusao}%</div>
          <div className="text-[11px] text-slate-400 mt-1">{concluidos} atendimentos finalizados</div>
        </div>
        <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/60">
          <div className="text-xs text-slate-400">Cancelamentos</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{cancelados} ({taxaCancelamento}%)</div>
          <div className="text-[11px] text-slate-400 mt-1">Desmarcações registradas</div>
        </div>
        <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/60">
          <div className="text-xs text-slate-400">Faltas / Não Comparecimento</div>
          <div className="text-2xl font-bold text-orange-400 mt-1">{faltas}</div>
          <div className="text-[11px] text-slate-400 mt-1">Absenteísmo de pacientes</div>
        </div>
      </div>

      {/* Printable Report Sheet */}
      <div className="bg-slate-800/60 print:bg-white print:text-black rounded-lg border border-slate-700/60 print:border-none overflow-hidden p-6 space-y-4">
        {/* Printable Letterhead */}
        <div className="border-b border-slate-700 print:border-black pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-white print:text-black">CLINESTUDO - GESTÃO CLÍNICA INTEGRADA</h2>
            <p className="text-xs text-slate-400 print:text-gray-600">
              Relatório de Atendimentos Ambulatoriais e Produtividade Médica
            </p>
          </div>
          <div className="text-right text-xs font-mono text-slate-400 print:text-gray-700">
            <div>Período: {dataInicio} até {dataFim}</div>
            <div>Emissão: 10/10/2026</div>
          </div>
        </div>

        {/* Printable Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 print:text-black">
            <thead className="bg-slate-900/90 print:bg-gray-100 text-slate-400 print:text-black uppercase text-[11px] font-mono border-b border-slate-700 print:border-gray-400">
              <tr>
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-3">Horário</th>
                <th className="py-2.5 px-3">Paciente</th>
                <th className="py-2.5 px-3">CPF</th>
                <th className="py-2.5 px-3">Médico / Especialidade</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 print:divide-gray-300">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 print:text-gray-500">
                    Nenhum registro encontrado para este filtro.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-750/50 print:hover:bg-transparent">
                    <td className="py-2.5 px-3 font-mono">{a.dataAgenda}</td>
                    <td className="py-2.5 px-3 font-mono font-medium">{a.horario}</td>
                    <td className="py-2.5 px-3 font-medium text-white print:text-black">{a.pacienteNome}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 print:text-gray-700">{a.pacienteCpf}</td>
                    <td className="py-2.5 px-3">
                      <div>{a.medicoNome}</div>
                      <div className="text-[10px] text-slate-400 print:text-gray-600">{a.medicoEspecialidade}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold">
                      <span className={
                        a.status === 'CONCLUIDO' ? 'text-emerald-400 print:text-green-700' :
                        a.status === 'CANCELADO' ? 'text-rose-400 print:text-red-700' :
                        'text-slate-300 print:text-gray-800'
                      }>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 print:text-gray-800 max-w-xs truncate">
                      {a.motivo}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Printable Footer */}
        <div className="pt-4 border-t border-slate-700 print:border-black text-[11px] text-slate-500 print:text-gray-600 flex justify-between">
          <div>Documento gerado automaticamente pelo ClinEstudo Desktop Suite.</div>
          <div>Total de registros: {filteredAppointments.length}</div>
        </div>
      </div>
    </div>
  );
};
