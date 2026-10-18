"""Generate local secrets and initialize a persistent SQLite demo. Never overwrites."""
import os
from pathlib import Path
import secrets
from backend.database import create_engine_for_url
from backend.models import Base

root = Path(__file__).resolve().parents[1]
config = root / '.env.local'
data = root / 'data'
data.mkdir(mode=0o700, exist_ok=True)
url = 'sqlite+pysqlite:///' + str(data / 'health.sqlite')
if config.exists():
    raise SystemExit('.env.local exists; retained without changes')
text = f'DATABASE_URL={url}\n' + '\n'.join(k+'='+secrets.token_urlsafe(32) for k in ['API_TOKEN','READ_TOKEN','TOKEN_HASH_SECRET','POSTGRES_PASSWORD']) + '\nHOSTED_PROVISIONING_ENABLED=false\n'
fd = os.open(config, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, 'w') as f:
    f.write(text)
Base.metadata.create_all(create_engine_for_url(url))
os.chmod(data / 'health.sqlite', 0o600)
print('Local configuration and SQLite database initialized. Secrets were not printed.')
