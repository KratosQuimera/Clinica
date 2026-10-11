import { User, Doctor, Nurse, Patient, Appointment, AuditLog, Prescription } from '../types';
import { 
  INITIAL_USERS, INITIAL_DOCTORS, INITIAL_NURSES, 
  INITIAL_PATIENTS, INITIAL_APPOINTMENTS, INITIAL_AUDIT_LOGS,
  INITIAL_PRESCRIPTIONS
} from '../data/initialData';

const STORAGE_KEYS = {
  USERS: 'clinestudo_users_v2',
  DOCTORS: 'clinestudo_doctors_v2',
  NURSES: 'clinestudo_nurses_v2',
  PATIENTS: 'clinestudo_patients_v2',
  APPOINTMENTS: 'clinestudo_appointments_v2',
  PRESCRIPTIONS: 'clinestudo_prescriptions_v2',
  AUDIT: 'clinestudo_audit_v2',
  ACTIVE_USER: 'clinestudo_active_user_v2',
  VIEW_MODE: 'clinestudo_view_mode_v2',
  ACTIVE_TAB: 'clinestudo_active_tab_v2',
};

export const storage = {
  getUsers: (): User[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  },
  saveUsers: (users: User[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (e) {
      console.warn('Erro ao salvar usuários no localStorage', e);
    }
  },

  getDoctors: (): Doctor[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DOCTORS);
      return data ? JSON.parse(data) : INITIAL_DOCTORS;
    } catch {
      return INITIAL_DOCTORS;
    }
  },
  saveDoctors: (doctors: Doctor[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(doctors));
    } catch (e) {
      console.warn('Erro ao salvar médicos no localStorage', e);
    }
  },

  getNurses: (): Nurse[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NURSES);
      return data ? JSON.parse(data) : INITIAL_NURSES;
    } catch {
      return INITIAL_NURSES;
    }
  },
  saveNurses: (nurses: Nurse[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.NURSES, JSON.stringify(nurses));
    } catch (e) {
      console.warn('Erro ao salvar enfermeiros no localStorage', e);
    }
  },

  getPatients: (): Patient[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PATIENTS);
      return data ? JSON.parse(data) : INITIAL_PATIENTS;
    } catch {
      return INITIAL_PATIENTS;
    }
  },
  savePatients: (patients: Patient[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    } catch (e) {
      console.warn('Erro ao salvar pacientes no localStorage', e);
    }
  },

  getAppointments: (): Appointment[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      return data ? JSON.parse(data) : INITIAL_APPOINTMENTS;
    } catch {
      return INITIAL_APPOINTMENTS;
    }
  },
  saveAppointments: (appointments: Appointment[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    } catch (e) {
      console.warn('Erro ao salvar agendamentos no localStorage', e);
    }
  },

  getPrescriptions: (): Prescription[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRESCRIPTIONS);
      return data ? JSON.parse(data) : INITIAL_PRESCRIPTIONS;
    } catch {
      return INITIAL_PRESCRIPTIONS;
    }
  },
  savePrescriptions: (prescriptions: Prescription[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(prescriptions));
    } catch (e) {
      console.warn('Erro ao salvar receitas no localStorage', e);
    }
  },

  getAuditLogs: (): AuditLog[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT);
      return data ? JSON.parse(data) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  },
  saveAuditLogs: (logs: AuditLog[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(logs));
    } catch (e) {
      console.warn('Erro ao salvar logs no localStorage', e);
    }
  },

  getActiveUser: (): User | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
      if (data) {
        return JSON.parse(data);
      }
      return INITIAL_USERS[0]; // Padrão admin
    } catch {
      return INITIAL_USERS[0];
    }
  },
  saveActiveUser: (user: User | null) => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
      }
    } catch (e) {
      console.warn('Erro ao salvar usuário ativo', e);
    }
  },

  getViewMode: (): 'netbeans' | 'dashboard' | 'python' => {
    try {
      const mode = localStorage.getItem(STORAGE_KEYS.VIEW_MODE);
      return (mode as any) || 'netbeans'; // NetBeans como padrão autêntico
    } catch {
      return 'netbeans';
    }
  },
  saveViewMode: (mode: 'netbeans' | 'dashboard' | 'python') => {
    try {
      localStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode);
    } catch (e) {
      console.warn('Erro ao salvar view mode', e);
    }
  },

  getActiveTab: (): string => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB) || 'dashboard';
    } catch {
      return 'dashboard';
    }
  },
  saveActiveTab: (tab: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, tab);
    } catch (e) {
      console.warn('Erro ao salvar aba ativa', e);
    }
  },

  resetAllData: () => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(INITIAL_DOCTORS));
      localStorage.setItem(STORAGE_KEYS.NURSES, JSON.stringify(INITIAL_NURSES));
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(INITIAL_PATIENTS));
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(INITIAL_APPOINTMENTS));
      localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(INITIAL_PRESCRIPTIONS));
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(INITIAL_AUDIT_LOGS));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(INITIAL_USERS[0]));
    } catch (e) {
      console.warn('Erro ao resetar dados', e);
    }
  }
};

