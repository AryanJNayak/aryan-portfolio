/**
 * Shared TypeScript interfaces/types for the whole app.
 *
 * Purpose: Provide a single source of truth for the shapes returned by the API
 *          so components and API calls stay type-safe.
 */

/** A portfolio project (curated in DB or imported from GitHub). */
export interface Project {
  id: string;
  title: string;
  description: string;
  content_html: string;
  tech: string[];
  github_url: string | null;
  demo_url: string | null;
  thumbnail: string | null;
  images: string[];
  video_url: string | null;
  featured: boolean;
  order: number;
  source: "manual" | "github";
  stars: number;
  language: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/** A single LeetCode contest performance. */
export interface ContestEntry {
  title: string;
  ranking: number | null;
  /** Total people who participated in that contest (for "Rank X / Y"). */
  total_participants: number | null;
  rating: number | null;
  percentage_top: number | null;
}

/** LeetCode mini-profile stats card payload. */
export interface LeetCodeStats {
  username: string;
  profile_url: string;
  ranking: number | null;
  total_solved: number;
  easy_solved: number;
  medium_solved: number;
  hard_solved: number;
  total_questions: number;
  acceptance_rate: number | null;
  current_rating: number | null;
  highest_rating: number | null;
  global_ranking: number | null;
  attended_contests: number;
  top_contests: ContestEntry[];
}

/** One professional experience entry. */
export interface Experience {
  role: string;
  company: string;
  location: string;
  start: string;
  end: string;
  current: boolean;
  highlights: string[];
}

/** One education entry. */
export interface Education {
  degree: string;
  institution: string;
  start: string;
  end: string;
  score: string;
}

/** External profile links. */
export interface Socials {
  github: string;
  linkedin: string;
  leetcode: string;
  geeksforgeeks: string;
}

/** Full profile object from GET /api/profile. */
export interface Profile {
  name: string;
  title: string;
  tagline: string;
  location: string;
  email: string;
  resume_drive_url: string;
  resume_pdf: string;
  socials: Socials;
  experience: Experience[];
  education: Education[];
  skills: Record<string, string[]>;
  achievements: string[];
}

/** Auth token response. */
export interface TokenResponse {
  access_token: string;
  token_type: string;
}

/** Response after uploading media to GridFS. */
export interface MediaUploadResponse {
  id: string;
  url: string;
  content_type: string;
}
