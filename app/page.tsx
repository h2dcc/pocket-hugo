'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DraftList from '@/components/post/DraftList'
import RemotePostPicker from '@/components/post/RemotePostPicker'
import type { PostDraft } from '@/lib/types'
import {
  listDraftsFromStorage,
  removeDraftFromStorage,
} from '@/lib/draft-storage'

type GithubSessionResponse = {
  authenticated: boolean
  user?: {
    login: string
    name: string
    avatarUrl: string
  }
  repoConfig?: {
    owner: string
    repo: string
    branch: string
    postsBasePath: string
  } | null
}

type GithubRepoItem = {
  id: number
  owner: string
  name: string
  fullName: string
  private: boolean
  defaultBranch: string
}

export default function HomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [drafts, setDrafts] = useState<PostDraft[]>([])
  const [authLoading, setAuthLoading] = useState(true)
  const [reposLoading, setReposLoading] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [authError, setAuthError] = useState('')
  const [configError, setConfigError] = useState('')
  const [configStatus, setConfigStatus] = useState('')
  const [session, setSession] = useState<GithubSessionResponse>({
    authenticated: false,
  })
  const [repos, setRepos] = useState<GithubRepoItem[]>([])
  const [selectedRepoFullName, setSelectedRepoFullName] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('')
  const [postsBasePath, setPostsBasePath] = useState('content/posts')

  const reloadKey = useMemo(() => {
    if (!session.repoConfig) return 'no-config'
    return [
      session.repoConfig.owner,
      session.repoConfig.repo,
      session.repoConfig.branch,
      session.repoConfig.postsBasePath,
    ].join(':')
  }, [session.repoConfig])

  function refreshDrafts() {
    setDrafts(listDraftsFromStorage())
  }

  async function loadSession() {
    setAuthLoading(true)
    setAuthError('')

    try {
      const response = await fetch('/api/auth/session', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.error || '读取登录状态失败')
      }

      const nextSession = result as GithubSessionResponse & { ok: true }
      setSession({
        authenticated: nextSession.authenticated,
        user: nextSession.user,
        repoConfig: nextSession.repoConfig || null,
      })

      if (nextSession.repoConfig) {
        setSelectedRepoFullName(
          `${nextSession.repoConfig.owner}/${nextSession.repoConfig.repo}`,
        )
        setSelectedBranch(nextSession.repoConfig.branch)
        setPostsBasePath(nextSession.repoConfig.postsBasePath)
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : '读取登录状态失败')
    } finally {
      setAuthLoading(false)
    }
  }

  useEffect(() => {
    refreshDrafts()
    loadSession()
  }, [])

  useEffect(() => {
    if (!session.authenticated) {
      setRepos([])
      return
    }

    async function fetchRepos() {
      setReposLoading(true)
      setConfigError('')

      try {
        const response = await fetch('/api/github/repos', { cache: 'no-store' })
        const result = await response.json()

        if (!response.ok || !result.ok) {
          throw new Error(result.error || '读取仓库失败')
        }

        const nextRepos = (result.repos || []) as GithubRepoItem[]
        setRepos(nextRepos)

        if (!selectedRepoFullName && nextRepos.length > 0) {
          const firstRepo = nextRepos[0]
          setSelectedRepoFullName(firstRepo.fullName)
          setSelectedBranch(firstRepo.defaultBranch)
        }
      } catch (error) {
        setConfigError(error instanceof Error ? error.message : '读取仓库失败')
      } finally {
        setReposLoading(false)
      }
    }

    fetchRepos()
  }, [session.authenticated, selectedRepoFullName])

  useEffect(() => {
    const error = searchParams.get('error')
    if (!error) return

    if (error === 'github_oauth_state') {
      setAuthError('GitHub 登录校验失败，请重新登录。')
      return
    }

    if (error === 'github_oauth_config') {
      setAuthError('服务端缺少 GitHub OAuth 配置。')
      return
    }

    setAuthError(`GitHub 登录失败：${error}`)
  }, [searchParams])

  useEffect(() => {
    if (!selectedRepoFullName) return

    const matchedRepo = repos.find((repo) => repo.fullName === selectedRepoFullName)
    if (!matchedRepo) return

    if (!selectedBranch) {
      setSelectedBranch(matchedRepo.defaultBranch)
    }
  }, [repos, selectedRepoFullName, selectedBranch])

  function handleDelete(folderName: string) {
    const confirmed = window.confirm(`确定删除草稿 ${folderName} 吗？`)
    if (!confirmed) return

    removeDraftFromStorage(folderName)
    refreshDrafts()
  }

  function handleRemoteLoaded(folderName: string) {
    refreshDrafts()
    router.push(`/editor/${folderName}`)
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setSession({ authenticated: false })
    setRepos([])
    setSelectedRepoFullName('')
    setSelectedBranch('')
    setPostsBasePath('content/posts')
    setConfigStatus('')
    setConfigError('')
    router.replace('/')
  }

  async function handleSaveConfig() {
    const [owner, repo] = selectedRepoFullName.split('/')

    if (!owner || !repo) {
      setConfigError('请先选择一个仓库。')
      return
    }

    if (!selectedBranch.trim()) {
      setConfigError('请填写分支名称。')
      return
    }

    if (!postsBasePath.trim()) {
      setConfigError('请填写文章目录路径。')
      return
    }

    setSavingConfig(true)
    setConfigError('')
    setConfigStatus('')

    try {
      const response = await fetch('/api/github/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner,
          repo,
          branch: selectedBranch.trim(),
          postsBasePath: postsBasePath.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.error || '保存配置失败')
      }

      setSession((prev) => ({
        ...prev,
        repoConfig: result.repoConfig,
      }))
      setConfigStatus('仓库配置已保存，下面就可以继续新建或加载文章。')
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : '保存配置失败')
    } finally {
      setSavingConfig(false)
    }
  }

  const matchedRepo = repos.find((repo) => repo.fullName === selectedRepoFullName)
  const hasRepoConfig = Boolean(session.repoConfig)

  return (
    <main
      style={{
        padding: 16,
        maxWidth: 720,
        margin: '0 auto',
        display: 'grid',
        gap: 16,
      }}
    >
      <section
        style={{
          borderRadius: 20,
          padding: 20,
          background: 'linear-gradient(135deg, #111 0%, #333 100%)',
          color: '#fff',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28 }}>hugoweb</h1>
        <p style={{ marginTop: 10, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
          Hugo page bundle 手机优先发布工具
        </p>
      </section>

      <section
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          padding: 16,
          background: '#fff',
          display: 'grid',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>GitHub 连接</h2>
            <div style={{ marginTop: 6, fontSize: 14, color: '#666' }}>
              在线版通过 GitHub OAuth 登录，并把文章发布到你选择的 Hugo 仓库目录。
            </div>
          </div>

          {session.authenticated && session.user ? (
            <button
              type="button"
              onClick={handleLogout}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #d1d5db',
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              退出登录
            </button>
          ) : null}
        </div>

        {authLoading ? <div style={{ color: '#666' }}>正在检查登录状态...</div> : null}
        {authError ? <div style={{ color: 'crimson' }}>{authError}</div> : null}

        {!authLoading && !session.authenticated ? (
          <a
            href="/api/auth/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '14px 18px',
              borderRadius: 12,
              background: '#111',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            使用 GitHub 登录
          </a>
        ) : null}

        {session.authenticated && session.user ? (
          <>
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                padding: 12,
                borderRadius: 12,
                background: '#f9fafb',
              }}
            >
              {session.user.avatarUrl ? (
                <Image
                  src={session.user.avatarUrl}
                  alt={session.user.login}
                  width={44}
                  height={44}
                  style={{ borderRadius: '50%' }}
                />
              ) : null}
              <div>
                <div style={{ fontWeight: 700 }}>{session.user.name}</div>
                <div style={{ color: '#666', fontSize: 14 }}>@{session.user.login}</div>
              </div>
            </div>

            <label style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>选择 Hugo 仓库</span>
              <select
                value={selectedRepoFullName}
                onChange={(e) => {
                  const nextValue = e.target.value
                  setSelectedRepoFullName(nextValue)
                  const repo = repos.find((item) => item.fullName === nextValue)
                  setSelectedBranch(repo?.defaultBranch || '')
                }}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid #d1d5db',
                  fontSize: 16,
                  background: '#fff',
                }}
              >
                <option value="">{reposLoading ? '正在加载仓库...' : '请选择仓库'}</option>
                {repos.map((repo) => (
                  <option key={repo.id} value={repo.fullName}>
                    {repo.fullName} {repo.private ? '(private)' : '(public)'}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>分支</span>
              <input
                type="text"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                placeholder={matchedRepo?.defaultBranch || 'main'}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid #d1d5db',
                  fontSize: 16,
                  background: '#fff',
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>文章目录路径</span>
              <input
                type="text"
                value={postsBasePath}
                onChange={(e) => setPostsBasePath(e.target.value)}
                placeholder="content/posts"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid #d1d5db',
                  fontSize: 16,
                  background: '#fff',
                }}
              />
            </label>

            {configError ? <div style={{ color: 'crimson' }}>{configError}</div> : null}
            {configStatus ? <div style={{ color: '#1677ff' }}>{configStatus}</div> : null}

            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={savingConfig || reposLoading}
              style={{
                padding: '14px 18px',
                borderRadius: 12,
                background: '#111',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                opacity: savingConfig || reposLoading ? 0.7 : 1,
              }}
            >
              {savingConfig ? '保存中...' : '保存仓库配置'}
            </button>

            {hasRepoConfig ? (
              <div style={{ fontSize: 13, color: '#666', wordBreak: 'break-all' }}>
                当前目标：{session.repoConfig?.owner}/{session.repoConfig?.repo} ·{' '}
                {session.repoConfig?.branch} · {session.repoConfig?.postsBasePath}
              </div>
            ) : null}
          </>
        ) : null}
      </section>

      <section
        style={{
          display: 'grid',
          gap: 12,
        }}
      >
        <Link
          href={hasRepoConfig ? '/new' : '#'}
          onClick={(event) => {
            if (!hasRepoConfig) {
              event.preventDefault()
              setConfigError('请先登录 GitHub 并保存仓库配置。')
            }
          }}
          style={{
            display: 'block',
            padding: '18px 20px',
            borderRadius: 16,
            background: hasRepoConfig ? '#111' : '#9ca3af',
            color: '#fff',
            textDecoration: 'none',
            fontSize: 18,
            fontWeight: 700,
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          + 新建文章
        </Link>
      </section>

      <RemotePostPicker
        enabled={hasRepoConfig}
        reloadKey={reloadKey}
        onLoaded={handleRemoteLoaded}
      />

      <section
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          padding: 16,
          background: '#fff',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20 }}>本地草稿</h2>
        <div style={{ marginTop: 14 }}>
          <DraftList drafts={drafts} onDelete={handleDelete} />
        </div>
      </section>
    </main>
  )
}
