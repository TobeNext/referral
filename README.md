# Referral Demo

这是一个面试/演示级邀请返利系统：Alice 生成唯一邀请链接，新用户仅用姓名和邮箱注册；每个首次成功邀请在同一数据库事务中为 Alice 增加 100 Credit，并留下推荐关系与奖励流水。

## 一键启动

前置条件：Docker Desktop（含 Docker Compose）。

```powershell
docker compose up --build -d
docker compose ps
```

打开 <http://localhost:3000>。API 健康检查为 <http://localhost:3000/api/health>，Swagger 为 <http://localhost:3000/api/docs>。

两个容器职责分离：`web` 使用 Nginx 托管 React SPA 并代理 `/api`；`api` 运行 NestJS、TypeORM migration、Alice 幂等 seed，并将 SQLite 文件存入专用 named volume `referral-demo-data`。

## 演示流程

1. 首页点击“生成邀请链接”，再点击“复制邀请链接”。
2. 在新标签页打开链接，用 Bob / `bob@example.com` 注册。
3. 回到首页刷新，确认余额为 100、出现 Bob 记录。
4. 再次打开同一链接，用 Charlie / `charlie@example.com` 注册。
5. 首页刷新后应为 200 Credit 和两条记录。
6. 再用 Bob 邮箱提交，页面应提示邮箱已注册，余额保持 200。
7. `docker compose restart` 后刷新首页，数据仍应存在。

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
pnpm dev
```

Vite 在 5173，NestJS 在 3001。配置参考 `.env.example`。`REFERRAL_REWARD_CREDITS` 必须是正整数；TypeORM 固定 `synchronize: false`，数据库只通过 migration 演进。

## 明确不包含

登录/权限、邮件短信、Credit 消费或撤销、邀请码过期/轮换、风控、管理后台、多级分销、Redis、消息队列、高可用数据库与生产监控均不在本 Demo 范围。
