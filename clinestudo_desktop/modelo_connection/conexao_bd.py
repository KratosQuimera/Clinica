import logging
from typing import Optional, List, Dict, Any, Tuple
try:
    from database.connection import db_manager
except ImportError:
    from clinestudo_desktop.database.connection import db_manager

logger = logging.getLogger("clinestudo.conexaoBD")

class ConexaoBD:
    """
    Equivalente e aprimoramento da classe conexaoBD.java do projeto original.
    Conecta ao PostgreSQL de forma parametrizada com suporte a fallback de contingência.
    """
    def __init__(self):
        self.conexao_aberta = False
        self.rs: List[Dict[str, Any]] = []

    def conexao(self) -> bool:
        """Abre conexão com o banco de dados."""
        try:
            health = db_manager.check_health()
            self.conexao_aberta = True
            logger.info(f"Conexão aberta com sucesso: {health['message']}")
            return True
        except Exception as e:
            logger.error(f"Erro ao conectar: {e}")
            self.conexao_aberta = False
            return False

    def desconecta(self):
        """Fecha a conexão com o banco de dados."""
        self.conexao_aberta = False
        logger.info("Conexão com banco de dados finalizada.")

    def executaSql(self, sql: str, params: Tuple = ()) -> List[Dict[str, Any]]:
        """Executa consultas SELECT de forma parametrizada e armazena no rs."""
        self.rs = db_manager.execute_query(sql, params)
        return self.rs

    def executaUpdate(self, sql: str, params: Tuple = ()) -> int:
        """Executa INSERT, UPDATE, DELETE e retorna linhas afetadas."""
        return db_manager.execute_mutation(sql, params)

conexao_bd = ConexaoBD()
