import os
from dataclasses import dataclass

# Tenta carregar python-dotenv se disponível; caso contrário, carrega manualmente com stdlib
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # Leitor básico de .env nativo em python puro sem dependências extras
    env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    if os.path.exists(env_file):
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip("'\"")
                    if k not in os.environ:
                        os.environ[k] = v

@dataclass(frozen=True)
class Settings:
    APP_NAME: str = "ClinEstudo Desktop"
    APP_VERSION: str = "2.4.0"
    
    # Banco de Dados PostgreSQL
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "5432"))
    DB_NAME: str = os.getenv("DB_NAME", "clinestudo")
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_SSLMODE: str = os.getenv("DB_SSLMODE", "prefer")
    
    # Segurança e Autenticação
    MAX_LOGIN_ATTEMPTS: int = int(os.getenv("MAX_LOGIN_ATTEMPTS", "3"))
    LOCKOUT_DURATION_MINUTES: int = int(os.getenv("LOCKOUT_DURATION_MINUTES", "15"))
    SESSION_TIMEOUT_MINUTES: int = int(os.getenv("SESSION_TIMEOUT_MINUTES", "60"))
    SECRET_KEY: str = os.getenv("SECRET_KEY", "clinestudo-secret-key-change-in-production")
    
    # Modo de Execução (se postgres indisponível, pode usar sqlite local para testes/contingência)
    ALLOW_SQLITE_FALLBACK: bool = os.getenv("ALLOW_SQLITE_FALLBACK", "true").lower() in ("true", "1", "yes")
    SQLITE_PATH: str = os.getenv("SQLITE_PATH", "clinestudo_local.db")

settings = Settings()
