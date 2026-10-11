@echo off
REM ============================================================================
REM ClinEstudo - Script de Build do Executável Windows (PyInstaller)
REM Compatível com Windows 10 e Windows 11 (64-bit)
REM ============================================================================

echo =======================================================
echo  Iniciando geracao do executavel ClinEstudo Desktop
echo =======================================================

REM 1. Verifica se Python esta instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Python nao foi encontrado no PATH do sistema.
    echo Instale o Python 3.10, 3.11 ou 3.12 e marque 'Add Python to PATH'.
    pause
    exit /b 1
)

REM 2. Instala dependencias necessarias
echo [1/4] Instalando dependencias do projeto...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [AVISO] Ocorreu um problema ao instalar dependencias com pip.
)

REM 3. Limpeza de builds anteriores
echo [2/4] Limpando pastas temporarias antigas...
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist

REM 4. Executa PyInstaller com o arquivo de especificacao clinestudo.spec
echo [3/4] Compilando executavel sem janela de console (--noconsole)...
pyinstaller --clean clinestudo.spec
if %errorlevel% neq 0 (
    echo [ERRO] Falha na compilacao com PyInstaller!
    pause
    exit /b 1
)

REM 5. Copia arquivo de configuracao exemplo para a pasta de distribuicao
echo [4/4] Preparando pacote final de distribuicao...
if exist dist\ClinEstudo (
    copy .env.example dist\ClinEstudo\.env.example >nul
    copy README.md dist\ClinEstudo\README.md >nul
    echo.
    echo =======================================================
    echo  SUCESSO! O executavel foi gerado em:
    echo  dist\ClinEstudo\ClinEstudo.exe
    echo =======================================================
) else (
    echo [ERRO] Pasta dist\ClinEstudo nao encontrada.
)

pause
