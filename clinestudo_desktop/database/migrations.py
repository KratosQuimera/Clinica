import logging
import sqlite3
from typing import Optional
try:
    from database.connection import db_manager
    from auth.hasher import hash_password
except ImportError:
    from clinestudo_desktop.database.connection import db_manager
    from clinestudo_desktop.auth.hasher import hash_password

logger = logging.getLogger("clinestudo.migrations")

SQLITE_SCHEMA = """
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    login TEXT UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    perfil TEXT NOT NULL,
    ativo INTEGER NOT NULL DEFAULT 1,
    tentativas_falhas INTEGER NOT NULL DEFAULT 0,
    bloqueado_ate TEXT,
    criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    atualizado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS medicos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    crm TEXT NOT NULL,
    uf_crm TEXT NOT NULL DEFAULT 'SP',
    especialidade TEXT NOT NULL,
    telefone TEXT NOT NULL,
    email TEXT,
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    UNIQUE(crm, uf_crm)
);

CREATE TABLE IF NOT EXISTS enfermeiros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    coren TEXT NOT NULL,
    uf_coren TEXT NOT NULL DEFAULT 'SP',
    setor TEXT NOT NULL,
    turno TEXT NOT NULL,
    telefone TEXT NOT NULL,
    email TEXT,
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    UNIQUE(coren, uf_coren)
);

CREATE TABLE IF NOT EXISTS pacientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cpf TEXT UNIQUE,
    data_nascimento TEXT NOT NULL,
    sexo TEXT NOT NULL,
    telefone TEXT NOT NULL,
    email TEXT,
    endereco TEXT,
    bairro TEXT,
    cidade TEXT DEFAULT 'São Paulo',
    uf TEXT DEFAULT 'SP',
    alergias TEXT,
    convenio TEXT DEFAULT 'PARTICULAR',
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS agendamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id),
    medico_id INTEGER NOT NULL REFERENCES medicos(id),
    enfermeiro_id INTEGER REFERENCES enfermeiros(id),
    data_agenda TEXT NOT NULL,
    horario TEXT NOT NULL,
    periodo TEXT NOT NULL,
    motivo TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'AGENDADO',
    observacoes TEXT,
    criado_por TEXT NOT NULL DEFAULT 'SISTEMA',
    criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    UNIQUE(medico_id, data_agenda, horario)
);

CREATE TABLE IF NOT EXISTS auditoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    login_usuario TEXT NOT NULL,
    acao TEXT NOT NULL,
    entidade TEXT NOT NULL,
    registro_id INTEGER,
    detalhes TEXT,
    ip_origem TEXT DEFAULT '127.0.0.1',
    criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS receitas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id),
    medico_id INTEGER NOT NULL REFERENCES medicos(id),
    codigo_autenticidade TEXT UNIQUE NOT NULL,
    data_emissao TEXT NOT NULL,
    hora_emissao TEXT NOT NULL,
    validade_dias INTEGER NOT NULL DEFAULT 30,
    medicamentos_json TEXT NOT NULL,
    orientacoes_gerais TEXT,
    enviado_whatsapp INTEGER NOT NULL DEFAULT 0,
    impresso INTEGER NOT NULL DEFAULT 0,
    criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS atendimentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id),
    medico_id INTEGER NOT NULL REFERENCES medicos(id),
    agendamento_id INTEGER REFERENCES agendamentos(id),
    data_hora TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'FINALIZADO',
    motivo_consulta TEXT NOT NULL,
    queixa_principal TEXT NOT NULL,
    anamnese TEXT,
    historico_familiar_social TEXT,
    sinais_vitais_json TEXT,
    exame_fisico TEXT,
    hipotese_diagnostica TEXT NOT NULL,
    cid10 TEXT,
    conduta_evolucao TEXT,
    prescricoes_ids_json TEXT,
    retorno_em_dias INTEGER,
    observacoes_retorno TEXT,
    criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    atualizado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
"""

def init_database() -> bool:
    """Executa migrações automáticas e seeding inicial."""
    try:
        if db_manager.is_sqlite_mode():
            conn = db_manager.get_sqlite_connection()
            conn.executescript(SQLITE_SCHEMA)
            conn.commit()
            seed_initial_data()
            return True
        else:
            # PostgreSQL mode
            import os
            schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
            if os.path.exists(schema_path):
                with open(schema_path, "r", encoding="utf-8") as f:
                    pg_sql = f.read()
                with db_manager.get_raw_pg_connection() as conn:
                    with conn.cursor() as cur:
                        cur.execute(pg_sql)
                    conn.commit()
            seed_initial_data()
            return True
    except Exception as e:
        logger.error(f"Erro ao inicializar banco de dados: {e}")
        return False

def seed_initial_data():
    """Popula banco com dados administrativos e registros iniciais para uso imediato."""
    # 1. Usuário Admin Padrão
    exist_admin = db_manager.execute_query("SELECT id FROM usuarios WHERE login = %s", ("admin",))
    if not exist_admin:
        senha_hash, salt = hash_password("admin123")
        db_manager.execute_mutation(
            "INSERT INTO usuarios (nome, login, senha_hash, salt, perfil, ativo) VALUES (%s, %s, %s, %s, %s, %s)",
            ("Administrador Geral", "admin", senha_hash, salt, "ADMINISTRADOR", 1)
        )
        
        h_med, s_med = hash_password("medico123")
        db_manager.execute_mutation(
            "INSERT INTO usuarios (nome, login, senha_hash, salt, perfil, ativo) VALUES (%s, %s, %s, %s, %s, %s)",
            ("Dr. Roberto Silva", "medico.silva", h_med, s_med, "MEDICO", 1)
        )
        
        h_enf, s_enf = hash_password("enf123")
        db_manager.execute_mutation(
            "INSERT INTO usuarios (nome, login, senha_hash, salt, perfil, ativo) VALUES (%s, %s, %s, %s, %s, %s)",
            ("Enf. Carla Santos", "enf.carla", h_enf, s_enf, "ENFERMEIRO", 1)
        )

        h_rec, s_rec = hash_password("rec123")
        db_manager.execute_mutation(
            "INSERT INTO usuarios (nome, login, senha_hash, salt, perfil, ativo) VALUES (%s, %s, %s, %s, %s, %s)",
            ("Mariana Costa - Recepção", "recepcao", h_rec, s_rec, "RECEPCIONISTA", 1)
        )

    # 2. Médicos Iniciais
    exist_med = db_manager.execute_query("SELECT id FROM medicos WHERE crm = %s", ("123456",))
    if not exist_med:
        db_manager.execute_mutation(
            "INSERT INTO medicos (nome, crm, uf_crm, especialidade, telefone, email, ativo) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            ("Dr. Roberto Silva", "123456", "SP", "Cardiologia", "(11) 98765-4321", "roberto.silva@clinestudo.com.br", 1)
        )
        db_manager.execute_mutation(
            "INSERT INTO medicos (nome, crm, uf_crm, especialidade, telefone, email, ativo) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            ("Dra. Beatriz Santos", "654321", "SP", "Pediatria", "(11) 97654-3210", "beatriz.santos@clinestudo.com.br", 1)
        )
        db_manager.execute_mutation(
            "INSERT INTO medicos (nome, crm, uf_crm, especialidade, telefone, email, ativo) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            ("Dr. Carlos Eduardo Lima", "789012", "SP", "Ortopedia", "(11) 96543-2109", "carlos.orto@clinestudo.com.br", 1)
        )

    # 3. Enfermeiros Iniciais
    exist_enf = db_manager.execute_query("SELECT id FROM enfermeiros WHERE coren = %s", ("456789",))
    if not exist_enf:
        db_manager.execute_mutation(
            "INSERT INTO enfermeiros (nome, coren, uf_coren, setor, turno, telefone, email, ativo) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            ("Carla Santos", "456789", "SP", "Triagem / Acolhimento", "MANHÃ", "(11) 95432-1098", "carla.enf@clinestudo.com.br", 1)
        )
        db_manager.execute_mutation(
            "INSERT INTO enfermeiros (nome, coren, uf_coren, setor, turno, telefone, email, ativo) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            ("Marcos Vinicius", "987654", "SP", "Ambulatório e Curativos", "TARDE", "(11) 94321-0987", "marcos.enf@clinestudo.com.br", 1)
        )

    # 4. Pacientes Iniciais
    exist_pac = db_manager.execute_query("SELECT id FROM pacientes WHERE cpf = %s", ("529.982.247-25",))
    if not exist_pac:
        db_manager.execute_mutation(
            """INSERT INTO pacientes (nome, cpf, data_nascimento, sexo, telefone, email, endereco, bairro, cidade, uf, alergias, convenio, ativo) 
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            ("Ana Paula Ferreira", "529.982.247-25", "1988-04-12", "F", "(11) 93210-9876", "ana.ferreira@email.com", 
             "Av. Paulista, 1000", "Bela Vista", "São Paulo", "SP", "Penicilina", "Unimed Saúde", 1)
        )
        db_manager.execute_mutation(
            """INSERT INTO pacientes (nome, cpf, data_nascimento, sexo, telefone, email, endereco, bairro, cidade, uf, alergias, convenio, ativo) 
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            ("Lucas Mendes de Oliveira", "111.444.777-35", "1995-11-23", "M", "(11) 92109-8765", "lucas.mendes@email.com", 
             "Rua backstage, 450", "Consolação", "São Paulo", "SP", "Nenhuma conhecida", "Bradesco Saúde", 1)
        )
