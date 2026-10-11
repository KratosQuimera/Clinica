import logging
from typing import Optional, List, Dict, Any, Tuple
from clinestudo_desktop.modelo_connection.conexao_bd import conexao_bd
from clinestudo_desktop.modelo_beans.beans import (
    BeansMedico, BeansPacientes, BeansUsuario, BeansEnfermeira, BeansAgenda
)
from clinestudo_desktop.auth.hasher import hash_password, verify_password
from clinestudo_desktop.services.validators import validar_cpf, formatar_cpf, validar_crm, validar_coren

logger = logging.getLogger("clinestudo.daos")

class DaoMedico:
    """Implementação do DaoMedico.java original preservando métodos salvar, editar, excluir, buscaMedico."""
    def salvar(self, mod: BeansMedico) -> Tuple[bool, str]:
        if not mod.nome or len(mod.nome.strip()) < 3:
            return False, "Nome do médico é obrigatório."
        val_crm, msg_crm = validar_crm(mod.crm)
        if not val_crm:
            return False, msg_crm

        # Verifica duplicidade
        existente = conexao_bd.executaSql(
            "SELECT id FROM medicos WHERE crm = %s AND uf_crm = %s",
            (mod.crm.strip(), mod.uf_crm.strip().upper())
        )
        if existente:
            return False, f"CRM {mod.crm}/{mod.uf_crm} já cadastrado no sistema."

        try:
            conexao_bd.executaUpdate(
                """INSERT INTO medicos (nome, crm, uf_crm, especialidade, telefone, email, ativo)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (mod.nome.strip(), mod.crm.strip(), mod.uf_crm.strip().upper(),
                 mod.especialidade.strip(), mod.telefone.strip(), mod.email or "", 1 if mod.ativo else 0)
            )
            return True, "Médico cadastrado com sucesso!"
        except Exception as e:
            logger.error(f"Erro ao salvar médico: {e}")
            return False, "Erro ao gravar dados no banco de dados."

    def editar(self, mod: BeansMedico) -> Tuple[bool, str]:
        med_id = mod.codigo or mod.cod_medico
        if not med_id:
            return False, "ID do médico não informado para alteração."

        # Verifica colisão de CRM
        outro = conexao_bd.executaSql(
            "SELECT id FROM medicos WHERE crm = %s AND uf_crm = %s AND id != %s",
            (mod.crm.strip(), mod.uf_crm.strip().upper(), med_id)
        )
        if outro:
            return False, f"O CRM {mod.crm}/{mod.uf_crm} já pertence a outro profissional."

        try:
            conexao_bd.executaUpdate(
                """UPDATE medicos SET nome = %s, crm = %s, uf_crm = %s, especialidade = %s,
                   telefone = %s, email = %s, ativo = %s WHERE id = %s""",
                (mod.nome.strip(), mod.crm.strip(), mod.uf_crm.strip().upper(),
                 mod.especialidade.strip(), mod.telefone.strip(), mod.email or "", 1 if mod.ativo else 0, med_id)
            )
            return True, "Dados do médico alterados com sucesso!"
        except Exception as e:
            logger.error(f"Erro ao editar médico: {e}")
            return False, "Erro ao atualizar dados no banco de dados."

    def excluir(self, mod: BeansMedico) -> Tuple[bool, str]:
        """Exclusão controlada (lógica) para integridade referencial e auditoria."""
        med_id = mod.codigo or mod.cod_medico
        if not med_id:
            return False, "Selecione um médico para desativação."
        try:
            conexao_bd.executaUpdate("UPDATE medicos SET ativo = 0 WHERE id = %s", (med_id,))
            return True, "Médico desativado do sistema com sucesso!"
        except Exception as e:
            logger.error(f"Erro ao excluir médico: {e}")
            return False, "Erro ao desativar médico no banco de dados."

    def buscaMedico(self, mod: BeansMedico) -> Optional[BeansMedico]:
        termo = f"%{mod.pesquisa}%"
        rows = conexao_bd.executaSql(
            "SELECT * FROM medicos WHERE nome LIKE %s OR crm LIKE %s LIMIT 1",
            (termo, termo)
        )
        if rows:
            r = rows[0]
            return BeansMedico(
                codigo=r["id"],
                cod_medico=r["id"],
                nome=r["nome"],
                nome_medico=r["nome"],
                crm=r["crm"],
                crm_medico=r["crm"],
                uf_crm=r.get("uf_crm", "SP"),
                especialidade=r["especialidade"],
                especialidade_medico=r["especialidade"],
                telefone=r["telefone"],
                email=r.get("email"),
                ativo=bool(r["ativo"])
            )
        return None

    def listar(self, apenas_ativos: bool = True, termo: str = "") -> List[Dict[str, Any]]:
        sql = "SELECT id, nome, crm, uf_crm, especialidade, telefone, email, ativo FROM medicos WHERE 1=1"
        params = []
        if apenas_ativos:
            sql += " AND ativo = 1"
        if termo:
            sql += " AND (nome LIKE %s OR crm LIKE %s OR especialidade LIKE %s)"
            t = f"%{termo}%"
            params.extend([t, t, t])
        sql += " ORDER BY nome ASC"
        return conexao_bd.executaSql(sql, tuple(params))


class DaoPacientes:
    """Implementação do DaoPacientes.java original com validação oficial de CPF."""
    def salvar(self, mod: BeansPacientes) -> Tuple[bool, str]:
        if not mod.paci_nome or len(mod.paci_nome.strip()) < 3:
            return False, "Nome completo do paciente é obrigatório."
        
        cpf_formatado = None
        if mod.paci_cpf.strip():
            if not validar_cpf(mod.paci_cpf):
                return False, "Número de CPF inválido segundo o algoritmo oficial da Receita Federal."
            cpf_formatado = formatar_cpf(mod.paci_cpf)
            # Unicidade
            existente = conexao_bd.executaSql("SELECT id FROM pacientes WHERE cpf = %s", (cpf_formatado,))
            if existente:
                return False, f"Já existe paciente cadastrado com este CPF ({cpf_formatado})."

        try:
            conexao_bd.executaUpdate(
                """INSERT INTO pacientes (nome, cpf, data_nascimento, sexo, telefone, email, endereco, bairro, cidade, uf, alergias, convenio, ativo)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (mod.paci_nome.strip(), cpf_formatado, mod.paci_nasc or "1990-01-01",
                 mod.sexo, mod.paci_tel.strip(), mod.email or "", mod.paci_rua.strip(),
                 mod.paci_ba_nome.strip(), "São Paulo", "SP", mod.alergias or "", mod.convenio or "PARTICULAR", 1 if mod.ativo else 0)
            )
            return True, "Paciente cadastrado com sucesso!"
        except Exception as e:
            logger.error(f"Erro ao salvar paciente: {e}")
            return False, "Erro ao gravar dados do paciente no banco de dados."

    def editar(self, mod: BeansPacientes) -> Tuple[bool, str]:
        paci_id = mod.paci_codigo
        if not paci_id:
            return False, "Código do paciente não informado para alteração."

        cpf_formatado = None
        if mod.paci_cpf.strip():
            if not validar_cpf(mod.paci_cpf):
                return False, "CPF informado é inválido."
            cpf_formatado = formatar_cpf(mod.paci_cpf)
            outro = conexao_bd.executaSql("SELECT id FROM pacientes WHERE cpf = %s AND id != %s", (cpf_formatado, paci_id))
            if outro:
                return False, f"O CPF {cpf_formatado} já pertence a outro paciente cadastrado."

        try:
            conexao_bd.executaUpdate(
                """UPDATE pacientes SET nome = %s, cpf = %s, data_nascimento = %s, sexo = %s,
                   telefone = %s, email = %s, endereco = %s, bairro = %s, alergias = %s,
                   convenio = %s, ativo = %s WHERE id = %s""",
                (mod.paci_nome.strip(), cpf_formatado, mod.paci_nasc, mod.sexo,
                 mod.paci_tel.strip(), mod.email or "", mod.paci_rua.strip(), mod.paci_ba_nome.strip(),
                 mod.alergias or "", mod.convenio, 1 if mod.ativo else 0, paci_id)
            )
            return True, "Dados do paciente alterados com sucesso!"
        except Exception as e:
            logger.error(f"Erro ao editar paciente: {e}")
            return False, "Erro ao atualizar dados do paciente."

    def excluir(self, mod: BeansPacientes) -> Tuple[bool, str]:
        paci_id = mod.paci_codigo
        if not paci_id:
            return False, "Selecione um paciente para desativação."
        try:
            conexao_bd.executaUpdate("UPDATE pacientes SET ativo = 0 WHERE id = %s", (paci_id,))
            return True, "Paciente desativado logicamente com sucesso!"
        except Exception as e:
            logger.error(f"Erro ao excluir paciente: {e}")
            return False, "Erro ao desativar paciente."

    def listar(self, apenas_ativos: bool = True, termo: str = "") -> List[Dict[str, Any]]:
        sql = "SELECT id, nome, cpf, data_nascimento, sexo, telefone, email, endereco, bairro, alergias, convenio, ativo FROM pacientes WHERE 1=1"
        params = []
        if apenas_ativos:
            sql += " AND ativo = 1"
        if termo:
            sql += " AND (nome LIKE %s OR cpf LIKE %s OR telefone LIKE %s)"
            t = f"%{termo}%"
            params.extend([t, t, t])
        sql += " ORDER BY nome ASC"
        return conexao_bd.executaSql(sql, tuple(params))


class DaoUsuario:
    """Implementação do DaoUsuario.java original com segurança OWASP (PBKDF2/Argon2) e bloqueio."""
    def salvar(self, mod: BeansUsuario) -> Tuple[bool, str]:
        if not mod.usu_nome.strip() or not mod.usu_login.strip():
            return False, "Nome e login de usuário são obrigatórios."
        if not mod.usu_senha or len(mod.usu_senha) < 6:
            return False, "A senha deve conter ao menos 6 caracteres."

        existente = conexao_bd.executaSql("SELECT id FROM usuarios WHERE login = %s", (mod.usu_login.strip().lower(),))
        if existente:
            return False, f"O login '{mod.usu_login}' já está em uso."

        senha_hash, salt = hash_password(mod.usu_senha)
        try:
            conexao_bd.executaUpdate(
                """INSERT INTO usuarios (nome, login, senha_hash, salt, perfil, ativo, tentativas_falhas)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (mod.usu_nome.strip(), mod.usu_login.strip().lower(), senha_hash, salt,
                 mod.usu_tipo.upper(), 1 if mod.ativo else 0, 0)
            )
            return True, "Usuário cadastrado com sucesso!"
        except Exception as e:
            logger.error(f"Erro ao salvar usuário: {e}")
            return False, "Erro ao cadastrar usuário."

    def editar(self, mod: BeansUsuario) -> Tuple[bool, str]:
        user_id = mod.usu_cod
        if not user_id:
            return False, "Código do usuário não informado."

        try:
            conexao_bd.executaUpdate(
                "UPDATE usuarios SET nome = %s, perfil = %s, ativo = %s WHERE id = %s",
                (mod.usu_nome.strip(), mod.usu_tipo.upper(), 1 if mod.ativo else 0, user_id)
            )
            return True, "Dados do usuário atualizados com sucesso!"
        except Exception as e:
            logger.error(f"Erro ao editar usuário: {e}")
            return False, "Erro ao atualizar dados do usuário."

    def redefinir_senha(self, user_id: int, nova_senha: str) -> Tuple[bool, str]:
        if len(nova_senha) < 6:
            return False, "A nova senha deve possuir ao menos 6 caracteres."
        s_hash, s_salt = hash_password(nova_senha)
        try:
            conexao_bd.executaUpdate(
                "UPDATE usuarios SET senha_hash = %s, salt = %s, tentativas_falhas = 0, bloqueado_ate = NULL WHERE id = %s",
                (s_hash, s_salt, user_id)
            )
            return True, "Senha redefinida com sucesso com hash seguro!"
        except Exception as e:
            logger.error(f"Erro ao redefinir senha: {e}")
            return False, "Erro ao gravar nova senha."

    def listar(self) -> List[Dict[str, Any]]:
        return conexao_bd.executaSql(
            "SELECT id, nome, login, perfil, ativo, tentativas_falhas, bloqueado_ate, criado_em FROM usuarios ORDER BY nome ASC"
        )
