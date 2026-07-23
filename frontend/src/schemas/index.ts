/**
 * Lightweight client-side validation schemas.
 *
 * Purpose: Validate form inputs (contact form, project editor, login) before
 *          sending them to the API. Kept dependency-free (no zod) to stay small;
 *          each validator returns an errors map ({} means valid).
 */

import type { ContactForm, LoginForm, ProjectForm } from "@/types/forms";

/** Basic email pattern (good enough for UX-level validation). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Purpose: Validate the contact form.
 * Inputs:  values (ContactForm).
 * Output:  Record<field, message> of errors (empty object = valid).
 * Example: validateContact({name:"", email:"x", message:""})
 */
export function validateContact(values: ContactForm): Partial<Record<keyof ContactForm, string>> {
  const errors: Partial<Record<keyof ContactForm, string>> = {};
  if (!values.name.trim()) errors.name = "Name is required.";
  if (!EMAIL_RE.test(values.email)) errors.email = "Enter a valid email address.";
  if (values.message.trim().length < 5) errors.message = "Message is too short.";
  return errors;
}

/**
 * Purpose: Validate the admin login form.
 * Inputs:  values (LoginForm).
 * Output:  errors map (empty = valid).
 */
export function validateLogin(values: LoginForm): Partial<Record<keyof LoginForm, string>> {
  const errors: Partial<Record<keyof LoginForm, string>> = {};
  if (!EMAIL_RE.test(values.email)) errors.email = "Enter a valid email.";
  if (!values.password) errors.password = "Password is required.";
  return errors;
}

/**
 * Purpose: Validate the project create/edit form.
 * Inputs:  values (ProjectForm).
 * Output:  errors map (empty = valid).
 */
export function validateProject(values: ProjectForm): Partial<Record<keyof ProjectForm, string>> {
  const errors: Partial<Record<keyof ProjectForm, string>> = {};
  if (!values.title.trim()) errors.title = "Title is required.";
  if (values.github_url && !/^https?:\/\//.test(values.github_url))
    errors.github_url = "Must be a valid URL.";
  if (values.demo_url && !/^https?:\/\//.test(values.demo_url))
    errors.demo_url = "Must be a valid URL.";
  return errors;
}
