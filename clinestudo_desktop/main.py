#!/usr/bin/env python3
"""
Ponto de entrada do sistema desktop ClinEstudo.
Inicializa o banco de dados, carrega temas e exibe o fluxo de autenticação e janela principal.
"""

import sys
import os
import types
import logging

# ==============================================================================
# BOOTSTRAP DE PATHS & ALIAS DE PACOTE (COMPATIBILIDADE WINDOWS / PYINSTALLER / LINUX)
# Garante que imports 'from clinestudo_desktop...' e locais funcionem perfeitamente
# mesmo executado diretamente via 'python main.py' ou empacotado via PyInstaller (.EXE).
# ==============================================================================
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR)

if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)
if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)

# Registra o alias 'clinestudo_desktop' dinamicamente se não existir no sys.modules
if "clinestudo_desktop" not in sys.modules:
    clinestudo_pkg = types.ModuleType("clinestudo_desktop")
    clinestudo_pkg.__path__ = [CURRENT_DIR]
    clinestudo_pkg.__file__ = os.path.join(CURRENT_DIR, "__init__.py")
    sys.modules["clinestudo_desktop"] = clinestudo_pkg
# ==============================================================================

# Imports com suporte duplo (absoluto e local)
try:
    from clinestudo_desktop.config.settings import settings
    from clinestudo_desktop.database.migrations import init_database
    from clinestudo_desktop.database.connection import db_manager
except ImportError:
    from config.settings import settings
    from database.migrations import init_database
    from database.connection import db_manager

# Configuração de logging estruturado
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("clinestudo.main")

def main():
    logger.info(f"Iniciando {settings.APP_NAME} v{settings.APP_VERSION}...")
    
    # 1. Inicialização de banco de dados e migrações
    try:
        db_ok = init_database()
        if not db_ok:
            logger.warning("Falha na inicialização completa do banco. Verifique suas configurações no .env.")
    except Exception as e:
        logger.error(f"Erro na migração do banco: {e}")

    health = db_manager.check_health()
    logger.info(f"Status do banco de dados: {health['message']} (Motor: {health['engine']})")

    # 2. Inicialização da Interface Gráfica PySide6
    try:
        from PySide6.QtWidgets import QApplication, QMessageBox
        
        try:
            from clinestudo_desktop.ui.login_window import LoginDialog
            from clinestudo_desktop.visao.forms import TelaPrincipalNetBeans
        except ImportError:
            from ui.login_window import LoginDialog
            from visao.forms import TelaPrincipalNetBeans

        app = QApplication(sys.argv)
        app.setApplicationName(settings.APP_NAME)
        app.setApplicationVersion(settings.APP_VERSION)

        # Diálogo de login
        login_dlg = LoginDialog()
        if login_dlg.exec() == LoginDialog.Accepted:
            u = getattr(login_dlg, "usuario_autenticado", None) or {}
            janela = TelaPrincipalNetBeans(
                usuario_login=u.get("login", "admin"),
                perfil=u.get("perfil", "ADMINISTRADOR")
            )
            janela.show()
            sys.exit(app.exec())
        else:
            logger.info("Execução cancelada na tela de login.")
            sys.exit(0)

    except ImportError as e:
        logger.error(
            "PySide6 não está instalado no ambiente ou não há servidor X11/Wayland ativo. "
            "Para executar em modo desktop nativo com interface gráfica, instale as dependências: "
            "pip install -r requirements.txt"
        )
        print("\n" + "="*70)
        print(" [CLINESTUDO] MODO CONSOLE / SERVIÇO ATIVO")
        print(f" Versão: {settings.APP_VERSION}")
        print(f" Conexão com banco: {health['engine']} ({health['message']})")
        print(" Usuários padrão disponíveis:")
        print("  - admin (senha: admin123) [Administrador]")
        print("  - medico.silva (senha: medico123) [Médico]")
        print("  - recepcao (senha: rec123) [Recepção]")
        print("="*70 + "\n")
    except Exception as e:
        logger.critical(f"Erro fatal na interface gráfica: {e}")
        try:
            from PySide6.QtWidgets import QMessageBox
            QMessageBox.critical(None, "Erro ClinEstudo", f"Ocorreu um erro ao iniciar a aplicação:\n{e}")
        except Exception:
            pass

if __name__ == "__main__":
    main()
