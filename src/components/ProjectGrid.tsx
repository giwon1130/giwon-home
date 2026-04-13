import type { Project } from '../types/api'

type ProjectGridProps = {
  projects: Project[]
}

const STATUS_LABEL = { LIVE: 'Live', BUILDING: 'Building', PLANNING: 'Planning' } as const

const STATUS_PRIORITY = { LIVE: 0, BUILDING: 1, PLANNING: 2 } as const

const FEATURED_PRIORITY: Record<string, number> = {
  SignalDesk: 0, RouteOps: 1, MetroPulse: 2,
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  const sorted = [...projects].sort((a, b) => {
    const statusDiff =
      (STATUS_PRIORITY[a.status as keyof typeof STATUS_PRIORITY] ?? 3) -
      (STATUS_PRIORITY[b.status as keyof typeof STATUS_PRIORITY] ?? 3)
    if (statusDiff !== 0) return statusDiff

    const featuredDiff =
      (FEATURED_PRIORITY[a.name] ?? 10) - (FEATURED_PRIORITY[b.name] ?? 10)
    if (featuredDiff !== 0) return featuredDiff

    return b.tags.length - a.tags.length
  })

  return (
    <section className="project-grid">
      {sorted.map((project) => (
        <article key={project.id} className="project-card">
          <div className="project-card-header">
            <div>
              <span className="project-category">{project.category}</span>
              <h3>{project.name}</h3>
            </div>
            <span className={`project-status ${project.status.toLowerCase()}`}>
              {STATUS_LABEL[project.status as keyof typeof STATUS_LABEL] ?? project.status}
            </span>
          </div>

          <p className="project-summary">{project.headline ?? project.summary}</p>
          {project.headline ? <p className="project-detail">{project.summary}</p> : null}

          {project.tags.length > 0 && (
            <div className="tag-list">
              {project.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="tag-chip">{tag}</span>
              ))}
              {project.tags.length > 4 && (
                <span className="tag-chip tag-chip-muted">+{project.tags.length - 4}</span>
              )}
            </div>
          )}

          {(project.liveUrl || project.repositoryUrl || project.docsUrl) && (
            <div className="project-links">
              {project.liveUrl && (
                <a href={project.liveUrl} target="_blank" rel="noreferrer">Live →</a>
              )}
              {project.repositoryUrl && (
                <a href={project.repositoryUrl} target="_blank" rel="noreferrer">Repository</a>
              )}
              {project.docsUrl && (
                <a href={project.docsUrl} target="_blank" rel="noreferrer">Docs</a>
              )}
            </div>
          )}
        </article>
      ))}
    </section>
  )
}
