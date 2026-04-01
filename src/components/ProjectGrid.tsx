import type { Project } from '../types/api'

type ProjectGridProps = {
  projects: Project[]
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  const sortedProjects = [...projects].sort((left, right) => {
    const priority = {
      LIVE: 0,
      BUILDING: 1,
      PLANNING: 2,
    }

    return priority[left.status as keyof typeof priority] - priority[right.status as keyof typeof priority]
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
            <span className={`project-status ${project.status.toLowerCase()}`}>{project.status}</span>
          </div>
          <p className="project-summary">{project.summary}</p>
          <div className="tag-list">
            {project.tags.map((tag) => (
              <span key={tag} className="tag-chip">
                {tag}
              </span>
            ))}
          </div>
          <div className="project-links">
            <a href={project.primaryUrl} target="_blank" rel="noreferrer">
              Open
            </a>
            {project.repositoryUrl ? (
              <a href={project.repositoryUrl} target="_blank" rel="noreferrer">
                Repository
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  )
}
