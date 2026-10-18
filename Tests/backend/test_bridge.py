from copy import deepcopy
from dataclasses import replace
from fastapi.testclient import TestClient
from backend.app import create_app
from backend.config import Settings
from backend.database import create_engine_for_url, create_session_factory
from backend.models import Base
from test_backend_api import sample_payload

def make_bridge(tmp_path):
    url = f'sqlite+pysqlite:///{tmp_path}/bridge.sqlite'
    engine = create_engine_for_url(url)
    Base.metadata.create_all(engine)
    settings = Settings(database_url=url, api_token='upload-secret', read_token='read-secret', token_hash_secret='hash-secret', hosted_public_base_url='')
    factory = create_session_factory(engine)
    return TestClient(create_app(settings, session_factory=factory)), settings, factory

def test_raw_samples_restart_scope_and_late_replay(tmp_path):
    c, settings, factory = make_bridge(tmp_path)
    upload = {'Authorization':'Bearer upload-secret'}
    read = {'Authorization':'Bearer read-secret'}
    p = sample_payload()
    p['workouts'] = []
    m = p['metrics'][0]
    m.update(type='oxygen_saturation', value=97.125, unit='%', start_at='2026-05-31T09:00:00.123456Z',end_at='2026-05-31T09:00:00.223456Z',source_name='Apple Watch',source_bundle_id='com.apple.health')
    m['metadata'] = {'healthbridge.start_epoch_seconds':'1780218000.123456','healthbridge.source_version':'27.0'}
    assert c.post('/api/apple-health/sync',headers=upload,json=p).status_code==200
    assert c.post('/api/apple-health/sync',headers=upload,json=p).json()['duplicates']==1
    assert c.post('/api/apple-health/sync',headers=read,json=p).status_code==403
    assert c.get('/api/agent/metrics',headers=upload).status_code==403
    c=TestClient(create_app(settings,session_factory=factory))
    got=c.get('/api/agent/metrics?type=oxygen_saturation',headers=read).json()['items'][0]
    assert got['value']==97.125 and got['metadata']==m['metadata']
    assert '.123456' in got['start_at']
    d=deepcopy(p);d['export_id']='22222222-2222-4222-8222-222222222222';d['metrics']=[];d['deletions']=[{'id':m['id'],'kind':'metric'}]
    assert c.post('/api/apple-health/sync',headers=upload,json=d).json()['deleted']==1
    # A lost ACK or older queued batch must not undo a later deletion.
    assert c.post('/api/apple-health/sync',headers=upload,json=p).status_code==200
    assert c.get('/api/agent/metrics',headers=read).json()['items']==[]

def test_disabled_hosted_and_pagination(tmp_path):
    c, _, _=make_bridge(tmp_path)
    assert c.post('/api/hosted/workspaces',json={}).status_code==404
    assert c.get('/api/agent/metrics?limit=501',headers={'Authorization':'Bearer read-secret'}).status_code==422
