-- ============================================================================
-- CLINESTUDO - ESQUEMA RELACIONAL POSTGRESQL (VERSÃO 2.4.0)
-- Banco de dados otimizado com integridade referencial, índices e auditoria LGPD
-- ============================================================================

-- Extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE USUÁRIOS E PERFIS
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    login VARCHAR(50) UNIQUE NOT NULL,
    senha_hash VARCHAR(256) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    perfil VARCHAR(30) NOT NULL CHECK (perfil IN ('ADMINISTRADOR', 'MEDICO', 'ENFERMEIRO', 'RECEPCIONISTA')),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    tentativas_falhas INT NOT NULL DEFAULT 0,
    bloqueado_ate TIMESTAMP NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_login ON usuarios(login);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);

-- 2. TABELA DE MÉDICOS
CREATE TABLE IF NOT EXISTS medicos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    crm VARCHAR(20) NOT NULL,
    uf_crm VARCHAR(2) NOT NULL DEFAULT 'SP',
    especialidade VARCHAR(80) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_medico_crm_uf UNIQUE (crm, uf_crm)
);

CREATE INDEX IF NOT EXISTS idx_medicos_nome ON medicos(nome);
CREATE INDEX IF NOT EXISTS idx_medicos_especialidade ON medicos(especialidade);
CREATE INDEX IF NOT EXISTS idx_medicos_crm ON medicos(crm);

-- 3. TABELA DE ENFERMEIROS
CREATE TABLE IF NOT EXISTS enfermeiros (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    coren VARCHAR(20) NOT NULL,
    uf_coren VARCHAR(2) NOT NULL DEFAULT 'SP',
    setor VARCHAR(60) NOT NULL,
    turno VARCHAR(30) NOT NULL CHECK (turno IN ('MANHÃ', 'TARDE', 'NOITE', '12X36 DIURNO', '12X36 NOTURNO', 'INTEGRAL')),
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_enfermeiro_coren_uf UNIQUE (coren, uf_coren)
);

CREATE INDEX IF NOT EXISTS idx_enfermeiros_nome ON enfermeiros(nome);
CREATE INDEX IF NOT EXISTS idx_enfermeiros_coren ON enfermeiros(coren);
CREATE INDEX IF NOT EXISTS idx_enfermeiros_setor ON enfermeiros(setor);

-- 4. TABELA DE PACIENTES
CREATE TABLE IF NOT EXISTS pacientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    data_nascimento DATE NOT NULL,
    sexo CHAR(1) NOT NULL CHECK (sexo IN ('M', 'F', 'O')),
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    endereco VARCHAR(150),
    bairro VARCHAR(80),
    cidade VARCHAR(80),
    uf VARCHAR(2) DEFAULT 'SP',
    alergias TEXT,
    convenio VARCHAR(60) DEFAULT 'PARTICULAR',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pacientes_nome ON pacientes(nome);
CREATE INDEX IF NOT EXISTS idx_pacientes_cpf ON pacientes(cpf);
CREATE INDEX IF NOT EXISTS idx_pacientes_telefone ON pacientes(telefone);

-- 5. TABELA DE AGENDAMENTOS
CREATE TABLE IF NOT EXISTS agendamentos (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL REFERENCES pacientes(id) ON DELETE RESTRICT,
    medico_id INT NOT NULL REFERENCES medicos(id) ON DELETE RESTRICT,
    enfermeiro_id INT NULL REFERENCES enfermeiros(id) ON DELETE SET NULL,
    data_agenda DATE NOT NULL,
    horario TIME NOT NULL,
    periodo VARCHAR(20) NOT NULL CHECK (periodo IN ('MANHÃ', 'TARDE', 'NOITE')),
    motivo VARCHAR(150) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'AGENDADO' CHECK (
        status IN ('AGENDADO', 'CONFIRMADO', 'EM_ATENDIMENTO', 'CONCLUIDO', 'CANCELADO', 'FALTOU')
    ),
    observacoes TEXT,
    criado_por VARCHAR(50) NOT NULL DEFAULT 'SISTEMA',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_medico_horario UNIQUE (medico_id, data_agenda, horario)
);

CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data_agenda);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_medico ON agendamentos(medico_id, data_agenda);
CREATE INDEX IF NOT EXISTS idx_agendamentos_paciente ON agendamentos(paciente_id);

-- 6. TABELA DE AUDITORIA (LGPD & SEGURANÇA)
CREATE TABLE IF NOT EXISTS auditoria (
    id SERIAL PRIMARY KEY,
    usuario_id INT NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    login_usuario VARCHAR(50) NOT NULL,
    acao VARCHAR(40) NOT NULL,
    entidade VARCHAR(50) NOT NULL,
    registro_id INT NULL,
    detalhes TEXT,
    ip_origem VARCHAR(45) DEFAULT '127.0.0.1',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria(login_usuario);
CREATE INDEX IF NOT EXISTS idx_auditoria_acao ON auditoria(acao);
CREATE INDEX IF NOT EXISTS idx_auditoria_criado_em ON auditoria(criado_em);

-- 7. TABELA DE RECEITAS MÉDICAS, PRESCRIÇÕES, QR CODE E WHATSAPP
CREATE TABLE IF NOT EXISTS receitas (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    medico_id INT NOT NULL REFERENCES medicos(id) ON DELETE RESTRICT,
    codigo_autenticidade VARCHAR(50) UNIQUE NOT NULL,
    data_emissao VARCHAR(20) NOT NULL,
    hora_emissao VARCHAR(10) NOT NULL,
    validade_dias INT NOT NULL DEFAULT 30,
    medicamentos_json TEXT NOT NULL,
    orientacoes_gerais TEXT,
    enviado_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
    impresso BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_receitas_paciente ON receitas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_receitas_medico ON receitas(medico_id);
CREATE INDEX IF NOT EXISTS idx_receitas_codigo ON receitas(codigo_autenticidade);

-- 8. TABELA DE ATENDIMENTO MÉDICO (PRONTUÁRIO CLÍNICO)
CREATE TABLE IF NOT EXISTS atendimentos (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL REFERENCES pacientes(id) ON DELETE RESTRICT,
    medico_id INT NOT NULL REFERENCES medicos(id) ON DELETE RESTRICT,
    agendamento_id INT NULL REFERENCES agendamentos(id) ON DELETE SET NULL,
    data_hora VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'FINALIZADO' CHECK (status IN ('EM_ANDAMENTO', 'FINALIZADO', 'CANCELADO')),
    motivo_consulta VARCHAR(200) NOT NULL,
    queixa_principal VARCHAR(250) NOT NULL,
    anamnese TEXT,
    historico_familiar_social TEXT,
    sinais_vitais_json TEXT,
    exame_fisico TEXT,
    hipotese_diagnostica VARCHAR(250) NOT NULL,
    cid10 VARCHAR(100),
    conduta_evolucao TEXT,
    prescricoes_ids_json TEXT,
    retorno_em_dias INT,
    observacoes_retorno TEXT,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_atendimentos_paciente ON atendimentos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_atendimentos_medico ON atendimentos(medico_id);
CREATE INDEX IF NOT EXISTS idx_atendimentos_status ON atendimentos(status);

