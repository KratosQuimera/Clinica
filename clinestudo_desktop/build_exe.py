#!/usr/bin/env python3
"""
Script automatizado de compilação do executável ClinEstudo (.exe) para Windows.
Pode ser executado com:
    python build_exe.py
    python build_exe.py --onefile
"""

import os
import sys
import shutil
import subprocess

def print_header(title):
    print("=" * 70)
    print(f"  {title}")
    print("=" * 70)

def kill_running_instances():
    """Fecha processos ClinEstudo em execução para não travar o arquivo .exe no Windows."""
    if sys.platform == "win32":
        for proc in ["ClinEstudo.exe", "ClinEstudo_Standalone.exe"]:
            try:
                subprocess.run(["taskkill", "/F", "/IM", proc], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            except Exception:
                pass

def main():
    print_header("COMPILADOR AUTOMÁTICO DO CLINESTUDO DESKTOP (.EXE)")

    # 1. Garante que o diretório de trabalho é a pasta do projeto
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    sys.path.insert(0, script_dir)

    print(f"• Diretório do projeto: {script_dir}")
    print(f"• Versão do Python:     {sys.version.split()[0]}")

    # Fecha instâncias abertas que poderiam bloquear a sobrescrita do arquivo .exe
    kill_running_instances()

    # 2. Verifica / instala PyInstaller via pip
    try:
        import PyInstaller
        print(f"• PyInstaller instalado: versão {PyInstaller.__version__}")
    except ImportError:
        print("• PyInstaller não encontrado. Instalando automaticamente via pip...")
        try:
            subprocess.check_call([
                sys.executable, "-m", "pip", "install", 
                "pyinstaller>=6.5.0", "python-dotenv", "--prefer-binary"
            ])
            import PyInstaller
            print("• PyInstaller instalado com sucesso!")
        except Exception as e:
            print(f"[ERRO CRÍTICO] Falha ao instalar PyInstaller via pip: {e}")
            print("Por favor, execute manualmente no prompt de comando: pip install pyinstaller python-dotenv")
            if sys.platform == "win32":
                input("Pressione ENTER para sair...")
            sys.exit(1)

    # 3. Detecta disponibilidade do PySide6
    has_pyside = False
    try:
        import PySide6
        has_pyside = True
        print(f"• Motor Qt (PySide6):    Disponível (versão {PySide6.__version__})")
    except ImportError:
        print("• Motor Qt (PySide6):    Não instalado (ativando modo leve com Web App integrado & Tkinter).")

    # 4. Determina o arquivo de especificação (.spec)
    is_onefile = "--onefile" in sys.argv or "--standalone" in sys.argv
    spec_file = "clinestudo_onefile.spec" if is_onefile else "clinestudo.spec"
    spec_path = os.path.join(script_dir, spec_file)

    if not os.path.exists(spec_path):
        print(f"[ERRO] Arquivo de especificação '{spec_file}' não encontrado em {script_dir}")
        if sys.platform == "win32":
            input("Pressione ENTER para sair...")
        sys.exit(1)

    print(f"• Modo de compilação:   {'Arquivo Único (Standalone)' if is_onefile else 'Pacote Completo (Diretório)'}")
    print(f"• Arquivo .spec:        {spec_file}")

    # 5. Limpeza prévia de pastas build e dist anteriores com tratamento de bloqueio
    print("• Limpando diretórios temporários de builds antigos...")
    for d in ["build", "dist"]:
        dp = os.path.join(script_dir, d)
        if os.path.exists(dp):
            try:
                shutil.rmtree(dp)
            except Exception as e:
                print(f"  [Aviso] Não foi possível remover {d} ({e}). Tentando continuar...")

    # 6. Executa a compilação chamando PyInstaller em subprocesso dedicado
    print("\nIniciando compilação do executável (aguarde alguns instantes)...")
    cmd = [sys.executable, "-m", "PyInstaller", spec_path, "--clean", "--noconfirm"]
    proc = subprocess.run(cmd)

    if proc.returncode != 0:
        print(f"\n[AVISO] Tentativa com {spec_file} retornou código {proc.returncode}.")
        print("Tentando compilação alternativa direta de main.py...")
        fallback_cmd = [
            sys.executable, "-m", "PyInstaller",
            "main.py",
            "--name", "ClinEstudo" if not is_onefile else "ClinEstudo_Standalone",
            "--windowed",
            "--clean",
            "--noconfirm",
            "--hidden-import", "sqlite3",
            "--hidden-import", "dotenv",
            "--hidden-import", "http.server",
            "--hidden-import", "mimetypes",
            "--hidden-import", "json",
            "--add-data", f"{os.path.join(script_dir, 'web_dist')}{os.pathsep}web_dist",
            "--add-data", f"{os.path.join(script_dir, 'database', 'schema.sql')}{os.pathsep}database",
        ]
        if is_onefile:
            fallback_cmd.append("--onefile")
        if has_pyside:
            fallback_cmd.extend(["--collect-all", "PySide6"])

        proc2 = subprocess.run(fallback_cmd)
        if proc2.returncode != 0:
            print(f"\n[ERRO CRÍTICO NA COMPILAÇÃO] Falha ao compilar executável.")
            print("Execute 'python diagnostico_exe.py' para identificar conflitos do ambiente Windows.")
            if sys.platform == "win32":
                input("Pressione ENTER para fechar...")
            sys.exit(1)

    # 7. Pós-processamento e verificação do executável gerado
    print("\nVerificando resultado da compilação...")
    if is_onefile:
        exe_path = os.path.join(script_dir, "dist", "ClinEstudo_Standalone.exe")
        if not os.path.exists(exe_path):
            exe_path = os.path.join(script_dir, "dist", "ClinEstudo.exe")

        if os.path.exists(exe_path) or os.path.exists(os.path.join(script_dir, "dist", "ClinEstudo_Standalone")):
            print_header("SUCESSO ABSOLUTO! EXECUTÁVEL CRIADO COM ÊXITO")
            print(f"• Arquivo gerado: {exe_path}")
            print("\nVocê pode mover 'ClinEstudo_Standalone.exe' para qualquer pasta ou Área de Trabalho!")
        else:
            print(f"[AVISO] Executável não localizado em dist/. Verifique o log acima.")
    else:
        dist_dir = os.path.join(script_dir, "dist", "ClinEstudo")
        exe_main = os.path.join(dist_dir, "ClinEstudo.exe")
        if os.path.exists(dist_dir) and (os.path.exists(exe_main) or os.path.exists(os.path.join(dist_dir, "ClinEstudo"))):
            # Copia arquivos auxiliares
            for extra in [".env.example", "README.md", "executar_com_log.bat", "diagnostico_exe.py"]:
                src = os.path.join(script_dir, extra)
                dst = os.path.join(dist_dir, extra)
                if os.path.exists(src) and not os.path.exists(dst):
                    try:
                        shutil.copy(src, dst)
                    except Exception:
                        pass

            web_dist_src = os.path.join(script_dir, "web_dist")
            web_dist_dst = os.path.join(dist_dir, "web_dist")
            if os.path.exists(web_dist_src) and not os.path.exists(web_dist_dst):
                try:
                    shutil.copytree(web_dist_src, web_dist_dst)
                except Exception:
                    pass

            print_header("SUCESSO ABSOLUTO! PACOTE EXECUTÁVEL GERADO COM ÊXITO")
            print(f"• Diretório final: {dist_dir}")
            print(f"• Executável:      {exe_main}")
            print("\nPara iniciar o aplicativo no Windows, basta dar dois cliques em 'ClinEstudo.exe'!")
        else:
            print("[AVISO] O processo terminou, mas a pasta dist/ClinEstudo não foi encontrada.")

    print("\n" + "=" * 70)

if __name__ == "__main__":
    main()
