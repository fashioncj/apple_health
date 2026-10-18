# CloudBase 接入记录

2026-10-18，按 https://docs.cloudbase.net/skill.md 执行。

- Node.js v24.18.0 / npm 12.0.2 可用。
- 已通过官方 plugins CLI 安装 TencentCloudBase/cloudbase-plugin，用户级 Codex 插件 cloudbase@plugins-cli 已启用，附带技能和 MCP。
- 检测到原有 mcp_servers.cloudbase，已保留配置并设置 enabled=false，防止与插件重复启动。配置备份保留在用户 Codex 配置目录，不包含在项目中。
- 已使用官方 MCP 协议客户端实际启动本地 cloudbase-mcp 2.35.2，完成握手与工具发现，返回 42 个工具；auth(status) 可正常调用。
- 已验证 auth(status)：登录 READY、环境 READY，凭据已保存为全局登录；当前绑定环境 `luluface-d6gwrwj2zd36f7f08`，上海 ap-shanghai。
- 当前会话可以通过标准 MCP 客户端调用 CloudBase；原生插件入口需要重新加载后进入工具列表。
- CLI 全局安装与现有 cloudbase-mcp 可执行文件冲突，未强制覆盖。临时 CLI 的版本/登录启动无响应，已结束这些检查；本次使用已验证可工作的 MCP 通道。

尚未向 CloudBase 创建数据库、修改数据库结构或部署健康服务；也没有宣称原 Docker 服务器上的部署已完成。

建议下一步：列出现有环境并确认目标，检查 PostgreSQL 与 CloudRun 能力；优先复用现有 FastAPI REST 接口、原始样本模型、UUID 去重和只读查询设计，将健康同步后端部署到 CloudBase。完成小批量合成数据验证后，再让 iPhone 接入真实数据。

## 授权完成后的实测结果

- 环境 `luluface`：NORMAL，个人版，PostgreSQL 已启用。
- PostgreSQL 实际只读执行 `SELECT 1 AS connection_ok` 成功，返回 connection_ok=1；未读取现有业务表内容。
- CloudRun 查询状态 normal，已开通。
- CloudRun 当前有一个已有容器服务 `pocket-love-api`，本次未修改其配置、发布版本或流量。
- 本次完成的是管理工具接入及只读验收，尚未部署健康同步服务。

建议下一步：为健康同步建立独立 CloudRun 服务与独立数据库对象、访问权限；先核实 CloudBase PG 与现有 FastAPI/SQLAlchemy 的连接方式，再迁入现有逐条样本同步、去重和只读 MCP 查询接口。不要直接运行会影响现有 public schema 权限的旧服务器迁移。

后续已完成独立健康服务部署和真实 PostgreSQL / HTTPS / MCP 验证，详见 CLOUDBASE_DEPLOYMENT.md；后台永久 Key 已按用户明确授权创建。
