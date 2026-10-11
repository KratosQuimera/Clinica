import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, Users, Activity, Calendar, Shield, 
  Search, Check, X, AlertTriangle, Info, Plus, 
  Edit3, Trash2, RotateCcw, Save, CheckCircle2, 
  Clock, ArrowLeft, Filter, Phone, Mail, FileText, ChevronRight
} from 'lucide-react';
import { 
  Doctor, Nurse, Patient, Appointment, User, 
  AppointmentStatus, UserRole 
} from '../types';
import { validarCPF, formatarCPF, validarCRM, formatarTelefone } from '../utils/validators';

interface NetBeansRealFormsProps {
  currentForm: string; // 'dashboard' | 'medicos' | 'enfermeiros' | 'pacientes' | 'agenda' | 'usuarios' | 'relatorios' | 'auditoria'
  onNavigate: (formName: string) => void;
  currentUser: User;
  
  // Dados
  doctors: Doctor[];
  nurses: Nurse[];
  patients: Patient[];
  appointments: Appointment[];
  users: User[];
  
  // Ações CRUD
  onSaveDoctor: (doc: Omit<Doctor, 'id'>, id?: number) => { success: boolean; message: string };
  onDeleteDoctor: (id: number) => { success: boolean; message: string };
  
  onSaveNurse: (nurse: Omit<Nurse, 'id'>, id?: number) => { success: boolean; message: string };
  onDeleteNurse: (id: number) => { success: boolean; message: string };
  
  onSavePatient: (patient: Omit<Patient, 'id' | 'criadoEm'>, id?: number) => { success: boolean; message: string };
  onDeletePatient: (id: number) => { success: boolean; message: string };
  
  onSaveAppointment: (app: Omit<Appointment, 'id' | 'criadoEm'>, id?: number) => { success: boolean; message: string };
  onUpdateAppointmentStatus: (id: number, status: AppointmentStatus) => { success: boolean; message: string };
  
  onSaveUser: (user: Partial<User>, id?: number) => { success: boolean; message: string };
  onToggleUserStatus: (id: number) => { success: boolean; message: string };
  onResetPassword: (id: number) => { success: boolean; message: string };
}

export const NetBeansRealForms: React.FC<NetBeansRealFormsProps> = ({
  currentForm,
  onNavigate,
  currentUser,
  doctors,
  nurses,
  patients,
  appointments,
  users,
  onSaveDoctor,
  onDeleteDoctor,
  onSaveNurse,
  onDeleteNurse,
  onSavePatient,
  onDeletePatient,
  onSaveAppointment,
  onUpdateAppointmentStatus,
  onSaveUser,
  onToggleUserStatus,
  onResetPassword,
}) => {
  // Notificação no estilo JOptionPane / QMessageBox do NetBeans
  const [dialogNotice, setDialogNotice] = useState<{
    tipo: 'info' | 'success' | 'warning' | 'error' | 'confirm';
    titulo: string;
    mensagem: string;
    onConfirm?: () => void;
  } | null>(null);

  // ===========================================================================
  // 1. ESTADOS DO FormMedico.java
  // ===========================================================================
  const [medCodigo, setMedCodigo] = useState('');
  const [medNome, setMedNome] = useState('');
  const [medCrm, setMedCrm] = useState('');
  const [medUfCrm, setMedUfCrm] = useState('SP');
  const [medEspecialidade, setMedEspecialidade] = useState('Cardiologia');
  const [medTelefone, setMedTelefone] = useState('');
  const [medEmail, setMedEmail] = useState('');
  const [medStatus, setMedStatus] = useState(true);

  const [medFieldsEnabled, setMedFieldsEnabled] = useState(false);
  const [medBtnNovoEnabled, setMedBtnNovoEnabled] = useState(true);
  const [medBtnSalvarEnabled, setMedBtnSalvarEnabled] = useState(false);
  const [medBtnCancelarEnabled, setMedBtnCancelarEnabled] = useState(false);
  const [medBtnEditarEnabled, setMedBtnEditarEnabled] = useState(false);
  const [medBtnExcluirEnabled, setMedBtnExcluirEnabled] = useState(false);
  const [medPesquisa, setMedPesquisa] = useState('');

  const medicosFiltrados = doctors.filter(d => 
    d.nome.toLowerCase().includes(medPesquisa.toLowerCase()) ||
    d.crm.includes(medPesquisa) ||
    d.especialidade.toLowerCase().includes(medPesquisa.toLowerCase()) ||
    String(d.id) === medPesquisa.trim()
  );

  const handleMedNovo = () => {
    setMedCodigo('');
    setMedNome('');
    setMedCrm('');
    setMedUfCrm('SP');
    setMedEspecialidade('Cardiologia');
    setMedTelefone('(11) 98765-4321');
    setMedEmail('');
    setMedStatus(true);

    setMedFieldsEnabled(true);
    setMedBtnNovoEnabled(false);
    setMedBtnSalvarEnabled(true);
    setMedBtnCancelarEnabled(true);
    setMedBtnEditarEnabled(false);
    setMedBtnExcluirEnabled(false);
  };

  const handleMedCancelar = () => {
    setMedCodigo('');
    setMedNome('');
    setMedCrm('');
    setMedFieldsEnabled(false);
    setMedBtnNovoEnabled(true);
    setMedBtnSalvarEnabled(false);
    setMedBtnCancelarEnabled(false);
    setMedBtnEditarEnabled(false);
    setMedBtnExcluirEnabled(false);
  };

  const handleMedSelectRow = (doc: Doctor) => {
    setMedCodigo(String(doc.id));
    setMedNome(doc.nome);
    setMedCrm(doc.crm);
    setMedUfCrm(doc.uf_crm);
    setMedEspecialidade(doc.especialidade);
    setMedTelefone(doc.telefone || '');
    setMedEmail(doc.email || '');
    setMedStatus(doc.ativo);

    setMedFieldsEnabled(false);
    setMedBtnNovoEnabled(false);
    setMedBtnSalvarEnabled(false);
    setMedBtnCancelarEnabled(true);
    setMedBtnEditarEnabled(true);
    setMedBtnExcluirEnabled(true);
  };

  const handleMedEditar = () => {
    setMedFieldsEnabled(true);
    setMedBtnSalvarEnabled(true);
    setMedBtnCancelarEnabled(true);
    setMedBtnEditarEnabled(false);
  };

  const handleMedSalvar = () => {
    if (!medNome.trim() || medNome.trim().length < 3) {
      setDialogNotice({
        tipo: 'warning',
        titulo: 'Aviso de Validação',
        mensagem: 'O nome completo do médico deve conter ao menos 3 caracteres.',
      });
      return;
    }
    const crmVal = validarCRM(medCrm);
    if (!crmVal.valido) {
      setDialogNotice({
        tipo: 'warning',
        titulo: 'CRM Inválido',
        mensagem: crmVal.mensagem,
      });
      return;
    }

    const payload = {
      nome: medNome.trim(),
      crm: medCrm.trim(),
      uf_crm: medUfCrm,
      especialidade: medEspecialidade,
      telefone: medTelefone.trim() || '(11) 98765-4321',
      email: medEmail.trim() || `${medNome.toLowerCase().replace(/[^a-z]/g, '')}@clinestudo.com.br`,
      ativo: medStatus,
    };

    const res = onSaveDoctor(payload, medCodigo ? Number(medCodigo) : undefined);
    if (res.success) {
      setDialogNotice({
        tipo: 'success',
        titulo: 'Sucesso',
        mensagem: res.message,
      });
      handleMedCancelar();
    } else {
      setDialogNotice({
        tipo: 'error',
        titulo: 'Erro ao Salvar',
        mensagem: res.message,
      });
    }
  };

  const handleMedExcluir = () => {
    if (!medCodigo) return;
    setDialogNotice({
      tipo: 'confirm',
      titulo: 'Confirmação de Exclusão',
      mensagem: `Deseja realmente desativar logicamente o médico ${medNome} (Código ${medCodigo})?`,
      onConfirm: () => {
        const res = onDeleteDoctor(Number(medCodigo));
        setDialogNotice({
          tipo: 'info',
          titulo: 'Resultado',
          mensagem: res.message,
        });
        handleMedCancelar();
      }
    });
  };

  // ===========================================================================
  // 2. ESTADOS DO FormPacientes.java
  // ===========================================================================
  const [pacCodigo, setPacCodigo] = useState('');
  const [pacNome, setPacNome] = useState('');
  const [pacCpf, setPacCpf] = useState('');
  const [pacDataNasc, setPacDataNasc] = useState('1990-01-01');
  const [pacSexo, setPacSexo] = useState<'M' | 'F' | 'O'>('F');
  const [pacTelefone, setPacTelefone] = useState('');
  const [pacEmail, setPacEmail] = useState('');
  const [pacEndereco, setPacEndereco] = useState('');
  const [pacBairro, setPacBairro] = useState('');
  const [pacCidade, setPacCidade] = useState('São Paulo');
  const [pacUf, setPacUf] = useState('SP');
  const [pacConvenio, setPacConvenio] = useState('Unimed Saúde');
  const [pacAlergias, setPacAlergias] = useState('');
  const [pacStatus, setPacStatus] = useState(true);

  const [pacFieldsEnabled, setPacFieldsEnabled] = useState(false);
  const [pacBtnNovoEnabled, setPacBtnNovoEnabled] = useState(true);
  const [pacBtnSalvarEnabled, setPacBtnSalvarEnabled] = useState(false);
  const [pacBtnCancelarEnabled, setPacBtnCancelarEnabled] = useState(false);
  const [pacBtnEditarEnabled, setPacBtnEditarEnabled] = useState(false);
  const [pacBtnExcluirEnabled, setPacBtnExcluirEnabled] = useState(false);
  const [pacPesquisa, setPacPesquisa] = useState('');

  const pacientesFiltrados = patients.filter(p => 
    p.nome.toLowerCase().includes(pacPesquisa.toLowerCase()) ||
    p.cpf.includes(pacPesquisa) ||
    p.telefone.includes(pacPesquisa) ||
    String(p.id) === pacPesquisa.trim()
  );

  const handlePacNovo = () => {
    setPacCodigo('');
    setPacNome('');
    setPacCpf('');
    setPacDataNasc('1990-01-01');
    setPacSexo('F');
    setPacTelefone('');
    setPacEmail('');
    setPacEndereco('');
    setPacBairro('');
    setPacCidade('São Paulo');
    setPacUf('SP');
    setPacConvenio('Unimed Saúde');
    setPacAlergias('');
    setPacStatus(true);

    setPacFieldsEnabled(true);
    setPacBtnNovoEnabled(false);
    setPacBtnSalvarEnabled(true);
    setPacBtnCancelarEnabled(true);
    setPacBtnEditarEnabled(false);
    setPacBtnExcluirEnabled(false);
  };

  const handlePacCancelar = () => {
    setPacCodigo('');
    setPacNome('');
    setPacCpf('');
    setPacFieldsEnabled(false);
    setPacBtnNovoEnabled(true);
    setPacBtnSalvarEnabled(false);
    setPacBtnCancelarEnabled(false);
    setPacBtnEditarEnabled(false);
    setPacBtnExcluirEnabled(false);
  };

  const handlePacSelectRow = (p: Patient) => {
    setPacCodigo(String(p.id));
    setPacNome(p.nome);
    setPacCpf(p.cpf);
    setPacDataNasc(p.dataNascimento);
    setPacSexo(p.sexo);
    setPacTelefone(p.telefone);
    setPacEmail(p.email);
    setPacEndereco(p.endereco);
    setPacBairro(p.bairro);
    setPacCidade(p.cidade);
    setPacUf(p.uf);
    setPacConvenio(p.convenio);
    setPacAlergias(p.alergias || '');
    setPacStatus(p.ativo);

    setPacFieldsEnabled(false);
    setPacBtnNovoEnabled(false);
    setPacBtnSalvarEnabled(false);
    setPacBtnCancelarEnabled(true);
    setPacBtnEditarEnabled(true);
    setPacBtnExcluirEnabled(true);
  };

  const handlePacEditar = () => {
    setPacFieldsEnabled(true);
    setPacBtnSalvarEnabled(true);
    setPacBtnCancelarEnabled(true);
    setPacBtnEditarEnabled(false);
  };

  const handlePacSalvar = () => {
    if (!pacNome.trim() || pacNome.trim().length < 3) {
      setDialogNotice({
        tipo: 'warning',
        titulo: 'Aviso',
        mensagem: 'O nome do paciente deve conter ao menos 3 caracteres.',
      });
      return;
    }
    const cleanCpf = pacCpf.replace(/\D/g, '');
    if (cleanCpf && !validarCPF(cleanCpf)) {
      setDialogNotice({
        tipo: 'warning',
        titulo: 'CPF Inválido',
        mensagem: 'O CPF informado não é válido de acordo com o algoritmo oficial do Ministério da Fazenda.',
      });
      return;
    }

    const payload = {
      nome: pacNome.trim(),
      cpf: cleanCpf ? formatarCPF(cleanCpf) : '',
      dataNascimento: pacDataNasc,
      sexo: pacSexo,
      telefone: pacTelefone.trim() || '(11) 90000-0000',
      email: pacEmail.trim() || `${pacNome.toLowerCase().replace(/[^a-z]/g, '')}@paciente.com.br`,
      endereco: pacEndereco.trim() || 'Rua das Flores, 100',
      bairro: pacBairro.trim() || 'Centro',
      cidade: pacCidade.trim() || 'São Paulo',
      uf: pacUf,
      alergias: pacAlergias.trim(),
      convenio: pacConvenio,
      ativo: pacStatus,
    };

    const res = onSavePatient(payload, pacCodigo ? Number(pacCodigo) : undefined);
    if (res.success) {
      setDialogNotice({
        tipo: 'success',
        titulo: 'Sucesso',
        mensagem: res.message,
      });
      handlePacCancelar();
    } else {
      setDialogNotice({
        tipo: 'error',
        titulo: 'Erro ao Salvar',
        mensagem: res.message,
      });
    }
  };

  const handlePacExcluir = () => {
    if (!pacCodigo) return;
    setDialogNotice({
      tipo: 'confirm',
      titulo: 'Confirmação',
      mensagem: `Deseja realmente desativar o cadastro do paciente ${pacNome}?`,
      onConfirm: () => {
        const res = onDeletePatient(Number(pacCodigo));
        setDialogNotice({
          tipo: 'info',
          titulo: 'Resultado',
          mensagem: res.message,
        });
        handlePacCancelar();
      }
    });
  };

  // ===========================================================================
  // 3. ESTADOS DO FormEnfermeira.java
  // ===========================================================================
  const [enfCodigo, setEnfCodigo] = useState('');
  const [enfNome, setEnfNome] = useState('');
  const [enfCoren, setEnfCoren] = useState('');
  const [enfUfCoren, setEnfUfCoren] = useState('SP');
  const [enfSetor, setEnfSetor] = useState('Triagem e Acolhimento');
  const [enfTurno, setEnfTurno] = useState<Nurse['turno']>('MANHÃ');
  const [enfTelefone, setEnfTelefone] = useState('');
  const [enfEmail, setEnfEmail] = useState('');
  const [enfStatus, setEnfStatus] = useState(true);

  const [enfFieldsEnabled, setEnfFieldsEnabled] = useState(false);
  const [enfBtnNovoEnabled, setEnfBtnNovoEnabled] = useState(true);
  const [enfBtnSalvarEnabled, setEnfBtnSalvarEnabled] = useState(false);
  const [enfBtnCancelarEnabled, setEnfBtnCancelarEnabled] = useState(false);
  const [enfBtnEditarEnabled, setEnfBtnEditarEnabled] = useState(false);
  const [enfBtnExcluirEnabled, setEnfBtnExcluirEnabled] = useState(false);
  const [enfPesquisa, setEnfPesquisa] = useState('');

  const enfermeirosFiltrados = nurses.filter(n => 
    n.nome.toLowerCase().includes(enfPesquisa.toLowerCase()) ||
    n.coren.includes(enfPesquisa) ||
    n.setor.toLowerCase().includes(enfPesquisa.toLowerCase()) ||
    String(n.id) === enfPesquisa.trim()
  );

  const handleEnfNovo = () => {
    setEnfCodigo('');
    setEnfNome('');
    setEnfCoren('');
    setEnfUfCoren('SP');
    setEnfSetor('Triagem e Acolhimento');
    setEnfTurno('MANHÃ');
    setEnfTelefone('(11) 95432-1098');
    setEnfEmail('');
    setEnfStatus(true);

    setEnfFieldsEnabled(true);
    setEnfBtnNovoEnabled(false);
    setEnfBtnSalvarEnabled(true);
    setEnfBtnCancelarEnabled(true);
    setEnfBtnEditarEnabled(false);
    setEnfBtnExcluirEnabled(false);
  };

  const handleEnfCancelar = () => {
    setEnfCodigo('');
    setEnfNome('');
    setEnfCoren('');
    setEnfFieldsEnabled(false);
    setEnfBtnNovoEnabled(true);
    setEnfBtnSalvarEnabled(false);
    setEnfBtnCancelarEnabled(false);
    setEnfBtnEditarEnabled(false);
    setEnfBtnExcluirEnabled(false);
  };

  const handleEnfSelectRow = (n: Nurse) => {
    setEnfCodigo(String(n.id));
    setEnfNome(n.nome);
    setEnfCoren(n.coren);
    setEnfUfCoren(n.uf_coren);
    setEnfSetor(n.setor);
    setEnfTurno(n.turno);
    setEnfTelefone(n.telefone);
    setEnfEmail(n.email);
    setEnfStatus(n.ativo);

    setEnfFieldsEnabled(false);
    setEnfBtnNovoEnabled(false);
    setEnfBtnSalvarEnabled(false);
    setEnfBtnCancelarEnabled(true);
    setEnfBtnEditarEnabled(true);
    setEnfBtnExcluirEnabled(true);
  };

  const handleEnfEditar = () => {
    setEnfFieldsEnabled(true);
    setEnfBtnSalvarEnabled(true);
    setEnfBtnCancelarEnabled(true);
    setEnfBtnEditarEnabled(false);
  };

  const handleEnfSalvar = () => {
    if (!enfNome.trim() || enfNome.trim().length < 3) {
      setDialogNotice({
        tipo: 'warning',
        titulo: 'Aviso',
        mensagem: 'O nome da profissional de enfermagem deve ter ao menos 3 caracteres.',
      });
      return;
    }
    if (!enfCoren.trim() || enfCoren.trim().length < 4) {
      setDialogNotice({
        tipo: 'warning',
        titulo: 'COREN Inválido',
        mensagem: 'Informe o número de registro COREN completo.',
      });
      return;
    }

    const payload = {
      nome: enfNome.trim(),
      coren: enfCoren.trim(),
      uf_coren: enfUfCoren,
      setor: enfSetor,
      turno: enfTurno,
      telefone: enfTelefone.trim() || '(11) 95432-1098',
      email: enfEmail.trim() || `${enfNome.toLowerCase().replace(/[^a-z]/g, '')}@clinestudo.com.br`,
      ativo: enfStatus,
    };

    const res = onSaveNurse(payload, enfCodigo ? Number(enfCodigo) : undefined);
    if (res.success) {
      setDialogNotice({
        tipo: 'success',
        titulo: 'Sucesso',
        mensagem: res.message,
      });
      handleEnfCancelar();
    } else {
      setDialogNotice({
        tipo: 'error',
        titulo: 'Erro ao Salvar',
        mensagem: res.message,
      });
    }
  };

  const handleEnfExcluir = () => {
    if (!enfCodigo) return;
    setDialogNotice({
      tipo: 'confirm',
      titulo: 'Confirmação',
      mensagem: `Deseja realmente desativar a enfermeira ${enfNome}?`,
      onConfirm: () => {
        const res = onDeleteNurse(Number(enfCodigo));
        setDialogNotice({
          tipo: 'info',
          titulo: 'Resultado',
          mensagem: res.message,
        });
        handleEnfCancelar();
      }
    });
  };

  // ===========================================================================
  // 4. ESTADOS DO FormAgenda.java
  // ===========================================================================
  const [agCodigo, setAgCodigo] = useState('');
  const [agPacienteId, setAgPacienteId] = useState<number>(patients[0]?.id || 1);
  const [agMedicoId, setAgMedicoId] = useState<number>(doctors[0]?.id || 1);
  const [agData, setAgData] = useState('2026-10-10');
  const [agHorario, setAgHorario] = useState('09:00');
  const [agPeriodo, setAgPeriodo] = useState<'MANHÃ' | 'TARDE' | 'NOITE'>('MANHÃ');
  const [agMotivo, setAgMotivo] = useState('Consulta de Rotina e Check-up');
  const [agStatus, setAgStatus] = useState<AppointmentStatus>('AGENDADO');
  const [agObservacoes, setAgObservacoes] = useState('');

  const [agFieldsEnabled, setAgFieldsEnabled] = useState(false);
  const [agBtnNovoEnabled, setAgBtnNovoEnabled] = useState(true);
  const [agBtnSalvarEnabled, setAgBtnSalvarEnabled] = useState(false);
  const [agBtnCancelarEnabled, setAgBtnCancelarEnabled] = useState(false);

  const [agFiltroData, setAgFiltroData] = useState('TODAS');
  const [agFiltroMedico, setAgFiltroMedico] = useState('TODOS');
  const [agFiltroStatus, setAgFiltroStatus] = useState('TODOS');

  const agendamentosFiltrados = appointments.filter(a => {
    const matchData = agFiltroData === 'TODAS' || a.dataAgenda === agFiltroData;
    const matchMed = agFiltroMedico === 'TODOS' || String(a.medicoId) === agFiltroMedico;
    const matchStat = agFiltroStatus === 'TODOS' || a.status === agFiltroStatus;
    return matchData && matchMed && matchStat;
  });

  const handleAgNovo = () => {
    setAgCodigo('');
    setAgPacienteId(patients[0]?.id || 1);
    setAgMedicoId(doctors[0]?.id || 1);
    setAgData('2026-10-10');
    setAgHorario('09:00');
    setAgPeriodo('MANHÃ');
    setAgMotivo('Consulta de Rotina / Retorno');
    setAgStatus('AGENDADO');
    setAgObservacoes('');

    setAgFieldsEnabled(true);
    setAgBtnNovoEnabled(false);
    setAgBtnSalvarEnabled(true);
    setAgBtnCancelarEnabled(true);
  };

  const handleAgCancelar = () => {
    setAgCodigo('');
    setAgFieldsEnabled(false);
    setAgBtnNovoEnabled(true);
    setAgBtnSalvarEnabled(false);
    setAgBtnCancelarEnabled(false);
  };

  const handleAgSelectRow = (a: Appointment) => {
    setAgCodigo(String(a.id));
    setAgPacienteId(a.pacienteId);
    setAgMedicoId(a.medicoId);
    setAgData(a.dataAgenda);
    setAgHorario(a.horario);
    setAgPeriodo(a.periodo);
    setAgMotivo(a.motivo);
    setAgStatus(a.status);
    setAgObservacoes(a.observacoes || '');

    setAgFieldsEnabled(true);
    setAgBtnNovoEnabled(false);
    setAgBtnSalvarEnabled(true);
    setAgBtnCancelarEnabled(true);
  };

  const handleAgSalvar = () => {
    if (!agMotivo.trim()) {
      setDialogNotice({
        tipo: 'warning',
        titulo: 'Aviso',
        mensagem: 'Informe o motivo da consulta.',
      });
      return;
    }

    const payload = {
      pacienteId: agPacienteId,
      medicoId: agMedicoId,
      dataAgenda: agData,
      horario: agHorario,
      periodo: agPeriodo,
      motivo: agMotivo.trim(),
      status: agStatus,
      observacoes: agObservacoes.trim(),
      criadoPor: currentUser.login,
    };

    const res = onSaveAppointment(payload, agCodigo ? Number(agCodigo) : undefined);
    if (res.success) {
      setDialogNotice({
        tipo: 'success',
        titulo: 'Sucesso',
        mensagem: res.message,
      });
      handleAgCancelar();
    } else {
      setDialogNotice({
        tipo: 'error',
        titulo: 'Conflito de Horário',
        mensagem: res.message,
      });
    }
  };

  // ===========================================================================
  // 5. ESTADOS DO FormUsuario.java
  // ===========================================================================
  const [usrCodigo, setUsrCodigo] = useState('');
  const [usrNome, setUsrNome] = useState('');
  const [usrLogin, setUsrLogin] = useState('');
  const [usrSenha, setUsrSenha] = useState('clinica123');
  const [usrPerfil, setUsrPerfil] = useState<UserRole>('RECEPCIONISTA');
  const [usrAtivo, setUsrAtivo] = useState(true);

  const [usrFieldsEnabled, setUsrFieldsEnabled] = useState(false);
  const [usrBtnNovoEnabled, setUsrBtnNovoEnabled] = useState(true);
  const [usrBtnSalvarEnabled, setUsrBtnSalvarEnabled] = useState(false);
  const [usrBtnCancelarEnabled, setUsrBtnCancelarEnabled] = useState(false);

  const handleUsrNovo = () => {
    setUsrCodigo('');
    setUsrNome('');
    setUsrLogin('');
    setUsrSenha('clinica123');
    setUsrPerfil('RECEPCIONISTA');
    setUsrAtivo(true);

    setUsrFieldsEnabled(true);
    setUsrBtnNovoEnabled(false);
    setUsrBtnSalvarEnabled(true);
    setUsrBtnCancelarEnabled(true);
  };

  const handleUsrCancelar = () => {
    setUsrCodigo('');
    setUsrFieldsEnabled(false);
    setUsrBtnNovoEnabled(true);
    setUsrBtnSalvarEnabled(false);
    setUsrBtnCancelarEnabled(false);
  };

  const handleUsrSelectRow = (u: User) => {
    setUsrCodigo(String(u.id));
    setUsrNome(u.nome);
    setUsrLogin(u.login);
    setUsrSenha('********');
    setUsrPerfil(u.perfil);
    setUsrAtivo(u.ativo);

    setUsrFieldsEnabled(true);
    setUsrBtnNovoEnabled(false);
    setUsrBtnSalvarEnabled(true);
    setUsrBtnCancelarEnabled(true);
  };

  const handleUsrSalvar = () => {
    if (!usrNome.trim() || !usrLogin.trim()) {
      setDialogNotice({
        tipo: 'warning',
        titulo: 'Aviso',
        mensagem: 'Nome e Login são obrigatórios.',
      });
      return;
    }

    const payload: Partial<User> = {
      nome: usrNome.trim(),
      login: usrLogin.trim().toLowerCase(),
      perfil: usrPerfil,
      ativo: usrAtivo,
    };

    const res = onSaveUser(payload, usrCodigo ? Number(usrCodigo) : undefined);
    if (res.success) {
      setDialogNotice({
        tipo: 'success',
        titulo: 'Sucesso',
        mensagem: res.message,
      });
      handleUsrCancelar();
    } else {
      setDialogNotice({
        tipo: 'error',
        titulo: 'Erro',
        mensagem: res.message,
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 select-none">
      {/* Diálogo QMessageBox / NetBeans Popup Modal */}
      {dialogNotice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            {/* Window title bar */}
            <div className="h-7 bg-slate-800 border-b border-slate-700 px-3 flex items-center justify-between text-xs font-semibold text-slate-200">
              <span className="flex items-center gap-1.5">
                {dialogNotice.tipo === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {dialogNotice.tipo === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                {dialogNotice.tipo === 'error' && <X className="w-3.5 h-3.5 text-rose-400" />}
                {dialogNotice.tipo === 'info' && <Info className="w-3.5 h-3.5 text-sky-400" />}
                {dialogNotice.tipo === 'confirm' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                {dialogNotice.titulo}
              </span>
              <button 
                onClick={() => setDialogNotice(null)}
                className="w-4 h-4 rounded flex items-center justify-center hover:bg-slate-700 text-slate-400"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {dialogNotice.mensagem}
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                {dialogNotice.tipo === 'confirm' ? (
                  <>
                    <button
                      onClick={() => setDialogNotice(null)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (dialogNotice.onConfirm) dialogNotice.onConfirm();
                        setDialogNotice(null);
                      }}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold cursor-pointer"
                    >
                      Confirmar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setDialogNotice(null)}
                    className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold cursor-pointer"
                  >
                    OK
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TELA BEM-VINDOS (PADRÃO NETBEANS CLÁSSICO)                            */}
      {/* ===================================================================== */}
      {(currentForm === 'dashboard' || currentForm === 'bem_vindos') && (
        <div className="p-8 max-w-4xl mx-auto w-full my-auto space-y-6">
          {/* Card Central NetBeans JInternalFrame */}
          <div className="bg-slate-900 border border-sky-500/40 rounded-lg shadow-2xl overflow-hidden">
            {/* Header com estilo NetBeans */}
            <div className="bg-gradient-to-r from-slate-900 via-sky-950/50 to-slate-900 px-4 py-3 border-b border-sky-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-xs">
                  C
                </div>
                <h2 className="text-sm font-bold text-sky-300 tracking-wide">
                  Sistema de Gerenciamento de: Consultas e Procedimentos Clínicos
                </h2>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Usuário: <span className="text-emerald-400 font-bold">{currentUser.login}</span> ({currentUser.perfil})
              </div>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-xs text-slate-300">
                Selecione um dos formulários de cadastro ou atendimento abaixo para iniciar:
              </p>

              {/* 4 Botões grandes da Tela Principal NetBeans */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => onNavigate('medicos')}
                  className="flex flex-col items-center justify-center p-6 bg-slate-950 hover:bg-sky-950/40 border border-sky-500/50 hover:border-sky-400 rounded-lg transition-all group cursor-pointer shadow"
                >
                  <div className="p-3 rounded-full bg-sky-500/10 text-sky-400 mb-2 group-hover:scale-110 transition-transform">
                    <Stethoscope className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-bold text-white group-hover:text-sky-300">
                    👨‍⚕️ Cad. Médicos
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    FormMedico · CRM e Especialidades
                  </span>
                </button>

                <button
                  onClick={() => onNavigate('enfermeiros')}
                  className="flex flex-col items-center justify-center p-6 bg-slate-950 hover:bg-purple-950/40 border border-purple-500/50 hover:border-purple-400 rounded-lg transition-all group cursor-pointer shadow"
                >
                  <div className="p-3 rounded-full bg-purple-500/10 text-purple-400 mb-2 group-hover:scale-110 transition-transform">
                    <Activity className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-bold text-white group-hover:text-purple-300">
                    👩‍⚕️ Cad. Enfermeiras
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    FormEnfermeira · COREN e Setores
                  </span>
                </button>

                <button
                  onClick={() => onNavigate('pacientes')}
                  className="flex flex-col items-center justify-center p-6 bg-slate-950 hover:bg-emerald-950/40 border border-emerald-500/50 hover:border-emerald-400 rounded-lg transition-all group cursor-pointer shadow"
                >
                  <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 mb-2 group-hover:scale-110 transition-transform">
                    <Users className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-bold text-white group-hover:text-emerald-300">
                    👥 Cad. Pacientes
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    FormPacientes · CPF e Prontuários
                  </span>
                </button>

                <button
                  onClick={() => onNavigate('agenda')}
                  className="flex flex-col items-center justify-center p-6 bg-slate-950 hover:bg-amber-950/40 border border-amber-500/50 hover:border-amber-400 rounded-lg transition-all group cursor-pointer shadow"
                >
                  <div className="p-3 rounded-full bg-amber-500/10 text-amber-400 mb-2 group-hover:scale-110 transition-transform">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-bold text-white group-hover:text-amber-300">
                    📅 Agenda
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    FormAgenda · Consultas e Horários
                  </span>
                </button>
              </div>

              {/* Atalhos auxiliares */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex gap-4">
                  {currentUser.perfil === 'ADMINISTRADOR' && (
                    <button
                      onClick={() => onNavigate('usuarios')}
                      className="hover:text-sky-300 cursor-pointer flex items-center gap-1"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-400" /> Cad. Usuários
                    </button>
                  )}
                  <button
                    onClick={() => onNavigate('relatorios')}
                    className="hover:text-sky-300 cursor-pointer flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-400" /> Relatórios
                  </button>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">
                  ● Sistema Clínico Operacional
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* FORM MÉDICO (FormMedico.java)                                         */}
      {/* ===================================================================== */}
      {currentForm === 'medicos' && (
        <div className="p-4 max-w-5xl mx-auto w-full space-y-4">
          <div className="bg-slate-900 border border-sky-500/40 rounded-lg shadow-xl overflow-hidden">
            {/* Header da Janela */}
            <div className="bg-slate-850 px-4 py-2 border-b border-slate-700 flex items-center justify-between text-xs font-semibold text-slate-200">
              <span className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-sky-400" />
                Cadastro de Médicos (FormMedico)
              </span>
              <button 
                onClick={() => onNavigate('dashboard')}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
              >
                <ArrowLeft className="w-3 h-3" /> Voltar à Tela Principal
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              {/* Painel de Campos */}
              <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-3">
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-2">
                    <label className="block text-slate-400 mb-1">Código:</label>
                    <input 
                      type="text" 
                      disabled 
                      value={medCodigo}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-400 font-mono"
                      placeholder="Auto"
                    />
                  </div>

                  <div className="col-span-6">
                    <label className="block text-slate-300 mb-1">Nome do Médico: *</label>
                    <input 
                      type="text" 
                      disabled={!medFieldsEnabled}
                      value={medNome}
                      onChange={e => setMedNome(e.target.value)}
                      placeholder="Ex: Dr. Roberto Silva"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 rounded px-2.5 py-1.5 text-white disabled:opacity-50"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-slate-300 mb-1">CRM: *</label>
                    <input 
                      type="text" 
                      disabled={!medFieldsEnabled}
                      value={medCrm}
                      onChange={e => setMedCrm(e.target.value)}
                      placeholder="Ex: 123456"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 rounded px-2.5 py-1.5 text-white disabled:opacity-50"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-slate-300 mb-1">UF CRM:</label>
                    <select
                      disabled={!medFieldsEnabled}
                      value={medUfCrm}
                      onChange={e => setMedUfCrm(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white disabled:opacity-50"
                    >
                      {['SP', 'RJ', 'MG', 'RS', 'PR', 'BA', 'PE', 'CE', 'DF', 'SC'].map(uf => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-4">
                    <label className="block text-slate-300 mb-1">Especialidade: *</label>
                    <select
                      disabled={!medFieldsEnabled}
                      value={medEspecialidade}
                      onChange={e => setMedEspecialidade(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white disabled:opacity-50"
                    >
                      <option value="Cardiologia">Cardiologia</option>
                      <option value="Pediatria">Pediatria</option>
                      <option value="Ortopedia e Traumatologia">Ortopedia e Traumatologia</option>
                      <option value="Dermatologia">Dermatologia</option>
                      <option value="Ginecologia e Obstetrícia">Ginecologia e Obstetrícia</option>
                      <option value="Clínica Geral">Clínica Geral</option>
                      <option value="Neurologia">Neurologia</option>
                      <option value="Oftalmologia">Oftalmologia</option>
                    </select>
                  </div>

                  <div className="col-span-4">
                    <label className="block text-slate-300 mb-1">Telefone Contato:</label>
                    <input 
                      type="text" 
                      disabled={!medFieldsEnabled}
                      value={medTelefone}
                      onChange={e => setMedTelefone(e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white disabled:opacity-50"
                    />
                  </div>

                  <div className="col-span-4">
                    <label className="block text-slate-300 mb-1">E-mail Corporativo:</label>
                    <input 
                      type="email" 
                      disabled={!medFieldsEnabled}
                      value={medEmail}
                      onChange={e => setMedEmail(e.target.value)}
                      placeholder="medico@clinestudo.com.br"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Barra de Botões Clássica do NetBeans */}
              <div className="flex flex-wrap items-center gap-2 py-1">
                <button
                  disabled={!medBtnNovoEnabled}
                  onClick={handleMedNovo}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Novo
                </button>

                <button
                  disabled={!medBtnSalvarEnabled}
                  onClick={handleMedSalvar}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Salvar
                </button>

                <button
                  disabled={!medBtnCancelarEnabled}
                  onClick={handleMedCancelar}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Cancelar
                </button>

                <button
                  disabled={!medBtnEditarEnabled}
                  onClick={handleMedEditar}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Editar
                </button>

                <button
                  disabled={!medBtnExcluirEnabled}
                  onClick={handleMedExcluir}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-600 disabled:opacity-40 text-white rounded font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
              </div>

              {/* Barra de Pesquisa */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input 
                    type="text" 
                    value={medPesquisa}
                    onChange={e => setMedPesquisa(e.target.value)}
                    placeholder="Digite o nome, CRM ou especialidade para pesquisar..."
                    className="w-full bg-slate-950 border border-slate-700 rounded pl-8 pr-3 py-1.5 text-white text-xs"
                  />
                </div>
                {medPesquisa && (
                  <button 
                    onClick={() => setMedPesquisa('')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* JTable de Médicos */}
              <div className="border border-slate-800 rounded overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-800/90 sticky top-0 text-slate-300 border-b border-slate-700">
                      <tr>
                        <th className="p-2 w-16">Código</th>
                        <th className="p-2">Nome</th>
                        <th className="p-2">Especialidade</th>
                        <th className="p-2">CRM</th>
                        <th className="p-2">Telefone</th>
                        <th className="p-2 w-20">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {medicosFiltrados.map((m) => {
                        const isSelected = medCodigo === String(m.id);
                        return (
                          <tr 
                            key={m.id}
                            onClick={() => handleMedSelectRow(m)}
                            className={`cursor-pointer transition-colors ${
                              isSelected 
                                ? 'bg-sky-600/30 text-sky-200 font-semibold' 
                                : 'hover:bg-slate-800/50 text-slate-300'
                            }`}
                          >
                            <td className="p-2 font-bold">{m.id}</td>
                            <td className="p-2 font-sans font-medium text-slate-100">{m.nome}</td>
                            <td className="p-2 font-sans text-sky-300">{m.especialidade}</td>
                            <td className="p-2">{m.crm}/{m.uf_crm}</td>
                            <td className="p-2">{m.telefone}</td>
                            <td className="p-2 font-sans">
                              {m.ativo ? (
                                <span className="text-emerald-400 font-semibold">Ativo</span>
                              ) : (
                                <span className="text-rose-400 font-semibold">Inativo</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {medicosFiltrados.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-500 font-sans">
                            Nenhum médico encontrado com o termo informado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 italic">
                * Clique em qualquer linha da tabela para carregar os dados nos campos acima e habilitar as opções Editar / Excluir.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* FORM PACIENTES (FormPacientes.java)                                   */}
      {/* ===================================================================== */}
      {currentForm === 'pacientes' && (
        <div className="p-4 max-w-5xl mx-auto w-full space-y-4">
          <div className="bg-slate-900 border border-sky-500/40 rounded-lg shadow-xl overflow-hidden">
            <div className="bg-slate-850 px-4 py-2 border-b border-slate-700 flex items-center justify-between text-xs font-semibold text-slate-200">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Cadastro de Pacientes (FormPacientes)
              </span>
              <button 
                onClick={() => onNavigate('dashboard')}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
              >
                <ArrowLeft className="w-3 h-3" /> Voltar à Tela Principal
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              {/* Painel de Campos do Paciente */}
              <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-3">
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-2">
                    <label className="block text-slate-400 mb-1">Código:</label>
                    <input 
                      type="text" 
                      disabled 
                      value={pacCodigo}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-400 font-mono"
                      placeholder="Auto"
                    />
                  </div>

                  <div className="col-span-6">
                    <label className="block text-slate-300 mb-1">Nome Completo do Paciente: *</label>
                    <input 
                      type="text" 
                      disabled={!pacFieldsEnabled}
                      value={pacNome}
                      onChange={e => setPacNome(e.target.value)}
                      placeholder="Ex: Maria Aparecida Santos"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded px-2.5 py-1.5 text-white disabled:opacity-50"
                    />
                  </div>

                  <div className="col-span-4">
                    <label className="block text-slate-300 mb-1">CPF (com validação oficial):</label>
                    <input 
                      type="text" 
                      disabled={!pacFieldsEnabled}
                      value={pacCpf}
                      onChange={e => setPacCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded px-2.5 py-1.5 text-white disabled:opacity-50 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-3">
                    <label className="block text-slate-300 mb-1">Data Nascimento:</label>
                    <input 
                      type="date" 
                      disabled={!pacFieldsEnabled}
                      value={pacDataNasc}
                      onChange={e => setPacDataNasc(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white disabled:opacity-50"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-slate-300 mb-1">Sexo:</label>
                    <select
                      disabled={!pacFieldsEnabled}
                      value={pacSexo}
                      onChange={e => setPacSexo(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white disabled:opacity-50"
                    >
                      <option value="F">Feminino</option>
                      <option value="M">Masculino</option>
                      <option value="O">Outro</option>
                    </select>
                  </div>

                  <div className="col-span-3">
                    <label className="block text-slate-300 mb-1">Telefone Celular:</label>
                    <input 
                      type="text" 
                      disabled={!pacFieldsEnabled}
                      value={pacTelefone}
                      onChange={e => setPacTelefone(e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white disabled:opacity-50"
                    />
                  </div>

                  <div className="col-span-4">
                    <label className="block text-slate-300 mb-1">Plano de Saúde / Convênio:</label>
                    <select
                      disabled={!pacFieldsEnabled}
                      value={pacConvenio}
                      onChange={e => setPacConvenio(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white disabled:opacity-50"
                    >
                      <option value="Unimed Saúde">Unimed Saúde</option>
                      <option value="Bradesco Saúde">Bradesco Saúde</option>
                      <option value="Amil Assistência">Amil Assistência</option>
                      <option value="SulAmérica Saúde">SulAmérica Saúde</option>
                      <option value="PARTICULAR">PARTICULAR (Sem Convênio)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-6">
                    <label className="block text-slate-300 mb-1">Endereço Residencial:</label>
                    <input 
                      type="text" 
                      disabled={!pacFieldsEnabled}
                      value={pacEndereco}
                      onChange={e => setPacEndereco(e.target.value)}
                      placeholder="Ex: Av. Paulista, 1578"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white disabled:opacity-50"
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="block text-slate-300 mb-1">Bairro:</label>
                    <input 
                      type="text" 
                      disabled={!pacFieldsEnabled}
                      value={pacBairro}
                      onChange={e => setPacBairro(e.target.value)}
                      placeholder="Bela Vista"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white disabled:opacity-50"
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="block text-slate-300 mb-1">Cidade / UF:</label>
                    <div className="flex gap-1.5">
                      <input 
                        type="text" 
                        disabled={!pacFieldsEnabled}
                        value={pacCidade}
                        onChange={e => setPacCidade(e.target.value)}
                        className="w-2/3 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white disabled:opacity-50"
                      />
                      <input 
                        type="text" 
                        disabled={!pacFieldsEnabled}
                        value={pacUf}
                        onChange={e => setPacUf(e.target.value)}
                        className="w-1/3 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white disabled:opacity-50 text-center font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões NetBeans */}
              <div className="flex flex-wrap items-center gap-2 py-1">
                <button
                  disabled={!pacBtnNovoEnabled}
                  onClick={handlePacNovo}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Novo
                </button>

                <button
                  disabled={!pacBtnSalvarEnabled}
                  onClick={handlePacSalvar}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Salvar
                </button>

                <button
                  disabled={!pacBtnCancelarEnabled}
                  onClick={handlePacCancelar}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Cancelar
                </button>

                <button
                  disabled={!pacBtnEditarEnabled}
                  onClick={handlePacEditar}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Editar
                </button>

                <button
                  disabled={!pacBtnExcluirEnabled}
                  onClick={handlePacExcluir}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-600 disabled:opacity-40 text-white rounded font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
              </div>

              {/* Busca de Pacientes */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input 
                    type="text" 
                    value={pacPesquisa}
                    onChange={e => setPacPesquisa(e.target.value)}
                    placeholder="Pesquisar paciente por nome, CPF ou telefone..."
                    className="w-full bg-slate-950 border border-slate-700 rounded pl-8 pr-3 py-1.5 text-white text-xs"
                  />
                </div>
                {pacPesquisa && (
                  <button 
                    onClick={() => setPacPesquisa('')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* JTable Pacientes */}
              <div className="border border-slate-800 rounded overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-800/90 sticky top-0 text-slate-300 border-b border-slate-700">
                      <tr>
                        <th className="p-2 w-16">Código</th>
                        <th className="p-2">Nome do Paciente</th>
                        <th className="p-2">CPF</th>
                        <th className="p-2">Telefone</th>
                        <th className="p-2">Convênio</th>
                        <th className="p-2">Bairro/Cidade</th>
                        <th className="p-2 w-20">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {pacientesFiltrados.map((p) => {
                        const isSelected = pacCodigo === String(p.id);
                        return (
                          <tr 
                            key={p.id}
                            onClick={() => handlePacSelectRow(p)}
                            className={`cursor-pointer transition-colors ${
                              isSelected 
                                ? 'bg-emerald-600/30 text-emerald-200 font-semibold' 
                                : 'hover:bg-slate-800/50 text-slate-300'
                            }`}
                          >
                            <td className="p-2 font-bold">{p.id}</td>
                            <td className="p-2 font-sans font-medium text-slate-100">{p.nome}</td>
                            <td className="p-2">{p.cpf || 'Não Informado'}</td>
                            <td className="p-2">{p.telefone}</td>
                            <td className="p-2 font-sans text-sky-300">{p.convenio}</td>
                            <td className="p-2 font-sans">{p.bairro} - {p.cidade}</td>
                            <td className="p-2 font-sans">
                              {p.ativo ? (
                                <span className="text-emerald-400 font-semibold">Ativo</span>
                              ) : (
                                <span className="text-rose-400 font-semibold">Inativo</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {pacientesFiltrados.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-slate-500 font-sans">
                            Nenhum paciente cadastrado encontrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* FORM ENFERMEIRA (FormEnfermeira.java)                                 */}
      {/* ===================================================================== */}
      {currentForm === 'enfermeiros' && (
        <div className="p-4 max-w-5xl mx-auto w-full space-y-4">
          <div className="bg-slate-900 border border-sky-500/40 rounded-lg shadow-xl overflow-hidden">
            <div className="bg-slate-850 px-4 py-2 border-b border-slate-700 flex items-center justify-between text-xs font-semibold text-slate-200">
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                Cadastro de Enfermeiras (FormEnfermeira)
              </span>
              <button 
                onClick={() => onNavigate('dashboard')}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
              >
                <ArrowLeft className="w-3 h-3" /> Voltar à Tela Principal
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-3">
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-2">
                    <label className="block text-slate-400 mb-1">Código:</label>
                    <input 
                      type="text" 
                      disabled 
                      value={enfCodigo}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-400 font-mono"
                      placeholder="Auto"
                    />
                  </div>

                  <div className="col-span-6">
                    <label className="block text-slate-300 mb-1">Nome da Profissional: *</label>
                    <input 
                      type="text" 
                      disabled={!enfFieldsEnabled}
                      value={enfNome}
                      onChange={e => setEnfNome(e.target.value)}
                      placeholder="Ex: Enfª Carla Santos"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-purple-500 rounded px-2.5 py-1.5 text-white disabled:opacity-50"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-slate-300 mb-1">COREN: *</label>
                    <input 
                      type="text" 
                      disabled={!enfFieldsEnabled}
                      value={enfCoren}
                      onChange={e => setEnfCoren(e.target.value)}
                      placeholder="456789"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white disabled:opacity-50"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-slate-300 mb-1">UF COREN:</label>
                    <select
                      disabled={!enfFieldsEnabled}
                      value={enfUfCoren}
                      onChange={e => setEnfUfCoren(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white disabled:opacity-50"
                    >
                      {['SP', 'RJ', 'MG', 'RS', 'PR', 'BA', 'DF', 'PE'].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-4">
                    <label className="block text-slate-300 mb-1">Setor de Atuação:</label>
                    <select
                      disabled={!enfFieldsEnabled}
                      value={enfSetor}
                      onChange={e => setEnfSetor(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white disabled:opacity-50"
                    >
                      <option value="Triagem e Acolhimento">Triagem e Acolhimento</option>
                      <option value="Ambulatório e Curativos">Ambulatório e Curativos</option>
                      <option value="Urgência e Emergência">Urgência e Emergência</option>
                      <option value="UTI Geral">UTI Geral</option>
                      <option value="Centro Cirúrgico">Centro Cirúrgico</option>
                    </select>
                  </div>

                  <div className="col-span-4">
                    <label className="block text-slate-300 mb-1">Turno de Trabalho:</label>
                    <select
                      disabled={!enfFieldsEnabled}
                      value={enfTurno}
                      onChange={e => setEnfTurno(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white disabled:opacity-50"
                    >
                      <option value="MANHÃ">Manhã (07:00 às 13:00)</option>
                      <option value="TARDE">Tarde (13:00 às 19:00)</option>
                      <option value="NOITE">Noite (19:00 às 07:00)</option>
                      <option value="12X36 DIURNO">12x36 Diurno</option>
                      <option value="12X36 NOTURNO">12x36 Noturno</option>
                    </select>
                  </div>

                  <div className="col-span-4">
                    <label className="block text-slate-300 mb-1">Telefone Contato:</label>
                    <input 
                      type="text" 
                      disabled={!enfFieldsEnabled}
                      value={enfTelefone}
                      onChange={e => setEnfTelefone(e.target.value)}
                      placeholder="(11) 95432-1098"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Botões NetBeans */}
              <div className="flex flex-wrap items-center gap-2 py-1">
                <button
                  disabled={!enfBtnNovoEnabled}
                  onClick={handleEnfNovo}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Novo
                </button>

                <button
                  disabled={!enfBtnSalvarEnabled}
                  onClick={handleEnfSalvar}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Salvar
                </button>

                <button
                  disabled={!enfBtnCancelarEnabled}
                  onClick={handleEnfCancelar}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Cancelar
                </button>

                <button
                  disabled={!enfBtnEditarEnabled}
                  onClick={handleEnfEditar}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Editar
                </button>

                <button
                  disabled={!enfBtnExcluirEnabled}
                  onClick={handleEnfExcluir}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-600 disabled:opacity-40 text-white rounded font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
              </div>

              {/* JTable Enfermeiras */}
              <div className="border border-slate-800 rounded overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-800/90 sticky top-0 text-slate-300 border-b border-slate-700">
                      <tr>
                        <th className="p-2 w-16">Código</th>
                        <th className="p-2">Nome</th>
                        <th className="p-2">COREN</th>
                        <th className="p-2">Setor</th>
                        <th className="p-2">Turno</th>
                        <th className="p-2">Telefone</th>
                        <th className="p-2 w-20">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {enfermeirosFiltrados.map((n) => {
                        const isSelected = enfCodigo === String(n.id);
                        return (
                          <tr 
                            key={n.id}
                            onClick={() => handleEnfSelectRow(n)}
                            className={`cursor-pointer transition-colors ${
                              isSelected 
                                ? 'bg-purple-600/30 text-purple-200 font-semibold' 
                                : 'hover:bg-slate-800/50 text-slate-300'
                            }`}
                          >
                            <td className="p-2 font-bold">{n.id}</td>
                            <td className="p-2 font-sans font-medium text-slate-100">{n.nome}</td>
                            <td className="p-2">{n.coren}/{n.uf_coren}</td>
                            <td className="p-2 font-sans text-sky-300">{n.setor}</td>
                            <td className="p-2 font-sans">{n.turno}</td>
                            <td className="p-2">{n.telefone}</td>
                            <td className="p-2 font-sans">
                              {n.ativo ? (
                                <span className="text-emerald-400 font-semibold">Ativo</span>
                              ) : (
                                <span className="text-rose-400 font-semibold">Inativo</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* FORM AGENDA (FormAgenda.java)                                         */}
      {/* ===================================================================== */}
      {currentForm === 'agenda' && (
        <div className="p-4 max-w-5xl mx-auto w-full space-y-4">
          <div className="bg-slate-900 border border-sky-500/40 rounded-lg shadow-xl overflow-hidden">
            <div className="bg-slate-850 px-4 py-2 border-b border-slate-700 flex items-center justify-between text-xs font-semibold text-slate-200">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                Agendamento de Consultas Clínicas (FormAgenda)
              </span>
              <button 
                onClick={() => onNavigate('dashboard')}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
              >
                <ArrowLeft className="w-3 h-3" /> Voltar à Tela Principal
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-3">
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-2">
                    <label className="block text-slate-400 mb-1">Código Agenda:</label>
                    <input 
                      type="text" 
                      disabled 
                      value={agCodigo}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-400 font-mono"
                      placeholder="Auto"
                    />
                  </div>

                  <div className="col-span-5">
                    <label className="block text-slate-300 mb-1">Paciente: *</label>
                    <select
                      disabled={!agFieldsEnabled}
                      value={agPacienteId}
                      onChange={e => setAgPacienteId(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white disabled:opacity-50"
                    >
                      {patients.filter(p => p.ativo).map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nome} (CPF: {p.cpf || 'N/I'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-5">
                    <label className="block text-slate-300 mb-1">Médico Responsável: *</label>
                    <select
                      disabled={!agFieldsEnabled}
                      value={agMedicoId}
                      onChange={e => setAgMedicoId(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white disabled:opacity-50"
                    >
                      {doctors.filter(d => d.ativo).map(d => (
                        <option key={d.id} value={d.id}>
                          {d.nome} - {d.especialidade} (CRM: {d.crm})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-3">
                    <label className="block text-slate-300 mb-1">Data da Consulta: *</label>
                    <input 
                      type="date" 
                      disabled={!agFieldsEnabled}
                      value={agData}
                      onChange={e => setAgData(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white disabled:opacity-50"
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="block text-slate-300 mb-1">Horário Agendado: *</label>
                    <select
                      disabled={!agFieldsEnabled}
                      value={agHorario}
                      onChange={e => setAgHorario(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white disabled:opacity-50 font-mono"
                    >
                      {['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'].map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-3">
                    <label className="block text-slate-300 mb-1">Turno:</label>
                    <select
                      disabled={!agFieldsEnabled}
                      value={agPeriodo}
                      onChange={e => setAgPeriodo(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white disabled:opacity-50"
                    >
                      <option value="MANHÃ">Manhã</option>
                      <option value="TARDE">Tarde</option>
                      <option value="NOITE">Noite</option>
                    </select>
                  </div>

                  <div className="col-span-3">
                    <label className="block text-slate-300 mb-1">Status do Agendamento:</label>
                    <select
                      disabled={!agFieldsEnabled}
                      value={agStatus}
                      onChange={e => setAgStatus(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white disabled:opacity-50 font-semibold"
                    >
                      <option value="AGENDADO">AGENDADO</option>
                      <option value="CONFIRMADO">CONFIRMADO</option>
                      <option value="EM_ATENDIMENTO">EM ATENDIMENTO</option>
                      <option value="CONCLUIDO">CONCLUÍDO</option>
                      <option value="CANCELADO">CANCELADO</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Motivo / Queixa Principal: *</label>
                  <input 
                    type="text" 
                    disabled={!agFieldsEnabled}
                    value={agMotivo}
                    onChange={e => setAgMotivo(e.target.value)}
                    placeholder="Ex: Consulta de rotina, hipertensão, dor lombar..."
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Botões NetBeans */}
              <div className="flex flex-wrap items-center gap-2 py-1">
                <button
                  disabled={!agBtnNovoEnabled}
                  onClick={handleAgNovo}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Novo Agendamento
                </button>

                <button
                  disabled={!agBtnSalvarEnabled}
                  onClick={handleAgSalvar}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Salvar Consulta
                </button>

                <button
                  disabled={!agBtnCancelarEnabled}
                  onClick={handleAgCancelar}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Cancelar
                </button>

                {agCodigo && (
                  <>
                    <button
                      onClick={() => {
                        onUpdateAppointmentStatus(Number(agCodigo), 'EM_ATENDIMENTO');
                        setAgStatus('EM_ATENDIMENTO');
                      }}
                      className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold text-[11px]"
                    >
                      ▶ Iniciar Atendimento
                    </button>
                    <button
                      onClick={() => {
                        onUpdateAppointmentStatus(Number(agCodigo), 'CONCLUIDO');
                        setAgStatus('CONCLUIDO');
                      }}
                      className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold text-[11px]"
                    >
                      ✓ Concluir
                    </button>
                  </>
                )}
              </div>

              {/* Filtros da Tabela */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800 text-[11px]">
                <span className="text-slate-400 font-bold flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Filtros:
                </span>
                <select
                  value={agFiltroData}
                  onChange={e => setAgFiltroData(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                >
                  <option value="TODAS">Todas as Datas</option>
                  <option value="2026-10-10">Hoje (10/10/2026)</option>
                  <option value="2026-10-11">Amanhã (11/10/2026)</option>
                </select>

                <select
                  value={agFiltroStatus}
                  onChange={e => setAgFiltroStatus(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                >
                  <option value="TODOS">Todos os Status</option>
                  <option value="AGENDADO">Agendado</option>
                  <option value="CONFIRMADO">Confirmado</option>
                  <option value="EM_ATENDIMENTO">Em Atendimento</option>
                  <option value="CONCLUIDO">Concluído</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>

              {/* JTable Agenda */}
              <div className="border border-slate-800 rounded overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-800/90 sticky top-0 text-slate-300 border-b border-slate-700">
                      <tr>
                        <th className="p-2 w-12">Cód</th>
                        <th className="p-2 w-24">Data/Hora</th>
                        <th className="p-2">Paciente</th>
                        <th className="p-2">Médico</th>
                        <th className="p-2">Especialidade</th>
                        <th className="p-2">Motivo</th>
                        <th className="p-2 w-24">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {agendamentosFiltrados.map((a) => {
                        const isSelected = agCodigo === String(a.id);
                        return (
                          <tr 
                            key={a.id}
                            onClick={() => handleAgSelectRow(a)}
                            className={`cursor-pointer transition-colors ${
                              isSelected 
                                ? 'bg-amber-600/30 text-amber-200 font-semibold' 
                                : 'hover:bg-slate-800/50 text-slate-300'
                            }`}
                          >
                            <td className="p-2 font-bold">{a.id}</td>
                            <td className="p-2 font-bold text-sky-400">{a.dataAgenda.slice(8,10)}/{a.dataAgenda.slice(5,7)} {a.horario}</td>
                            <td className="p-2 font-sans font-medium text-slate-100">{a.pacienteNome}</td>
                            <td className="p-2 font-sans text-slate-300">{a.medicoNome}</td>
                            <td className="p-2 font-sans text-sky-300">{a.medicoEspecialidade}</td>
                            <td className="p-2 font-sans">{a.motivo}</td>
                            <td className="p-2 font-sans font-semibold">
                              {a.status === 'CONCLUIDO' && <span className="text-emerald-400">Concluído</span>}
                              {a.status === 'EM_ATENDIMENTO' && <span className="text-sky-400">Em Atend.</span>}
                              {a.status === 'AGENDADO' && <span className="text-amber-400">Agendado</span>}
                              {a.status === 'CONFIRMADO' && <span className="text-indigo-400">Confirmado</span>}
                              {a.status === 'CANCELADO' && <span className="text-rose-400">Cancelado</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* FORM USUÁRIO (FormUsuario.java)                                       */}
      {/* ===================================================================== */}
      {currentForm === 'usuarios' && (
        <div className="p-4 max-w-5xl mx-auto w-full space-y-4">
          <div className="bg-slate-900 border border-sky-500/40 rounded-lg shadow-xl overflow-hidden">
            <div className="bg-slate-850 px-4 py-2 border-b border-slate-700 flex items-center justify-between text-xs font-semibold text-slate-200">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                Gerenciamento de Usuários e Perfis de Acesso (FormUsuario)
              </span>
              <button 
                onClick={() => onNavigate('dashboard')}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
              >
                <ArrowLeft className="w-3 h-3" /> Voltar à Tela Principal
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-3">
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-2">
                    <label className="block text-slate-400 mb-1">Código:</label>
                    <input 
                      type="text" 
                      disabled 
                      value={usrCodigo}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-400 font-mono"
                      placeholder="Auto"
                    />
                  </div>

                  <div className="col-span-4">
                    <label className="block text-slate-300 mb-1">Nome Completo: *</label>
                    <input 
                      type="text" 
                      disabled={!usrFieldsEnabled}
                      value={usrNome}
                      onChange={e => setUsrNome(e.target.value)}
                      placeholder="Ex: Carlos Eduardo"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white disabled:opacity-50"
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="block text-slate-300 mb-1">Login de Acesso: *</label>
                    <input 
                      type="text" 
                      disabled={!usrFieldsEnabled}
                      value={usrLogin}
                      onChange={e => setUsrLogin(e.target.value)}
                      placeholder="Ex: c.eduardo"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white disabled:opacity-50 font-mono"
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="block text-slate-300 mb-1">Perfil de Acesso (RBAC):</label>
                    <select
                      disabled={!usrFieldsEnabled}
                      value={usrPerfil}
                      onChange={e => setUsrPerfil(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white disabled:opacity-50 font-bold"
                    >
                      <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                      <option value="MEDICO">MEDICO</option>
                      <option value="ENFERMEIRO">ENFERMEIRO</option>
                      <option value="RECEPCIONISTA">RECEPCIONISTA</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Botões NetBeans */}
              <div className="flex flex-wrap items-center gap-2 py-1">
                <button
                  disabled={!usrBtnNovoEnabled}
                  onClick={handleUsrNovo}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Novo Usuário
                </button>

                <button
                  disabled={!usrBtnSalvarEnabled}
                  onClick={handleUsrSalvar}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Salvar
                </button>

                <button
                  disabled={!usrBtnCancelarEnabled}
                  onClick={handleUsrCancelar}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Cancelar
                </button>

                {usrCodigo && (
                  <>
                    <button
                      onClick={() => onToggleUserStatus(Number(usrCodigo))}
                      className="px-3 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded font-bold text-xs"
                    >
                      Ativar/Desativar
                    </button>
                    <button
                      onClick={() => onResetPassword(Number(usrCodigo))}
                      className="px-3 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded font-bold text-xs"
                    >
                      Redefinir Senha
                    </button>
                  </>
                )}
              </div>

              {/* JTable Usuários */}
              <div className="border border-slate-800 rounded overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-800 text-slate-300">
                    <tr>
                      <th className="p-2 w-16">Código</th>
                      <th className="p-2">Nome</th>
                      <th className="p-2">Login</th>
                      <th className="p-2">Perfil</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                    {users.map(u => (
                      <tr 
                        key={u.id}
                        onClick={() => handleUsrSelectRow(u)}
                        className={`cursor-pointer ${usrCodigo === String(u.id) ? 'bg-sky-600/30' : 'hover:bg-slate-800/50'}`}
                      >
                        <td className="p-2 font-bold">{u.id}</td>
                        <td className="p-2 font-sans font-medium text-white">{u.nome}</td>
                        <td className="p-2 text-sky-400 font-bold">{u.login}</td>
                        <td className="p-2 font-sans">{u.perfil}</td>
                        <td className="p-2 font-sans">
                          {u.ativo ? <span className="text-emerald-400">Ativo</span> : <span className="text-rose-400">Inativo</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
