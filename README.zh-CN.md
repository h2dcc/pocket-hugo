# PocketHugo

[English README](./README.md)

PocketHugo 是一个面向 Hugo 用户、适合手机和浏览器使用的写作与发布工具。

它适合下面这些场景：

- 想在手机上直接写或改 Hugo 文章
- 希望保留 Hugo page bundle 的原生目录结构
- 上传图片时自动压缩、缩放、转换格式
- 从 GitHub 读取已发布文章继续编辑
- 编辑完成后直接发布回指定 Hugo 仓库

## 项目简介

PocketHugo 把 Markdown 编辑、图片处理和 GitHub 发布流程整合到一个 Web 应用里。

当前核心功能包括：

- 首页 GitHub 登录
- 选择目标仓库、分支和 Hugo 文章目录
- 本地草稿保存与继续编辑
- 从 GitHub 读取已发布文章重新编辑
- 上传图片时按偏好进行压缩、缩放和 WebP 转换
- 设置封面图、插入图片、删除图片
- 将 `index.md` 和本次修改资源一次性提交到 GitHub
- 重新发布已发布文章时，可同步删除远程仓库中被移除的图片
- 支持深色 / 浅色模式与中英文切换

## 为什么做这个项目

Hugo 本身非常适合静态博客，但手机端写作和发布体验往往并不好。

常见问题包括：

- GitHub 网页端不适合长时间编辑 Markdown
- 通用 CMS 容易破坏 Hugo page bundle 结构
- 图片上传、整理、压缩很麻烦
- 小改动也要走一遍繁琐的 Git 流程

PocketHugo 的目标不是替换 Hugo，而是在不破坏 Hugo 原生内容结构的前提下，把日常写作和发布流程变得更轻松。

## 内容结构

PocketHugo 围绕 Hugo page bundle 设计。

发布结果通常像这样：

```text
content/posts/2026-03-13-my-post/
  index.md
  1.webp
  cover.webp
```

更具体的结构对比和优点说明，放在下一节统一介绍。

## 为什么 Page Bundle 更适合这个项目

PocketHugo 是刻意围绕 Hugo 原生的 page bundle 结构来设计的，而不是采用更常见的“文章和图片分离存放”模式。

Hugo page bundle 结构通常像这样：

```text
content/posts/2026-03-13-my-post/
  index.md
  cover.webp
  1.webp
  2.webp
```

而常见的图文分离结构通常像这样：

```text
content/posts/2026-03-13-my-post.md
static/uploads/2026/03/cover.webp
static/uploads/2026/03/1.webp
static/uploads/2026/03/2.webp
```

Hugo 这种 page bundle 结构的优点非常明显：

- 一篇文章和它的图片天然放在同一个文件夹里
- 移动、复制、重命名、删除文章时更安全
- 很容易看清楚“这篇文章到底用了哪些图片”
- 图片引用路径更稳定，不容易写乱
- Git 仓库历史也更清晰，因为一篇文章通常就对应一个目录
- 这本来就是 Hugo page resources 的原生工作方式，和 Hugo 自身设计最匹配

对手机端发布来说，这一点尤其重要：你越不需要手动整理文件，就越不容易把图片路径弄错、把资源放乱，或者发到错误的位置。

## 技术栈

- Next.js App Router
- React
- TypeScript
- GitHub OAuth
- GitHub Contents / Git Trees API

## 本地开发

推荐 Node.js 版本：

```text
22 LTS
```

这个项目使用 Next.js 16。虽然框架最低要求是 Node.js 20.9+，但在本地 Windows 开发环境中，更推荐使用 Node 22 LTS，避免较新的 Node 版本触发原生模块加载问题。

安装依赖：

```bash
npm install
```

如果你之前是在其他 Node 版本下安装过依赖，切换 Node 版本后请先删除本地依赖再重新安装：

```bash
Remove-Item node_modules,.next,package-lock.json -Recurse -Force
npm install
```

创建 `.env.local`：

```env
APP_URL=http://localhost:3000
APP_SESSION_SECRET=替换成足够长的随机字符串
GITHUB_CLIENT_ID=你的 GitHub OAuth Client ID
GITHUB_CLIENT_SECRET=你的 GitHub OAuth Client Secret
```

启动开发环境：

```bash
npm run dev
```

打开：

```text
http://localhost:3000
```

## GitHub OAuth 配置

创建 GitHub OAuth App 后，本地测试建议这样填写：

- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/auth/callback`

正式上线后，再改成你的线上域名。

当前代码实际需要的环境变量是：

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `APP_URL`
- `APP_SESSION_SECRET`

## Vercel 部署

PocketHugo 可以直接部署到 Vercel。

### 一键安装

```text
这里后续补充你的 Vercel 一键部署链接
```

### 必要环境变量

导入到 Vercel 后，在 Project Settings -> Environment Variables 中填写：

```env
APP_URL=https://你的线上域名.vercel.app
APP_SESSION_SECRET=替换成足够长的随机字符串
GITHUB_CLIENT_ID=你的 GitHub OAuth Client ID
GITHUB_CLIENT_SECRET=你的 GitHub OAuth Client Secret
```

### GitHub OAuth 回调地址

拿到 Vercel 正式域名后，把 GitHub OAuth 回调改成：

```text
https://你的线上域名.vercel.app/api/auth/callback
```

### 部署后建议测试

推荐重点检查：

- GitHub 登录是否正常
- 仓库列表能否读取
- 分支和文章目录能否保存
- 新建草稿是否正常
- 重新发布文章时是否只提交预期文件
- 删除远程图片后重新发布，GitHub 仓库中对应图片是否被正确删除

## 发布行为说明

发布时：

- `index.md` 会根据当前编辑器内容重新生成
- 新上传或被修改过的资源会一起进入同一个 Git commit
- 未修改的远程图片不会被空内容覆盖
- 如果你删除了已发布文章中的远程图片，重新发布时会同步删除 GitHub 仓库中的对应文件

## 界面特性

- 手机优先布局
- 可折叠的设置区和编辑区
- 简单 Markdown 工具栏
- Markdown 预览
- 发布前确认
- 发布成功页显示本次改动文件列表

## 项目结构

主要目录：

- [`app/`](/d:/Hugo/hugoweb/app) - 页面路由、API、metadata
- [`components/`](/d:/Hugo/hugoweb/components) - UI 组件
- [`lib/`](/d:/Hugo/hugoweb/lib) - GitHub、草稿存储、Markdown、图片、会话逻辑

## 说明

- 草稿保存在浏览器本地存储中
- 仓库配置会通过 cookie 在重新登录后恢复
- 当前流程主要面向“当前选定的一个 Hugo 仓库”
- Preview 部署适合预览界面，但 GitHub OAuth 在正式固定域名下最稳定，因为回调地址通常是固定配置的

## 安全与隐私

PocketHugo 的设计目标之一，就是尽量把用户数据保留在用户本地，而不是存进独立的在线应用数据库中。

这意味着：

- 文章草稿保存在用户自己的浏览器本地
- 语言、主题、发布偏好保存在用户自己的浏览器本地
- GitHub 登录会话和仓库配置使用加密 cookie 保存在用户浏览器中
- 服务端不会建立一个单独的数据库去持久化保存用户资料、文章内容或 GitHub Token

当前实现具备的安全特性：

- GitHub OAuth 使用 `state` 参数防止登录 CSRF
- 会话 cookie 在写入前会进行加密和完整性校验
- 会话 cookie 使用 `HttpOnly`
- cookie 使用 `SameSite=Lax`
- 生产环境下 cookie 使用 `Secure`
- 编辑页等受保护页面要求存在有效登录会话
- GitHub API 调用发生在服务端，而不是浏览器直接持有 Token 调用
- 应用补充了基础浏览器安全头，例如 `X-Frame-Options`、`X-Content-Type-Options` 和 `Referrer-Policy`

建议的上线实践：

- 使用足够强的 `APP_SESSION_SECRET`
- 如果 `GITHUB_CLIENT_SECRET` 曾暴露，立刻重新生成
- 正式环境请使用固定生产域名作为 OAuth 回调地址
- 不要提交 `.env.local`

## License

MIT
