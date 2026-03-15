# PocketHugo

[中文文档](./README.zh-CN.md)

![Pocket-Hugo-Mobile](pockethugomobile.webp)

![Pocket-Hugo-Desktop](pockethugodesktop.webp)

PocketHugo is a browser-first publishing app for GitHub-hosted Markdown content, built around Hugo workflows and optimized for desktop browsers while remaining usable on tablet and phone.

Pocket publishing for Hugo across desktop, tablet, and phone.

- GitHub repo: [https://github.com/h2dcc/pocket-hugo](https://github.com/h2dcc/pocket-hugo)
- Production landing: [https://leftn.com](https://leftn.com)
- Production app entry: [https://leftn.com/app](https://leftn.com/app)
- Production (Vercel): [https://pockethugo.lawtee.com](https://pockethugo.lawtee.com)
- Production (Cloudflare Workers): [https://pocket-hugo.rpwi.workers.dev](https://pocket-hugo.rpwi.workers.dev)

## What PocketHugo Supports

PocketHugo currently focuses on three Hugo-compatible content layouts:

1. `Bundle / Single index`
   Example: `content/posts/my-post/index.md` with images in the same folder.
2. `Bundle / Multilingual`
   Example: `content/posts/my-post/index.md`, `index.en.md`, `index.de.md`, with shared images in the same folder.
3. `Flat Markdown`
   Example: `content/posts/my-post.md` directly under the posts path.

These three modes can be selected from the home page under `Publishing Preferences -> Post Structure Mode`.

```text
content/
└── posts/
    ├── article.md                # 1. Flat Markdown

    ├── my-post/                  # 2. Multilingual Bundle
    │   ├── index.md
    │   ├── index.en.md
    │   └── cover.jpg

    └── my-post-single/           # 3. Single-language Bundle
        ├── index.md
        └── cover.jpg
```

| Feature | Flat Markdown | Single-language Bundle | Multilingual Bundle |
| ---- | ---- | ---- | ---- |
| Images | ❌ | ✅ | ✅ |
| Multilingual | ❌ | ❌ | ✅ |
| Typical use case | quick text-first notes | richer posts with local assets | localized content |

## What PocketHugo Does Not Support

PocketHugo does not support image management for "separated text and media" workflows, for example:

- Markdown files in one folder while images are stored in another global folder
- Date-based image archives such as `/images/2026/...`
- CMS-like media libraries that are independent from the post location

In other words, PocketHugo works best when the Markdown file and its assets stay together, or when you use flat Markdown and do not rely on per-post image folders at all.

## Hugo First, But Not Hugo Only

PocketHugo is designed for Hugo first, but some projects in other SSGs can still use it if they follow one of the supported structures above and rely on regular frontmatter-based Markdown files.

Possible fit:

- Astro content folders that keep Markdown files and assets together
- Hexo posts that are stored as Markdown files under a Git-tracked content path
- Other static site generators that use GitHub-hosted Markdown plus frontmatter

Not a good fit:

- systems that depend on a central media library
- projects that require automatic handling of "text here, images elsewhere"
- content pipelines that are not folder-oriented or do not map cleanly to GitHub file commits

## Why PocketHugo

PocketHugo reduces Git friction while preserving a Hugo-friendly publishing structure:

- write and edit in desktop, tablet, or mobile browser
- choose among three Hugo-compatible post structure modes
- compress, convert, and auto-name images during upload
- keep local drafts in the browser and reopen them later
- reload already-published posts from GitHub and edit again
- publish Markdown and related assets back to GitHub in one batch commit

## Main Features

### Post workflow

- GitHub OAuth sign-in
- repository / branch / posts path selection
- local draft storage and continue editing
- load already-published posts from GitHub and edit again
- publish confirmation before pushing
- publish result page with changed file list

### Structure-aware publishing

- `Bundle / Single index`: direct folder open using `index.md`
- `Bundle / Multilingual`: open a folder, then choose `index.en.md`, `index.de.md`, and similar files
- `Flat Markdown`: list and publish standalone `.md` files directly under the posts path

### Image workflow

- optional auto conversion and compression
- configurable max width and quality
- optional auto file naming (`1.webp`, `2.webp`, ...)
- batch upload up to 9 images
- preview, copy filename, insert Markdown, set cover, and delete assets

Note:

- Image workflow is meant for bundle-style content where Markdown and assets live together.
- In `Flat Markdown` mode, PocketHugo does not manage a separate image folder for you.

### Editor experience

- browser-first layout with solid desktop workflow
- usable on tablet and phone when needed
- collapsible sections
- slash command helper (`/`) in the body editor
- Markdown preview
- autosave plus manual save
- light/dark theme and Chinese/English switch

### Page editor

- Standalone Page mode
- Quick Timeline mode
- quick status publishing
- turn timeline content into a post draft

## Architecture & Privacy

PocketHugo is local-first:

- drafts and preferences are stored in the browser
- session/config cookies are encrypted and stored client-side
- backend does not maintain a user content database
- GitHub token usage is server-side only

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- GitHub OAuth + GitHub APIs
- OpenNext adapter for Cloudflare Workers

## Requirements

- Node.js `22 LTS` recommended
- npm

## Local Development

```bash
npm install
npm run dev
```

Create `.env.local`:

```env
APP_URL=http://localhost:3000
APP_SESSION_SECRET=replace-with-a-long-random-secret
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

## GitHub OAuth Setup

Go to:

`GitHub -> Settings -> Developer settings -> OAuth Apps -> New OAuth App`

Then:

1. Set `Application name`
2. Set `Homepage URL` to your deployment domain
3. Set `Authorization callback URL` to `https://your-domain/api/auth/callback`
4. Register the app
5. Copy `Client ID` to `GITHUB_CLIENT_ID`
6. Generate a client secret and copy it to `GITHUB_CLIENT_SECRET`

## Environment Variables

Required:

- `APP_URL`
- `APP_SESSION_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

Optional:

- `LANDING_PAGE_HOSTS`

Generate `APP_SESSION_SECRET` example:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Vercel example

```env
APP_URL=https://pockethugo.lawtee.com
APP_SESSION_SECRET=replace-with-a-long-random-secret
GITHUB_CLIENT_ID=your-vercel-oauth-client-id
GITHUB_CLIENT_SECRET=your-vercel-oauth-client-secret
```

### Cloudflare Workers example

```env
APP_URL=https://leftn.com
APP_SESSION_SECRET=replace-with-a-long-random-secret
GITHUB_CLIENT_ID=your-workers-oauth-client-id
GITHUB_CLIENT_SECRET=your-workers-oauth-client-secret
LANDING_PAGE_HOSTS=leftn.com,www.leftn.com
```

### Landing page behavior

- When the request host matches `LANDING_PAGE_HOSTS`, `/` shows the landing page.
- `/app` always opens the application directly.
- If the current host does not match `LANDING_PAGE_HOSTS`, `/` opens the app directly.

## Deploy

### Vercel

```bash
npm run build:vercel
```

### Cloudflare Workers

```bash
npm run build:cloudflare
```

## Security Notes

- Keep `.env.local` out of git
- Rotate `GITHUB_CLIENT_SECRET` immediately if exposed
- Use a strong `APP_SESSION_SECRET`
- Use production domains in OAuth callback URLs

## License and Notices

PocketHugo is released under the MIT License.

PocketHugo is an independent project built with technologies including Next.js, React, TypeScript, GitHub APIs, and OpenNext for Cloudflare Workers. It is designed primarily for Hugo-compatible publishing workflows, while remaining compatible with some Hexo, Astro, and similar frontmatter-based Markdown workflows.

PocketHugo is not affiliated with or endorsed by Hugo, Vercel, GitHub, or Cloudflare.

Third-party libraries, frameworks, and related assets remain under their own respective licenses.
