import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProfileApi } from '../api/profileApi'
import { getProjectsApi } from '../api/projectApi'
import { ProjectGrid } from '../components/ProjectGrid'
import type { Profile, Project } from '../types/api'

function projectPriority(project: Project) {
  if (project.status === 'LIVE') {
    return 0
  }

  if (project.liveUrl) {
    return 1
  }

  if (project.name === 'HomeHarmony' || project.name === 'TripMemo') {
    return 2
  }

  return 3
}

export function HomePage() {
  const appName = import.meta.env.VITE_APP_NAME ?? 'home'
  const [profile, setProfile] = useState<Profile | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [errorMessage, setErrorMessage] = useState('')

  const liveCount = projects.filter((project) => project.status === 'LIVE').length
  const buildingCount = projects.filter((project) => project.status === 'BUILDING').length
  const planningCount = projects.filter((project) => project.status === 'PLANNING').length
  const featuredProjects = [...projects]
    .sort((left, right) => {
      const priorityGap = projectPriority(left) - projectPriority(right)
      if (priorityGap !== 0) {
        return priorityGap
      }

      return right.tags.length - left.tags.length
    })
    .slice(0, 3)

  useEffect(() => {
    Promise.all([getProfileApi(), getProjectsApi()])
      .then(([profileResponse, projectResponse]) => {
        if (!profileResponse.success || !profileResponse.data) {
          setErrorMessage(profileResponse.message ?? '프로필 조회에 실패했습니다.')
          return
        }

        if (!projectResponse.success || !projectResponse.data) {
          setErrorMessage(projectResponse.message ?? '프로젝트 조회에 실패했습니다.')
          return
        }

        setProfile(profileResponse.data)
        setProjects(projectResponse.data)
        setErrorMessage('')
      })
      .catch(() => {
        setErrorMessage('홈 데이터를 불러오지 못했습니다.')
      })
  }, [])

  return (
    <main className="page-shell">
      <header className="hero-section">
        <div className="hero-copy-block">
          <p className="eyebrow">{appName}</p>
          <h1>{profile?.title ?? 'Public Service Hub'}</h1>
          <p className="hero-summary">
            {profile?.summary ?? '개인 프로젝트와 공개 저장소를 한 곳에서 연결하는 공개 허브'}
          </p>
          <div className="hero-actions">
            <Link className="primary-link" to="/about">
              About Me
            </Link>
            <Link className="secondary-link" to="/assistant">
              AI Assistant
            </Link>
            {profile?.links.github ? (
              <a className="secondary-link" href={profile.links.github} target="_blank" rel="noreferrer">
                GitHub
              </a>
            ) : null}
          </div>
        </div>
        <div className="hero-side-card">
          <span className="control-label">핵심 강점</span>
          <ul className="strength-list">
            {profile?.strengths.map((strength) => (
              <li key={strength}>{strength}</li>
            ))}
          </ul>
        </div>
      </header>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

      <section className="stats-grid">
        <article className="stat-card">
          <span className="control-label">Projects</span>
          <strong>{projects.length}</strong>
          <p>공개 허브에 연결된 프로젝트 수</p>
        </article>
        <article className="stat-card">
          <span className="control-label">Live</span>
          <strong>{liveCount}</strong>
          <p>바로 확인 가능한 프로젝트</p>
        </article>
        <article className="stat-card">
          <span className="control-label">Building</span>
          <strong>{buildingCount}</strong>
          <p>현재 확장 중인 프로젝트</p>
        </article>
        <article className="stat-card">
          <span className="control-label">Planning</span>
          <strong>{planningCount}</strong>
          <p>다음 단계로 준비 중인 아이디어</p>
        </article>
      </section>

      {profile ? (
        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Links</p>
              <h2>바로가기</h2>
            </div>
          </div>
          <div className="quick-link-grid">
            {Object.entries(profile.links).map(([label, href]) => (
              <a key={label} className="quick-link-card" href={href} target="_blank" rel="noreferrer">
                <span className="control-label">{label}</span>
                <strong>{href.replace(/^https?:\/\//, '')}</strong>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Start Here</p>
            <h2>지금 보기 좋은 프로젝트</h2>
          </div>
          <p className="section-note">최근 완성도가 높거나 바로 탐색하기 좋은 프로젝트를 먼저 보여준다.</p>
        </div>
        <div className="featured-project-grid">
          {featuredProjects.map((project) => (
            <article key={project.id} className="featured-project-card">
              <div className="featured-project-header">
                <span className={`project-status ${project.status.toLowerCase()}`}>{project.status}</span>
                <span className="featured-project-category">{project.category}</span>
              </div>
              <h3>{project.name}</h3>
              <p>{project.summary}</p>
              <div className="featured-project-tags">
                {project.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="tag-chip">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="featured-project-links">
                {project.liveUrl ? (
                  <a href={project.liveUrl} target="_blank" rel="noreferrer">
                    Live
                  </a>
                ) : null}
                {project.repositoryUrl ? (
                  <a href={project.repositoryUrl} target="_blank" rel="noreferrer">
                    Repository
                  </a>
                ) : null}
                {project.docsUrl ? (
                  <a href={project.docsUrl} target="_blank" rel="noreferrer">
                    Docs
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Projects</p>
            <h2>대표 프로젝트</h2>
          </div>
          <p className="section-note">공개 저장소와 연결 상태를 기준으로 전체 프로젝트를 정리했다.</p>
        </div>
        <ProjectGrid projects={projects} />
      </section>
    </main>
  )
}
