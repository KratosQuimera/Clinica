import React, { useState, useEffect } from 'react';
import { storage } from './utils/storage';
import { User, Doctor, Nurse, Patient, Appointment, AuditLog, AppointmentStatus, Prescription } from './types';
import { DesktopWindow } from './components/DesktopWindow';
import { DashboardView } from './components/DashboardView';
import { DoctorsView } from './components/DoctorsView';
import { NursesView } from './components/NursesView';
import { PatientsView } from './components/PatientsView';
import { ScheduleView } from './components/ScheduleView';
import { PrescriptionsView } from './components/PrescriptionsView';
import { PrescriptionModal } from './components/PrescriptionModal';
import { UsersView } from './components/UsersView';
import { ReportsView } from './components/ReportsView';
import { AuditView } from './components/AuditView';
import { PythonProjectHub } from './components/PythonProjectHub';
import { LoginModal } from './components/LoginModal';

export default function App() {
  // Inicialização com dados persistidos no localStorage
  const [users, setUsers] = useState<User[]>(() => storage.getUsers());
  const [currentUser, setCurrentUser] = useState<User | null>(() => storage.getActiveUser());
  const [isLoggedOut, setIsLoggedOut] = useState<boolean>(false);

  const [doctors, setDoctors] = useState<Doctor[]>(() => storage.getDoctors());
  const [nurses, setNurses] = useState<Nurse[]>(() => storage.getNurses());
  const [patients, setPatients] = useState<Patient[]>(() => storage.getPatients());
  const [appointments, setAppointments] = useState<Appointment[]>(() => storage.getAppointments());
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => storage.getPrescriptions());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => storage.getAuditLogs());

  // Aba ativa: começa em 'dashboard' (Tela Bem-Vindos)
  const [activeTab, setActiveTab] = useState<string>(() => storage.getActiveTab());

  // Estado do Modal de Prescrição Médica
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [prescriptionInitialPatientId, setPrescriptionInitialPatientId] = useState<number | undefined>(undefined);
  const [prescriptionInitialDoctorId, setPrescriptionInitialDoctorId] = useState<number | undefined>(undefined);
  const [existingPrescriptionToView, setExistingPrescriptionToView] = useState<Prescription | null>(null);

  // Sincroniza persistência de sessão e aba ativa
  useEffect(() => {
    storage.saveActiveUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    storage.saveActiveTab(activeTab);
  }, [activeTab]);

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
    setAuditLogs(prev => {
      const updated = [newLog, ...prev];
      storage.saveAuditLogs(updated);
      return updated;
    });
  };

  // 1. Médicos
  const handleSaveDoctor = (docData: Omit<Doctor, 'id'>, id?: number) => {
    const duplicate = doctors.find(d => 
      d.crm === docData.crm && 
      d.uf_crm === docData.uf_crm && 
      d.id !== id
    );
    if (duplicate) {
      return { success: false, message: `O CRM ${docData.crm}/${docData.uf_crm} já está cadastrado para ${duplicate.nome}.` };
    }

    if (id) {
      const updated = doctors.map(d => d.id === id ? { ...docData, id } : d);
      setDoctors(updated);
      storage.saveDoctors(updated);
      addAuditLog('EDITAR_MEDICO', 'MEDICOS', `Médico ${docData.nome} (CRM ${docData.crm}/${docData.uf_crm}) atualizado`, id);
      return { success: true, message: 'Dados do médico atualizados com sucesso.' };
    } else {
      const newId = doctors.length ? Math.max(...doctors.map(d => d.id)) + 1 : 1;
      const newDoc: Doctor = { ...docData, id: newId };
      const updated = [...doctors, newDoc];
      setDoctors(updated);
      storage.saveDoctors(updated);
      addAuditLog('CRIAR_MEDICO', 'MEDICOS', `Médico ${docData.nome} (CRM ${docData.crm}/${docData.uf_crm}) cadastrado`, newId);
      return { success: true, message: 'Médico cadastrado com sucesso.' };
    }
  };

  const handleDeleteDoctor = (id: number) => {
    const updated = doctors.map(d => d.id === id ? { ...d, ativo: false } : d);
    setDoctors(updated);
    storage.saveDoctors(updated);
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
      const updated = nurses.map(n => n.id === id ? { ...nurseData, id } : n);
      setNurses(updated);
      storage.saveNurses(updated);
      addAuditLog('EDITAR_ENFERMEIRO', 'ENFERMEIROS', `Enfermeiro ${nurseData.nome} atualizado`, id);
      return { success: true, message: 'Dados de enfermagem atualizados com sucesso.' };
    } else {
      const newId = nurses.length ? Math.max(...nurses.map(n => n.id)) + 1 : 1;
      const newNurse: Nurse = { ...nurseData, id: newId };
      const updated = [...nurses, newNurse];
      setNurses(updated);
      storage.saveNurses(updated);
      addAuditLog('CRIAR_ENFERMEIRO', 'ENFERMEIROS', `Enfermeiro ${nurseData.nome} cadastrado`, newId);
      return { success: true, message: 'Profissional de enfermagem cadastrado com sucesso.' };
    }
  };

  const handleDeleteNurse = (id: number) => {
    const updated = nurses.map(n => n.id === id ? { ...n, ativo: false } : n);
    setNurses(updated);
    storage.saveNurses(updated);
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
      const updated = patients.map(p => p.id === id ? { ...patientData, id, criadoEm: p.criadoEm } : p);
      setPatients(updated);
      storage.savePatients(updated);
      addAuditLog('EDITAR_PACIENTE', 'PACIENTES', `Paciente ${patientData.nome} atualizado`, id);
      return { success: true, message: 'Dados do paciente atualizados com sucesso.' };
    } else {
      const newId = patients.length ? Math.max(...patients.map(p => p.id)) + 1 : 1;
      const newPatient: Patient = { 
        ...patientData, 
        id: newId, 
        criadoEm: new Date().toISOString() 
      };
      const updated = [...patients, newPatient];
      setPatients(updated);
      storage.savePatients(updated);
      addAuditLog('CRIAR_PACIENTE', 'PACIENTES', `Paciente ${patientData.nome} cadastrado`, newId);
      return { success: true, message: 'Paciente cadastrado com sucesso.' };
    }
  };

  const handleDeletePatient = (id: number) => {
    const updated = patients.map(p => p.id === id ? { ...p, ativo: false } : p);
    setPatients(updated);
    storage.savePatients(updated);
    addAuditLog('DESATIVAR_PACIENTE', 'PACIENTES', `Desativação lógica do paciente ID ${id}`, id);
    return { success: true, message: 'Paciente desativado logicamente do cadastro.' };
  };

  // 4. Agendamentos com prevenção de conflitos
  const handleSaveAppointment = (appData: Omit<Appointment, 'id' | 'criadoEm'>, id?: number) => {
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
        message: `Conflito de agenda: o médico já possui atendimento agendado para o horário ${appData.horario} nesta data.` 
      };
    }

    const patient = patients.find(p => p.id === appData.pacienteId);
    const doctor = doctors.find(d => d.id === appData.medicoId);

    const appWithJoins = {
      ...appData,
      pacienteNome: patient?.nome,
      pacienteTelefone: patient?.telefone,
      pacienteCpf: patient?.cpf,
      medicoNome: doctor?.nome,
      medicoEspecialidade: doctor?.especialidade,
    };

    if (id) {
      const updated = appointments.map(a => a.id === id ? { ...appWithJoins, id, criadoEm: a.criadoEm } : a);
      setAppointments(updated);
      storage.saveAppointments(updated);
      addAuditLog('EDITAR_AGENDAMENTO', 'AGENDAMENTOS', `Consulta ID ${id} atualizada`, id);
      return { success: true, message: 'Agendamento atualizado com sucesso.' };
    } else {
      const newId = appointments.length ? Math.max(...appointments.map(a => a.id)) + 1 : 1;
      const newApp: Appointment = {
        ...appWithJoins,
        id: newId,
        criadoEm: new Date().toISOString(),
      };
      const updated = [newApp, ...appointments];
      setAppointments(updated);
      storage.saveAppointments(updated);
      addAuditLog('CRIAR_AGENDAMENTO', 'AGENDAMENTOS', `Agendamento criado para ${patient?.nome} com ${doctor?.nome}`, newId);
      return { success: true, message: 'Consulta agendada com sucesso.' };
    }
  };

  const handleUpdateAppointmentStatus = (id: number, status: AppointmentStatus) => {
    const updated = appointments.map(a => a.id === id ? { ...a, status } : a);
    setAppointments(updated);
    storage.saveAppointments(updated);
    addAuditLog('ATUALIZAR_STATUS_AGENDAMENTO', 'AGENDAMENTOS', `Status alterado para ${status}`, id);
    return { success: true, message: `Status da consulta atualizado para ${status}.` };
  };

  // 5. RECEITAS MÉDICAS, PRESCRIÇÕES, QR CODE E WHATSAPP
  const handleOpenCreatePrescription = (patientId?: number, doctorId?: number) => {
    setExistingPrescriptionToView(null);
    setPrescriptionInitialPatientId(patientId);
    setPrescriptionInitialDoctorId(doctorId);
    setPrescriptionModalOpen(true);
  };

  const handleOpenViewPrescription = (prescription: Prescription) => {
    setExistingPrescriptionToView(prescription);
    setPrescriptionInitialPatientId(prescription.pacienteId);
    setPrescriptionInitialDoctorId(prescription.medicoId);
    setPrescriptionModalOpen(true);
  };

  const handleSavePrescription = (prescData: Omit<Prescription, 'id' | 'criadoEm'>, id?: number) => {
    if (id) {
      const updated = prescriptions.map(p => p.id === id ? { ...prescData, id, criadoEm: p.criadoEm } : p);
      setPrescriptions(updated);
      storage.savePrescriptions(updated);
      addAuditLog('EDITAR_RECEITA', 'RECEITAS', `Receita ${prescData.codigoAutenticidade} atualizada para ${prescData.pacienteNome}`, id);
      const saved = updated.find(p => p.id === id);
      return { success: true, message: 'Receita médica atualizada com sucesso.', prescription: saved };
    } else {
      const newId = prescriptions.length ? Math.max(...prescriptions.map(p => p.id)) + 1 : 1;
      const newPresc: Prescription = {
        ...prescData,
        id: newId,
        criadoEm: new Date().toISOString(),
      };
      const updated = [newPresc, ...prescriptions];
      setPrescriptions(updated);
      storage.savePrescriptions(updated);
      addAuditLog('CRIAR_RECEITA', 'RECEITAS', `Receita ${prescData.codigoAutenticidade} emitida para ${prescData.pacienteNome} por ${prescData.medicoNome} (${prescData.medicamentos.length} medicamentos)`, newId);
      return { success: true, message: 'Receita médica prescrita e arquivada com sucesso no cadastro do paciente!', prescription: newPresc };
    }
  };

  const handleSendWhatsAppPrescription = (prescription: Prescription) => {
    const rawPhone = prescription.pacienteTelefone.replace(/\D/g, '');
    let formattedPhone = rawPhone;
    if (formattedPhone.length === 10 || formattedPhone.length === 11) {
      formattedPhone = '55' + formattedPhone;
    }

    let msg = `🏥 *CLINESTUDO - RECEITA MÉDICA DIGITAL*\n`;
    msg += `----------------------------------------\n`;
    msg += `Olá, *${prescription.pacienteNome}*! Segue a sua receita médica emitida pelo(a) *${prescription.medicoNome}* (CRM ${prescription.medicoCrm}/${prescription.medicoUfCrm} - ${prescription.medicoEspecialidade}).\n\n`;
    msg += `📅 *Data de Emissão:* ${prescription.dataEmissao} às ${prescription.horaEmissao}\n`;
    msg += `🔒 *Código de Autenticidade:* \`${prescription.codigoAutenticidade}\`\n\n`;
    
    msg += `💊 *MEDICAÇÕES E MEDICAMENTOS PARA CASA:*\n`;
    prescription.medicamentos.forEach((med, index) => {
      msg += `\n*${index + 1}. ${med.nome}* (${med.dosagem || 'Dose padrão'})\n`;
      msg += `   • *Como tomar:* ${med.frequencia}\n`;
      if (med.duracao) msg += `   • *Duração:* ${med.duracao}\n`;
      if (med.quantidade) msg += `   • *Quantidade:* ${med.quantidade}\n`;
      if (med.instrucoesCasa) msg += `   • *Orientações:* ${med.instrucoesCasa}\n`;
    });

    if (prescription.orientacoesGerais) {
      msg += `\n📋 *ORIENTAÇÕES GERAIS PARA CASA:*\n${prescription.orientacoesGerais}\n`;
    }

    msg += `\n⏳ *Validade:* ${prescription.validadeDias} dias a partir da data de emissão.\n`;
    msg += `\n📲 *VALIDAÇÃO DIGITAL COM QR CODE:*\n`;
    msg += `https://clinestudo.saude.gov.br/validar?codigo=${prescription.codigoAutenticidade}\n\n`;
    msg += `_ClinEstudo - Cuidando da sua saúde com dedicação e excelência._`;

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    addAuditLog('ENVIAR_RECEITA_WHATSAPP', 'RECEITAS', `Receita ${prescription.codigoAutenticidade} enviada para o WhatsApp de ${prescription.pacienteNome} (${prescription.pacienteTelefone})`, prescription.id);
  };

  // 6. Usuários
  const handleSaveUser = (userData: Partial<User>, id?: number) => {
    if (id) {
      const updated = users.map(u => u.id === id ? { ...u, ...userData } : u);
      setUsers(updated);
      storage.saveUsers(updated);
      addAuditLog('EDITAR_USUARIO', 'USUARIOS', `Usuário ID ${id} atualizado`, id);
      return { success: true, message: 'Usuário atualizado com sucesso.' };
    } else {
      const duplicate = users.find(u => u.login === userData.login);
      if (duplicate) {
        return { success: false, message: `O login "${userData.login}" já está em uso.` };
      }
      const newId = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
      const newUser: User = {
        id: newId,
        nome: userData.nome || 'Novo Usuário',
        login: userData.login || 'usuario',
        perfil: userData.perfil || 'RECEPCIONISTA',
        ativo: true,
        tentativasFalhas: 0,
        bloqueadoAte: null,
        criadoEm: new Date().toISOString(),
      };
      const updated = [...users, newUser];
      setUsers(updated);
      storage.saveUsers(updated);
      addAuditLog('CRIAR_USUARIO', 'USUARIOS', `Usuário ${newUser.login} criado`, newId);
      return { success: true, message: 'Novo usuário criado com sucesso.' };
    }
  };

  const handleToggleUserStatus = (id: number) => {
    const target = users.find(u => u.id === id);
    if (!target) return { success: false, message: 'Usuário não encontrado.' };
    if (target.login === 'admin' && target.ativo) {
      return { success: false, message: 'O usuário Administrador mestre não pode ser desativado.' };
    }
    const updated = users.map(u => u.id === id ? { ...u, ativo: !u.ativo } : u);
    setUsers(updated);
    storage.saveUsers(updated);
    addAuditLog('STATUS_USUARIO', 'USUARIOS', `Status do usuário ${target.login} alterado para ${!target.ativo ? 'Ativo' : 'Inativo'}`, id);
    return { success: true, message: `Usuário ${!target.ativo ? 'ativado' : 'desativado'} com sucesso.` };
  };

  const handleResetLockout = (id: number) => {
    const updated = users.map(u => u.id === id ? { ...u, tentativasFalhas: 0, bloqueadoAte: null } : u);
    setUsers(updated);
    storage.saveUsers(updated);
    addAuditLog('DESBLOQUEAR_CONTA', 'USUARIOS', `Desbloqueio administrativo do usuário ID ${id}`, id);
    return { success: true, message: 'Tentativas zeradas e bloqueio removido com sucesso.' };
  };

  const handleResetPassword = (id: number) => {
    addAuditLog('RESET_SENHA', 'USUARIOS', `Senha redefinida para usuário ID ${id}`, id);
    return { success: true, message: 'Senha temporária definida como "clinica123".' };
  };

  // Restaurar dados originais
  const handleResetDatabase = () => {
    storage.resetAllData();
    setUsers(storage.getUsers());
    setDoctors(storage.getDoctors());
    setNurses(storage.getNurses());
    setPatients(storage.getPatients());
    setAppointments(storage.getAppointments());
    setPrescriptions(storage.getPrescriptions());
    setAuditLogs(storage.getAuditLogs());
    setCurrentUser(storage.getActiveUser());
    addAuditLog('REDEFINIR_BANCO', 'SISTEMA', 'Banco de dados restaurado para os registros padrão iniciais');
  };

  // Logout e Login
  const handleLogout = () => {
    addAuditLog('LOGOUT', 'USUARIOS', `Sessão encerrada por ${currentUser?.login}`);
    setIsLoggedOut(true);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsLoggedOut(false);
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {(isLoggedOut || !currentUser) ? (
        <LoginModal
          users={users}
          onLoginSuccess={handleLoginSuccess}
          onRecordAudit={(act, ent, det) => addAuditLog(act, ent, det)}
        />
      ) : (
        <DesktopWindow
          currentUser={currentUser}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={handleLogout}
          onResetDatabase={handleResetDatabase}
        >
          {/* TELA DE BOAS-VINDAS / DASHBOARD DA PRIMEIRA VERSÃO */}
          {activeTab === 'dashboard' && (
            <DashboardView
              doctors={doctors}
              nurses={nurses}
              patients={patients}
              appointments={appointments}
              prescriptions={prescriptions}
              currentUser={currentUser}
              onNavigate={setActiveTab}
              onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
              onOpenNewAppointment={() => setActiveTab('agenda')}
              onOpenNewPatient={() => setActiveTab('pacientes')}
              onOpenNewPrescription={() => handleOpenCreatePrescription()}
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
              prescriptions={prescriptions}
              currentUser={currentUser}
              onSavePatient={handleSavePatient}
              onDeletePatient={handleDeletePatient}
              onOpenCreatePrescription={handleOpenCreatePrescription}
              onOpenViewPrescription={handleOpenViewPrescription}
              onSendWhatsAppPrescription={handleSendWhatsAppPrescription}
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
              onOpenCreatePrescription={handleOpenCreatePrescription}
            />
          )}

          {activeTab === 'receitas' && (
            <PrescriptionsView
              prescriptions={prescriptions}
              patients={patients}
              doctors={doctors}
              currentUser={currentUser}
              onOpenCreatePrescription={handleOpenCreatePrescription}
              onOpenViewPrescription={handleOpenViewPrescription}
              onSendWhatsApp={handleSendWhatsAppPrescription}
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

          {/* Modal Global de Prescrição Médica & Impressão com QR Code & WhatsApp */}
          {prescriptionModalOpen && (
            <PrescriptionModal
              isOpen={prescriptionModalOpen}
              onClose={() => {
                setPrescriptionModalOpen(false);
                setExistingPrescriptionToView(null);
              }}
              onSavePrescription={handleSavePrescription}
              patients={patients}
              doctors={doctors}
              currentUser={currentUser}
              initialPatientId={prescriptionInitialPatientId}
              initialDoctorId={prescriptionInitialDoctorId}
              existingPrescription={existingPrescriptionToView}
              onPrescriptionSentWhatsApp={handleSendWhatsAppPrescription}
            />
          )}
        </DesktopWindow>
      )}
    </div>
  );
}
