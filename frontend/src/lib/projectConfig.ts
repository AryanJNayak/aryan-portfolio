/**
 * Project display configuration.
 *
 * Purpose: Control WHICH projects appear in the public "Projects" section, in
 *          WHAT order, and which local card thumbnail (+ height) to use — without
 *          touching the database or the API.
 *
 * How it works:
 *   - `VISIBLE_PROJECTS` is an ordered list of project titles. Matching is
 *     case-insensitive and trims spaces.
 *   - When the list is NON-EMPTY, only the listed projects are shown, in that
 *     exact order. When EMPTY, ALL projects are shown.
 *   - `PROJECT_THUMBNAILS` maps a project title → image path + optional height.
 *     Used ONLY on the project CARD (not the detail page).
 *
 * Thumbnail height:
 *   - Set `height` as a number (pixels) or a CSS string (e.g. "200px", "12rem").
 *   - Omit `height` to use the default (`DEFAULT_THUMBNAIL_HEIGHT`).
 */

/** Ordered whitelist of project titles to show (empty = show everything). */
export const VISIBLE_PROJECTS: string[] = [
  "AIProjectManager",
  "AI-Job-Search",
  "Examiner",
  "FlipkartAssistant",
  "AI_QandA",
  "JOiNTOMEET",
  "encryptor-decryptor",
  "UNFORGOT",
];

/** Default card thumbnail height when a project does not set its own. */
export const DEFAULT_THUMBNAIL_HEIGHT = 180; // px

/** Per-project card thumbnail config (src + optional height). */
export interface ProjectThumbnailConfig {
  /** Path under `public/` (e.g. "/Thumbnail/Foo.png"). */
  src: string;
  /**
   * Card image area height only (width stays 100%).
   * Number = pixels. String = any CSS length ("200px", "14rem", …).
   * Leave unset to use DEFAULT_THUMBNAIL_HEIGHT.
   */
  height?: number | string;
}

/**
 * Card-only thumbnail map.
 * Keys = project titles (same matching rules as VISIBLE_PROJECTS).
 * Customize each `height` independently below.
 */
export const PROJECT_THUMBNAILS: Record<string, ProjectThumbnailConfig> = {
  AIProjectManager: { src: "/Thumbnail/AIProjectManager.png", height: 180 },
  "AI-Job-Search": { src: "/Thumbnail/AICareer.jpeg", height: 180 },
  Examiner: { src: "/Thumbnail/Examee.jpg", height: 180 },
  FlipkartAssistant: { src: "/Thumbnail/FlipkartAssistant.png", height: 180 },
  AI_QandA: { src: "/Thumbnail/AIQandA.png", height: 180 },
  JOiNTOMEET: { src: "/Thumbnail/JOINtoMeet.png", height: 180 },
};

/** Normalize a title for tolerant matching (trim + lowercase). */
function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}

/** Lookup map: normalized title → thumbnail config. */
const THUMBNAIL_BY_TITLE = new Map<string, ProjectThumbnailConfig>(
  Object.entries(PROJECT_THUMBNAILS).map(([title, config]) => [
    normalizeTitle(title),
    config,
  ]),
);

/**
 * Purpose: Resolve the card thumbnail (src + height) for a project.
 * Inputs:  title (string) - project title.
 * Output:  { src, heightCss } or null if none is configured.
 *
 * Note: Used by ProjectCard only — the detail page must NOT use this.
 */
export function getProjectThumbnail(
  title: string,
): { src: string; heightCss: string } | null {
  const config = THUMBNAIL_BY_TITLE.get(normalizeTitle(title));
  if (!config) return null;

  const height = config.height ?? DEFAULT_THUMBNAIL_HEIGHT;
  const heightCss = typeof height === "number" ? `${height}px` : height;

  return { src: config.src, heightCss };
}

/**
 * Purpose: Apply the `VISIBLE_PROJECTS` curation to a list of projects.
 * Inputs:  projects (T[]) - any objects that have a `title`.
 * Output:  filtered + ordered list (or the original list if no curation is set).
 */
export function selectVisibleProjects<T extends { title: string }>(projects: T[]): T[] {
  if (VISIBLE_PROJECTS.length === 0) return projects;

  const orderByTitle = new Map<string, number>(
    VISIBLE_PROJECTS.map((title, index) => [normalizeTitle(title), index]),
  );

  return projects
    .filter((project) => orderByTitle.has(normalizeTitle(project.title)))
    .sort(
      (a, b) =>
        orderByTitle.get(normalizeTitle(a.title))! -
        orderByTitle.get(normalizeTitle(b.title))!,
    );
}
