# Relatório Técnico de Migração e Testes Automatizados - ClinEstudo

**Data de Execução**: 10 de Outubro de 2026  
**Status Geral**: ✅ **100% APROVADO (12/12 Testes)**  
**Ambiente de Validação**: Python 3.10 / 3.12, PostgreSQL Schema v2.4, Resilient SQLite Contingency

---

## 1. Sumário Executivo de Testes

A suíte automatizada `test_clinestudo.py` foi executada em ambiente limpo, cobrindo autenticação, controle de acesso baseado em papéis (RBAC), operações CRUD, algoritmos matemáticos de validação de documentos, prevenção de conflitos de concorrência na agenda e auditoria em conformidade com a LGPD.

| ID | Teste | Cenário Avaliado | Resultado | Tempo |
| :--- | :--- | :--- | :--- | :--- |
| `01` | `test_01_login_autorizado` | Autenticação com credenciais válidas e hash seguro | **PASSOU** | 0.08s |
| `02` | `test_02_login_negado_senha_incorreta` | Rejeição de senha errada sem timing leak | **PASSOU** | 0.07s |
| `03` | `test_03_login_negado_usuario_inexistente` | Tentativa com usuário não cadastrado | **PASSOU** | 0.07s |
| `04` | `test_04_bloqueio_temporario_apos_tentativas_excessivas` | Bloqueio automático de 15 min após 3 falhas | **PASSOU** | 0.22s |
| `05` | `test_05_permissoes_por_perfil` | Matriz RBAC para Admin, Médico, Enf. e Recepção | **PASSOU** | 0.01s |
| `06` | `test_06_validador_cpf_algoritmo_oficial` | Validação matemática oficial dos dígitos verificadores (módulo 11) | **PASSOU** | 0.01s |
| `07` | `test_07_validadores_crm_e_coren` | Validação de formatos de conselhos regionais de classe | **PASSOU** | 0.01s |
| `08` | `test_08_crud_medicos_e_duplicidade_crm` | Criação de médico e rejeição de CRM duplicado na mesma UF | **PASSOU** | 0.08s |
| `09` | `test_09_crud_pacientes_e_duplicidade_cpf` | Criação de paciente e bloqueio de CPF já cadastrado | **PASSOU** | 0.09s |
| `10` | `test_10_prevencao_conflito_horario_agenda` | Bloqueio de consulta dupla para o mesmo médico na mesma data/hora | **PASSOU** | 0.11s |
| `11` | `test_11_transicao_de_status_agendamento` | Fluxo completo: Agendado ➔ Confirmado ➔ Em Atendimento ➔ Concluído | **PASSOU** | 0.12s |
| `12` | `test_12_auditoria_sem_exposicao_de_senhas` | Registro de eventos LGPD sem expor dados confidenciais ou senhas | **PASSOU** | 0.08s |

---

## 2. Discrepâncias Identificadas e Resolvidas da Base Java/NetBeans

1. **Inconsistência de Nomenclatura das Tabelas e Chaves**:
   - *Problema original*: A base didática em NetBeans utilizava termos mistos como `tbl_medico`, `enfermeiro` e `cad_paciente`. Os identificadores eram `cod_medico`, `cod_paciente` e `cod_agenda`.
   - *Solução aplicada*: Unificação no padrão relacional moderno `medicos`, `enfermeiros`, `pacientes` e `agendamentos`. Colunas normalizadas para `id` e chaves estrangeiras padronizadas como `medico_id`, `paciente_id` e `enfermeiro_id`. Foi fornecida a view `v1_legacy_migration.sql` para suportar consultas legadas sem quebra.

2. **Vulnerabilidade Crítica no Armazenamento de Senhas**:
   - *Problema original*: Senhas eram salvas em texto puro na coluna `usu_senha` ou com MD5 simples sem salt.
   - *Solução aplicada*: Implementado algoritmo seguro `PBKDF2-HMAC-SHA256` com 260.000 iterações e salt criptográfico individual de 16 bytes gerado aleatoriamente para cada usuário.

3. **Ausência de Algoritmo de Validação do CPF**:
   - *Problema original*: Aceitava qualquer sequência de 11 dígitos, inclusive números inválidos como `111.111.111-11`.
   - *Solução aplicada*: Implementado algoritmo oficial com cálculo de módulo 11 para o primeiro e segundo dígitos verificadores e rejeição de séries inválidas conhecidas.

4. **Choque de Horários em Consultas**:
   - *Problema original*: O sistema permitia agendar múltiplos pacientes simultaneamente para o mesmo médico no mesmo minuto.
   - *Solução aplicada*: Constraint de unicidade composta `CONSTRAINT uq_medico_horario UNIQUE (medico_id, data_agenda, horario)` e checagem preventiva com mensagem amigável antes do commit.

5. **Exclusões Destrutivas**:
   - *Problema original*: Botões de exclusão executavam `DELETE CASCADE` ou disparavam erros de chave estrangeira com stack traces visíveis ao usuário.
   - *Solução aplicada*: Implementada exclusão lógica (`ativo = FALSE`), preservando registros históricos de consultas anteriores e prontuários para atendimento da legislação e LGPD.
