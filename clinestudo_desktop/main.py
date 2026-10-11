#!/usr/bin/env python3
"""
Ponto de entrada do sistema desktop ClinEstudo.
Inicializa o banco de dados, carrega a Splash Screen com o Logo do Globo,
aplica tratamento nativo contra falhas silenciosas do executável Windows (.exe),
e inicializa o fluxo de autenticação e janela principal (NetBeans Swing / PySide6).
"""

import sys
import os
import types
import logging
import traceback
from datetime import datetime

# ==============================================================================
# TRATAMENTO NATIVO CONTRA FALHAS SILENCIOSAS NO WINDOWS (.EXE)
# Quando um executável PyInstaller é compilado com --noconsole, qualquer exceção
# não capturada encerra o processo sem exibir janela de erro.
# Este mecanismo utiliza a API nativa do Windows (ctypes User32 MessageBox)
# para garantir que NUNCA feche sem exibir uma mensagem clara na tela.
# ==============================================================================

def get_app_dir() -> str:
    """Retorna o diretório base da aplicação (suporta modo congelado PyInstaller)."""
    if getattr(sys, 'frozen', False):
        return os.path.dirname(os.path.abspath(sys.executable))
    return os.path.dirname(os.path.abspath(__file__))

def write_crash_log(title: str, details: str, exc: Exception = None) -> str:
    """Grava o erro em arquivo de log no disco."""
    app_dir = get_app_dir()
    candidates = [
        os.path.join(app_dir, "clinestudo_crash.log"),
        os.path.join(os.environ.get("LOCALAPPDATA", app_dir), "ClinEstudo", "clinestudo_crash.log"),
        os.path.join(os.environ.get("TEMP", "."), "clinestudo_crash.log")
    ]
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    tb_str = traceback.format_exc() if exc else ""
    log_content = (
        f"======================================================================\n"
        f"CLINESTUDO DESKTOP - RELATÓRIO DE ERRO NA INICIALIZAÇÃO\n"
        f"Data/Hora: {timestamp}\n"
        f"Título: {title}\n"
        f"Python: {sys.version}\n"
        f"Executável: {sys.executable}\n"
        f"Congelado (PyInstaller): {getattr(sys, 'frozen', False)}\n"
        f"----------------------------------------------------------------------\n"
        f"Detalhes do Erro:\n{details}\n"
    )
    if tb_str and tb_str.strip() != "NoneType: None":
        log_content += f"\nTraceback:\n{tb_str}\n"
    log_content += f"======================================================================\n\n"

    for path in candidates:
        try:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "a", encoding="utf-8") as f:
                f.write(log_content)
            return path
        except Exception:
            continue
    return "clinestudo_crash.log"

def show_native_error_dialog(title: str, message: str, exc: Exception = None):
    """
    Exibe uma caixa de diálogo nativa do Windows (MessageBoxW via ctypes).
    Funciona 100% mesmo se PySide6, Qt ou console não estiverem disponíveis!
    """
    log_path = write_crash_log(title, message, exc)
    full_message = (
        f"ClinEstudo Desktop encontrou uma falha ao iniciar:\n\n"
        f"{message}\n\n"
        f"Um relatório detalhado foi gravado em:\n"
        f"{log_path}\n\n"
        f"Dica de Solução:\n"
        f"• Se estiver no Windows, certifique-se de ter o 'Visual C++ Redistributable 2015-2022 (x64)'.\n"
        f"• Você também pode executar 'executar_com_log.bat' para ver o diagnóstico completo."
    )

    # 1. Tentativa nativa via Windows API (ctypes é biblioteca padrão, sempre presente)
    if sys.platform == "win32":
        try:
            import ctypes
            # MB_OK = 0x0, MB_ICONERROR = 0x10, MB_SYSTEMMODAL = 0x1000
            ctypes.windll.user32.MessageBoxW(0, full_message, f"ClinEstudo - {title}", 0x10 | 0x1000)
            return
        except Exception:
            pass

    # 2. Tentativa via Tkinter (caso Linux/Mac)
    try:
        import tkinter as tk
        from tkinter import messagebox
        root = tk.Tk()
        root.withdraw()
        messagebox.showerror(f"ClinEstudo - {title}", full_message)
        root.destroy()
        return
    except Exception:
        pass

    # 3. Fallback no console se disponível
    try:
        sys.stderr.write(f"\n[FALHA CLINESTUDO] {title}\n{full_message}\n")
    except Exception:
        pass

def global_exception_handler(exctype, value, tb):
    """Capturador global de exceções não tratadas."""
    err_str = "".join(traceback.format_exception(exctype, value, tb))
    show_native_error_dialog(
        "Erro Não Tratado na Aplicação",
        f"Ocorreu um erro inesperado: {value}",
        value
    )

# Ativa o interceptador global
sys.excepthook = global_exception_handler

# ==============================================================================
# CONFIGURAÇÃO DE AMBIENTE E PATHS
# ==============================================================================
CURRENT_DIR = get_app_dir()
PARENT_DIR = os.path.dirname(CURRENT_DIR)

if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)
if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)

if "clinestudo_desktop" not in sys.modules:
    clinestudo_pkg = types.ModuleType("clinestudo_desktop")
    clinestudo_pkg.__path__ = [CURRENT_DIR]
    clinestudo_pkg.__file__ = os.path.join(CURRENT_DIR, "__init__.py")
    sys.modules["clinestudo_desktop"] = clinestudo_pkg

# Configura arquivo de log padrão de boot
boot_log_file = os.path.join(CURRENT_DIR, "clinestudo_boot.log")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(boot_log_file, mode="w", encoding="utf-8")
    ]
)
logger = logging.getLogger("clinestudo.main")

# ==============================================================================
# INICIALIZAÇÃO DA APLICAÇÃO
# ==============================================================================
def main():
    logger.info("Iniciando processo principal do ClinEstudo Desktop...")

    # 1. Carrega configurações do sistema
    try:
        try:
            from clinestudo_desktop.config.settings import settings
            from clinestudo_desktop.database.migrations import init_database
            from clinestudo_desktop.database.connection import db_manager
        except ImportError:
            from config.settings import settings
            from database.migrations import init_database
            from database.connection import db_manager
    except Exception as e:
        show_native_error_dialog(
            "Erro ao Carregar Módulos de Configuração",
            f"Falha ao importar configurações internas: {e}",
            e
        )
        sys.exit(1)

    logger.info(f"Carregado: {settings.APP_NAME} v{settings.APP_VERSION}")

    # 2. Inicialização do PySide6 e Interface Gráfica
    try:
        from PySide6.QtWidgets import QApplication, QMessageBox
        from PySide6.QtGui import QIcon, QPixmap
        from PySide6.QtCore import Qt, QTimer
    except ImportError as e:
        msg = (
            "A biblioteca gráfica PySide6 (Qt) não foi encontrada ou não pôde ser carregada.\n\n"
            "Se você acabou de instalar o sistema:\n"
            "1. Certifique-se de executar 'pip install -r requirements.txt'.\n"
            "2. No Windows, instale o 'Microsoft Visual C++ 2015-2022 Redistributable (x64)'.\n"
            "3. Se compilou com PyInstaller, utilize o script atualizado 'build_exe.bat' que inclui todos os plugins Qt."
        )
        logger.error(msg)
        show_native_error_dialog("PySide6 Não Encontrado", msg, e)
        sys.exit(1)
    except Exception as e:
        show_native_error_dialog("Falha ao Inicializar PySide6", f"Erro no carregamento do Qt: {e}", e)
        sys.exit(1)

    # 3. Criação da Instância do QApplication
    try:
        app = QApplication(sys.argv)
        app.setApplicationName(settings.APP_NAME)
        app.setApplicationVersion(settings.APP_VERSION)
    except Exception as e:
        show_native_error_dialog(
            "Falha ao Criar QApplication",
            f"Não foi possível iniciar o subsistema de janelas do Qt: {e}",
            e
        )
        sys.exit(1)

    # 4. EXIBIÇÃO DA SPLASH SCREEN COM O LOGO DO GLOBO (Solicitado pelo usuário)
    splash = None
    try:
        try:
            from clinestudo_desktop.ui.splash_screen import GlobeSplashScreen
        except ImportError:
            from ui.splash_screen import GlobeSplashScreen
        
        splash = GlobeSplashScreen(app)
        splash.show()
        splash.show_message("Inicializando ClinEstudo... Estabelecendo conexão global...")
    except Exception as e:
        logger.warning(f"Não foi possível exibir a splash screen com o globo: {e}")

    # 5. Inicialização e Migração do Banco de Dados
    try:
        if splash:
            splash.show_message("Verificando banco de dados e migrações estruturais...")
        
        db_ok = init_database()
        if not db_ok:
            logger.warning("Banco de dados não retornou OK. Operando com resiliência.")
    except Exception as e:
        logger.error(f"Erro na migração do banco: {e}")
        # Notifica mas permite continuar se SQLite de contingência puder responder
        if not settings.ALLOW_SQLITE_FALLBACK:
            show_native_error_dialog("Erro de Conexão com o Banco", f"Falha na inicialização do banco: {e}", e)
            sys.exit(1)

    health = db_manager.check_health()
    logger.info(f"Status do banco: {health['message']} (Motor: {health['engine']})")

    # 6. Carregamento dos Formulários do Sistema
    try:
        if splash:
            splash.show_message("Carregando módulos clínicos e tela de autenticação...")

        try:
            from clinestudo_desktop.ui.login_window import LoginDialog
            from clinestudo_desktop.visao.forms import TelaPrincipalNetBeans
        except ImportError:
            from ui.login_window import LoginDialog
            from visao.forms import TelaPrincipalNetBeans
    except Exception as e:
        show_native_error_dialog(
            "Erro ao Carregar Formulários Visao/NetBeans",
            f"Falha ao importar formulários da interface: {e}",
            e
        )
        sys.exit(1)

    # 7. Diálogo de Login e Transição para a Janela Principal
    try:
        login_dlg = LoginDialog()
        
        # Fecha a splash screen ao abrir o login
        if splash:
            splash.finish(login_dlg)

        if login_dlg.exec() == LoginDialog.Accepted:
            u = getattr(login_dlg, "usuario_autenticado", None) or {}
            janela = TelaPrincipalNetBeans(
                usuario_login=u.get("login", "admin"),
                perfil=u.get("perfil", "ADMINISTRADOR")
            )
            janela.show()
            sys.exit(app.exec())
        else:
            logger.info("Execução finalizada pelo usuário na tela de login.")
            sys.exit(0)
    except Exception as e:
        show_native_error_dialog(
            "Erro em Tempo de Execução",
            f"Ocorreu um erro durante a execução da interface: {e}",
            e
        )
        sys.exit(1)

if __name__ == "__main__":
    main()
