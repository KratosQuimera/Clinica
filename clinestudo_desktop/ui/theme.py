"""
Tema Visual QSS Moderno para PySide6 / Qt.
Inspirado em interfaces clínicas de alta precisão (Dark/Slate Profissional com detalhes em Esmeralda).
"""

MODERN_QSS = """
QMainWindow, QDialog {
    background-color: #0f172a;
    color: #f8fafc;
    font-family: "Segoe UI", "Plus Jakarta Sans", sans-serif;
    font-size: 13px;
}

QWidget {
    color: #f8fafc;
    font-size: 13px;
}

/* Barra Superior e Cabeçalhos */
#headerWidget {
    background-color: #1e293b;
    border-bottom: 1px solid #334155;
    padding: 8px 16px;
}

/* Menu Lateral / Sidebar */
#sidebarWidget {
    background-color: #111827;
    border-right: 1px solid #1f2937;
    min-width: 230px;
    max-width: 250px;
}

QPushButton.nav-button {
    background-color: transparent;
    color: #94a3b8;
    text-align: left;
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    margin: 2px 8px;
}

QPushButton.nav-button:hover {
    background-color: #1e293b;
    color: #f8fafc;
}

QPushButton.nav-button:checked, QPushButton.nav-button.active {
    background-color: #0f766e;
    color: #ffffff;
    font-weight: 600;
}

/* Botões Primários e Secundários */
QPushButton.btn-primary {
    background-color: #0d9488;
    color: #ffffff;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 600;
}

QPushButton.btn-primary:hover {
    background-color: #0f766e;
}

QPushButton.btn-secondary {
    background-color: #334155;
    color: #f8fafc;
    border: 1px solid #475569;
    padding: 8px 16px;
    border-radius: 6px;
}

QPushButton.btn-secondary:hover {
    background-color: #475569;
}

QPushButton.btn-danger {
    background-color: #dc2626;
    color: #ffffff;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 600;
}

QPushButton.btn-danger:hover {
    background-color: #b91c1c;
}

/* Caixas de Texto e Edição */
QLineEdit, QComboBox, QDateEdit, QTimeEdit, QTextEdit {
    background-color: #1e293b;
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 8px 10px;
    color: #f8fafc;
    selection-background-color: #0d9488;
}

QLineEdit:focus, QComboBox:focus, QTextEdit:focus {
    border: 1px solid #14b8a6;
    background-color: #1e293b;
}

/* Tabelas */
QTableWidget, QTableView {
    background-color: #1e293b;
    gridline-color: #334155;
    border: 1px solid #334155;
    border-radius: 6px;
    color: #f8fafc;
    selection-background-color: #0f766e;
    selection-color: #ffffff;
}

QHeaderView::section {
    background-color: #0f172a;
    color: #94a3b8;
    font-weight: 600;
    padding: 8px;
    border: none;
    border-bottom: 2px solid #334155;
}

/* Barra de Status */
QStatusBar {
    background-color: #0b0f19;
    color: #64748b;
    border-top: 1px solid #1e293b;
}
"""
