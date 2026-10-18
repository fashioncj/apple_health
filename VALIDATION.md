# 验证记录

**后续 CloudBase 部署已完成，且新版 Xcode 测试包构建成功；最新验证结果见 CLOUDBASE_DEPLOYMENT.md。以下保留初始本地版本的历史记录。**

执行日期：2026-10-18（Asia/Shanghai）。仅使用合成样本，没有读取或上传真实个人健康数据。未推送、未发布、未配置远端账户。

## 已执行并通过

1. `python -m pytest Tests/backend -q`：**28 passed**。26 个上游测试和 2 个新增回归测试；认证、持久化、UUID 去重、删除、读写令牌隔离、原始来源/亚秒时间戳、重启后查询、删除后迟到重放。测试使用真实 SQLite 文件与 FastAPI TestClient。存在一条 Starlette/httpx 测试客户端弃用提示，不影响结果。
2. `PYTHONPATH=. python scripts/e2e_demo.py`：**PASS**。启动真实 uvicorn HTTP 服务及临时 SQLite；匿名写入 401、正常上传、重复重试去重、只读写入 403；关闭并重启服务；官方 MCP stdio 客户端 initialize → list_tools → call_tool，查询回原始 SpO₂ 比例、来源和时间 metadata。服务和临时数据库在结束时清理。日志 `validation/e2e.log`。
3. `DATABASE_URL=sqlite+pysqlite:///.../migration.sqlite alembic upgrade head`：**通过全部六次迁移，至 20261018_0006**。日志 `validation/migrations.log`。该临时迁移库与本地空演示库分开。
4. Swift 原生模型可执行程序：**PASS**。直接编译本项目的 HealthMetric / HealthWorkout / SyncBatch / HealthNormalizer，加 `scripts/verify_swift.swift`，在 macOS ARM64 上执行；验证五类样本的值、单位、sleep stage、来源、原始 epoch metadata 和日期序列化往返。SpO₂ 输出 unit=fraction。
5. 全部 `HealthSync/**/*.swift` 通过 Swift 编译器 `-typecheck`，SDK 为 iPhoneSimulator27.1，目标 arm64-apple-ios17.0-simulator。真实 SwiftUI 宏插件在获准环境下运行，退出码 0。这是应用源码类型检查，不是 XCTest 运行。
6. `scripts/init_local.py`：创建 `.env.local`（权限 0600）、空的持久 SQLite 文件（权限 0600）；未打印令牌，没有后台常驻进程。

## 尚未通过或执行

- **完整 Xcode build-for-testing 被环境阻断**：Xcode 27.1 build 27A9275 在加载 IDESimulatorFoundation 时失败，DVTDownloads.framework 缺失其所需 Swift 符号。沙箱外重试相同，退出码 70；编译应用源码前即失败。没有运行全局修复、重新安装或系统配置变更。
- 所有 iOS XCTest、模拟器安装/运行、设备签名、真实 HealthKit 权限及后台行为未完成。类型检查与原生模型执行不能证明这些已经通过。
- PostgreSQL/Docker/HTTPS 生产部署未执行；本机没有可用 docker 命令。PostgreSQL 迁移、并发写入与生产备份恢复仍待部署验收。
- 尚未将 MCP 注册到你的客户端；当前提供并验证的是本地 stdio 适配器。远程 HTTP/OAuth 连接器待后续。

## 下一次真机验收

- 手工逐条核对真实 SpO₂、心率、SDNN、呼吸频率和睡眠区间；保留设备来源差异。
- 权限拒绝/部分授权，确认界面不把空结果当作无异常。
- 断网 → 入队 → 进程退出/重启 → 恢复网络 → 去重补传。
- 锁屏/重启未解锁查询失败 → 游标不前移 → 解锁前台补读。
- 删除 HealthKit UUID 后补传删除；旧批次重试不复活。
- 超过 1000 条的 HealthKit 分页、20 页上限后的续传；后台过期取消后不丢页。
- 多来源重叠睡眠、跨时区旅行与历史回填。SpO₂ 仍只解读为离散记录。
