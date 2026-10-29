import { useEffect, useState } from "react";
import { projects as exampleProjects } from "../data/portfolio";
import { PROJECT_MEDIA_URL_REFRESH_MS } from "../lib/projectMedia";
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
    let requestId = 0;
    let refreshing = false;
    let lastRefreshAt = Date.now();
    const refresh = async () => {
      if (refreshing) return;
      refreshing = true;
      const currentRequestId = ++requestId;
      try {
        const published = await listPublishedProjects();
        if (!active || currentRequestId !== requestId) return;
        setProjects(mergePublishedProjects(published));
        setSourceStatus("connected");
        setSourceError("");
        lastRefreshAt = Date.now();
      } catch (error: unknown) {
        if (!active || currentRequestId !== requestId) return;
        setSourceStatus("unavailable");
        setSourceError(error instanceof Error ? error.message : "La source de projets est indisponible.");
      } finally {
        refreshing = false;
      }
    };
    const refreshIfStale = () => {
      if (document.visibilityState === "visible" && Date.now() - lastRefreshAt >= PROJECT_MEDIA_URL_REFRESH_MS) {
        void refresh();
      }
    };
    void refresh();
    const intervalId = window.setInterval(() => void refresh(), PROJECT_MEDIA_URL_REFRESH_MS);
    document.addEventListener("visibilitychange", refreshIfStale);
    return () => {
      active = false;
      requestId += 1;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshIfStale);
    };
  }, []);

  return { projects, sourceStatus, sourceError };
}
