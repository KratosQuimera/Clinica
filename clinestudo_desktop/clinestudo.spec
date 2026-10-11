# -*- mode: python ; coding: utf-8 -*-
"""
Especificação PyInstaller para ClinEstudo Desktop.
Coleta automaticamente todas as dependências, plugins de plataforma Qt (qwindows.dll)
e recursos estáticos necessários para execução autônoma no Windows 10/11.
"""
import os
import sys

block_cipher = None

# Diretório base absoluto
spec_dir = os.path.abspath(os.path.dirname('main.py') or '.')

# Coleta abrangente de plugins e binários do PySide6 (previne ausência de qwindows.dll)
try:
    from PyInstaller.utils.hooks import collect_all
    pyside_datas, pyside_binaries, pyside_hidden = collect_all('PySide6')
except Exception:
    pyside_datas, pyside_binaries, pyside_hidden = [], [], []

extra_datas = [
    ('database/schema.sql', 'database'),
    ('database/v1_legacy_migration.sql', 'database'),
] + pyside_datas

extra_hidden = [
    'ctypes',
    'ctypes.wintypes',
    'sqlite3',
    'dotenv',
    'hashlib',
    'hmac',
    'secrets',
    'PySide6',
    'PySide6.QtCore',
    'PySide6.QtGui',
    'PySide6.QtWidgets',
    'config',
    'config.settings',
    'database',
    'database.connection',
    'database.migrations',
    'modelo_beans',
    'modelo_beans.beans',
    'modelo_connection',
    'modelo_connection.conexao_bd',
    'modelo_dao',
    'modelo_dao.daos',
    'visao',
    'visao.forms',
    'services',
    'services.services',
    'services.validators',
    'auth',
    'auth.hasher',
    'auth.permissions',
    'auth.session',
    'ui',
    'ui.theme',
    'ui.splash_screen',
    'ui.login_window',
    'ui.main_window',
    'ui.views',
    'models',
    'models.entities',
    'repositories',
    'repositories.repositories',
] + pyside_hidden

a = Analysis(
    ['main.py'],
    pathex=[spec_dir, os.path.dirname(spec_dir)],
    binaries=pyside_binaries,
    datas=extra_datas,
    hiddenimports=extra_hidden,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['pytest', 'unittest'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

# 1. Executável Padrão (Sem Console / Gráfico)
exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='ClinEstudo',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,  # Sem console; erros capturados via ctypes MessageBox
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

# 2. Executável de Depuração (Com Console Ativo para diagnóstico)
exe_debug = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='ClinEstudo_Debug',
    debug=True,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,  # Mantém janela de console aberta para exibir mensagens
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    exe_debug,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='ClinEstudo',
)
