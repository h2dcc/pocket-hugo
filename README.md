# hugoweb

面向手机优先的 Hugo 文章发布工具，支持：

- 创建和编辑 Hugo page bundle 文章
- 上传图片，并在上传过程中压缩、裁剪
- 从 GitHub 仓库读取已发布文章继续编辑
- 通过 GitHub OAuth 登录后，在线发布到你选择的 Hugo 仓库文章目录

## 本地开发

```bash
npm install
npm run dev
```

打开 `http://localhost:3000` 即可。

## 在线部署所需环境变量

在线版新增了 GitHub OAuth 登录和“每个用户自选仓库/文章路径”能力，部署时至少需要这些环境变量：

```bash
APP_URL=https://your-domain.example
APP_SESSION_SECRET=replace-with-a-long-random-secret
GITHUB_CLIENT_ID=your-github-oauth-app-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-app-client-secret
```

## GitHub OAuth App 配置

在 GitHub 创建 OAuth App 时，建议这样设置：

- Homepage URL: `https://your-domain.example`
- Authorization callback URL: `https://your-domain.example/api/auth/callback`

登录时会请求：

- `repo`
- `read:user`

这样用户登录后即可选择自己有写权限的仓库，并填写 Hugo 文章目录，例如 `content/posts`。

## 使用流程

1. 首页点击“使用 GitHub 登录”。
2. 选择目标 Hugo 仓库。
3. 填写文章目录路径，例如 `content/posts`。
4. 保存配置后，继续新建文章，或加载远程已发布文章。
5. 编辑完成后直接发布到所选仓库与路径。

## 说明

- 本地草稿依然保存在浏览器本地存储中。
- 远程文章列表会根据当前保存的仓库和文章目录动态加载。
- 发布、读取、加载文章都基于当前登录用户的 GitHub 访问令牌执行。
