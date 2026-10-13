# -*- mode: python ; coding: utf-8 -*-
"""
Especificação PyInstaller ONEFILE (Arquivo Único Autônomo) para ClinEstudo Desktop.
Embala tudo (Python interpreter, DLLs, PySide6, plugins e assets) dentro de um ÚNICO arquivo .EXE.
Pode ser movido para a Área de Trabalho (Desktop) ou qualquer pasta sem necessitar de arquivos externos.
"""
import os
import sys

if 'SPECPATH' in globals():
    spec_dir = os.path.abspath(SPECPATH)
elif '__file__' in globals():
    spec_dir = os.path.abspath(os.path.dirname(__file__))
else:
    spec_dir = os.path.abspath(os.path.dirname('main.py') or '.')

def safe_data(src_rel, dst_rel):
    p1 = os.path.join(spec_dir, src_rel)
    if os.path.exists(p1):
        return (p1, dst_rel)
    p2 = os.path.join(os.getcwd(), src_rel)
    if os.path.exists(p2):
        return (p2, dst_rel)
    return None

pyside_datas, pyside_binaries, pyside_hidden = [], [], []
has_pyside = False
try:
    import PySide6
    has_pyside = True
    from PyInstaller.utils.hooks import collect_all
    pyside_datas, pyside_binaries, pyside_hidden = collect_all('PySide6')
except Exception:
    pyside_datas, pyside_binaries, pyside_hidden = [], [], []
    has_pyside = False

extra_datas = []
for src, dst in [
    ('database/schema.sql', 'database'),
    ('database/v1_legacy_migration.sql', 'database'),
    ('web_dist', 'web_dist'),
    ('.env.example', '.'),
]:
    d = safe_data(src, dst)
    if d:
        extra_datas.append(d)

extra_datas.extend(pyside_datas)

extra_hidden = [
    'ctypes',
    'ctypes.wintypes',
    'sqlite3',
    'dotenv',
    'hashlib',
    'hmac',
    'secrets',
    'mimetypes',
    'http.server',
    'threading',
    'socket',
    'subprocess',
    'webbrowser',
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
    'ui.desktop_webapp',
    'ui.tkinter_app',
    'tkinter',
    'tkinter.ttk',
    'tkinter.messagebox',
    'models',
    'models.entities',
    'repositories',
    'repositories.repositories',
] + pyside_hidden

main_script = os.path.join(spec_dir, 'main.py')
if not os.path.exists(main_script):
    main_script = 'main.py'

a = Analysis(
    [main_script],
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
    cipher=None,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=None)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='ClinEstudo_Standalone',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
