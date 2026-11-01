# Health Bridge：上游 iOS 客户端 + 独立健康后端

当前候选的 `HealthSync/`、`HealthSync.xcodeproj/`、`Tests/HealthSyncTests/` 与上游 main `eaa53fe1e6e9bbc5749b69194b8fcf4ff2f849c1` 完全一致，不再维护 iOS 定制。

## iOS 配置

- 存储目标选择 My own backend，配置独立健康服务的地址和上传令牌。
- 历史同步需要逐条血氧/HRV时，选择 Original blood oxygen & HRV；上游默认 Daily summaries。
- 其他数量指标历史回填按上游策略聚合；睡眠阶段、类别和运动保持明细。多个数据源可能重叠。
- 血氧是离散采样。上游使用 HealthKit percent() 的 0..1 值，上传字段为 percent（如0.975代表97.5%）；不要把它当成 literal 0.975%。旧定制客户端也可能留下 fraction 记录。后端保留上传单位和值，不改写历史数据。

## 后端与查询

CloudBase 独立服务、数据库迁移、Casdoor 远程 MCP 和个人插件仍为自有实现，与客户端独立维护。配置和部署见 CLOUDBASE_SETUP.md、CLOUDBASE_DEPLOYMENT.md；查询见 CHATGPT_MCP.md。

本次仅推送候选分支，未合并 main 或部署。私密配置不在仓库中。
