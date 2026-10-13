"""
Janela Principal (QMainWindow) do ClinEstudo em PySide6.
"""

try:
    from PySide6.QtWidgets import (
        QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
        QPushButton, QLabel, QStackedWidget, QStatusBar,
        QMessageBox, QFrame
    )
    from PySide6.QtCore import Qt, QTimer
    from PySide6.QtGui import QIcon, QKeySequence, QShortcut
    HAS_PYSIDE = True
except ImportError:
    HAS_PYSIDE = False
    class _DummyWidget:
        def __init__(self, *args, **kwargs): pass
        def __getattr__(self, name): return lambda *args, **kwargs: None
    QMainWindow = QWidget = QVBoxLayout = QHBoxLayout = QPushButton = QLabel = QStackedWidget = QStatusBar = QMessageBox = QFrame = Qt = QTimer = QIcon = QKeySequence = QShortcut = _DummyWidget

try:
    from config.settings import settings
    from ui.theme import MODERN_QSS
    from ui.views import MedicosView, PacientesView, AgendaView
    from auth.session import gerenciador_sessao
    from database.connection import db_manager
except ImportError:
    from clinestudo_desktop.config.settings import settings
    from clinestudo_desktop.ui.theme import MODERN_QSS
    from clinestudo_desktop.ui.views import MedicosView, PacientesView, AgendaView
    from clinestudo_desktop.auth.session import gerenciador_sessao
    from clinestudo_desktop.database.connection import db_manager

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.init_ui()

    def init_ui(self):
        if not HAS_PYSIDE: return
        self.setWindowTitle(f"ClinEstudo v{settings.APP_VERSION} - Gestão Clínica Integrada")
        self.resize(1280, 800)
        self.setStyleSheet(MODERN_QSS)

        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QHBoxLayout(central_widget)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        # 1. Barra Lateral (Sidebar)
        sidebar = QWidget()
        sidebar.setObjectName("sidebarWidget")
        sidebar_layout = QVBoxLayout(sidebar)
        sidebar_layout.setContentsMargins(12, 16, 12, 16)
        sidebar_layout.setSpacing(6)

        lbl_logo = QLabel("ClinEstudo")
        lbl_logo.setStyleSheet("font-size: 18px; font-weight: 700; color: #14b8a6; padding: 10px 14px;")
        sidebar_layout.addWidget(lbl_logo)

        # Botões de Navegação
        self.btn_dashboard = self._criar_nav_btn("📊 Início / Painel", 0)
        self.btn_agenda = self._criar_nav_btn("📅 Agenda de Consultas", 1)
        self.btn_pacientes = self._criar_nav_btn("👥 Pacientes", 2)
        self.btn_medicos = self._criar_nav_btn("👨‍⚕️ Corpo Clínico (Médicos)", 3)
        self.btn_relatorios = self._criar_nav_btn("📈 Relatórios & Exportação", 4)

        sidebar_layout.addWidget(self.btn_dashboard)
        sidebar_layout.addWidget(self.btn_agenda)
        sidebar_layout.addWidget(self.btn_pacientes)
        sidebar_layout.addWidget(self.btn_medicos)
        sidebar_layout.addWidget(self.btn_relatorios)
        sidebar_layout.addStretch()

        # Botão Sair
        btn_sair = QPushButton("🚪 Encerrar Sessão")
        btn_sair.setProperty("class", "nav-button")
        btn_sair.clicked.connect(self.close)
        sidebar_layout.addWidget(btn_sair)

        main_layout.addWidget(sidebar)

        # 2. Área Central com StackedWidget
        self.stack = QStackedWidget()
        
        # Painel Dashboard Placeholder
        self.dashboard_view = QWidget()
        dash_layout = QVBoxLayout(self.dashboard_view)
        dash_layout.addWidget(QLabel("Visão Geral do Consultório e Agenda do Dia"))
        self.stack.addWidget(self.dashboard_view)

        # Agenda View
        self.agenda_view = AgendaView()
        self.stack.addWidget(self.agenda_view)

        # Pacientes View
        self.pacientes_view = PacientesView()
        self.stack.addWidget(self.pacientes_view)

        # Médicos View
        self.medicos_view = MedicosView()
        self.stack.addWidget(self.medicos_view)

        main_layout.addWidget(self.stack)

        # 3. Status Bar
        status_bar = QStatusBar()
        self.setStatusBar(status_bar)
        health = db_manager.check_health()
        status_engine = "PostgreSQL Conectado" if health["ok"] else "Modo Resiliente / SQLite Ativo"
        status_bar.showMessage(f"Servidor: {status_engine} | Usuário: {gerenciador_sessao.usuario_atual.login if gerenciador_sessao.usuario_atual else 'Admin'}")

    def _criar_nav_btn(self, texto: str, index: int) -> QPushButton:
        btn = QPushButton(texto)
        btn.setProperty("class", "nav-button")
        btn.clicked.connect(lambda: self.stack.setCurrentIndex(index))
        return btn
