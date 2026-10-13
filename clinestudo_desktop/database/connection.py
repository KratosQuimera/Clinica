import os
import sqlite3
import logging
from typing import Any, List, Tuple, Optional, Dict
try:
    from config.settings import settings
except ImportError:
    from clinestudo_desktop.config.settings import settings

logger = logging.getLogger("clinestudo.database")

class DatabaseManager:
    """
    Gerenciador central de conexões do ClinEstudo.
    Suporta PostgreSQL (psycopg 3 / psycopg2) para produção e SQLite
    para contingência, desenvolvimento e suíte de testes automatizados.
    """
    _instance: Optional["DatabaseManager"] = None
    _sqlite_shared_conn: Optional[sqlite3.Connection] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseManager, cls).__new__(cls)
            cls._instance._init_manager()
        return cls._instance

    def _init_manager(self):
        self._pg_module = None
        self._detect_driver()

    def _detect_driver(self):
        try:
            import psycopg
            self._pg_module = psycopg
            logger.info("Driver psycopg 3 detectado.")
        except ImportError:
            try:
                import psycopg2
                self._pg_module = psycopg2
                logger.info("Driver psycopg2 detectado.")
            except ImportError:
                self._pg_module = None
                logger.info("Nenhum driver PostgreSQL instalado. Modo SQLite ativo.")

    def check_health(self) -> Dict[str, Any]:
        """Verifica a conectividade com o banco de dados principal ou SQLite."""
        if self.is_sqlite_mode():
            try:
                conn = self.get_sqlite_connection()
                conn.execute("SELECT 1;").fetchone()
                return {
                    "ok": True,
                    "engine": "sqlite",
                    "message": "Banco de dados SQLite operacional com sucesso."
                }
            except Exception as e:
                return {
                    "ok": False,
                    "engine": "sqlite_error",
                    "message": f"Falha no motor SQLite: {e}"
                }

        try:
            conn = self.get_raw_pg_connection()
            with conn.cursor() as cur:
                cur.execute("SELECT 1;")
                cur.fetchone()
            conn.close()
            return {"ok": True, "engine": "postgresql", "message": "Conectado ao PostgreSQL com sucesso."}
        except Exception as e:
            if settings.ALLOW_SQLITE_FALLBACK:
                return {
                    "ok": True,
                    "engine": "sqlite",
                    "message": f"PostgreSQL indisponível ({type(e).__name__}). Modo de contingência SQLite ativo."
                }
            return {
                "ok": False,
                "engine": "error",
                "message": f"Servidor PostgreSQL em {settings.DB_HOST}:{settings.DB_PORT} indisponível ({type(e).__name__})."
            }

    def get_raw_pg_connection(self):
        if not self._pg_module:
            raise ConnectionError("Driver PostgreSQL não encontrado.")
        conn_str = f"host={settings.DB_HOST} port={settings.DB_PORT} dbname={settings.DB_NAME} user={settings.DB_USER} password={settings.DB_PASSWORD} connect_timeout=3"
        return self._pg_module.connect(conn_str)

    def get_sqlite_connection(self) -> sqlite3.Connection:
        db_path = settings.SQLITE_PATH
        if db_path == ":memory:":
            if self._sqlite_shared_conn is None:
                self._sqlite_shared_conn = sqlite3.connect(":memory:")
                self._sqlite_shared_conn.row_factory = sqlite3.Row
                self._sqlite_shared_conn.execute("PRAGMA foreign_keys = ON;")
            return self._sqlite_shared_conn
        
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    def is_sqlite_mode(self) -> bool:
        if not self._pg_module or settings.ALLOW_SQLITE_FALLBACK:
            try:
                if self._pg_module:
                    test_conn = self.get_raw_pg_connection()
                    test_conn.close()
                    return False
            except Exception:
                pass
            return True
        return False

    def execute_query(self, sql: str, params: Tuple = ()) -> List[Dict[str, Any]]:
        """Executa SELECT com parâmetros protegidos contra SQL Injection."""
        if self.is_sqlite_mode():
            sqlite_sql = sql.replace("%s", "?")
            conn = self.get_sqlite_connection()
            cursor = conn.cursor()
            cursor.execute(sqlite_sql, params)
            rows = cursor.fetchall()
            result = [dict(row) for row in rows]
            if settings.SQLITE_PATH != ":memory:":
                conn.close()
            return result
        else:
            with self.get_raw_pg_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(sql, params)
                    colnames = [desc[0] for desc in cur.description] if cur.description else []
                    rows = cur.fetchall()
                    return [dict(zip(colnames, row)) for row in rows]

    def execute_mutation(self, sql: str, params: Tuple = ()) -> int:
        """Executa INSERT, UPDATE, DELETE e retorna o id gerado ou afetado."""
        if self.is_sqlite_mode():
            sqlite_sql = sql.replace("%s", "?")
            conn = self.get_sqlite_connection()
            cursor = conn.cursor()
            cursor.execute(sqlite_sql, params)
            conn.commit()
            last_id = cursor.lastrowid or cursor.rowcount
            if settings.SQLITE_PATH != ":memory:":
                conn.close()
            return last_id
        else:
            with self.get_raw_pg_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(sql, params)
                    conn.commit()
                    return cur.rowcount

db_manager = DatabaseManager()
