import type { Project } from '../types/api'

type ProjectGridProps = {
  projects: Project[]
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  const statusLabel = {
    LIVE: 'Live',
    BUILDING: 'Building',
    PLANNING: 'Planning',
  } as const

  const projectAccessText = (project: Project) => {
    if (project.liveUrl) {
      return '바로 확인 가능'
    }

    if (project.repositoryUrl && project.docsUrl) {
      return '코드와 참고 링크 제공'
    }

    if (project.repositoryUrl) {
      return '저장소 중심'
    }

    return '준비 중'
  }

  const sortedProjects = [...projects].sort((left, right) => {
    const priority = {
      LIVE: 0,
      BUILDING: 1,
      PLANNING: 2,
    }

    const statusGap = priority[left.status as keyof typeof priority] - priority[right.status as keyof typeof priority]
    if (statusGap !== 0) {
      return statusGap
    }

    const featuredNamePriority = (project: Project) => {
      if (project.name === 'SignalDesk') return 0
      if (project.name === 'RouteOps') return 1
      if (project.name === 'MetroPulse') return 2
      return 3
    }

    const featuredGap = featuredNamePriority(left) - featuredNamePriority(right)
    if (featuredGap !== 0) {
      return featuredGap
    }

    return right.tags.length - left.tags.length
  })

  return (
    <section className="project-grid">
      {sortedProjects.map((project) => (
        <article key={project.id} className="project-card">
          <div className="project-card-header">
            <div>
              <span className="project-category">{project.category}</span>
              <h3>{project.name}</h3>
            </div>
            <span className={`project-status ${project.status.toLowerCase()}`}>
              {statusLabel[project.status as keyof typeof statusLabel] ?? project.status}
            </span>
          </div>
          <p className="project-summary">{project.summary}</p>
          <div className="project-meta">
            <span>{project.tags.length} tags</span>
            <span>{projectAccessText(project)}</span>
          </div>
          <div className="tag-list">
            {project.tags.map((tag) => (
              <span key={tag} className="tag-chip">
                {tag}
              </span>
            ))}
          </div>
          <div className="project-links">
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
    </section>
  )
}
