import re
from typing import Tuple

def validar_cpf(cpf: str) -> bool:
    """
    Validação matemática oficial do Cadastro de Pessoas Físicas (CPF).
    Calcula os dois dígitos verificadores via módulo 11.
    """
    if not cpf:
        return False
    
    # Remove caracteres não numéricos
    numeros = re.sub(r"\D", "", cpf)
    
    # Deve conter exatamente 11 dígitos
    if len(numeros) != 11:
        return False
    
    # Rejeita CPFs com todos os dígitos repetidos (ex: 111.111.111-11)
    if numeros == numeros[0] * 11:
        return False
    
    # 1º Dígito verificador
    soma_1 = sum(int(numeros[i]) * (10 - i) for i in range(9))
    resto_1 = (soma_1 * 10) % 11
    digito_1 = 0 if resto_1 == 10 else resto_1
    if digito_1 != int(numeros[9]):
        return False
    
    # 2º Dígito verificador
    soma_2 = sum(int(numeros[i]) * (11 - i) for i in range(10))
    resto_2 = (soma_2 * 10) % 11
    digito_2 = 0 if resto_2 == 10 else resto_2
    if digito_2 != int(numeros[10]):
        return False
        
    return True

def formatar_cpf(cpf: str) -> str:
    """Formata CPF para o padrão 000.000.000-00."""
    numeros = re.sub(r"\D", "", cpf or "")
    if len(numeros) == 11:
        return f"{numeros[:3]}.{numeros[3:6]}.{numeros[6:9]}-{numeros[9:]}"
    return cpf

def validar_crm(crm: str) -> Tuple[bool, str]:
    """Valida formato do CRM (números entre 4 e 10 dígitos)."""
    if not crm or not crm.strip():
        return False, "CRM é obrigatório."
    limpo = re.sub(r"\D", "", crm)
    if len(limpo) < 4 or len(limpo) > 10:
        return False, "CRM deve conter entre 4 e 10 dígitos numéricos."
    return True, ""

def validar_coren(coren: str) -> Tuple[bool, str]:
    """Valida formato do COREN."""
    if not coren or not coren.strip():
        return False, "COREN é obrigatório."
    limpo = re.sub(r"\D", "", coren)
    if len(limpo) < 4 or len(limpo) > 12:
        return False, "COREN deve conter entre 4 e 12 dígitos."
    return True, ""

def validar_email(email: str) -> bool:
    """Valida formato de e-mail."""
    if not email:
        return True # Campo opcional
    padrao = r"^[\w\.-]+@[\w\.-]+\.\w{2,}$"
    return bool(re.match(padrao, email.strip()))
