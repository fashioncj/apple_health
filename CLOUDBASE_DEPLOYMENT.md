# CloudBase 健康同步部署与 iOS 配置

已于 2026-10-18 部署并完成合成数据端到端验证。当前使用本说明；README.zh-CN.md 内的 SQLite / Ubuntu Docker 方案作为备用和历史记录。

## iOS 中填写

打开 HealthSync → Settings → Storage Destination → **My own backend**：

- **Backend URL**：`https://health-sync-api-320599-7-1251732889.sh.run.tcloudbase.com`
- **Auth Token / Token Required**：复制本地 `private/iPhone配置.txt` 中的上传令牌。
- 点击 **Save**。
- 数据类型默认是 SpO₂、心率、HRV SDNN、睡眠阶段、呼吸频率。
- 同步频率选 **Hourly best-effort**。后台时间由 iOS 决定，失败入队并重试；不是保证每小时准点完成。

首次建议保持 App 在前台，手动同步小段日期，和“健康”App 的单条记录核对后再做历史回填。更换后端不会自动重置手机已存的 HealthKit 游标；如果之前向其他后端同步过，请使用 Backfill date range 回填所需日期。

**iOS 不需要 CloudBase API Key、环境 ID 或数据库密码。** 上传令牌只有这个健康 API 的上传能力，不能查询健康数据；手机保存到 Keychain。MCP 使用单独只读令牌，也不能上传。

## Xcode

本次已成功运行：

```sh
xcodebuild build-for-testing -project HealthSync.xcodeproj -scheme HealthSync \
  -destination 'generic/platform=iOS Simulator' -derivedDataPath .DerivedData CODE_SIGNING_ALLOWED=NO
```

结果为 `TEST BUILD SUCCEEDED`，之前的 Xcode 插件组件错误已不再出现。

真机安装仍需要在 Xcode 中选 HealthSync target、设置你的签名 Team，必要时选择自己的 bundle ID，确认 HealthKit / Background Delivery / Background fetch 能力，然后选择 iPhone 运行。当前电脑没有安装模拟器运行时，**尚未运行 XCTest，也没有完成真机权限、锁屏和后台补传验收**。

## 云端资源与隔离

- 环境：`luluface-d6gwrwj2zd36f7f08`，上海 `ap-shanghai`。
- 独立容器服务：`health-sync-api`，版本 `001`，端口 `8080`，0.25 CPU / 0.5 GB，实例最小/最大均为 1。
- HTTPS：使用 CloudRun 独立默认域名，无需修改现有应用的域名和网关路由。
- 数据库存储为现有 CloudBase PostgreSQL 中三个新增专用表：
  - `public.healthbridge_batches`：批次哈希、上传时间及来源，保证批次幂等。
  - `public.healthbridge_records`：逐条原始样本 / workout；保留源 JSON、UUID、开始/结束时间、来源及 metadata。
  - `public.healthbridge_deletions`：删除标记，阻止迟到批次复活已删除 UUID。
- 新增专用函数：`healthbridge_ingest`（事务写入）和 `healthbridge_read`（只读查询）。
- 版本化迁移：`cloudbase/migrations/20261018133000_healthbridge_isolated_sync.sql`，远端迁移已确认成功，原有 8 条迁移保留。
- 对三个健康表启用 RLS，撤销 PUBLIC / anon / authenticated 的直接访问权限；函数只授权 service_role，不给原应用用户开放健康数据。
- 没有运行旧后端的 schema-wide 授权迁移；没有修改现有业务表、认证提供方或现有 API Key。
- 已比较现有 `pocket-love-api`：仍为版本 `009`、流量 100%，配置、部署时间和镜像均保持不变。原有 9 张业务表全部保留；只新增以上 3 张健康表。

数据经 HTTPS RPC 网关访问，**没有 TCP 数据库地址、没有开放数据库公网端口、没有 VPC 连库要求**。容器不在本地文件系统保存健康数据。

## 三种凭据

| 凭据 | 用在哪里 | 权限 |
|---|---|---|
| CloudBase `healthbridge-backend` API Key | 仅 CloudRun 服务端 `CLOUDBASE_APIKEY` | 环境级 service_role，可绕过该环境所有表的 RLS；经用户明确确认后创建，永久有效、可独立吊销 |
| 健康 API `API_TOKEN` | iOS Auth Token | 仅健康 API 上传，不可读 |
| 健康 API `READ_TOKEN` | MCP / 定期查询客户端 | 仅健康 API 查询，不可上传 |

永久 CloudBase Key 不是“只能访问健康表”的数据库账号；其权限范围是 CloudBase 平台提供的环境级能力。服务代码只调用静态的健康专用 RPC，不接收任意 SQL。Key 不在源码、镜像、iOS 或本文中；本地副本均置于权限受限的 `private/`。用户已明确授权这一具体凭据方案。

轮换时在控制台创建新的健康服务专用 Key，仅更新 `health-sync-api` 的 `CLOUDBASE_APIKEY`，发布后验证 `/ready` 和查询，再吊销旧 Key。不要修改或吊销原应用的 `luluface` Key，也不要把新 Key 粘到 iOS。

## API 与 MCP

- `GET /health`：固定 `{ "ok": true }`，不回显请求头、平台 context 或环境变量。
- `GET /ready`：检查实际数据库连接，只返回固定状态。
- `POST /api/apple-health/sync`：Bearer 上传令牌；与 iOS SyncPayload 兼容。
- `GET /api/agent/metrics?type=oxygen_saturation&from=...&to=...&limit=100&offset=0`：Bearer 只读令牌；区间为开始时间的 `[from,to)`。
- `GET /api/agent/syncs`：只读查询收到的批次，判断数据新鲜度。
- `GET /api/agent/workouts`：可选 workout 原始区间查询。

MCP 入口仍为 `python -m bridge.mcp_server`。环境变量从本地受限文件 `private/cloudbase-mcp.env` 获取：`HEALTH_API_URL` 和 `HEALTH_READ_TOKEN`。已实测官方 MCP 客户端 initialize → list_tools → call_tool → 新 CloudRun → 真 PostgreSQL 全链路；尚未自动向所有客户端注册此健康查询 MCP。

SpO₂ 使用 `unit=fraction`，例如 `0.975` 表示 `97.5%`。每条仍是 HealthKit 的离散测量，空白不是正常血氧证明；不做插值或连续缺氧时长推断。HRV 是 SDNN，不是 RMSSD。

## 验证结果

- 新 CloudBase API：**11 个本地测试通过**，覆盖权限隔离、幂等哈希参数、分页、带时区日期、非法数值、请求大小和敏感信息不回显。
- 实际 CloudBase PG：五类合成样本原子写入、重复去重、稳定分页、微秒日期、单位、来源和 metadata 保真全部通过。
- 公网 HTTPS：未登录 401、错用读写令牌 403、同一 export ID 内容冲突 409、正常上传/重试/查询通过。
- 官方 MCP：完整握手、工具发现及只读查询通过；独立进程再次查询可读回同一批持久化记录。
- 删除同步与迟到重放：用新 export ID 重放旧 UUID 不会复活已删除样本。
- 合成健康样本已清理，`healthbridge_records` 最终为 **0 条**；保留明确标识 SYNTHETIC 的测试批次和删除标记作为审计记录。没有读取或上传你的真实健康数据。
- 新容器状态 normal，版本流量 100%；原应用版本和配置未变。
- iOS 完整测试包构建成功；真机行为尚待你安装运行后验证。

验证日志位于 `validation/cloudbase-*.log`；现有应用隔离比对记录为 `validation/cloudbase-isolation.json`。镜像、构建号和部署入口记录在 `cloudbase/deployment.json`。

重跑云端合成数据验证（在项目根目录，需本地 private 配置；每次 upload 会新增合成样本，最后 cleanup）：

```sh
PYTHONPATH=scripts .venv/bin/python scripts/cloudbase_e2e.py upload
PYTHONPATH=scripts .venv/bin/python scripts/cloudbase_e2e.py verify
PYTHONPATH=scripts .venv/bin/python scripts/cloudbase_e2e.py cleanup
```

本地 API 测试：

```sh
cd cloudrun/health-sync-api
../../../.venv/bin/python -m pytest test_api.py -q
```

## v003 协议兼容修复（2026-10-18）

真实 iOS 同步使用 schema_version=2，连接测试使用 1。后端现兼容两者，未知版本仍拒绝。16 项 API 测试通过，实际 Swift 合成 v2 请求在公网上传 HTTP 200，已验证持久化、重复去重和 v1 空批次兼容，测试样本已清理。当前部署标识见 cloudbase/deployment.json。
