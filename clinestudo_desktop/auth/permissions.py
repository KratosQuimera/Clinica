from enum import Enum
from typing import Set, Dict

class PerfilUsuario(str, Enum):
    ADMINISTRADOR = "ADMINISTRADOR"
    MEDICO = "MEDICO"
    ENFERMEIRO = "ENFERMEIRO"
    RECEPCIONISTA = "RECEPCIONISTA"

# Matriz de Controle de Acesso Baseado em Funções (RBAC)
PERMISSOES_POR_PERFIL: Dict[str, Set[str]] = {
    PerfilUsuario.ADMINISTRADOR: {
        "usuarios:criar", "usuarios:listar", "usuarios:editar", "usuarios:bloquear", "usuarios:resetar_senha",
        "medicos:criar", "medicos:listar", "medicos:editar", "medicos:excluir",
        "enfermeiros:criar", "enfermeiros:listar", "enfermeiros:editar", "enfermeiros:excluir",
        "pacientes:criar", "pacientes:listar", "pacientes:editar", "pacientes:excluir",
        "agenda:criar", "agenda:listar", "agenda:editar", "agenda:cancelar",
        "relatorios:visualizar", "relatorios:exportar",
        "auditoria:visualizar"
    },
    PerfilUsuario.MEDICO: {
        "pacientes:listar", "pacientes:editar",
        "agenda:listar", "agenda:editar",
        "medicos:listar",
        "relatorios:visualizar"
    },
    PerfilUsuario.ENFERMEIRO: {
        "pacientes:listar", "pacientes:editar",
        "agenda:listar",
        "enfermeiros:listar"
    },
    PerfilUsuario.RECEPCIONISTA: {
        "pacientes:criar", "pacientes:listar", "pacientes:editar",
        "agenda:criar", "agenda:listar", "agenda:editar", "agenda:cancelar",
        "medicos:listar", "enfermeiros:listar",
        "relatorios:visualizar"
    }
}

def usuario_possui_permissao(perfil: str, permissao: str) -> bool:
    """Verifica se o perfil possui a permissão requerida."""
    permissoes = PERMISSOES_POR_PERFIL.get(perfil, set())
    return permissao in permissoes
