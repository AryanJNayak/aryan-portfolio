/**
 * Form value types (used by the schemas validators and admin/contact forms).
 */

/** Contact form fields. */
export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/** Admin login form fields. */
export interface LoginForm {
  email: string;
  password: string;
}

/** Project create/edit form fields (mirrors the backend ProjectCreate). */
export interface ProjectForm {
  title: string;
  description: string;
  content_html: string;
  tech: string[];
  github_url: string;
  demo_url: string;
  thumbnail: string;
  images: string[];
  video_url: string;
  featured: boolean;
  order: number;
}
