"""Public CloudRun HTTPS -> dedicated PostgreSQL -> official stdio MCP. Synthetic data only."""
import argparse,asyncio,copy,json,os,sys,uuid
from pathlib import Path
from datetime import datetime
import httpx
from mcp import ClientSession,StdioServerParameters
from mcp.client.stdio import stdio_client
from cloudbase_db_verify import make_payload

root=Path(__file__).resolve().parents[1]
values=dict(x.split('=',1) for x in (root/'private/cloudbase-client.env').read_text().splitlines() if '=' in x)
base=values['HEALTH_API_URL'].rstrip('/')
upload={'Authorization':'Bearer '+values['API_TOKEN']};read={'Authorization':'Bearer '+values['READ_TOKEN']}
state=root/'private/cloudbase-public-fixture.private.json'

async def mcp_verify(payload):
 params=StdioServerParameters(command=sys.executable,args=['-m','bridge.mcp_server'],cwd=str(root),env={**os.environ,'HEALTH_API_URL':base,'HEALTH_READ_TOKEN':values['READ_TOKEN']})
 async with stdio_client(params) as (r,w):
  async with ClientSession(r,w) as s:
   await s.initialize()
   tools=await s.list_tools();assert [t.name for t in tools.tools]==['health_samples']
   result=await s.call_tool('health_samples',{'metric_type':'oxygen_saturation','start':'2026-10-18T00:00:00Z','end':'2026-10-19T00:00:00Z','limit':500})
   assert not result.isError,result
   data=json.loads(''.join(x.text for x in result.content if hasattr(x,'text')))
   m=next(x for x in data['data']['items'] if x['id']==payload['metrics'][0]['id'])
   assert m['value']==.975 and m['unit']=='fraction' and m['source_name']=='SYNTHETIC TEST WATCH'
 print('PASS: official MCP initialize/list_tools/call_tool -> public CloudRun -> real CloudBase PG, using only read token.')

def main(mode):
 with httpx.Client(timeout=40,trust_env=False,follow_redirects=False) as c:
  r=c.get(base+'/health');assert r.status_code==200 and r.json()=={'ok':True},(r.status_code,r.text[:200])
  r=c.get(base+'/ready');assert r.status_code==200 and r.json()=={'ok':True},(r.status_code,r.text[:200])
  if mode=='upload':
   p=make_payload()
   assert c.post(base+'/api/apple-health/sync',json=p).status_code==401
   assert c.post(base+'/api/apple-health/sync',json=p,headers=read).status_code==403
   assert c.get(base+'/api/agent/metrics',headers=upload).status_code==403
   r=c.post(base+'/api/apple-health/sync',json=p,headers=upload);assert r.status_code==200,(r.status_code,r.text[:300])
   assert r.json()=={'ok':True,'received':5,'duplicates':0,'deleted':0},r.text
   state.write_text(json.dumps(p));state.chmod(0o600)
   r=c.post(base+'/api/apple-health/sync',json=p,headers=upload);assert r.status_code==200 and r.json()['duplicates']==5,r.text
   changed=copy.deepcopy(p);changed['metrics'][0]['value']=.99
   assert c.post(base+'/api/apple-health/sync',json=changed,headers=upload).status_code==409
  else:p=json.loads(state.read_text())
  if mode=='cleanup':
   for path in [state,root/'private/cloudbase-rpc-fixture.private.json']:
    if not path.exists():continue
    old=json.loads(path.read_text());d={**old,'export_id':str(uuid.uuid4()),'metrics':[],'workouts':[],'deletions':[{'id':m['id'],'kind':'metric'} for m in old['metrics']]}
    r=c.post(base+'/api/apple-health/sync',headers=upload,json=d);assert r.status_code==200,r.text
    old['export_id']=str(uuid.uuid4())
    r=c.post(base+'/api/apple-health/sync',headers=upload,json=old);assert r.status_code==200 and r.json()['received']==0 and r.json()['duplicates']==5,r.text
   for typ in [m['type'] for m in p['metrics']]:
    r=c.get(base+'/api/agent/metrics',headers=read,params={'type':typ,'limit':500});assert r.status_code==200,r.text
    assert not any(x['device_id']==p['device_id'] for x in r.json()['items'])
   print('PASS: deletion propagation, delayed replay with new export ID cannot resurrect deleted UUIDs; synthetic health samples removed.')
   return
  for m in p['metrics']:
   r=c.get(base+'/api/agent/metrics',headers=read,params={'type':m['type'],'from':'2026-10-18T00:00:00Z','to':'2026-10-19T00:00:00Z','limit':500})
   assert r.status_code==200,r.text
   item=next(x for x in r.json()['items'] if x['id']==m['id'])
   for key in ['value','unit','source_name','source_bundle_id','metadata']:assert item[key]==m[key],(key,item,m)
   assert datetime.fromisoformat(item['start_at'].replace('Z','+00:00'))==datetime.fromisoformat(m['start_at'])
  r=c.get(base+'/api/agent/metrics',headers=read,params={'limit':2});assert r.status_code==200 and len(r.json()['items'])==2 and r.json()['page']['has_more']
  r=c.get(base+'/api/agent/syncs',headers=read,params={'limit':500});assert r.status_code==200 and any(x['device_id']==p['device_id'] for x in r.json()['items'])
  for path in ['/docs','/openapi.json','/debug']:
   assert c.get(base+path,headers={'X-CloudBase-Context':'SENSITIVE-CONTEXT'}).status_code==404
  assert c.get(base+'/health',headers={'X-CloudBase-Context':'SENSITIVE-CONTEXT'}).json()=={'ok':True}
  assert c.get(base+'/api/agent/metrics').status_code==401
  print('PASS:',mode,'public trusted HTTPS, five original sample types, auth scope isolation, idempotency/conflict checks, timestamps/provenance, pagination and sync freshness.')
 asyncio.run(mcp_verify(p))
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('mode',choices=['upload','verify','cleanup']);main(parser.parse_args().mode)
