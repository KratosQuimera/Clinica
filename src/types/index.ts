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

export interface AuditLog {
  id: number;
  usuarioId?: number;
  loginUsuario: string;
  acao: string;
  entidade: 'USUARIOS' | 'MEDICOS' | 'ENFERMEIROS' | 'PACIENTES' | 'AGENDAMENTOS' | 'SISTEMA';
  registroId?: number;
  detalhes: string;
  ipOrigem: string;
  criadoEm: string;
}
