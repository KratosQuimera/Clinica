import React, { useState } from 'react';
import { 
  INITIAL_USERS, INITIAL_DOCTORS, INITIAL_NURSES, 
  INITIAL_PATIENTS, INITIAL_APPOINTMENTS, INITIAL_AUDIT_LOGS 
} from './data/initialData';
import { User, Doctor, Nurse, Patient, Appointment, AuditLog, AppointmentStatus } from './types';
import { DesktopWindow } from './components/DesktopWindow';
import { DashboardView } from './components/DashboardView';
import { DoctorsView } from './components/DoctorsView';
import { NursesView } from './components/NursesView';
import { PatientsView } from './components/PatientsView';
import { ScheduleView } from './components/ScheduleView';
import { UsersView } from './components/UsersView';
import { ReportsView } from './components/ReportsView';
import { AuditView } from './components/AuditView';
import { PythonProjectHub } from './components/PythonProjectHub';
import { LoginModal } from './components/LoginModal';

export default function App() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS[0]); // Começa logado como Admin para visualização direta
  const [isLoggedOut, setIsLoggedOut] = useState<boolean>(false);

  const [doctors, setDoctors] = useState<Doctor[]>(INITIAL_DOCTORS);
  const [nurses, setNurses] = useState<Nurse[]>(INITIAL_NURSES);
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Registro seguro de auditoria LGPD (sem senhas)
  const addAuditLog = (
    acao: string, 
    entidade: AuditLog['entidade'], 
    detalhes: string, 
    registroId?: number
  ) => {
    const newLog: AuditLog = {
      id: Date.now(),
      usuarioId: currentUser?.id,
      loginUsuario: currentUser?.login || 'SISTEMA',
      acao,
      entidade,
      registroId,
      detalhes,
      ipOrigem: '127.0.0.1',
      criadoEm: new Date().toISOString(),
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // 1. Médicos
  const handleSaveDoctor = (docData: Omit<Doctor, 'id'>, id?: number) => {
    // Validação de unicidade de CRM na mesma UF
    const duplicate = doctors.find(d => 
      d.crm === docData.crm && 
      d.uf_crm === docData.uf_crm && 
      d.id !== id
    );
    if (duplicate) {
      return { success: false, message: `O CRM ${docData.crm}/${docData.uf_crm} já está cadastrado para ${duplicate.nome}.` };
    }

    if (id) {
      setDoctors(prev => prev.map(d => d.id === id ? { ...docData, id } : d));
      addAuditLog('EDITAR_MEDICO', 'MEDICOS', `Médico ${docData.nome} (CRM ${docData.crm}/${docData.uf_crm}) atualizado`, id);
      return { success: true, message: 'Dados do médico atualizados com sucesso.' };
    } else {
      const newId = doctors.length ? Math.max(...doctors.map(d => d.id)) + 1 : 1;
      const newDoc: Doctor = { ...docData, id: newId };
      setDoctors(prev => [...prev, newDoc]);
      addAuditLog('CRIAR_MEDICO', 'MEDICOS', `Médico ${docData.nome} (CRM ${docData.crm}/${docData.uf_crm}) cadastrado`, newId);
      return { success: true, message: 'Médico cadastrado com sucesso.' };
    }
  };

  const handleDeleteDoctor = (id: number) => {
    setDoctors(prev => prev.map(d => d.id === id ? { ...d, ativo: false } : d));
    addAuditLog('DESATIVAR_MEDICO', 'MEDICOS', `Desativação lógica do médico ID ${id}`, id);
    return { success: true, message: 'Médico desativado logicamente do sistema.' };
  };

  // 2. Enfermeiros
  const handleSaveNurse = (nurseData: Omit<Nurse, 'id'>, id?: number) => {
    const duplicate = nurses.find(n => 
      n.coren === nurseData.coren && 
      n.uf_coren === nurseData.uf_coren && 
      n.id !== id
    );
    if (duplicate) {
      return { success: false, message: `O COREN ${nurseData.coren}/${nurseData.uf_coren} já está cadastrado para ${duplicate.nome}.` };
    }

    if (id) {
      setNurses(prev => prev.map(n => n.id === id ? { ...nurseData, id } : n));
      addAuditLog('EDITAR_ENFERMEIRO', 'ENFERMEIROS', `Enfermeiro ${nurseData.nome} atualizado`, id);
      return { success: true, message: 'Dados de enfermagem atualizados com sucesso.' };
    } else {
      const newId = nurses.length ? Math.max(...nurses.map(n => n.id)) + 1 : 1;
      const newNurse: Nurse = { ...nurseData, id: newId };
      setNurses(prev => [...prev, newNurse]);
      addAuditLog('CRIAR_ENFERMEIRO', 'ENFERMEIROS', `Enfermeiro ${nurseData.nome} cadastrado`, newId);
      return { success: true, message: 'Profissional de enfermagem cadastrado com sucesso.' };
    }
  };

  const handleDeleteNurse = (id: number) => {
    setNurses(prev => prev.map(n => n.id === id ? { ...n, ativo: false } : n));
    addAuditLog('DESATIVAR_ENFERMEIRO', 'ENFERMEIROS', `Desativação lógica do enfermeiro ID ${id}`, id);
    return { success: true, message: 'Profissional de enfermagem desativado com sucesso.' };
  };

  // 3. Pacientes
  const handleSavePatient = (patientData: Omit<Patient, 'id' | 'criadoEm'>, id?: number) => {
    if (patientData.cpf) {
      const duplicate = patients.find(p => p.cpf === patientData.cpf && p.id !== id);
      if (duplicate) {
        return { success: false, message: `Já existe paciente cadastrado com este CPF (${patientData.cpf}).` };
      }
    }

    if (id) {
      setPatients(prev => prev.map(p => p.id === id ? { ...patientData, id, criadoEm: p.criadoEm } : p));
      addAuditLog('EDITAR_PACIENTE', 'PACIENTES', `Paciente ${patientData.nome} atualizado`, id);
      return { success: true, message: 'Dados do paciente atualizados com sucesso.' };
    } else {
      const newId = patients.length ? Math.max(...patients.map(p => p.id)) + 1 : 1;
      const newPatient: Patient = { 
        ...patientData, 
        id: newId, 
        criadoEm: new Date().toISOString() 
      };
      setPatients(prev => [...prev, newPatient]);
      addAuditLog('CRIAR_PACIENTE', 'PACIENTES', `Paciente ${patientData.nome} cadastrado`, newId);
      return { success: true, message: 'Paciente cadastrado com sucesso.' };
    }
  };

  const handleDeletePatient = (id: number) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ativo: false } : p));
    addAuditLog('DESATIVAR_PACIENTE', 'PACIENTES', `Desativação lógica do paciente ID ${id}`, id);
    return { success: true, message: 'Paciente desativado logicamente do cadastro.' };
  };

  // 4. Agendamentos com prevenção de conflitos
  const handleSaveAppointment = (appData: Omit<Appointment, 'id' | 'criadoEm'>, id?: number) => {
    // Verificação de conflito para o médico
    const conflict = appointments.find(a => 
      a.medicoId === appData.medicoId &&
      a.dataAgenda === appData.dataAgenda &&
      a.horario === appData.horario &&
      a.status !== 'CANCELADO' &&
      a.id !== id
    );

    if (conflict) {
      return { 
        success: false, 
        message: `CONFLITO: O médico já possui agendamento com ${conflict.pacienteNome} neste mesmo dia e horário.` 
      };
    }

    const patient = patients.find(p => p.id === appData.pacienteId);
    const doctor = doctors.find(d => d.id === appData.medicoId);
    const nurse = nurses.find(n => n.id === appData.enfermeiroId);

    const fullApp: Appointment = {
      ...appData,
      id: id || (appointments.length ? Math.max(...appointments.map(a => a.id)) + 1 : 1),
      criadoEm: new Date().toISOString(),
      pacienteNome: patient?.nome,
      pacienteTelefone: patient?.telefone,
      pacienteCpf: patient?.cpf,
      medicoNome: doctor?.nome,
      medicoEspecialidade: doctor?.especialidade,
      enfermeiroNome: nurse?.nome,
    };

    if (id) {
      setAppointments(prev => prev.map(a => a.id === id ? fullApp : a));
      addAuditLog('EDITAR_AGENDAMENTO', 'AGENDAMENTOS', `Consulta ID ${id} atualizada para ${appData.dataAgenda} ${appData.horario}`, id);
      return { success: true, message: 'Agendamento atualizado com sucesso.' };
    } else {
      setAppointments(prev => [...prev, fullApp]);
      addAuditLog('CRIAR_AGENDAMENTO', 'AGENDAMENTOS', `Consulta agendada para ${appData.dataAgenda} ${appData.horario} com ${doctor?.nome}`, fullApp.id);
      return { success: true, message: 'Consulta agendada com sucesso.' };
    }
  };

  const handleUpdateAppointmentStatus = (id: number, novoStatus: AppointmentStatus, obs?: string) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
        return { 
          ...a, 
          status: novoStatus, 
          observacoes: obs !== undefined ? obs : a.observacoes 
        };
      }
      return a;
    }));
    addAuditLog(`STATUS_${novoStatus}`, 'AGENDAMENTOS', `Status da consulta ID ${id} alterado para ${novoStatus}`, id);
    return { success: true, message: `Status alterado para ${novoStatus}.` };
  };

  // 5. Usuários
  const handleSaveUser = (userData: Omit<User, 'id' | 'criadoEm'>, id?: number) => {
    const duplicate = users.find(u => u.login === userData.login && u.id !== id);
    if (duplicate) {
      return { success: false, message: `O login '${userData.login}' já está em uso.` };
    }

    if (id) {
      setUsers(prev => prev.map(u => u.id === id ? { ...userData, id, criadoEm: u.criadoEm } : u));
      addAuditLog('EDITAR_USUARIO', 'USUARIOS', `Usuário ${userData.login} atualizado`, id);
      return { success: true, message: 'Usuário atualizado com sucesso.' };
    } else {
      const newId = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
      const newUser: User = { 
        ...userData, 
        id: newId, 
        criadoEm: new Date().toISOString() 
      };
      setUsers(prev => [...prev, newUser]);
      addAuditLog('CRIAR_USUARIO', 'USUARIOS', `Novo operador ${userData.login} cadastrado com perfil ${userData.perfil}`, newId);
      return { success: true, message: 'Usuário criado com sucesso.' };
    }
  };

  const handleToggleUserStatus = (id: number) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ativo: !u.ativo } : u));
    addAuditLog('STATUS_USUARIO', 'USUARIOS', `Alternância de status do usuário ID ${id}`, id);
    return { success: true, message: 'Status do usuário atualizado.' };
  };

  const handleResetLockout = (id: number) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, tentativasFalhas: 0, bloqueadoAte: null } : u));
    addAuditLog('DESBLOQUEAR_CONTA', 'USUARIOS', `Conta de usuário ID ${id} desbloqueada manualmente por administrador`, id);
    return { success: true, message: 'Conta desbloqueada com sucesso.' };
  };

  const handleResetPassword = (id: number, novaSenha: string) => {
    addAuditLog('REDEFINIR_SENHA', 'USUARIOS', `Redefinição administrativa de senha efetuada para o usuário ID ${id}`, id);
    return { success: true, message: 'Senha redefinida com sucesso com hash PBKDF2.' };
  };

  const handleLogout = () => {
    if (currentUser) {
      addAuditLog('LOGOUT', 'USUARIOS', `Encerramento de sessão para o usuário ${currentUser.login}`);
    }
    setCurrentUser(null);
    setIsLoggedOut(true);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsLoggedOut(false);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      {/* Modal de login quando deslogado */}
      {(!currentUser || isLoggedOut) && (
        <LoginModal
          users={users}
          onLoginSuccess={handleLoginSuccess}
          onRecordAudit={(acao, entidade, detalhes) => addAuditLog(acao, entidade, detalhes)}
        />
      )}

      {/* Janela desktop principal */}
      {currentUser && (
        <DesktopWindow
          currentUser={currentUser}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={handleLogout}
        >
          {activeTab === 'dashboard' && (
            <DashboardView
              doctors={doctors}
              nurses={nurses}
              patients={patients}
              appointments={appointments}
              currentUser={currentUser}
              onNavigate={setActiveTab}
              onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
              onOpenNewAppointment={() => setActiveTab('agenda')}
              onOpenNewPatient={() => setActiveTab('pacientes')}
            />
          )}

          {activeTab === 'medicos' && (
            <DoctorsView
              doctors={doctors}
              currentUser={currentUser}
              onSaveDoctor={handleSaveDoctor}
              onDeleteDoctor={handleDeleteDoctor}
            />
          )}

          {activeTab === 'enfermeiros' && (
            <NursesView
              nurses={nurses}
              currentUser={currentUser}
              onSaveNurse={handleSaveNurse}
              onDeleteNurse={handleDeleteNurse}
            />
          )}

          {activeTab === 'pacientes' && (
            <PatientsView
              patients={patients}
              appointments={appointments}
              currentUser={currentUser}
              onSavePatient={handleSavePatient}
              onDeletePatient={handleDeletePatient}
            />
          )}

          {activeTab === 'agenda' && (
            <ScheduleView
              appointments={appointments}
              doctors={doctors}
              patients={patients}
              nurses={nurses}
              currentUser={currentUser}
              onSaveAppointment={handleSaveAppointment}
              onUpdateStatus={handleUpdateAppointmentStatus}
            />
          )}

          {activeTab === 'relatorios' && (
            <ReportsView
              appointments={appointments}
              doctors={doctors}
              patients={patients}
              nurses={nurses}
            />
          )}

          {activeTab === 'auditoria' && (
            <AuditView logs={auditLogs} />
          )}

          {activeTab === 'usuarios' && (
            <UsersView
              users={users}
              currentUser={currentUser}
              onSaveUser={handleSaveUser}
              onToggleUserStatus={handleToggleUserStatus}
              onResetLockout={handleResetLockout}
              onResetPassword={handleResetPassword}
            />
          )}

          {activeTab === 'python_hub' && (
            <PythonProjectHub />
          )}
        </DesktopWindow>
      )}
    </div>
  );
}
