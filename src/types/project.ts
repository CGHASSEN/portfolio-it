export type ProjectStatus = "draft" | "published";

export type PortfolioProject = {
  id: string;
  orderIndex: number;
  title: string;
  description: string;
  objective: string;
  technologies: string[];
  steps: string[];
  results: string;
  coverImage: string;
  screenshots: string[];
  repositoryUrl: string;
  demoUrl: string;
  category: string;
  date: string;
  status: ProjectStatus;
  isExample?: boolean;
};

export type ManagedProject = PortfolioProject & {
  coverImagePath: string;
  screenshotPaths: string[];
};
