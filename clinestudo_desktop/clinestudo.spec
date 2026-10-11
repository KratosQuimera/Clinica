# -*- mode: python ; coding: utf-8 -*-
import os
import sys

block_cipher = None

# Diretório base
spec_dir = os.path.abspath(os.path.dirname('main.py') or '.')

a = Analysis(
    ['main.py'],
    pathex=[spec_dir, os.path.dirname(spec_dir)],
    binaries=[],
    datas=[
        ('database/schema.sql', 'database'),
        ('database/v1_legacy_migration.sql', 'database'),
    ],
    hiddenimports=[
        # Drivers e dependências
        'psycopg',
        'psycopg.pq',
        'psycopg_binary',
        'sqlite3',
        'dotenv',
        'hashlib',
        'hmac',
        'secrets',
        # Qt PySide6
        'PySide6',
        'PySide6.QtCore',
        'PySide6.QtGui',
        'PySide6.QtWidgets',
        # Módulos internos ClinEstudo
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
        'ui.login_window',
        'ui.main_window',
        'ui.views',
        'models',
        'models.entities',
        'repositories',
        'repositories.repositories',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['pytest', 'unittest', 'tkinter'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

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
    console=False,  # Sem janela de console (aplicação 100% desktop gráfica)
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='ClinEstudo',
)
