import { useEffect, useState } from "react";
import { projects as exampleProjects } from "../data/portfolio";
import { supabaseConfigured } from "../lib/supabase";
import { listPublishedProjects } from "../services/projects";
import type { PortfolioProject } from "../types/project";

export type ProjectSourceStatus = "not-configured" | "loading" | "connected" | "unavailable";

function mergePublishedProjects(publishedProjects: PortfolioProject[]) {
  const exampleTitles = new Set(exampleProjects.map((project) => project.title));
  const publishedExamples = new Map<string, PortfolioProject>();

  for (const project of publishedProjects) {
    if (exampleTitles.has(project.title) && !publishedExamples.has(project.title)) {
      publishedExamples.set(project.title, project);
    }
  }

  return [
    ...exampleProjects.map((project) => publishedExamples.get(project.title) ?? project),
    ...publishedProjects.filter((project) => !exampleTitles.has(project.title)),
  ];
}

export function usePortfolioProjects() {
  const [projects, setProjects] = useState<PortfolioProject[]>(exampleProjects);
  const [sourceStatus, setSourceStatus] = useState<ProjectSourceStatus>(
    supabaseConfigured ? "loading" : "not-configured",
  );
  const [sourceError, setSourceError] = useState("");

  useEffect(() => {
    if (!supabaseConfigured) return;
    let active = true;
    listPublishedProjects()
      .then((published) => {
        if (!active) return;
        setProjects(mergePublishedProjects(published));
        setSourceStatus("connected");
        setSourceError("");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setSourceStatus("unavailable");
        setSourceError(error instanceof Error ? error.message : "La source de projets est indisponible.");
      });
    return () => {
      active = false;
    };
  }, []);

  return { projects, sourceStatus, sourceError };
}
