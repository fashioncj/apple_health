# 官方后端 + CloudBase 存储适配 + MCP

## 代码边界

- `backend/app.py` 保留官方 HTTP 路由、请求/响应模型、综合健康数据拼装与官方汇总函数。仅增加可选 `storage_adapter` 和安全依赖注入点；默认仍是原 SQLAlchemy 实现，原后端测试继续运行。
- `cloudrun/health-sync-api/official_storage.py` 实现官方仓储函数接口，通过既有数据库网关存取健康数据。MCP 的数据查询也调用此适配层，不再另走一套查询语义。
- `cloudrun/health-sync-api/app.py` 仅装配官方应用、安全限制、CloudBase 凭证、就绪检查和 MCP 生命周期。旧的独立上传/列表路由已删除。
- Casdoor OAuth、加密授权存储和只读 MCP 保留。普通上传 token 仍不能读取；只读 token 不能上传。

## 存储与兼容

不搬迁已有健康数据或 OAuth 状态，不使用官方全局 Alembic 迁移覆盖共享 CloudBase public schema。增量迁移仅新增 `healthbridge_read_official`、`healthbridge_catalog` 两个服务端 RPC；原表、上传 RPC 和删除墓碑保留。

官方路由现在可用：`/api/agent/health-data`（catalog + 分页明细 + 官方每日汇总）、`/api/apple-health/{metrics,workouts,syncs}` 和原 `/api/agent/{metrics,workouts,syncs}`。后端仍为个人 self_hosted 工作区；商业 hosted 工作区创建、重置和租户令牌管理不对外开放。设备 label 未独立持久化，catalog 返回 null。不是官方多租户托管产品的完整替代。

官方查询的时间语义：样本 start_at >= from 且 end_at <= to；批次按导出日期范围重叠筛选，非接收时刻。MCP 跟随此语义。每日汇总复用官方函数，优先已有每日聚合；不会把聚合还原为原始测量。数据库排序使用时间、设备、ID稳定分页；分页期间发生新写入仍可能改变 offset 结果，和官方一样不保证快照。

## 构建与回滚

`python3 scripts/prepare_cloudrun_context.py <新的输出目录>` 生成白名单 Docker 上下文，把仓库中的同一套 backend/*.py 打进镜像；不提交维护第二份 vendor 源码，不包含 private、env、迁移或健康数据。部署该目录沿用原健康服务的环境变量、8080端口和 /ready 探针。

旧版本 006 的镜像可回滚；新增两个只读 RPC 可以留存，旧服务不调用它们。禁止反向删表或清除 OAuth 状态。

## 2026-11-01 验证

- 本地合成测试：60 passed，含原后端28项、上传协议、权限隔离、官方综合查询、501条跨页汇总、MCP复用存储端口。
- 真实 CloudBase 合成验证：上传、重复重试、相同时间稳定分页、设备筛选、官方综合汇总及清理全部通过。
- 迁移已在远端历史确认；无既有表结构变更。
- 白名单镜像上下文已成功导入官方应用。代码审阅确认没有请求头、环境变量或平台临时凭证回显，新函数仅授予service_role。

## 后续同步

iOS 完全跟随官方，上游业务更新直接合入 backend；只维护应用工厂的小型注入点、CloudBase port、SQL RPC和MCP。每次检查官方 schemas/repository/app 变化是否要求适配接口更新，运行官方后端与CloudBase契约测试。不要再次增加平行HTTP业务实现。

## 已发布结果

2026-11-01 health-sync-api-007 已上线，100%流量。公网合成上传/重复重试/读取/稳定分页/官方综合汇总/读写令牌隔离全部通过，合成样本已删除。现有ChatGPT OAuth连接成功调用MCP同步状态工具，只查询2050年合成发布批次，未读取个人健康样本。

服务地址、上传/读取token、Casdoor回调和MCP地址沿用原配置。main仍未合并；部署源码来自refactor/cloudbase-official-backend维护分支。每日任务已改为跟踪此基线并检查上游存储port契约，不自动部署。
