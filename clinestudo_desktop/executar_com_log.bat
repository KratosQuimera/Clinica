@echo off
chcp 65001 >nul
REM ============================================================================
REM ClinEstudo - Script de Diagnóstico e Inicialização com Log Visível
REM Use este arquivo caso o ClinEstudo.exe feche sem mensagem de erro.
REM ============================================================================

title ClinEstudo Desktop - Modo Diagnóstico

echo ============================================================================
echo   CLINESTUDO DESKTOP - INICIALIZADOR COM DIAGNÓSTICO E LOG ATIVO
echo ============================================================================
echo.

set "APP_DIR=%~dp0"
cd /d "%APP_DIR%"

echo [1/3] Verificando se existe executável compilado...
if exist "ClinEstudo.exe" (
    echo Executável detectado: ClinEstudo.exe
    echo Iniciando com captura de saída...
    echo.
    ClinEstudo.exe
    goto FIM
)

if exist "dist\ClinEstudo\ClinEstudo.exe" (
    echo Executável detectado em dist\ClinEstudo\ClinEstudo.exe
    echo Iniciando com captura de saída...
    echo.
    dist\ClinEstudo\ClinEstudo.exe
    goto FIM
)

echo [2/3] Executável não encontrado na pasta raiz. Testando execução direta via Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Nem o executável nem o Python foram encontrados no PATH!
    echo.
    echo SOLUÇÃO:
    echo 1. Se você baixou o pacote compilado, certifique-se de descompactar o arquivo ZIP completo.
    echo 2. Não execute o programa de dentro do arquivo .ZIP sem antes extrair todos os arquivos.
    echo.
    goto PAUSA
)

echo [3/3] Executando diretamente com Python:
python main.py

:FIM
echo.
echo ============================================================================
echo   O processo foi finalizado com código de retorno: %errorlevel%
echo ============================================================================

if exist "clinestudo_crash.log" (
    echo.
    echo [AVISO] Foi detectado um arquivo clinestudo_crash.log:
    echo ----------------------------------------------------------------------------
    type clinestudo_crash.log
    echo ----------------------------------------------------------------------------
)

:PAUSA
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul
