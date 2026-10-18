"""Local stdio MCP bridge; only a read token is available to this process."""
import os
from datetime import datetime
from urllib.parse import urlparse
import httpx
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("health-bridge")
TYPES = ["oxygen_saturation", "heart_rate", "hrv_sdnn", "sleep_analysis", "respiratory_rate"]

@mcp.tool(annotations={"readOnlyHint": True, "destructiveHint": False})
def health_samples(metric_type: str, start: str, end: str, limit: int = 100, offset: int = 0) -> dict:
    """Query individual HealthKit samples with source, dates and metadata.
    SpO2 records are discrete measurements, never a continuous monitor.
    Oxygen saturation uses unit fraction (0.975 = 97.5%); respect the returned unit.
    HRV is SDNN. Missing samples do not imply normal oxygenation.
    start/end must be timezone-aware ISO8601. Follow page.has_more with offset.
    """
    if metric_type not in TYPES or not 1 <= limit <= 500 or offset < 0:
        raise ValueError("Unsupported metric or pagination")
    a, b = [datetime.fromisoformat(x.replace("Z", "+00:00")) for x in (start, end)]
    if a.tzinfo is None or b.tzinfo is None or a >= b:
        raise ValueError("An ordered timezone-aware date range is required")
    base = os.environ["HEALTH_API_URL"].rstrip("/")
    u = urlparse(base)
    if u.username or u.password or u.query or u.fragment or not u.hostname:
        raise ValueError("Invalid API URL")
    if u.scheme != "https" and not (u.scheme == "http" and u.hostname in ("localhost", "127.0.0.1", "::1")):
        raise ValueError("HTTPS required outside localhost")
    token = os.environ["HEALTH_READ_TOKEN"]
    if not token:
        raise ValueError("Read token required")
    # Redirects disabled: never forward credentials to another destination.
    with httpx.Client(timeout=20, follow_redirects=False, trust_env=False) as client:
        response = client.get(base + "/api/agent/metrics",
            headers={"Authorization": "Bearer " + token},
            params={"type": metric_type, "from": start, "to": end, "limit": limit, "offset": offset})
        if response.status_code != 200:
            raise ValueError(f"Health API returned status {response.status_code}")
        data = response.json()
    return {"sampling": "discrete HealthKit samples; no interpolation", "data": data}

if __name__ == "__main__":
    mcp.run(transport="stdio")
