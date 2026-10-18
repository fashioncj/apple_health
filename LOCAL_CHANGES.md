# 本地改动与来源

基座：megabyte0x/healthykit，固定提交 72cadcda356048296a86b7271d3fd5b9281e9d38（Apache-2.0）。保留根 LICENSE 和全部上游版权信息。上游 README.md 仍保留，首次运行以 README.zh-CN.md 为准。

本地于 2026-10-18 修改：

- AppSettings / Onboarding：默认自建后端，仅选五类，托管选择从 UI 移除，上游托管 URL 替换为 disabled.invalid；不自动创建托管空间。
- APIClient：真机非 loopback 地址要求 HTTPS，拒绝 URL 内置凭据、查询和 fragment；临时 URLSession 不跟随重定向，重试增加随机抖动。
- HealthKitManager：原始时间 double、source revision、设备信息、原始数量描述和 category value 附在 metadata；历史回填不聚合；增量查询每页 1000 条并报告 hasMore。
- SyncEngine：每次最多连续处理 20 页，每页入队后再保存游标；继承上游队列持久化、删除和失败重试。
- HealthNormalizer：SpO₂ 使用 fraction；0.975 的意义明确为 97.5%。
- LocalStore：显式 FULL 同步写入与 iOS 文件保护。
- backend config/auth：增加单独 READ_TOKEN，只授予 agent_read 能力。
- backend models/repository + 0006 migration：删除墓碑阻止乱序旧批次重新创建已删除 UUID。
- Compose：数据库/API 只绑定 loopback，传递 READ_TOKEN。
- Tests：新增读写权限边界、亚秒时间、元数据保真、重启与迟到重放回归；调整默认配置断言。
- bridge/、scripts/、deploy/、中文文档、requirements.lock.txt：新增。MCP 使用官方 mcp Python SDK 1.x（MIT），并非自写协议模拟。

本地 .env.local 与 data/ 已被忽略，仅用于本机演示；请勿分发秘密。未创建远端仓库、推送或发布。

服务器部署追加：deploy/compose.server.yml、非 root API 镜像、独立 PostgreSQL、Nginx HTTPS 入口和备份脚本；0004 迁移在缺少 Supabase 专用角色时收紧 PUBLIC 权限，兼容普通 PostgreSQL。实际部署结果见 SERVER_DEPLOYMENT.md。

CloudBase 最终实现：cloudrun/health-sync-api 新增独立无状态 API；cloudbase/migrations 增加三个 healthbridge_ 表与事务/查询 RPC。API 使用 HTTPS 数据库网关，健康表无匿名/普通应用用户访问权限。新永久后台Key经用户明确确认，独立上传/只读令牌与数据库Key分离。没有运行旧schema全局权限迁移。

### 2026-10-18 实机协议兼容修复

CloudBase 接收 schema_version 1（连接测试）和 2（HealthNormalizer 真实同步），原先仅接受 1 会导致实机同步 422。保留输入版本，不降级或丢弃字段。新增实际 Swift 生成的合成 v2 合约样本及回归测试，未知版本仍拒绝。脱敏校验日志仅记录字段位置和错误类型。
