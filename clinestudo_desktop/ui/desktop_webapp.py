"""
Launcher de Interface Desktop com o Layout Idêntico ao da Web (SPA React).
Inicia um servidor local integrado e abre a aplicação em janela nativa dedicada (App Mode / WebView2),
garantindo que o layout visual no executável desktop (.exe) seja 100% IDÊNTICO ao exibido na tela web.
"""

import sys
import os
import time
import socket
import threading
import subprocess
import webbrowser
import mimetypes
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

# Garante tipos MIME corretos no Windows (evita bloqueio de script pelo navegador)
mimetypes.init()
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("application/javascript", ".mjs")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("text/html", ".html")
mimetypes.add_type("application/json", ".json")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("image/png", ".png")
mimetypes.add_type("image/x-icon", ".ico")

def get_base_dir() -> str:
    if getattr(sys, 'frozen', False):
        return getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(sys.executable)))
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def find_web_dist_dir() -> str:
    base = get_base_dir()
    candidates = [
        os.path.join(base, "web_dist"),
        os.path.join(base, "dist"),
        os.path.join(os.path.dirname(base), "dist"),
        os.path.join(os.path.dirname(base), "web_dist"),
        os.path.join(os.getcwd(), "web_dist"),
        os.path.join(os.getcwd(), "dist"),
    ]
    for c in candidates:
        if os.path.exists(os.path.join(c, "index.html")):
            return c
    return ""

def get_free_port() -> int:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('127.0.0.1', 0))
    port = s.getsockname()[1]
    s.close()
    return port

class SPASimpleHTTPRequestHandler(SimpleHTTPRequestHandler):
    """Handler com suporte a Single Page Application (SPA fallback para index.html)."""
    extensions_map = {
        '': 'application/octet-stream',
        '.css': 'text/css',
        '.html': 'text/html',
        '.htm': 'text/html',
        '.js': 'application/javascript',
        '.mjs': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
    }

    def __init__(self, *args, directory=None, **kwargs):
        self.spa_dir = directory
        super().__init__(*args, directory=directory, **kwargs)

    def do_GET(self):
        req_path = self.path.split('?')[0].split('#')[0]
        local_path = os.path.join(self.spa_dir, req_path.lstrip('/'))

        if os.path.exists(local_path) and not os.path.isdir(local_path):
            return super().do_GET()

        # SPA Fallback para index.html
        self.path = "/index.html"
        return super().do_GET()

    def end_headers(self):
        # Desativa cache agressivo para desenvolvimento desktop
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        pass

def start_local_server(web_dir: str, port: int) -> ThreadingHTTPServer:
    handler = lambda *args, **kwargs: SPASimpleHTTPRequestHandler(*args, directory=web_dir, **kwargs)
    server = ThreadingHTTPServer(('127.0.0.1', port), handler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    return server

def find_system_app_browser() -> list:
    """Busca executáveis Edge, Chrome ou Chromium para abrir em App Mode."""
    if sys.platform == "win32":
        program_files_x86 = os.environ.get("ProgramFiles(x86)", "C:\\Program Files (x86)")
        program_files = os.environ.get("ProgramFiles", "C:\\Program Files")
        local_app_data = os.environ.get("LOCALAPPDATA", "")

        candidates = [
            os.path.join(program_files_x86, "Microsoft", "Edge", "Application", "msedge.exe"),
            os.path.join(program_files, "Microsoft", "Edge", "Application", "msedge.exe"),
            os.path.join(local_app_data, "Microsoft", "Edge", "Application", "msedge.exe"),
            os.path.join(program_files, "Google", "Chrome", "Application", "chrome.exe"),
            os.path.join(program_files_x86, "Google", "Chrome", "Application", "chrome.exe"),
            os.path.join(local_app_data, "Google", "Chrome", "Application", "chrome.exe"),
            os.path.join(program_files, "BraveSoftware", "Brave-Browser", "Application", "brave.exe"),
        ]
        return [p for p in candidates if os.path.exists(p)]

    if sys.platform == "darwin":
        candidates = [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
            "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
        ]
        return [c for c in candidates if os.path.exists(c)]

    if sys.platform.startswith("linux"):
        if not os.environ.get("DISPLAY") and not os.environ.get("WAYLAND_DISPLAY"):
            return []
        import shutil
        for b in ["google-chrome", "chromium", "chromium-browser", "microsoft-edge", "brave-browser"]:
            p = shutil.which(b)
            if p:
                return [p]
        return []

    return []

def launch_web_layout_app(title: str = "ClinEstudo - Sistema de Gestão Hospitalar") -> bool:
    """
    Inicia a aplicação desktop com o layout 100% IDÊNTICO ao exibido na Web.
    Retorna True se conseguir abrir a janela gráfica.
    """
    web_dir = find_web_dist_dir()
    if not web_dir:
        return False

    port = get_free_port()
    server = start_local_server(web_dir, port)
    app_url = f"http://127.0.0.1:{port}"

    # 1. Tenta pywebview
    try:
        import webview
        window = webview.create_window(
            title,
            app_url,
            width=1280,
            height=820,
            min_size=(980, 640),
            background_color='#020617'
        )
        webview.start()
        return True
    except Exception:
        pass

    # 2. Tenta PySide6 QtWebEngineView
    try:
        from PySide6.QtWidgets import QApplication
        from PySide6.QtWebEngineWidgets import QWebEngineView
        from PySide6.QtCore import QUrl
        
        qt_app = QApplication.instance() or QApplication(sys.argv)
        qt_app.setApplicationName("ClinEstudo")
        
        view = QWebEngineView()
        view.setWindowTitle(title)
        view.resize(1280, 820)
        view.load(QUrl(app_url))
        view.show()
        qt_app.exec()
        return True
    except Exception:
        pass

    # 3. No Windows: Executa no Microsoft Edge em App Mode (--app=...)
    browser_bins = find_system_app_browser()
    if browser_bins:
        browser_exe = browser_bins[0]
        user_data_dir = os.path.join(os.environ.get("TEMP", "."), f"ClinEstudo_Profile_{port}")
        cmd = [
            browser_exe,
            f"--app={app_url}",
            "--window-size=1280,820",
            f"--user-data-dir={user_data_dir}",
            "--disable-extensions",
            "--disable-plugins",
            f"--app-id=clinestudo_desktop_{port}"
        ]
        try:
            proc = subprocess.Popen(cmd)
            # Aguarda a janela ser fechada pelo usuário
            proc.wait()
            return True
        except Exception:
            pass

    # 4. Fallback padrão: abre no navegador padrão do sistema
    # Verifica se há interface gráfica disponível
    if sys.platform.startswith("linux") and not (os.environ.get("DISPLAY") or os.environ.get("WAYLAND_DISPLAY")):
        return False

    try:
        webbrowser.open(app_url)
        print("=" * 72)
        print(f"  [CLINESTUDO DESKTOP] Aplicação Web Ativa em: {app_url}")
        print("  Pressione CTRL+C no terminal para encerrar o sistema.")
        print("=" * 72)
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            server.shutdown()
        return True
    except Exception:
        pass

    return False
