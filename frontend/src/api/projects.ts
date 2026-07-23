/**
 * Project API calls.
 *
 * Purpose: Public listing + admin CRUD for projects.
 */
import { apiClient } from "@/api/client";
import type { Project } from "@/types";
import type { ProjectForm } from "@/types/forms";

/**
 * Purpose: Get the merged public project list (curated + GitHub).
 * Output:  Promise<Project[]>.
 * Example: const projects = await getProjects();
 */
export async function getProjects(): Promise<Project[]> {
  const { data } = await apiClient.get<Project[]>("/api/projects");
  return data;
}

/**
 * Purpose: Fetch a single public project (curated or GitHub) for the detail page.
 * Inputs:  id (string) - the public project id.
 * Output:  Promise<Project>.
 * Example: const project = await getProjectById("gh_MyRepo");
 */
export async function getProjectById(id: string): Promise<Project> {
  const { data } = await apiClient.get<Project>(`/api/projects/${encodeURIComponent(id)}`);
  return data;
}

/**
 * Purpose: Get the total project count for the animated stat counter.
 * Output:  Promise<number>.
 */
export async function getProjectCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>("/api/projects/count");
  return data.count;
}

/**
 * Purpose: List only admin-curated projects (admin dashboard).
 * Output:  Promise<Project[]> (requires a valid token).
 */
export async function getCuratedProjects(): Promise<Project[]> {
  const { data } = await apiClient.get<Project[]>("/api/projects/curated");
  return data;
}

/**
 * Purpose: Create a new curated project.
 * Inputs:  form (ProjectForm).
 * Output:  Promise<Project> - the created project.
 */
export async function createProject(form: ProjectForm): Promise<Project> {
  const { data } = await apiClient.post<Project>("/api/projects", form);
  return data;
}

/**
 * Purpose: Update an existing project.
 * Inputs:  id (string), partial ProjectForm fields.
 * Output:  Promise<Project> - the updated project.
 */
export async function updateProject(id: string, form: Partial<ProjectForm>): Promise<Project> {
  const { data } = await apiClient.put<Project>(`/api/projects/${id}`, form);
  return data;
}

/**
 * Purpose: Delete a curated project.
 * Inputs:  id (string).
 * Output:  Promise<void>.
 */
export async function deleteProject(id: string): Promise<void> {
  await apiClient.delete(`/api/projects/${id}`);
}
