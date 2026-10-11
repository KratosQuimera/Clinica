from dataclasses import dataclass, field
from datetime import datetime, date, time
from typing import Optional

@dataclass
class Usuario:
    id: Optional[int] = None
    nome: str = ""
    login: str = ""
    senha_hash: str = ""
    salt: str = ""
    perfil: str = "RECEPCIONISTA"
    ativo: bool = True
    tentativas_falhas: int = 0
    bloqueado_ate: Optional[datetime] = None
    criado_em: Optional[datetime] = None

@dataclass
class Medico:
    id: Optional[int] = None
    nome: str = ""
    crm: str = ""
    uf_crm: str = "SP"
    especialidade: str = ""
    telefone: str = ""
    email: Optional[str] = None
    ativo: bool = True
    criado_em: Optional[datetime] = None

@dataclass
class Enfermeiro:
    id: Optional[int] = None
    nome: str = ""
    coren: str = ""
    uf_coren: str = "SP"
    setor: str = "Triagem"
    turno: str = "MANHÃ"
    telefone: str = ""
    email: Optional[str] = None
    ativo: bool = True
    criado_em: Optional[datetime] = None

@dataclass
class Paciente:
    id: Optional[int] = None
    nome: str = ""
    cpf: Optional[str] = None
    data_nascimento: str = ""
    sexo: str = "M"
    telefone: str = ""
    email: Optional[str] = None
    endereco: Optional[str] = None
    bairro: Optional[str] = None
    cidade: str = "São Paulo"
    uf: str = "SP"
    alergias: Optional[str] = None
    convenio: str = "PARTICULAR"
    ativo: bool = True
    criado_em: Optional[datetime] = None

@dataclass
class Agendamento:
    id: Optional[int] = None
    paciente_id: int = 0
    medico_id: int = 0
    enfermeiro_id: Optional[int] = None
    data_agenda: str = ""
    horario: str = ""
    periodo: str = "MANHÃ"
    motivo: str = ""
    status: str = "AGENDADO"
    observacoes: Optional[str] = None
    criado_por: str = "SISTEMA"
    criado_em: Optional[datetime] = None
    # Campos auxiliares para exibição de joins
    nome_paciente: Optional[str] = None
    nome_medico: Optional[str] = None
    especialidade_medico: Optional[str] = None

@dataclass
class Auditoria:
    id: Optional[int] = None
    usuario_id: Optional[int] = None
    login_usuario: str = ""
    acao: str = ""
    entidade: str = ""
    registro_id: Optional[int] = None
    detalhes: Optional[str] = None
    ip_origem: str = "127.0.0.1"
    criado_em: Optional[datetime] = None
