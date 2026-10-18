"""Official MCP stdio handshake and authenticated query against deployed HTTPS API."""
import asyncio,json,os,sys
from pathlib import Path
from datetime import datetime,timedelta,timezone
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
root=Path(__file__).resolve().parents[1]

async def main():
    values=dict(x.split('=',1) for x in (root/'private/server-client.env').read_text().splitlines())
    today=datetime.now(timezone.utc).replace(hour=0,minute=0,second=0,microsecond=0)
    params=StdioServerParameters(command=sys.executable,args=['-m','bridge.mcp_server'],cwd=str(root),env={**os.environ,'HEALTH_API_URL':'https://health.gz.zgdnz.cc','HEALTH_READ_TOKEN':values['READ_TOKEN']})
    async with stdio_client(params) as (reader,writer):
        async with ClientSession(reader,writer) as session:
            await session.initialize()
            assert 'health_samples' in [x.name for x in (await session.list_tools()).tools]
            result=await session.call_tool('health_samples',{'metric_type':'oxygen_saturation','start':today.isoformat(),'end':(today+timedelta(days=1)).isoformat()})
            assert not result.isError,result
            data=json.loads(''.join(x.text for x in result.content if hasattr(x,'text')))
            assert any(x['source_name']=='SYNTHETIC TEST DEVICE' and x['value']==.975 and x['unit']=='fraction' for x in data['data']['items'])
    print('PASS: official MCP initialize/list_tools/call_tool -> deployed trusted HTTPS API -> PostgreSQL, using only read token.')
if __name__=='__main__':asyncio.run(main())
