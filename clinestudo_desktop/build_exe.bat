@echo off
REM ============================================================================
REM ClinEstudo - Script de Build do Executável Windows (PyInstaller)
REM Compatível com Windows 10 e Windows 11 (64-bit)
REM ============================================================================

echo =======================================================
echo  Iniciando geracao do executavel ClinEstudo Desktop
echo =======================================================

REM 1. Configura PYTHONPATH com o diretorio do script e pai
set "DIR_ATUAL=%~dp0"
set "PYTHONPATH=%DIR_ATUAL%;%DIR_ATUAL%..;%PYTHONPATH%"

REM 2. Verifica se Python esta instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Python nao foi encontrado no PATH do sistema.
    echo Instale o Python 3.10, 3.11 ou 3.12 e marque 'Add Python to PATH'.
    pause
    exit /b 1
)

REM 3. Instala dependencias necessarias
echo [1/4] Instalando dependencias do projeto...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [AVISO] Ocorreu um problema ao verificar dependencias com pip. Continuando...
)

REM 4. Limpeza de builds anteriores
echo [2/4] Limpando pastas temporarias antigas...
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist

REM 5. Executa PyInstaller com o arquivo de especificacao clinestudo.spec
echo [3/4] Compilando executavel sem janela de console (--noconsole)...
pyinstaller --clean clinestudo.spec
if %errorlevel% neq 0 (
    echo [ERRO] Falha na compilacao com PyInstaller!
    pause
    exit /b 1
)

REM 6. Prepara pacote final de distribuicao
echo [4/4] Preparando pacote final de distribuicao...
if exist dist\ClinEstudo (
    copy .env.example dist\ClinEstudo\.env.example >nul 2>&1
    copy README.md dist\ClinEstudo\README.md >nul 2>&1
    copy executar_com_log.bat dist\ClinEstudo\executar_com_log.bat >nul 2>&1
    copy diagnostico_exe.py dist\ClinEstudo\diagnostico_exe.py >nul 2>&1
    echo.
    echo =======================================================
    echo  SUCESSO! Pacote compilado gerado com sucesso:
    echo  - dist\ClinEstudo\ClinEstudo.exe (Executavel Oficial)
    echo  - dist\ClinEstudo\ClinEstudo_Debug.exe (Modo Console)
    echo  - dist\ClinEstudo\executar_com_log.bat (Launcher Diagnostico)
    echo =======================================================
) else (
    echo [ERRO] Pasta dist\ClinEstudo nao encontrada.
)

pause
