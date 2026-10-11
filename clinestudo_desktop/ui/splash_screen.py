"""
Tela de Inicialização (Splash Screen) com Logo do Globo para ClinEstudo Desktop.
Exibe o logotipo do globo estilizado e o status de carregamento de subsistemas.
"""

import sys
from typing import Optional

try:
    from PySide6.QtWidgets import QSplashScreen, QWidget, QLabel, QVBoxLayout, QProgressBar
    from PySide6.QtCore import Qt, QTimer, QRectF, QPointF
    from PySide6.QtGui import QPixmap, QPainter, QColor, QBrush, QPen, QFont, QLinearGradient
    PYSIDE_AVAILABLE = True
except ImportError:
    PYSIDE_AVAILABLE = False


class GlobeSplashScreen:
    """
    Controlador da Splash Screen com o logotipo do globo.
    Garante renderização gráfica suave antes de abrir a tela principal.
    """
    def __init__(self, app=None):
        self.app = app
        self.splash: Optional[QSplashScreen] = None
        if PYSIDE_AVAILABLE:
            self._create_splash()

    def _create_splash(self):
        # Cria um QPixmap de 520x360 com fundo escuro e logo do globo desenhado em alta resolução
        pixmap = QPixmap(520, 360)
        pixmap.fill(QColor("#090d16"))  # Slate ultra-dark

        painter = QPainter(pixmap)
        painter.setRenderHint(QPainter.Antialiasing, True)

        # 1. Gradiente sutil de fundo
        bg_gradient = QLinearGradient(0, 0, 520, 360)
        bg_gradient.setColorAt(0.0, QColor("#0f172a"))
        bg_gradient.setColorAt(0.5, QColor("#090d16"))
        bg_gradient.setColorAt(1.0, QColor("#042f2e"))
        painter.fillRect(0, 0, 520, 360, QBrush(bg_gradient))

        # 2. Borda externa com brilho ciano
        pen_border = QPen(QColor("#0ea5e9"), 1.5)
        painter.setPen(pen_border)
        painter.drawRoundedRect(1, 1, 518, 358, 8, 8)

        # 3. DESENHO DO LOGO DO GLOBO (Esfera, Paralelos, Meridianos e Cruz Médica)
        center_x = 260
        center_y = 115
        radius = 55

        # Brilho externo do globo
        glow_gradient = QLinearGradient(center_x - radius, center_y - radius, center_x + radius, center_y + radius)
        glow_gradient.setColorAt(0.0, QColor("#0369a1"))
        glow_gradient.setColorAt(1.0, QColor("#0f766e"))
        painter.setBrush(QBrush(glow_gradient))
        painter.setPen(QPen(QColor("#38bdf8"), 2.5))
        painter.drawEllipse(QPointF(center_x, center_y), radius, radius)

        # Paralelos do globo
        painter.setBrush(Qt.NoBrush)
        painter.setPen(QPen(QColor("#7dd3fc"), 1.2, Qt.DashLine))
        painter.drawEllipse(QPointF(center_x, center_y - 20), radius - 6, 16)
        painter.drawEllipse(QPointF(center_x, center_y + 20), radius - 6, 16)
        
        # Equador
        painter.setPen(QPen(QColor("#38bdf8"), 1.6))
        painter.drawLine(center_x - radius, center_y, center_x + radius, center_y)

        # Meridianos elípticos
        painter.setPen(QPen(QColor("#bae6fd"), 1.5))
        painter.drawEllipse(QPointF(center_x, center_y), 24, radius)
        painter.drawLine(center_x, center_y - radius, center_x, center_y + radius)

        # Cruz Médica sobre o globo
        painter.setBrush(QBrush(QColor("#2dd4bf")))
        painter.setPen(Qt.NoPen)
        # Haste vertical
        painter.drawRect(center_x - 4, center_y - 14, 8, 28)
        # Haste horizontal
        painter.drawRect(center_x - 14, center_y - 4, 28, 8)

        # 4. Textos de Identidade Visual
        # Título
        font_title = QFont("Segoe UI", 18, QFont.Bold)
        painter.setFont(font_title)
        painter.setPen(QPen(QColor("#ffffff")))
        painter.drawText(QRectF(0, 190, 520, 30), Qt.AlignCenter, "CLINESTUDO DESKTOP")

        # Subtítulo
        font_sub = QFont("Segoe UI", 10)
        painter.setFont(font_sub)
        painter.setPen(QPen(QColor("#38bdf8")))
        painter.drawText(QRectF(0, 225, 520, 22), Qt.AlignCenter, "Rede Global de Gestão Clínica & Hospitalar")

        font_desc = QFont("Segoe UI", 9)
        painter.setFont(font_desc)
        painter.setPen(QPen(QColor("#94a3b8")))
        painter.drawText(QRectF(0, 248, 520, 20), Qt.AlignCenter, "Consultas · Prontuários · Receitas Médicas (QR Code)")

        # Rodapé com versão
        font_ver = QFont("Consolas", 8)
        painter.setFont(font_ver)
        painter.setPen(QPen(QColor("#64748b")))
        painter.drawText(QRectF(20, 332, 480, 18), Qt.AlignLeft, "v2.4.0 · Arquitetura NetBeans Swing / PySide6")
        painter.drawText(QRectF(20, 332, 480, 18), Qt.AlignRight, "Conexão Segura LGPD")

        painter.end()

        self.splash = QSplashScreen(pixmap, Qt.WindowStaysOnTopHint | Qt.FramelessWindowHint)

    def show(self):
        if self.splash:
            self.splash.show()
            if self.app:
                self.app.processEvents()

    def show_message(self, message: str):
        if self.splash:
            self.splash.showMessage(
                f"  {message}",
                Qt.AlignBottom | Qt.AlignLeft,
                QColor("#38bdf8")
            )
            if self.app:
                self.app.processEvents()

    def finish(self, window):
        if self.splash:
            self.splash.finish(window)
