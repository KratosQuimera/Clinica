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
    acao VARCHAR(40) NOT NULL, -- 'LOGIN', 'LOGOUT', 'LOGIN_FALHA', 'CRIAR', 'EDITAR', 'EXCLUIR_LOGICO', 'CANCELAR_AGENDA'
    entidade VARCHAR(50) NOT NULL, -- 'USUARIOS', 'MEDICOS', 'ENFERMEIROS', 'PACIENTES', 'AGENDAMENTOS'
    registro_id INT NULL,
    detalhes TEXT,
    ip_origem VARCHAR(45) DEFAULT '127.0.0.1',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria(login_usuario);
CREATE INDEX IF NOT EXISTS idx_auditoria_acao ON auditoria(acao);
CREATE INDEX IF NOT EXISTS idx_auditoria_criado_em ON auditoria(criado_em);
