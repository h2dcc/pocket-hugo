# PocketHugo

[中文文档](./README.zh-CN.md)

PocketHugo is a mobile-friendly editor and publishing workflow for Hugo sites that store content in GitHub.

It is designed for people who want to:

- write or update Hugo posts from a phone or browser
- keep Hugo page bundle structure intact
- upload images with compression and format conversion
- continue editing already-published posts from GitHub
- publish directly back to a selected Hugo repository

## What It Does

PocketHugo combines a lightweight Markdown editor, image workflow, and GitHub publishing flow into one app.

Core capabilities:

- GitHub sign-in on the home page
- choose a target repository, branch, and Hugo posts directory
- create local drafts and continue editing later
- load published posts from GitHub and edit them again
- upload images with optional compression, resizing, and WebP conversion
- set cover image, insert images into Markdown, and delete images
- batch-publish `index.md` and changed assets in a single Git commit
- delete removed remote images when republishing a previously published post
- light/dark mode and English/Chinese interface switching

## Why This Project Exists

Hugo is great for static sites, but editing and publishing from a phone is usually awkward.

Common pain points:

- GitHub web editing is not comfortable for longer Markdown writing
- Hugo page bundles are easy to break when using generic CMS tools
- images often become the most annoying part of the workflow
- small content updates still require too much manual Git work

PocketHugo keeps Hugo's native content structure, but makes the day-to-day writing and publishing flow much easier.

## Content Model

PocketHugo is built around Hugo page bundles.

Typical result:

```text
content/posts/2026-03-13-my-post/
  index.md
  1.webp
  cover.webp
```

The detailed structure comparison and the practical benefits are explained in the next section.

## Why Page Bundles Work Better

PocketHugo is intentionally built around Hugo's native page bundle structure instead of the more common "article files here, images somewhere else" pattern.

Hugo page bundle:

```text
content/posts/2026-03-13-my-post/
  index.md
  cover.webp
  1.webp
  2.webp
```

A more common separated structure:

```text
content/posts/2026-03-13-my-post.md
static/uploads/2026/03/cover.webp
static/uploads/2026/03/1.webp
static/uploads/2026/03/2.webp
```

Why the Hugo page bundle model is better:

- the article and its images live together in one folder
- moving, copying, renaming, or deleting a post is much safer
- it is easier to understand which images belong to which article
- image references stay local and predictable
- repository history is easier to inspect because one post usually maps to one folder
- it matches how Hugo already wants page resources to work

For a mobile publishing workflow, this matters even more: the less manual file organization you need to do, the less likely you are to break paths, lose images, or publish to the wrong place.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- GitHub OAuth
- GitHub Contents / Git Trees APIs

## Local Development

Recommended Node.js version:

```text
22 LTS
```

This project uses Next.js 16. While the framework requires Node.js 20.9+, in practice we recommend using Node 22 LTS for local development to avoid Windows native module issues with newer Node releases.

Install dependencies:

```bash
npm install
```

If you already installed dependencies with a different Node version, remove the local install and reinstall after switching Node:

```bash
Remove-Item node_modules,.next,package-lock.json -Recurse -Force
npm install
```

Create `.env.local`:

```env
APP_URL=http://localhost:3000
APP_SESSION_SECRET=replace-with-a-long-random-secret
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
```

Start the dev server:

```bash
npm run dev
```

The development script uses `next dev --webpack` intentionally, and the production build uses `next build --webpack` for the same reason. On some Windows environments, Next.js native SWC bindings may fail to load and Turbopack cannot continue with the WASM fallback, while the webpack pipeline still works normally.

Open:

```text
http://localhost:3000
```

## GitHub OAuth Setup

Create a GitHub OAuth App and configure:

- Homepage URL: `http://localhost:3000` for local testing
- Authorization callback URL: `http://localhost:3000/api/auth/callback` for local testing

For production, change those to your deployed domain.

The app currently expects:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `APP_URL`
- `APP_SESSION_SECRET`

## Vercel Deployment

PocketHugo can be deployed directly to Vercel.

### One-click install

```text
Add your Vercel one-click deploy link here
```

### Required environment variables

After importing the project into Vercel, add these variables in Project Settings -> Environment Variables:

```env
APP_URL=https://your-production-domain.vercel.app
APP_SESSION_SECRET=replace-with-a-long-random-secret
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
```

### GitHub OAuth callback URL

After Vercel gives you a production URL, update the OAuth app callback to:

```text
https://your-production-domain.vercel.app/api/auth/callback
```

### Recommended checks after deployment

Recommended production checks:

- GitHub sign-in works
- repository list loads
- branch and posts directory can be saved
- creating a draft works
- republishing a post updates only the intended files
- deleting a remote image removes it from GitHub on republish

## Cloudflare Workers Deployment

PocketHugo can also be deployed to Cloudflare Workers using OpenNext.

### Required files (already included)

- `wrangler.jsonc`
- `open-next.config.ts`

### Install dependencies

```bash
npm install
```

### Build and deploy

```bash
npm run deploy:cloudflare
```

For local Workers preview:

```bash
npm run preview:cloudflare
```

### Required environment variables

In Cloudflare Worker settings, configure:

```env
APP_URL=https://your-worker-domain.workers.dev
APP_SESSION_SECRET=replace-with-a-long-random-secret
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
```

### GitHub OAuth callback URL

Update your GitHub OAuth App callback URL to:

```text
https://your-worker-domain.workers.dev/api/auth/callback
```

## Publishing Behavior

When publishing:

- `index.md` is always regenerated from the editor state
- newly uploaded or changed assets are included in the same Git commit
- untouched remote images are not overwritten
- removed remote images are deleted from the repository when republishing

## UI Features

- mobile-first page layout
- collapsible settings and editor panels
- simple Markdown toolbar
- Markdown preview
- publish confirmation
- publish result page with changed file list

## Project Structure

Main areas:

- [`app/`](/d:/Hugo/hugoweb/app) - routes, API endpoints, metadata
- [`components/`](/d:/Hugo/hugoweb/components) - UI components
- [`lib/`](/d:/Hugo/hugoweb/lib) - GitHub, storage, markdown, image, session logic

## Notes

- drafts are stored in browser local storage
- repository settings are restored from cookies after sign-in
- current production flow is optimized for one selected target Hugo repository at a time
- preview deployments are useful for UI checks, but GitHub OAuth is most reliable on the final production domain because callback URLs are fixed

## Security & Privacy

PocketHugo is designed to keep user data on the user's side as much as possible, instead of storing it in a separate online application database.

In practice, this means:

- draft content stays in the user's browser
- language, theme, and publishing preferences stay in the user's browser
- sign-in session and repository preference are stored as encrypted browser cookies
- the backend does not keep a user database for article content, profiles, or GitHub tokens

Security characteristics of the current implementation:

- GitHub OAuth uses a state parameter to prevent login CSRF
- session cookies are encrypted and authenticated before being stored
- session cookies are marked `HttpOnly`
- cookies use `SameSite=Lax`
- cookies use `Secure` in production
- protected editor routes require a valid sign-in session
- GitHub access is performed server-side, not from the browser directly
- the app adds baseline browser security headers such as `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy`

Recommended operational practices:

- use a strong `APP_SESSION_SECRET`
- rotate `GITHUB_CLIENT_SECRET` immediately if it is ever exposed
- use the production Vercel domain for the final OAuth callback URL
- do not commit `.env.local`

## License

MIT
