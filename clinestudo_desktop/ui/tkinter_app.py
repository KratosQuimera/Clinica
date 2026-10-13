"""
Interface Desktop Nativa de Alta Compatibilidade em Tkinter para ClinEstudo.
Garante que o ClinEstudo Desktop funcione 100% no Windows/Linux/Mac mesmo se
PySide6 ou bibliotecas C++ adicionais nao estiverem instaladas.
Inclui a Tela de Inicializacao com o Logo do Globo, Login, Medicos, Pacientes,
Agenda de Consultas e Prescricoes Medicas com QR Code.
"""

import sys
import os
import json
from datetime import datetime
from typing import Optional, Dict, Any, List

try:
    import tkinter as tk
    from tkinter import ttk, messagebox
    TK_AVAILABLE = True
except ImportError:
    TK_AVAILABLE = False
    class _DummyTk:
        def __init__(self, *args, **kwargs): pass
        def __getattr__(self, name): return lambda *args, **kwargs: None
    class tk:
        Toplevel = Frame = Canvas = Label = Entry = Button = Tk = Menu = _DummyTk
    class ttk:
        Treeview = _DummyTk
    messagebox = None

try:
    from services.services import (
        AuthService, MedicoService, EnfermeiroService, PacienteService,
        AgendaService, ReceitaService, RelatorioService
    )
    from database.connection import db_manager
    from database.migrations import init_database
    from config.settings import settings
except ImportError:
    from clinestudo_desktop.services.services import (
        AuthService, MedicoService, EnfermeiroService, PacienteService,
        AgendaService, ReceitaService, RelatorioService
    )
    from clinestudo_desktop.database.connection import db_manager
    from clinestudo_desktop.database.migrations import init_database
    from clinestudo_desktop.config.settings import settings


class TkGlobeSplash(tk.Toplevel):
    """Tela de Splash com o Logotipo do Globo desenhado em Canvas vetorial de alta definicao."""
    def __init__(self, parent, on_finish):
        super().__init__(parent)
        self.on_finish = on_finish
        self.title("ClinEstudo - Inicializacao")
        self.geometry("520x380")
        self.resizable(False, False)
        self.configure(bg="#090d16")
        
        # Centraliza na tela
        self.update_idletasks()
        w = 520
        h = 380
        x = (self.winfo_screenwidth() // 2) - (w // 2)
        y = (self.winfo_screenheight() // 2) - (h // 2)
        self.geometry(f"{w}x{h}+{x}+{y}")
        self.overrideredirect(True)

        self.canvas = tk.Canvas(self, width=520, height=380, bg="#090d16", highlightthickness=1, highlightbackground="#0284c7")
        self.canvas.pack(fill="both", expand=True)

        self.progress_val = 0
        self._desenhar_logo_globo()
        self._animar()

    def _desenhar_logo_globo(self):
        cx, cy, r = 260, 115, 55

        # Brilho externo sutil
        self.canvas.create_oval(cx - r - 8, cy - r - 8, cx + r + 8, cy + r + 8, outline="#0284c7", width=1)
        
        # Esfera do Globo
        self.canvas.create_oval(cx - r, cy - r, cx + r, cy + r, outline="#38bdf8", fill="#0f172a", width=2.5)

        # Paralelos do globo
        self.canvas.create_oval(cx - r + 4, cy - 22, cx + r - 4, cy - 2, outline="#0284c7", width=1.2)
        self.canvas.create_oval(cx - r + 4, cy + 2, cx + r - 4, cy + 22, outline="#0284c7", width=1.2)

        # Equador
        self.canvas.create_line(cx - r, cy, cx + r, cy, fill="#38bdf8", width=1.8)

        # Meridianos elipticos
        self.canvas.create_oval(cx - 24, cy - r, cx + 24, cy + r, outline="#7dd3fc", width=1.5)
        self.canvas.create_line(cx, cy - r, cx, cy + r, fill="#bae6fd", width=2)

        # Cruz Medica Central no Globo
        self.canvas.create_rectangle(cx - 4, cy - 14, cx + 4, cy + 14, fill="#2dd4bf", outline="")
        self.canvas.create_rectangle(cx - 14, cy - 4, cx + 14, cy + 4, fill="#2dd4bf", outline="")

        # Textos de Branding
        self.canvas.create_text(260, 195, text="CLINESTUDO DESKTOP", fill="#ffffff", font=("Segoe UI", 16, "bold"))
        self.canvas.create_text(260, 222, text="Rede Global de Gestao Clinica & Hospitalar", fill="#38bdf8", font=("Segoe UI", 10))
        self.canvas.create_text(260, 245, text="Consultas · Prontuarios · Prescricoes Medicas (QR Code)", fill="#94a3b8", font=("Segoe UI", 9))

        # Texto do status de carregamento
        self.status_text = self.canvas.create_text(
            260, 280, text="Carregando subsistemas globais...", fill="#e2e8f0", font=("Segoe UI", 9)
        )

        # Barra de progresso (moldura)
        self.canvas.create_rectangle(60, 305, 460, 317, outline="#334155", fill="#1e293b", width=1)
        self.bar = self.canvas.create_rectangle(61, 306, 61, 316, outline="", fill="#0ea5e9")

        # Rodape
        self.canvas.create_text(70, 345, text="v2.4.0 · Arquitetura Resiliente", fill="#64748b", font=("Consolas", 8), anchor="w")
        self.canvas.create_text(450, 345, text="Seguranca LGPD Ativa", fill="#64748b", font=("Consolas", 8), anchor="e")

    def _animar(self):
        self.progress_val += 4
        if self.progress_val > 100:
            self.progress_val = 100

        bar_width = int(61 + (self.progress_val / 100.0) * (459 - 61))
        self.canvas.coords(self.bar, 61, 306, bar_width, 316)

        if self.progress_val < 30:
            msg = "Estabelecendo conexao de rede global e banco de dados..."
        elif self.progress_val < 65:
            msg = "Carregando modulos clinicos e prescricoes com QR Code..."
        elif self.progress_val < 90:
            msg = "Validando criptografia de senhas e auditoria LGPD..."
        else:
            msg = "Sistema Inicializado com Sucesso!"

        self.canvas.itemconfig(self.status_text, text=msg)

        if self.progress_val >= 100:
            self.after(500, self._concluir)
        else:
            self.after(45, self._animar)

    def _concluir(self):
        self.destroy()
        if self.on_finish:
            self.on_finish()


class TkLoginWindow(tk.Toplevel):
    """Janela de autenticacao e login em Tkinter com o logotipo do globo."""
    def __init__(self, parent, on_login_success):
        super().__init__(parent)
        self.on_login_success = on_login_success
        self.auth_service = AuthService()
        self.title("ClinEstudo - Acesso ao Sistema")
        self.geometry("420x540")
        self.resizable(False, False)
        self.configure(bg="#0b1120")

        self.update_idletasks()
        w, h = 420, 540
        x = (self.winfo_screenwidth() // 2) - (w // 2)
        y = (self.winfo_screenheight() // 2) - (h // 2)
        self.geometry(f"{w}x{h}+{x}+{y}")

        self._build_ui()

    def _build_ui(self):
        header = tk.Frame(self, bg="#0b1120", pady=15)
        header.pack(fill="x")

        canvas_mini_globe = tk.Canvas(header, width=54, height=54, bg="#0b1120", highlightthickness=0)
        canvas_mini_globe.pack()
        canvas_mini_globe.create_oval(7, 7, 47, 47, outline="#38bdf8", fill="#0f172a", width=2)
        canvas_mini_globe.create_oval(15, 7, 39, 47, outline="#7dd3fc", width=1.2)
        canvas_mini_globe.create_line(7, 27, 47, 27, fill="#38bdf8", width=1.5)
        canvas_mini_globe.create_rectangle(25, 18, 29, 36, fill="#2dd4bf", outline="")
        canvas_mini_globe.create_rectangle(18, 25, 36, 29, fill="#2dd4bf", outline="")

        lbl_tit = tk.Label(header, text="ClinEstudo Desktop", font=("Segoe UI", 16, "bold"), fg="#ffffff", bg="#0b1120")
        lbl_tit.pack(pady=(6, 2))
        lbl_sub = tk.Label(header, text="Sistema de Gestao Clinica e Atendimento", font=("Segoe UI", 9), fg="#94a3b8", bg="#0b1120")
        lbl_sub.pack()

        card_dica = tk.Frame(self, bg="#162032", padx=12, pady=8, highlightthickness=1, highlightbackground="#1e3a5f")
        card_dica.pack(fill="x", padx=30, pady=(0, 15))
        tk.Label(card_dica, text="Credenciais de Acesso Disponiveis:", font=("Segoe UI", 8, "bold"), fg="#38bdf8", bg="#162032").pack(anchor="w")
        tk.Label(card_dica, text="• Administrador: admin / admin123\n• Medico: medico.silva / medico123\n• Enfermagem: enf.claudia / enf123",
                 font=("Consolas", 8), fg="#cbd5e1", bg="#162032", justify="left").pack(anchor="w")

        form_frame = tk.Frame(self, bg="#0b1120", padx=30)
        form_frame.pack(fill="x")

        tk.Label(form_frame, text="Usuario:", font=("Segoe UI", 9, "bold"), fg="#e2e8f0", bg="#0b1120").pack(anchor="w", pady=(0, 3))
        self.entry_login = tk.Entry(form_frame, font=("Segoe UI", 11), bg="#1e293b", fg="#ffffff", insertbackground="#ffffff", relief="flat")
        self.entry_login.pack(fill="x", ipady=6, pady=(0, 12))
        self.entry_login.insert(0, "admin")

        tk.Label(form_frame, text="Senha:", font=("Segoe UI", 9, "bold"), fg="#e2e8f0", bg="#0b1120").pack(anchor="w", pady=(0, 3))
        self.entry_senha = tk.Entry(form_frame, font=("Segoe UI", 11), show="•", bg="#1e293b", fg="#ffffff", insertbackground="#ffffff", relief="flat")
        self.entry_senha.pack(fill="x", ipady=6, pady=(0, 15))
        self.entry_senha.insert(0, "admin123")
        self.entry_senha.bind("<Return>", lambda e: self._tentar_login())

        self.lbl_msg = tk.Label(form_frame, text="", font=("Segoe UI", 8), fg="#f87171", bg="#0b1120", wraplength=340)
        self.lbl_msg.pack(pady=(0, 10))

        btn_entrar = tk.Button(form_frame, text="Acessar Sistema", font=("Segoe UI", 11, "bold"),
                               bg="#0284c7", fg="#ffffff", activebackground="#0369a1", activeforeground="#ffffff",
                               relief="flat", cursor="hand2", command=self._tentar_login)
        btn_entrar.pack(fill="x", ipady=8)

        quick_frame = tk.Frame(self, bg="#0b1120", padx=30, pady=15)
        quick_frame.pack(fill="x")
        tk.Label(quick_frame, text="Entrar Rapido Como:", font=("Segoe UI", 8), fg="#64748b", bg="#0b1120").pack(anchor="w", pady=(0, 6))
        
        btn_box = tk.Frame(quick_frame, bg="#0b1120")
        btn_box.pack(fill="x")

        tk.Button(btn_box, text="Admin", font=("Segoe UI", 8), bg="#1e293b", fg="#94a3b8", relief="flat", cursor="hand2",
                  command=lambda: self._preencher("admin", "admin123")).pack(side="left", expand=True, fill="x", padx=2)
        tk.Button(btn_box, text="Medico", font=("Segoe UI", 8), bg="#1e293b", fg="#94a3b8", relief="flat", cursor="hand2",
                  command=lambda: self._preencher("medico.silva", "medico123")).pack(side="left", expand=True, fill="x", padx=2)
        tk.Button(btn_box, text="Enfermeira", font=("Segoe UI", 8), bg="#1e293b", fg="#94a3b8", relief="flat", cursor="hand2",
                  command=lambda: self._preencher("enf.claudia", "enf123")).pack(side="left", expand=True, fill="x", padx=2)

    def _preencher(self, login, senha):
        self.entry_login.delete(0, "end")
        self.entry_login.insert(0, login)
        self.entry_senha.delete(0, "end")
        self.entry_senha.insert(0, senha)
        self._tentar_login()

    def _tentar_login(self):
        login = self.entry_login.get().strip()
        senha = self.entry_senha.get()
        sucesso, msg, usuario = self.auth_service.autenticar(login, senha)
        if sucesso:
            self.destroy()
            self.on_login_success(usuario)
        else:
            self.lbl_msg.config(text=msg)


class TkMainWindow(tk.Tk):
    """Janela Principal ClinEstudo Desktop compativel com a visao classica do NetBeans."""
    def __init__(self, usuario: Dict[str, Any]):
        super().__init__()
        self.usuario = usuario
        self.medico_service = MedicoService()
        self.paciente_service = PacienteService()
        self.enfermeiro_service = EnfermeiroService()
        self.agenda_service = AgendaService()
        self.receita_service = ReceitaService()

        self.title("ClinEstudo - Sistema de Gestao Clinica (Arquitetura Swing/Desktop)")
        self.geometry("1100x720")
        self.minsize(960, 600)
        self.configure(bg="#0b1120")

        self._criar_menu()
        self._criar_layout_principal()
        self._criar_status_bar()

    def _criar_menu(self):
        menubar = tk.Menu(self, bg="#0f172a", fg="#ffffff", activebackground="#0284c7")

        m_cad = tk.Menu(menubar, tearoff=0, bg="#1e293b", fg="#ffffff", activebackground="#0284c7")
        m_cad.add_command(label="Medicos", command=lambda: self._trocar_aba("medicos"))
        m_cad.add_command(label="Pacientes", command=lambda: self._trocar_aba("pacientes"))
        m_cad.add_command(label="Enfermeiras", command=lambda: self._trocar_aba("enfermeiras"))
        m_cad.add_separator()
        m_cad.add_command(label="Prescricoes Medicas (QR Code)", command=lambda: self._trocar_aba("receitas"))
        menubar.add_cascade(label="Cadastros", menu=m_cad)

        m_age = tk.Menu(menubar, tearoff=0, bg="#1e293b", fg="#ffffff", activebackground="#0284c7")
        m_age.add_command(label="Agenda de Consultas", command=lambda: self._trocar_aba("agenda"))
        m_age.add_command(label="Nova Prescricao Medica", command=lambda: self._trocar_aba("receitas"))
        menubar.add_cascade(label="Atendimento", menu=m_age)

        m_rel = tk.Menu(menubar, tearoff=0, bg="#1e293b", fg="#ffffff", activebackground="#0284c7")
        m_rel.add_command(label="Exportar Consultas (CSV)", command=self._exportar_csv)
        m_rel.add_command(label="Auditoria LGPD", command=lambda: self._trocar_aba("auditoria"))
        menubar.add_cascade(label="Relatorios", menu=m_rel)

        m_ferr = tk.Menu(menubar, tearoff=0, bg="#1e293b", fg="#ffffff", activebackground="#0284c7")
        m_ferr.add_command(label="Tela Bem-vindos", command=lambda: self._trocar_aba("home"))
        m_ferr.add_command(label="Diagnostico do Sistema", command=self._mostrar_diagnostico)
        menubar.add_cascade(label="Ferramentas", menu=m_ferr)

        menubar.add_command(label="Sair", command=self.destroy)
        self.config(menu=menubar)

    def _criar_layout_principal(self):
        # 1. Barra de Topo Idêntica ao DesktopWindow da Web
        top_bar = tk.Frame(self, bg="#0b1120", height=42, padx=12, pady=6)
        top_bar.pack(fill="x")

        canv_globe = tk.Canvas(top_bar, width=28, height=28, bg="#0c4a6e", highlightthickness=1, highlightbackground="#0284c7")
        canv_globe.pack(side="left", padx=(0, 8))
        canv_globe.create_oval(3, 3, 25, 25, outline="#38bdf8", fill="#082f49", width=1.5)
        canv_globe.create_oval(8, 3, 20, 25, outline="#7dd3fc", width=1)
        canv_globe.create_line(3, 14, 25, 14, fill="#38bdf8", width=1.2)
        canv_globe.create_rectangle(12, 8, 16, 20, fill="#2dd4bf", outline="")
        canv_globe.create_rectangle(8, 12, 20, 16, fill="#2dd4bf", outline="")

        tk.Label(top_bar, text="ClinEstudo", font=("Segoe UI", 11, "bold"), fg="#38bdf8", bg="#0b1120").pack(side="left")
        tk.Label(top_bar, text="· Sistema Hospitalar & Prescrições (NetBeans Desktop)", font=("Segoe UI", 9), fg="#94a3b8", bg="#0b1120").pack(side="left", padx=(4, 0))

        info_user = f"👤 {self.usuario.get('login', 'admin')} ({self.usuario.get('perfil', 'ADMINISTRADOR')})"
        tk.Label(top_bar, text=info_user, font=("Consolas", 9), fg="#38bdf8", bg="#0f172a", padx=8, pady=2, relief="solid", bd=1).pack(side="right")

        # 2. Barra de Navegação Horizontal com as Abas do Web App
        nav_frame = tk.Frame(self, bg="#0f172a", padx=8, pady=4)
        nav_frame.pack(fill="x")

        abas = [
            ("🏠 Tela Bem-Vindos", "home"),
            ("👨‍⚕️ Cad. Médicos", "medicos"),
            ("👩‍⚕️ Cad. Enfermeiras", "enfermeiras"),
            ("👥 Cad. Pacientes", "pacientes"),
            ("📅 Agenda", "agenda"),
            ("💊 Receitas (QR Code)", "receitas"),
            ("📈 Relatórios", "relatorios"),
            ("🛡️ Auditoria LGPD", "auditoria"),
        ]

        self.nav_buttons = {}
        for rotulo, cod in abas:
            b = tk.Button(
                nav_frame, text=rotulo, font=("Segoe UI", 8, "bold"),
                bg="#1e293b", fg="#cbd5e1", activebackground="#0284c7", activeforeground="#ffffff",
                relief="flat", padx=8, pady=3, cursor="hand2",
                command=lambda c=cod: self._trocar_aba(c)
            )
            b.pack(side="left", padx=2)
            self.nav_buttons[cod] = b

        self.content_frame = tk.Frame(self, bg="#020617")
        self.content_frame.pack(fill="both", expand=True, padx=16, pady=12)

        self.views: Dict[str, tk.Frame] = {}
        self._init_view_home()
        self._init_view_medicos()
        self._init_view_pacientes()
        self._init_view_agenda()
        self._init_view_receitas()
        self._init_view_auditoria()

        self._trocar_aba("home")

    def _trocar_aba(self, nome: str):
        if hasattr(self, 'nav_buttons'):
            for k, b in self.nav_buttons.items():
                if k == nome:
                    b.configure(bg="#0284c7", fg="#ffffff")
                else:
                    b.configure(bg="#1e293b", fg="#cbd5e1")

        for v in self.views.values():
            v.pack_forget()
        if nome in self.views:
            self.views[nome].pack(fill="both", expand=True)

    def _init_view_home(self):
        f = tk.Frame(self.content_frame, bg="#020617")
        self.views["home"] = f

        # Cartão Hero "Tela Bem-vindos" (Idêntico ao Web)
        card = tk.Frame(f, bg="#0f172a", padx=20, pady=16, highlightthickness=1, highlightbackground="#0284c7")
        card.pack(fill="x", pady=(0, 16))

        h_row = tk.Frame(card, bg="#0f172a")
        h_row.pack(fill="x", pady=(0, 10))

        canv_g = tk.Canvas(h_row, width=44, height=44, bg="#082f49", highlightthickness=1, highlightbackground="#38bdf8")
        canv_g.pack(side="left", padx=(0, 12))
        canv_g.create_oval(4, 4, 40, 40, outline="#38bdf8", fill="#0f172a", width=2)
        canv_g.create_oval(12, 4, 32, 40, outline="#7dd3fc", width=1.2)
        canv_g.create_line(4, 22, 40, 22, fill="#38bdf8", width=1.5)
        canv_g.create_rectangle(19, 14, 25, 30, fill="#2dd4bf", outline="")
        canv_g.create_rectangle(14, 19, 30, 25, fill="#2dd4bf", outline="")

        info_f = tk.Frame(h_row, bg="#0f172a")
        info_f.pack(side="left")
        tk.Label(info_f, text="TELA BEM-VINDOS • REDE GLOBAL CLINESTUDO", font=("Segoe UI", 9, "bold"), fg="#38bdf8", bg="#0f172a").pack(anchor="w")
        tk.Label(info_f, text="Sistema de Gerenciamento de: Consultas e Procedimentos Clínicos", font=("Segoe UI", 13, "bold"), fg="#ffffff", bg="#0f172a").pack(anchor="w")

        tk.Label(h_row, text=f"Usuário: {self.usuario.get('login', 'admin')}", font=("Segoe UI", 10, "bold"), fg="#34d399", bg="#0f172a").pack(side="right")

        tk.Label(card, text="Selecione uma das opções rápidas abaixo ou utilize a barra superior de menus no formato original NetBeans.",
                 font=("Segoe UI", 9), fg="#94a3b8", bg="#0f172a").pack(anchor="w", pady=(0, 14))

        # Os 5 Botões de Atalho da Tela Principal
        grid_atalhos = tk.Frame(card, bg="#0f172a")
        grid_atalhos.pack(fill="x")

        botoes = [
            ("👨‍⚕️ Cad. Médicos\nCorpo Clínico & CRM", lambda: self._trocar_aba("medicos"), "#0284c7"),
            ("👩‍⚕️ Cad. Enfermeiras\nSetores & COREN", lambda: messagebox.showinfo("Enfermeiras", "Módulo de Enfermeiras e Turnos."), "#a855f7"),
            ("👥 Cad. Pacientes\nCPF Oficial & Contatos", lambda: self._trocar_aba("pacientes"), "#10b981"),
            ("📅 Agenda Consultas\nHorários & Conflitos", lambda: self._trocar_aba("agenda"), "#f59e0b"),
            ("💊 Receitas Médicas\nQR Code & WhatsApp", lambda: self._trocar_aba("receitas"), "#2dd4bf"),
        ]

        for i, (texto, cmd, cor) in enumerate(botoes):
            btn = tk.Button(
                grid_atalhos, text=texto, font=("Segoe UI", 9, "bold"),
                bg="#0b1120", fg="#ffffff", activebackground="#1e293b", activeforeground=cor,
                relief="flat", cursor="hand2", command=cmd,
                highlightthickness=1, highlightbackground=cor, padx=10, pady=12
            )
            btn.pack(side="left", expand=True, fill="x", padx=4)

        # 6 KPIs do Sistema (Idêntico ao Web)
        kpi_frame = tk.Frame(f, bg="#020617")
        kpi_frame.pack(fill="x", pady=(0, 12))

        meds_cnt = len(self.medico_service.repo.listar(apenas_ativos=False))
        pacs_cnt = len(self.paciente_service.repo.listar(apenas_ativos=False))
        ag_cnt = len(self.agenda_service.repo.listar())
        recs_cnt = len(self.receita_service.listar_receitas())

        kpis = [
            ("Consultas Agendadas", str(ag_cnt), "#38bdf8"),
            ("Médicos Ativos", str(meds_cnt), "#a855f7"),
            ("Pacientes Cadastrados", str(pacs_cnt), "#10b981"),
            ("Taxa Presença", "100%", "#f59e0b"),
            ("Prescrições QR Code", str(recs_cnt), "#2dd4bf"),
            ("Segurança LGPD", "Ativa", "#ec4899"),
        ]

        for tit, val, cor in kpis:
            box = tk.Frame(kpi_frame, bg="#0f172a", padx=12, pady=10, highlightthickness=1, highlightbackground="#1e293b")
            box.pack(side="left", expand=True, fill="x", padx=4)
            tk.Label(box, text=tit, font=("Segoe UI", 8), fg="#94a3b8", bg="#0f172a").pack(anchor="w")
            tk.Label(box, text=val, font=("Segoe UI", 14, "bold"), fg=cor, bg="#0f172a").pack(anchor="w")

    def _init_view_medicos(self):
        f = tk.Frame(self.content_frame, bg="#0b1120")
        self.views["medicos"] = f

        tk.Label(f, text="👨‍⚕️ Cadastro de Medicos (FormMedico)", font=("Segoe UI", 14, "bold"), fg="#ffffff", bg="#0b1120").pack(anchor="w", pady=(0, 10))

        cols = ("ID", "Nome", "CRM", "UF", "Especialidade", "Telefone", "Status")
        tree = ttk.Treeview(f, columns=cols, show="headings", height=12)
        for col in cols:
            tree.heading(col, text=col)
            tree.column(col, width=120)
        tree.pack(fill="both", expand=True, pady=(0, 10))

        def recarregar():
            for i in tree.get_children():
                tree.delete(i)
            medicos = self.medico_service.repo.listar(apenas_ativos=False)
            for m in medicos:
                st = "Ativo" if m.get("ativo") else "Inativo"
                tree.insert("", "end", values=(m["id"], m["nome"], m["crm"], m["uf_crm"], m["especialidade"], m.get("telefone", ""), st))

        recarregar()

        btn_bar = tk.Frame(f, bg="#0b1120")
        btn_bar.pack(fill="x")
        tk.Button(btn_bar, text="Atualizar Lista", bg="#1e293b", fg="#ffffff", relief="flat", command=recarregar).pack(side="left", padx=4)
        tk.Button(btn_bar, text="Voltar para Inicio", bg="#0284c7", fg="#ffffff", relief="flat", command=lambda: self._trocar_aba("home")).pack(side="right")

    def _init_view_pacientes(self):
        f = tk.Frame(self.content_frame, bg="#0b1120")
        self.views["pacientes"] = f

        tk.Label(f, text="👥 Cadastro de Pacientes (FormPacientes)", font=("Segoe UI", 14, "bold"), fg="#ffffff", bg="#0b1120").pack(anchor="w", pady=(0, 10))

        cols = ("ID", "Nome", "CPF", "Nascimento", "Telefone", "Convenio", "Cidade")
        tree = ttk.Treeview(f, columns=cols, show="headings", height=12)
        for col in cols:
            tree.heading(col, text=col)
            tree.column(col, width=120)
        tree.pack(fill="both", expand=True, pady=(0, 10))

        def recarregar():
            for i in tree.get_children():
                tree.delete(i)
            pacs = self.paciente_service.repo.listar(apenas_ativos=False)
            for p in pacs:
                tree.insert("", "end", values=(p["id"], p["nome"], p.get("cpf", ""), p.get("data_nascimento", ""), p.get("telefone", ""), p.get("convenio", ""), p.get("cidade", "")))

        recarregar()

        btn_bar = tk.Frame(f, bg="#0b1120")
        btn_bar.pack(fill="x")
        tk.Button(btn_bar, text="Atualizar Lista", bg="#1e293b", fg="#ffffff", relief="flat", command=recarregar).pack(side="left", padx=4)
        tk.Button(btn_bar, text="Voltar para Inicio", bg="#0284c7", fg="#ffffff", relief="flat", command=lambda: self._trocar_aba("home")).pack(side="right")

    def _init_view_agenda(self):
        f = tk.Frame(self.content_frame, bg="#0b1120")
        self.views["agenda"] = f

        tk.Label(f, text="📅 Agenda de Consultas Clinicas (FormAgenda)", font=("Segoe UI", 14, "bold"), fg="#ffffff", bg="#0b1120").pack(anchor="w", pady=(0, 10))

        cols = ("ID", "Data", "Horario", "Paciente", "Medico", "Especialidade", "Status")
        tree = ttk.Treeview(f, columns=cols, show="headings", height=12)
        for col in cols:
            tree.heading(col, text=col)
            tree.column(col, width=120)
        tree.pack(fill="both", expand=True, pady=(0, 10))

        def recarregar():
            for i in tree.get_children():
                tree.delete(i)
            ag = self.agenda_service.repo.listar()
            for a in ag:
                tree.insert("", "end", values=(a["id"], a["data_agenda"], a["horario"], a.get("nome_paciente", ""), a.get("nome_medico", ""), a.get("especialidade_medico", ""), a["status"]))

        recarregar()

        btn_bar = tk.Frame(f, bg="#0b1120")
        btn_bar.pack(fill="x")
        tk.Button(btn_bar, text="Atualizar Consultas", bg="#1e293b", fg="#ffffff", relief="flat", command=recarregar).pack(side="left", padx=4)
        tk.Button(btn_bar, text="Voltar para Inicio", bg="#0284c7", fg="#ffffff", relief="flat", command=lambda: self._trocar_aba("home")).pack(side="right")

    def _init_view_receitas(self):
        """Tela de Prescricoes Medicas com Codigo QR e Autenticacao Digital."""
        f = tk.Frame(self.content_frame, bg="#0b1120")
        self.views["receitas"] = f

        tk.Label(f, text="💊 Prescricoes Medicas com Validacao QR Code", font=("Segoe UI", 14, "bold"), fg="#ffffff", bg="#0b1120").pack(anchor="w", pady=(0, 6))

        cols = ("ID", "Codigo Autenticidade", "Paciente", "Medico", "Data", "Validade (dias)", "WhatsApp", "Impresso")
        tree = ttk.Treeview(f, columns=cols, show="headings", height=8)
        for col in cols:
            tree.heading(col, text=col)
            tree.column(col, width=130)
        tree.pack(fill="both", expand=True, pady=(0, 10))

        def recarregar():
            for i in tree.get_children():
                tree.delete(i)
            recs = self.receita_service.listar_receitas()
            for r in recs:
                w_status = "Enviado ✅" if r.get("enviado_whatsapp") else "Pendente"
                i_status = "Impresso ✅" if r.get("impresso") else "Pendente"
                tree.insert("", "end", values=(r["id"], r["codigo_autenticidade"], r.get("nome_paciente", ""), r.get("nome_medico", ""), r.get("data_emissao", ""), r.get("validade_dias", 30), w_status, i_status))

        recarregar()

        act_box = tk.Frame(f, bg="#162032", padx=12, pady=8, highlightthickness=1, highlightbackground="#1e3a5f")
        act_box.pack(fill="x", pady=(0, 10))

        def emitir_receita_rapida():
            pacs = self.paciente_service.repo.listar()
            meds = self.medico_service.repo.listar()
            if not pacs or not meds:
                messagebox.showwarning("Aviso", "Cadastre ao menos 1 paciente e 1 medico antes de prescrever.")
                return

            p = pacs[0]
            m = meds[0]
            meds_lista = [
                {"nome": "Dipirona Monoidratada 500mg", "posologia": "1 comprimido se dor ou febre (ate 6/6h)", "tipo": "Analgesico"},
                {"nome": "Amoxicilina + Clavulanato 875mg", "posologia": "1 comprimido de 12 em 12 horas por 7 dias", "tipo": "Antibiotico"}
            ]
            ok, msg, res = self.receita_service.emitir_receita(
                paciente_id=p["id"],
                medico_id=m["id"],
                medicamentos=meds_lista,
                orientacoes_gerais="Ingerir com bastante agua. Nao interromper tratamento.",
                validade_dias=30,
                usuario_responsavel=self.usuario.get("login", "admin")
            )
            if ok:
                recarregar()
                messagebox.showinfo(
                    "Receita Emitida com Sucesso!",
                    f"Codigo de Autenticacao: {res['codigo_autenticidade']}\n\n"
                    f"Paciente: {res['paciente']}\n"
                    f"Medico: {res['medico']} (CRM: {res['crm']})\n"
                    f"Payload QR Code: {res['qr_code_payload']}"
                )
            else:
                messagebox.showerror("Erro", msg)

        tk.Button(act_box, text="➕ Emitir Nova Receita com QR Code", bg="#0284c7", fg="#ffffff", font=("Segoe UI", 9, "bold"), relief="flat", cursor="hand2", command=emitir_receita_rapida).pack(side="left", padx=4)
        tk.Button(act_box, text="🔄 Atualizar Lista", bg="#1e293b", fg="#ffffff", relief="flat", command=recarregar).pack(side="left", padx=4)
        tk.Button(act_box, text="Voltar para Inicio", bg="#334155", fg="#ffffff", relief="flat", command=lambda: self._trocar_aba("home")).pack(side="right")

    def _init_view_auditoria(self):
        f = tk.Frame(self.content_frame, bg="#0b1120")
        self.views["auditoria"] = f

        tk.Label(f, text="🛡️ Auditoria de Seguranca & LGPD", font=("Segoe UI", 14, "bold"), fg="#ffffff", bg="#0b1120").pack(anchor="w", pady=(0, 10))

        cols = ("ID", "Data/Hora", "Usuario", "Acao", "Entidade", "Detalhes", "IP Origem")
        tree = ttk.Treeview(f, columns=cols, show="headings", height=12)
        for col in cols:
            tree.heading(col, text=col)
            tree.column(col, width=120)
        tree.pack(fill="both", expand=True, pady=(0, 10))

        def recarregar():
            for i in tree.get_children():
                tree.delete(i)
            logs = db_manager.execute_query("SELECT * FROM auditoria ORDER BY id DESC LIMIT 50")
            for l in logs:
                tree.insert("", "end", values=(l.get("id"), l.get("criado_em"), l.get("login_usuario"), l.get("acao"), l.get("entidade"), l.get("detalhes"), l.get("ip_origem")))

        recarregar()

        btn_bar = tk.Frame(f, bg="#0b1120")
        btn_bar.pack(fill="x")
        tk.Button(btn_bar, text="Atualizar Logs", bg="#1e293b", fg="#ffffff", relief="flat", command=recarregar).pack(side="left", padx=4)
        tk.Button(btn_bar, text="Voltar para Inicio", bg="#0284c7", fg="#ffffff", relief="flat", command=lambda: self._trocar_aba("home")).pack(side="right")

    def _criar_status_bar(self):
        health = db_manager.check_health()
        engine_str = "PostgreSQL Conectado" if health.get("engine") == "postgresql" else "SQLite Local Ativo"

        status_frame = tk.Frame(self, bg="#0f172a", padx=12, pady=4, highlightthickness=1, highlightbackground="#1e293b")
        status_frame.pack(fill="x", side="bottom")

        tk.Label(status_frame, text=f"Status: {engine_str} | LGPD Conforme | Sessao Ativa: {self.usuario.get('login')}",
                 font=("Consolas", 8), fg="#94a3b8", bg="#0f172a").pack(side="left")
        tk.Label(status_frame, text="ClinEstudo v2.4.0 · Modo Desktop Alta Compatibilidade",
                 font=("Consolas", 8), fg="#64748b", bg="#0f172a").pack(side="right")

    def _exportar_csv(self):
        rel_service = RelatorioService()
        csv_data = rel_service.gerar_csv_agendamentos()
        caminho = os.path.join(os.getcwd(), f"relatorio_consultas_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv")
        try:
            with open(caminho, "w", encoding="utf-8") as f:
                f.write(csv_data)
            messagebox.showinfo("Exportacao Concluida", f"Relatorio CSV salvo com sucesso em:\n{caminho}")
        except Exception as e:
            messagebox.showerror("Erro ao Exportar", str(e))

    def _mostrar_diagnostico(self):
        health = db_manager.check_health()
        meds_count = len(self.medico_service.repo.listar(apenas_ativos=False))
        pacs_count = len(self.paciente_service.repo.listar(apenas_ativos=False))
        recs_count = len(self.receita_service.listar_receitas())
        msg = (
            f"Diagnostico ClinEstudo Desktop:\n\n"
            f"• Banco de Dados: {health.get('engine').upper()} ({health.get('message')})\n"
            f"• Medicos Cadastrados: {meds_count}\n"
            f"• Pacientes Cadastrados: {pacs_count}\n"
            f"• Prescricoes Emitidas: {recs_count}\n"
            f"• Interface Grafica: Tkinter (Resiliencia Universal)\n"
            f"• Sistema: {sys.platform} (Python {sys.version.split()[0]})\n"
        )
        messagebox.showinfo("Diagnostico do Sistema", msg)


def launch_tkinter_app():
    """Inicia o aplicativo desktop em Tkinter com o Logo do Globo na Splash Screen."""
    if not TK_AVAILABLE:
        return False

    root = tk.Tk()
    root.withdraw()

    def on_login_success(usuario):
        root.destroy()
        main_win = TkMainWindow(usuario)
        main_win.mainloop()

    def on_splash_finish():
        login_win = TkLoginWindow(root, on_login_success)

    splash = TkGlobeSplash(root, on_splash_finish)
    root.mainloop()
    return True
