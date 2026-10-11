from dataclasses import dataclass, field
from typing import Optional, List, Any

@dataclass
class BeansMedico:
    """Modelo Beans referente ao BeansMedico.java original do NetBeans."""
    codigo: Optional[int] = None
    cod_medico: Optional[int] = None
    nome: str = ""
    nome_medico: str = ""
    crm: str = ""
    crm_medico: str = ""
    uf_crm: str = "SP"
    especialidade: str = ""
    especialidade_medico: str = ""
    telefone: str = ""
    email: Optional[str] = None
    ativo: bool = True
    pesquisa: str = ""

    def __post_init__(self):
        # Sincroniza campos com nomes legados e modernos
        if self.codigo is not None and self.cod_medico is None:
            self.cod_medico = self.codigo
        elif self.cod_medico is not None and self.codigo is None:
            self.codigo = self.cod_medico
            
        if self.nome and not self.nome_medico:
            self.nome_medico = self.nome
        elif self.nome_medico and not self.nome:
            self.nome = self.nome_medico

        if self.crm and not self.crm_medico:
            self.crm_medico = self.crm
        elif self.crm_medico and not self.crm:
            self.crm = self.crm_medico

        if self.especialidade and not self.especialidade_medico:
            self.especialidade_medico = self.especialidade
        elif self.especialidade_medico and not self.especialidade:
            self.especialidade = self.especialidade_medico

@dataclass
class BeansPacientes:
    """Modelo Beans referente ao BeansPacientes.java original do NetBeans."""
    paci_codigo: Optional[int] = None
    paci_nome: str = ""
    paci_nasc: str = ""
    paci_rg: str = ""
    paci_cpf: str = ""
    paci_tel: str = ""
    paci_rua: str = ""
    paci_cep: str = ""
    paci_complemento: str = ""
    paci_ba_nome: str = ""
    sexo: str = "F"
    email: Optional[str] = None
    alergias: Optional[str] = None
    convenio: str = "PARTICULAR"
    ativo: bool = True
    pesquisa: str = ""

@dataclass
class BeansUsuario:
    """Modelo Beans referente ao BeansUsuario.java original do NetBeans."""
    usu_cod: Optional[int] = None
    usu_nome: str = ""
    usu_login: str = ""
    usu_tipo: str = "RECEPCIONISTA" # ADMINISTRADOR, MEDICO, ENFERMEIRO, RECEPCIONISTA
    usu_senha: str = ""
    usu_senha_hash: str = ""
    salt: str = ""
    ativo: bool = True
    tentativas_falhas: int = 0
    bloqueado_ate: Optional[str] = None
    pesquisa: str = ""

@dataclass
class BeansEnfermeira:
    """Modelo Beans para Enfermeiras integrado ao padrão NetBeans."""
    enf_codigo: Optional[int] = None
    enf_nome: str = ""
    enf_coren: str = ""
    enf_uf: str = "SP"
    enf_setor: str = "Triagem"
    enf_turno: str = "MANHÃ"
    enf_telefone: str = ""
    enf_email: Optional[str] = None
    ativo: bool = True

@dataclass
class BeansAgenda:
    """Modelo Beans referente a agendamentos de consultas."""
    agenda_cod: Optional[int] = None
    agenda_codpaciente: int = 0
    agenda_codmedico: int = 0
    agenda_codenfermeira: Optional[int] = None
    agenda_data: str = ""
    agenda_horario: str = ""
    agenda_turno: str = "MANHÃ"
    agenda_motivo: str = ""
    agenda_status: str = "AGENDADO"
    agenda_obs: Optional[str] = None
    agenda_paciente_nome: str = ""
    agenda_medico_nome: str = ""

class ModeloTabela:
    """
    Equivalente direto da classe ModeloTabela.java do projeto NetBeans original.
    Gerencia linhas (ArrayList de Object[]) e colunas da tabela Swing/PySide.
    """
    def __init__(self, linhas: Optional[List[List[Any]]] = None, colunas: Optional[List[str]] = None):
        self._linhas = linhas or []
        self._colunas = colunas or []

    def get_row_count(self) -> int:
        return len(self._linhas)

    def get_column_count(self) -> int:
        return len(self._colunas)

    def get_column_name(self, index: int) -> str:
        return self._colunas[index] if 0 <= index < len(self._colunas) else ""

    def get_value_at(self, row: int, col: int) -> Any:
        if 0 <= row < len(self._linhas) and 0 <= col < len(self._linhas[row]):
            return self._linhas[row][col]
        return None

    def get_linhas(self) -> List[List[Any]]:
        return self._linhas

    def set_linhas(self, linhas: List[List[Any]]):
        self._linhas = linhas
