from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from clinestudo_desktop.config.settings import settings
from clinestudo_desktop.auth.permissions import usuario_possui_permissao

class SessaoUsuario:
    """Representa a sessão ativa do usuário autenticado no sistema desktop."""
    def __init__(self, usuario_dict: Dict[str, Any]):
        self.id = usuario_dict.get("id")
        self.nome = usuario_dict.get("nome")
        self.login = usuario_dict.get("login")
        self.perfil = usuario_dict.get("perfil")
        self.logado_em = datetime.now()
        self.ultimo_acesso = datetime.now()

    def touch(self):
        self.ultimo_acesso = datetime.now()

    def esta_expirada(self) -> bool:
        limite = timedelta(minutes=settings.SESSION_TIMEOUT_MINUTES)
        return (datetime.now() - self.ultimo_acesso) > limite

    def pode(self, permissao: str) -> bool:
        if self.esta_expirada():
            return False
        return usuario_possui_permissao(self.perfil, permissao)

class GerenciadorSessao:
    _instance: Optional["GerenciadorSessao"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GerenciadorSessao, cls).__new__(cls)
            cls._instance._sessao_atual = None
        return cls._instance

    def iniciar_sessao(self, usuario_dict: Dict[str, Any]) -> SessaoUsuario:
        self._sessao_atual = SessaoUsuario(usuario_dict)
        return self._sessao_atual

    def obter_sessao(self) -> Optional[SessaoUsuario]:
        if self._sessao_atual and self._sessao_atual.esta_expirada():
            self.encerrar_sessao()
            return None
        return self._sessao_atual

    def encerrar_sessao(self):
        self._sessao_atual = None

    @property
    def usuario_atual(self) -> Optional[SessaoUsuario]:
        return self.obter_sessao()

gerenciador_sessao = GerenciadorSessao()
