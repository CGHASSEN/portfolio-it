import type { PortfolioProject } from "../types/project";
import { projectImageBucket, supabase } from "../lib/supabase";

type ProjectRow = {
  id: string;
  sort_order: number;
  title: string;
  description: string;
  objective: string;
  technologies: string[];
  steps: string[];
  results: string;
  cover_image_path: string | null;
  screenshot_paths: string[];
  repository_url: string | null;
  demo_url: string | null;
  category: string;
  door_ids: PortfolioProject["doorIds"];
  project_date: string | null;
  status: "draft" | "published";
};

async function signedImage(path: string | null | undefined) {
  if (!path) return "";
  if (!supabase) throw new Error("Supabase n’est pas configuré.");
  const { data, error } = await supabase.storage
    .from(projectImageBucket)
    .createSignedUrl(path, 60 * 60);
  if (error) throw new Error(`Impossible de charger une image de projet : ${error.message}`);
  return data.signedUrl;
}

function mapRow(row: ProjectRow, coverImage: string, screenshots: string[]): PortfolioProject {
  return {
    id: row.id,
    orderIndex: row.sort_order,
    title: row.title,
    description: row.description,
    objective: row.objective,
    technologies: row.technologies,
    steps: row.steps,
    results: row.results,
    coverImage,
    screenshots,
    repositoryUrl: row.repository_url ?? "",
    demoUrl: row.demo_url ?? "",
    category: row.category,
    doorIds: row.door_ids ?? [],
    date: row.project_date ?? "",
    status: row.status,
  };
}

export async function listPublishedProjects(): Promise<PortfolioProject[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("projects")
    .select("id,sort_order,title,description,objective,technologies,steps,results,cover_image_path,screenshot_paths,repository_url,demo_url,category,door_ids,project_date,status")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Les projets publiés n’ont pas pu être chargés : ${error.message}`);

  return Promise.all((data as ProjectRow[]).map(async (row) => {
    const [coverImage, screenshots] = await Promise.all([
      signedImage(row.cover_image_path),
      Promise.all((row.screenshot_paths ?? []).map((path) => signedImage(path))),
    ]);
    return mapRow(row, coverImage, screenshots);
  }));
}
