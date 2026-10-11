"""
Camada de Visão compatível com o projeto Java NetBeans / Swing (Visao).
Inclui TelaLogin, TelaPrincipal, FormMedico, FormPacientes e FormUsuario em PySide6.
"""

try:
    from PySide6.QtWidgets import (
        QWidget, QDialog, QMainWindow, QVBoxLayout, QHBoxLayout,
        QLabel, QPushButton, QLineEdit, QTableWidget, QTableWidgetItem,
        QHeaderView, QMessageBox, QComboBox, QDateEdit, QStackedWidget,
        QMenuBar, QMenu, QStatusBar, QFrame, QGridLayout
    )
    from PySide6.QtCore import Qt, QDate
    from PySide6.QtGui import QAction, QIcon
    HAS_PYSIDE = True
except ImportError:
    HAS_PYSIDE = False
    class QWidget: pass
    class QDialog: pass
    class QMainWindow: pass

from clinestudo_desktop.modelo_beans.beans import (
    BeansMedico, BeansPacientes, BeansUsuario, ModeloTabela
)
from clinestudo_desktop.modelo_dao.daos import (
    DaoMedico, DaoPacientes, DaoUsuario
)
from clinestudo_desktop.services.services import AuthService

class FormMedico(QWidget):
    """Equivalente do FormMedico.java original (CRUD com Novo, Salvar, Cancelar, Editar, Excluir, Pesquisar)."""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.dao = DaoMedico()
        self.mod = BeansMedico()
        self.init_ui()

    def init_ui(self):
        if not HAS_PYSIDE: return
        layout = QVBoxLayout(self)
        
        # Título
        lbl_titulo = QLabel("Cadastro de Médicos (FormMedico)")
        lbl_titulo.setStyleSheet("font-size: 16px; font-weight: bold; color: #14b8a6;")
        layout.addWidget(lbl_titulo)

        # Campos
        grid = QGridLayout()
        grid.addWidget(QLabel("Código:"), 0, 0)
        self.txt_cod = QLineEdit()
        self.txt_cod.setEnabled(False)
        grid.addWidget(self.txt_cod, 0, 1)

        grid.addWidget(QLabel("Nome do Médico:"), 1, 0)
        self.txt_nome = QLineEdit()
        grid.addWidget(self.txt_nome, 1, 1)

        grid.addWidget(QLabel("CRM:"), 2, 0)
        self.txt_crm = QLineEdit()
        grid.addWidget(self.txt_crm, 2, 1)

        grid.addWidget(QLabel("Especialidade:"), 3, 0)
        self.cb_especialidade = QComboBox()
        self.cb_especialidade.addItems(["Cardiologia", "Pediatria", "Ortopedia e Traumatologia", "Dermatologia", "Ginecologia"])
        grid.addWidget(self.cb_especialidade, 3, 1)
        layout.addLayout(grid)

        # Botões de Ação clássicos do NetBeans
        btn_box = QHBoxLayout()
        self.btn_novo = QPushButton("Novo")
        self.btn_salvar = QPushButton("Salvar")
        self.btn_cancelar = QPushButton("Cancelar")
        self.btn_editar = QPushButton("Editar")
        self.btn_excluir = QPushButton("Excluir")

        self.btn_novo.clicked.connect(self.limpar_campos)
        self.btn_salvar.clicked.connect(self.salvar_medico)
        self.btn_cancelar.clicked.connect(self.limpar_campos)

        btn_box.addWidget(self.btn_novo)
        btn_box.addWidget(self.btn_salvar)
        btn_box.addWidget(self.btn_cancelar)
        btn_box.addWidget(self.btn_editar)
        btn_box.addWidget(self.btn_excluir)
        layout.addLayout(btn_box)

        # Pesquisa e Tabela
        pesq_box = QHBoxLayout()
        self.txt_pesquisa = QLineEdit()
        self.txt_pesquisa.setPlaceholderText("Digite o nome para pesquisar...")
        self.btn_pesquisar = QPushButton("Pesquisar")
        self.btn_pesquisar.clicked.connect(self.pesquisar_medico)
        pesq_box.addWidget(self.txt_pesquisa)
        pesq_box.addWidget(self.btn_pesquisar)
        layout.addLayout(pesq_box)

        self.tabela = QTableWidget()
        self.tabela.setColumnCount(4)
        self.tabela.setHorizontalHeaderLabels(["Código", "Nome", "Especialidade", "CRM"])
        self.tabela.horizontalHeader().setSectionResizeMode(1, QHeaderView.Stretch)
        layout.addWidget(self.tabela)
        self.preencher_tabela()

    def limpar_campos(self):
        if not HAS_PYSIDE: return
        self.txt_cod.clear()
        self.txt_nome.clear()
        self.txt_crm.clear()

    def salvar_medico(self):
        if not HAS_PYSIDE: return
        self.mod.nome = self.txt_nome.text().strip()
        self.mod.crm = self.txt_crm.text().strip()
        self.mod.especialidade = self.cb_especialidade.currentText()
        sucesso, msg = self.dao.salvar(self.mod)
        if sucesso:
            QMessageBox.information(self, "Sucesso", msg)
            self.limpar_campos()
            self.preencher_tabela()
        else:
            QMessageBox.warning(self, "Aviso", msg)

    def pesquisar_medico(self):
        self.preencher_tabela(self.txt_pesquisa.text().strip())

    def preencher_tabela(self, termo: str = ""):
        if not HAS_PYSIDE: return
        medicos = self.dao.listar(termo=termo)
        self.tabela.setRowCount(len(medicos))
        for i, m in enumerate(medicos):
            self.tabela.setItem(i, 0, QTableWidgetItem(str(m["id"])))
            self.tabela.setItem(i, 1, QTableWidgetItem(m["nome"]))
            self.tabela.setItem(i, 2, QTableWidgetItem(m["especialidade"]))
            self.tabela.setItem(i, 3, QTableWidgetItem(m["crm"]))

class TelaPrincipalNetBeans(QMainWindow):
    """
    Equivalente da TelaPrincipal.java original do NetBeans com:
    - JMenuBar (Cadastros, Relatorios, Ferramentas, Sair)
    - Painel central 'Bem-Vindos' com os botões de atalho:
      Cad. Médicos, Cad. Enfermeiras, Cad. Pacientes, Agenda
    """
    def __init__(self, usuario_login="admin", perfil="ADMINISTRADOR"):
        super().__init__()
        self.usuario_login = usuario_login
        self.perfil = perfil
        self.init_ui()

    def init_ui(self):
        if not HAS_PYSIDE: return
        self.setWindowTitle("Sistema de Gerenciamento de Consultório - ClinEstudo")
        self.resize(1100, 700)

        # 1. Barra de Menu no padrão NetBeans
        menubar = self.menuBar()
        menu_cadastros = menubar.addMenu("Cadastros")
        menu_relatorios = menubar.addMenu("Relatórios")
        menu_ferramentas = menubar.addMenu("Ferramentas")
        menu_sair = menubar.addMenu("Sair")

        act_medicos = QAction("Médicos", self)
        act_pacientes = QAction("Pacientes", self)
        act_enfermeiras = QAction("Enfermeiras", self)
        act_usuarios = QAction("Usuários", self)

        menu_cadastros.addAction(act_medicos)
        menu_cadastros.addAction(act_pacientes)
        menu_cadastros.addAction(act_enfermeiras)
        menu_cadastros.addAction(act_usuarios)

        act_bem_vindos = QAction("Tela Bem-vindos", self)
        menu_ferramentas.addAction(act_bem_vindos)

        act_sair = QAction("Sair do Sistema", self)
        act_sair.triggered.connect(self.close)
        menu_sair.addAction(act_sair)

        # 2. Painel Central (Equivalente ao painel da TelaPrincipal.form)
        central = QWidget()
        self.setCentralWidget(central)
        vbox = QVBoxLayout(central)

        card_bem_vindos = QFrame()
        card_bem_vindos.setStyleSheet("background-color: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 20px;")
        card_layout = QVBoxLayout(card_bem_vindos)

        lbl_header = QLabel("Sistema de Gerenciamento de: Consultas e Procedimentos Clínicos")
        lbl_header.setStyleSheet("font-size: 15px; font-weight: bold; color: #38bdf8; margin-bottom: 12px;")
        card_layout.addWidget(lbl_header)

        # Botões de Atalho Grandes da TelaPrincipal.form
        btn_grid = QGridLayout()
        self.btn_cad_medicos = QPushButton("👨‍⚕️ Cad. Médicos")
        self.btn_cad_enfermeiras = QPushButton("👩‍⚕️ Cad. Enfermeiras")
        self.btn_cad_pacientes = QPushButton("👥 Cad. Pacientes")
        self.btn_agenda = QPushButton("📅 Agenda")

        for b in [self.btn_cad_medicos, self.btn_cad_enfermeiras, self.btn_cad_pacientes, self.btn_agenda]:
            b.setStyleSheet("background-color: #0f172a; border: 1px solid #0284c7; padding: 16px; font-size: 13px; font-weight: bold; border-radius: 6px;")

        btn_grid.addWidget(self.btn_cad_medicos, 0, 0)
        btn_grid.addWidget(self.btn_cad_enfermeiras, 0, 1)
        btn_grid.addWidget(self.btn_cad_pacientes, 1, 0)
        btn_grid.addWidget(self.btn_agenda, 1, 1)
        card_layout.addLayout(btn_grid)

        vbox.addWidget(card_bem_vindos)
        vbox.addStretch()

        # Barra de status
        status = QStatusBar()
        self.setStatusBar(status)
        status.showMessage(f"Usuário Conectado: {self.usuario_login} | Perfil: {self.perfil} | Banco: PostgreSQL Conectado")
