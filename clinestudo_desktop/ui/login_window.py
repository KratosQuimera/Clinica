"""
Janela de autenticação e login desktop em PySide6.
"""

try:
    from PySide6.QtWidgets import (
        QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit,
        QPushButton, QMessageBox, QFrame
    )
    from PySide6.QtCore import Qt
    HAS_PYSIDE = True
except ImportError:
    HAS_PYSIDE = False
    class QDialog: pass

from clinestudo_desktop.services.services import AuthService
from clinestudo_desktop.ui.theme import MODERN_QSS

class LoginDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.auth_service = AuthService()
        self.usuario_autenticado = None
        self.init_ui()

    def init_ui(self):
        if not HAS_PYSIDE: return
        self.setWindowTitle("ClinEstudo - Acesso ao Sistema")
        self.setFixedSize(380, 460)
        self.setStyleSheet(MODERN_QSS)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(32, 32, 32, 32)
        layout.setSpacing(14)

        # Cabeçalho / Branding
        lbl_titulo = QLabel("ClinEstudo")
        lbl_titulo.setStyleSheet("font-size: 24px; font-weight: 700; color: #14b8a6;")
        lbl_titulo.setAlignment(Qt.AlignCenter)
        layout.addWidget(lbl_titulo)

        lbl_sub = QLabel("Sistema de Gestão Clínica e Atendimento")
        lbl_sub.setStyleSheet("font-size: 12px; color: #94a3b8; margin-bottom: 12px;")
        lbl_sub.setAlignment(Qt.AlignCenter)
        layout.addWidget(lbl_sub)

        # Campos
        layout.addWidget(QLabel("Usuário:"))
        self.txt_login = QLineEdit()
        self.txt_login.setPlaceholderText("ex: admin ou medico.silva")
        layout.addWidget(self.txt_login)

        layout.addWidget(QLabel("Senha:"))
        self.txt_senha = QLineEdit()
        self.txt_senha.setEchoMode(QLineEdit.Password)
        self.txt_senha.setPlaceholderText("••••••••")
        self.txt_senha.returnPressed.connect(self.tentar_login)
        layout.addWidget(self.txt_senha)

        # Botão Entrar
        self.btn_entrar = QPushButton("Acessar Sistema")
        self.btn_entrar.setProperty("class", "btn-primary")
        self.btn_entrar.setStyleSheet("padding: 10px; font-size: 14px; margin-top: 10px;")
        self.btn_entrar.clicked.connect(self.tentar_login)
        layout.addWidget(self.btn_entrar)

        self.lbl_feedback = QLabel("")
        self.lbl_feedback.setStyleSheet("color: #f87171; font-size: 12px;")
        self.lbl_feedback.setAlignment(Qt.AlignCenter)
        self.lbl_feedback.setWordWrap(True)
        layout.addWidget(self.lbl_feedback)

    def tentar_login(self):
        login = self.txt_login.text().strip()
        senha = self.txt_senha.text()
        sucesso, msg, usuario = self.auth_service.autenticar(login, senha)
        if sucesso:
            self.usuario_autenticado = usuario
            self.accept()
        else:
            self.lbl_feedback.setText(msg)
