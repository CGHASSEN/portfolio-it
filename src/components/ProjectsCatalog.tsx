import { useState } from "react";
import type { PortfolioProject } from "../types/project";
import type { ProjectSourceStatus } from "../hooks/usePortfolioProjects";
import { ProjectCoverMedia } from "./ProjectCoverMedia";

export function ProjectsCatalog({
  projects,
  sourceStatus,
  sourceError,
}: {
  projects: PortfolioProject[];
  sourceStatus: ProjectSourceStatus;
  sourceError: string;
}) {
  const [openProject, setOpenProject] = useState<string | null>(null);

  return (
    <>
      {sourceStatus === "unavailable" && (
        <p className="projects-source-note" role="status">
          La base de projets est indisponible ; les fiches de démonstration restent consultables.
          {sourceError && <span> {sourceError}</span>}
        </p>
      )}
      {sourceStatus === "not-configured" && (
        <p className="projects-source-note" role="status">
          Catalogue administrable non configuré — seules les démonstrations fictives sont affichées.
        </p>
      )}
      {sourceStatus === "loading" && (
        <p className="projects-source-note" role="status">Chargement des projets publiés…</p>
      )}
      <div className="project-list">
        {projects.map((project, index) => {
          const expanded = openProject === project.id;
          return (
            <article className={`project-card${expanded ? " project-card--expanded" : ""}`} key={project.id}>
              <span className="project-card__number">{String(index + 1).padStart(2, "0")}</span>
              <div className="project-card__content">
                <p className="eyebrow">{project.category}{project.isExample ? " · DÉMONSTRATION FICTIVE" : ""}</p>
                <h3>{project.title}</h3>
                <p className="project-card__description">{project.description}</p>
                <ul aria-label="Technologies" className="tag-list">
                  {project.technologies.map((technology) => <li key={technology}>{technology}</li>)}
                </ul>
                <button
                  aria-expanded={expanded}
                  className="project-card__details-toggle"
                  onClick={() => setOpenProject(expanded ? null : project.id)}
                  type="button"
                >
                  {expanded ? "FERMER LA FICHE" : "VOIR LA FICHE PROJET"} <span aria-hidden="true">{expanded ? "−" : "+"}</span>
                </button>
                {expanded && (
                  <div className="project-details">
                    {project.coverImage && <ProjectCoverMedia alt={`Illustration : ${project.title}`} className="project-details__cover" src={project.coverImage} />}
                    <h4>Objectif</h4>
                    <p>{project.objective || "À compléter."}</p>
                    <h4>Étapes de réalisation</h4>
                    {project.steps.length > 0
                      ? <ol>{project.steps.map((step, stepIndex) => <li key={`${stepIndex}-${step}`}>{step}</li>)}</ol>
                      : <p>À compléter.</p>}
                    <h4>Résultats</h4>
                    <p>{project.results || "À compléter."}</p>
                    {project.screenshots.length > 0 && (
                      <div className="project-details__screenshots">
                        {project.screenshots.map((image, imageIndex) => (
                          <a href={image} key={image} rel="noreferrer" target="_blank">
                            <img alt={`Capture ${imageIndex + 1} : ${project.title}`} loading="lazy" src={image} />
                          </a>
                        ))}
                      </div>
                    )}
                    <div className="project-details__links">
                      {project.repositoryUrl && <a href={project.repositoryUrl} rel="noreferrer" target="_blank">DÉPÔT ↗</a>}
                      {project.demoUrl && <a href={project.demoUrl} rel="noreferrer" target="_blank">DÉMONSTRATION ↗</a>}
                      {project.date && <span>{project.date}</span>}
                    </div>
                  </div>
                )}
              </div>
              <button
                aria-label={`${expanded ? "Fermer" : "Ouvrir"} la fiche ${project.title}`}
                className="project-card__arrow"
                onClick={() => setOpenProject(expanded ? null : project.id)}
                type="button"
              >
                {expanded ? "−" : "↗"}
              </button>
            </article>
          );
        })}
      </div>
    </>
  );
}
