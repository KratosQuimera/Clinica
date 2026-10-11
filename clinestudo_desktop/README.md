# ClinEstudo Desktop - Sistema de Gestão Clínica Integrada

Sistema desktop profissional para gestão de clínicas e consultórios médicos, desenvolvido em **Python 3.12 / PySide6**, com persistência relacional em **PostgreSQL** (via `psycopg 3`), segurança criptográfica OWASP, conformidade com a LGPD e compatibilidade com Windows 10 e 11.

---

## 🏗️ 1. Arquitetura em Camadas

O projeto foi estruturado seguindo rigorosamente a separação de responsabilidades em camadas desacopladas:

```
clinestudo_desktop/
├── config/              # Configurações globais e carregamento de variáveis (.env)
│   ├── settings.py
├── database/            # Conexão, pooling, migrações e esquemas relacionais
│   ├── connection.py    # Gerenciador resiliente (PostgreSQL com fallback SQLite)
│   ├── migrations.py    # Migrador automático e dados de seed
│   ├── schema.sql       # DDL PostgreSQL completo com constraints e índices
│   └── v1_legacy_migration.sql # Migração de dados legados do Java NetBeans
├── models/              # Entidades e representações de domínio (dataclasses)
│   └── entities.py      # Usuario, Medico, Enfermeiro, Paciente, Agendamento, Auditoria
├── auth/                # Autenticação, RBAC, hash criptográfico e sessões
│   ├── hasher.py        # PBKDF2-HMAC-SHA256 (260.000 iterações + salt aleatório)
│   ├── permissions.py   # Matriz de permissões (Administrador, Médico, Enfermeiro, Recepção)
│   └── session.py       # Gerenciamento de sessão com timeout de inatividade
├── repositories/        # Acesso a dados com consultas 100% parametrizadas (anti-SQL Injection)
│   └── repositories.py  # CRUD completo de todas as entidades e consultas especializadas
├── services/            # Regras de negócio, validações matemáticas e transações
│   ├── services.py      # Lógica de bloqueio por tentativas, validação de choque de horários
│   └── validators.py    # Algoritmo matemático oficial do CPF, CRM e COREN
├── ui/                  # Interface gráfica moderna em PySide6 (Qt)
│   ├── theme.py         # Tema QSS Dark Slate & Emerald de alta precisão
│   ├── login_window.py  # Janela de autenticação com proteção de bloqueio
│   ├── main_window.py   # Janela principal com sidebar, dashboard e abas
│   └── views.py         # Telas de Médicos, Pacientes, Agenda e Relatórios
├── tests/               # Suíte de testes automatizados com cobertura unitária e integração
│   ├── test_clinestudo.py
│   └── run_tests.py
├── clinestudo.spec      # Configuração do PyInstaller (modo windowed sem console)
├── build_exe.bat        # Script de compilação em 1 clique para Windows
├── requirements.txt     # Dependências de execução e compilação
├── pyproject.toml       # Metadados do projeto Python
└── .env.example         # Template seguro de variáveis de ambiente
```

---

## 🛡️ 2. Regras de Segurança & LGPD

1. **Hash de Senhas**: Utiliza derivação de chave criptográfica `PBKDF2-HMAC-SHA256` com 260.000 iterações e salt único por usuário gerado via `secrets.token_hex(16)`.
2. **Proteção contra Força Bruta**: Bloqueio temporário da conta por 15 minutos após 3 tentativas incorretas consecutivas.
3. **Auditoria LGPD**: Registro completo de eventos operacionais (`LOGIN`, `LOGOUT`, `CRIAR`, `EDITAR`, `CANCELAR`, `STATUS`), omitindo expressamente dados confidenciais de credenciais ou senhas em texto puro.
4. **Controle de Acesso por Função (RBAC)**:
   - **Administrador**: Gestão de usuários, médicos, enfermeiros, pacientes, agenda, relatórios e auditoria.
   - **Médico**: Visualização de pacientes, histórico clínico, sua própria agenda e status de atendimento.
   - **Enfermeiro**: Triagem, setor, atualização de cuidados e lista de pacientes.
   - **Recepcionista**: Cadastro de pacientes, agendamento de consultas, confirmações e cancelamentos.

---

## 🗄️ 3. Resolução de Discrepâncias do Projeto Java Swing / NetBeans

Durante a análise da base de código original em Java Swing/NetBeans, foram identificadas e saneadas as seguintes divergências:

| Entidade / Recurso | Projeto Original Java/NetBeans | ClinEstudo 2.4 (Python/PySide6/PostgreSQL) |
| :--- | :--- | :--- |
| **Identificadores** | `cod_medico`, `cod_paciente`, `cod_agenda` misturados | Padronizado para `id`, com chaves estrangeiras explícitas (`medico_id`, etc.) |
| **Nomenclatura** | `tbl_medico`, `enfermeiro` (singular) vs `medicos` | Padronizado no plural minúsculo (`medicos`, `enfermeiros`, `pacientes`, `agendamentos`) |
| **Senhas** | Texto plano ou hash MD5 vulnerável sem salt | Hash `PBKDF2-HMAC-SHA256` com salt criptográfico individual |
| **Validação CPF** | Apenas máscara de string sem validação de dígitos | Algoritmo oficial módulo 11 da Receita Federal com detecção de repetidos |
| **Conflito de Agenda** | Permitido agendamento no mesmo horário sem aviso | Bloqueio automático com constraint relacional e checagem em camada de serviço |
| **Exclusão** | `DELETE FROM` direto com quebra de integridade | Exclusão lógica (`ativo = FALSE`) preservando histórico médico e auditoria |

---

## 🚀 4. Instalação e Execução

### Pré-requisitos
- Python 3.10, 3.11 ou 3.12 instalado (marcar opção *Add Python to PATH* no instalador).
- PostgreSQL 14+ instalado e em execução (ou utilizar o modo de contingência SQLite automático).

### Passo a Passo

1. **Clonar ou extrair os arquivos do projeto**:
   ```bash
   cd clinestudo_desktop
   ```

2. **Criar e ativar ambiente virtual (recomendado)**:
   ```bash
   python -m venv venv
   # No Windows:
   venv\Scripts\activate
   # No Linux/Mac:
   source venv/bin/activate
   ```

3. **Instalar as dependências**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configurar o banco de dados**:
   - Crie o banco no PostgreSQL:
     ```sql
     CREATE DATABASE clinestudo;
     ```
   - Copie o arquivo de exemplo:
     ```bash
     copy .env.example .env
     ```
   - Edite o `.env` com suas credenciais do PostgreSQL.

5. **Executar a suíte de testes automatizados**:
   ```bash
   python tests/run_tests.py
   ```

6. **Iniciar a aplicação desktop**:
   ```bash
   python main.py
   ```

---

## 📦 5. Geração do Executável Windows (.EXE)

Para compilar um executável `.exe` profissional independente (sem janela preta de console):

1. No Windows, clique duas vezes em `build_exe.bat` ou execute no terminal:
   ```cmd
   build_exe.bat
   ```
2. O script executará o PyInstaller utilizando `clinestudo.spec`.
3. O executável pronto para distribuição estará disponível em:
   ```
   dist\ClinEstudo\ClinEstudo.exe
   ```
4. Distribua a pasta `dist\ClinEstudo` contendo o `.exe` e o arquivo `.env.example`.

---

## 👥 Credenciais Padrão de Demonstração

| Usuário | Senha | Perfil | Descrição |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | **ADMINISTRADOR** | Acesso irrestrito a configurações e auditoria |
| `medico.silva` | `medico123` | **MEDICO** | Dr. Roberto Silva - Cardiologia (CRM 123456/SP) |
| `enf.carla` | `enf123` | **ENFERMEIRO** | Enfª Carla Santos - Triagem (COREN 456789/SP) |
| `recepcao` | `rec123` | **RECEPCIONISTA** | Mariana Costa - Atendimento e Agenda |
