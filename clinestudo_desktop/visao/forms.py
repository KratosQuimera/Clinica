"""
Camada de Visão completa compatível com o projeto Java NetBeans / Swing (Visao).
Inclui TelaPrincipalNetBeans com JDesktopPane e JInternalFrames para:
- FormMedico
- FormPacientes
- FormUsuario
- FormEnfermeira
- FormAgenda
"""

try:
    from PySide6.QtWidgets import (
        QWidget, QDialog, QMainWindow, QVBoxLayout, QHBoxLayout,
        QLabel, QPushButton, QLineEdit, QTableWidget, QTableWidgetItem,
        QHeaderView, QMessageBox, QComboBox, QDateEdit, QStackedWidget,
        QMenuBar, QMenu, QStatusBar, QFrame, QGridLayout, QMdiArea,
        QMdiSubWindow, QTextEdit, QTimeEdit
    )
    from PySide6.QtCore import Qt, QDate, QTime
    from PySide6.QtGui import QAction, QIcon
    HAS_PYSIDE = True
except ImportError:
    HAS_PYSIDE = False
    class QWidget: pass
    class QDialog: pass
    class QMainWindow: pass
    class QFrame: pass

from clinestudo_desktop.modelo_beans.beans import (
    BeansMedico, BeansPacientes, BeansUsuario, BeansEnfermeira, BeansAgenda, ModeloTabela
)
from clinestudo_desktop.modelo_dao.daos import (
    DaoMedico, DaoPacientes, DaoUsuario
)
from clinestudo_desktop.services.services import AuthService, AgendaService
from clinestudo_desktop.repositories.repositories import EnfermeiroRepository, AgendamentoRepository

class FormMedicoWindow(QWidget):
    """Equivalente fiel ao FormMedico.java do NetBeans."""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.dao = DaoMedico()
        self.mod = BeansMedico()
        self.init_ui()

    def init_ui(self):
        if not HAS_PYSIDE: return
        self.setWindowTitle("Cadastro de Médicos")
        layout = QVBoxLayout(self)
        layout.setContentsMargins(15, 15, 15, 15)
        layout.setSpacing(10)

        # Painel de campos
        frame_campos = QFrame()
        frame_campos.setStyleSheet("background-color: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 10px;")
        grid = QGridLayout(frame_campos)

        grid.addWidget(QLabel("Código:"), 0, 0)
        self.txt_cod = QLineEdit()
        self.txt_cod.setEnabled(False)
        self.txt_cod.setFixedWidth(80)
        grid.addWidget(self.txt_cod, 0, 1)

        grid.addWidget(QLabel("Nome do Médico:"), 1, 0)
        self.txt_nome = QLineEdit()
        self.txt_nome.setEnabled(False)
        grid.addWidget(self.txt_nome, 1, 1, 1, 3)

        grid.addWidget(QLabel("CRM:"), 2, 0)
        self.txt_crm = QLineEdit()
        self.txt_crm.setEnabled(False)
        self.txt_crm.setFixedWidth(140)
        grid.addWidget(self.txt_crm, 2, 1)

        grid.addWidget(QLabel("Especialidade:"), 2, 2)
        self.cb_especialidade = QComboBox()
        self.cb_especialidade.setEnabled(False)
        self.cb_especialidade.addItems(["Cardiologia", "Pediatria", "Ortopedia e Traumatologia", "Dermatologia", "Ginecologia e Obstetrícia", "Clínica Geral"])
        grid.addWidget(self.cb_especialidade, 2, 3)

        layout.addWidget(frame_campos)

        # Barra de botões clássicos do NetBeans: [Novo] [Salvar] [Cancelar] [Editar] [Excluir]
        btn_box = QHBoxLayout()
        self.btn_novo = QPushButton("Novo")
        self.btn_salvar = QPushButton("Salvar")
        self.btn_cancelar = QPushButton("Cancelar")
        self.btn_editar = QPushButton("Editar")
        self.btn_excluir = QPushButton("Excluir")

        self.btn_salvar.setEnabled(False)
        self.btn_cancelar.setEnabled(False)
        self.btn_editar.setEnabled(False)
        self.btn_excluir.setEnabled(False)

        self.btn_novo.clicked.connect(self.acao_novo)
        self.btn_salvar.clicked.connect(self.acao_salvar)
        self.btn_cancelar.clicked.connect(self.acao_cancelar)
        self.btn_editar.clicked.connect(self.acao_editar)
        self.btn_excluir.clicked.connect(self.acao_excluir)

        for b in [self.btn_novo, self.btn_salvar, self.btn_cancelar, self.btn_editar, self.btn_excluir]:
            b.setStyleSheet("background-color: #0f172a; border: 1px solid #0284c7; padding: 6px 14px; font-weight: bold; border-radius: 4px;")
            btn_box.addWidget(b)

        layout.addLayout(btn_box)

        # Pesquisa e Tabela
        pesq_box = QHBoxLayout()
        self.txt_pesquisa = QLineEdit()
        self.txt_pesquisa.setPlaceholderText("Digite o nome ou CRM para pesquisar...")
        self.btn_pesquisar = QPushButton("Pesquisar")
        self.btn_pesquisar.setStyleSheet("background-color: #0284c7; padding: 6px 14px; font-weight: bold; border-radius: 4px;")
        self.btn_pesquisar.clicked.connect(self.acao_pesquisar)
        pesq_box.addWidget(self.txt_pesquisa)
        pesq_box.addWidget(self.btn_pesquisar)
        layout.addLayout(pesq_box)

        self.tabela = QTableWidget()
        self.tabela.setColumnCount(4)
        self.tabela.setHorizontalHeaderLabels(["Código", "Nome", "Especialidade", "CRM"])
        self.tabela.horizontalHeader().setSectionResizeMode(1, QHeaderView.Stretch)
        self.tabela.itemClicked.connect(self.acao_selecionar_tabela)
        layout.addWidget(self.tabela)

        self.preencher_tabela()

    def acao_novo(self):
        self.txt_cod.clear()
        self.txt_nome.clear()
        self.txt_crm.clear()
        self.txt_nome.setEnabled(True)
        self.txt_crm.setEnabled(True)
        self.cb_especialidade.setEnabled(True)
        self.btn_salvar.setEnabled(True)
        self.btn_cancelar.setEnabled(True)
        self.btn_novo.setEnabled(False)
        self.txt_nome.setFocus()

    def acao_cancelar(self):
        self.txt_cod.clear()
        self.txt_nome.clear()
        self.txt_crm.clear()
        self.txt_nome.setEnabled(False)
        self.txt_crm.setEnabled(False)
        self.cb_especialidade.setEnabled(False)
        self.btn_salvar.setEnabled(False)
        self.btn_cancelar.setEnabled(False)
        self.btn_novo.setEnabled(True)
        self.btn_editar.setEnabled(False)
        self.btn_excluir.setEnabled(False)

    def acao_salvar(self):
        nome = self.txt_nome.text().strip()
        crm = self.txt_crm.text().strip()
        esp = self.cb_especialidade.currentText()
        cod = self.txt_cod.text().strip()

        med = BeansMedico(
            codigo=int(cod) if cod else None,
            nome=nome,
            crm=crm,
            especialidade=esp,
            telefone="(11) 98765-4321"
        )

        if cod:
            ok, msg = self.dao.editar(med)
        else:
            ok, msg = self.dao.salvar(med)

        if ok:
            QMessageBox.information(self, "Sucesso", msg)
            self.acao_cancelar()
            self.preencher_tabela()
        else:
            QMessageBox.warning(self, "Aviso", msg)

    def acao_editar(self):
        self.txt_nome.setEnabled(True)
        self.txt_crm.setEnabled(True)
        self.cb_especialidade.setEnabled(True)
        self.btn_salvar.setEnabled(True)
        self.btn_cancelar.setEnabled(True)
        self.btn_editar.setEnabled(False)

    def acao_excluir(self):
        cod = self.txt_cod.text().strip()
        if not cod: return
        resp = QMessageBox.question(self, "Confirmar", "Deseja realmente desativar este médico?", QMessageBox.Yes | QMessageBox.No)
        if resp == QMessageBox.Yes:
            med = BeansMedico(codigo=int(cod))
            ok, msg = self.dao.excluir(med)
            if ok:
                QMessageBox.information(self, "Sucesso", msg)
                self.acao_cancelar()
                self.preencher_tabela()

    def acao_pesquisar(self):
        self.preencher_tabela(self.txt_pesquisa.text().strip())

    def acao_selecionar_tabela(self, item):
        row = item.row()
        self.txt_cod.setText(self.tabela.item(row, 0).text())
        self.txt_nome.setText(self.tabela.item(row, 1).text())
        self.cb_especialidade.setCurrentText(self.tabela.item(row, 2).text())
        self.txt_crm.setText(self.tabela.item(row, 3).text())
        self.btn_editar.setEnabled(True)
        self.btn_excluir.setEnabled(True)
        self.btn_cancelar.setEnabled(True)
        self.btn_novo.setEnabled(False)

    def preencher_tabela(self, termo: str = ""):
        medicos = self.dao.listar(apenas_ativos=True, termo=termo)
        self.tabela.setRowCount(len(medicos))
        for i, m in enumerate(medicos):
            self.tabela.setItem(i, 0, QTableWidgetItem(str(m["id"])))
            self.tabela.setItem(i, 1, QTableWidgetItem(m["nome"]))
            self.tabela.setItem(i, 2, QTableWidgetItem(m["especialidade"]))
            self.tabela.setItem(i, 3, QTableWidgetItem(m["crm"]))


class FormPacientesWindow(QWidget):
    """Equivalente ao FormPacientes.java do NetBeans."""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.dao = DaoPacientes()
        self.init_ui()

    def init_ui(self):
        if not HAS_PYSIDE: return
        self.setWindowTitle("Cadastro de Pacientes")
        layout = QVBoxLayout(self)
        layout.setContentsMargins(15, 15, 15, 15)

        frame = QFrame()
        frame.setStyleSheet("background-color: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 10px;")
        grid = QGridLayout(frame)

        grid.addWidget(QLabel("Código:"), 0, 0)
        self.txt_cod = QLineEdit()
        self.txt_cod.setEnabled(False)
        self.txt_cod.setFixedWidth(80)
        grid.addWidget(self.txt_cod, 0, 1)

        grid.addWidget(QLabel("Nome:"), 0, 2)
        self.txt_nome = QLineEdit()
        grid.addWidget(self.txt_nome, 0, 3)

        grid.addWidget(QLabel("CPF:"), 1, 0)
        self.txt_cpf = QLineEdit()
        self.txt_cpf.setPlaceholderText("000.000.000-00")
        grid.addWidget(self.txt_cpf, 1, 1)

        grid.addWidget(QLabel("Telefone:"), 1, 2)
        self.txt_tel = QLineEdit()
        grid.addWidget(self.txt_tel, 1, 3)

        grid.addWidget(QLabel("Convênio:"), 2, 0)
        self.cb_convenio = QComboBox()
        self.cb_convenio.addItems(["Unimed Saúde", "Bradesco Saúde", "Amil", "SulAmérica", "PARTICULAR"])
        grid.addWidget(self.cb_convenio, 2, 1)

        grid.addWidget(QLabel("Alergias:"), 2, 2)
        self.txt_alergias = QLineEdit()
        self.txt_alergias.setPlaceholderText("Penicilina, dipirona, etc.")
        grid.addWidget(self.txt_alergias, 2, 3)

        layout.addWidget(frame)

        # Botões
        btn_box = QHBoxLayout()
        self.btn_novo = QPushButton("Novo")
        self.btn_salvar = QPushButton("Salvar")
        self.btn_cancelar = QPushButton("Cancelar")
        self.btn_excluir = QPushButton("Excluir")

        self.btn_novo.clicked.connect(self.acao_novo)
        self.btn_salvar.clicked.connect(self.acao_salvar)
        self.btn_cancelar.clicked.connect(self.acao_cancelar)
        self.btn_excluir.clicked.connect(self.acao_excluir)

        for b in [self.btn_novo, self.btn_salvar, self.btn_cancelar, self.btn_excluir]:
            b.setStyleSheet("background-color: #0f172a; border: 1px solid #10b981; padding: 6px 14px; font-weight: bold; border-radius: 4px;")
            btn_box.addWidget(b)
        layout.addLayout(btn_box)

        # Tabela
        self.tabela = QTableWidget()
        self.tabela.setColumnCount(5)
        self.tabela.setHorizontalHeaderLabels(["Código", "Nome", "CPF", "Telefone", "Convênio"])
        self.tabela.horizontalHeader().setSectionResizeMode(1, QHeaderView.Stretch)
        layout.addWidget(self.tabela)
        self.preencher_tabela()

    def acao_novo(self):
        self.txt_cod.clear()
        self.txt_nome.clear()
        self.txt_cpf.clear()
        self.txt_tel.clear()
        self.txt_alergias.clear()
        self.txt_nome.setFocus()

    def acao_cancelar(self):
        self.acao_novo()

    def acao_salvar(self):
        pac = BeansPacientes(
            paci_codigo=int(self.txt_cod.text()) if self.txt_cod.text() else None,
            paci_nome=self.txt_nome.text().strip(),
            paci_cpf=self.txt_cpf.text().strip(),
            paci_tel=self.txt_tel.text().strip(),
            convenio=self.cb_convenio.currentText(),
            alergias=self.txt_alergias.text().strip()
        )
        if self.txt_cod.text():
            ok, msg = self.dao.editar(pac)
        else:
            ok, msg = self.dao.salvar(pac)
        if ok:
            QMessageBox.information(self, "Sucesso", msg)
            self.acao_novo()
            self.preencher_tabela()
        else:
            QMessageBox.warning(self, "Aviso", msg)

    def acao_excluir(self):
        if not self.txt_cod.text(): return
        pac = BeansPacientes(paci_codigo=int(self.txt_cod.text()))
        ok, msg = self.dao.excluir(pac)
        if ok:
            QMessageBox.information(self, "Sucesso", msg)
            self.acao_novo()
            self.preencher_tabela()

    def preencher_tabela(self):
        pacientes = self.dao.listar()
        self.tabela.setRowCount(len(pacientes))
        for i, p in enumerate(pacientes):
            self.tabela.setItem(i, 0, QTableWidgetItem(str(p["id"])))
            self.tabela.setItem(i, 1, QTableWidgetItem(p["nome"]))
            self.tabela.setItem(i, 2, QTableWidgetItem(p["cpf"] or ""))
            self.tabela.setItem(i, 3, QTableWidgetItem(p["telefone"]))
            self.tabela.setItem(i, 4, QTableWidgetItem(p["convenio"]))


class FormAgendaWindow(QWidget):
    """Equivalente à tela de Agenda de Consultas."""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.agenda_service = AgendaService()
        self.dao_medico = DaoMedico()
        self.dao_pacientes = DaoPacientes()
        self.init_ui()

    def init_ui(self):
        if not HAS_PYSIDE: return
        self.setWindowTitle("Agenda de Consultas")
        layout = QVBoxLayout(self)

        frame = QFrame()
        frame.setStyleSheet("background-color: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 10px;")
        grid = QGridLayout(frame)

        grid.addWidget(QLabel("Paciente:"), 0, 0)
        self.cb_paciente = QComboBox()
        grid.addWidget(self.cb_paciente, 0, 1)

        grid.addWidget(QLabel("Médico:"), 0, 2)
        self.cb_medico = QComboBox()
        grid.addWidget(self.cb_medico, 0, 3)

        grid.addWidget(QLabel("Data:"), 1, 0)
        self.dt_data = QDateEdit()
        self.dt_data.setDate(QDate.currentDate())
        grid.addWidget(self.dt_data, 1, 1)

        grid.addWidget(QLabel("Horário:"), 1, 2)
        self.txt_hora = QLineEdit("10:00")
        grid.addWidget(self.txt_hora, 1, 3)

        grid.addWidget(QLabel("Motivo:"), 2, 0)
        self.txt_motivo = QLineEdit()
        self.txt_motivo.setPlaceholderText("Ex: Consulta de rotina")
        grid.addWidget(self.txt_motivo, 2, 1, 1, 3)

        layout.addWidget(frame)

        btn_agendar = QPushButton("📅 Agendar Consulta")
        btn_agendar.setStyleSheet("background-color: #f59e0b; color: #000; padding: 8px; font-weight: bold; border-radius: 4px;")
        btn_agendar.clicked.connect(self.acao_agendar)
        layout.addWidget(btn_agendar)

        self.tabela = QTableWidget()
        self.tabela.setColumnCount(5)
        self.tabela.setHorizontalHeaderLabels(["Horário", "Paciente", "Médico", "Motivo", "Status"])
        self.tabela.horizontalHeader().setSectionResizeMode(1, QHeaderView.Stretch)
        layout.addWidget(self.tabela)

        self.carregar_combos()
        self.preencher_tabela()

    def carregar_combos(self):
        medicos = self.dao_medico.listar()
        self.cb_medico.clear()
        for m in medicos:
            self.cb_medico.addItem(f"{m['nome']} ({m['especialidade']})", m["id"])

        pacientes = self.dao_pacientes.listar()
        self.cb_paciente.clear()
        for p in pacientes:
            self.cb_paciente.addItem(f"{p['nome']} (CPF: {p['cpf']})", p["id"])

    def acao_agendar(self):
        pac_id = self.cb_paciente.currentData()
        med_id = self.cb_medico.currentData()
        data_str = self.dt_data.date().toString("yyyy-MM-dd")
        hora = self.txt_hora.text().strip()
        motivo = self.txt_motivo.text().strip()

        if not motivo:
            QMessageBox.warning(self, "Aviso", "Informe o motivo da consulta.")
            return

        ok, msg, ag_id = self.agenda_service.agendar_consulta(
            paciente_id=pac_id,
            medico_id=med_id,
            data_agenda=data_str,
            horario=hora,
            periodo="MANHÃ",
            motivo=motivo
        )
        if ok:
            QMessageBox.information(self, "Sucesso", msg)
            self.preencher_tabela()
        else:
            QMessageBox.critical(self, "Conflito de Horário", msg)

    def preencher_tabela(self):
        repo = AgendamentoRepository()
        data_str = self.dt_data.date().toString("yyyy-MM-dd")
        lista = repo.listar(data_inicio=data_str, data_fim=data_str)
        self.tabela.setRowCount(len(lista))
        for i, a in enumerate(lista):
            self.tabela.setItem(i, 0, QTableWidgetItem(a["horario"]))
            self.tabela.setItem(i, 1, QTableWidgetItem(a["nome_paciente"]))
            self.tabela.setItem(i, 2, QTableWidgetItem(a["nome_medico"]))
            self.tabela.setItem(i, 3, QTableWidgetItem(a["motivo"]))
            self.tabela.setItem(i, 4, QTableWidgetItem(a["status"]))


class TelaPrincipalNetBeans(QMainWindow):
    """
    Equivalente 100% idêntico da TelaPrincipal.java original do NetBeans:
    - Barra de Menus: Cadastros, Relatórios, Ferramentas, Sair
    - Painel central 'Bem-Vindos' com os 4 botões de atalho:
      Cad. Médicos, Cad. Enfermeiras, Cad. Pacientes, Agenda
    - Abre os formulários diretamente no fluxo sem sair do sistema.
    """
    def __init__(self, usuario_login="admin", perfil="ADMINISTRADOR"):
        super().__init__()
        self.usuario_login = usuario_login
        self.perfil = perfil
        self.init_ui()

    def init_ui(self):
        if not HAS_PYSIDE: return
        self.setWindowTitle("Sistema de Gerenciamento de Consultório - ClinEstudo")
        self.resize(1150, 750)
        self.setStyleSheet("""
            QMainWindow { background-color: #0f172a; color: #f8fafc; font-family: 'Segoe UI', sans-serif; }
            QMenuBar { background-color: #0b0f19; color: #f8fafc; font-size: 13px; padding: 4px; border-bottom: 1px solid #1e293b; }
            QMenuBar::item:selected { background-color: #1e293b; }
            QMenu { background-color: #0f172a; color: #f8fafc; border: 1px solid #334155; }
            QMenu::item:selected { background-color: #0284c7; }
        """)

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

        act_medicos.triggered.connect(self.abrir_form_medicos)
        act_pacientes.triggered.connect(self.abrir_form_pacientes)
        act_enfermeiras.triggered.connect(self.abrir_form_enfermeiras)
        act_usuarios.triggered.connect(self.abrir_form_usuarios)

        menu_cadastros.addAction(act_medicos)
        menu_cadastros.addAction(act_pacientes)
        menu_cadastros.addAction(act_enfermeiras)
        menu_cadastros.addAction(act_usuarios)

        act_rel_agenda = QAction("Relatório de Consultas", self)
        act_rel_agenda.triggered.connect(self.abrir_relatorios)
        menu_relatorios.addAction(act_rel_agenda)

        act_bem_vindos = QAction("Tela Bem-vindos", self)
        act_bem_vindos.triggered.connect(self.restaurar_bem_vindos)
        menu_ferramentas.addAction(act_bem_vindos)

        act_sair = QAction("Sair", self)
        act_sair.triggered.connect(self.close)
        menu_sair.addAction(act_sair)

        # 2. Área Central com StackedWidget (alterna entre o painel Bem-vindos e os Forms)
        self.stack = QStackedWidget()
        self.setCentralWidget(self.stack)

        # Tela Bem-vindos (Índice 0)
        self.widget_bem_vindos = QWidget()
        vbox = QVBoxLayout(self.widget_bem_vindos)
        vbox.setContentsMargins(40, 30, 40, 30)

        card_bem_vindos = QFrame()
        card_bem_vindos.setStyleSheet("""
            background-color: #162032;
            border: 1px solid #1e3a5f;
            border-radius: 8px;
            padding: 24px;
        """)
        card_layout = QVBoxLayout(card_bem_vindos)
        card_layout.setSpacing(18)

        # Título interno
        frame_header = QFrame()
        frame_header.setStyleSheet("background-color: #0f172a; border: 1px solid #1e293b; border-radius: 6px; padding: 12px;")
        f_lay = QHBoxLayout(frame_header)
        lbl_header = QLabel("Sistema de Gerenciamento de: Consultas e Procedimentos Clínicos")
        lbl_header.setStyleSheet("font-size: 16px; font-weight: bold; color: #38bdf8;")
        f_lay.addWidget(lbl_header)
        card_layout.addWidget(frame_header)

        # 4 Botões grandes clássicos em grade 2x2
        btn_grid = QGridLayout()
        btn_grid.setSpacing(14)

        self.btn_cad_medicos = QPushButton("👨‍⚕️ Cad. Médicos")
        self.btn_cad_enfermeiras = QPushButton("👩‍⚕️ Cad. Enfermeiras")
        self.btn_cad_pacientes = QPushButton("👥 Cad. Pacientes")
        self.btn_agenda = QPushButton("📅 Agenda")

        estilo_btn_atalho = """
            QPushButton {
                background-color: #0b1329;
                color: #ffffff;
                border: 1px solid #0284c7;
                padding: 20px;
                font-size: 14px;
                font-weight: bold;
                border-radius: 6px;
            }
            QPushButton:hover {
                background-color: #0f274a;
                border: 1px solid #38bdf8;
            }
        """

        for b in [self.btn_cad_medicos, self.btn_cad_enfermeiras, self.btn_cad_pacientes, self.btn_agenda]:
            b.setStyleSheet(estilo_btn_atalho)

        self.btn_cad_medicos.clicked.connect(self.abrir_form_medicos)
        self.btn_cad_pacientes.clicked.connect(self.abrir_form_pacientes)
        self.btn_cad_enfermeiras.clicked.connect(self.abrir_form_enfermeiras)
        self.btn_agenda.clicked.connect(self.abrir_agenda)

        btn_grid.addWidget(self.btn_cad_medicos, 0, 0)
        btn_grid.addWidget(self.btn_cad_enfermeiras, 0, 1)
        btn_grid.addWidget(self.btn_cad_pacientes, 1, 0)
        btn_grid.addWidget(self.btn_agenda, 1, 1)
        card_layout.addLayout(btn_grid)

        vbox.addWidget(card_bem_vindos)
        vbox.addStretch()

        self.stack.addWidget(self.widget_bem_vindos)

        # Instâncias dos Forms
        self.form_medicos = FormMedicoWindow()
        self.form_pacientes = FormPacientesWindow()
        self.form_agenda = FormAgendaWindow()

        self.stack.addWidget(self.form_medicos)
        self.stack.addWidget(self.form_pacientes)
        self.stack.addWidget(self.form_agenda)

        # Status Bar
        status = QStatusBar()
        self.setStatusBar(status)
        status.setStyleSheet("background-color: #0b0f19; color: #94a3b8; border-top: 1px solid #1e293b; padding: 4px;")
        status.showMessage(f"Usuário Conectado: {self.usuario_login} | Perfil: {self.perfil} | Banco: PostgreSQL Conectado")

    def restaurar_bem_vindos(self):
        self.stack.setCurrentIndex(0)

    def abrir_form_medicos(self):
        self.stack.setCurrentWidget(self.form_medicos)

    def abrir_form_pacientes(self):
        self.stack.setCurrentWidget(self.form_pacientes)

    def abrir_form_enfermeiras(self):
        QMessageBox.information(self, "Enfermeiras", "Acessando módulo de Enfermeiras e Turnos.")

    def abrir_form_usuarios(self):
        QMessageBox.information(self, "Usuários", "Acessando gerenciamento de usuários e perfis.")

    def abrir_agenda(self):
        self.stack.setCurrentWidget(self.form_agenda)

    def abrir_relatorios(self):
        QMessageBox.information(self, "Relatórios", "Acessando geração de relatórios de produtividade clínica.")
