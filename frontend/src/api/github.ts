/**
 * GitHub API calls.
 *
 * Purpose: Fetch repository metadata and README content used on the project
 *          detail page.
 */
import { apiClient } from "@/api/client";

/** Payload returned by GET /api/github/readme. */
export interface ProjectReadme {
  name: string;
  html: string;
  repo: string;
  github_url: string;
}

/**
 * Purpose: Fetch a GitHub repo's README (HTML) via the backend proxy.
 * Inputs:  githubUrl (string) - https://github.com/owner/repo
 * Output:  Promise<ProjectReadme>
 * Example: const readme = await getProjectReadme(project.github_url);
 */
export async function getProjectReadme(githubUrl: string): Promise<ProjectReadme> {
  const { data } = await apiClient.get<ProjectReadme>("/api/github/readme", {
    params: { url: githubUrl },
  });
  return data;
}
