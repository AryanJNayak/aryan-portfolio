/**
 * ProjectEditor (admin).
 *
 * Purpose: Create or edit a project — title, description, tech, links, cover
 *          images + demo video (uploaded to GridFS), and rich HTML content.
 *
 * Inputs:
 *   initial (Project | null) - project to edit, or null to create a new one.
 *   onSaved (fn)             - called after a successful save.
 *   onCancel (fn)            - close the editor without saving.
 */
import { useState } from "react";
import { FiUpload, FiX } from "react-icons/fi";

import RichTextEditor from "@/admin/RichTextEditor";
import { createProject, updateProject } from "@/api/projects";
import { uploadMedia } from "@/api/media";
import { validateProject } from "@/schemas";
import type { Project } from "@/types";
import type { ProjectForm } from "@/types/forms";

interface ProjectEditorProps {
  initial: Project | null;
  onSaved: () => void;
  onCancel: () => void;
}

/** Build a blank/edit form from an existing project (or defaults). */
function toForm(p: Project | null): ProjectForm {
  return {
    title: p?.title ?? "",
    description: p?.description ?? "",
    content_html: p?.content_html ?? "",
    tech: p?.tech ?? [],
    github_url: p?.github_url ?? "",
    demo_url: p?.demo_url ?? "",
    thumbnail: p?.thumbnail ?? "",
    images: p?.images ?? [],
    video_url: p?.video_url ?? "",
    featured: p?.featured ?? false,
    order: p?.order ?? 0,
  };
}

export default function ProjectEditor({ initial, onSaved, onCancel }: ProjectEditorProps) {
  const [form, setForm] = useState<ProjectForm>(toForm(initial));
  const [techInput, setTechInput] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectForm, string>>>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ProjectForm>(key: K, value: ProjectForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  /** Purpose: Add a tech tag from the input. */
  const addTech = () => {
    const t = techInput.trim();
    if (t && !form.tech.includes(t)) set("tech", [...form.tech, t]);
    setTechInput("");
  };

  /** Purpose: Upload a single thumbnail/cover image and set its URL. */
  const handleThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { url } = await uploadMedia(file);
    set("thumbnail", url);
    e.target.value = "";
  };

  /** Purpose: Upload one or more images and append their URLs. */
  const handleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const urls: string[] = [];
    for (const file of files) {
      const { url } = await uploadMedia(file);
      urls.push(url);
    }
    set("images", [...form.images, ...urls]);
    e.target.value = "";
  };

  /** Purpose: Upload a demo video and set its URL. */
  const handleVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { url } = await uploadMedia(file);
    set("video_url", url);
    e.target.value = "";
  };

  /** Purpose: Validate then create/update the project. */
  const handleSave = async () => {
    const found = validateProject(form);
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    setSaving(true);
    try {
      if (initial && initial.source === "manual") {
        await updateProject(initial.id, form);
      } else {
        await createProject(form);
      }
      onSaved();
    } catch {
      alert("Save failed. Check your login and the backend.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-slate-100 outline-none focus:border-brand-400";

  return (
    <div className="space-y-4 rounded-2xl p-6 glass">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-slate-100">
          {initial ? "Edit Project" : "New Project"}
        </h2>
        <button onClick={onCancel} className="rounded-full p-2 text-slate-400 hover:text-brand-300">
          <FiX />
        </button>
      </div>

      <div>
        <label className="mb-1 block text-sm text-slate-400">Title *</label>
        <input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} />
        {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm text-slate-400">Short description</label>
        <input
          className={inputCls}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-slate-400">GitHub URL</label>
          <input className={inputCls} value={form.github_url} onChange={(e) => set("github_url", e.target.value)} />
          {errors.github_url && <p className="mt-1 text-xs text-red-400">{errors.github_url}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-400">Demo URL</label>
          <input className={inputCls} value={form.demo_url} onChange={(e) => set("demo_url", e.target.value)} />
          {errors.demo_url && <p className="mt-1 text-xs text-red-400">{errors.demo_url}</p>}
        </div>
      </div>

      {/* Tech tags */}
      <div>
        <label className="mb-1 block text-sm text-slate-400">Tech stack</label>
        <div className="flex gap-2">
          <input
            className={inputCls}
            value={techInput}
            placeholder="Type a tech and press Add"
            onChange={(e) => setTechInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTech())}
          />
          <button type="button" onClick={addTech} className="btn-ghost whitespace-nowrap">
            Add
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {form.tech.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 text-xs text-brand-300">
              {t}
              <button onClick={() => set("tech", form.tech.filter((x) => x !== t))}>
                <FiX className="text-[10px]" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Thumbnail / cover image */}
      <div>
        <label className="mb-1 block text-sm text-slate-400">
          Thumbnail (cover shown on the card)
        </label>
        <div className="flex items-center gap-3">
          <label className="btn-ghost cursor-pointer">
            <FiUpload /> Upload thumbnail
            <input type="file" accept="image/*" className="hidden" onChange={handleThumbnail} />
          </label>
          {form.thumbnail && (
            <div className="relative">
              <img src={form.thumbnail} alt="" className="h-16 w-24 rounded-lg object-cover" />
              <button
                onClick={() => set("thumbnail", "")}
                className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white"
              >
                <FiX className="text-[10px]" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Media */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-slate-400">Images (gallery)</label>
          <label className="btn-ghost cursor-pointer">
            <FiUpload /> Upload images
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {form.images.map((src) => (
              <div key={src} className="relative">
                <img src={src} alt="" className="h-16 w-16 rounded-lg object-cover" />
                <button
                  onClick={() => set("images", form.images.filter((x) => x !== src))}
                  className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white"
                >
                  <FiX className="text-[10px]" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-400">Demo video</label>
          <label className="btn-ghost cursor-pointer">
            <FiUpload /> Upload video
            <input type="file" accept="video/*" className="hidden" onChange={handleVideo} />
          </label>
          {form.video_url && (
            <video src={form.video_url} controls className="mt-2 w-full rounded-lg" />
          )}
        </div>
      </div>

      {/* Rich content */}
      <div>
        <label className="mb-1 block text-sm text-slate-400">Full write-up</label>
        <RichTextEditor value={form.content_html} onChange={(html) => set("content_html", html)} />
      </div>

      {/* Options */}
      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          Order
          <input
            type="number"
            className="w-20 rounded-lg border border-white/10 bg-white/5 px-2 py-1"
            value={form.order}
            onChange={(e) => set("order", Number(e.target.value))}
          />
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? "Saving…" : "Save Project"}
        </button>
      </div>
    </div>
  );
}
