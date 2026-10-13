import React, { useState } from 'react';
import { 
  FileText, Plus, Search, Filter, Printer, MessageCircle, 
  Calendar, User, Stethoscope, CheckCircle2, ShieldCheck, 
  Clock, Pill, Eye, Download, Copy, Check
} from 'lucide-react';
import { Prescription, Patient, Doctor, User as AppUser } from '../types';

interface PrescriptionsViewProps {
  prescriptions: Prescription[];
  patients: Patient[];
  doctors: Doctor[];
  currentUser: AppUser;
  onOpenCreatePrescription: (patientId?: number, doctorId?: number) => void;
  onOpenViewPrescription: (prescription: Prescription) => void;
  onSendWhatsApp: (prescription: Prescription) => void;
}

export const PrescriptionsView: React.FC<PrescriptionsViewProps> = ({
  prescriptions,
  patients,
  doctors,
  currentUser,
  onOpenCreatePrescription,
  onOpenViewPrescription,
  onSendWhatsApp,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDoctorId, setFilterDoctorId] = useState<string>('TODOS');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const filteredPrescriptions = prescriptions.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      p.pacienteNome.toLowerCase().includes(term) ||
      p.medicoNome.toLowerCase().includes(term) ||
      p.codigoAutenticidade.toLowerCase().includes(term) ||
      p.medicamentos.some(m => m.nome.toLowerCase().includes(term) || m.dosagem.toLowerCase().includes(term));

    const matchesDoc = filterDoctorId === 'TODOS' || p.medicoId.toString() === filterDoctorId;
    return matchesSearch && matchesDoc;
  });

  const totalMedicamentosPrescritos = prescriptions.reduce((acc, p) => acc + p.medicamentos.length, 0);

  const handleCopyCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            <span>Receituário & Prescrições Médicas Digitais</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Prescrição oficial de medicamentos para casa com QR Code, envio para WhatsApp e arquivamento permanente no cadastro do paciente
          </p>
        </div>

        {currentUser.perfil === 'ADMINISTRADOR' || currentUser.perfil === 'MEDICO' ? (
          <button
            onClick={() => onOpenCreatePrescription()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-950 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Prescrição Médica</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-700 text-slate-400 rounded-lg text-xs font-medium cursor-not-allowed" title="Apenas administradores e médicos podem alterar receitas">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Apenas Médicos / Administradores Prescrevem</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 font-medium">Total de Receitas Emitidas</div>
          <div className="text-2xl font-bold text-white mt-1">{prescriptions.length}</div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Registros salvos no prontuário
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 font-medium">Medicamentos para Casa</div>
          <div className="text-2xl font-bold text-sky-400 mt-1">{totalMedicamentosPrescritos}</div>
          <div className="text-[10px] text-slate-400 mt-1">
            Itens farmacêuticos prescritos
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 font-medium">Médicos Emissores</div>
          <div className="text-2xl font-bold text-purple-400 mt-1">
            {new Set(prescriptions.map(p => p.medicoId)).size}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Profissionais com receitas ativas
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 font-medium">Autenticação com QR Code</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">100%</div>
          <div className="text-[10px] text-emerald-300 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Todas as receitas validadas
          </div>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por paciente, medicamento prescrito, médico ou código de autenticidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filterDoctorId}
              onChange={(e) => setFilterDoctorId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="TODOS">Todos os Médicos</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Receitas */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Código / QR</th>
                <th className="py-3 px-4">Paciente</th>
                <th className="py-3 px-4">Médico Prescritor</th>
                <th className="py-3 px-4">Medicamentos para Casa</th>
                <th className="py-3 px-4">Data Emissão</th>
                <th className="py-3 px-4 text-right">Ações Oficiais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Nenhuma receita médica encontrada com os critérios informados.
                  </td>
                </tr>
              ) : (
                filteredPrescriptions.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{p.codigoAutenticidade}</span>
                        <button
                          onClick={() => handleCopyCode(p.id, p.codigoAutenticidade)}
                          className="text-slate-500 hover:text-white p-0.5 ml-1 transition-colors"
                          title="Copiar código validador"
                        >
                          {copiedId === p.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-500">Validade: {p.validadeDias} dias</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{p.pacienteNome}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        CPF: {p.pacienteCpf} · WhatsApp: {p.pacienteTelefone}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{p.medicoNome}</div>
                      <div className="text-[11px] text-sky-400">
                        CRM {p.medicoCrm}/{p.medicoUfCrm} · {p.medicoEspecialidade}
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="space-y-1">
                        {p.medicamentos.map(m => (
                          <div key={m.id} className="text-[11px] bg-slate-950 px-2 py-1 rounded border border-slate-800">
                            <span className="font-semibold text-emerald-300">{m.nome}</span>
                            {m.dosagem && <span className="text-slate-400"> ({m.dosagem})</span>}: <span className="text-slate-300">{m.frequencia}</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div>{p.dataEmissao}</div>
                      <div className="text-slate-500 text-[10px]">{p.horaEmissao}</div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botão Enviar WhatsApp */}
                        <button
                          onClick={() => onSendWhatsApp(p)}
                          className="px-2.5 py-1.5 bg-emerald-700/30 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded text-xs font-semibold border border-emerald-600/40 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Enviar para o WhatsApp do paciente"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-current text-emerald-400" />
                          <span>WhatsApp</span>
                        </button>

                        {/* Botão Imprimir / Ver */}
                        <button
                          onClick={() => onOpenViewPrescription(p)}
                          className="px-2.5 py-1.5 bg-sky-700/30 hover:bg-sky-600 text-sky-300 hover:text-white rounded text-xs font-semibold border border-sky-600/40 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Ver Receituário e Imprimir com QR Code"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimir</span>
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
    </div>
  );
};
