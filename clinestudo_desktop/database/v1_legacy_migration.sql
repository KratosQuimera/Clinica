-- ============================================================================
-- CLINESTUDO - SCRIPT DE MIGRAÇÃO SEGURA (LEGACY JAVA NETBEANS -> POSTGRESQL 2.4)
-- ============================================================================
-- Este script analisa e unifica discrepâncias comuns encontradas no projeto
-- didático original Java Swing / NetBeans:
-- 
-- Discrepâncias Documentadas:
-- 1. Tabela 'medicos': no Java chamava-se frequentemente 'tbl_medico' ou 'medicos'
--    com colunas 'cod_medico', 'nome_medico', 'crm_medico', 'especialidade_medico'.
-- 2. Tabela 'enfermeiro' (singular) vs 'enfermeiros': faltavam campos de UF e Turno padronizado.
-- 3. Tabela 'paciente': campos 'rg_paciente', 'bairro_paciente', 'nasc_paciente' sem validação de CPF.
-- 4. Tabela 'agenda': colunas 'cod_agenda', 'status_agenda' (usava strings livres como 'Aberto', 'Fechado')
-- 5. Tabela 'usuarios': senhas em texto puro ou hash MD5 fraco sem salt.
-- ============================================================================

-- Transação segura para migração
BEGIN;

-- Se existir a tabela legada 'tbl_medico' ou 'medicos' antiga, migrar dados preservando IDs:
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tbl_medico') THEN
        INSERT INTO medicos (id, nome, crm, especialidade, telefone, ativo)
        SELECT cod_medico, nome_medico, crm_medico, especialidade_medico, COALESCE(tel_medico, 'Não informado'), TRUE
        FROM tbl_medico
        ON CONFLICT (crm, uf_crm) DO NOTHING;
    END IF;
END $$;

-- Se existir 'tbl_paciente', migrar dados com saneamento básico:
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tbl_paciente') THEN
        INSERT INTO pacientes (id, nome, cpf, data_nascimento, sexo, telefone, endereco, bairro, ativo)
        SELECT 
            cod_paciente, 
            nome_paciente, 
            NULLIF(REGEXP_REPLACE(cpf_paciente, '[^0-9]', '', 'g'), ''),
            COALESCE(nasc_paciente, '1990-01-01'::DATE),
            CASE WHEN UPPER(sexo_paciente) LIKE 'F%' THEN 'F' ELSE 'M' END,
            COALESCE(tel_paciente, 'Não informado'),
            end_paciente,
            bairro_paciente,
            TRUE
        FROM tbl_paciente
        ON CONFLICT (cpf) DO NOTHING;
    END IF;
END $$;

-- Views de retrocompatibilidade para eventuais scripts legados:
CREATE OR REPLACE VIEW view_legada_medicos AS
SELECT id AS cod_medico, nome AS nome_medico, crm AS crm_medico, especialidade AS especialidade_medico
FROM medicos;

CREATE OR REPLACE VIEW view_legada_pacientes AS
SELECT id AS cod_paciente, nome AS nome_paciente, cpf AS cpf_paciente, telefone AS tel_paciente
FROM pacientes;

CREATE OR REPLACE VIEW view_legada_agenda AS
SELECT id AS cod_agenda, paciente_id, medico_id, data_agenda, horario, status AS status_agenda
FROM agendamentos;

COMMIT;
