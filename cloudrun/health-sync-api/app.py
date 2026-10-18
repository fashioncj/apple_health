"""Health-only API. PG access is through fixed CloudBase RPCs; no TCP/ORM or shared app migrations."""
from contextlib import asynccontextmanager
from dataclasses import dataclass
import hashlib,json,os,secrets,logging
import httpx
from fastapi import FastAPI,Depends,Header,HTTPException,Query
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import AwareDatetime
from models import Batch

@dataclass(frozen=True)
class Settings:
    base: str
    db_key: str
    upload_token: str
    read_token: str

    @classmethod
    def from_env(cls):
        env=os.environ['CLOUDBASE_ENV_ID']
        if not env or any(c not in 'abcdefghijklmnopqrstuvwxyz0123456789-' for c in env):
            raise RuntimeError('Invalid environment ID')
        obj=cls('https://'+env+'.api.tcloudbasegateway.com',os.environ['CLOUDBASE_APIKEY'],os.environ['API_TOKEN'],os.environ['READ_TOKEN'])
        if min(len(obj.upload_token),len(obj.read_token))<32 or obj.upload_token==obj.read_token or not obj.db_key:
            raise RuntimeError('Separate server-side credentials are required')
        return obj

class Gateway:
    def __init__(self,settings):
        self.client=httpx.AsyncClient(base_url=settings.base,headers={'Authorization':'Bearer '+settings.db_key},timeout=httpx.Timeout(20,connect=5),follow_redirects=False,trust_env=False)

    async def rpc(self,name,args):
        try:
            response=await self.client.post('/v1/rdb/rest/rpc/'+name,json=args)
        except httpx.TransportError:
            raise HTTPException(503,'Storage temporarily unavailable') from None
        if response.status_code==409:
            raise HTTPException(409,'Export ID conflicts with an existing batch')
        if response.status_code!=200:
            raise HTTPException(503,'Storage temporarily unavailable')
        try: data=response.json()
        except ValueError: raise HTTPException(503,'Invalid storage response') from None
        if not isinstance(data,dict): raise HTTPException(503,'Invalid storage response')
        return data

    async def close(self):await self.client.aclose()

class BodyLimit:
    def __init__(self,app):self.app=app
    async def __call__(self,scope,receive,send):
        if scope['type']!='http':return await self.app(scope,receive,send)
        size=0
        async def limited():
            nonlocal size
            msg=await receive()
            size+=len(msg.get('body',b''))
            if size>4*1024*1024:raise HTTPException(413,'Payload too large')
            return msg
        await self.app(scope,limited,send)

def create_app(settings=None,gateway=None):
    settings=settings or Settings.from_env()
    storage=gateway or Gateway(settings)
    @asynccontextmanager
    async def lifespan(app):
        yield
        if hasattr(storage,'close'):await storage.close()
    app=FastAPI(title='Health Bridge',version='2.0',docs_url=None,redoc_url=None,openapi_url=None,lifespan=lifespan)
    app.add_middleware(BodyLimit)

    @app.exception_handler(RequestValidationError)
    async def invalid(request,exc):
        # Never include validation input, values, exception context, or unknown field names.
        allowed = {'body','query','metrics','workouts','deletions','date_range',
                   'device_id','export_id','generated_at','timezone','source','schema_version',
                   'id','type','value','unit','start_at','end_at','source_name','source_bundle_id',
                   'metadata','activity_type','duration_seconds','total_energy_kcal',
                   'active_energy_kcal','distance_meters','start','end','kind','limit','offset','from','to'}
        errors = [{'field': '.'.join(str(v) if isinstance(v,int) or v in allowed else '<field>'
                                    for v in e['loc']), 'code': e['type']}
                  for e in exc.errors()[:10]]
        logging.getLogger('healthbridge.validation').warning('Rejected request fields: %s', json.dumps(errors))
        return JSONResponse({'detail':'Invalid request payload','errors':errors},status_code=422)

    def check(value,expected):
        if not value or not value.startswith('Bearer '):raise HTTPException(401,'Bearer token required')
        if not secrets.compare_digest(value[7:].encode(),expected.encode()):raise HTTPException(403,'Token rejected')
    def ingest_auth(authorization:str|None=Header(None)):check(authorization,settings.upload_token)
    def read_auth(authorization:str|None=Header(None)):check(authorization,settings.read_token)

    @app.get('/health')
    def health():return {'ok':True}

    @app.get('/ready')
    async def ready():
        await storage.rpc('healthbridge_read',{'p_kind':'metric','p_limit':1})
        return {'ok':True}

    @app.post('/api/apple-health/sync',dependencies=[Depends(ingest_auth)])
    async def sync(batch:Batch):
        data=batch.model_dump(mode='json')
        digest=hashlib.sha256(json.dumps(data,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
        result=await storage.rpc('healthbridge_ingest',{'p_batch':data,'p_hash':digest})
        if result.get('ok') is not True or any(not isinstance(result.get(k),int) for k in ['received','duplicates','deleted']):
            raise HTTPException(503,'Invalid storage acknowledgement')
        return {k:result[k] for k in ['ok','received','duplicates','deleted']}

    async def read(kind,typ,start,end,limit,offset):
        if start is not None and end is not None and start>=end:raise HTTPException(422,'Ordered date range required')
        result=await storage.rpc('healthbridge_read',{'p_kind':kind,'p_type':typ,'p_from':start.isoformat() if start else None,'p_to':end.isoformat() if end else None,'p_limit':limit,'p_offset':offset})
        if not isinstance(result.get('items'),list) or not isinstance(result.get('page'),dict):raise HTTPException(503,'Invalid storage response')
        return result

    @app.get('/api/agent/metrics',dependencies=[Depends(read_auth)])
    async def metrics(metric_type:str|None=Query(None,alias='type',max_length=100),start:AwareDatetime|None=Query(None,alias='from'),to:AwareDatetime|None=None,limit:int=Query(100,ge=1,le=500),offset:int=Query(0,ge=0)):
        return await read('metric',metric_type,start,to,limit,offset)

    @app.get('/api/agent/workouts',dependencies=[Depends(read_auth)])
    async def workouts(activity_type:str|None=Query(None,max_length=100),start:AwareDatetime|None=Query(None,alias='from'),to:AwareDatetime|None=None,limit:int=Query(100,ge=1,le=500),offset:int=Query(0,ge=0)):
        return await read('workout',activity_type,start,to,limit,offset)

    @app.get('/api/agent/syncs',dependencies=[Depends(read_auth)])
    async def syncs(start:AwareDatetime|None=Query(None,alias='from'),to:AwareDatetime|None=None,limit:int=Query(100,ge=1,le=500),offset:int=Query(0,ge=0)):
        return await read('sync',None,start,to,limit,offset)
    return app
