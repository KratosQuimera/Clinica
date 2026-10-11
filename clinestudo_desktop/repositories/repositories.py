from typing import List, Optional, Dict, Any
from clinestudo_desktop.database.connection import db_manager
from clinestudo_desktop.models.entities import Usuario, Medico, Enfermeiro, Paciente, Agendamento, Auditoria

class UsuarioRepository:
    def buscar_por_login(self, login: str) -> Optional[Dict[str, Any]]:
        rows = db_manager.execute_query(
            "SELECT * FROM usuarios WHERE login = %s",
            (login,)
        )
        return rows[0] if rows else None

    def buscar_por_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        rows = db_manager.execute_query(
            "SELECT * FROM usuarios WHERE id = %s",
            (user_id,)
        )
        return rows[0] if rows else None

    def listar_todos(self) -> List[Dict[str, Any]]:
        return db_manager.execute_query(
            "SELECT id, nome, login, perfil, ativo, tentativas_falhas, bloqueado_ate, criado_em FROM usuarios ORDER BY nome ASC"
        )

    def criar(self, u: Usuario) -> int:
        return db_manager.execute_mutation(
            """INSERT INTO usuarios (nome, login, senha_hash, salt, perfil, ativo, tentativas_falhas)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (u.nome, u.login, u.senha_hash, u.salt, u.perfil, 1 if u.ativo else 0, u.tentativas_falhas)
        )

    def atualizar(self, user_id: int, nome: str, perfil: str, ativo: bool) -> int:
        return db_manager.execute_mutation(
            "UPDATE usuarios SET nome = %s, perfil = %s, ativo = %s WHERE id = %s",
            (nome, perfil, 1 if ativo else 0, user_id)
        )

    def atualizar_senha(self, user_id: int, senha_hash: str, salt: str) -> int:
        return db_manager.execute_mutation(
            "UPDATE usuarios SET senha_hash = %s, salt = %s, tentativas_falhas = 0, bloqueado_ate = NULL WHERE id = %s",
            (senha_hash, salt, user_id)
        )

    def registrar_tentativa_falha(self, login: str, tentativas: int, bloqueado_ate: Optional[str]) -> int:
        return db_manager.execute_mutation(
            "UPDATE usuarios SET tentativas_falhas = %s, bloqueado_ate = %s WHERE login = %s",
            (tentativas, bloqueado_ate, login)
        )

    def resetar_bloqueio(self, login: str) -> int:
        return db_manager.execute_mutation(
            "UPDATE usuarios SET tentativas_falhas = 0, bloqueado_ate = NULL WHERE login = %s",
            (login,)
        )

class MedicoRepository:
    def listar(self, apenas_ativos: bool = True, termo_busca: str = "") -> List[Dict[str, Any]]:
        sql = "SELECT * FROM medicos WHERE 1=1"
        params = []
        if apenas_ativos:
            sql += " AND ativo = 1"
        if termo_busca:
            sql += " AND (nome LIKE %s OR crm LIKE %s OR especialidade LIKE %s)"
            termo = f"%{termo_busca}%"
            params.extend([termo, termo, termo])
        sql += " ORDER BY nome ASC"
        return db_manager.execute_query(sql, tuple(params))

    def buscar_por_id(self, medico_id: int) -> Optional[Dict[str, Any]]:
        rows = db_manager.execute_query("SELECT * FROM medicos WHERE id = %s", (medico_id,))
        return rows[0] if rows else None

    def buscar_por_crm(self, crm: str, uf: str) -> Optional[Dict[str, Any]]:
        rows = db_manager.execute_query("SELECT * FROM medicos WHERE crm = %s AND uf_crm = %s", (crm, uf))
        return rows[0] if rows else None

    def criar(self, m: Medico) -> int:
        return db_manager.execute_mutation(
            "INSERT INTO medicos (nome, crm, uf_crm, especialidade, telefone, email, ativo) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (m.nome, m.crm, m.uf_crm, m.especialidade, m.telefone, m.email, 1 if m.ativo else 0)
        )

    def atualizar(self, m: Medico) -> int:
        return db_manager.execute_mutation(
            "UPDATE medicos SET nome = %s, crm = %s, uf_crm = %s, especialidade = %s, telefone = %s, email = %s, ativo = %s WHERE id = %s",
            (m.nome, m.crm, m.uf_crm, m.especialidade, m.telefone, m.email, 1 if m.ativo else 0, m.id)
        )

    def excluir_logico(self, medico_id: int) -> int:
        return db_manager.execute_mutation("UPDATE medicos SET ativo = 0 WHERE id = %s", (medico_id,))

class EnfermeiroRepository:
    def listar(self, apenas_ativos: bool = True, termo_busca: str = "") -> List[Dict[str, Any]]:
        sql = "SELECT * FROM enfermeiros WHERE 1=1"
        params = []
        if apenas_ativos:
            sql += " AND ativo = 1"
        if termo_busca:
            sql += " AND (nome LIKE %s OR coren LIKE %s OR setor LIKE %s)"
            termo = f"%{termo_busca}%"
            params.extend([termo, termo, termo])
        sql += " ORDER BY nome ASC"
        return db_manager.execute_query(sql, tuple(params))

    def buscar_por_id(self, enfermeiro_id: int) -> Optional[Dict[str, Any]]:
        rows = db_manager.execute_query("SELECT * FROM enfermeiros WHERE id = %s", (enfermeiro_id,))
        return rows[0] if rows else None

    def buscar_por_coren(self, coren: str, uf: str) -> Optional[Dict[str, Any]]:
        rows = db_manager.execute_query("SELECT * FROM enfermeiros WHERE coren = %s AND uf_coren = %s", (coren, uf))
        return rows[0] if rows else None

    def criar(self, e: Enfermeiro) -> int:
        return db_manager.execute_mutation(
            "INSERT INTO enfermeiros (nome, coren, uf_coren, setor, turno, telefone, email, ativo) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (e.nome, e.coren, e.uf_coren, e.setor, e.turno, e.telefone, e.email, 1 if e.ativo else 0)
        )

    def atualizar(self, e: Enfermeiro) -> int:
        return db_manager.execute_mutation(
            "UPDATE enfermeiros SET nome = %s, coren = %s, uf_coren = %s, setor = %s, turno = %s, telefone = %s, email = %s, ativo = %s WHERE id = %s",
            (e.nome, e.coren, e.uf_coren, e.setor, e.turno, e.telefone, e.email, 1 if e.ativo else 0, e.id)
        )

    def excluir_logico(self, enfermeiro_id: int) -> int:
        return db_manager.execute_mutation("UPDATE enfermeiros SET ativo = 0 WHERE id = %s", (enfermeiro_id,))

class PacienteRepository:
    def listar(self, apenas_ativos: bool = True, termo_busca: str = "") -> List[Dict[str, Any]]:
        sql = "SELECT * FROM pacientes WHERE 1=1"
        params = []
        if apenas_ativos:
            sql += " AND ativo = 1"
        if termo_busca:
            sql += " AND (nome LIKE %s OR cpf LIKE %s OR telefone LIKE %s)"
            termo = f"%{termo_busca}%"
            params.extend([termo, termo, termo])
        sql += " ORDER BY nome ASC"
        return db_manager.execute_query(sql, tuple(params))

    def buscar_por_id(self, paciente_id: int) -> Optional[Dict[str, Any]]:
        rows = db_manager.execute_query("SELECT * FROM pacientes WHERE id = %s", (paciente_id,))
        return rows[0] if rows else None

    def buscar_por_cpf(self, cpf: str) -> Optional[Dict[str, Any]]:
        rows = db_manager.execute_query("SELECT * FROM pacientes WHERE cpf = %s", (cpf,))
        return rows[0] if rows else None

    def criar(self, p: Paciente) -> int:
        return db_manager.execute_mutation(
            """INSERT INTO pacientes (nome, cpf, data_nascimento, sexo, telefone, email, endereco, bairro, cidade, uf, alergias, convenio, ativo)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (p.nome, p.cpf, p.data_nascimento, p.sexo, p.telefone, p.email, p.endereco, p.bairro, p.cidade, p.uf, p.alergias, p.convenio, 1 if p.ativo else 0)
        )

    def atualizar(self, p: Paciente) -> int:
        return db_manager.execute_mutation(
            """UPDATE pacientes SET nome = %s, cpf = %s, data_nascimento = %s, sexo = %s, telefone = %s, email = %s,
               endereco = %s, bairro = %s, cidade = %s, uf = %s, alergias = %s, convenio = %s, ativo = %s WHERE id = %s""",
            (p.nome, p.cpf, p.data_nascimento, p.sexo, p.telefone, p.email, p.endereco, p.bairro, p.cidade, p.uf, p.alergias, p.convenio, 1 if p.ativo else 0, p.id)
        )

    def excluir_logico(self, paciente_id: int) -> int:
        return db_manager.execute_mutation("UPDATE pacientes SET ativo = 0 WHERE id = %s", (paciente_id,))

class AgendamentoRepository:
    def listar(self, data_inicio: Optional[str] = None, data_fim: Optional[str] = None, medico_id: Optional[int] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
        sql = """
            SELECT a.*, p.nome AS nome_paciente, p.telefone AS tel_paciente, p.cpf AS cpf_paciente,
                   m.nome AS nome_medico, m.especialidade AS especialidade_medico,
                   e.nome AS nome_enfermeiro
            FROM agendamentos a
            JOIN pacientes p ON a.paciente_id = p.id
            JOIN medicos m ON a.medico_id = m.id
            LEFT JOIN enfermeiros e ON a.enfermeiro_id = e.id
            WHERE 1=1
        """
        params = []
        if data_inicio:
            sql += " AND a.data_agenda >= %s"
            params.append(data_inicio)
        if data_fim:
            sql += " AND a.data_agenda <= %s"
            params.append(data_fim)
        if medico_id:
            sql += " AND a.medico_id = %s"
            params.append(medico_id)
        if status:
            sql += " AND a.status = %s"
            params.append(status)
        sql += " ORDER BY a.data_agenda ASC, a.horario ASC"
        return db_manager.execute_query(sql, tuple(params))

    def verificar_conflito_horario(self, medico_id: int, data_agenda: str, horario: str, ignorar_id: Optional[int] = None) -> bool:
        """Verifica se o médico já possui consulta agendada no mesmo horário."""
        sql = "SELECT id FROM agendamentos WHERE medico_id = %s AND data_agenda = %s AND horario = %s AND status != 'CANCELADO'"
        params = [medico_id, data_agenda, horario]
        if ignorar_id:
            sql += " AND id != %s"
            params.append(ignorar_id)
        rows = db_manager.execute_query(sql, tuple(params))
        return len(rows) > 0

    def criar(self, a: Agendamento) -> int:
        return db_manager.execute_mutation(
            """INSERT INTO agendamentos (paciente_id, medico_id, enfermeiro_id, data_agenda, horario, periodo, motivo, status, observacoes, criado_por)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (a.paciente_id, a.medico_id, a.enfermeiro_id, a.data_agenda, a.horario, a.periodo, a.motivo, a.status, a.observacoes, a.criado_por)
        )

    def atualizar_status(self, agendamento_id: int, novo_status: str, observacoes: Optional[str] = None) -> int:
        if observacoes is not None:
            return db_manager.execute_mutation(
                "UPDATE agendamentos SET status = %s, observacoes = %s WHERE id = %s",
                (novo_status, observacoes, agendamento_id)
            )
        return db_manager.execute_mutation(
            "UPDATE agendamentos SET status = %s WHERE id = %s",
            (novo_status, agendamento_id)
        )

class AuditoriaRepository:
    def registrar(self, a: Auditoria) -> int:
        return db_manager.execute_mutation(
            """INSERT INTO auditoria (usuario_id, login_usuario, acao, entidade, registro_id, detalhes, ip_origem)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (a.usuario_id, a.login_usuario, a.acao, a.entidade, a.registro_id, a.detalhes, a.ip_origem)
        )

    def listar(self, limite: int = 100, filtro_acao: Optional[str] = None) -> List[Dict[str, Any]]:
        sql = "SELECT * FROM auditoria WHERE 1=1"
        params = []
        if filtro_acao:
            sql += " AND acao = %s"
            params.append(filtro_acao)
        sql += " ORDER BY id DESC LIMIT %s"
        params.append(limite)
        return db_manager.execute_query(sql, tuple(params))
