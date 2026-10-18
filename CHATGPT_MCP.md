# Apple Health 远程 MCP / ChatGPT 插件

## 地址与授权

远程 MCP：`https://healthsync.zgdnz.cc/health/mcp`

Casdoor：`https://auth.gz.zgdnz.cc/`

Casdoor 使用独立应用 `healthbridge-chatgpt`，回调地址必须精确为：
`https://healthsync.zgdnz.cc/health/auth/callback`

启用 Authorization Code、Refresh Token，允许 `openid profile offline_access`。服务端配置见受限目录 private/casdoor.env，必须指定组织和用户名白名单。仅匹配这一个账号且签名、有效期、issuer、应用 audience 均通过的登录可以读取此个人数据库。其他 Casdoor 用户不得读取。

MCP 与原 iOS 上传接口共用既有独立健康服务，手机地址和上传令牌保持不变。未登录无法列出或调用工具。MCP 使用 OAuth，不能使用 iPhone 上传令牌登录。

## 已创建的个人插件

[Apple Health 健康助手](https://chatgpt.com/plugins/Plugin_f43bea160bc48191ad525fd2c5ba9999)，版本 0.1.0，已上传到本人的 ChatGPT 账号；尚待本人完成连接和 Casdoor 授权，真实 ChatGPT 工具调用未验证。

## ChatGPT 创建与使用

1. 在网页 ChatGPT 的插件页面，添加自定义 MCP 服务器。
2. 名称 `Apple Health 健康助手`，URL 填上面的完整 `/mcp` 地址，身份验证选 OAuth。
3. 网关保留根 `/.well-known`，使用插件包中显式 OAuth 设置（或在高级设置手填）：
   - Authorization URL：`https://healthsync.zgdnz.cc/health/authorize`
   - Token URL：`https://healthsync.zgdnz.cc/health/token`
   - Registration URL：`https://healthsync.zgdnz.cc/health/register`
   - Authorization server：`https://healthsync.zgdnz.cc/health`
   - Resource：`https://healthsync.zgdnz.cc/health/mcp`
   - Client mode：DCR；Scopes：`openid profile offline_access`。
   不在 ChatGPT 填 Casdoor 上游 Client Secret。Secret 仅在自己的健康服务端。
   授权元数据可从 `/health/.well-known/oauth-authorization-server` 获取，资源元数据地址由 MCP 的 401 challenge 显式提供，均留在已路由的 `/health/` 前缀内。
4. 创建为个人插件并完成 Casdoor 登录及授权，确认可见三个只读工具。
5. 新对话中 @ 选择此插件，再询问健康记录。是否支持特定手机/网页/桌面入口及自定义插件由 ChatGPT 当前账号和工作区策略决定，不能保证每个入口均可用。

可移植插件包在 plugins/apple-health/，包含 plugin.json、mcp.json 和中文查询 skill。仓库包本身不等于已在 ChatGPT 账号注册安装。网页创建后的技术 ID 用于桌面端的注册 MCP 映射；不公开提交到插件目录。

## 工具

- `health_samples(metric_type,start,end,detail,limit,offset)`：默认 raw；可选择 daily_summary 或 all。返回单位不改变，保留来源。
- `health_workouts(start,end,limit,offset)`：运动记录。
- `health_sync_status(start,end,limit,offset)`：成功上传批次和计数，检查数据新鲜度。

必须传带时区的日期范围，limit 最大 200。过滤是在源分页后进行的，所以空页也可能有 has_more=true，继续使用 page.next_offset。历史每日聚合不能恢复为逐次测量；血氧记录不代表连续监测。

## 实现与维护

- FastMCP OAuthProxy 提供 OAuth 发现、DCR、PKCE、授权同意页面、令牌刷新和资源绑定；仍将 PKCE 转发给 Casdoor。
- Casdoor RS256 JWT 通过固定 JWKS 验签，并校验 issuer、audience、exp 和明确组织/用户名白名单。
- OAuth 状态在独立 healthbridge_mcp_oauth 表保存，值经 Fernet 加密，键 SHA256；加密密钥和 JWT 签名密钥只保存在服务端私密环境。
- 状态表受 RLS 保护，仅后台 service_role 可访问；迁移不修改现有应用对象。
- 不依赖容器本地磁盘保存登录状态；固定密钥与数据库状态确保重启后保留授权。
- 关闭 HEALTH_MCP_ENABLED 可禁用 MCP，手机上传接口保留。撤销连接可从 ChatGPT 断开及 Casdoor 撤销应用授权；上游尚有效的短期访问令牌可能持续到过期，紧急封禁需关闭 MCP 或调整服务端白名单/轮换签名密钥。
- 每次修改后运行 API 和 remote_mcp 测试，并验证真实 Casdoor 授权、令牌刷新及 ChatGPT 连接。不将合成种子授权测试冒充真实登录测试。

官方参考：[远程 MCP 授权](https://developers.openai.com/plugins/build/auth)、[ChatGPT 连接流程](https://developers.openai.com/plugins/deploy/connect-chatgpt)、[插件打包](https://developers.openai.com/plugins/build/plugins)。

## 本次部署验证（2026-10-19）

health-sync-api-006 已正常承接 100% 流量。27 项本地测试通过；公网 MCP 未登录返回 401，前缀内资源/授权发现 200，动态客户端注册 201，PKCE 授权跳转同意页 302。合成 Swift schema v2 上传、持久化、重复重试、清理和 v1 空连接测试通过。OAuth 加密状态跨存储适配器读取已验证。真实 Casdoor 登录、刷新及 ChatGPT 工具读取仍待本人授权后验证。
