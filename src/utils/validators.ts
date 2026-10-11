/**
 * Validação matemática oficial do Cadastro de Pessoas Físicas (CPF).
 * Calcula os dois dígitos verificadores via módulo 11 conforme norma da Receita Federal.
 */
export function validarCPF(cpf: string): boolean {
  if (!cpf) return false;
  const limpo = cpf.replace(/\D/g, '');

  if (limpo.length !== 11) return false;

  // Rejeita sequências repetidas (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(limpo)) return false;

  // Primeiro dígito verificador
  let soma1 = 0;
  for (let i = 0; i < 9; i++) {
    soma1 += parseInt(limpo.charAt(i), 10) * (10 - i);
  }
  let resto1 = (soma1 * 10) % 11;
  let digito1 = resto1 === 10 ? 0 : resto1;
  if (digito1 !== parseInt(limpo.charAt(9), 10)) return false;

  // Segundo dígito verificador
  let soma2 = 0;
  for (let i = 0; i < 10; i++) {
    soma2 += parseInt(limpo.charAt(i), 10) * (11 - i);
  }
  let resto2 = (soma2 * 10) % 11;
  let digito2 = resto2 === 10 ? 0 : resto2;
  if (digito2 !== parseInt(limpo.charAt(10), 10)) return false;

  return true;
}

export function formatarCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

export function formatarTelefone(tel: string): string {
  const digits = tel.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function validarCRM(crm: string): { valido: boolean; mensagem: string } {
  const limpo = crm.replace(/\D/g, '');
  if (!limpo || limpo.length < 4 || limpo.length > 10) {
    return { valido: false, mensagem: 'CRM deve conter entre 4 e 10 dígitos numéricos.' };
  }
  return { valido: true, mensagem: '' };
}

export function validarCOREN(coren: string): { valido: boolean; mensagem: string } {
  const limpo = coren.replace(/\D/g, '');
  if (!limpo || limpo.length < 4 || limpo.length > 12) {
    return { valido: false, mensagem: 'COREN deve conter entre 4 e 12 dígitos.' };
  }
  return { valido: true, mensagem: '' };
}
