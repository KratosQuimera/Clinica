import csv
import io
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Tuple
from clinestudo_desktop.config.settings import settings
from clinestudo_desktop.models.entities import Usuario, Medico, Enfermeiro, Paciente, Agendamento, Auditoria
from clinestudo_desktop.repositories.repositories import (
    UsuarioRepository, MedicoRepository, EnfermeiroRepository,
    PacienteRepository, AgendamentoRepository, AuditoriaRepository
)
from clinestudo_desktop.auth.hasher import hash_password, verify_password
from clinestudo_desktop.auth.session import gerenciador_sessao
from clinestudo_desktop.services.validators import validar_cpf, validar_crm, validar_coren, formatar_cpf, validar_email

class AuthService:
    def __init__(self):
        self.repo = UsuarioRepository()
        self.audit_repo = AuditoriaRepository()

    def autenticar(self, login: str, senha_plana: str, ip: str = "127.0.0.1") -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        if not login or not senha_plana:
            return False, "Usuário e senha são obrigatórios.", None

        user = self.repo.buscar_por_login(login.strip())
        if not user:
            # Proteção contra timing attack
            self.audit_repo.registrar(Auditoria(
                usuario_id=None, login_usuario=login, acao="LOGIN_FALHA", entidade="USUARIOS",
                detalhes="Tentativa de login com usuário inexistente", ip_origem=ip
            ))
            return False, "Credenciais inválidas.", None

        # Verifica se o usuário está inativo
        if not user.get("ativo"):
            return False, "Conta desativada pelo administrador do sistema.", None

        # Verifica bloqueio temporário por tentativas excessivas
        bloqueado_ate = user.get("bloqueado_ate")
        if bloqueado_ate:
            try:
                # Trata formatos ISO ou datetime
                dt_bloq = datetime.fromisoformat(bloqueado_ate) if isinstance(bloqueado_ate, str) else bloqueado_ate
                if datetime.now() < dt_bloq:
                    tempo_restante = int((dt_bloq - datetime.now()).total_seconds() / 60)
                    return False, f"Conta bloqueada por excesso de tentativas. Tente novamente em {tempo_restante + 1} minuto(s).", None
            except Exception:
                pass

        # Validação do hash criptográfico
        senha_correta = verify_password(senha_plana, user["senha_hash"], user["salt"])
        if not senha_correta:
            tentativas = user.get("tentativas_falhas", 0) + 1
            novo_bloqueio = None
            mensagem = f"Credenciais inválidas. Tentativa {tentativas} de {settings.MAX_LOGIN_ATTEMPTS}."
            
            if tentativas >= settings.MAX_LOGIN_ATTEMPTS:
                dt_libera = datetime.now() + timedelta(minutes=settings.LOCKOUT_DURATION_MINUTES)
                novo_bloqueio = dt_libera.isoformat()
                mensagem = f"Conta bloqueada temporariamente por {settings.LOCKOUT_DURATION_MINUTES} minutos após {tentativas} tentativas falhas."

            self.repo.registrar_tentativa_falha(login, tentativas, novo_bloqueio)
            self.audit_repo.registrar(Auditoria(
                usuario_id=user["id"], login_usuario=login, acao="LOGIN_FALHA", entidade="USUARIOS",
                detalhes=f"Senha incorreta (tentativa {tentativas})", ip_origem=ip
            ))
            return False, mensagem, None

        # Sucesso no login: reseta tentativas e inicia sessão
        self.repo.resetar_bloqueio(login)
        sessao = gerenciador_sessao.iniciar_sessao(user)
        self.audit_repo.registrar(Auditoria(
            usuario_id=user["id"], login_usuario=login, acao="LOGIN_SUCESSO", entidade="USUARIOS",
            detalhes=f"Login efetuado com perfil {user['perfil']}", ip_origem=ip
        ))
        return True, "Autenticação realizada com sucesso.", user

    def alterar_senha(self, user_id: int, nova_senha: str, ip: str = "127.0.0.1") -> Tuple[bool, str]:
        if len(nova_senha) < 6:
            return False, "A nova senha deve possuir pelo menos 6 caracteres."
        
        novo_hash, novo_salt = hash_password(nova_senha)
        self.repo.atualizar_senha(user_id, novo_hash, novo_salt)
        
        user = self.repo.buscar_por_id(user_id)
        login_audit = user["login"] if user else f"ID_{user_id}"
        self.audit_repo.registrar(Auditoria(
            usuario_id=user_id, login_usuario=login_audit, acao="ALTERAR_SENHA", entidade="USUARIOS",
            registro_id=user_id, detalhes="Senha alterada com sucesso", ip_origem=ip
        ))
        return True, "Senha alterada com sucesso."

    def logout(self, ip: str = "127.0.0.1"):
        sessao = gerenciador_sessao.obter_sessao()
        if sessao:
            self.audit_repo.registrar(Auditoria(
                usuario_id=sessao.id, login_usuario=sessao.login, acao="LOGOUT", entidade="USUARIOS",
                detalhes="Encerramento de sessão", ip_origem=ip
            ))
            gerenciador_sessao.encerrar_sessao()

class MedicoService:
    def __init__(self):
        self.repo = MedicoRepository()
        self.audit = AuditoriaRepository()

    def cadastrar(self, nome: str, crm: str, uf_crm: str, especialidade: str, telefone: str, email: str = "") -> Tuple[bool, str, Optional[int]]:
        if not nome or len(nome.strip()) < 3:
            return False, "Nome do médico deve conter ao menos 3 caracteres.", None
        valido, msg = validar_crm(crm)
        if not valido:
            return False, msg, None
        if not especialidade or len(especialidade.strip()) < 2:
            return False, "Especialidade é obrigatória.", None
        if not telefone or len(telefone.strip()) < 8:
            return False, "Telefone de contato é obrigatório.", None
        if email and not validar_email(email):
            return False, "Formato de e-mail inválido.", None

        # Prevenção de duplicidade de CRM na mesma UF
        existente = self.repo.buscar_por_crm(crm.strip(), uf_crm.strip().upper())
        if existente:
            return False, f"Já existe médico cadastrado com o CRM {crm}/{uf_crm}.", None

        m = Medico(
            nome=nome.strip(), crm=crm.strip(), uf_crm=uf_crm.strip().upper(),
            especialidade=especialidade.strip(), telefone=telefone.strip(),
            email=email.strip() if email else None, ativo=True
        )
        novo_id = self.repo.criar(m)
        self.audit.registrar(Auditoria(
            login_usuario="SISTEMA", acao="CRIAR_MEDICO", entidade="MEDICOS",
            registro_id=novo_id, detalhes=f"Médico {nome} cadastrado com CRM {crm}/{uf_crm}"
        ))
        return True, "Médico cadastrado com sucesso.", novo_id

    def atualizar(self, medico_id: int, nome: str, crm: str, uf_crm: str, especialidade: str, telefone: str, email: str = "", ativo: bool = True) -> Tuple[bool, str]:
        existente = self.repo.buscar_por_id(medico_id)
        if not existente:
            return False, "Médico não encontrado."
        
        # Se alterou CRM, verifica se colide com outro
        outro = self.repo.buscar_por_crm(crm.strip(), uf_crm.strip().upper())
        if outro and outro["id"] != medico_id:
            return False, f"O CRM {crm}/{uf_crm} já pertence a outro profissional."

        m = Medico(
            id=medico_id, nome=nome.strip(), crm=crm.strip(), uf_crm=uf_crm.strip().upper(),
            especialidade=especialidade.strip(), telefone=telefone.strip(),
            email=email.strip() if email else None, ativo=ativo
        )
        self.repo.atualizar(m)
        self.audit.registrar(Auditoria(
            login_usuario="SISTEMA", acao="EDITAR_MEDICO", entidade="MEDICOS",
            registro_id=medico_id, detalhes=f"Médico {nome} atualizado."
        ))
        return True, "Dados do médico atualizados com sucesso."

    def excluir_logico(self, medico_id: int) -> Tuple[bool, str]:
        self.repo.excluir_logico(medico_id)
        self.audit.registrar(Auditoria(
            login_usuario="SISTEMA", acao="DESATIVAR_MEDICO", entidade="MEDICOS",
            registro_id=medico_id, detalhes=f"Desativação lógica do médico ID {medico_id}"
        ))
        return True, "Médico desativado do sistema com sucesso."

class EnfermeiroService:
    def __init__(self):
        self.repo = EnfermeiroRepository()
        self.audit = AuditoriaRepository()

    def cadastrar(self, nome: str, coren: str, uf_coren: str, setor: str, turno: str, telefone: str, email: str = "") -> Tuple[bool, str, Optional[int]]:
        if not nome or len(nome.strip()) < 3:
            return False, "Nome do enfermeiro deve conter ao menos 3 caracteres.", None
        valido, msg = validar_coren(coren)
        if not valido:
            return False, msg, None
        if not setor:
            return False, "Setor hospitalar/clínico é obrigatório.", None
        
        existente = self.repo.buscar_por_coren(coren.strip(), uf_coren.strip().upper())
        if existente:
            return False, f"Já existe profissional de enfermagem com o COREN {coren}/{uf_coren}.", None

        e = Enfermeiro(
            nome=nome.strip(), coren=coren.strip(), uf_coren=uf_coren.strip().upper(),
            setor=setor.strip(), turno=turno.strip(), telefone=telefone.strip(),
            email=email.strip() if email else None, ativo=True
        )
        novo_id = self.repo.criar(e)
        self.audit.registrar(Auditoria(
            login_usuario="SISTEMA", acao="CRIAR_ENFERMEIRO", entidade="ENFERMEIROS",
            registro_id=novo_id, detalhes=f"Enfermeiro {nome} cadastrado com COREN {coren}/{uf_coren}"
        ))
        return True, "Enfermeiro cadastrado com sucesso.", novo_id

    def excluir_logico(self, enfermeiro_id: int) -> Tuple[bool, str]:
        self.repo.excluir_logico(enfermeiro_id)
        return True, "Profissional de enfermagem desativado com sucesso."

class PacienteService:
    def __init__(self):
        self.repo = PacienteRepository()
        self.audit = AuditoriaRepository()

    def cadastrar(self, nome: str, cpf: str, data_nasc: str, sexo: str, telefone: str, email: str = "",
                  endereco: str = "", bairro: str = "", alergias: str = "", convenio: str = "PARTICULAR") -> Tuple[bool, str, Optional[int]]:
        if not nome or len(nome.strip()) < 3:
            return False, "Nome completo do paciente é obrigatório.", None
        
        cpf_limpo = cpf.strip() if cpf else ""
        if cpf_limpo:
            if not validar_cpf(cpf_limpo):
                return False, "Número de CPF inválido segundo o algoritmo oficial da Receita Federal.", None
            # Duplicidade
            existente = self.repo.buscar_por_cpf(formatar_cpf(cpf_limpo))
            if existente:
                return False, f"Já existe paciente cadastrado com este CPF ({cpf_limpo}).", None

        p = Paciente(
            nome=nome.strip(), cpf=formatar_cpf(cpf_limpo) if cpf_limpo else None,
            data_nascimento=data_nasc, sexo=sexo, telefone=telefone.strip(),
            email=email.strip() if email else None, endereco=endereco.strip() if endereco else None,
            bairro=bairro.strip() if bairro else None, alergias=alergias.strip() if alergias else None,
            convenio=convenio.strip() if convenio else "PARTICULAR", ativo=True
        )
        novo_id = self.repo.criar(p)
        self.audit.registrar(Auditoria(
            login_usuario="SISTEMA", acao="CRIAR_PACIENTE", entidade="PACIENTES",
            registro_id=novo_id, detalhes=f"Paciente {nome} cadastrado."
        ))
        return True, "Paciente cadastrado com sucesso.", novo_id

class AgendaService:
    def __init__(self):
        self.repo = AgendamentoRepository()
        self.audit = AuditoriaRepository()

    def agendar_consulta(self, paciente_id: int, medico_id: int, data_agenda: str, horario: str,
                         periodo: str, motivo: str, enfermeiro_id: Optional[int] = None,
                         observacoes: str = "", criado_por: str = "SISTEMA") -> Tuple[bool, str, Optional[int]]:
        if not paciente_id or not medico_id or not data_agenda or not horario or not motivo:
            return False, "Todos os campos obrigatórios da consulta devem ser preenchidos.", None

        # Verificação rigorosa de conflitos de horários
        if self.repo.verificar_conflito_horario(medico_id, data_agenda, horario):
            return False, f"O médico já possui outro agendamento registrado em {data_agenda} às {horario}.", None

        ag = Agendamento(
            paciente_id=paciente_id, medico_id=medico_id, enfermeiro_id=enfermeiro_id,
            data_agenda=data_agenda, horario=horario, periodo=periodo, motivo=motivo.strip(),
            status="AGENDADO", observacoes=observacoes.strip() if observacoes else None,
            criado_por=criado_por
        )
        novo_id = self.repo.criar(ag)
        self.audit.registrar(Auditoria(
            login_usuario=criado_por, acao="CRIAR_AGENDAMENTO", entidade="AGENDAMENTOS",
            registro_id=novo_id, detalhes=f"Consulta agendada para {data_agenda} às {horario}"
        ))
        return True, "Consulta agendada com sucesso.", novo_id

    def atualizar_status(self, agendamento_id: int, novo_status: str, observacoes: Optional[str] = None, usuario: str = "SISTEMA") -> Tuple[bool, str]:
        status_validos = ['AGENDADO', 'CONFIRMADO', 'EM_ATENDIMENTO', 'CONCLUIDO', 'CANCELADO', 'FALTOU']
        if novo_status not in status_validos:
            return False, f"Status inválido. Permitidos: {', '.join(status_validos)}"
        
        self.repo.atualizar_status(agendamento_id, novo_status, observacoes)
        self.audit.registrar(Auditoria(
            login_usuario=usuario, acao=f"STATUS_{novo_status}", entidade="AGENDAMENTOS",
            registro_id=agendamento_id, detalhes=f"Status da consulta alterado para {novo_status}"
        ))
        return True, f"Status da consulta atualizado para {novo_status}."

class RelatorioService:
    def __init__(self):
        self.agenda_repo = AgendamentoRepository()

    def gerar_csv_agendamentos(self, data_inicio: Optional[str] = None, data_fim: Optional[str] = None) -> str:
        agendamentos = self.agenda_repo.listar(data_inicio=data_inicio, data_fim=data_fim)
        output = io.StringIO()
        writer = csv.writer(output, delimiter=";", quoting=csv.QUOTE_MINIMAL)
        writer.writerow(["ID", "Data", "Horário", "Paciente", "CPF", "Médico", "Especialidade", "Status", "Motivo"])
        for a in agendamentos:
            writer.writerow([
                a.get("id"), a.get("data_agenda"), a.get("horario"),
                a.get("nome_paciente"), a.get("cpf_paciente") or "",
                a.get("nome_medico"), a.get("especialidade_medico"),
                a.get("status"), a.get("motivo")
            ])
        return output.getvalue()
