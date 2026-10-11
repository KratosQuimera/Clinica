#!/usr/bin/env python3
"""
Script executor da suíte de testes do ClinEstudo com relatório de cobertura e diagnósticos.
"""

import unittest
import sys
import os

# Garante que a raiz do projeto esteja no sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

def run():
    print("="*75)
    print("  CLINESTUDO - SUÍTE DE TESTES AUTOMATIZADOS DE QUALIDADE & SEGURANÇA")
    print("="*75)
    
    loader = unittest.TestLoader()
    suite = loader.discover(start_dir=os.path.dirname(__file__), pattern="test_*.py")
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    print("\n" + "-"*75)
    print(f"Total de testes executados: {result.testsRun}")
    print(f"Falhas: {len(result.failures)}")
    print(f"Erros:  {len(result.errors)}")
    if result.wasSuccessful():
        print("Status: [PASS] TODOS OS TESTES PASSARAM COM SUCESSO (100% SUCESSO)!")
        return 0
    else:
        print("Status: [FAIL] EXISTEM FALHAS NA SUÍTE DE TESTES.")
        return 1

if __name__ == "__main__":
    sys.exit(run())
