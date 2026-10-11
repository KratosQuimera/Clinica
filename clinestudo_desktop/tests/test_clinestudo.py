import os
import unittest
import sqlite3
import tempfile
from datetime import datetime, timedelta

os.environ["SQLITE_PATH"] = ":memory:"
os.environ["ALLOW_SQLITE_FALLBACK"] = "true"

from clinestudo_desktop.config.settings import settings
from clinestudo_desktop.database.migrations import init_database
from clinestudo_desktop.database.connection import db_manager
from clinestudo_desktop.auth.hasher import hash_password, verify_password
from clinestudo_desktop.auth.permissions import usuario_possui_permissao, PerfilUsuario
from clinestudo_desktop.services.validators import validar_cpf, validar_crm, validar_coren, formatar_cpf
from clinestudo_desktop.services.services import (
    AuthService, MedicoService, EnfermeiroService, PacienteService, AgendaService
)
from clinestudo_desktop.repositories.repositories import (
    UsuarioRepository, MedicoRepository, EnfermeiroRepository,
    PacienteRepository, AgendamentoRepository, AuditoriaRepository
)
# Módulos no formato NetBeans
from clinestudo_desktop.modelo_beans.beans import (
    BeansMedico, BeansPacientes, BeansUsuario, BeansEnfermeira, ModeloTabela
)
from clinestudo_desktop.modelo_dao.daos import (
    DaoMedico, DaoPacientes, DaoUsuario
)
from clinestudo_desktop.modelo_connection.conexao_bd import conexao_bd

class TestClinEstudoSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_database()
        cls.auth_service = AuthService()
        cls.medico_service = MedicoService()
        cls.enfermeiro_service = EnfermeiroService()
        cls.paciente_service = PacienteService()
        cls.agenda_service = AgendaService()
        cls.audit_repo = AuditoriaRepository()
        cls.dao_medico = DaoMedico()
        cls.dao_pacientes = DaoPacientes()
        cls.dao_usuario = DaoUsuario()

    # 1. TESTES DE AUTENTICAÇÃO E BLOQUEIO DE SEGURANÇA
    def test_01_login_autorizado(self):
        sucesso, msg, user = self.auth_service.autenticar("admin", "admin123")
        self.assertTrue(sucesso)
        self.assertIsNotNone(user)
        self.assertEqual(user["login"], "admin")
        self.assertEqual(user["perfil"], "ADMINISTRADOR")

    def test_02_login_negado_senha_incorreta(self):
        sucesso, msg, user = self.auth_service.autenticar("admin", "senha_errada")
        self.assertFalse(sucesso)
        self.assertIn("Credenciais inválidas", msg)

    def test_03_login_negado_usuario_inexistente(self):
        sucesso, msg, user = self.auth_service.autenticar("usuario_fantasma_xyz", "123456")
        self.assertFalse(sucesso)
        self.assertIn("Credenciais inválidas", msg)

    def test_04_bloqueio_temporario_apos_tentativas_excessivas(self):
        user_repo = UsuarioRepository()
        h, s = hash_password("teste123")
        user_repo.criar(type("U", (), {
            "nome": "Usuário Teste Bloqueio", "login": "user.bloqueio", "senha_hash": h,
            "salt": s, "perfil": "RECEPCIONISTA", "ativo": True, "tentativas_falhas": 0
        }))

        self.auth_service.autenticar("user.bloqueio", "errada1")
        self.auth_service.autenticar("user.bloqueio", "errada2")
        
        sucesso, msg, _ = self.auth_service.autenticar("user.bloqueio", "errada3")
        self.assertFalse(sucesso)
        self.assertIn("Conta bloqueada temporariamente", msg)

        sucesso_bloq, msg_bloq, _ = self.auth_service.autenticar("user.bloqueio", "teste123")
        self.assertFalse(sucesso_bloq)
        self.assertIn("Conta bloqueada por excesso de tentativas", msg_bloq)

    # 2. TESTES DE PERMISSÕES RBAC
    def test_05_permissoes_por_perfil(self):
        self.assertTrue(usuario_possui_permissao(PerfilUsuario.ADMINISTRADOR, "usuarios:criar"))
        self.assertTrue(usuario_possui_permissao(PerfilUsuario.ADMINISTRADOR, "auditoria:visualizar"))
        self.assertTrue(usuario_possui_permissao(PerfilUsuario.ADMINISTRADOR, "medicos:criar"))

        self.assertFalse(usuario_possui_permissao(PerfilUsuario.MEDICO, "usuarios:criar"))
        self.assertFalse(usuario_possui_permissao(PerfilUsuario.MEDICO, "medicos:criar"))
        self.assertTrue(usuario_possui_permissao(PerfilUsuario.MEDICO, "agenda:listar"))

        self.assertTrue(usuario_possui_permissao(PerfilUsuario.RECEPCIONISTA, "agenda:criar"))
        self.assertTrue(usuario_possui_permissao(PerfilUsuario.RECEPCIONISTA, "pacientes:criar"))
        self.assertFalse(usuario_possui_permissao(PerfilUsuario.RECEPCIONISTA, "auditoria:visualizar"))

    # 3. TESTES DE VALIDAÇÃO DE NEGÓCIO E CPF
    def test_06_validador_cpf_algoritmo_oficial(self):
        self.assertTrue(validar_cpf("52998224725"))
        self.assertTrue(validar_cpf("529.982.247-25"))
        self.assertTrue(validar_cpf("11144477735"))

        self.assertFalse(validar_cpf("52998224726"))
        self.assertFalse(validar_cpf("12345678900"))
        self.assertFalse(validar_cpf("11111111111"))
        self.assertFalse(validar_cpf("00000000000"))
        self.assertFalse(validar_cpf("99999999999"))

    def test_07_validadores_crm_e_coren(self):
        valido_crm, _ = validar_crm("123456")
        self.assertTrue(valido_crm)
        invalido_crm, _ = validar_crm("12")
        self.assertFalse(invalido_crm)

        valido_coren, _ = validar_coren("456789")
        self.assertTrue(valido_coren)
        invalido_coren, _ = validar_coren("")
        self.assertFalse(invalido_coren)

    # 4. TESTES CRUD E PREVENÇÃO DE DUPLICIDADES
    def test_08_crud_medicos_e_duplicidade_crm(self):
        crm_teste = "998877"
        sucesso, msg, med_id = self.medico_service.cadastrar(
            nome="Dr. Teste Automatizado", crm=crm_teste, uf_crm="SP",
            especialidade="Neurologia", telefone="(11) 98888-7777"
        )
        self.assertTrue(sucesso)
        self.assertIsNotNone(med_id)

        dup_sucesso, dup_msg, _ = self.medico_service.cadastrar(
            nome="Outro Médico", crm=crm_teste, uf_crm="SP",
            especialidade="Clínica Geral", telefone="(11) 97777-6666"
        )
        self.assertFalse(dup_sucesso)
        self.assertIn("Já existe médico cadastrado", dup_msg)

    def test_09_crud_pacientes_e_duplicidade_cpf(self):
        cpf_valido = "529.982.247-25"
        sucesso, msg, _ = self.paciente_service.cadastrar(
            nome="Paciente Duplicado Teste", cpf=cpf_valido, data_nasc="1990-01-01",
            sexo="M", telefone="(11) 91111-2222"
        )
        self.assertFalse(sucesso)
        self.assertIn("Já existe paciente cadastrado", msg)

    # 5. TESTES DE AGENDAMENTO E PREVENÇÃO DE CONFLITOS DE HORÁRIO
    def test_10_prevencao_conflito_horario_agenda(self):
        data_consulta = "2026-10-25"
        horario_consulta = "09:30"
        medico_id = 1
        paciente_id = 1

        sucesso1, msg1, ag_id = self.agenda_service.agendar_consulta(
            paciente_id=paciente_id, medico_id=medico_id, data_agenda=data_consulta,
            horario=horario_consulta, periodo="MANHÃ", motivo="Avaliação Inicial"
        )
        self.assertTrue(sucesso1)

        sucesso2, msg2, _ = self.agenda_service.agendar_consulta(
            paciente_id=2, medico_id=medico_id, data_agenda=data_consulta,
            horario=horario_consulta, periodo="MANHÃ", motivo="Retorno"
        )
        self.assertFalse(sucesso2)
        self.assertIn("já possui outro agendamento registrado", msg2)

    def test_11_transicao_de_status_agendamento(self):
        data_c = "2026-10-26"
        sucesso, _, ag_id = self.agenda_service.agendar_consulta(
            paciente_id=1, medico_id=1, data_agenda=data_c, horario="14:00",
            periodo="TARDE", motivo="Consulta Rotina"
        )
        self.assertTrue(sucesso)

        s1, _ = self.agenda_service.atualizar_status(ag_id, "CONFIRMADO")
        self.assertTrue(s1)
        s2, _ = self.agenda_service.atualizar_status(ag_id, "EM_ATENDIMENTO")
        self.assertTrue(s2)
        s3, _ = self.agenda_service.atualizar_status(ag_id, "CONCLUIDO", "Paciente orientado.")
        self.assertTrue(s3)

    # 6. TESTES DE AUDITORIA LGPD E RESILIÊNCIA
    def test_12_auditoria_sem_exposicao_de_senhas(self):
        logs = self.audit_repo.listar(limite=50)
        self.assertGreater(len(logs), 0)
        for log in logs:
            detalhes = log.get("detalhes") or ""
            self.assertNotIn("admin123", detalhes)
            self.assertNotIn("senha_errada", detalhes)
            self.assertNotIn("errada1", detalhes)

    # 7. TESTES ESPECÍFICOS DO FORMATO ADAPTADO NETBEANS (BEANS, DAO E MODELOTABELA)
    def test_13_adaptador_beans_e_dao_medico_netbeans(self):
        med = BeansMedico(
            nome="Dra. Mariana NetBeans",
            crm="887766",
            uf_crm="SP",
            especialidade="Dermatologia Clínica",
            telefone="(11) 98888-0000"
        )
        ok, msg = self.dao_medico.salvar(med)
        self.assertTrue(ok)

        # Busca pelo método clássico buscaMedico
        busca_mod = BeansMedico(pesquisa="Mariana NetBeans")
        resultado = self.dao_medico.buscaMedico(busca_mod)
        self.assertIsNotNone(resultado)
        self.assertEqual(resultado.crm, "887766")

        # ModeloTabela
        linhas = [[resultado.codigo, resultado.nome, resultado.especialidade, resultado.crm]]
        colunas = ["Código", "Nome", "Especialidade", "CRM"]
        tab = ModeloTabela(linhas, colunas)
        self.assertEqual(tab.get_row_count(), 1)
        self.assertEqual(tab.get_column_count(), 4)
        self.assertEqual(tab.get_value_at(0, 1), "Dra. Mariana NetBeans")

    def test_14_adaptador_dao_pacientes_netbeans(self):
        pac = BeansPacientes(
            paci_nome="Carlos Eduardo NetBeans",
            paci_cpf="215.378.798-04",
            paci_nasc="1985-05-20",
            paci_tel="(11) 97777-1111",
            paci_rua="Rua das Palmeiras, 100",
            paci_ba_nome="Centro",
            sexo="M",
            convenio="Bradesco Saúde"
        )
        ok, msg = self.dao_pacientes.salvar(pac)
        self.assertTrue(ok)

if __name__ == "__main__":
    unittest.main()
