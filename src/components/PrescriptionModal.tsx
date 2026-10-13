import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  FileText, Printer, MessageCircle, X, Plus, Trash2, CheckCircle2, 
  AlertCircle, ShieldCheck, Copy, Check, Download, Calendar, User, 
  Stethoscope, Clock, Sparkles
} from 'lucide-react';
import { Prescription, PrescriptionMedication, Patient, Doctor, User as AppUser } from '../types';

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePrescription: (prescription: Omit<Prescription, 'id' | 'criadoEm'>, id?: number) => { success: boolean; message: string; prescription?: Prescription };
  patients: Patient[];
  doctors: Doctor[];
  currentUser: AppUser;
  initialPatientId?: number;
  initialDoctorId?: number;
  existingPrescription?: Prescription | null;
  onPrescriptionSentWhatsApp?: (prescription: Prescription) => void;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  isOpen,
  onClose,
  onSavePrescription,
  patients,
  doctors,
  currentUser,
  initialPatientId,
  initialDoctorId,
  existingPrescription,
  onPrescriptionSentWhatsApp,
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  // Paciente & Médico
  const [pacienteId, setPacienteId] = useState<number>(() => {
    if (existingPrescription) return existingPrescription.pacienteId;
    if (initialPatientId) return initialPatientId;
    return patients[0]?.id || 1;
  });

  const [medicoId, setMedicoId] = useState<number>(() => {
    if (existingPrescription) return existingPrescription.medicoId;
    if (initialDoctorId) return initialDoctorId;
    // Se o usuário logado for médico, seleciona ele
    const matchingDoc = doctors.find(d => d.nome.toLowerCase().includes(currentUser.nome.toLowerCase()));
    return matchingDoc ? matchingDoc.id : (doctors[0]?.id || 1);
  });

  const [dataEmissao, setDataEmissao] = useState<string>(() => {
    return existingPrescription?.dataEmissao || new Date().toISOString().split('T')[0];
  });

  const [horaEmissao, setHoraEmissao] = useState<string>(() => {
    if (existingPrescription?.horaEmissao) return existingPrescription.horaEmissao;
    const now = new Date();
    return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  });

  const [validadeDias, setValidadeDias] = useState<number>(() => {
    return existingPrescription?.validadeDias || 30;
  });

  // Lista de Medicamentos Prescritos para Casa
  const [medicamentos, setMedicamentos] = useState<PrescriptionMedication[]>(() => {
    if (existingPrescription?.medicamentos && existingPrescription.medicamentos.length > 0) {
      return existingPrescription.medicamentos;
    }
    return [
      {
        id: 'med-' + Date.now(),
        nome: '',
        dosagem: '',
        via: 'Oral',
        frequencia: '',
        duracao: '',
        quantidade: '',
        instrucoesCasa: '',
      }
    ];
  });

  const [orientacoesGerais, setOrientacoesGerais] = useState<string>(() => {
    return existingPrescription?.orientacoesGerais || 
      'Manter repouso moderado, hidratação adequada com ingestão hídrica de no mínimo 2 litros de água/dia. Em caso de reações adversas, febre persistente ou sintomas alérgicos, suspender a medicação e retornar imediatamente ao atendimento médico.';
  });

  // QR Code gerado em DataURL
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [currentCodigoAutenticidade, setCurrentCodigoAutenticidade] = useState<string>(() => {
    return existingPrescription?.codigoAutenticidade || `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}-BR`;
  });

  const [savedPrescription, setSavedPrescription] = useState<Prescription | null>(existingPrescription || null);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const selectedPatient = patients.find(p => p.id === Number(pacienteId));
  const selectedDoctor = doctors.find(d => d.id === Number(medicoId));

  // Gera o QR Code dinâmico
  useEffect(() => {
    const verificationUrl = `https://clinestudo.saude.gov.br/validar?codigo=${currentCodigoAutenticidade}&paciente=${encodeURIComponent(selectedPatient?.nome || '')}&data=${dataEmissao}`;
    QRCode.toDataURL(verificationUrl, {
      width: 180,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then(url => {
        setQrCodeDataUrl(url);
      })
      .catch(err => {
        console.error('Erro ao gerar QR Code:', err);
      });
  }, [currentCodigoAutenticidade, selectedPatient, dataEmissao]);

  // Se abrir em modo existente, começa na visualização
  useEffect(() => {
    if (existingPrescription) {
      setSavedPrescription(existingPrescription);
      setActiveTab('preview');
      setCurrentCodigoAutenticidade(existingPrescription.codigoAutenticidade);
      setPacienteId(existingPrescription.pacienteId);
      setMedicoId(existingPrescription.medicoId);
      setDataEmissao(existingPrescription.dataEmissao);
      setHoraEmissao(existingPrescription.horaEmissao);
      setValidadeDias(existingPrescription.validadeDias);
      setMedicamentos(existingPrescription.medicamentos);
      setOrientacoesGerais(existingPrescription.orientacoesGerais);
    } else {
      setActiveTab('form');
    }
  }, [existingPrescription]);

  // Manipulação de medicamentos
  const handleAddMedication = () => {
    setMedicamentos(prev => [
      ...prev,
      {
        id: 'med-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
        nome: '',
        dosagem: '',
        via: 'Oral',
        frequencia: '',
        duracao: '',
        quantidade: '',
        instrucoesCasa: '',
      }
    ]);
  };

  const handleRemoveMedication = (id: string) => {
    if (medicamentos.length <= 1) {
      setFeedback({ type: 'error', message: 'A receita deve conter ao menos um medicamento prescrito.' });
      return;
    }
    setMedicamentos(prev => prev.filter(m => m.id !== id));
  };

  const handleUpdateMedication = (id: string, field: keyof PrescriptionMedication, value: string) => {
    setMedicamentos(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  // Modelos rápidos de prescrição pré-definida
  const applyQuickTemplate = (templateName: string) => {
    if (templateName === 'antiinflamatorio') {
      setMedicamentos([
        {
          id: 'med-1',
          nome: 'Ibuprofeno 600mg',
          dosagem: '600mg',
          via: 'Oral',
          frequencia: 'Tomar 1 comprimido a cada 8 horas por 5 dias',
          duracao: '5 dias',
          quantidade: '15 comprimidos (1 caixa)',
          instrucoesCasa: 'Ingerir sempre após as refeições para proteção gástrica.',
        },
        {
          id: 'med-2',
          nome: 'Dipirona Monoidratada 500mg',
          dosagem: '500mg',
          via: 'Oral',
          frequencia: 'Tomar 1 comprimido a cada 6 horas se dor',
          duracao: '3 a 5 dias se necessário',
          quantidade: '10 comprimidos',
          instrucoesCasa: 'Usar apenas em caso de dor moderada ou febre.',
        }
      ]);
      setOrientacoesGerais('Repouso relativo, evitar esforço físico intenso e ingerir bastante água.');
    } else if (templateName === 'hipertensao') {
      setMedicamentos([
        {
          id: 'med-1',
          nome: 'Losartana Potássica 50mg',
          dosagem: '50mg',
          via: 'Oral',
          frequencia: 'Tomar 1 comprimido pela manhã em jejum',
          duracao: 'Uso contínuo (30 dias)',
          quantidade: '30 comprimidos (1 caixa)',
          instrucoesCasa: 'Tomar sempre no mesmo horário com água. Não interromper sem consentimento médico.',
        },
        {
          id: 'med-2',
          nome: 'Hidroclorotiazida 25mg',
          dosagem: '25mg',
          via: 'Oral',
          frequencia: 'Tomar 1 comprimido pela manhã',
          duracao: 'Uso contínuo (30 dias)',
          quantidade: '30 comprimidos',
          instrucoesCasa: 'Tomar pela manhã. Manter dieta com redução rigorosa de sal.',
        }
      ]);
      setOrientacoesGerais('Aferir a pressão arterial diariamente ao acordar e anotar para o retorno em 30 dias.');
    } else if (templateName === 'antibiotico') {
      setMedicamentos([
        {
          id: 'med-1',
          nome: 'Amoxicilina + Clavulanato 875mg/125mg',
          dosagem: '875mg + 125mg',
          via: 'Oral',
          frequencia: 'Tomar 1 comprimido a cada 12 horas por 7 dias',
          duracao: '7 dias rigorosamente',
          quantidade: '14 comprimidos (1 caixa)',
          instrucoesCasa: 'Tomar rigorosamente de 12 em 12 horas. Completar o ciclo de 7 dias mesmo se houver melhora prévia.',
        },
        {
          id: 'med-2',
          nome: 'Paracetamol 750mg',
          dosagem: '750mg',
          via: 'Oral',
          frequencia: 'Tomar 1 comprimido a cada 6 horas se febre ou dor',
          duracao: 'Conforme sintomas',
          quantidade: '10 comprimidos',
          instrucoesCasa: 'Não exceder a dose diária máxima de 4 comprimidos.',
        }
      ]);
      setOrientacoesGerais('Ingerir líquidos em abundância. Retornar caso os sintomas não apresentem remissão em 72h.');
    }
  };

  // Salvar Receita no prontuário do paciente
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Regra estrita: somente administradores e médicos alteram receitas
    if (currentUser.perfil !== 'ADMINISTRADOR' && currentUser.perfil !== 'MEDICO') {
      setFeedback({ 
        type: 'error', 
        message: 'Acesso Restrito: Somente administradores e médicos possuem autorização para criar ou alterar receitas médicas.' 
      });
      return;
    }

    if (!selectedPatient) {
      setFeedback({ type: 'error', message: 'Selecione um paciente para a receita.' });
      return;
    }
    if (!selectedDoctor) {
      setFeedback({ type: 'error', message: 'Selecione o médico prescritor.' });
      return;
    }

    const invalidMed = medicamentos.some(m => !m.nome.trim() || !m.frequencia.trim());
    if (invalidMed) {
      setFeedback({ type: 'error', message: 'Preencha o nome e a posologia/frequência de todos os medicamentos.' });
      return;
    }

    const payload: Omit<Prescription, 'id' | 'criadoEm'> = {
      codigoAutenticidade: currentCodigoAutenticidade,
      pacienteId: selectedPatient.id,
      pacienteNome: selectedPatient.nome,
      pacienteCpf: selectedPatient.cpf,
      pacienteTelefone: selectedPatient.telefone,
      pacienteConvenio: selectedPatient.convenio,
      medicoId: selectedDoctor.id,
      medicoNome: selectedDoctor.nome,
      medicoCrm: selectedDoctor.crm,
      medicoUfCrm: selectedDoctor.uf_crm,
      medicoEspecialidade: selectedDoctor.especialidade,
      dataEmissao,
      horaEmissao,
      medicamentos,
      orientacoesGerais: orientacoesGerais.trim(),
      validadeDias,
      status: 'ATIVA',
    };

    const res = onSavePrescription(payload, existingPrescription ? existingPrescription.id : undefined);
    if (res.success) {
      setSavedPrescription(res.prescription || { ...payload, id: Date.now(), criadoEm: new Date().toISOString() });
      setActiveTab('preview');
      setFeedback({ type: 'success', message: 'Receita médica salva e arquivada com sucesso no cadastro do paciente!' });
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  // Formatar mensagem para WhatsApp
  const generateWhatsAppMessage = (presc: Prescription) => {
    let msg = `🏥 *CLINESTUDO - RECEITA MÉDICA DIGITAL*\n`;
    msg += `----------------------------------------\n`;
    msg += `Olá, *${presc.pacienteNome}*! Segue a sua receita médica emitida pelo(a) *${presc.medicoNome}* (CRM ${presc.medicoCrm}/${presc.medicoUfCrm} - ${presc.medicoEspecialidade}).\n\n`;
    msg += `📅 *Data de Emissão:* ${presc.dataEmissao} às ${presc.horaEmissao}\n`;
    msg += `🔒 *Código de Autenticidade:* \`${presc.codigoAutenticidade}\`\n\n`;
    
    msg += `💊 *MEDICAÇÕES E MEDICAMENTOS PARA CASA:*\n`;
    presc.medicamentos.forEach((med, index) => {
      msg += `\n*${index + 1}. ${med.nome}* (${med.dosagem || 'Dose padrão'})\n`;
      msg += `   • *Como tomar:* ${med.frequencia}\n`;
      if (med.duracao) msg += `   • *Duração:* ${med.duracao}\n`;
      if (med.quantidade) msg += `   • *Quantidade:* ${med.quantidade}\n`;
      if (med.instrucoesCasa) msg += `   • *Orientações:* ${med.instrucoesCasa}\n`;
    });

    if (presc.orientacoesGerais) {
      msg += `\n📋 *ORIENTAÇÕES GERAIS PARA CASA:*\n${presc.orientacoesGerais}\n`;
    }

    msg += `\n⏳ *Validade:* ${presc.validadeDias} dias a partir da data de emissão.\n`;
    msg += `\n📲 *VALIDAÇÃO DIGITAL COM QR CODE:*\n`;
    msg += `Acesse para autenticar a receita oficial:\n`;
    msg += `https://clinestudo.saude.gov.br/validar?codigo=${presc.codigoAutenticidade}\n\n`;
    msg += `_ClinEstudo - Cuidando da sua saúde com dedicação e excelência._`;

    return msg;
  };

  // Disparar envio via WhatsApp
  const handleSendWhatsApp = () => {
    const presc = savedPrescription || {
      id: 0,
      codigoAutenticidade: currentCodigoAutenticidade,
      pacienteId: selectedPatient?.id || 0,
      pacienteNome: selectedPatient?.nome || '',
      pacienteCpf: selectedPatient?.cpf || '',
      pacienteTelefone: selectedPatient?.telefone || '',
      pacienteConvenio: selectedPatient?.convenio,
      medicoId: selectedDoctor?.id || 0,
      medicoNome: selectedDoctor?.nome || '',
      medicoCrm: selectedDoctor?.crm || '',
      medicoUfCrm: selectedDoctor?.uf_crm || 'SP',
      medicoEspecialidade: selectedDoctor?.especialidade || '',
      dataEmissao,
      horaEmissao,
      medicamentos,
      orientacoesGerais,
      validadeDias,
      status: 'ATIVA' as const,
      criadoEm: new Date().toISOString(),
    };

    const rawPhone = presc.pacienteTelefone.replace(/\D/g, '');
    let formattedPhone = rawPhone;
    if (formattedPhone.length === 10 || formattedPhone.length === 11) {
      formattedPhone = '55' + formattedPhone;
    }

    const message = generateWhatsAppMessage(presc);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;

    // Abre janela do WhatsApp Web / App
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    if (onPrescriptionSentWhatsApp) {
      onPrescriptionSentWhatsApp(presc);
    }

    setFeedback({
      type: 'success',
      message: `WhatsApp iniciado para o paciente ${presc.pacienteNome} (${presc.pacienteTelefone})! A receita está arquivada no prontuário.`
    });
  };

  // Copiar mensagem para área de transferência
  const handleCopyWhatsAppText = () => {
    const presc = savedPrescription || {
      id: 0,
      codigoAutenticidade: currentCodigoAutenticidade,
      pacienteId: selectedPatient?.id || 0,
      pacienteNome: selectedPatient?.nome || '',
      pacienteCpf: selectedPatient?.cpf || '',
      pacienteTelefone: selectedPatient?.telefone || '',
      medicoId: selectedDoctor?.id || 0,
      medicoNome: selectedDoctor?.nome || '',
      medicoCrm: selectedDoctor?.crm || '',
      medicoUfCrm: selectedDoctor?.uf_crm || 'SP',
      medicoEspecialidade: selectedDoctor?.especialidade || '',
      dataEmissao,
      horaEmissao,
      medicamentos,
      orientacoesGerais,
      validadeDias,
      status: 'ATIVA' as const,
      criadoEm: new Date().toISOString(),
    };

    const text = generateWhatsAppMessage(presc);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedWhatsApp(true);
      setTimeout(() => setCopiedWhatsApp(false), 2500);
    });
  };

  // Imprimir documento
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* CSS específico para impressão limpa da receita médica em folha A4 */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-prescription, #printable-prescription * {
            visibility: visible;
          }
          #printable-prescription {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            padding: 20mm !important;
          }
        }
      `}</style>

      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Header do Modal */}
        <div className="px-5 py-3.5 bg-slate-850 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Prescrição Médica & Medicamentos para Casa</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono">
                  {currentCodigoAutenticidade}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Emissão oficial com QR Code de autenticidade, envio instantâneo para WhatsApp e arquivamento no prontuário
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Abas Alternar */}
            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
                  activeTab === 'form' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                1. Formular Receita
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'preview' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>2. Receituário / Impressão / WhatsApp</span>
                {qrCodeDataUrl && <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`px-5 py-2.5 text-xs flex items-center justify-between shrink-0 border-b ${
            feedback.type === 'success' 
              ? 'bg-emerald-950/70 border-emerald-800 text-emerald-200' 
              : 'bg-rose-950/70 border-rose-800 text-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'form' ? (
            <form onSubmit={handleSave} className="space-y-5 text-xs">
              {/* Painel do Médico e Paciente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Paciente Destinatário *</span>
                  </label>
                  <select
                    value={pacienteId}
                    onChange={(e) => setPacienteId(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nome} — CPF: {p.cpf} — Tel: {p.telefone}
                      </option>
                    ))}
                  </select>
                  {selectedPatient && (
                    <div className="mt-2 text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                      <span>WhatsApp: <strong className="text-emerald-400">{selectedPatient.telefone}</strong></span>
                      <span>Convênio: <strong className="text-sky-300">{selectedPatient.convenio || 'Particular'}</strong></span>
                      {selectedPatient.alergias && (
                        <span className="text-amber-400">⚠️ Alergias: {selectedPatient.alergias}</span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-sky-400" />
                    <span>Médico Prescritor *</span>
                  </label>
                  <select
                    value={medicoId}
                    onChange={(e) => setMedicoId(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-medium"
                  >
                    {doctors.filter(d => d.ativo).map(d => (
                      <option key={d.id} value={d.id}>
                        {d.nome} — CRM {d.crm}/{d.uf_crm} ({d.especialidade})
                      </option>
                    ))}
                  </select>
                  {selectedDoctor && (
                    <div className="mt-2 text-[11px] text-slate-400">
                      <span>CRM: <strong className="text-sky-300">{selectedDoctor.crm}/{selectedDoctor.uf_crm}</strong></span>
                      <span className="mx-2">·</span>
                      <span>Especialidade: <strong className="text-white">{selectedDoctor.especialidade}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Data, Horário e Validade */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
                <div>
                  <label className="block text-slate-400 mb-1">Data da Emissão</label>
                  <input
                    type="date"
                    value={dataEmissao}
                    onChange={(e) => setDataEmissao(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Horário da Prescrição</label>
                  <input
                    type="text"
                    value={horaEmissao}
                    onChange={(e) => setHoraEmissao(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Validade da Receita (Dias)</label>
                  <select
                    value={validadeDias}
                    onChange={(e) => setValidadeDias(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value={10}>10 dias (Antimicrobianos)</option>
                    <option value={30}>30 dias (Receituário Padrão)</option>
                    <option value={60}>60 dias (Controle Especial B)</option>
                    <option value={90}>90 dias (Uso Contínuo)</option>
                    <option value={180}>180 dias (Hipertensão / Diabetes)</option>
                  </select>
                </div>
              </div>

              {/* Atalhos de Modelos Rápidos */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-300 font-semibold text-xs">Modelos Rápidos Pré-configurados:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyQuickTemplate('antiinflamatorio')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded text-[11px] border border-slate-700 transition-colors cursor-pointer"
                  >
                    Anti-inflamatório & Dor
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickTemplate('hipertensao')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded text-[11px] border border-slate-700 transition-colors cursor-pointer"
                  >
                    Hipertensão (Contínuo)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickTemplate('antibiotico')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-[11px] border border-slate-700 transition-colors cursor-pointer"
                  >
                    Antibiótico (7 Dias)
                  </button>
                </div>
              </div>

              {/* LISTA DE MEDICAMENTOS PARA CASA */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Medicamentos Prescritos para Casa ({medicamentos.length})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddMedication}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Medicamento</span>
                  </button>
                </div>

                {medicamentos.map((med, index) => (
                  <div key={med.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/90 space-y-3 relative group">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded">
                        Item #{index + 1}
                      </span>
                      {medicamentos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(med.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                          title="Remover medicamento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-slate-300 font-medium mb-1">
                          Nome do Medicamento / Princípio Ativo *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Losartana Potássica, Amoxicilina, Dipirona, etc."
                          value={med.nome}
                          onChange={(e) => handleUpdateMedication(med.id, 'nome', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">
                          Dosagem / Concentração
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: 50mg, 500mg, 100mg/ml"
                          value={med.dosagem}
                          onChange={(e) => handleUpdateMedication(med.id, 'dosagem', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">
                          Posologia / Frequência *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Tomar 1 cp a cada 8 horas"
                          value={med.frequencia}
                          onChange={(e) => handleUpdateMedication(med.id, 'frequencia', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">
                          Duração do Tratamento
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: 7 dias, Uso contínuo, 3 dias"
                          value={med.duracao}
                          onChange={(e) => handleUpdateMedication(med.id, 'duracao', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">
                          Quantidade a Dispensar
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: 1 caixa (30 cp), 1 frasco"
                          value={med.quantidade}
                          onChange={(e) => handleUpdateMedication(med.id, 'quantidade', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">
                        Instruções Específicas para Casa (Orientações de Tomada)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Ingerir com água após almoço. Não ingerir com bebidas alcoólicas."
                        value={med.instrucoesCasa}
                        onChange={(e) => handleUpdateMedication(med.id, 'instrucoesCasa', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 text-[11px]"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Orientações Gerais para Casa */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Orientações Gerais ao Paciente & Cuidados Domiciliares
                </label>
                <textarea
                  rows={3}
                  value={orientacoesGerais}
                  onChange={(e) => setOrientacoesGerais(e.target.value)}
                  placeholder="Orientações sobre repouso, hidratação, alimentação, sinais de alerta e retorno..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-950 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Salvar no Cadastro & Ver Receituário</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* ABA 2: RECEITUÁRIO MÉDICO OFICIAL COM QR CODE & AÇÕES */
            <div className="space-y-6">
              {/* Barra de Ações Rápidas do Receituário */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Ações Imediatas:</span>
                  <span className="text-emerald-400 font-mono font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    {savedPrescription?.codigoAutenticidade || currentCodigoAutenticidade}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Botão Enviar WhatsApp */}
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-950 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                    <span>Enviar para WhatsApp do Paciente</span>
                  </button>

                  {/* Botão Copiar Texto WhatsApp */}
                  <button
                    type="button"
                    onClick={handleCopyWhatsAppText}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                    title="Copiar texto formatado com medicamentos e instruções"
                  >
                    {copiedWhatsApp ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Mensagem WhatsApp</span>
                      </>
                    )}
                  </button>

                  {/* Botão Imprimir */}
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-colors shadow-md cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Receituário (com QR Code)</span>
                  </button>

                  {/* Voltar para edição */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('form')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Editar Dados
                  </button>
                </div>
              </div>

              {/* DOCUMENTO OFICIAL DE RECEITA MÉDICA (PRONTO PARA IMPRESSÃO EM PAPEL A4 BRANCO) */}
              <div 
                id="printable-prescription"
                ref={printRef}
                className="bg-white text-slate-900 rounded-xl p-8 sm:p-10 shadow-2xl border border-slate-200 mx-auto max-w-3xl font-sans"
              >
                {/* 1. Cabeçalho Oficial da Clínica */}
                <div className="border-b-2 border-emerald-700 pb-5 mb-6 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-emerald-700 text-white rounded flex items-center justify-center font-black text-sm">
                        C
                      </div>
                      <h1 className="text-xl font-extrabold tracking-tight text-emerald-900 uppercase">
                        ClinEstudo Centro Clínico
                      </h1>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Sistema Integrado de Gestão Médica, Consultas & Farmacoterapia
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Av. Paulista, 1000 - Bela Vista, São Paulo - SP | CNPJ: 12.345.678/0001-90 | Tel: (11) 3210-9800
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded text-xs border border-emerald-300 uppercase tracking-wide">
                      Receituário Médico
                    </span>
                    <div className="text-[11px] font-mono text-slate-600">
                      Código: <strong>{savedPrescription?.codigoAutenticidade || currentCodigoAutenticidade}</strong>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Emissão: {dataEmissao} às {horaEmissao}
                    </div>
                  </div>
                </div>

                {/* 2. Dados do Paciente & Médico */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Paciente:</span>
                    <div className="font-bold text-sm text-slate-900">{selectedPatient?.nome}</div>
                    <div className="text-slate-600 font-mono text-[11px]">
                      CPF: {selectedPatient?.cpf} · Tel: {selectedPatient?.telefone}
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      Convênio: {selectedPatient?.convenio || 'Particular'}
                    </div>
                  </div>

                  <div className="border-l border-slate-200 pl-4">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Médico Responsável:</span>
                    <div className="font-bold text-sm text-slate-900">{selectedDoctor?.nome}</div>
                    <div className="text-slate-700 text-[11px]">
                      CRM: <strong>{selectedDoctor?.crm}/{selectedDoctor?.uf_crm}</strong> — {selectedDoctor?.especialidade}
                    </div>
                    <div className="text-slate-500 text-[10px]">
                      Validade da receita: <strong>{validadeDias} dias</strong>
                    </div>
                  </div>
                </div>

                {/* 3. Título Prescrição */}
                <div className="mb-4">
                  <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-300 pb-1">
                    Uso Oral / Domiciliar — Medicamentos Prescritos
                  </h2>
                </div>

                {/* 4. Lista dos Medicamentos */}
                <div className="space-y-4 mb-8">
                  {medicamentos.map((med, index) => (
                    <div key={med.id || index} className="pl-3 border-l-2 border-emerald-600 space-y-1">
                      <div className="flex items-baseline justify-between">
                        <div className="font-bold text-sm text-slate-900">
                          {index + 1}. {med.nome} {med.dosagem && <span className="text-slate-700 font-semibold">({med.dosagem})</span>}
                        </div>
                        {med.quantidade && (
                          <div className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Qtd: {med.quantidade}
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-slate-800 font-medium">
                        Posologia: <span className="font-bold text-emerald-900">{med.frequencia}</span>
                        {med.duracao && <span className="text-slate-600"> por {med.duracao}</span>}
                      </div>

                      {med.instrucoesCasa && (
                        <div className="text-[11px] text-slate-600 italic">
                          Orientações de uso: {med.instrucoesCasa}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* 5. Orientações Gerais para Casa */}
                {orientacoesGerais && (
                  <div className="bg-emerald-50/60 p-3.5 rounded-lg border border-emerald-200/80 mb-8 text-xs space-y-1">
                    <span className="font-bold text-emerald-950 uppercase text-[10px] tracking-wide block">
                      Recomendações e Orientações para Casa:
                    </span>
                    <p className="text-slate-700 leading-relaxed text-[11px]">
                      {orientacoesGerais}
                    </p>
                  </div>
                )}

                {/* 6. Rodapé com QR Code e Assinatura Digital */}
                <div className="border-t-2 border-slate-200 pt-6 mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  {/* Bloco do QR Code */}
                  <div className="flex items-center gap-3">
                    {qrCodeDataUrl ? (
                      <img 
                        src={qrCodeDataUrl} 
                        alt="QR Code Autenticidade" 
                        className="w-24 h-24 border border-slate-300 p-1 rounded bg-white shrink-0 shadow-sm"
                      />
                    ) : (
                      <div className="w-24 h-24 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400">
                        Carregando QR Code...
                      </div>
                    )}
                    <div className="space-y-1 text-[10px] text-slate-600">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Autenticação Digital</span>
                      </div>
                      <p className="leading-tight">
                        Aponte a câmera do smartphone para verificar a autenticidade e validade desta prescrição médica.
                      </p>
                      <div className="font-mono text-[9px] text-slate-500 bg-slate-100 p-1 rounded border border-slate-200 truncate">
                        ID: {savedPrescription?.codigoAutenticidade || currentCodigoAutenticidade}
                      </div>
                    </div>
                  </div>

                  {/* Bloco da Assinatura / Carimbo do Médico */}
                  <div className="text-center sm:text-right space-y-1">
                    <div className="w-48 border-b-2 border-slate-400 mx-auto sm:ml-auto sm:mr-0 mb-1"></div>
                    <div className="font-bold text-xs text-slate-900">{selectedDoctor?.nome}</div>
                    <div className="text-[11px] text-slate-700 font-semibold">
                      CRM {selectedDoctor?.crm}/{selectedDoctor?.uf_crm}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {selectedDoctor?.especialidade}
                    </div>
                    <div className="text-[9px] text-emerald-800 font-mono italic">
                      [Documento Assinado Digitalmente via ICP-Brasil / Padrão CFM]
                    </div>
                  </div>
                </div>

                <div className="text-center text-[9px] text-slate-400 border-t border-slate-100 pt-3 mt-6">
                  São Paulo - SP · Documento emitido eletronicamente pelo Sistema ClinEstudo · Guarda permanente no prontuário do paciente conforme Resolução CFM.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
