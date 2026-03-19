'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DraftList from '@/components/post/DraftList'
import LanguageToggle from '@/components/language/LanguageToggle'
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome'
import RemotePostPicker from '@/components/post/RemotePostPicker'
import SiteSettingsPanel from '@/components/settings/SiteSettingsPanel'
import ThemeToggle from '@/components/theme/ThemeToggle'
import IconButton from '@/components/ui/IconButton'
import SectionToggleButton from '@/components/ui/SectionToggleButton'
import {
  listDraftsFromStorage,
  removeDraftFromStorage,
} from '@/lib/draft-storage'
import { useLanguage } from '@/lib/use-language'
import type { PostDraft } from '@/lib/types'

type PanelKey = 'auth' | 'repo' | 'page' | 'settings' | null

type GithubSessionResponse = {
  authenticated: boolean
  mode?: 'github' | 'local'
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
  pageConfig?: {
    filePath: string
    mode: 'page' | 'live'
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

type SearchParamsEffectsProps = {
  isEnglish: boolean
  onAuthError: (message: string) => void
  onShowAuthPanel: () => void
}

function SearchParamsEffects({
  isEnglish,
  onAuthError,
  onShowAuthPanel,
}: SearchParamsEffectsProps) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get('error')
    if (!error) return

    onShowAuthPanel()

    if (error === 'github_oauth_state') {
      onAuthError(
        isEnglish
          ? 'GitHub sign-in verification failed. Please try again.'
          : 'GitHub 登录校验失败，请重新登录。',
      )
      return
    }

    if (error === 'github_oauth_config') {
      onAuthError(
        isEnglish
          ? 'GitHub OAuth is not configured on the server.'
          : '服务端缺少 GitHub OAuth 配置。',
      )
      return
    }

    onAuthError(
      isEnglish ? `GitHub sign-in failed: ${error}` : `GitHub 登录失败：${error}`,
    )
  }, [isEnglish, onAuthError, onShowAuthPanel, searchParams])

  useEffect(() => {
    const auth = searchParams.get('auth')
    const from = searchParams.get('from')
    if (auth !== 'required') return

    onAuthError(
      from
        ? isEnglish
          ? `Please sign in with GitHub before visiting ${from}.`
          : `请先登录 GitHub 后再访问 ${from}`
        : isEnglish
          ? 'Please sign in with GitHub first.'
          : '请先登录 GitHub 后再继续操作。',
    )
    onShowAuthPanel()
  }, [isEnglish, onAuthError, onShowAuthPanel, searchParams])

  return null
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

function PageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 4.5H13.8L18 8.7V19.5A1.5 1.5 0 0 1 16.5 21H7.5A1.5 1.5 0 0 1 6 19.5V6A1.5 1.5 0 0 1 7.5 4.5H7ZM13 5V9H17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RootIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 4V20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function UpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 12H7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M11 8L7 12L11 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.5L9.2 16.5L19 7.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function HomePage() {
  const { isEnglish } = useLanguage()
  const router = useRouter()
  const pageConfigCollapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const repoConfigCollapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const settingsCollapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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
  const [postsBasePath, setPostsBasePath] = useState('')
  const [directoryPath, setDirectoryPath] = useState('')
  const [pageConfigError, setPageConfigError] = useState('')
  const [pageConfigStatus, setPageConfigStatus] = useState('')
  const [savingPageConfig, setSavingPageConfig] = useState(false)
  const [pageDirectoryPath, setPageDirectoryPath] = useState('')
  const [pageDirectories, setPageDirectories] = useState<GithubDirectoryItem[]>([])
  const [pageDirectoriesLoading, setPageDirectoriesLoading] = useState(false)
  const [pageDirectoryError, setPageDirectoryError] = useState('')
  const [pageFiles, setPageFiles] = useState<GithubDirectoryItem[]>([])
  const [pageFilesLoading, setPageFilesLoading] = useState(false)
  const [pageFilesError, setPageFilesError] = useState('')
  const [pageFileName, setPageFileName] = useState('')
  const [pageMode, setPageMode] = useState<'page' | 'live'>('live')
  const [creatingPage, setCreatingPage] = useState(false)
  const [createPageOpen, setCreatePageOpen] = useState(false)
  const [newPageDirectory, setNewPageDirectory] = useState('')
  const [newPageFileName, setNewPageFileName] = useState('')
  const [newPageError, setNewPageError] = useState('')
  const [newPageStatus, setNewPageStatus] = useState('')
  const isLocalMode = session.mode === 'local'

  const hasRepoConfig = Boolean(session.repoConfig)
  const hasPageConfig = Boolean(session.pageConfig?.filePath)
  const matchedRepo = repos.find((repo) => repo.fullName === selectedRepoFullName)
  const pathSegments = directoryPath ? directoryPath.split('/') : []
  const pagePathSegments = pageDirectoryPath ? pageDirectoryPath.split('/') : []
  const savedPageFilePath = session.pageConfig?.filePath || ''
  const savedPageFileSegments = savedPageFilePath ? savedPageFilePath.split('/') : []
  const savedPageFileName = savedPageFileSegments.length ? savedPageFileSegments[savedPageFileSegments.length - 1] : ''
  const savedPageDirectoryPath = savedPageFileSegments.length > 1 ? savedPageFileSegments.slice(0, -1).join('/') : ''
  const pageFilePath = pageDirectoryPath ? `${pageDirectoryPath}/${pageFileName}` : pageFileName
  const pageFileOptions = useMemo(
    () => pageFiles.map((file) => file.name),
    [pageFiles],
  )

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
    padding: 'clamp(12px, 3vw, 16px)',
    background: 'var(--card)',
    boxShadow: 'var(--shadow)',
    display: 'grid',
    gap: 12,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid var(--border)',
    fontSize: 14,
    background: 'var(--card)',
    color: 'var(--foreground)',
  }

  const pillButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 10px',
    borderRadius: 999,
    border: '1px solid var(--border)',
    background: 'var(--card)',
    color: 'var(--foreground)',
    cursor: 'pointer',
    fontSize: 12,
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
        mode: nextSession.mode,
        user: nextSession.user,
        repoConfig: nextSession.repoConfig || null,
        pageConfig: nextSession.pageConfig || null,
      })

      if (nextSession.repoConfig) {
        setSelectedRepoFullName(
          `${nextSession.repoConfig.owner}/${nextSession.repoConfig.repo}`,
        )
        setSelectedBranch(nextSession.repoConfig.branch)
        setPostsBasePath(nextSession.repoConfig.postsBasePath)
        setDirectoryPath(nextSession.repoConfig.postsBasePath)
      }

      if (nextSession.pageConfig) {
        const segments = nextSession.pageConfig.filePath.split('/')
        setPageFileName(segments.pop() || 'live.md')
        setPageDirectoryPath(segments.join('/'))
        setPageMode(nextSession.pageConfig.mode)
      }

      if (nextSession.repoConfig || nextSession.pageConfig) {
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
    return () => {
      if (pageConfigCollapseTimerRef.current) {
        clearTimeout(pageConfigCollapseTimerRef.current)
      }
      if (repoConfigCollapseTimerRef.current) {
        clearTimeout(repoConfigCollapseTimerRef.current)
      }
      if (settingsCollapseTimerRef.current) {
        clearTimeout(settingsCollapseTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isLocalMode) {
      setRepos([])
      setReposLoading(false)
      return
    }

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
  }, [isLocalMode, session.authenticated, selectedRepoFullName])

  useEffect(() => {
    if (isLocalMode) return
    if (!selectedRepoFullName) return
    const repo = repos.find((item) => item.fullName === selectedRepoFullName)
    if (!repo || selectedBranch) return
    setSelectedBranch(repo.defaultBranch)
  }, [isLocalMode, repos, selectedRepoFullName, selectedBranch])

  useEffect(() => {
    const [owner, repo] = selectedRepoFullName.split('/')

    if (!session.authenticated || !owner || !repo || !selectedBranch.trim()) {
      if (isLocalMode && session.authenticated) {
        // Local mode only needs the current path to browse within LOCAL_REPO_ROOT.
      } else {
      setDirectories([])
      setDirectoryError('')
      return
      }
    }

    async function fetchDirectories() {
      setDirectoriesLoading(true)
      setDirectoryError('')

      try {
        const query = new URLSearchParams({
          path: directoryPath,
          ...(isLocalMode
            ? {}
            : {
                owner,
                repo,
                branch: selectedBranch.trim(),
              }),
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
  }, [isLocalMode, session.authenticated, selectedRepoFullName, selectedBranch, directoryPath])

  useEffect(() => {
    const [owner, repo] = selectedRepoFullName.split('/')

    if (!session.authenticated || (!isLocalMode && (!owner || !repo || !selectedBranch.trim()))) {
      setPageDirectories([])
      setPageDirectoryError('')
      setPageFiles([])
      setPageFilesError('')
      return
    }

    async function fetchPageDirectories() {
      setPageDirectoriesLoading(true)
      setPageDirectoryError('')

      try {
        const query = new URLSearchParams({
          path: pageDirectoryPath,
          ...(isLocalMode
            ? {}
            : {
                owner,
                repo,
                branch: selectedBranch.trim(),
              }),
        })
        const response = await fetch(`/api/github/directories?${query.toString()}`, {
          cache: 'no-store',
        })
        const result = await response.json()

        if (!response.ok || !result.ok) {
          throw new Error(result.error || (isEnglish ? 'Failed to load directories' : '读取目录失败'))
        }

        setPageDirectories((result.directories || []) as GithubDirectoryItem[])
      } catch (error) {
        setPageDirectoryError(error instanceof Error ? error.message : isEnglish ? 'Failed to load directories' : '读取目录失败')
        setPageDirectories([])
      } finally {
        setPageDirectoriesLoading(false)
      }
    }

    fetchPageDirectories()
  }, [isLocalMode, session.authenticated, selectedRepoFullName, selectedBranch, pageDirectoryPath, isEnglish])

  useEffect(() => {
    const [owner, repo] = selectedRepoFullName.split('/')

    if (!session.authenticated || (!isLocalMode && (!owner || !repo || !selectedBranch.trim()))) {
      setPageFiles([])
      setPageFilesError('')
      return
    }

    async function fetchPageFiles() {
      setPageFilesLoading(true)
      setPageFilesError('')

      try {
        const query = new URLSearchParams({
          path: pageDirectoryPath,
          ...(isLocalMode
            ? {}
            : {
                owner,
                repo,
                branch: selectedBranch.trim(),
              }),
        })
        const response = await fetch(`/api/github/page-files?${query.toString()}`, {
          cache: 'no-store',
        })
        const result = await response.json()

        if (!response.ok || !result.ok) {
          throw new Error(result.error || (isEnglish ? 'Failed to load files' : '读取文件失败'))
        }

        setPageFiles((result.files || []) as GithubDirectoryItem[])
      } catch (error) {
        setPageFilesError(error instanceof Error ? error.message : isEnglish ? 'Failed to load files' : '读取文件失败')
        setPageFiles([])
      } finally {
        setPageFilesLoading(false)
      }
    }

    fetchPageFiles()
  }, [isLocalMode, session.authenticated, selectedRepoFullName, selectedBranch, pageDirectoryPath, isEnglish])

  useEffect(() => {
    if (!pageFileOptions.length) return

    if (pageFileOptions.includes(pageFileName)) return

    if (
      savedPageDirectoryPath === pageDirectoryPath
      && savedPageFileName
      && pageFileOptions.includes(savedPageFileName)
    ) {
      setPageFileName(savedPageFileName)
      return
    }

    if (!pageFileName) {
      setPageFileName(pageFileOptions[0])
    }
  }, [pageDirectoryPath, pageFileName, pageFileOptions, savedPageDirectoryPath, savedPageFileName])

  async function handleLogout() {
    if (isLocalMode) {
      router.replace('/')
      return
    }

    await fetch('/api/auth/logout', { method: 'POST' })
    setSession({ authenticated: false })
    setRepos([])
    setDirectories([])
    setSelectedRepoFullName('')
    setSelectedBranch('')
    setPostsBasePath('')
    setDirectoryPath('')
    setPageDirectoryPath('')
    setPageFiles([])
    setPageFileName('')
    setPageMode('live')
    setConfigStatus('')
    setConfigError('')
    setDirectoryError('')
    setPageConfigError('')
    setPageConfigStatus('')
    setVisiblePanel('auth')
    router.replace('/')
  }

  async function handleSaveConfig() {
    if (isLocalMode) {
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
            postsBasePath: postsBasePath.trim(),
          }),
        })
        const result = await response.json()

        if (!response.ok || !result.ok) {
          throw new Error(result.error || (isEnglish ? 'Failed to save repository settings' : '保存配置失败'))
        }

        setSession((prev) => ({ ...prev, repoConfig: result.repoConfig }))
        setConfigStatus(isEnglish ? 'Local repository settings saved.' : '本地仓库配置已保存。')
        return
      } catch (error) {
        setConfigError(error instanceof Error ? error.message : isEnglish ? 'Failed to save repository settings' : '保存配置失败')
        return
      } finally {
        setSavingConfig(false)
      }
    }

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
      if (repoConfigCollapseTimerRef.current) {
        clearTimeout(repoConfigCollapseTimerRef.current)
      }
      repoConfigCollapseTimerRef.current = setTimeout(() => {
        setVisiblePanel((current) => (current === 'repo' ? null : current))
        repoConfigCollapseTimerRef.current = null
      }, 2500)
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

  function handleGoToPagePath(nextPath: string) {
    setPageDirectoryPath(nextPath)
    setPageFileName('')
    setPageConfigError('')
    setPageConfigStatus('')
  }

  function handlePageModeChange(nextMode: 'page' | 'live') {
    setPageMode(nextMode)
    setPageFileName('')
    setPageConfigError('')
    setPageConfigStatus('')
  }

  async function handleCreatePageFile() {
    if (!hasRepoConfig) {
      setNewPageError(isEnglish ? 'Please save repository settings first.' : '请先保存仓库配置。')
      setVisiblePanel('repo')
      return
    }

    if (!newPageFileName.trim()) {
      setNewPageError(isEnglish ? 'Please enter a Markdown file name.' : '请填写 Markdown 文件名。')
      return
    }

    setCreatingPage(true)
    setNewPageError('')
    setNewPageStatus('')

    try {
      const response = await fetch('/api/github/create-page-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directoryPath: newPageDirectory.trim(),
          fileName: newPageFileName.trim(),
          mode: pageMode,
        }),
      })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.error || (isEnglish ? 'Failed to create page file.' : '新增页面失败。'))
      }

      const nextFilePath = String(result.filePath || '')
      const segments = nextFilePath.split('/')
      const nextFileName = segments.pop() || ''
      const nextDir = segments.join('/')

      setPageDirectoryPath(nextDir)
      setPageFileName(nextFileName)
      setNewPageDirectory('')
      setNewPageFileName('')
      setSession((prev) => ({ ...prev, pageConfig: result.pageConfig || prev.pageConfig }))
      setNewPageStatus(
        isEnglish ? `Created: ${nextFilePath}` : `已创建：${nextFilePath}`,
      )
    } catch (error) {
      setNewPageError(
        error instanceof Error ? error.message : isEnglish ? 'Failed to create page file.' : '新增页面失败。',
      )
    } finally {
      setCreatingPage(false)
    }
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

  async function handleConfirmDelete() {
    if (!pendingDeleteFolderName) return
    await removeDraftFromStorage(pendingDeleteFolderName)
    setPendingDeleteFolderName('')
    refreshDrafts()
  }

  function handleRemoteLoaded(folderName: string) {
    refreshDrafts()
    router.push(`/editor/${folderName}`)
  }

  async function handleSavePageConfig(collapseAfterDelay = true) {
    if (!hasRepoConfig) {
      setPageConfigError(isEnglish ? 'Please save repository settings first.' : '请先保存仓库配置。')
      setVisiblePanel('repo')
      return false
    }

    if (!pageFileName.trim()) {
      setPageConfigError(isEnglish ? 'Please enter a file name.' : '请填写页面文件名。')
      return false
    }

    setSavingPageConfig(true)
    setPageConfigError('')
    setPageConfigStatus('')

    try {
      const response = await fetch('/api/github/page-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: pageFilePath,
          mode: pageMode,
        }),
      })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.error || (isEnglish ? 'Failed to save page settings' : '页面配置保存失败'))
      }

      setSession((prev) => ({ ...prev, pageConfig: result.pageConfig }))
      setPageConfigStatus(isEnglish ? 'Page editor settings saved.' : '页面编辑配置已保存。')
      if (pageConfigCollapseTimerRef.current) {
        clearTimeout(pageConfigCollapseTimerRef.current)
      }
      if (collapseAfterDelay) {
        pageConfigCollapseTimerRef.current = setTimeout(() => {
          setVisiblePanel((current) => (current === 'page' ? null : current))
          pageConfigCollapseTimerRef.current = null
        }, 2500)
      }
      return true
    } catch (error) {
      setPageConfigError(error instanceof Error ? error.message : isEnglish ? 'Failed to save page settings' : '页面配置保存失败')
      setVisiblePanel('page')
      return false
    } finally {
      setSavingPageConfig(false)
    }
  }

  async function handleOpenPageEditor() {
    const saved = await handleSavePageConfig(false)
    if (!saved) return
    router.push('/page-editor')
  }

  function togglePanel(panel: Exclude<PanelKey, null>) {
    setVisiblePanel((prev) => (prev === panel ? null : panel))
  }

  return (
    <main
      style={{
        padding: 'clamp(12px, 3vw, 20px)',
        maxWidth: 1080,
        margin: '0 auto',
        display: 'grid',
        gap: 16,
      }}
    >
      <Suspense fallback={null}>
        <SearchParamsEffects
          isEnglish={isEnglish}
          onAuthError={setAuthError}
          onShowAuthPanel={() => setVisiblePanel('auth')}
        />
      </Suspense>
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
                <span>{isEnglish ? 'Repo' : '仓库'}</span>
              </button>

              {!isLocalMode ? (
              <button
                type="button"
                onClick={() => {
                  if (!hasRepoConfig) {
                    setConfigError(isEnglish ? 'Please save repository settings first.' : '请先保存仓库配置。')
                    setVisiblePanel('repo')
                    return
                  }
                  togglePanel('page')
                }}
                style={{
                  ...pillButtonStyle,
                  background: visiblePanel === 'page' ? 'var(--accent)' : 'var(--card)',
                  color: visiblePanel === 'page' ? 'var(--accent-contrast)' : 'var(--foreground)',
                }}
              >
                <PageIcon />
                <span>{isEnglish ? 'Page' : '页面'}</span>
              </button>
              ) : null}

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
                <span>{isEnglish ? 'Setting' : '偏好'}</span>
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
            <h2 style={{ margin: 0, fontSize: 14 }}>
              {isLocalMode ? (isEnglish ? 'Local Repository Mode' : '本地仓库模式') : isEnglish ? 'GitHub Sign In' : 'GitHub 登录'}
            </h2>
            <div style={{ marginTop: 6, fontSize: 14, color: 'var(--muted)' }}>
              {isLocalMode
                ? isEnglish
                  ? 'Local repository mode is enabled. GitHub sign-in is bypassed on this device.'
                  : '当前设备已启用本地仓库模式，不需要 GitHub 登录。'
                : isEnglish
                ? 'Sign in to choose your Hugo repository and continue creating, loading, and publishing posts.'
                : '登录后即可选择你的 Hugo 仓库，并继续新建、读取和发布文章。'}
            </div>
          </div>

          {authLoading ? <div style={{ color: 'var(--muted)' }}>{isEnglish ? 'Checking sign-in status...' : '正在检查登录状态...'}</div> : null}
          {authError ? <div style={{ color: 'var(--danger)' }}>{authError}</div> : null}

          {!authLoading && !session.authenticated && !isLocalMode ? (
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
                    width={36}
                    height={36}
                    style={{ borderRadius: '50%' }}
                  />
                ) : null}
                <div>
                  <div style={{ fontWeight: 700 }}>{session.user.name}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 14 }}>@{session.user.login}</div>
                </div>
              </div>

              {!isLocalMode ? (
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  padding: '10px 12px',
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
              ) : null}
            </>
          ) : null}
        </section>
      ) : null}

      {visiblePanel === 'repo' && session.authenticated ? (
        <section style={cardStyle}>
          <div>
            <h2 style={{ margin: 0, fontSize: 14 }}>{isEnglish ? 'Repository Settings' : '仓库'}</h2>
            <div style={{ marginTop: 6, fontSize: 14, color: 'var(--muted)' }}>
              {isLocalMode
                ? isEnglish
                  ? 'Choose the posts directory inside your local repository root.'
                  : '选择本地仓库根目录中的文章目录。'
                : isEnglish
                ? 'Choose the Hugo repository, branch, and posts directory you want to publish into.'
                : '选择你要发布文章的 Hugo 仓库、分支和文章目录。'}
            </div>
          </div>

          {!isLocalMode ? (
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
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{isEnglish ? 'Local Repository' : '本地仓库'}</span>
              <div style={{ ...inputStyle, wordBreak: 'break-all' }}>
                {session.repoConfig?.owner}/{session.repoConfig?.repo}
              </div>
            </div>
          )}

          {!isLocalMode ? (
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
          ) : null}

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
              <span style={{ fontSize: 14, fontWeight: 700 }}>{isEnglish ? 'Posts Directory' : '文章目录路径'}</span>
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
                <div style={{ fontSize: 14, wordBreak: 'break-all', fontWeight: 600 }}>
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
                <div style={{ marginTop: 8, fontSize: 14, fontWeight: 800, textAlign: 'center', wordBreak: 'break-all', color: postsBasePath ? 'var(--foreground)' : 'var(--muted)' }}>
                  {postsBasePath || (isEnglish ? 'Not selected' : '未选择')}
                </div>
              </div>
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
                    fontSize: 14,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{directory.name}</span>
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
          {configStatus ? (
            <div
              style={{
                color: 'var(--accent-soft-text)',
                background: 'var(--accent-soft)',
                borderRadius: 14,
                padding: '12px 14px',
                textAlign: 'center',
                fontSize: 14,
                fontWeight: 800,
                wordBreak: 'break-all',
              }}
            >
              {configStatus}
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <IconButton label={isEnglish ? 'Go to root directory' : '回到根目录'} icon={<RootIcon />} onClick={() => handleGoToPath('')} disabled={directoriesLoading} />
            <IconButton label={isEnglish ? 'Go up one level' : '返回上级'} icon={<UpIcon />} onClick={() => handleGoToPath(pathSegments.slice(0, -1).join('/'))} disabled={directoriesLoading || !directoryPath} />
            <IconButton label={isEnglish ? 'Use current directory' : '选择当前目录'} icon={<CheckIcon />} onClick={handleSelectCurrentDirectory} disabled={directoriesLoading || !directoryPath} active={Boolean(directoryPath && postsBasePath === directoryPath)} style={{ color: 'color-mix(in srgb, var(--foreground) 78%, var(--accent) 22%)', border: '1px solid var(--accent)', background: directoryPath ? 'color-mix(in srgb, var(--accent-soft) 78%, var(--card) 22%)' : 'var(--card)' }} />
          </div>

          <button
            type="button"
            onClick={handleSaveConfig}
            disabled={savingConfig || reposLoading}
            style={{
              alignSelf: 'start',
              padding: '10px 14px',
              borderRadius: 12,
              background: 'var(--accent)',
              color: 'var(--accent-contrast)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 13,
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
        <SiteSettingsPanel
          onSaved={() => {
            if (settingsCollapseTimerRef.current) {
              clearTimeout(settingsCollapseTimerRef.current)
            }
            settingsCollapseTimerRef.current = setTimeout(() => {
              setVisiblePanel((current) => (current === 'settings' ? null : current))
              settingsCollapseTimerRef.current = null
          }, 2500)
          }}
        />
      ) : null}

      {visiblePanel === 'page' && session.authenticated && !isLocalMode ? (
        <section style={cardStyle}>
          <div>
            <h2 style={{ margin: 0, fontSize: 14 }}>{isEnglish ? 'Page Editor' : '页面'}</h2>
            <div style={{ marginTop: 6, fontSize: 14, color: 'var(--muted)' }}>
              {isEnglish
                ? 'Configure one standalone Hugo page or a quick timeline page, then reopen it anytime.'
                : '配置一个独立 Hugo 页面或生活记录页面，之后可以随时继续编辑。'}
            </div>
          </div>

          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{isEnglish ? 'Page Mode' : '页面模式'}</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {([
                ['live', isEnglish ? 'Quick Timeline' : '生活记录'],
                ['page', isEnglish ? 'Standalone Page' : '独立页面'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handlePageModeChange(value)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: pageMode === value ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: pageMode === value ? 'var(--accent)' : 'var(--card)',
                    color: pageMode === value ? 'var(--accent-contrast)' : 'var(--foreground)',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
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
              <span style={{ fontSize: 14, fontWeight: 700 }}>
                {isEnglish ? 'Page Directory' : '页面目录'}
              </span>
              <span style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                {isEnglish
                  ? 'Choose a directory first, then pick one of the Markdown files that already exists in that directory.'
                  : '先选择页面目录，再从该目录里实际存在的 Markdown 文件中点选目标文件。'}
              </span>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              <div
                style={{
                  padding: 12,
                  borderRadius: 14,
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                }}
              >
                <div style={{ fontSize: 14, wordBreak: 'break-all', fontWeight: 600 }}>
                  {pageDirectoryPath || (isEnglish ? 'Not selected yet' : '尚未选择')}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <IconButton label={isEnglish ? 'Go to root directory' : '回到根目录'} icon={<RootIcon />} onClick={() => handleGoToPagePath('')} disabled={pageDirectoriesLoading} />
                <IconButton label={isEnglish ? 'Go up one level' : '返回上级'} icon={<UpIcon />} onClick={() => handleGoToPagePath(pagePathSegments.slice(0, -1).join('/'))} disabled={pageDirectoriesLoading || !pageDirectoryPath} />
              </div>

              {pageDirectoriesLoading ? (
                <div style={{ color: 'var(--muted)', fontSize: 14 }}>{isEnglish ? 'Loading directories...' : '正在加载目录...'}</div>
              ) : null}
              {pageDirectoryError ? (
                <div style={{ color: 'var(--danger)', fontSize: 14 }}>{pageDirectoryError}</div>
              ) : null}

              <div style={{ display: 'grid', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
                {pageDirectories.map((directory) => (
                  <button
                    key={directory.path}
                    type="button"
                    onClick={() => handleGoToPagePath(directory.path)}
                    style={{
                      textAlign: 'left',
                      padding: '14px 14px',
                      borderRadius: 14,
                      border: '1px solid var(--border)',
                      background: 'var(--card)',
                      color: 'var(--foreground)',
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{directory.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

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
              <span style={{ fontSize: 14, fontWeight: 700 }}>
                {isEnglish ? 'Page File' : '页面文件'}
              </span>
              <span style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                {pageMode === 'live'
                  ? isEnglish
                    ? 'Select the existing Markdown file used for your quick timeline page.'
                    : '请选择用于生活记录页的现有 Markdown 文件。'
                  : isEnglish
                    ? 'Select the existing Markdown file you want to edit as a standalone page.'
                    : '请选择你要作为独立页面编辑的现有 Markdown 文件。'}
              </span>
            </div>

            <div
              style={{
                padding: 12,
                borderRadius: 14,
                border: '1px solid var(--border)',
                background: 'var(--card)',
                display: 'grid',
                gap: 8,
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {isEnglish ? 'Previously saved file' : '之前保存的文件'}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: savedPageFilePath ? 'var(--foreground)' : 'var(--muted)',
                  wordBreak: 'break-all',
                }}
              >
                {savedPageFilePath || (isEnglish ? 'Not saved yet' : '尚未保存')}
              </div>
              {savedPageFilePath && savedPageFilePath !== pageFilePath ? (
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                  {isEnglish
                    ? 'The list below shows files in the current directory. Save again if you want to switch away from the previously saved file.'
                    : '下面列表显示的是当前目录中的文件；如果你想切换到其他文件，需要重新保存。'}
                </div>
              ) : null}
            </div>

            {pageFilesLoading ? (
              <div style={{ color: 'var(--muted)', fontSize: 14 }}>{isEnglish ? 'Loading files...' : '正在加载文件...'}</div>
            ) : null}
            {pageFilesError ? (
              <div style={{ color: 'var(--danger)', fontSize: 14 }}>{pageFilesError}</div>
            ) : null}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 10,
              }}
            >
              {pageFileOptions.map((fileName) => (
                <button
                  key={fileName}
                  type="button"
                  onClick={() => setPageFileName(fileName)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: pageFileName === fileName ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: pageFileName === fileName ? 'var(--accent)' : 'var(--card)',
                    color: pageFileName === fileName ? 'var(--accent-contrast)' : 'var(--foreground)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    textAlign: 'left',
                    wordBreak: 'break-all',
                  }}
                >
                  <span>{fileName}</span>
                  {savedPageDirectoryPath === pageDirectoryPath && savedPageFileName === fileName ? (
                    <span style={{ display: 'inline-flex', marginTop: 6, fontSize: 11, fontWeight: 700, opacity: 0.9 }}>
                      {isEnglish ? 'Saved now' : '当前已保存'}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            {!pageFilesLoading && !pageFilesError && pageFileOptions.length === 0 ? (
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
                  ? 'No Markdown files were found in this directory. Please choose another directory that already contains a page file.'
                  : '这个目录下没有找到 Markdown 文件，请切换到已经存在页面文件的目录。'}
              </div>
            ) : null}
          </section>

          <div style={{ fontSize: 13, color: 'var(--muted)', wordBreak: 'break-all' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{isEnglish ? 'Target file' : '目标文件'}</div>
            <div
              style={{
                marginTop: 8,
                fontSize: 14,
                fontWeight: 800,
                textAlign: 'center',
                color: pageFileName ? 'var(--foreground)' : 'var(--muted)',
              }}
            >
              {pageFilePath || (isEnglish ? 'Not selected' : '未选择')}
            </div>
          </div>

          <section
            style={{
              border: '1px solid var(--border)',
              borderRadius: 16,
              background: 'var(--card-muted)',
              padding: 14,
              display: 'grid',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'grid', gap: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>
                  {isEnglish ? 'Create New Page' : '新增页面'}
                </span>
                <span style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                  {isEnglish
                    ? 'Create a new Markdown page file directly in your repository.'
                    : '在仓库中直接创建新的 Markdown 页面文件。'}
                </span>
              </div>
              <SectionToggleButton
                open={createPageOpen}
                onClick={() => setCreatePageOpen((prev) => !prev)}
                label={createPageOpen ? (isEnglish ? 'Collapse create page section' : '收起新增页面区域') : (isEnglish ? 'Expand create page section' : '展开新增页面区域')}
              />
            </div>

            {createPageOpen ? (
              <>
                <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                  {isEnglish
                    ? 'Tip: after selecting a base directory (for example `page`), you can append nested paths like `page/2026/moments`, then set file name `my-moments.md` to create it directly.'
                    : '提示：可先选基础目录（如 `page`），再在“目录路径”里追加子路径，例如 `page/2026/moments`，再填写文件名 `my-moments.md`，即可直接创建。'}
                </span>

                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{isEnglish ? 'Directory Path' : '目录路径'}</span>
                  <input
                    type="text"
                    value={newPageDirectory}
                    onChange={(e) => setNewPageDirectory(e.target.value)}
                    placeholder={isEnglish ? 'example: page/2026' : '例如：page/2026'}
                    style={inputStyle}
                  />
                </label>

                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{isEnglish ? 'File Name' : '文件名'}</span>
                  <input
                    type="text"
                    value={newPageFileName}
                    onChange={(e) => setNewPageFileName(e.target.value)}
                    placeholder={isEnglish ? 'example: moments.md' : '例如：moments.md'}
                    style={inputStyle}
                  />
                </label>

                {newPageError ? <div style={{ color: 'var(--danger)' }}>{newPageError}</div> : null}
                {newPageStatus ? <div style={{ color: 'var(--accent-soft-text)' }}>{newPageStatus}</div> : null}

                <button
                  type="button"
                  onClick={() => {
                    void handleCreatePageFile()
                  }}
                  disabled={creatingPage}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid var(--accent)',
                    background: 'var(--accent)',
                    color: 'var(--accent-contrast)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    opacity: creatingPage ? 0.7 : 1,
                  }}
                >
                  {creatingPage ? (isEnglish ? 'Creating...' : '创建中...') : isEnglish ? 'Create Page File' : '创建页面文件'}
                </button>
              </>
            ) : null}
          </section>

          {pageConfigError ? <div style={{ color: 'var(--danger)' }}>{pageConfigError}</div> : null}
          {pageConfigStatus ? <div style={{ color: '#1677ff' }}>{pageConfigStatus}</div> : null}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            <button
              type="button"
              onClick={() => {
                void handleSavePageConfig()
              }}
              disabled={savingPageConfig}
              style={{
                padding: '14px 18px',
                borderRadius: 12,
                background: 'var(--accent)',
                color: 'var(--accent-contrast)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                opacity: savingPageConfig ? 0.7 : 1,
              }}
            >
              {savingPageConfig ? (isEnglish ? 'Saving...' : '保存中...') : isEnglish ? 'Save Page Settings' : '保存页面配置'}
            </button>

            <button
              type="button"
              onClick={handleOpenPageEditor}
              disabled={!pageFileName.trim()}
              style={{
                padding: '14px 18px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--card)',
                color: 'var(--foreground)',
                cursor: !pageFileName.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                opacity: !pageFileName.trim() ? 0.6 : 1,
              }}
            >
              {isEnglish ? 'Open Editor' : '打开页面编辑'}
            </button>
          </div>
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
            <h2 style={{ margin: 0, fontSize: 14 }}>{isEnglish ? 'Published Posts' : '已发布文章'}</h2>
            <SectionToggleButton
              open={remotePostsOpen}
              onClick={() => setRemotePostsOpen((prev) => !prev)}
              label={remotePostsOpen ? (isEnglish ? 'Collapse published posts' : '收起已发布文章') : (isEnglish ? 'Expand published posts' : '展开已发布文章')}
            />
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
        <section style={{ display: 'grid', gap: 12 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                hasPageConfig && session.pageConfig?.mode === 'live' && !isLocalMode
                  ? 'repeat(2, minmax(0, 1fr))'
                  : '1fr',
              gap: 12,
            }}
          >
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
                padding: '12px 16px',
                borderRadius: 14,
                background: hasRepoConfig ? 'var(--accent)' : '#9ca3af',
                color: hasRepoConfig ? 'var(--accent-contrast)' : '#fff',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 700,
                textAlign: 'center',
                boxShadow: 'var(--shadow)',
              }}
            >
              {isEnglish ? '+ New Post' : '+ 新建文章'}
            </Link>

            {!isLocalMode && hasPageConfig && session.pageConfig?.mode === 'live' ? (
              <Link
                href="/page-editor"
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  borderRadius: 14,
                  background: 'var(--card)',
                  color: 'var(--foreground)',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 700,
                  textAlign: 'center',
                  boxShadow: 'var(--shadow)',
                  border: '1px solid var(--border)',
                }}
              >
                {isEnglish ? 'Quick Timeline' : '快速发布说说'}
              </Link>
            ) : null}
          </div>
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
            <h2 style={{ margin: 0, fontSize: 14 }}>{isEnglish ? 'Local Drafts' : '本地草稿'}</h2>
            <SectionToggleButton
              open={draftsOpen}
              onClick={() => setDraftsOpen((prev) => !prev)}
              label={draftsOpen ? (isEnglish ? 'Collapse local drafts' : '收起本地草稿') : (isEnglish ? 'Expand local drafts' : '展开本地草稿')}
            />
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
              borderRadius: 18,
              padding: 14,
              boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
              display: 'grid',
              gap: 12,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ fontSize: 14, fontWeight: 700 }}>{isEnglish ? 'Delete this draft?' : '删除这个草稿？'}</div>
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
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: 'none',
                  background: '#d92d20',
                  color: '#fff',
                  fontSize: 14,
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
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  color: 'var(--foreground)',
                  fontSize: 14,
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









