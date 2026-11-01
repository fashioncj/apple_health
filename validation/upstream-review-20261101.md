# 上游合并候选：2026-11-01

候选分支：sync/upstream-eaa53fe1e6e9bbc5749b69194b8fcf4ff2f849c1
上游：megabyte0x/healthykit main eaa53fe1e6e9bbc5749b69194b8fcf4ff2f849c1
基于自有 main aa8bc38；只在独立克隆中合并，未修改原工作区、main 或部署。

## 采用的更新

- PR #11（378b654）已包含我们提交的原始血氧/HRV 历史回填能力，以及有界锚点分页、时间边界、取消、上传失败和异常锚点处理。
- PR #12：原后端 agent 列表返回 workspace_id，要求明确工作区，并用确定性排序改善分页；保留我们的删除墓碑实现。
- 上游官网 Cloudflare Pages 配置、规范域名重定向和 agent API 文档更新随 Git 历史合入；未发布官网，未验证官网构建。

## 冲突解决

HealthKitManager 的冲突仅涉及历史聚合策略。按用户最新指示，删除本地“所有历史数量指标强制逐条”的重复覆盖，策略函数与分页读取使用上游实现。血氧/HRV 原始模式默认启用；其他数量指标按日统计。睡眠阶段、类别、运动保持上游明细行为。

保留 Health Bridge 的自建默认配置、HTTPS/禁止重定向、独立读写令牌、SpO₂ fraction、来源/设备 metadata、增量每页1000条与队列/游标、删除墓碑、CloudBase 数据库/API 和 Casdoor MCP。cloudrun、cloudbase、plugins、bridge 与原 main 无差异。

## 验证

- CloudBase API + 远程 MCP：27 passed（模拟存储与合成授权，不连接线上）。
- 原 Python 后端：28 passed，1 项依赖弃用警告。
- Swift 实际归一化/JSON roundtrip：通过，保留亚秒时间、来源、SpO₂ fraction。
- Xcode 无签名 build-for-testing：通过，应用与测试目标均编译。
- iOS 27.1 专用模拟器：112 passed，0 failed，1 skipped。跳过的是 PhysicalWorkoutValidationTests.testExistingWorkoutsMatchHealthKitStatistics，需要显式启用的真机既有运动验证；未访问真实健康数据。
- 首次无签名模拟器运行无法连接测试进程；最终新建专用模拟器并使用本地临时签名后完整执行成功。未使用企业/发布证书。
- 无冲突标记，git diff --check 通过。

本次不会合并 main、部署 CloudBase 或运行数据库迁移；需用户审阅候选后另行决定。
