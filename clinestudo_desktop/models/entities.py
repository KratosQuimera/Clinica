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

@dataclass
class Receita:
    id: Optional[int] = None
    paciente_id: int = 0
    medico_id: int = 0
    codigo_autenticidade: str = ""
    data_emissao: str = ""
    hora_emissao: str = ""
    validade_dias: int = 30
    medicamentos_json: str = "[]"
    orientacoes_gerais: Optional[str] = None
    enviado_whatsapp: bool = False
    impresso: bool = False
    criado_em: Optional[datetime] = None
    # Atributos de conveniencia em consultas
    nome_paciente: Optional[str] = None
    nome_medico: Optional[str] = None
    crm_medico: Optional[str] = None

@dataclass
class Atendimento:
    id: Optional[int] = None
    paciente_id: int = 0
    medico_id: int = 0
    agendamento_id: Optional[int] = None
    data_hora: str = ""
    status: str = "FINALIZADO"
    motivo_consulta: str = ""
    queixa_principal: str = ""
    anamnese: Optional[str] = None
    historico_familiar_social: Optional[str] = None
    sinais_vitais_json: str = "{}"
    exame_fisico: Optional[str] = None
    hipotese_diagnostica: str = ""
    cid10: Optional[str] = None
    conduta_evolucao: Optional[str] = None
    prescricoes_ids_json: str = "[]"
    retorno_em_dias: Optional[int] = None
    observacoes_retorno: Optional[str] = None
    criado_em: Optional[datetime] = None
    atualizado_em: Optional[datetime] = None
    # Joins de conveniência para exibição
    nome_paciente: Optional[str] = None
    cpf_paciente: Optional[str] = None
    telefone_paciente: Optional[str] = None
    alergias_paciente: Optional[str] = None
    nome_medico: Optional[str] = None
    crm_medico: Optional[str] = None
    especialidade_medico: Optional[str] = None

