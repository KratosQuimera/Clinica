export type UserRole = 'ADMINISTRADOR' | 'MEDICO' | 'ENFERMEIRO' | 'RECEPCIONISTA';

export interface User {
  id: number;
  nome: string;
  login: string;
  perfil: UserRole;
  ativo: boolean;
  tentativasFalhas: number;
  bloqueadoAte: string | null;
  criadoEm: string;
}

export interface Doctor {
  id: number;
  nome: string;
  crm: string;
  uf_crm: string;
  especialidade: string;
  telefone: string;
  email: string;
  ativo: boolean;
  horarioInicio?: string;
  horarioFim?: string;
}

export interface Nurse {
  id: number;
  nome: string;
  coren: string;
  uf_coren: string;
  setor: string;
  turno: 'MANHÃ' | 'TARDE' | 'NOITE' | '12X36 DIURNO' | '12X36 NOTURNO' | 'INTEGRAL';
  telefone: string;
  email: string;
  ativo: boolean;
}

export interface Patient {
  id: number;
  nome: string;
  cpf: string;
  dataNascimento: string;
  sexo: 'M' | 'F' | 'O';
  telefone: string;
  email: string;
  endereco: string;
  bairro: string;
  cidade: string;
  uf: string;
  alergias: string;
  convenio: string;
  ativo: boolean;
  criadoEm: string;
}

export type AppointmentStatus = 'AGENDADO' | 'CONFIRMADO' | 'EM_ATENDIMENTO' | 'CONCLUIDO' | 'CANCELADO' | 'FALTOU';

export interface Appointment {
  id: number;
  pacienteId: number;
  medicoId: number;
  enfermeiroId?: number;
  dataAgenda: string;
  horario: string;
  periodo: 'MANHÃ' | 'TARDE' | 'NOITE';
  motivo: string;
  status: AppointmentStatus;
  observacoes?: string;
  criadoPor: string;
  criadoEm: string;
  
  // Joins para visualização
  pacienteNome?: string;
  pacienteTelefone?: string;
  pacienteCpf?: string;
  medicoNome?: string;
  medicoEspecialidade?: string;
  enfermeiroNome?: string;
}

export interface PrescriptionMedication {
  id: string;
  nome: string;
  dosagem: string;
  via: string;
  frequencia: string;
  duracao: string;
  quantidade: string;
  instrucoesCasa: string;
}

export interface Prescription {
  id: number;
  codigoAutenticidade: string;
  pacienteId: number;
  pacienteNome: string;
  pacienteCpf: string;
  pacienteTelefone: string;
  pacienteConvenio?: string;
  medicoId: number;
  medicoNome: string;
  medicoCrm: string;
  medicoUfCrm: string;
  medicoEspecialidade: string;
  dataEmissao: string;
  horaEmissao: string;
  medicamentos: PrescriptionMedication[];
  orientacoesGerais: string;
  validadeDias: number;
  status: 'ATIVA' | 'DISPENSADA' | 'CANCELADA';
  criadoEm: string;
}

export interface AuditLog {
  id: number;
  usuarioId?: number;
  loginUsuario: string;
  acao: string;
  entidade: 'USUARIOS' | 'MEDICOS' | 'ENFERMEIROS' | 'PACIENTES' | 'AGENDAMENTOS' | 'RECEITAS' | 'ATENDIMENTOS' | 'SISTEMA';
  registroId?: number;
  detalhes: string;
  ipOrigem: string;
  criadoEm: string;
}

export type AtendimentoStatus = 'EM_ANDAMENTO' | 'FINALIZADO' | 'CANCELADO';

export interface SinaisVitais {
  pressaoArterial?: string; // ex: 120/80 mmHg
  frequenciaCardiaca?: string; // bpm
  temperatura?: string; // °C
  peso?: string; // kg
  altura?: string; // cm
  saturacaoO2?: string; // %
  glicemia?: string; // mg/dL
}

export interface Atendimento {
  id: number;
  pacienteId: number;
  medicoId: number;
  agendamentoId?: number;
  dataHora: string;
  status: AtendimentoStatus;
  motivoConsulta: string;
  queixaPrincipal: string;
  anamnese: string; // História da Moléstia Atual (HMA)
  historicoFamiliarSocial?: string;
  sinaisVitais: SinaisVitais;
  exameFisico: string;
  hipoteseDiagnostica: string;
  cid10?: string;
  condutaEvolucao: string;
  prescricoesIds: number[];
  observacoesRetorno?: string;
  retornoEmDias?: number;
  criadoEm: string;
  atualizadoEm?: string;

  // Metadados para visualização e histórico médico
  pacienteNome?: string;
  pacienteCpf?: string;
  pacienteTelefone?: string;
  pacienteDataNascimento?: string;
  pacienteAlergias?: string;
  pacienteConvenio?: string;
  medicoNome?: string;
  medicoCrm?: string;
  medicoUfCrm?: string;
  medicoEspecialidade?: string;
}

