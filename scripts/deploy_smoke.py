"""Validate an actual deployment with clearly marked synthetic records only."""
import argparse
from datetime import datetime, timezone, timedelta
import json
from pathlib import Path
import uuid
import httpx

root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('mode',choices=['upload','verify','delete'])
parser.add_argument('--state',required=True)
args=parser.parse_args()
secrets=dict(line.split('=',1) for line in (root/'private/server-client.env').read_text().splitlines())
base='https://health.gz.zgdnz.cc'
upload={'Authorization':'Bearer '+secrets['API_TOKEN']}
read={'Authorization':'Bearer '+secrets['READ_TOKEN']}
state=Path(args.state)
with httpx.Client(timeout=30,trust_env=False,follow_redirects=False) as c:
    assert c.get(base+'/health').status_code==200
    if args.mode=='upload':
        now=datetime.now(timezone.utc).isoformat()
        payload={'device_id':'deployment-smoke-'+str(uuid.uuid4()),'export_id':str(uuid.uuid4()),'generated_at':now,'timezone':'Asia/Shanghai','source':'SYNTHETIC-DEPLOYMENT-TEST','schema_version':1,'date_range':{'start':(datetime.fromisoformat(now)-timedelta(minutes=5)).isoformat(),'end':now},'metrics':[],'workouts':[],'deletions':[]}
        for typ,value,unit in [('oxygen_saturation',.975,'fraction'),('heart_rate',61,'count/min'),('hrv_sdnn',42.5,'ms'),('sleep_analysis',120,'seconds'),('respiratory_rate',14,'count/min')]:
            payload['metrics'].append({'id':'healthkit:'+str(uuid.uuid4()),'type':typ,'value':value,'unit':unit,'start_at':(datetime.fromisoformat(now)-timedelta(seconds=120)).isoformat() if typ=='sleep_analysis' else now,'end_at':now,'source_name':'SYNTHETIC TEST DEVICE','source_bundle_id':'test.healthbridge.deployment','metadata':{'synthetic':True,'healthbridge.start_epoch_seconds':str((datetime.fromisoformat(now)-timedelta(seconds=120 if typ=='sleep_analysis' else 0)).timestamp()),'sleep_stage':'rem' if typ=='sleep_analysis' else ''}})
        assert c.post(base+'/api/apple-health/sync',json=payload).status_code==401
        assert c.post(base+'/api/apple-health/sync',json=payload,headers=read).status_code==403
        first=c.post(base+'/api/apple-health/sync',json=payload,headers=upload)
        assert first.status_code==200,first.text
        assert first.json()['received']==5,first.text
        retry=c.post(base+'/api/apple-health/sync',json=payload,headers=upload)
        assert retry.json()['duplicates']==5,retry.text
        state.write_text(json.dumps(payload));state.chmod(0o600)
    payload=json.loads(state.read_text())
    if args.mode=='delete':
        deletion={**payload,'export_id':str(uuid.uuid4()),'metrics':[],'deletions':[{'id':m['id'],'kind':'metric'} for m in payload['metrics']]}
        result=c.post(base+'/api/apple-health/sync',json=deletion,headers=upload)
        assert result.status_code==200,result.text
        assert result.json()['deleted']==5,result.text
        assert c.post(base+'/api/apple-health/sync',json=payload,headers=upload).status_code==200
    for metric in payload['metrics']:
        result=c.get(base+'/api/agent/metrics',headers=read,params={'type':metric['type'],'limit':500})
        assert result.status_code==200,result.text
        matching=[m for m in result.json()['items'] if m['id']==metric['id']]
        if args.mode=='delete':assert matching==[]
        else:
            assert len(matching)==1
            got=matching[0]
            assert got['value']==metric['value'] and got['metadata']==metric['metadata']
            assert got['unit']==metric['unit'] and got['source_bundle_id']==metric['source_bundle_id']
    assert c.get(base+'/api/agent/metrics').status_code==401
    assert c.get(base+'/docs').status_code==404
    assert c.post(base+'/api/hosted/workspaces',json={}).status_code==404
    print('PASS',args.mode,': public trusted HTTPS, five raw types, auth separation, dedupe/provenance or deletion; synthetic data only.')
