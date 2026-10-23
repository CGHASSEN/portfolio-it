export type ProjectStatus = "draft" | "published";

export type ProjectDoorId =
  | "contact"
  | "certifications"
  | "cybersecurity"
  | "network"
  | "server"
  | "virtualization"
  | "projects";

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
  doorIds?: ProjectDoorId[];
  date: string;
  status: ProjectStatus;
  isExample?: boolean;
};

export type ManagedProject = PortfolioProject & {
  doorIds: ProjectDoorId[];
  coverImagePath: string;
  screenshotPaths: string[];
};
