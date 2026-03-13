'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DraftList from '@/components/post/DraftList'
import RemotePostPicker from '@/components/post/RemotePostPicker'
import SiteSettingsPanel from '@/components/settings/SiteSettingsPanel'
import ThemeToggle from '@/components/theme/ThemeToggle'
import {
  listDraftsFromStorage,
  removeDraftFromStorage,
} from '@/lib/draft-storage'
import type { PostDraft } from '@/lib/types'

type PanelKey = 'auth' | 'repo' | 'settings' | null

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

type GithubDirectoryItem = {
  name: string
  path: string
}

export default function HomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [drafts, setDrafts] = useState<PostDraft[]>([])
  const [authLoading, setAuthLoading] = useState(true)
  const [reposLoading, setReposLoading] = useState(false)
  const [directoriesLoading, setDirectoriesLoading] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [authError, setAuthError] = useState('')
  const [configError, setConfigError] = useState('')
  const [configStatus, setConfigStatus] = useState('')
  const [directoryError, setDirectoryError] = useState('')
  const [visiblePanel, setVisiblePanel] = useState<PanelKey>('auth')
  const [pendingDeleteFolderName, setPendingDeleteFolderName] = useState('')
  const [remotePostsOpen, setRemotePostsOpen] = useState(true)
  const [draftsOpen, setDraftsOpen] = useState(true)
  const [session, setSession] = useState<GithubSessionResponse>({
    authenticated: false,
  })
  const [repos, setRepos] = useState<GithubRepoItem[]>([])
  const [directories, setDirectories] = useState<GithubDirectoryItem[]>([])
  const [selectedRepoFullName, setSelectedRepoFullName] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('')
  const [postsBasePath, setPostsBasePath] = useState('content/posts')
  const [directoryPath, setDirectoryPath] = useState('')

  const hasRepoConfig = Boolean(session.repoConfig)
  const matchedRepo = repos.find((repo) => repo.fullName === selectedRepoFullName)
  const pathSegments = directoryPath ? directoryPath.split('/') : []

  const reloadKey = useMemo(() => {
    if (!session.repoConfig) return 'no-config'
    return [
      session.repoConfig.owner,
      session.repoConfig.repo,
      session.repoConfig.branch,
      session.repoConfig.postsBasePath,
    ].join(':')
  }, [session.repoConfig])

  const cardStyle: React.CSSProperties = {
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 16,
    background: 'var(--card)',
    boxShadow: 'var(--shadow)',
    display: 'grid',
    gap: 12,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid var(--border)',
    fontSize: 16,
    background: 'var(--card)',
    color: 'var(--foreground)',
  }

  const pillButtonStyle: React.CSSProperties = {
    padding: '10px 12px',
    borderRadius: 999,
    border: '1px solid var(--border)',
    background: 'var(--card)',
    color: 'var(--foreground)',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 700,
  }

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
        setDirectoryPath(nextSession.repoConfig.postsBasePath)
        setVisiblePanel(null)
      } else if (nextSession.authenticated) {
        setVisiblePanel(null)
      } else {
        setVisiblePanel('auth')
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : '读取登录状态失败')
      setVisiblePanel('auth')
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
      setDirectories([])
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

    setVisiblePanel('auth')

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
    const auth = searchParams.get('auth')
    const from = searchParams.get('from')
    if (auth !== 'required') return

    setAuthError(from ? `请先登录 GitHub 后再访问 ${from}` : '请先登录 GitHub 后再继续操作。')
    setVisiblePanel('auth')
  }, [searchParams])

  useEffect(() => {
    if (!selectedRepoFullName) return

    const repo = repos.find((item) => item.fullName === selectedRepoFullName)
    if (!repo) return

    if (!selectedBranch) {
      setSelectedBranch(repo.defaultBranch)
    }
  }, [repos, selectedRepoFullName, selectedBranch])

  useEffect(() => {
    const [owner, repo] = selectedRepoFullName.split('/')

    if (!session.authenticated || !owner || !repo || !selectedBranch.trim()) {
      setDirectories([])
      setDirectoryError('')
      return
    }

    async function fetchDirectories() {
      setDirectoriesLoading(true)
      setDirectoryError('')

      try {
        const query = new URLSearchParams({
          owner,
          repo,
          branch: selectedBranch.trim(),
          path: directoryPath,
        })
        const response = await fetch(`/api/github/directories?${query.toString()}`, {
          cache: 'no-store',
        })
        const result = await response.json()

        if (!response.ok || !result.ok) {
          throw new Error(result.error || '读取目录失败')
        }

        setDirectories((result.directories || []) as GithubDirectoryItem[])
      } catch (error) {
        setDirectoryError(error instanceof Error ? error.message : '读取目录失败')
        setDirectories([])
      } finally {
        setDirectoriesLoading(false)
      }
    }

    fetchDirectories()
  }, [session.authenticated, selectedRepoFullName, selectedBranch, directoryPath])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setSession({ authenticated: false })
    setRepos([])
    setDirectories([])
    setSelectedRepoFullName('')
    setSelectedBranch('')
    setPostsBasePath('content/posts')
    setDirectoryPath('')
    setConfigStatus('')
    setConfigError('')
    setDirectoryError('')
    setVisiblePanel('auth')
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
      setConfigError('请先选择文章目录。')
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
      setConfigStatus('仓库配置已保存。')
      setVisiblePanel(null)
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : '保存配置失败')
      setVisiblePanel('repo')
    } finally {
      setSavingConfig(false)
    }
  }

  function handleRepoChange(nextValue: string) {
    setSelectedRepoFullName(nextValue)
    const repo = repos.find((item) => item.fullName === nextValue)
    setSelectedBranch(repo?.defaultBranch || '')
    setPostsBasePath('')
    setDirectoryPath('')
    setDirectories([])
    setDirectoryError('')
    setConfigStatus('')
  }

  function handleGoToPath(nextPath: string) {
    setDirectoryPath(nextPath)
    setConfigStatus('')
    setConfigError('')
  }

  function handleOpenDirectory(nextPath: string) {
    setDirectoryPath(nextPath)
    setConfigStatus('')
    setConfigError('')
  }

  function handleSelectCurrentDirectory() {
    if (!directoryPath) {
      setConfigError('请先进入一个文章目录后再保存。')
      return
    }

    setPostsBasePath(directoryPath)
    setConfigError('')
    setConfigStatus(`已选择目录：${directoryPath}`)
  }

  function handleDelete(folderName: string) {
    setPendingDeleteFolderName(folderName)
  }

  function handleConfirmDelete() {
    if (!pendingDeleteFolderName) return
    removeDraftFromStorage(pendingDeleteFolderName)
    setPendingDeleteFolderName('')
    refreshDrafts()
  }

  function handleRemoteLoaded(folderName: string) {
    refreshDrafts()
    router.push(`/editor/${folderName}`)
  }

  function togglePanel(panel: Exclude<PanelKey, null>) {
    setVisiblePanel((prev) => (prev === panel ? null : panel))
  }

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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {session.authenticated && session.user ? (
            <button
              type="button"
              onClick={() => togglePanel('auth')}
              style={{
                ...pillButtonStyle,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: visiblePanel === 'auth' ? 'var(--accent)' : 'var(--card)',
                color: visiblePanel === 'auth' ? 'var(--accent-contrast)' : 'var(--foreground)',
              }}
            >
              {session.user.avatarUrl ? (
                <Image
                  src={session.user.avatarUrl}
                  alt={session.user.login}
                  width={24}
                  height={24}
                  style={{ borderRadius: '50%' }}
                />
              ) : null}
              <span>{session.user.login}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => togglePanel('auth')}
              style={{
                ...pillButtonStyle,
                background: visiblePanel === 'auth' ? 'var(--accent)' : 'var(--card)',
                color: visiblePanel === 'auth' ? 'var(--accent-contrast)' : 'var(--foreground)',
              }}
            >
              GitHub登录
            </button>
          )}

          {session.authenticated ? (
            <>
              <button
                type="button"
                onClick={() => togglePanel('repo')}
                style={{
                  ...pillButtonStyle,
                  background: visiblePanel === 'repo' ? 'var(--accent)' : 'var(--card)',
                  color: visiblePanel === 'repo' ? 'var(--accent-contrast)' : 'var(--foreground)',
                }}
              >
                仓库设置
              </button>

              <button
                type="button"
                onClick={() => togglePanel('settings')}
                style={{
                  ...pillButtonStyle,
                  background: visiblePanel === 'settings' ? 'var(--accent)' : 'var(--card)',
                  color:
                    visiblePanel === 'settings' ? 'var(--accent-contrast)' : 'var(--foreground)',
                }}
              >
                发布偏好
              </button>
            </>
          ) : null}
        </div>

        <ThemeToggle />
      </section>

      {visiblePanel === 'auth' ? (
        <section style={cardStyle}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>GitHub 登录</h2>
            <div style={{ marginTop: 6, fontSize: 14, color: 'var(--muted)' }}>
              登录后即可选择你的 Hugo 仓库，并继续新建、读取和发布文章。
            </div>
          </div>

          {authLoading ? <div style={{ color: 'var(--muted)' }}>正在检查登录状态...</div> : null}
          {authError ? <div style={{ color: 'var(--danger)' }}>{authError}</div> : null}

          {!authLoading && !session.authenticated ? (
            <a
              href="/api/auth/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px 18px',
                borderRadius: 12,
                background: 'var(--accent)',
                color: 'var(--accent-contrast)',
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
                  background: 'var(--card-muted)',
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
                  <div style={{ color: 'var(--muted)', fontSize: 14 }}>@{session.user.login}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                退出登录
              </button>
            </>
          ) : null}
        </section>
      ) : null}

      {visiblePanel === 'repo' && session.authenticated ? (
        <section style={cardStyle}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>仓库设置</h2>
            <div style={{ marginTop: 6, fontSize: 14, color: 'var(--muted)' }}>
              选择你要发布文章的 Hugo 仓库、分支和文章目录。
            </div>
          </div>

          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>选择 Hugo 仓库</span>
            <select
              value={selectedRepoFullName}
              onChange={(e) => handleRepoChange(e.target.value)}
              style={inputStyle}
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
              onChange={(e) => {
                setSelectedBranch(e.target.value)
                setDirectoryPath('')
                setPostsBasePath('')
                setDirectories([])
                setDirectoryError('')
                setConfigStatus('')
              }}
              placeholder={matchedRepo?.defaultBranch || 'main'}
              style={inputStyle}
            />
          </label>

          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>文章目录路径</span>
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 12,
                background: 'var(--card)',
                padding: 12,
                display: 'grid',
                gap: 10,
              }}
            >
              <div style={{ fontSize: 14, color: 'var(--muted)', wordBreak: 'break-all' }}>
                当前浏览：{directoryPath || '/'}
              </div>
              <div style={{ fontSize: 14, color: 'var(--foreground)', wordBreak: 'break-all' }}>
                已选择目录：{postsBasePath || '未选择'}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleGoToPath('')}
                  disabled={directoriesLoading}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    color: 'var(--foreground)',
                    cursor: 'pointer',
                  }}
                >
                  根目录
                </button>
                <button
                  type="button"
                  onClick={() => handleGoToPath(pathSegments.slice(0, -1).join('/'))}
                  disabled={directoriesLoading || !directoryPath}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    color: 'var(--foreground)',
                    cursor: 'pointer',
                  }}
                >
                  返回上级
                </button>
                <button
                  type="button"
                  onClick={handleSelectCurrentDirectory}
                  disabled={directoriesLoading || !directoryPath}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '1px solid var(--accent)',
                    background: 'var(--accent)',
                    color: 'var(--accent-contrast)',
                    cursor: 'pointer',
                  }}
                >
                  选择当前目录
                </button>
              </div>

              {pathSegments.length ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleGoToPath('')}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      border: '1px solid var(--border)',
                      background: 'var(--card-muted)',
                      color: 'var(--foreground)',
                      cursor: 'pointer',
                    }}
                  >
                    /
                  </button>
                  {pathSegments.map((segment, index) => {
                    const nextPath = pathSegments.slice(0, index + 1).join('/')
                    return (
                      <button
                        key={nextPath}
                        type="button"
                        onClick={() => handleGoToPath(nextPath)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 999,
                          border: '1px solid var(--border)',
                          background:
                            nextPath === directoryPath ? 'var(--accent)' : 'var(--card-muted)',
                          color:
                            nextPath === directoryPath
                              ? 'var(--accent-contrast)'
                              : 'var(--foreground)',
                          cursor: 'pointer',
                        }}
                      >
                        {segment}
                      </button>
                    )
                  })}
                </div>
              ) : null}

              {directoriesLoading ? (
                <div style={{ color: 'var(--muted)', fontSize: 14 }}>正在加载目录...</div>
              ) : null}
              {directoryError ? (
                <div style={{ color: 'var(--danger)', fontSize: 14 }}>{directoryError}</div>
              ) : null}

              <div style={{ display: 'grid', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
                {directories.map((directory) => (
                  <button
                    key={directory.path}
                    type="button"
                    onClick={() => handleOpenDirectory(directory.path)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: 'var(--card-muted)',
                      color: 'var(--foreground)',
                      cursor: 'pointer',
                    }}
                  >
                    {directory.name}
                  </button>
                ))}
                {!directoriesLoading && !directoryError && directories.length === 0 ? (
                  <div style={{ color: 'var(--muted)', fontSize: 14 }}>
                    当前目录下没有子目录，可以直接选择当前目录。
                  </div>
                ) : null}
              </div>
            </div>
          </label>

          {configError ? <div style={{ color: 'var(--danger)' }}>{configError}</div> : null}
          {configStatus ? <div style={{ color: '#1677ff' }}>{configStatus}</div> : null}

          <button
            type="button"
            onClick={handleSaveConfig}
            disabled={savingConfig || reposLoading}
            style={{
              padding: '14px 18px',
              borderRadius: 12,
              background: 'var(--accent)',
              color: 'var(--accent-contrast)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              opacity: savingConfig || reposLoading ? 0.7 : 1,
            }}
          >
            {savingConfig ? '保存中...' : '保存仓库配置'}
          </button>

          {hasRepoConfig ? (
            <div style={{ fontSize: 13, color: 'var(--muted)', wordBreak: 'break-all' }}>
              当前目标：{session.repoConfig?.owner}/{session.repoConfig?.repo} ·{' '}
              {session.repoConfig?.branch} · {session.repoConfig?.postsBasePath}
            </div>
          ) : null}
        </section>
      ) : null}

      {visiblePanel === 'settings' && session.authenticated ? (
        <SiteSettingsPanel onSaved={() => setVisiblePanel(null)} />
      ) : null}

      {session.authenticated ? (
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
                setConfigError('请先保存仓库配置。')
                setVisiblePanel('repo')
              }
            }}
            style={{
              display: 'block',
              padding: '18px 20px',
              borderRadius: 16,
              background: hasRepoConfig ? 'var(--accent)' : '#9ca3af',
              color: hasRepoConfig ? 'var(--accent-contrast)' : '#fff',
              textDecoration: 'none',
              fontSize: 18,
              fontWeight: 700,
              textAlign: 'center',
              boxShadow: 'var(--shadow)',
            }}
          >
            + 新建文章
          </Link>
        </section>
      ) : null}

      {session.authenticated ? (
        <section style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 20 }}>已发布文章</h2>
            <button
              type="button"
              onClick={() => setRemotePostsOpen((prev) => !prev)}
              style={pillButtonStyle}
            >
              {remotePostsOpen ? '折叠' : '展开'}
            </button>
          </div>

          {remotePostsOpen ? (
            <RemotePostPicker
              enabled={hasRepoConfig}
              reloadKey={reloadKey}
              onLoaded={handleRemoteLoaded}
            />
          ) : null}
        </section>
      ) : null}

      {session.authenticated ? (
        <section style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 20 }}>本地草稿</h2>
            <button
              type="button"
              onClick={() => setDraftsOpen((prev) => !prev)}
              style={pillButtonStyle}
            >
              {draftsOpen ? '折叠' : '展开'}
            </button>
          </div>

          {draftsOpen ? (
            <div style={{ marginTop: 4 }}>
              <DraftList drafts={drafts} onDelete={handleDelete} />
            </div>
          ) : null}
        </section>
      ) : null}

      {pendingDeleteFolderName ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(17, 24, 39, 0.45)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: 12,
            zIndex: 100,
          }}
          onClick={() => setPendingDeleteFolderName('')}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 720,
              background: 'var(--card)',
              borderRadius: 20,
              padding: 18,
              boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
              display: 'grid',
              gap: 12,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ fontSize: 18, fontWeight: 700 }}>删除这个草稿？</div>
            <div
              style={{
                color: 'var(--muted)',
                fontSize: 14,
                wordBreak: 'break-all',
                lineHeight: 1.6,
              }}
            >
              删除后将从本地草稿中移除：
              <br />
              {pendingDeleteFolderName}
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <button
                type="button"
                onClick={handleConfirmDelete}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: 'none',
                  background: '#d92d20',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                确认删除
              </button>
              <button
                type="button"
                onClick={() => setPendingDeleteFolderName('')}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  color: 'var(--foreground)',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
