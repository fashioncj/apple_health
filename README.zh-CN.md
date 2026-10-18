# Health Bridge：Apple Health 自托管同步最小实现

**当前已部署到 CloudBase。iOS 实际地址、令牌位置及最新验收结果见 [CLOUDBASE_DEPLOYMENT.md](CLOUDBASE_DEPLOYMENT.md)。下文 SQLite / Ubuntu Docker 方案为备用和历史记录。**

2026-10-18，本地实现；基于 HealthSync，不依赖 Health Auto Export。未推送、未部署、未连接真实健康数据。

## 选型核实

核实方式：实际下载三个仓库，检查源码、许可文件和 HEAD 时间。公开仓库不等同于具备开源许可，README 功能声明也不等同于真机验证。

| 候选 | 固定提交 / 最近提交日期 | 许可与源码 | 决定 |
|---|---|---|---|
| [HealthSync / healthykit](https://github.com/megabyte0x/healthykit) | `72cadcda356048296a86b7271d3fd5b9281e9d38`，2026-10-17 | 根目录 LICENSE 为 Apache-2.0；有 SwiftUI/Xcode、SQLite 队列、HealthKit observer/anchor、FastAPI、迁移与测试 | 选为基座；维护最近，但仍需真机验收 |
| [Exporter](https://github.com/is52hertz/Exporter) | `6ecf498d6abd38ee6c2d1f471f0fc35a234cc3c5`，2026-06-15 | GPL-3.0；有 Xcode 工程、HealthKit、增量导出及手动 POST；iOS 26.5 目标 | 真正有源码；偏交互式导出，未选 |
| [health-dashboard-export](https://github.com/baccula/health-dashboard-export) | `bd456c8bee131882a3d68913b56510e1f1fe0ee1`，2026-03-05 | 有 Swift/Xcode/后台任务源码；该提交的完整文件树没有找到 LICENSE/NOTICE | 未确认再利用授权，不复制源码 |

HealthSync 早先的无许可证 issue 不能代表现在；本次固定提交已具备 Apache-2.0 LICENSE。Health Auto Export 不作为开源基座。

本目录保留 HealthSync 上游源码与 LICENSE。`README.md` 为上游文档；以本中文说明为这份本地版本的运行入口。变更详见 `LOCAL_CHANGES.md`。

## 数据流程与语义

`iPhone HealthKit → 每类型 anchored query → 本地 SQLite 持久队列 → HTTPS REST → SQLite/PostgreSQL → 只读 REST → stdio MCP`

默认只选择五类：SpO₂、心率、HRV SDNN、睡眠阶段、呼吸频率。请求读取权限，不向 HealthKit 写入。用户可以在 Settings 修改类型。

- 保留 HealthKit UUID、逐条 start/end、数值、单位、source 名称及 bundle ID、metadata；补充来源版本、设备描述、系统版本。
- SpO₂ 使用 `unit=fraction`，`0.975` 是 `97.5%`。不做插值，不把相邻测量之间的空白当作正常。不能从稀疏 Apple Watch 样本可靠计算连续缺氧时长或夜间缺氧次数。
- 心率/呼吸频率是 `count/min`，HRV 是 SDNN，单位 `ms`，不等于 RMSSD。睡眠为原始阶段区间，`value` 为时长秒，`metadata.sleep_stage` 为阶段。
- JSON 主日期为 UTC ISO8601 毫秒；`metadata.healthbridge.start_epoch_seconds/end_epoch_seconds` 保存原始 Date double 的十进制表示，避免原始亚毫秒信息因格式化丢失。原始时区 metadata（如存在）保留；payload.timezone 是导出时手机时区，不能据此推断所有历史记录的当地时区。
- 历史回填也逐条读取，已关闭上游的日均值/日总量聚合。
- 游标按类型持久化在 iPhone，不当作服务端时间筛选条件。新增和删除先持久入队，再推进游标，再上传；断电在入队与游标更新之间只会造成重读，由 UUID 去重。
- 每类型每页最多 1000 条，队列上传每批最多 100 条，每次增量运行最多 20 页。大历史库可能需多次前台增量同步；可用日期范围回填分段导入。历史范围查询仍可能占用较多内存，首次导入建议按天或周分段。
- iPhone 本地 SQLite 显式 `synchronous=FULL`，文件保护为首次解锁后可访问；令牌保存在 Keychain。本地服务 SQLite 文件与配置为仅当前用户可读写；生产数据库备份和主机磁盘加密由部署者配置。
- 服务端按 workspace/device/样本 UUID 去重，export ID 记录批次。永久删除标记防止迟到重试复活已删除 UUID；同一 UUID 的合法重写更新现有记录。

这里的“原始”是 HealthKit 暴露的逐条样本，不是 Apple Watch 光学传感器波形。读取拒绝与无数据在 HealthKit 中可能无法区分，空结果不能解读为已获得权限或没有异常。

## 本地运行（SQLite，无需 Docker）

在本目录执行，Python 3.11+：

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements.lock.txt
PYTHONPATH=. .venv/bin/python scripts/init_local.py
.venv/bin/python -m uvicorn backend.main:app --env-file .env.local --host 127.0.0.1 --port 8080
```

本次已生成 `.env.local` 和空的 `data/health.sqlite`，没有打印令牌。初始化脚本再次运行会保留已有配置并退出；不必重复初始化。当前服务没有常驻运行。

`.env.local` 包含上传/管理 `API_TOKEN`、独立的 `READ_TOKEN` 与哈希密钥；不要提交该文件。SQLite 是持久化本地最小版本；生产用下面的 PostgreSQL 路径。

API：

- `POST /api/apple-health/sync`：Bearer API_TOKEN；格式见 `scripts/e2e_demo.py` 或 `/docs`。
- `GET /api/agent/metrics?type=oxygen_saturation&from=...&to=...&limit=100&offset=0`：Bearer READ_TOKEN。响应保留所有逐条字段，分页跟随 `page.has_more`。
- `GET /api/agent/syncs`：只读批次记录，用来判断同步新鲜度。
- 上传令牌是上游自托管管理员令牌，也能读管理 API；MCP 进程仅配置 READ_TOKEN，只读令牌不能上传。不要把管理员令牌交给 MCP 客户端。

## iPhone 配置

1. 打开 `HealthSync.xcodeproj`，选 HealthSync scheme。设置你自己的签名团队，必要时修改 bundle ID；确认 HealthKit、HealthKit Background Delivery、Background Modes / Background fetch。
2. 首次启动仅请求健康读取权限。进入 Settings，Storage 只提供 My own backend，填入自建 **可信 HTTPS** 根地址与 API_TOKEN。空地址不会上传，不会创建上游托管账户。
3. 真机需能访问该 HTTPS 地址，并信任证书；本地 `127.0.0.1` 只适合模拟器。普通局域网 HTTP 上传已禁用，不要用禁用证书校验解决连接问题。
4. 先授权五类数据、手动同步小范围，核对 iPhone 健康 App 内某一条 SpO₂ 记录的时间、来源与数值，再做历史回填。
5. 官方后台策略是尽力执行。Observer 唤醒后跑 anchored query 并完成回调；BGAppRefreshTask、前台恢复补同步；网络/服务器失败保留队列并在后续唤醒、手动同步时重试，短期网络重试采用带随机抖动的指数等待。

锁屏时 HealthKit 可能返回数据库不可访问：保留旧游标，不以空数据替代；解锁回前台后补读。系统重启未解锁、低电量、关闭后台刷新、用户强制退出均可能延迟同步。iOS 不保证整点、每小时或每天准时；模拟器不能验证真实后台 HealthKit。

编译命令：

```sh
xcodebuild build-for-testing -project HealthSync.xcodeproj -scheme HealthSync \
  -destination 'generic/platform=iOS Simulator' -derivedDataPath .DerivedData CODE_SIGNING_ALLOWED=NO
```

本机完整构建被 Xcode 组件不匹配阻断：`IDESimulatorFoundation` 引用 `DVTDownloads` 缺失符号。沙箱外重试同样失败。需要修复匹配的 Xcode/系统组件后重跑；没有擅自修改全局 Xcode 安装。全部 iOS 应用源码已用 SDK 27.1 单独类型检查通过；这不等于完成签名、链接、安装或真机验收。

## 自建服务器部署（未执行）

1. 将项目复制到你的服务器。使用 `.env.example` 建立 `.env`；分别生成四个不同的随机值给 POSTGRES_PASSWORD、API_TOKEN、READ_TOKEN、TOKEN_HASH_SECRET。保持 HOSTED_PROVISIONING_ENABLED=false。
2. `docker compose up --build -d`：PostgreSQL 持久卷存储，API 启动前运行 Alembic 迁移。数据库与 API 端口默认仅绑定服务器 127.0.0.1。
3. 在宿主机配置可信 TLS 反向代理至 127.0.0.1:8080。示例见 `deploy/Caddyfile.example`；替换成你自己的域名，配置 DNS 和证书，不对外开放数据库。
4. 用 API_TOKEN 配置 iPhone，READ_TOKEN 配置本机 MCP。备份 PostgreSQL 持久卷；升级前备份并运行迁移。令牌轮换后同步更新对应客户端。

未安装/运行 Docker，PostgreSQL 容器与生产 HTTPS 部署尚未验证。SQLite 的 API、迁移和进程重启验证不能替代 PostgreSQL 部署验收。

## MCP 查询接口

使用官方 Python MCP SDK 1.x，入口 `python -m bridge.mcp_server`，stdio 传输；只提供 `health_samples(metric_type, start, end, limit=100, offset=0)`。时间必须有时区，结果保留来源和原始粒度，不提供诊断或连续血氧推断。

在支持 stdio 的 MCP 客户端中配置：命令为本项目 `.venv/bin/python` 的绝对路径，参数 `-m bridge.mcp_server`，工作目录为本项目绝对路径；环境变量 `HEALTH_API_URL` 为自建服务地址，`HEALTH_READ_TOKEN` 为 READ_TOKEN。不要配置 API_TOKEN。接口未自动添加到你任何客户端或远端账户。ChatGPT 远程连接的 HTTP/OAuth 适配留待后续，不将此本地 stdio 接口当作已经上线的连接器。

## 可执行验证

```sh
.venv/bin/python -m pytest Tests/backend -q
PYTHONPATH=. .venv/bin/python scripts/e2e_demo.py
```

端到端脚本仅使用临时合成样本：启动真实本地 HTTP 服务 → 上传 → 重复上传 → 拒绝只读令牌写入 → 重启服务 → 使用官方 MCP 客户端完成握手、工具发现和查询 → 删除临时库并关闭服务。

运行 `sh scripts/verify_swift.sh` 可执行 macOS ARM64 模型验证。Swift 原生模型验证源码在 `scripts/verify_swift.swift`：检查五类样本、来源、时间与 JSON 往返。完整证据和待办见 `VALIDATION.md`。

真机验收必须包括：拒绝权限、真实 SpO₂ 单条比对、多来源重叠睡眠、断网重启后补传、锁屏读取失败后解锁补同步、删除记录、后台到期取消，以及超过 1000 条的增量分页。它们仍待用你的设备执行；本次没有读取你的健康数据库。

参考：[Apple anchored query](https://developer.apple.com/documentation/healthkit/hkanchoredobjectquery)、[Apple observer query](https://developer.apple.com/documentation/healthkit/hkobserverquery)、[官方 MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)。
