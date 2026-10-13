import React, { useState, useEffect, useMemo } from 'react';
import { 
  Stethoscope, Plus, Search, Calendar, User, Clock, 
  Activity, FileText, AlertCircle, CheckCircle2, ChevronRight, 
  Pill, Heart, Eye, Printer, ShieldAlert, History, Sparkles, 
  ArrowLeft, MessageCircle, AlertTriangle, Thermometer, Weight, 
  Layers, Lock
} from 'lucide-react';
import { 
  Atendimento, AtendimentoStatus, Patient, Doctor, 
  Prescription, User as AppUser, SinaisVitais 
} from '../types';

interface AtendimentoViewProps {
  atendimentos: Atendimento[];
  patients: Patient[];
  doctors: Doctor[];
  prescriptions: Prescription[];
  currentUser: AppUser;
  onSaveAtendimento: (
    atendimento: Omit<Atendimento, 'id' | 'criadoEm'>, 
    id?: number
  ) => { success: boolean; message: string; atendimento?: Atendimento };
  onOpenCreatePrescription: (patientId?: number, doctorId?: number) => void;
  onOpenViewPrescription: (prescription: Prescription) => void;
  onSendWhatsAppPrescription: (prescription: Prescription) => void;
  initialPatientId?: number;
}

// CIDs comuns para preenchimento rápido
const CIDS_FREQUENTES = [
  { codigo: 'I10', descricao: 'Hipertensão essencial (primária)' },
  { codigo: 'E11', descricao: 'Diabetes mellitus não-insulino-dependente (Tipo 2)' },
  { codigo: 'J00', descricao: 'Nasofaringite aguda (resfriado comum)' },
  { codigo: 'J06.9', descricao: 'Infecção aguda das vias aéreas superiores, não especificada' },
  { codigo: 'J20.9', descricao: 'Bronquite aguda não especificada' },
  { codigo: 'M54.5', descricao: 'Dor lombar baixa (lombalgia)' },
  { codigo: 'M75.1', descricao: 'Síndrome do manguito rotador' },
  { codigo: 'K29.7', descricao: 'Gastrite não especificada' },
  { codigo: 'R51', descricao: 'Cefaleia (dor de cabeça)' },
  { codigo: 'F41.1', descricao: 'Ansiedade generalizada' },
  { codigo: 'Z00.0', descricao: 'Exame médico geral (rotina / check-up)' },
];

export const AtendimentoView: React.FC<AtendimentoViewProps> = ({
  atendimentos,
  patients,
  doctors,
  prescriptions,
  currentUser,
  onSaveAtendimento,
  onOpenCreatePrescription,
  onOpenViewPrescription,
  onSendWhatsAppPrescription,
  initialPatientId,
}) => {
  // Controle de Abas principais da tela
  const [viewMode, setViewMode] = useState<'consulta' | 'historico'>('consulta');
  
  // Paciente selecionado para o atendimento atual
  const [selectedPatientId, setSelectedPatientId] = useState<number>(() => {
    if (initialPatientId) return initialPatientId;
    return patients[0]?.id || 1;
  });

  // Médico examinador
  const [selectedDoctorId, setSelectedDoctorId] = useState<number>(() => {
    const matchingDoc = doctors.find(d => 
      d.nome.toLowerCase().includes(currentUser.nome.toLowerCase()) ||
      d.email.toLowerCase().includes(currentUser.login.toLowerCase())
    );
    return matchingDoc ? matchingDoc.id : (doctors[0]?.id || 1);
  });

  // Atendimento em edição (se houver)
  const [editingAtendimentoId, setEditingAtendimentoId] = useState<number | null>(null);

  // Estados dos campos clínicos
  const [status, setStatus] = useState<AtendimentoStatus>('FINALIZADO');
  const [motivoConsulta, setMotivoConsulta] = useState('');
  const [queixaPrincipal, setQueixaPrincipal] = useState('');
  const [anamnese, setAnamnese] = useState('');
  const [historicoFamiliarSocial, setHistoricoFamiliarSocial] = useState('');
  
  // Sinais vitais
  const [pressaoArterial, setPressaoArterial] = useState('120/80');
  const [frequenciaCardiaca, setFrequenciaCardiaca] = useState('75');
  const [temperatura, setTemperatura] = useState('36.5');
  const [peso, setPeso] = useState('70');
  const [altura, setAltura] = useState('170');
  const [saturacaoO2, setSaturacaoO2] = useState('98');
  const [glicemia, setGlicemia] = useState('');

  // Exame físico & Diagnóstico
  const [exameFisico, setExameFisico] = useState('BEG, corado, hidratado, anictérico, acianótico. RCR em 2T sem sopros. Pulmões limpos sem ruídos adventícios. Abdome flácido, indolor, sem visceromegalias.');
  const [hipoteseDiagnostica, setHipoteseDiagnostica] = useState('');
  const [cid10, setCid10] = useState('');
  const [condutaEvolucao, setCondutaEvolucao] = useState('');
  const [retornoEmDias, setRetornoEmDias] = useState<number | ''>(30);
  const [observacoesRetorno, setObservacoesRetorno] = useState('');
  
  // Feedback e alertas
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchTermHistorico, setSearchTermHistorico] = useState('');
  const [filterPatientHistorico, setFilterPatientHistorico] = useState<string>('TODOS');

  // Paciente e Médico selecionados atualmente
  const selectedPatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId);
  }, [patients, selectedPatientId]);

  const selectedDoctor = useMemo(() => {
    return doctors.find(d => d.id === selectedDoctorId);
  }, [doctors, selectedDoctorId]);

  // Histórico anterior de atendimentos do paciente selecionado (Prontuário)
  const patientHistory = useMemo(() => {
    if (!selectedPatientId) return [];
    return atendimentos
      .filter(a => a.pacienteId === selectedPatientId && a.id !== editingAtendimentoId)
      .sort((a, b) => new Date(b.dataHora || b.criadoEm).getTime() - new Date(a.dataHora || a.criadoEm).getTime());
  }, [atendimentos, selectedPatientId, editingAtendimentoId]);

  // Receitas vinculadas ao paciente selecionado
  const patientPrescriptions = useMemo(() => {
    if (!selectedPatientId) return [];
    return prescriptions
      .filter(p => p.pacienteId === selectedPatientId)
      .sort((a, b) => new Date(b.dataEmissao).getTime() - new Date(a.dataEmissao).getTime());
  }, [prescriptions, selectedPatientId]);

  // Cálculo automático do IMC
  const imcCalculado = useMemo(() => {
    const p = parseFloat(peso.replace(',', '.'));
    const a = parseFloat(altura.replace(',', '.')) / 100;
    if (p > 0 && a > 0) {
      const imc = p / (a * a);
      let classif = 'Eutrófico (Normal)';
      if (imc < 18.5) classif = 'Abaixo do peso';
      else if (imc >= 25 && imc < 30) classif = 'Sobrepeso';
      else if (imc >= 30 && imc < 35) classif = 'Obesidade Grau I';
      else if (imc >= 35) classif = 'Obesidade Grau II/III';
      return { valor: imc.toFixed(1), classificacao: classif };
    }
    return null;
  }, [peso, altura]);

  // Regra de Acesso: apenas MÉDICO pode alterar atendimento
  const isDoctor = currentUser.perfil === 'MEDICO';
  const isAdmin = currentUser.perfil === 'ADMINISTRADOR';
  const canEditConsultation = isDoctor; // Exigência expressa do usuário: "somente os medicos podereão alterar chamado atendimento"

  // Se receber initialPatientId, atualiza
  useEffect(() => {
    if (initialPatientId) {
      setSelectedPatientId(initialPatientId);
    }
  }, [initialPatientId]);

  // Limpa formulário para novo atendimento
  const handleNovoAtendimento = (patientId?: number) => {
    setEditingAtendimentoId(null);
    if (patientId) setSelectedPatientId(patientId);
    setMotivoConsulta('');
    setQueixaPrincipal('');
    setAnamnese('');
    setHistoricoFamiliarSocial('');
    setPressaoArterial('120/80');
    setFrequenciaCardiaca('75');
    setTemperatura('36.5');
    setPeso('70');
    setAltura('170');
    setSaturacaoO2('98');
    setGlicemia('');
    setExameFisico('BEG, corado, hidratado, anictérico. RCR em 2T sem sopros. Murmúrio vesicular presente bilateralmente sem ruídos adventícios. Abdome atípico, flácido e indolor.');
    setHipoteseDiagnostica('');
    setCid10('');
    setCondutaEvolucao('');
    setRetornoEmDias(30);
    setObservacoesRetorno('');
    setStatus('FINALIZADO');
    setViewMode('consulta');
  };

  // Carrega atendimento existente para visualização/edição
  const handleCarregarAtendimento = (atendimento: Atendimento) => {
    setEditingAtendimentoId(atendimento.id);
    setSelectedPatientId(atendimento.pacienteId);
    setSelectedDoctorId(atendimento.medicoId);
    setStatus(atendimento.status);
    setMotivoConsulta(atendimento.motivoConsulta || '');
    setQueixaPrincipal(atendimento.queixaPrincipal || '');
    setAnamnese(atendimento.anamnese || '');
    setHistoricoFamiliarSocial(atendimento.historicoFamiliarSocial || '');
    setPressaoArterial(atendimento.sinaisVitais?.pressaoArterial || '120/80');
    setFrequenciaCardiaca(atendimento.sinaisVitais?.frequenciaCardiaca || '75');
    setTemperatura(atendimento.sinaisVitais?.temperatura || '36.5');
    setPeso(atendimento.sinaisVitais?.peso || '70');
    setAltura(atendimento.sinaisVitais?.altura || '170');
    setSaturacaoO2(atendimento.sinaisVitais?.saturacaoO2 || '98');
    setGlicemia(atendimento.sinaisVitais?.glicemia || '');
    setExameFisico(atendimento.exameFisico || '');
    setHipoteseDiagnostica(atendimento.hipoteseDiagnostica || '');
    setCid10(atendimento.cid10 || '');
    setCondutaEvolucao(atendimento.condutaEvolucao || '');
    setRetornoEmDias(atendimento.retornoEmDias ?? 30);
    setObservacoesRetorno(atendimento.observacoesRetorno || '');
    setViewMode('consulta');
  };

  // Preenchimento de modelo clínico
  const handleAplicarModelo = (tipo: 'rotina' | 'hipertensao' | 'resfriado' | 'dor_lombar') => {
    if (!canEditConsultation) return;
    if (tipo === 'rotina') {
      setMotivoConsulta('Consulta médica de rotina e check-up preventivo anual.');
      setQueixaPrincipal('Sem queixas álgicas no momento. Deseja realizar exames preventivos.');
      setAnamnese('Paciente assintomático, nega comorbidades conhecidas, nega uso de medicações regulares. Pratica caminhada esporádica.');
      setHipoteseDiagnostica('Exame médico geral preventivo (Check-up)');
      setCid10('Z00.0 - Exame médico geral');
      setCondutaEvolucao('Solicitados exames laboratoriais de rotina (Hemograma completo, perfil lipídico, glicemia de jejum, creatinina, TSH, EAS). Orientada manutenção de hábitos saudáveis e retorno com os resultados.');
    } else if (tipo === 'hipertensao') {
      setMotivoConsulta('Acompanhamento e controle de hipertensão arterial sistêmica.');
      setQueixaPrincipal('Picos pressóricos ocasionais em domicílio nos últimos dias.');
      setAnamnese('Paciente com diagnóstico prévio de HAS. Refere adesão parcial às medidas dietéticas. Nega dor torácica, dispneia ou alterações visuais.');
      setHipoteseDiagnostica('Hipertensão arterial essencial em acompanhamento');
      setCid10('I10 - Hipertensão essencial (primária)');
      setCondutaEvolucao('Ajustada posologia farmacológica. Reforçada orientação de restrição de sal e controle de peso. Emitida nova receita médica com código de autenticidade.');
    } else if (tipo === 'resfriado') {
      setMotivoConsulta('Quadro respiratório agudo há 3 dias.');
      setQueixaPrincipal('Coriza hialina, tosse seca e febrícula vespertina.');
      setAnamnese('Início dos sintomas há 72h após exposição a mudanças bruscas de temperatura. Sem sinais de alarme ou dispneia.');
      setHipoteseDiagnostica('Infecção aguda de vias aéreas superiores / Resfriado comum');
      setCid10('J00 - Nasofaringite aguda (resfriado comum)');
      setCondutaEvolucao('Prescrita medicação sintomática (analgésico/antitérmico e lavagem nasal com soro fisiológico 0,9%). Repouso relativo e hidratação abundante. Receita emitida.');
    } else if (tipo === 'dor_lombar') {
      setMotivoConsulta('Dor lombar mecânica após esforço físico.');
      setQueixaPrincipal('Lombalgia há 4 dias com piora aos movimentos de flexão.');
      setAnamnese('Refere esforço para erguer peso no trabalho. Nega irradiação para membros inferiores, nega perda de força ou parestesias.');
      setHipoteseDiagnostica('Lombalgia mecânica aguda sem radiculopatia');
      setCid10('M54.5 - Dor lombar baixa (lombalgia)');
      setCondutaEvolucao('Prescrito anti-inflamatório não esteroidal associado a relaxante muscular por 5 dias. Orientada termoterapia local e repouso relativo sem acamamento prolongado.');
    }
  };

  // Salvar atendimento
  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();

    // Validação de permissão: somente médicos alteram atendimento
    if (!canEditConsultation) {
      setFeedback({ 
        type: 'error', 
        message: 'Acesso Restrito: Somente profissionais médicos com CRM ativo têm autorização para registrar ou alterar atendimentos clínicos.' 
      });
      return;
    }

    if (!selectedPatient) {
      setFeedback({ type: 'error', message: 'Selecione um paciente para o atendimento.' });
      return;
    }

    if (!selectedDoctor) {
      setFeedback({ type: 'error', message: 'Selecione o médico responsável pelo atendimento.' });
      return;
    }

    if (!queixaPrincipal.trim()) {
      setFeedback({ type: 'error', message: 'Preencha a queixa principal do paciente.' });
      return;
    }

    if (!hipoteseDiagnostica.trim()) {
      setFeedback({ type: 'error', message: 'Preencha a hipótese diagnóstica do atendimento.' });
      return;
    }

    // Coleta as receitas emitidas para este paciente
    const linkedPrescriptionIds = patientPrescriptions.map(p => p.id);

    const dataHoraAtual = new Date().toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    const payload: Omit<Atendimento, 'id' | 'criadoEm'> = {
      pacienteId: selectedPatient.id,
      pacienteNome: selectedPatient.nome,
      pacienteCpf: selectedPatient.cpf,
      pacienteTelefone: selectedPatient.telefone,
      pacienteDataNascimento: selectedPatient.dataNascimento,
      pacienteAlergias: selectedPatient.alergias,
      pacienteConvenio: selectedPatient.convenio,
      medicoId: selectedDoctor.id,
      medicoNome: selectedDoctor.nome,
      medicoCrm: selectedDoctor.crm,
      medicoUfCrm: selectedDoctor.uf_crm,
      medicoEspecialidade: selectedDoctor.especialidade,
      dataHora: dataHoraAtual,
      status,
      motivoConsulta: motivoConsulta.trim() || 'Consulta médica ambulatorial',
      queixaPrincipal: queixaPrincipal.trim(),
      anamnese: anamnese.trim(),
      historicoFamiliarSocial: historicoFamiliarSocial.trim(),
      sinaisVitais: {
        pressaoArterial: pressaoArterial.trim(),
        frequenciaCardiaca: frequenciaCardiaca.trim(),
        temperatura: temperatura.trim(),
        peso: peso.trim(),
        altura: altura.trim(),
        saturacaoO2: saturacaoO2.trim(),
        glicemia: glicemia.trim(),
      },
      exameFisico: exameFisico.trim(),
      hipoteseDiagnostica: hipoteseDiagnostica.trim(),
      cid10: cid10.trim(),
      condutaEvolucao: condutaEvolucao.trim(),
      prescricoesIds: linkedPrescriptionIds,
      retornoEmDias: retornoEmDias === '' ? undefined : Number(retornoEmDias),
      observacoesRetorno: observacoesRetorno.trim(),
    };

    const res = onSaveAtendimento(payload, editingAtendimentoId || undefined);
    if (res.success) {
      setFeedback({ 
        type: 'success', 
        message: editingAtendimentoId 
          ? 'Atendimento atualizado com sucesso no prontuário do paciente!' 
          : 'Novo atendimento registrado e arquivado com sucesso no histórico do paciente!' 
      });
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  // Filtragem do histórico geral
  const filteredAtendimentos = useMemo(() => {
    return atendimentos.filter(a => {
      const term = searchTermHistorico.toLowerCase();
      const matchesSearch = 
        (a.pacienteNome || '').toLowerCase().includes(term) ||
        (a.medicoNome || '').toLowerCase().includes(term) ||
        (a.hipoteseDiagnostica || '').toLowerCase().includes(term) ||
        (a.cid10 || '').toLowerCase().includes(term) ||
        (a.queixaPrincipal || '').toLowerCase().includes(term);

      const matchesPatient = filterPatientHistorico === 'TODOS' || a.pacienteId.toString() === filterPatientHistorico;
      return matchesSearch && matchesPatient;
    });
  }, [atendimentos, searchTermHistorico, filterPatientHistorico]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header com Título e Regras de Permissão */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Atendimento Médico & Prontuário Clínico</span>
                {isDoctor && (
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full">
                    Acesso Médico Habilitado
                  </span>
                )}
                {!isDoctor && (
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Visualização (Apenas Médicos Alteram)
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Registro de consultas médicas com anamnese, exame físico, diagnóstico CID-10, prescrição de receitas e prontuário histórico do paciente
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação Superior */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-0.5 flex text-xs font-semibold">
            <button
              onClick={() => setViewMode('consulta')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'consulta' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Consulta Atual</span>
            </button>
            <button
              onClick={() => setViewMode('historico')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'historico' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Histórico de Atendimentos ({atendimentos.length})</span>
            </button>
          </div>

          {canEditConsultation && (
            <button
              onClick={() => handleNovoAtendimento()}
              className="flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-sky-950 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Atendimento</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerta de Feedback */}
      {feedback && (
        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between transition-all ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' 
            : 'bg-rose-950/40 border-rose-800 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* AVISO DE RESTRIÇÃO SE NÃO FOR MÉDICO */}
      {!canEditConsultation && (
        <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-3 text-xs text-amber-300 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Aviso de Segurança e Deontologia Médica:</span> Você está logado como{' '}
            <strong className="underline text-amber-200">{currentUser.login} ({currentUser.perfil})</strong>. 
            Conforme as regras do sistema, <strong>somente médicos com perfil 'MEDICO'</strong> têm permissão para registrar, alterar e assinar atendimentos clínicos. Os dados abaixo estão disponíveis em modo de leitura para acompanhamento.
          </div>
        </div>
      )}

      {/* 2. MODO 1: CONSULTA ATUAL COM PRONTUÁRIO INTEGRADO */}
      {viewMode === 'consulta' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* COLUNA ESQUERDA (8 COLUNAS): FORMULÁRIO DO ATENDIMENTO CLÍNICO */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Bloco 1: Seleção de Paciente e Médico */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <User className="w-4 h-4 text-sky-400" />
                  <span>Identificação do Paciente e do Médico de Atendimento</span>
                </div>
                {editingAtendimentoId && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-mono">
                    Editando Atendimento #{editingAtendimentoId}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Selecionar Paciente */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Paciente para Atendimento *
                  </label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                    disabled={!canEditConsultation && !isAdmin}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nome} (CPF: {p.cpf || 'Sem CPF'} · Convênio: {p.convenio || 'Particular'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selecionar Médico */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Médico Responsável *
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
                    disabled={!canEditConsultation && !isAdmin}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.nome} (CRM {d.crm}/{d.uf_crm} - {d.especialidade})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CARD DETALHADO DO PACIENTE SELECIONADO COM ALERTA DE ALERGIA */}
              {selectedPatient && (
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Nome Completo:</span>
                    <strong className="text-white truncate block">{selectedPatient.nome}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">CPF:</span>
                    <span className="text-slate-200 font-mono">{selectedPatient.cpf || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Telefone / WhatsApp:</span>
                    <span className="text-slate-200">{selectedPatient.telefone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Convênio Médico:</span>
                    <span className="text-sky-300 font-medium">{selectedPatient.convenio || 'Particular'}</span>
                  </div>

                  {/* ALERTA DE ALERGIAS DO PACIENTE */}
                  <div className="col-span-2 sm:col-span-4 pt-2 border-t border-slate-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`w-4 h-4 ${
                        selectedPatient.alergias && !selectedPatient.alergias.toLowerCase().includes('nenhuma')
                          ? 'text-rose-400 animate-pulse'
                          : 'text-emerald-400'
                      }`} />
                      <span className="text-[11px] text-slate-400">Alergias Registradas:</span>
                      <span className={`text-[11px] font-semibold ${
                        selectedPatient.alergias && !selectedPatient.alergias.toLowerCase().includes('nenhuma')
                          ? 'text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800'
                          : 'text-slate-300'
                      }`}>
                        {selectedPatient.alergias || 'Nenhuma alergia conhecida relatada'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Total no Prontuário: <strong className="text-sky-300">{patientHistory.length}</strong> consulta(s) anterior(es)
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bloco 2: Anamnese e Queixa */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <FileText className="w-4 h-4 text-sky-400" />
                  <span>Anamnese & Queixa Clínica</span>
                </div>

                {/* Modelos rápidos de preenchimento */}
                {canEditConsultation && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 mr-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" /> Modelos Rápidos:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAplicarModelo('rotina')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-sky-300 rounded border border-slate-700 cursor-pointer"
                    >
                      Check-up
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAplicarModelo('hipertensao')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-emerald-300 rounded border border-slate-700 cursor-pointer"
                    >
                      HAS
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAplicarModelo('resfriado')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-purple-300 rounded border border-slate-700 cursor-pointer"
                    >
                      Resfriado
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAplicarModelo('dor_lombar')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-amber-300 rounded border border-slate-700 cursor-pointer"
                    >
                      Lombalgia
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Motivo da Consulta
                  </label>
                  <input
                    type="text"
                    value={motivoConsulta}
                    onChange={(e) => setMotivoConsulta(e.target.value)}
                    disabled={!canEditConsultation}
                    placeholder="Ex: Consulta de rotina / Retorno com exames"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Queixa Principal (Palavras do Paciente) *
                  </label>
                  <input
                    type="text"
                    value={queixaPrincipal}
                    onChange={(e) => setQueixaPrincipal(e.target.value)}
                    disabled={!canEditConsultation}
                    placeholder="Ex: Dor de cabeça intensa e cansaço há 1 semana"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  História da Moléstia Atual (HMA) / Anamnese Detalhada
                </label>
                <textarea
                  rows={3}
                  value={anamnese}
                  onChange={(e) => setAnamnese(e.target.value)}
                  disabled={!canEditConsultation}
                  placeholder="Evolução cronológica dos sintomas, fatores de melhora/piora, tratamentos prévios..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-sky-500 resize-y"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Histórico Patológico, Familiar e Hábitos de Vida
                </label>
                <input
                  type="text"
                  value={historicoFamiliarSocial}
                  onChange={(e) => setHistoricoFamiliarSocial(e.target.value)}
                  disabled={!canEditConsultation}
                  placeholder="Ex: Mãe diabética, nega tabagismo, etilismo eventual, sedentário..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Bloco 3: Sinais Vitais & Exame Físico */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Sinais Vitais & Medidas Antropométricas</span>
                </div>
                {imcCalculado && (
                  <div className="text-xs bg-slate-950 px-2.5 py-1 rounded border border-slate-800 flex items-center gap-2">
                    <span className="text-slate-400">IMC Calculado:</span>
                    <strong className="text-sky-300">{imcCalculado.valor} kg/m²</strong>
                    <span className="text-[11px] text-emerald-400 font-semibold">({imcCalculado.classificacao})</span>
                  </div>
                )}
              </div>

              {/* Grid de Sinais Vitais */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">PA (Pressão)</label>
                  <input
                    type="text"
                    value={pressaoArterial}
                    onChange={(e) => setPressaoArterial(e.target.value)}
                    disabled={!canEditConsultation}
                    placeholder="120/80"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-center font-mono focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-[9px] text-slate-500 text-center block mt-0.5">mmHg</span>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Freq. Cardíaca</label>
                  <input
                    type="text"
                    value={frequenciaCardiaca}
                    onChange={(e) => setFrequenciaCardiaca(e.target.value)}
                    disabled={!canEditConsultation}
                    placeholder="75"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-center font-mono focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-[9px] text-slate-500 text-center block mt-0.5">bpm</span>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Temperatura</label>
                  <input
                    type="text"
                    value={temperatura}
                    onChange={(e) => setTemperatura(e.target.value)}
                    disabled={!canEditConsultation}
                    placeholder="36.5"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-center font-mono focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-[9px] text-slate-500 text-center block mt-0.5">°C</span>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Sat. O2</label>
                  <input
                    type="text"
                    value={saturacaoO2}
                    onChange={(e) => setSaturacaoO2(e.target.value)}
                    disabled={!canEditConsultation}
                    placeholder="98"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-center font-mono focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-[9px] text-slate-500 text-center block mt-0.5">%</span>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Peso</label>
                  <input
                    type="text"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                    disabled={!canEditConsultation}
                    placeholder="70"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-center font-mono focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-[9px] text-slate-500 text-center block mt-0.5">kg</span>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Altura</label>
                  <input
                    type="text"
                    value={altura}
                    onChange={(e) => setAltura(e.target.value)}
                    disabled={!canEditConsultation}
                    placeholder="170"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-center font-mono focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-[9px] text-slate-500 text-center block mt-0.5">cm</span>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Glicemia</label>
                  <input
                    type="text"
                    value={glicemia}
                    onChange={(e) => setGlicemia(e.target.value)}
                    disabled={!canEditConsultation}
                    placeholder="95"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-center font-mono focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-[9px] text-slate-500 text-center block mt-0.5">mg/dL</span>
                </div>
              </div>

              {/* Exame Físico Geral */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Exame Físico Geral e Específico
                </label>
                <textarea
                  rows={2}
                  value={exameFisico}
                  onChange={(e) => setExameFisico(e.target.value)}
                  disabled={!canEditConsultation}
                  placeholder="Inspeção, ausculta cardíaca e respiratória, palpação abdominal, membros..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-sky-500 resize-y"
                />
              </div>
            </div>

            {/* Bloco 4: Diagnóstico, CID-10 e Conduta Médica */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Heart className="w-4 h-4 text-rose-400" />
                  <span>Diagnóstico, CID-10 & Conduta Terapêutica</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Hipótese Diagnóstica / Conclusão Clínica *
                  </label>
                  <input
                    type="text"
                    value={hipoteseDiagnostica}
                    onChange={(e) => setHipoteseDiagnostica(e.target.value)}
                    disabled={!canEditConsultation}
                    placeholder="Ex: Hipertensão Arterial Sistêmica Estágio 1"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Código CID-10 (Classificação Internacional de Doenças)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cid10}
                      onChange={(e) => setCid10(e.target.value)}
                      disabled={!canEditConsultation}
                      placeholder="Ex: I10 ou selecione ao lado"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                    />
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          setCid10(e.target.value);
                          const matching = CIDS_FREQUENTES.find(c => c.codigo === e.target.value);
                          if (matching && !hipoteseDiagnostica) {
                            setHipoteseDiagnostica(matching.descricao);
                          }
                        }
                      }}
                      disabled={!canEditConsultation}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2 text-[11px] text-slate-300 focus:outline-none focus:border-sky-500 cursor-pointer"
                    >
                      <option value="">CIDs Comuns</option>
                      {CIDS_FREQUENTES.map(c => (
                        <option key={c.codigo} value={`${c.codigo} - ${c.descricao}`}>
                          {c.codigo} - {c.descricao}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Conduta Médica, Evolução e Orientações Terapêuticas
                </label>
                <textarea
                  rows={3}
                  value={condutaEvolucao}
                  onChange={(e) => setCondutaEvolucao(e.target.value)}
                  disabled={!canEditConsultation}
                  placeholder="Orientações fornecidas, conduta medicamentosa prescrita, solicitações de exames complementares..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-sky-500 resize-y"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Previsão de Retorno (Dias)
                  </label>
                  <input
                    type="number"
                    value={retornoEmDias}
                    onChange={(e) => setRetornoEmDias(e.target.value === '' ? '' : Number(e.target.value))}
                    disabled={!canEditConsultation}
                    placeholder="30"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Status do Atendimento
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AtendimentoStatus)}
                    disabled={!canEditConsultation}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="FINALIZADO">FINALIZADO (Concluído)</option>
                    <option value="EM_ANDAMENTO">EM ANDAMENTO (Aguardando exames/evolução)</option>
                    <option value="CANCELADO">CANCELADO</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bloco 5: Prescrição Médica Integrada no Atendimento */}
            <div className="bg-gradient-to-r from-emerald-950/30 to-slate-900 border border-emerald-800/40 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-800/30 pb-3">
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Receituário & Prescrição Médica para este Paciente</span>
                      <span className="px-2 py-0.2 bg-emerald-500/20 text-emerald-300 text-[10px] rounded-full">
                        Vinculado ao Atendimento
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      As receitas emitidas durante este atendimento ficam salvas e anexadas ao prontuário do paciente para consultas futuras
                    </p>
                  </div>
                </div>

                {/* Botão de emissão rápida de receita */}
                <button
                  type="button"
                  onClick={() => onOpenCreatePrescription(selectedPatientId, selectedDoctorId)}
                  disabled={!canEditConsultation && !isAdmin}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-950 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Emitir Nova Receita com QR Code</span>
                </button>
              </div>

              {/* Lista de receitas emitidas para este paciente */}
              {patientPrescriptions.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400">
                  Nenhuma receita emitida ainda para este paciente. Clique no botão acima para prescrever medicamentos.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-emerald-300">
                    Receitas Médicas Arquivadas no Cadastro do Paciente ({patientPrescriptions.length}):
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {patientPrescriptions.map(p => (
                      <div 
                        key={p.id}
                        className="bg-slate-950/80 border border-emerald-900/40 p-2.5 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-mono text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                            <span>{p.codigoAutenticidade}</span>
                            <span className="text-slate-500 font-normal">({p.dataEmissao})</span>
                          </div>
                          <div className="text-[11px] text-slate-300 mt-0.5">
                            {p.medicamentos.length} medicamento(s) prescrito(s):{' '}
                            <span className="text-slate-400">
                              {p.medicamentos.map(m => m.nome).join(', ').substring(0, 45)}...
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onSendWhatsAppPrescription(p)}
                            className="p-1.5 bg-emerald-700/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded transition-colors"
                            title="Enviar para o WhatsApp do Paciente"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenViewPrescription(p)}
                            className="p-1.5 bg-sky-700/20 hover:bg-sky-600 text-sky-400 hover:text-white rounded transition-colors"
                            title="Ver e Imprimir Receita com QR Code"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Botões de Submissão do Atendimento */}
            {canEditConsultation && (
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleNovoAtendimento()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  Limpar / Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSalvar}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-sky-950 flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingAtendimentoId ? 'Atualizar Atendimento' : 'Salvar e Finalizar Atendimento Clínico'}</span>
                </button>
              </div>
            )}
          </div>

          {/* COLUNA DIREITA (4 COLUNAS): HISTÓRICO ANTERIOR DO PACIENTE (PRONTUÁRIO ELETRÔNICO) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 sticky top-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <History className="w-4 h-4 text-sky-400" />
                  <span>Histórico Anterior do Paciente</span>
                </div>
                <span className="text-[11px] font-mono text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                  {patientHistory.length} consulta(s)
                </span>
              </div>

              <p className="text-[11px] text-slate-400">
                Consultas passadas de <strong>{selectedPatient?.nome}</strong> para consulta imediata durante o atendimento médico:
              </p>

              {patientHistory.length === 0 ? (
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-5 text-center text-xs text-slate-500 space-y-2">
                  <Stethoscope className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>Este paciente não possui atendimentos anteriores registrados no sistema.</p>
                  <p className="text-[10px] text-slate-500">Este será o primeiro registro no prontuário eletrônico.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
                  {patientHistory.map((hist, index) => (
                    <div 
                      key={hist.id}
                      className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-3 space-y-2 text-xs transition-all shadow-sm"
                    >
                      {/* Cabeçalho do atendimento passado */}
                      <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                          <span className="font-semibold text-slate-200">{hist.dataHora}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          #{hist.id}
                        </span>
                      </div>

                      {/* Médico que atendeu */}
                      <div className="text-[11px] text-sky-300 font-medium flex items-center gap-1">
                        <Stethoscope className="w-3 h-3 text-sky-400 shrink-0" />
                        <span className="truncate">{hist.medicoNome} (CRM {hist.medicoCrm})</span>
                      </div>

                      {/* Queixa & Diagnóstico */}
                      <div>
                        <div className="text-[10px] text-slate-400">Queixa:</div>
                        <div className="text-slate-200 text-[11px] font-medium">{hist.queixaPrincipal}</div>
                      </div>

                      {hist.hipoteseDiagnostica && (
                        <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800 text-[11px]">
                          <span className="text-emerald-400 font-semibold block">Diagnóstico / CID:</span>
                          <span className="text-slate-300">{hist.hipoteseDiagnostica}</span>
                          {hist.cid10 && <span className="text-slate-400 block font-mono text-[10px]">{hist.cid10}</span>}
                        </div>
                      )}

                      {/* Sinais Vitais no passado */}
                      {hist.sinaisVitais?.pressaoArterial && (
                        <div className="grid grid-cols-3 gap-1 text-[10px] bg-slate-900/50 p-1 rounded font-mono text-center">
                          <div>PA: <strong className="text-white">{hist.sinaisVitais.pressaoArterial}</strong></div>
                          <div>FC: <strong className="text-white">{hist.sinaisVitais.frequenciaCardiaca || '-'} bpm</strong></div>
                          <div>Temp: <strong className="text-white">{hist.sinaisVitais.temperatura || '-'}°C</strong></div>
                        </div>
                      )}

                      {/* Conduta Médica anterior */}
                      {hist.condutaEvolucao && (
                        <div className="text-[10px] text-slate-400 line-clamp-2">
                          <span className="text-slate-300 font-semibold">Conduta: </span>
                          {hist.condutaEvolucao}
                        </div>
                      )}

                      {/* Botão para carregar ou visualizar atendimento anterior */}
                      <div className="pt-1.5 border-t border-slate-900 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleCarregarAtendimento(hist)}
                          className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Abrir Detalhes do Atendimento</span>
                        </button>

                        {canEditConsultation && (
                          <button
                            type="button"
                            onClick={() => {
                              // Copia conduta anterior para reaproveitamento
                              setAnamnese(prev => prev ? `${prev}\n\n[Histórico Anterior]: ${hist.condutaEvolucao}` : hist.condutaEvolucao);
                            }}
                            className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                            title="Reaproveitar conduta/evolução deste atendimento anterior"
                          >
                            Reutilizar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. MODO 2: LISTAGEM GERAL DO HISTÓRICO DE ATENDIMENTOS DA CLÍNICA */}
      {viewMode === 'historico' && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por paciente, médico, queixa ou CID-10..."
                  value={searchTermHistorico}
                  onChange={(e) => setSearchTermHistorico(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <select
                value={filterPatientHistorico}
                onChange={(e) => setFilterPatientHistorico(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="TODOS">Todos os Pacientes</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id.toString()}>{p.nome}</option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-400">
              Exibindo <strong className="text-white">{filteredAtendimentos.length}</strong> de <strong className="text-white">{atendimentos.length}</strong> atendimentos
            </div>
          </div>

          {/* Tabela de Atendimentos */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3 px-4">ID & Data/Hora</th>
                    <th className="py-3 px-4">Paciente</th>
                    <th className="py-3 px-4">Médico Examinador</th>
                    <th className="py-3 px-4">Queixa & Diagnóstico (CID-10)</th>
                    <th className="py-3 px-4">Sinais Vitais</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAtendimentos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Nenhum atendimento clínico encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredAtendimentos.map(atend => (
                      <tr key={atend.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <div className="font-bold text-white">#{atend.id}</div>
                          <div className="text-slate-400 text-[10px]">{atend.dataHora}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{atend.pacienteNome}</span>
                            {atend.pacienteAlergias && !atend.pacienteAlergias.toLowerCase().includes('nenhuma') && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Possui Alergias Registradas" />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            CPF: {atend.pacienteCpf || 'Sem CPF'} · {atend.pacienteConvenio || 'Particular'}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-200">{atend.medicoNome}</div>
                          <div className="text-[10px] text-sky-400">
                            CRM {atend.medicoCrm}/{atend.medicoUfCrm} · {atend.medicoEspecialidade}
                          </div>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-medium text-slate-200 truncate">{atend.queixaPrincipal}</div>
                          <div className="text-[11px] text-emerald-400 font-semibold truncate">
                            {atend.hipoteseDiagnostica || 'Sem diagnóstico'}
                          </div>
                          {atend.cid10 && (
                            <div className="text-[10px] text-slate-400 font-mono">{atend.cid10}</div>
                          )}
                        </td>

                        <td className="py-3 px-4 font-mono text-[10px]">
                          <div>PA: {atend.sinaisVitais?.pressaoArterial || '-'}</div>
                          <div className="text-slate-400">FC: {atend.sinaisVitais?.frequenciaCardiaca || '-'} bpm</div>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            atend.status === 'FINALIZADO'
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                              : atend.status === 'EM_ANDAMENTO'
                              ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                              : 'bg-rose-950/60 text-rose-300 border border-rose-800'
                          }`}>
                            {atend.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleCarregarAtendimento(atend)}
                              className="px-2.5 py-1.5 bg-sky-700/30 hover:bg-sky-600 text-sky-300 hover:text-white rounded text-xs font-semibold border border-sky-600/40 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Abrir este atendimento no prontuário"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Prontuário</span>
                            </button>

                            {canEditConsultation && (
                              <button
                                onClick={() => handleNovoAtendimento(atend.pacienteId)}
                                className="px-2.5 py-1.5 bg-emerald-700/30 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded text-xs font-semibold border border-emerald-600/40 transition-colors flex items-center gap-1 cursor-pointer"
                                title="Iniciar novo atendimento para este mesmo paciente"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Reatender</span>
                              </button>
                            )}
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
      )}
    </div>
  );
};
