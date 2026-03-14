# PocketHugo

[中文文档](./README.zh-CN.md)

![Pocket-Hugo-Mobile](pockethugomobile.webp)

![Pocket-Hugo-Desktop](pockethugodesktop.webp)


PocketHugo is a mobile-first Hugo publishing app for GitHub-hosted content.

- GitHub repo: `https://github.com/h2dcc/pocket-hugo`
- Production (Vercel): `https://pockethugo.lawtee.com`
- Production (Cloudflare Workers): `https://pocket-hugo.rpwi.workers.dev`

## Why PocketHugo

PocketHugo keeps Hugo's native page bundle workflow and removes most of the Git friction on phones:

- write/edit from mobile browser
- keep `index.md + images` in one folder
- compress and manage images during upload
- publish back to GitHub in one batch commit
- no app-side user database for your article content

## Builder Story

This project comes from real high-frequency publishing experience.

As a heavy Hugo user publishing 100+ posts per year, I have repeatedly faced the same pain points in mobile writing, image handling, and Git-based publishing workflows. I tested many existing solutions and spent a long time iterating on different approaches, but most options either broke Hugo's native structure or felt too heavy for daily use.

PocketHugo was built to solve those practical problems directly: keep Hugo-native structure, reduce friction on phones, and make frequent publishing reliable.

### Long-term Iteration Evidence

This was not a one-week prototype. It came from a long sequence of Hugo workflow experiments:

- 2024-06-02: publishing Hugo from Android with StackEdit
- 2024-12-09: adapting CMS workflow to Hugo directory structure
- 2025-05-08: writing Hugo with StackEdit in daily workflow
- 2025-10-27: publishing Hugo via GitHub Issue / GitHub App ideas


After repeatedly trying and documenting these paths, PocketHugo is the first version that fully closes the loop for mobile-first Hugo writing and publishing.

## Main Features

### Post workflow

- GitHub OAuth sign-in
- repo/branch/posts-path selection
- local draft storage and continue editing
- load already-published posts from GitHub and edit again
- publish confirmation before pushing
- batch commit changed markdown + assets in one publish
- show changed file list on publish result page

### Image workflow

- optional auto conversion/compression
- configurable max width (up to 4096) and quality precision
- optional auto file naming (`1.webp`, `2.webp`, ...)
- insert image markdown at current cursor position
- delete image from editor list and sync remote deletion on republish
- tap image to preview large version and copy file name

### Editor experience

- mobile-friendly layout and controls
- collapsible sections (Basic Info / Images / Body / Frontmatter)
- slash command markdown helper (`/`) in body editor
- markdown preview with responsive width and wrapped code blocks
- manual save button while keeping autosave
- light/dark mode and Chinese/English switch

### Page Editor (standalone pages + quick timeline)

- two modes:
  - Standalone Page: edit one page directly
  - Quick Timeline: add/edit multiple timestamped entries
- image upload/insert/delete support in page editor
- frontmatter editing area
- transfer timeline page to a new post draft in one step

### Preferences and customization

- publishing preferences panel on home page
- custom basic-info field mapping (except fixed `title/date/draft`)
- custom cover-image field key
- fixed categories presets for quick select
- tags input with English comma rules
- timezone preference for frontmatter datetime

## Architecture & Privacy

PocketHugo is local-first:

- drafts/preferences are stored in the user's browser
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

## Get GitHub OAuth Credentials

Go to:

`GitHub -> Settings -> Developer settings -> OAuth Apps -> New OAuth App`

Then:

1. Set `Application name` (for example: `PocketHugo Vercel`)
2. Set `Homepage URL` to your deployment domain
3. Set `Authorization callback URL` to `https://your-domain/api/auth/callback`
4. Click **Register application**
5. Copy **Client ID** -> `GITHUB_CLIENT_ID`
6. Click **Generate a new client secret** -> `GITHUB_CLIENT_SECRET`



## Environment Variables

Required in all environments:

- `APP_URL`
- `APP_SESSION_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

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
APP_URL=https://pocket-hugo.rpwi.workers.dev
APP_SESSION_SECRET=replace-with-a-long-random-secret
GITHUB_CLIENT_ID=your-workers-oauth-client-id
GITHUB_CLIENT_SECRET=your-workers-oauth-client-secret
```

## Deploy to Vercel

1. Import this repo in Vercel
2. Set environment variables in Project Settings
3. Build command:

```bash
npm run build:vercel
```

4. Deploy

## Deploy to Cloudflare Workers

This repo already includes:

- `wrangler.jsonc`
- `open-next.config.ts`

Deploy commands:

```bash
npm install
npm run build:cloudflare
npm run deploy:cloudflare
```

Optional local preview:

```bash
npm run preview:cloudflare
```

## Security Notes

- Keep `.env.local` out of git
- Rotate `GITHUB_CLIENT_SECRET` immediately if exposed
- Use strong `APP_SESSION_SECRET`
- Use production domains in OAuth callback URLs

## License

MIT
