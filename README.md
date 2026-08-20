# Referral Demo

这是一个面试/演示级邀请返利系统：用户通过邮箱密码与 JWT 登录，生成不暴露用户信息的随机短 token 邀请链接；新用户通过链接注册后获得仅显示一次的随机临时密码，首次登录必须改密。每个首次成功邀请仍在同一数据库事务中增加 100 Credit，并留下推荐关系与奖励流水。

## 一键启动

前置条件：Docker Desktop（含 Docker Compose）。

```powershell
docker compose up --build -d
docker compose ps
```

打开 <http://localhost:3000/login>。默认 Demo 账号为 `alice@example.com` / `AliceDemo1234`（可通过 `DEMO_INVITER_PASSWORD` 覆盖）。API 健康检查为 <http://localhost:3000/api/health>，Swagger 为 <http://localhost:3000/api/docs>。

两个容器职责分离：`web` 使用 Nginx 托管 React SPA 并代理 `/api`；`api` 运行 NestJS、TypeORM migration、Alice 幂等 seed，并将 SQLite 文件存入专用 named volume `referral-demo-data`。

## 演示流程

1. 使用 Alice Demo 账号登录，点击“生成邀请链接”，再点击“复制链接”；URL 应为 `/i/{12位随机token}`。
2. 在无痕窗口打开链接，用 Bob / `bob@example.com` 注册，立即保存只显示一次的临时密码。
3. 用 Bob 邮箱和临时密码登录；系统强制进入密码重置页，完成后才能进入 Dashboard。
4. 回到 Alice 首页刷新，确认余额为 100、出现 Bob 记录。
5. 再次打开同一链接，用 Charlie 注册，Alice 应为 200 Credit 和两条记录。
6. 再用 Bob 邮箱提交，页面应提示邮箱已注册，余额保持 200。
7. `docker compose restart` 后重新登录，密码和奖励数据仍应存在。

## 认证与安全边界

- JWT 通过 `Authorization: Bearer` 发送，前端仅保存在当前标签会话的 `sessionStorage`；默认 30 分钟过期。
- 服务端每次鉴权都回查用户的 `authVersion` 和首次改密状态；改密后旧 token 立即失效。
- 密码使用 bcrypt 哈希，临时密码、密码哈希和 JWT 不写日志；错误登录统一返回“账号或密码错误”。
- 公开邀请 token 是随机数据库引用，不编码用户 ID、姓名或邮箱。生产环境应替换 `JWT_SECRET`，并用邮件等受控渠道交付临时凭据。

## 验证

```powershell
pnpm install --frozen-lockfile
pnpm verify
pwsh -File scripts/Verify-RunningDemo.ps1
docker compose logs api
```

真实浏览器 smoke 使用 Playwright CLI：

```powershell
npx --yes --package @playwright/cli playwright-cli open http://127.0.0.1:3000
npx --yes --package @playwright/cli playwright-cli snapshot
```

每次导航或页面大幅变化后重新 `snapshot`，再使用快照中的 element ref 执行 `click`、`fill` 和 `screenshot`。交付截图位于 `output/playwright/`。

## 日志与排障

API 输出 `app.started`、`invitation.created/reused`、`referral.accept.started/committed/rejected/rolled_back` 和 `http.request.completed`。每个 HTTP 响应的 `X-Request-Id` 与日志 requestId 对应；业务日志不记录完整邀请人邮箱。

若本机设置了 `HTTP_PROXY`，验证 localhost 时使用 `curl.exe --noproxy '*' http://127.0.0.1:3000/api/health`，避免代理造成连接提前结束。

## 数据重置

普通 `docker compose down` 或 `restart` 不删除数据。仅需重新演示干净环境时运行：

```powershell
pwsh -File scripts/Reset-Demo.ps1
docker compose up --build -d
```

重置脚本在删除前校验目标必须是 Compose 项目 `referral-demo` 的专用 volume `referral-demo-data`；不会删除其他 volume。删除后数据不可恢复。

## 本地开发

```powershell
pnpm install
$env:DATABASE_PATH = './referral.sqlite'
$env:PUBLIC_WEB_BASE_URL = 'http://localhost:5173'
$env:JWT_SECRET = 'local-development-secret-at-least-32-characters'
$env:DEMO_INVITER_PASSWORD = 'AliceDemo1234'
pnpm dev
```

Vite 在 5173，NestJS 在 3001。配置参考 `.env.example`。`REFERRAL_REWARD_CREDITS` 必须是正整数；TypeORM 固定 `synchronize: false`，数据库只通过 migration 演进。

## 明确不包含

Refresh Token、忘记密码、邮件短信交付、OAuth/RBAC、Credit 消费或撤销、邀请 token 过期/轮换、风控、管理后台、多级分销、Redis、消息队列、高可用数据库与生产监控均不在本 Demo 范围。
