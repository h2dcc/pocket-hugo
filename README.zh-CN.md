# PocketHugo

[English README](./README.md)

![Pocket-Hugo-手机效果](pockethugomobile.webp)

![Pocket-Hugo-PC效果](pockethugodesktop.webp)

PocketHugo 是一个浏览器优先的 GitHub Markdown 发布工具，核心围绕 Hugo 工作流设计，桌面浏览器体验最佳，同时也兼顾平板和手机使用。

Pocket publishing for Hugo across desktop, tablet, and phone.

- GitHub 仓库：[https://github.com/h2dcc/pocket-hugo](https://github.com/h2dcc/pocket-hugo)
- 主域名介绍页：[https://leftn.com](https://leftn.com)
- 应用入口：[https://leftn.com/app](https://leftn.com/app)
- 演示地址（Vercel）：[https://pockethugo.lawtee.com](https://pockethugo.lawtee.com)
- 演示地址（Cloudflare Workers）：[https://pocket-hugo.rpwi.workers.dev](https://pocket-hugo.rpwi.workers.dev)

## 当前支持的内容结构

PocketHugo 目前重点支持 3 种 Hugo 兼容结构：

1. `Bundle / Single index`
   例如：`content/posts/my-post-single/index.md`，图片与文章在同一目录。
2. `Bundle / Multilingual`
   例如：`content/posts/my-post/index.md`、`index.en.md`、`index.de.md`，图片与这些文件共享同一目录。
3. `Flat Markdown`
   例如：`content/posts/article.md`，文章直接作为 `.md` 文件放在 posts 路径下。

这三种模式都可以在首页 `Publishing Preferences -> Post Structure Mode` 中选择。

```text
content/
└── posts/
    ├── article.md                # 1. 单文件

    ├── my-post/                  # 2. 多语言 Bundle
    │   ├── index.md
    │   ├── index.en.md
    │   └── cover.jpg

    └── my-post-single/           # 3. 单语言 Bundle
        ├── index.md
        └── cover.jpg
```

|    | 单文件 | 单语言 Bundle | 多语言 Bundle |
|----|------|----------|----------|
| 配图 | ❌ | ✅ | ✅ |
| 多语言 | ❌ | ❌ | ✅ |
| 典型场景 | 随手写的短文 | 图文并茂的文章 | 国际化内容 |

## 明确不支持的情况

PocketHugo 不支持“图文分离”模式的图片管理，例如：

- Markdown 在一个目录，图片统一放在另一个全局目录
- 图片单独放在 `/images/2026/...` 这类归档目录
- 类似 CMS 媒体库那种与文章目录解耦的图片管理方式

也就是说，PocketHugo 更适合：

- Markdown 和图片资源放在同一目录
- 或者使用 `Flat Markdown`，但不依赖每篇文章单独图片目录

## 主要面向 Hugo，但不完全只限 Hugo

PocketHugo 的第一目标仍然是 Hugo，但如果其他静态站点生成器也满足上面的结构条件，同样可能适用。

可能适用：

- Astro 中使用 Markdown 内容目录，且文章与资源文件保持同目录
- Hexo 中将文章存为 Git 跟踪的 Markdown 文件
- 其他基于 frontmatter + Markdown + GitHub 文件提交的静态站点

不太适合：

- 依赖统一媒体库的系统
- 需要自动管理“正文在这里、图片在别处”的工作流
- 内容结构与 GitHub 文件目录无法直接对应的站点

## PocketHugo 的核心价值

PocketHugo 的目标是在尽量保留 Hugo 原生结构的前提下，降低浏览器写作和 GitHub 发布的阻力：

- 在电脑、平板、手机浏览器里写作和编辑
- 支持 3 种 Hugo 兼容结构模式
- 上传时自动压缩、转换和命名图片
- 草稿保存在浏览器里，可随时继续编辑
- 从 GitHub 重新载入已发布内容继续修改
- 一次性提交 Markdown 和相关资源文件

## 主要功能

### 文章工作流

- GitHub OAuth 登录
- 仓库 / 分支 / 文章目录路径选择
- 本地草稿保存与继续编辑
- 从 GitHub 拉回已发布文章再次编辑
- 发布前确认
- 发布结果页显示本次改动文件

### 基于结构模式的发布能力

- `Bundle / Single index`：点目录即可直接打开 `index.md`
- `Bundle / Multilingual`：先打开文章目录，再选择 `index.en.md`、`index.de.md` 等具体文件
- `Flat Markdown`：直接列出 posts 路径下的 `.md` 文件并进行编辑与发布

### 图片工作流

- 可选自动转换与压缩
- 可配置最大宽度与质量
- 可选自动命名（`1.webp`、`2.webp` 等）
- 一次最多批量上传 9 张
- 预览、复制文件名、插入 Markdown、设为封面、删除图片

注意：

- 图片能力主要面向 bundle 类结构，也就是 Markdown 和资源文件在一起的情况。
- 在 `Flat Markdown` 模式下，PocketHugo 不负责为你管理独立图片目录。

### 编辑体验

- 浏览器优先，桌面体验更强
- 平板和手机也可继续接力使用
- 各区域支持折叠
- 正文支持 `/` 调出 Slash 命令
- Markdown 预览
- 自动保存 + 手动保存
- 浅色 / 深色主题切换
- 中英双语切换

### 页面编辑

- Standalone Page 模式
- Quick Timeline 模式
- 快速发布“说说”
- 时间线内容一键转文章草稿

## 架构与隐私

PocketHugo 采用本地优先思路：

- 草稿和偏好保存在浏览器中
- 会话和配置通过加密 Cookie 保存在用户侧
- 服务端不维护文章内容数据库
- GitHub Token 只在服务端调用 GitHub API 时使用

## 技术栈

- Next.js（App Router）
- React + TypeScript
- GitHub OAuth + GitHub API
- OpenNext + Cloudflare Workers

## 环境要求

- 推荐 Node.js `22+`
- npm

## 本地开发

```bash
npm install
npm run dev
```

创建 `.env.local`：

```env
APP_URL=http://localhost:3000
APP_SESSION_SECRET=replace-with-a-long-random-secret
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

## 本地仓库模式

PocketHugo 也提供一个仅用于本机的本地仓库模式，适合桌面端测试或个人本地写作流程。

- 不使用 GitHub 登录
- 直接读写你电脑上的本地仓库
- 只用于本地环境

示例：

```env
APP_URL=http://localhost:3000
APP_SESSION_SECRET=replace-with-a-long-random-secret
GITHUB_CLIENT_ID=dummy
GITHUB_CLIENT_SECRET=dummy
LOCAL_REPO_MODE=true
LOCAL_REPO_ROOT=D:/Hugo/my-blog
```

可选：

```env
LOCAL_POSTS_BASE_PATH=content/posts
```

说明：

- 当 `LOCAL_REPO_MODE=true` 时，localhost 的 `/` 会直接进入 `/app`
- 这个模式使用本地仓库文件，不走 GitHub API
- 这是额外提供的一种本地方案，不是对 GitHub 方案的替代
- 仅仅执行 `npm run dev` 并不代表不能使用 GitHub 方案；只要关闭本地模式，本地开发环境里仍然可以继续使用原有的 GitHub 登录与发布流程

## GitHub OAuth 配置

进入：

`GitHub -> Settings -> Developer settings -> OAuth Apps -> New OAuth App`

然后：

1. 填写 `Application name`
2. 填写 `Homepage URL`
3. 填写 `Authorization callback URL` 为 `https://your-domain/api/auth/callback`
4. 注册应用
5. 复制 `Client ID` 到 `GITHUB_CLIENT_ID`
6. 生成 `Client Secret` 并写入 `GITHUB_CLIENT_SECRET`

## 环境变量

必须：

- `APP_URL`
- `APP_SESSION_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

可选：

- `LANDING_PAGE_HOSTS`
- `LOCAL_REPO_MODE`
- `LOCAL_REPO_ROOT`
- `LOCAL_POSTS_BASE_PATH`

生成 `APP_SESSION_SECRET` 示例：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Vercel 示例

```env
APP_URL=https://pockethugo.lawtee.com
APP_SESSION_SECRET=replace-with-a-long-random-secret
GITHUB_CLIENT_ID=your-vercel-oauth-client-id
GITHUB_CLIENT_SECRET=your-vercel-oauth-client-secret
```

### Cloudflare Workers 示例

```env
APP_URL=https://leftn.com
APP_SESSION_SECRET=replace-with-a-long-random-secret
GITHUB_CLIENT_ID=your-workers-oauth-client-id
GITHUB_CLIENT_SECRET=your-workers-oauth-client-secret
LANDING_PAGE_HOSTS=leftn.com,www.leftn.com
```

### 首页介绍页逻辑

- 当请求域名命中 `LANDING_PAGE_HOSTS` 时，根路径 `/` 显示介绍页
- `/app` 永远直接进入应用
- 如果当前域名不在 `LANDING_PAGE_HOSTS` 中，则 `/` 会直接进入应用

## 部署

### Vercel

```bash
npm run build:vercel
```

### Cloudflare Workers

```bash
npm run build:cloudflare
```

## 安全建议

- 不要提交 `.env.local`
- 一旦泄露密钥，立即轮换 `GITHUB_CLIENT_SECRET`
- 使用足够强的 `APP_SESSION_SECRET`
- OAuth 回调地址务必使用正式域名

## 许可证与说明

PocketHugo 采用 MIT License 发布。

PocketHugo 是一个独立项目，基于 Next.js、React、TypeScript、GitHub API 以及面向 Cloudflare Workers 的 OpenNext 等技术构建，主要面向 Hugo 兼容发布工作流，同时也可适配部分 Hexo、Astro 等基于 frontmatter 的 Markdown 工作流。

PocketHugo 与 Hugo、Vercel、GitHub、Cloudflare 等项目或公司不存在隶属或背书关系。

项目所使用的第三方库、框架及相关资产，仍分别遵循其各自许可证。
