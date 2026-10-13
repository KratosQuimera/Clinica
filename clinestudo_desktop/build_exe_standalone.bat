@echo off
REM ============================================================================
REM ClinEstudo - Build do Executável ÚNICO (--onefile Standalone)
REM Gera um único ClinEstudo_Standalone.exe independente
REM ============================================================================

title Gerador Standalone (Arquivo Unico) - ClinEstudo

cd /d "%~dp0"
set "DIR_ATUAL=%~dp0"
set "PYTHONPATH=%DIR_ATUAL%;%DIR_ATUAL%..;%PYTHONPATH%"

echo ============================================================================
echo   GERANDO EXECUTAVEL UNICO (STANDALONE) - CLINESTUDO DESKTOP
echo   Pasta de trabalho: %DIR_ATUAL%
echo ============================================================================
echo.

taskkill /F /IM ClinEstudo_Standalone.exe >nul 2>&1
taskkill /F /IM ClinEstudo.exe >nul 2>&1

set "PY_CMD=python"
python --version >nul 2>&1
if %errorlevel% neq 0 (
    py --version >nul 2>&1
    if %errorlevel% equ 0 (
        set "PY_CMD=py"
    ) else (
        echo [ERRO CRITICO] O Python nao foi encontrado no PATH do Windows!
        pause
        exit /b 1
    )
)

echo • Usando interpretador: %PY_CMD%
%PY_CMD% --version

echo.
echo [1/3] Verificando dependencias...
%PY_CMD% -m pip install "pyinstaller>=6.5.0" python-dotenv --prefer-binary

echo.
echo [2/3] Compilando executavel unico com build_exe.py --onefile...
%PY_CMD% build_exe.py --onefile

if %errorlevel% neq 0 (
    echo.
    echo [TENTATIVA ALTERNATIVA] Executando PyInstaller onefile diretamente...
    %PY_CMD% -m PyInstaller --clean clinestudo_onefile.spec
)

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao compilar versao standalone! Executando diagnostico...
    %PY_CMD% diagnostico_exe.py
    pause
    exit /b 1
)

echo.
echo [3/3] Sucesso!
echo Arquivo gerado em: dist\ClinEstudo_Standalone.exe
echo.
pause
