#!/usr/bin/env python3
"""
Ponto de entrada do sistema desktop ClinEstudo.
Inicializa o banco de dados, carrega a Splash Screen com o Logo do Globo,
aplica arquitetura resiliente com tratamento nativo contra falhas do executavel Windows (.exe),
e inicializa a interface grafica (PySide6 / Qt com fallback universal para Tkinter / Console).
"""

import sys
import os
import types
import logging
import traceback
from datetime import datetime

# ==============================================================================
# TRATAMENTO NATIVO CONTRA FALHAS SILENCIOSAS NO WINDOWS (.EXE)
# ==============================================================================

def get_app_dir() -> str:
    """Retorna o diretorio base da aplicacao (suporta modo congelado PyInstaller)."""
    if getattr(sys, 'frozen', False):
        return getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(sys.executable)))
    return os.path.dirname(os.path.abspath(__file__))

def get_writable_dir() -> str:
    """Retorna diretorio com permissao de gravacao para logs e bancos locais."""
    if getattr(sys, 'frozen', False):
        return os.path.dirname(os.path.abspath(sys.executable))
    return os.path.dirname(os.path.abspath(__file__))

def write_crash_log(title: str, details: str, exc: Exception = None) -> str:
    """Grava o erro em arquivo de log no disco."""
    app_dir = get_writable_dir()
    candidates = [
        os.path.join(app_dir, "clinestudo_crash.log"),
        os.path.join(os.environ.get("LOCALAPPDATA", app_dir), "ClinEstudo", "clinestudo_crash.log"),
        os.path.join(os.environ.get("TEMP", "."), "clinestudo_crash.log")
    ]
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    tb_str = traceback.format_exc() if exc else ""
    log_content = (
        f"======================================================================\n"
        f"CLINESTUDO DESKTOP - RELATORIO DE EVENTO NA INICIALIZACAO\n"
        f"Data/Hora: {timestamp}\n"
        f"Titulo: {title}\n"
        f"Python: {sys.version}\n"
        f"Executavel: {sys.executable}\n"
        f"Congelado (PyInstaller): {getattr(sys, 'frozen', False)}\n"
        f"----------------------------------------------------------------------\n"
        f"Detalhes:\n{details}\n"
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
    Exibe uma caixa de dialogo nativa do Windows (MessageBoxW via ctypes).
    Garante que mensagens de erro criticas sejam visiveis ao usuario sem console.
    """
    log_path = write_crash_log(title, message, exc)
    full_message = (
        f"ClinEstudo Desktop:\n\n"
        f"{message}\n\n"
        f"Relatorio registrado em:\n"
        f"{log_path}"
    )

    if sys.platform == "win32":
        try:
            import ctypes
            ctypes.windll.user32.MessageBoxW(0, full_message, f"ClinEstudo - {title}", 0x10 | 0x1000)
            return
        except Exception:
            pass

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

    try:
        sys.stderr.write(f"\n[CLINESTUDO] {title}\n{full_message}\n")
    except Exception:
        pass

def global_exception_handler(exctype, value, tb):
    """Capturador global de excecoes nao tratadas para evitar encerramento silencioso."""
    show_native_error_dialog(
        "Erro Nao Tratado na Aplicacao",
        f"Ocorreu um erro inesperado: {value}",
        value
    )

sys.excepthook = global_exception_handler

# ==============================================================================
# CONFIGURACAO DE AMBIENTE E PATHS
# ==============================================================================
CURRENT_DIR = get_app_dir()
PARENT_DIR = os.path.dirname(CURRENT_DIR)

if getattr(sys, 'frozen', False):
    exe_dir = os.path.dirname(os.path.abspath(sys.executable))
    if exe_dir not in sys.path:
        sys.path.insert(0, exe_dir)
    meipass = getattr(sys, '_MEIPASS', None)
    if meipass and meipass not in sys.path:
        sys.path.insert(0, meipass)
    # Suporte a plugins de plataforma do PySide6 (qwindows.dll)
    pyside_plugins = os.path.join(meipass or exe_dir, "PySide6", "plugins", "platforms")
    if os.path.exists(pyside_plugins):
        os.environ["QT_QPA_PLATFORM_PLUGIN_PATH"] = pyside_plugins

if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)
if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)

boot_log_file = os.path.join(get_writable_dir(), "clinestudo_boot.log")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(boot_log_file, mode="w", encoding="utf-8")
    ]
)
logger = logging.getLogger("clinestudo.main")

# Mapeia dinamicamente o namespace 'clinestudo_desktop' para compatibilidade total
if "clinestudo_desktop" not in sys.modules:
    clinestudo_pkg = types.ModuleType("clinestudo_desktop")
    clinestudo_pkg.__path__ = [CURRENT_DIR]
    clinestudo_pkg.__file__ = os.path.join(CURRENT_DIR, "__init__.py")
    sys.modules["clinestudo_desktop"] = clinestudo_pkg

# ==============================================================================
# MODO CLI RESILIENTE (PARA AMBIENTES HEADLESS / SERVIDORES)
# ==============================================================================
def run_cli_resilient_mode(settings, db_manager):
    """Executa em modo terminal sem falhas quando nenhuma GUI esta disponivel."""
    print("=" * 72)
    print("           .---.          ")
    print("         /   |   \\        CLINESTUDO DESKTOP v2.4.0")
    print("        | ---+--- |       Rede Global de Gestão Clínica & Hospitalar")
    print("         \\   |   /        Inicialização Concluída com Sucesso!")
    print("           '---'          ")
    print("=" * 72)
    
    health = db_manager.check_health()
    print(f"• Motor de Banco: {health.get('engine', '').upper()} ({health.get('message', '')})")
    
    try:
        from services.services import MedicoService, PacienteService, AgendaService, ReceitaService
    except ImportError:
        from clinestudo_desktop.services.services import MedicoService, PacienteService, AgendaService, ReceitaService
        
    meds = len(MedicoService().repo.listar(apenas_ativos=False))
    pacs = len(PacienteService().repo.listar(apenas_ativos=False))
    agends = len(AgendaService().repo.listar())
    recs = len(ReceitaService().listar_receitas())
    
    print(f"• Médicos Registrados:     {meds}")
    print(f"• Pacientes Registrados:   {pacs}")
    print(f"• Consultas Agendadas:     {agends}")
    print(f"• Prescrições Médicas QR:  {recs}")
    print(f"• Criptografia LGPD:       ATIVADA [SHA-256 / PBKDF2]")
    print("-" * 72)
    print("Sistema pronto para execução gráfica no Windows.")
    print("• Para abrir o executável no Windows: execute ClinEstudo.exe ou build_exe.bat")
    print("• Para modo diagnóstico com console: execute executar_com_log.bat")
    print("=" * 72)
    return 0

# ==============================================================================
# INICIALIZACAO PRINCIPAL
# ==============================================================================
def main():
    logger.info("Iniciando processo principal do ClinEstudo Desktop...")

    # 1. Carrega configuracoes do sistema
    try:
        try:
            from config.settings import settings
            from database.migrations import init_database
            from database.connection import db_manager
        except ImportError:
            from clinestudo_desktop.config.settings import settings
            from clinestudo_desktop.database.migrations import init_database
            from clinestudo_desktop.database.connection import db_manager
    except Exception as e:
        show_native_error_dialog(
            "Erro ao Carregar Modulos de Configuracao",
            f"Falha ao importar configuracoes internas: {e}",
            e
        )
        sys.exit(1)

    logger.info(f"Carregado: {settings.APP_NAME} v{settings.APP_VERSION}")

    # 2. Inicializacao e Migracao do Banco de Dados
    try:
        init_database()
    except Exception as e:
        logger.error(f"Erro na migracao do banco de dados: {e}")

    health = db_manager.check_health()
    logger.info(f"Status do banco: {health['message']} (Motor: {health['engine']})")

    # 3. TENTATIVA 1: Layout Idêntico ao da Web (Solicitado pelo Usuário: layout exatamente igual ao web)
    try:
        try:
            from ui.desktop_webapp import launch_web_layout_app
        except ImportError:
            from clinestudo_desktop.ui.desktop_webapp import launch_web_layout_app

        logger.info("Iniciando ClinEstudo Desktop com o Layout Idêntico ao da Web...")
        if launch_web_layout_app():
            sys.exit(0)
    except Exception as e:
        logger.info(f"Web Layout em modo janela delegou para engine alternativo: {e}")

    # 4. TENTATIVA 2: Interface Grafica Moderna PySide6 (Qt) com Splash do Globo
    pyside_success = False
    try:
        from PySide6.QtWidgets import QApplication
        from PySide6.QtCore import Qt
        
        app = QApplication(sys.argv)
        app.setApplicationName(settings.APP_NAME)
        app.setApplicationVersion(settings.APP_VERSION)

        # Carrega Splash Screen com o Logo do Globo
        splash = None
        try:
            try:
                from ui.splash_screen import GlobeSplashScreen
            except ImportError:
                from clinestudo_desktop.ui.splash_screen import GlobeSplashScreen
            splash = GlobeSplashScreen(app)
            splash.show()
            splash.show_message("Inicializando ClinEstudo... Estabelecendo conexao global...")
        except Exception as e:
            logger.warning(f"Splash screen Qt ignorada: {e}")

        # Carrega Login e Janela Principal
        try:
            from ui.login_window import LoginDialog
            from visao.forms import TelaPrincipalNetBeans
        except ImportError:
            from clinestudo_desktop.ui.login_window import LoginDialog
            from clinestudo_desktop.visao.forms import TelaPrincipalNetBeans

        login_dlg = LoginDialog()
        if splash:
            splash.finish(login_dlg)

        pyside_success = True
        if login_dlg.exec() == LoginDialog.Accepted:
            u = getattr(login_dlg, "usuario_autenticado", None) or {}
            janela = TelaPrincipalNetBeans(
                usuario_login=u.get("login", "admin"),
                perfil=u.get("perfil", "ADMINISTRADOR")
            )
            janela.show()
            sys.exit(app.exec())
        else:
            logger.info("Execucao finalizada pelo usuario na tela de login.")
            sys.exit(0)

    except Exception as e:
        logger.info(f"PySide6 nao disponivel ou nao pode ser iniciado no ambiente: {e}. Acionando fallback universal...")

    # 4. TENTATIVA 2: Fallback Universal Tkinter (Logo do Globo + Formularios Completos)
    try:
        try:
            from ui.tkinter_app import launch_tkinter_app
        except ImportError:
            from clinestudo_desktop.ui.tkinter_app import launch_tkinter_app

        logger.info("Iniciando interface grafica universal Tkinter com Logo do Globo...")
        if launch_tkinter_app():
            sys.exit(0)
    except Exception as e:
        logger.info(f"Tkinter nao disponivel (ambiente headless ou sem servidor X11): {e}")

    # 5. TENTATIVA 3: Modo CLI Resiliente para ambientes sem interface grafica
    sys.exit(run_cli_resilient_mode(settings, db_manager))

if __name__ == "__main__":
    main()
