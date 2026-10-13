@echo off
REM ============================================================================
REM ClinEstudo - Script de Build do Executável Windows (PyInstaller)
REM Compatível com Windows 10 e Windows 11 (64-bit)
REM ============================================================================

title Gerador de Executavel - ClinEstudo Desktop

REM 1. Força o diretório de trabalho a ser a pasta do script (evita erro quando executado como admin)
cd /d "%~dp0"
set "DIR_ATUAL=%~dp0"
set "PYTHONPATH=%DIR_ATUAL%;%DIR_ATUAL%..;%PYTHONPATH%"

echo =======================================================
echo  Iniciando geracao do executavel ClinEstudo Desktop
echo  Pasta de trabalho: %DIR_ATUAL%
echo =======================================================

REM Fecha instâncias anteriores abertas que travam o arquivo executável
taskkill /F /IM ClinEstudo.exe >nul 2>&1
taskkill /F /IM ClinEstudo_Standalone.exe >nul 2>&1

REM 2. Detecta o comando Python do sistema (python ou py)
set "PY_CMD=python"
python --version >nul 2>&1
if %errorlevel% neq 0 (
    py --version >nul 2>&1
    if %errorlevel% equ 0 (
        set "PY_CMD=py"
    ) else (
        echo [ERRO CRITICO] O Python nao foi encontrado no PATH do Windows!
        echo.
        echo Por favor, instale o Python 3.10, 3.11 ou 3.12 em:
        echo https://www.python.org/downloads/
        echo Certifique-se de marcar a opcao "Add Python to PATH" durante a instalacao.
        echo.
        pause
        exit /b 1
    )
)

echo • Usando interpretador: %PY_CMD%
%PY_CMD% --version

REM 3. Instala dependências usando o módulo pip do Python diretamente
echo.
echo [1/4] Verificando e instalando dependencias (pip)...
%PY_CMD% -m pip install --upgrade pip >nul 2>&1
%PY_CMD% -m pip install "pyinstaller>=6.5.0" python-dotenv --prefer-binary
%PY_CMD% -m pip install -r requirements.txt --prefer-binary >nul 2>&1

REM 4. Executa o build automatizado através do build_exe.py
echo.
echo [2/4] Compilando executavel com PyInstaller...
%PY_CMD% build_exe.py

if %errorlevel% neq 0 (
    echo.
    echo [TENTATIVA ALTERNATIVA] Executando PyInstaller diretamente via modulo...
    %PY_CMD% -m PyInstaller --clean clinestudo.spec
)

if %errorlevel% neq 0 (
    echo.
    echo =======================================================
    echo  [ERRO] Falha ao compilar o executavel!
    echo  Executando diagnostico automatico...
    echo =======================================================
    %PY_CMD% diagnostico_exe.py
    echo.
    pause
    exit /b 1
)

echo.
echo [4/4] Processo concluido com sucesso!
echo Executavel disponivel na pasta: dist\ClinEstudo\ClinEstudo.exe
echo.
pause
