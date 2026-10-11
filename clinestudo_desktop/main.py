#!/usr/bin/env python3
"""
Ponto de entrada do sistema desktop ClinEstudo.
Inicializa o banco de dados, carrega temas e exibe o fluxo de autenticação e janela principal.
"""

import sys
import logging
from clinestudo_desktop.config.settings import settings
from clinestudo_desktop.database.migrations import init_database
from clinestudo_desktop.database.connection import db_manager

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
    db_ok = init_database()
    if not db_ok:
        logger.warning("Falha na inicialização completa do banco. Verifique suas configurações no .env.")

    health = db_manager.check_health()
    logger.info(f"Status do banco de dados: {health['message']} (Motor: {health['engine']})")

    # 2. Inicialização da Interface Gráfica PySide6
    try:
        from PySide6.QtWidgets import QApplication, QMessageBox
        from clinestudo_desktop.ui.login_window import LoginDialog
        from clinestudo_desktop.ui.main_window import MainWindow

        app = QApplication(sys.argv)
        app.setApplicationName(settings.APP_NAME)
        app.setApplicationVersion(settings.APP_VERSION)

        # Diálogo de login
        login_dlg = LoginDialog()
        if login_dlg.exec() == LoginDialog.Accepted:
            janela = MainWindow()
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

if __name__ == "__main__":
    main()
