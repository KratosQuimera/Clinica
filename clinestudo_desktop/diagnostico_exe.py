#!/usr/bin/env python3
"""
Utilitário de Diagnóstico do Ambiente ClinEstudo Desktop.
Executável ou script para identificar por que o executável não abre em um computador específico.
"""

import sys
import os
import platform
import sqlite3

def run_diagnostics():
    print("=" * 70)
    print("  CLINESTUDO DESKTOP - FERRAMENTA DE DIAGNÓSTICO DO SISTEMA")
    print("=" * 70)
    
    issues = []
    
    # 1. Informações Básicas
    print(f"\n[1] Sistema Operacional: {platform.system()} {platform.release()} ({platform.architecture()[0]})")
    print(f"    Python: {sys.version.split()[0]} ({platform.python_implementation()})")
    print(f"    Diretório de Execução: {os.getcwd()}")

    # 2. Teste do Banco de Dados SQLite Local
    print("\n[2] Testando suporte a SQLite...")
    try:
        conn = sqlite3.connect(":memory:")
        cur = conn.cursor()
        cur.execute("CREATE TABLE test (id INT);")
        cur.execute("INSERT INTO test VALUES (1);")
        cur.execute("SELECT * FROM test;")
        assert cur.fetchone()[0] == 1
        conn.close()
        print("    -> SQLite Local: [OK] Funcionando perfeitamente.")
    except Exception as e:
        issues.append(f"Falha no SQLite: {e}")
        print(f"    -> SQLite Local: [FALHA] {e}")

    # 3. Teste do PySide6 (Interface Gráfica)
    print("\n[3] Testando dependência PySide6 (Qt)...")
    try:
        import PySide6
        print(f"    -> PySide6 Versão: [OK] {PySide6.__version__}")
        
        from PySide6.QtWidgets import QApplication
        from PySide6.QtCore import QCoreApplication
        
        # Testa se a plataforma gráfica consegue ser inicializada
        print("    -> Testando subsistema Qt GUI...")
        app = QCoreApplication.instance()
        if not app:
            app = QCoreApplication(sys.argv)
        print("    -> Qt Core Engine: [OK] Inicializado.")
    except ImportError as e:
        issues.append(
            "PySide6 não está instalado no ambiente Python.\n"
            "   Solução: Execute 'pip install -r requirements.txt' ou 'pip install PySide6'."
        )
        print(f"    -> PySide6: [NÃO ENCONTRADO] {e}")
    except Exception as e:
        issues.append(f"Falha ao carregar PySide6: {e}")
        print(f"    -> PySide6: [ERRO NO SUBSISTEMA] {e}")

    # 4. Verificação de permissões de escrita de logs e banco
    print("\n[4] Testando permissão de escrita de arquivos no diretório...")
    test_file = "clinestudo_perm_test.tmp"
    try:
        with open(test_file, "w") as f:
            f.write("test")
        os.remove(test_file)
        print("    -> Permissão de Escrita: [OK] Acesso liberado.")
    except Exception as e:
        issues.append(
            f"Sem permissão de gravação no diretório atual: {e}\n"
            "   Solução: Extraia a pasta para C:\\ClinEstudo ou execute como Administrador."
        )
        print(f"    -> Permissão de Escrita: [BLOQUEADO] {e}")

    # 5. Resumo e Instruções
    print("\n" + "=" * 70)
    if not issues:
        print("  RESULTADO: AMBIENTE APROVADO! Todos os subsistemas estão funcionais.")
        print("  O sistema ClinEstudo está pronto para ser executado.")
        print("=" * 70)
    else:
        print("  PROBLEMAS DETECTADOS:")
        for idx, item in enumerate(issues, 1):
            print(f"  {idx}. {item}")
        print("=" * 70)
        print("\nPara resolver:")
        print("1. Instale o Microsoft Visual C++ 2015-2022 Redistributable (x64) no Windows.")
        print("2. Use o executável 'ClinEstudo_Debug.bat' para ver as mensagens no console.")

if __name__ == "__main__":
    run_diagnostics()
    if sys.platform == "win32":
        input("\nPressione ENTER para fechar...")
