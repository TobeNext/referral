# Referral Demo

这是一个面试/演示级邀请返利系统：用户通过邮箱密码与 JWT 登录，生成不暴露用户信息的随机短 token 邀请链接和邀请码；新用户可直接通过链接注册（无需填写邀请码），也可在 `/register` 输入邀请码注册。注册后会获得仅显示一次的随机临时密码，首次登录必须改密。每个首次成功邀请仍在同一数据库事务中增加 100 Credit，并留下推荐关系与奖励流水。

## 如何在本地运行项目

### 方式一：Docker 一键运行（推荐）

前置条件：已安装并启动 Docker Desktop（包含 Docker Compose）。在项目根目录执行：

```powershell
docker compose up --build -d
docker compose ps
```

当 `api` 和 `web` 均显示为 `healthy` 后，访问：

- 登录页：<http://localhost:3000/login>
- API 健康检查：<http://localhost:3000/api/health>
- Swagger：<http://localhost:3000/api/docs>

默认 Demo 账号为 `alice@example.com` / `AliceDemo1234`。如需覆盖密码，可在启动前设置环境变量：

```powershell
$env:DEMO_INVITER_PASSWORD = 'YourDemoPassword123'
docker compose up --build -d
```

Docker 模式包含两个职责分离的容器：`web` 使用 Nginx 托管 React SPA，并把 `/api` 反向代理到 `api:3001`；`api` 启动 NestJS、自动执行 TypeORM migration 和 Alice 幂等 seed。SQLite 数据保存在专用 named volume `referral-demo-data` 中，因此普通 `restart` 或 `down` 不会丢失数据。

停止项目：

```powershell
docker compose down
```

### 方式二：本地开发模式

前置条件：Node.js、pnpm 11。项目根目录的 `package.json` 固定使用 `pnpm@11.22.0`。

```powershell
pnpm install --frozen-lockfile
$env:DATABASE_PATH = './referral.sqlite'
$env:PUBLIC_WEB_BASE_URL = 'http://localhost:5173'
$env:JWT_SECRET = 'local-development-secret-at-least-32-characters'
$env:DEMO_INVITER_PASSWORD = 'AliceDemo1234'
pnpm dev
```

开发模式下：

- React/Vite：<http://localhost:5173>
- NestJS API：<http://localhost:3001/api>
- Swagger：<http://localhost:3001/api/docs>

Vite 会将浏览器发出的 `/api` 请求代理到 NestJS。其他配置可参考 `.env.example`；`REFERRAL_REWARD_CREDITS` 必须为正整数。TypeORM 固定使用 `synchronize: false`，数据库结构只通过 migration 演进。

## 项目的整体设计思路

### 1. 分层与职责边界

项目采用 pnpm workspace 管理的前后端分离结构，保持演示系统足够简单，同时把界面、业务规则和数据一致性分别放在明确的边界中：

```text
浏览器
  └─ React 19 + React Router + TanStack Query（apps/web）
       └─ /api HTTP + Bearer JWT
            └─ NestJS 11（apps/api）
                 ├─ Auth：登录、首次改密、JWT 校验
                 ├─ Invitations：创建或复用邀请 token、公开查询邀请人
                 ├─ Referrals：受邀注册、推荐关系、奖励事务
                 ├─ Users：当前用户与推荐汇总
                 └─ TypeORM + SQLite：持久化与 migration
```

- `apps/web` 只负责页面、路由、会话状态、表单校验和 API 调用，不直接接触数据库。
- `apps/api` 是业务规则和安全边界，统一使用 `/api` 前缀，并通过 DTO 校验、Guard、异常过滤器和请求日志处理 HTTP 请求。
- `contracts/openapi.yaml` 保存对外 API 契约；运行时 Swagger 位于 `/api/docs`。
- Docker 部署时仅向宿主机暴露 Nginx 的 `3000` 端口，API 通过 Compose 内部网络提供给 Nginx。

### 2. 核心数据模型

系统围绕四张表组织数据：

- `users`：用户身份、密码哈希、首次改密状态、认证版本和 Credit 余额。
- `invitations`：每个邀请人最多一条邀请记录，保存不含用户信息的 12 位随机 token。
- `referrals`：记录邀请人、受邀人、使用的邀请及本次奖励；一个受邀人只能产生一条推荐关系。
- `credit_transactions`：记录每笔推荐奖励及奖励后的余额；一条推荐只能对应一笔奖励流水。

唯一约束、外键和金额检查约束与服务层事务共同保证“一次有效注册只奖励一次”。SQLite 开启 WAL；Schema 由启动时自动执行的 TypeORM migration 管理，避免运行时自动同步造成结构漂移。

### 3. 核心业务链路

```text
Alice 登录
  → 创建或复用自己的 12 位邀请 token
  → 分享 /i/{token} 或直接分享邀请码
  → Bob 提交姓名和邮箱
  → API 在同一数据库事务中：
       创建 Bob 用户（临时密码 + 必须改密）
       → 写入 referral
       → Alice 增加 Credit
       → 写入 credit transaction
  → 返回只展示一次的临时密码
  → Bob 首次登录后被强制改密
```

受邀注册是最重要的一致性边界。创建用户、推荐关系、余额变更和奖励流水全部成功才提交；任何一步失败都会整体回滚。服务还会规范化邮箱与 token，并依靠数据库唯一约束处理重复邮箱或并发重复提交。

### 4. 认证与前端状态设计

- 登录成功后，JWT 只存放在当前标签页的 `sessionStorage`，前端请求统一附带 `Authorization: Bearer`。
- JWT 包含用户 ID、首次改密状态和 `authVersion`；服务端每次鉴权仍会查询用户，改密后旧 token 会立即失效。
- React Router 区分公开路由（登录、注册、邀请页）与受保护路由（Dashboard、改密页）；`RequireAuth` 同时处理登录态和强制改密跳转。
- TanStack Query 管理服务端数据，React Hook Form + Zod 管理表单输入，避免把服务端状态与页面临时状态混在一起。

### 5. 可观测性与运行方式

每个请求都有 `X-Request-Id`，并可与结构化业务日志中的 `requestId` 对应。关键事件覆盖应用启动、邀请创建/复用，以及推荐事务的开始、提交、拒绝和回滚。项目既支持 Vite + NestJS 的本地开发模式，也支持 Nginx + NestJS + SQLite volume 的 Docker 演示模式，两种方式复用同一套业务模块与数据库 migration。

## 演示流程

1. 使用 Alice Demo 账号登录，点击“生成邀请链接与邀请码”；可以复制 `/i/{12位随机token}` 链接，也可以复制同一个 12 位 token 作为邀请码。
2. 在无痕窗口打开链接，用 Bob / `bob@example.com` 注册，立即保存只显示一次的临时密码。
3. 用 Bob 邮箱和临时密码登录；系统强制进入密码重置页，完成后才能进入 Dashboard。
4. 回到 Alice 首页刷新，确认余额为 100、出现 Bob 记录。
5. 再次打开同一链接，用 Charlie 注册，Alice 应为 200 Credit 和两条记录。
6. 再用 Bob 邮箱提交，页面应提示邮箱已注册，余额保持 200。
7. `docker compose restart` 后重新登录，密码和奖励数据仍应存在。

邀请码注册的演示入口为 <http://localhost:3000/register>。直接打开邀请链接时，注册表单不会要求重复填写邀请码。

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

## 明确不包含

Refresh Token、忘记密码、邮件短信交付、OAuth/RBAC、Credit 消费或撤销、邀请 token 过期/轮换、风控、管理后台、多级分销、Redis、消息队列、高可用数据库与生产监控均不在本 Demo 范围。

## 开发过程中做出的设计取舍：
根据时间的限制
舍：
1. 前台BFF没有进行设计，接口冗余度高；
2. 后台并没有按照服务进行不同的拆分；
3. Docker打包并没有对镜像进行更好的压缩。
4. 监控日志仅输出在控制台
5. 对于当前系统每日credit的风控限制

取：
1. 搭建了项目的Harness体系，完成AI可以获取更高质量信源，Coding以及自动化UI测试。
2. 最小化完成了用户登录，注册，邀请记录，Credit余额和变更，dashboard，邀请统计等功能，可用新用户进行注册邀请。
3. 邀请链接不包含用户个人信息，产生随机token进行替代，保证用户隐私。
4. 加入swagger，使得全局api可验证与统一性。
5. 加入CI/CD gate，包含lint格式，测试，安全等相关内容，保障后续每一步的质量。

## 使用的AI工具：
1. Codex + Skill + MCP(已配置)

## 有更多时间，继续完善哪些内容：
1. 搭建完整的分布式系统的监控与日志链路，采用 opentelemerty + tempo + grafana 实现。
2. 完善开发工程中的舍的内容。
3. 更加细化CI/CD门禁，具体统一命名规范等相关内容。
4. 进一步处理 ...\referral\.agents\maintenance 内的相关技术债。
5. 从产品的角度完善 credit 消费逻辑，在逻辑中添加被邀请者使用后才可获得credit以及每日的credit上限，防止刷credit。
6. 从设计的角度优化当前的页面展示，删除一些过度添加的词语。

## 时间统计：

总体：2个小时左右
方案设计 + Harness搭建 + CI/CD： 40%
Agentic Coding + Test: 60%