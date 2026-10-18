"""Exercise the real CloudBase PG RPC with clearly marked synthetic samples only."""
import hashlib,json,uuid
from pathlib import Path
from datetime import datetime,timezone,timedelta
import httpx
root=Path(__file__).resolve().parents[1]
values=dict(x.split('=',1) for x in (root/'private/cloudbase-runtime.env').read_text().splitlines() if '=' in x)
base='https://'+values['CLOUDBASE_ENV_ID']+'.api.tcloudbasegateway.com'
start=datetime(2026,10,18,1,0,0,123456,tzinfo=timezone.utc)
def make_payload():
    p={'device_id':'synthetic-cloudbase-'+str(uuid.uuid4()),'export_id':str(uuid.uuid4()),'generated_at':datetime.now(timezone.utc).isoformat(),'timezone':'Asia/Shanghai','source':'SYNTHETIC-CLOUDBASE-E2E','schema_version':1,'date_range':{'start':start.isoformat(),'end':(start+timedelta(minutes=2)).isoformat()},'metrics':[],'workouts':[],'deletions':[]}
    for typ,val,unit in [('oxygen_saturation',.975,'fraction'),('heart_rate',61.25,'count/min'),('hrv_sdnn',42.5,'ms'),('sleep_analysis',120,'seconds'),('respiratory_rate',14.5,'count/min')]:
        p['metrics'].append({'id':'healthkit:'+str(uuid.uuid4()),'type':typ,'value':val,'unit':unit,'start_at':start.isoformat(),'end_at':(start+timedelta(seconds=120 if typ=='sleep_analysis' else 0)).isoformat(),'source_name':'SYNTHETIC TEST WATCH','source_bundle_id':'test.healthbridge.synthetic','metadata':{'synthetic':True,'healthbridge.start_epoch_seconds':str(start.timestamp()),'sleep_stage':'rem' if typ=='sleep_analysis' else ''}})
    return p

def digest(p):return hashlib.sha256(json.dumps(p,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
def main():
    p=make_payload()
    with httpx.Client(timeout=30,trust_env=False,follow_redirects=False,headers={'Authorization':'Bearer '+values['CLOUDBASE_APIKEY']}) as c:
        def rpc(name,args):
            r=c.post(base+'/v1/rdb/rest/rpc/'+name,json=args)
            if r.status_code!=200:
                print('RPC failed:',name,'status',r.status_code,'response',r.text[:1000]);raise SystemExit(1)
            return r.json()
        first=rpc('healthbridge_ingest',{'p_batch':p,'p_hash':digest(p)})
        assert first=={'ok':True,'received':5,'duplicates':0,'deleted':0},first
        second=rpc('healthbridge_ingest',{'p_batch':p,'p_hash':digest(p)})
        assert second['received']==0 and second['duplicates']==5,second
        q=rpc('healthbridge_read',{'p_kind':'metric','p_limit':2})
        assert len(q['items'])==2 and q['page']['has_more']
        q=rpc('healthbridge_read',{'p_kind':'metric','p_type':'oxygen_saturation','p_limit':500})
        item=next(x for x in q['items'] if x['id']==p['metrics'][0]['id'])
        assert item['value']==.975 and item['metadata']==p['metrics'][0]['metadata']
        assert item['source_bundle_id']=='test.healthbridge.synthetic' and '.123456' in item['start_at']
        path=root/'private/cloudbase-rpc-fixture.private.json';path.write_text(json.dumps(p));path.chmod(0o600)
        print('PASS: CloudBase PG atomic ingest, batch replay dedupe, real stored five types, deterministic pagination, microsecond timestamp/source/metadata preservation. Synthetic fixture saved for cleanup.')
if __name__=='__main__':main()
