'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DraftList from '@/components/post/DraftList'
import LanguageToggle from '@/components/language/LanguageToggle'
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome'
import RemotePostPicker from '@/components/post/RemotePostPicker'
import SiteSettingsPanel from '@/components/settings/SiteSettingsPanel'
import ThemeToggle from '@/components/theme/ThemeToggle'
import {
  listDraftsFromStorage,
  removeDraftFromStorage,
} from '@/lib/draft-storage'
import { useLanguage } from '@/lib/use-language'
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

function RepoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9L11 7H18.5A2.5 2.5 0 0 1 21 9.5V16.5A2.5 2.5 0 0 1 18.5 19H5.5A2.5 2.5 0 0 1 3 16.5V7.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 8.5A3.5 3.5 0 1 1 12 15.5A3.5 3.5 0 0 1 12 8.5ZM19.4 15A1 1 0 0 0 19.6 16.1L19.7 16.2A1 1 0 0 1 19.7 17.6L17.6 19.7A1 1 0 0 1 16.2 19.7L16.1 19.6A1 1 0 0 0 15 19.4A1 1 0 0 0 14.4 20.3V20.5A1 1 0 0 1 13.4 21.5H10.6A1 1 0 0 1 9.6 20.5V20.3A1 1 0 0 0 9 19.4A1 1 0 0 0 7.9 19.6L7.8 19.7A1 1 0 0 1 6.4 19.7L4.3 17.6A1 1 0 0 1 4.3 16.2L4.4 16.1A1 1 0 0 0 4.6 15A1 1 0 0 0 3.7 14.4H3.5A1 1 0 0 1 2.5 13.4V10.6A1 1 0 0 1 3.5 9.6H3.7A1 1 0 0 0 4.6 9A1 1 0 0 0 4.4 7.9L4.3 7.8A1 1 0 0 1 4.3 6.4L6.4 4.3A1 1 0 0 1 7.8 4.3L7.9 4.4A1 1 0 0 0 9 4.6A1 1 0 0 0 9.6 3.7V3.5A1 1 0 0 1 10.6 2.5H13.4A1 1 0 0 1 14.4 3.5V3.7A1 1 0 0 0 15 4.6A1 1 0 0 0 16.1 4.4L16.2 4.3A1 1 0 0 1 17.6 4.3L19.7 6.4A1 1 0 0 1 19.7 7.8L19.6 7.9A1 1 0 0 0 19.4 9A1 1 0 0 0 20.3 9.6H20.5A1 1 0 0 1 21.5 10.6V13.4A1 1 0 0 1 20.5 14.4H20.3A1 1 0 0 0 19.4 15Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function HomePage() {
  const { isEnglish } = useLanguage()
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
  const [remotePostsOpen, setRemotePostsOpen] = useState(false)
  const [draftsOpen, setDraftsOpen] = useState(true)
  const [session, setSession] = useState<GithubSessionResponse>({ authenticated: false })
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
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
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
        throw new Error(result.error || (isEnglish ? 'Failed to read sign-in status' : '读取登录状态失败'))
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
      setAuthError(error instanceof Error ? error.message : isEnglish ? 'Failed to read sign-in status' : '读取登录状态失败')
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
          throw new Error(result.error || (isEnglish ? 'Failed to load repositories' : '读取仓库失败'))
        }

        const nextRepos = (result.repos || []) as GithubRepoItem[]
        setRepos(nextRepos)

        if (!selectedRepoFullName && nextRepos.length > 0) {
          const firstRepo = nextRepos[0]
          setSelectedRepoFullName(firstRepo.fullName)
          setSelectedBranch(firstRepo.defaultBranch)
        }
      } catch (error) {
        setConfigError(error instanceof Error ? error.message : isEnglish ? 'Failed to load repositories' : '读取仓库失败')
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
      setAuthError(isEnglish ? 'GitHub sign-in verification failed. Please try again.' : 'GitHub 登录校验失败，请重新登录。')
      return
    }

    if (error === 'github_oauth_config') {
      setAuthError(isEnglish ? 'GitHub OAuth is not configured on the server.' : '服务端缺少 GitHub OAuth 配置。')
      return
    }

    setAuthError(isEnglish ? `GitHub sign-in failed: ${error}` : `GitHub 登录失败：${error}`)
  }, [searchParams])

  useEffect(() => {
    const auth = searchParams.get('auth')
    const from = searchParams.get('from')
    if (auth !== 'required') return

    setAuthError(
      from
        ? isEnglish
          ? `Please sign in with GitHub before visiting ${from}.`
          : `请先登录 GitHub 后再访问 ${from}`
        : isEnglish
          ? 'Please sign in with GitHub first.'
          : '请先登录 GitHub 后再继续操作。',
    )
    setVisiblePanel('auth')
  }, [searchParams])

  useEffect(() => {
    if (!selectedRepoFullName) return
    const repo = repos.find((item) => item.fullName === selectedRepoFullName)
    if (!repo || selectedBranch) return
    setSelectedBranch(repo.defaultBranch)
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
          throw new Error(result.error || (isEnglish ? 'Failed to load directories' : '读取目录失败'))
        }

        setDirectories((result.directories || []) as GithubDirectoryItem[])
      } catch (error) {
        setDirectoryError(error instanceof Error ? error.message : isEnglish ? 'Failed to load directories' : '读取目录失败')
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
      setConfigError(isEnglish ? 'Please choose a repository first.' : '请先选择一个仓库。')
      return
    }

    if (!selectedBranch.trim()) {
      setConfigError(isEnglish ? 'Please enter a branch name.' : '请填写分支名称。')
      return
    }

    if (!postsBasePath.trim()) {
      setConfigError(isEnglish ? 'Please choose a posts directory first.' : '请先选择文章目录。')
      return
    }

    setSavingConfig(true)
    setConfigError('')
    setConfigStatus('')

    try {
      const response = await fetch('/api/github/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          repo,
          branch: selectedBranch.trim(),
          postsBasePath: postsBasePath.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.error || (isEnglish ? 'Failed to save repository settings' : '保存配置失败'))
      }

      setSession((prev) => ({ ...prev, repoConfig: result.repoConfig }))
      setConfigStatus(isEnglish ? 'Repository settings saved.' : '仓库配置已保存。')
      setVisiblePanel(null)
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : isEnglish ? 'Failed to save repository settings' : '保存配置失败')
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

  function handleSelectCurrentDirectory() {
    if (!directoryPath) {
      setConfigError(isEnglish ? 'Please open a posts directory before saving.' : '请先进入一个文章目录后再保存。')
      return
    }

    setPostsBasePath(directoryPath)
    setConfigError('')
    setConfigStatus(isEnglish ? `Selected directory: ${directoryPath}` : `已选择目录：${directoryPath}`)
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
        maxWidth: 1080,
        margin: '0 auto',
        display: 'grid',
        gap: 16,
      }}
    >
      <SiteHeader />

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
              {isEnglish ? 'GitHub Sign In' : 'GitHub 登录'}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
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
                <RepoIcon />
                <span>{isEnglish ? 'Repository' : '仓库设置'}</span>
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
                <SettingsIcon />
                <span>{isEnglish ? 'Preferences' : '发布偏好'}</span>
              </button>
            </>
          ) : null}

          <LanguageToggle />
          <ThemeToggle />
        </div>
      </section>

      {visiblePanel === 'auth' ? (
        <section style={cardStyle}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>{isEnglish ? 'GitHub Sign In' : 'GitHub 登录'}</h2>
            <div style={{ marginTop: 6, fontSize: 14, color: 'var(--muted)' }}>
              {isEnglish
                ? 'Sign in to choose your Hugo repository and continue creating, loading, and publishing posts.'
                : '登录后即可选择你的 Hugo 仓库，并继续新建、读取和发布文章。'}
            </div>
          </div>

          {authLoading ? <div style={{ color: 'var(--muted)' }}>{isEnglish ? 'Checking sign-in status...' : '正在检查登录状态...'}</div> : null}
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
              {isEnglish ? 'Continue with GitHub' : '使用 GitHub 登录'}
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
                {isEnglish ? 'Sign Out' : '退出登录'}
              </button>
            </>
          ) : null}
        </section>
      ) : null}

      {visiblePanel === 'repo' && session.authenticated ? (
        <section style={cardStyle}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>{isEnglish ? 'Repository Settings' : '仓库设置'}</h2>
            <div style={{ marginTop: 6, fontSize: 14, color: 'var(--muted)' }}>
              {isEnglish
                ? 'Choose the Hugo repository, branch, and posts directory you want to publish into.'
                : '选择你要发布文章的 Hugo 仓库、分支和文章目录。'}
            </div>
          </div>

          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{isEnglish ? 'Hugo Repository' : '选择 Hugo 仓库'}</span>
            <select
              value={selectedRepoFullName}
              onChange={(e) => handleRepoChange(e.target.value)}
              style={inputStyle}
            >
              <option value="">{reposLoading ? (isEnglish ? 'Loading repositories...' : '正在加载仓库...') : isEnglish ? 'Choose a repository' : '请选择仓库'}</option>
              {repos.map((repo) => (
                <option key={repo.id} value={repo.fullName}>
                  {repo.fullName} {repo.private ? '(private)' : '(public)'}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{isEnglish ? 'Branch' : '分支'}</span>
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

          <section
            style={{
              border: '1px solid var(--border)',
              borderRadius: 16,
              background: 'var(--card-muted)',
              padding: 14,
              display: 'grid',
              gap: 12,
            }}
          >
            <div style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{isEnglish ? 'Posts Directory' : '文章目录路径'}</span>
              <span style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                {isEnglish
                  ? 'Browse directories first, then tap "Use Current Directory".'
                  : '先浏览目录，再点“选择当前目录”。整个区域按手机点按做了加大处理。'}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gap: 10,
                gridTemplateColumns: '1fr',
              }}
            >
              <div
                style={{
                  padding: 12,
                  borderRadius: 14,
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{isEnglish ? 'Browsing' : '当前浏览'}</div>
                <div style={{ marginTop: 6, fontSize: 15, wordBreak: 'break-all' }}>
                  {directoryPath || '/'}
                </div>
              </div>

              <div
                style={{
                  padding: 12,
                  borderRadius: 14,
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{isEnglish ? 'Selected Directory' : '已选择目录'}</div>
                <div style={{ marginTop: 6, fontSize: 15, wordBreak: 'break-all' }}>
                  {postsBasePath || (isEnglish ? 'Not selected' : '未选择')}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={() => handleGoToPath('')}
                disabled={directoriesLoading}
                style={{
                  minHeight: 48,
                  padding: '10px 12px',
                  borderRadius: 14,
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                {isEnglish ? 'Root' : '根目录'}
              </button>
              <button
                type="button"
                onClick={() => handleGoToPath(pathSegments.slice(0, -1).join('/'))}
                disabled={directoriesLoading || !directoryPath}
                style={{
                  minHeight: 48,
                  padding: '10px 12px',
                  borderRadius: 14,
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                {isEnglish ? 'Up One Level' : '返回上级'}
              </button>
              <button
                type="button"
                onClick={handleSelectCurrentDirectory}
                disabled={directoriesLoading || !directoryPath}
                style={{
                  minHeight: 48,
                  padding: '10px 12px',
                  borderRadius: 14,
                  border: '1px solid var(--accent)',
                  background: 'var(--accent)',
                  color: 'var(--accent-contrast)',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                {isEnglish ? 'Use Current Directory' : '选择当前目录'}
              </button>
            </div>

            {pathSegments.length ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleGoToPath('')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    color: 'var(--foreground)',
                    cursor: 'pointer',
                    fontWeight: 600,
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
                        padding: '8px 12px',
                        borderRadius: 999,
                        border: '1px solid var(--border)',
                        background:
                          nextPath === directoryPath ? 'var(--accent)' : 'var(--card)',
                        color:
                          nextPath === directoryPath
                            ? 'var(--accent-contrast)'
                            : 'var(--foreground)',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {segment}
                    </button>
                  )
                })}
              </div>
            ) : null}

            {directoriesLoading ? (
              <div style={{ color: 'var(--muted)', fontSize: 14 }}>{isEnglish ? 'Loading directories...' : '正在加载目录...'}</div>
            ) : null}
            {directoryError ? (
              <div style={{ color: 'var(--danger)', fontSize: 14 }}>{directoryError}</div>
            ) : null}

            <div style={{ display: 'grid', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
              {directories.map((directory) => (
                <button
                  key={directory.path}
                  type="button"
                  onClick={() => handleGoToPath(directory.path)}
                  style={{
                    textAlign: 'left',
                    padding: '14px 14px',
                    borderRadius: 14,
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    color: 'var(--foreground)',
                    cursor: 'pointer',
                    display: 'grid',
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{directory.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)', wordBreak: 'break-all' }}>
                    {directory.path}
                  </span>
                </button>
              ))}
              {!directoriesLoading && !directoryError && directories.length === 0 ? (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    border: '1px dashed var(--border)',
                    color: 'var(--muted)',
                    fontSize: 14,
                    lineHeight: 1.6,
                    background: 'var(--card)',
                  }}
                >
                  {isEnglish
                    ? 'No subdirectories were found here. You can use the current directory directly.'
                    : '当前目录下没有子目录，可以直接点击上方“选择当前目录”。'}
                </div>
              ) : null}
            </div>
          </section>

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
            {savingConfig ? (isEnglish ? 'Saving...' : '保存中...') : isEnglish ? 'Save Repository Settings' : '保存仓库配置'}
          </button>

          {hasRepoConfig ? (
            <div style={{ fontSize: 13, color: 'var(--muted)', wordBreak: 'break-all' }}>
              {isEnglish ? 'Current target: ' : '当前目标：'}
              {session.repoConfig?.owner}/{session.repoConfig?.repo} /{' '}
              {session.repoConfig?.branch} / {session.repoConfig?.postsBasePath}
            </div>
          ) : null}
        </section>
      ) : null}

      {visiblePanel === 'settings' && session.authenticated ? (
        <SiteSettingsPanel onSaved={() => setVisiblePanel(null)} />
      ) : null}

      {session.authenticated ? (
        <section style={{ display: 'grid', gap: 12 }}>
          <Link
            href={hasRepoConfig ? '/new' : '#'}
            onClick={(event) => {
              if (!hasRepoConfig) {
                event.preventDefault()
                setConfigError(isEnglish ? 'Please save repository settings first.' : '请先保存仓库配置。')
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
            {isEnglish ? '+ New Post' : '+ 新建文章'}
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
            <h2 style={{ margin: 0, fontSize: 20 }}>{isEnglish ? 'Published Posts' : '已发布文章'}</h2>
            <button
              type="button"
              onClick={() => setRemotePostsOpen((prev) => !prev)}
              style={pillButtonStyle}
            >
              {remotePostsOpen ? (isEnglish ? 'Collapse' : '折叠') : isEnglish ? 'Expand' : '展开'}
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
            <h2 style={{ margin: 0, fontSize: 20 }}>{isEnglish ? 'Local Drafts' : '本地草稿'}</h2>
            <button
              type="button"
              onClick={() => setDraftsOpen((prev) => !prev)}
              style={pillButtonStyle}
            >
              {draftsOpen ? (isEnglish ? 'Collapse' : '折叠') : isEnglish ? 'Expand' : '展开'}
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
              maxWidth: 820,
              background: 'var(--card)',
              borderRadius: 20,
              padding: 18,
              boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
              display: 'grid',
              gap: 12,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ fontSize: 18, fontWeight: 700 }}>{isEnglish ? 'Delete this draft?' : '删除这个草稿？'}</div>
            <div
              style={{
                color: 'var(--muted)',
                fontSize: 14,
                wordBreak: 'break-all',
                lineHeight: 1.6,
              }}
            >
              {isEnglish ? 'This draft will be removed from local storage:' : '删除后将从本地草稿中移除：'}
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
                {isEnglish ? 'Delete Draft' : '确认删除'}
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
                {isEnglish ? 'Cancel' : '取消'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <SiteFooter />
    </main>
  )
}
