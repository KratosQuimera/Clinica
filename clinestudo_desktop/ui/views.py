"""
Visões e formulários do ClinEstudo em PySide6.
Estruturado de forma modular para cada entidade: Médicos, Enfermeiros, Pacientes, Agenda, Usuários e Relatórios.
"""

try:
    from PySide6.QtWidgets import (
        QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
        QLineEdit, QTableWidget, QTableWidgetItem, QHeaderView,
        QComboBox, QDateEdit, QTimeEdit, QTextEdit, QMessageBox,
        QDialog, QFormLayout, QTabWidget, QSplitter
    )
    from PySide6.QtCore import Qt, QDate, QTime
    HAS_PYSIDE = True
except ImportError:
    HAS_PYSIDE = False
    # Mock para permitir importação e verificação sintática em ambientes sem PySide6 instalado
    class QWidget: pass
    class QDialog: pass

from clinestudo_desktop.services.services import (
    MedicoService, EnfermeiroService, PacienteService, AgendaService, RelatorioService
)
from clinestudo_desktop.repositories.repositories import (
    MedicoRepository, EnfermeiroRepository, PacienteRepository,
    AgendamentoRepository, UsuarioRepository, AuditoriaRepository
)
from clinestudo_desktop.auth.session import gerenciador_sessao

class MedicosView(QWidget):
    def __init__(self):
        super().__init__()
        self.service = MedicoService()
        self.repo = MedicoRepository()
        self.init_ui()

    def init_ui(self):
        if not HAS_PYSIDE:
            return
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)

        # Barra superior com busca e botão novo
        top_bar = QHBoxLayout()
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Buscar por nome, CRM ou especialidade...")
        self.search_input.textChanged.connect(self.carregar_dados)
        top_bar.addWidget(self.search_input)

        self.btn_novo = QPushButton("+ Cadastrar Médico")
        self.btn_novo.setProperty("class", "btn-primary")
        self.btn_novo.clicked.connect(self.abrir_formulario_novo)
        top_bar.addWidget(self.btn_novo)
        layout.addLayout(top_bar)

        # Tabela
        self.table = QTableWidget()
        self.table.setColumnCount(7)
        self.table.setHorizontalHeaderLabels(["ID", "Nome do Médico", "CRM", "UF", "Especialidade", "Telefone", "Status"])
        self.table.horizontalHeader().setSectionResizeMode(1, QHeaderView.Stretch)
        self.table.setSelectionBehavior(QTableWidget.SelectRows)
        layout.addWidget(self.table)

        self.carregar_dados()

    def carregar_dados(self):
        if not HAS_PYSIDE: return
        termo = self.search_input.text().strip()
        medicos = self.repo.listar(apenas_ativos=False, termo_busca=termo)
        self.table.setRowCount(len(medicos))
        for row, m in enumerate(medicos):
            self.table.setItem(row, 0, QTableWidgetItem(str(m["id"])))
            self.table.setItem(row, 1, QTableWidgetItem(m["nome"]))
            self.table.setItem(row, 2, QTableWidgetItem(m["crm"]))
            self.table.setItem(row, 3, QTableWidgetItem(m["uf_crm"]))
            self.table.setItem(row, 4, QTableWidgetItem(m["especialidade"]))
            self.table.setItem(row, 5, QTableWidgetItem(m["telefone"]))
            status_text = "Ativo" if m["ativo"] else "Inativo"
            self.table.setItem(row, 6, QTableWidgetItem(status_text))

    def abrir_formulario_novo(self):
        # Abre diálogo de cadastro
        pass

class PacientesView(QWidget):
    def __init__(self):
        super().__init__()
        self.service = PacienteService()
        self.repo = PacienteRepository()
        self.init_ui()

    def init_ui(self):
        if not HAS_PYSIDE: return
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)

        top_bar = QHBoxLayout()
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Buscar paciente por nome, CPF ou telefone...")
        self.search_input.textChanged.connect(self.carregar_dados)
        top_bar.addWidget(self.search_input)

        self.btn_novo = QPushButton("+ Novo Paciente")
        self.btn_novo.setProperty("class", "btn-primary")
        top_bar.addWidget(self.btn_novo)
        layout.addLayout(top_bar)

        self.table = QTableWidget()
        self.table.setColumnCount(6)
        self.table.setHorizontalHeaderLabels(["ID", "Nome do Paciente", "CPF", "Telefone", "Convênio", "Nascimento"])
        self.table.horizontalHeader().setSectionResizeMode(1, QHeaderView.Stretch)
        layout.addWidget(self.table)
        self.carregar_dados()

    def carregar_dados(self):
        if not HAS_PYSIDE: return
        termo = self.search_input.text().strip()
        pacientes = self.repo.listar(apenas_ativos=True, termo_busca=termo)
        self.table.setRowCount(len(pacientes))
        for row, p in enumerate(pacientes):
            self.table.setItem(row, 0, QTableWidgetItem(str(p["id"])))
            self.table.setItem(row, 1, QTableWidgetItem(p["nome"]))
            self.table.setItem(row, 2, QTableWidgetItem(p["cpf"] or "Não informado"))
            self.table.setItem(row, 3, QTableWidgetItem(p["telefone"]))
            self.table.setItem(row, 4, QTableWidgetItem(p.get("convenio", "PARTICULAR")))
            self.table.setItem(row, 5, QTableWidgetItem(str(p.get("data_nascimento", ""))))

class AgendaView(QWidget):
    def __init__(self):
        super().__init__()
        self.service = AgendaService()
        self.repo = AgendamentoRepository()
        self.init_ui()

    def init_ui(self):
        if not HAS_PYSIDE: return
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)

        # Filtros de data e médico
        filter_bar = QHBoxLayout()
        self.date_picker = QDateEdit()
        self.date_picker.setDate(QDate.currentDate())
        self.date_picker.dateChanged.connect(self.carregar_dados)
        filter_bar.addWidget(QLabel("Data:"))
        filter_bar.addWidget(self.date_picker)

        self.btn_novo = QPushButton("+ Nova Consulta")
        self.btn_novo.setProperty("class", "btn-primary")
        filter_bar.addWidget(self.btn_novo)
        layout.addLayout(filter_bar)

        self.table = QTableWidget()
        self.table.setColumnCount(7)
        self.table.setHorizontalHeaderLabels(["Horário", "Paciente", "Médico", "Especialidade", "Motivo", "Status", "Ações"])
        self.table.horizontalHeader().setSectionResizeMode(1, QHeaderView.Stretch)
        layout.addWidget(self.table)
        self.carregar_dados()

    def carregar_dados(self):
        if not HAS_PYSIDE: return
        data_str = self.date_picker.date().toString("yyyy-MM-dd")
        agendamentos = self.repo.listar(data_inicio=data_str, data_fim=data_str)
        self.table.setRowCount(len(agendamentos))
        for row, a in enumerate(agendamentos):
            self.table.setItem(row, 0, QTableWidgetItem(a["horario"]))
            self.table.setItem(row, 1, QTableWidgetItem(a["nome_paciente"]))
            self.table.setItem(row, 2, QTableWidgetItem(a["nome_medico"]))
            self.table.setItem(row, 3, QTableWidgetItem(a.get("especialidade_medico", "")))
            self.table.setItem(row, 4, QTableWidgetItem(a["motivo"]))
            self.table.setItem(row, 5, QTableWidgetItem(a["status"]))
