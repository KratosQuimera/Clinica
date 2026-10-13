@echo off
chcp 65001 >nul
REM ============================================================================
REM ClinEstudo - Criador de Atalho Oficial na Área de Trabalho (Desktop)
REM Corrige o erro "Failed to start embedded python interpreter!" garantindo que
REM o atalho aponte para a pasta correta com a pasta _internal intacta.
REM ============================================================================

title ClinEstudo - Criar Atalho na Área de Trabalho

echo ============================================================================
echo   CRIANDO ATALHO OFICIAL DO CLINESTUDO NA ÁREA DE TRABALHO...
echo ============================================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "TARGET_EXE=%SCRIPT_DIR%ClinEstudo.exe"
set "WORKING_DIR=%SCRIPT_DIR%"

if not exist "%TARGET_EXE%" (
    if exist "%SCRIPT_DIR%dist\ClinEstudo\ClinEstudo.exe" (
        set "TARGET_EXE=%SCRIPT_DIR%dist\ClinEstudo\ClinEstudo.exe"
        set "WORKING_DIR=%SCRIPT_DIR%dist\ClinEstudo\"
    ) else if exist "%SCRIPT_DIR%dist\ClinEstudo_Standalone.exe" (
        set "TARGET_EXE=%SCRIPT_DIR%dist\ClinEstudo_Standalone.exe"
        set "WORKING_DIR=%SCRIPT_DIR%dist\"
    )
)

if not exist "%TARGET_EXE%" (
    echo [AVISO] Arquivo ClinEstudo.exe não foi encontrado na pasta atual.
    echo Certifique-se de que compilou o executável com build_exe.bat ou build_exe_standalone.bat.
    echo.
    pause
    exit /b 1
)

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\ClinEstudo.lnk'); $s.TargetPath = '%TARGET_EXE%'; $s.WorkingDirectory = '%WORKING_DIR%'; $s.Description = 'ClinEstudo - Sistema Hospitalar e Clínico'; $s.Save()"

if %errorlevel% equ 0 (
    echo [SUCESSO] O atalho 'ClinEstudo' foi criado na sua Área de Trabalho!
    echo Agora você pode abrir o programa diretamente pelo ícone na Área de Trabalho.
) else (
    echo [ERRO] Não foi possível criar o atalho automaticamente via PowerShell.
)

echo.
pause
