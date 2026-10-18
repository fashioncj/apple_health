"""Synthetic HTTP ingest -> persistence -> official MCP stdio client."""
import asyncio, json, os, socket, subprocess, sys, tempfile, time, uuid
from pathlib import Path
import httpx
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from backend.database import create_engine_for_url
from backend.models import Base
ROOT=Path(__file__).resolve().parents[1]

async def query(base):
    params=StdioServerParameters(command=sys.executable,args=['-m','bridge.mcp_server'],cwd=str(ROOT),env={**os.environ,'HEALTH_API_URL':base,'HEALTH_READ_TOKEN':'demo-read'})
    async with stdio_client(params) as (reader,writer):
        async with ClientSession(reader,writer) as session:
            await session.initialize()
            assert [t.name for t in (await session.list_tools()).tools]==['health_samples']
            result=await session.call_tool('health_samples',{'metric_type':'oxygen_saturation','start':'2026-10-17T00:00:00Z','end':'2026-10-19T00:00:00Z'})
            assert not result.isError, result
            data=json.loads(''.join(x.text for x in result.content if hasattr(x,'text')))
            samples=data['data']['items']
            assert len(samples)==1 and samples[0]['value']==.975 and samples[0]['unit']=='fraction'
            assert samples[0]['source_name']=='Synthetic Apple Watch'
            assert samples[0]['metadata']['healthbridge.start_epoch_seconds']=='1792285200.123456'

def main():
    with tempfile.TemporaryDirectory(prefix='healthbridge-demo-') as folder:
        url='sqlite+pysqlite:///'+folder+'/health.sqlite'
        Base.metadata.create_all(create_engine_for_url(url))
        with socket.socket() as sock:
            sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
        base=f'http://127.0.0.1:{port}'
        env={**os.environ,'DATABASE_URL':url,'API_TOKEN':'demo-upload','READ_TOKEN':'demo-read','TOKEN_HASH_SECRET':'demo-hash','HOSTED_PROVISIONING_ENABLED':'false'}
        def start():
            return subprocess.Popen([sys.executable,'-m','uvicorn','backend.main:app','--host','127.0.0.1','--port',str(port),'--no-access-log'],cwd=ROOT,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        def ready(process):
            for _ in range(100):
                if process.poll() is not None:raise RuntimeError('API process failed')
                try:
                    if httpx.get(base+'/health',trust_env=False).status_code==200:return
                except httpx.TransportError:pass
                time.sleep(.1)
            raise RuntimeError('API startup timeout')
        process=start()
        try:
            ready(process)
            date='2026-10-18T01:00:00.123456Z'
            payload={'device_id':'synthetic-phone','export_id':str(uuid.uuid4()),'generated_at':date,'timezone':'Asia/Shanghai','source':'ios-healthkit','schema_version':1,'date_range':{'start':date,'end':date},'metrics':[{'id':'healthkit:'+str(uuid.uuid4()),'type':'oxygen_saturation','value':.975,'unit':'fraction','start_at':date,'end_at':date,'source_name':'Synthetic Apple Watch','source_bundle_id':'com.apple.health','metadata':{'healthbridge.start_epoch_seconds':'1792285200.123456'}}],'workouts':[],'deletions':[]}
            with httpx.Client(trust_env=False) as client:
                assert client.post(base+'/api/apple-health/sync',json=payload).status_code==401
                headers={'Authorization':'Bearer demo-upload'}
                assert client.post(base+'/api/apple-health/sync',json=payload,headers=headers).json()['received']==1
                assert client.post(base+'/api/apple-health/sync',json=payload,headers=headers).json()['duplicates']==1
                assert client.post(base+'/api/apple-health/sync',json=payload,headers={'Authorization':'Bearer demo-read'}).status_code==403
            process.terminate();process.wait(timeout=5)
            process=start();ready(process)
            asyncio.run(query(base))
            print('PASS: actual HTTP auth/upload/duplicate retry, process restart persistence, MCP initialize/list_tools/call_tool with read-only token. Synthetic data only.')
        finally:
            process.terminate();process.wait(timeout=5)
if __name__=='__main__':main()
