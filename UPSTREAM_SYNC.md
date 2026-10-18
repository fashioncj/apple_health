# 上游同步与发布方案

## 来源和分支

- 自有仓库：git@github.com:fashioncj/apple_health.git（origin）。
- 上游： https://github.com/megabyte0x/healthykit（upstream，只拉取，禁用推送）。
- 初始基线：`72cadcda356048296a86b7271d3fd5b9281e9d38`，标签 `upstream-baseline-2026-10-17`。
- 保留完整上游历史和 Apache-2.0 许可证；基线后的自有提交记录 HealthKit 和 CloudBase 定制。
- main：经过验证的自有版本。初始自有版本标签 `healthbridge-cloudbase-v0.1.0`。
- sync/upstream-<完整上游SHA>：每日任务在临时克隆中将最新 upstream/main 合并到 origin/main 后建立的候选分支；不强制推送，不覆盖 main。

## 每天北京时间 09:00

本聊天的 Codex 定时任务执行 `scripts/sync_upstream.sh`，检查上游。已有候选分支时不重复创建。没有变化时保持安静；有新变化、冲突、测试失败或访问失败时报告。
脚本只同步 Git 代码；不会访问健康数据或部署 CloudBase。运行需要本机 Codex 可运行、网络及 GitHub SSH 可用。

候选分支创建后，由 Codex 检查上游差异，并运行 CloudBase API 测试、原 Python 后端测试、Swift 序列化验证及 Xcode 无签名构建。合并冲突或任何验证失败都停止，保留 main 和线上版本。

## 合并前的兼容性要求

1. 保留五类逐条样本、原始时间/来源、SpO₂ fraction 单位，不聚合历史样本，不把离散血氧称为连续监测。
2. 保留 SQLite 队列、增量游标、后台尽力执行、失败重试和删除墓碑。
3. 保留自托管默认值、独立上传/读取令牌、HTTPS/禁止重定向。
4. CloudBase 代码和 SQL 为自有实现；禁止用上游 backend 或全局权限迁移覆盖。数据库迁移仅追加、仅健康对象。
5. private/、环境文件、健康样本和密钥不能提交；测试使用合成数据。

有可用更新时报告候选分支、上游提交、功能/修复、兼容性及测试结果；确认采用后才合并 main 和发布。代码同步不等于 iOS 更新，iOS 仍需重新编译安装。

## 人工操作

```sh
git fetch upstream
git log --oneline main..upstream/main
sh scripts/sync_upstream.sh
```

本地 main 更新前先确认工作区干净，再 `git pull --ff-only origin main`。不要使用 reset --hard 或强制推送覆盖本地改动。

回退应用代码通过 revert 提交；CloudBase 可切回已记录的旧镜像版本。数据库迁移先审查和备份，不能通过 Git 回退直接反向删表。初始部署镜像信息见 CLOUDBASE_DEPLOYMENT.md。
