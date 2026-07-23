/**
 * AdminPage.
 *
 * Purpose: Protected dashboard where the owner logs in, then lists / creates /
 *          edits / deletes curated projects (with the rich editor + media).
 *
 * Route:   /admin
 */
import { useEffect, useState } from "react";
import { FiEdit2, FiLogOut, FiPlus, FiTrash2 } from "react-icons/fi";

import LoginForm from "@/admin/LoginForm";
import ProjectEditor from "@/admin/ProjectEditor";
import { logout, verifyAuth } from "@/api/auth";
import { deleteProject, getCuratedProjects } from "@/api/projects";
import type { Project } from "@/types";

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);
  const [creating, setCreating] = useState(false);

  // Check the stored token on mount.
  useEffect(() => {
    verifyAuth().then(setAuthed);
  }, []);

  /** Purpose: (Re)load the admin's curated projects. */
  const refresh = () => {
    getCuratedProjects().then(setProjects).catch(() => setProjects([]));
  };

  useEffect(() => {
    if (authed) refresh();
  }, [authed]);

  /** Purpose: Delete a project after confirmation. */
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this project?")) return;
    await deleteProject(id);
    refresh();
  };

  if (authed === null) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading…</div>;
  }

  if (!authed) {
    return <LoginForm onSuccess={() => setAuthed(true)} />;
  }

  const showEditor = creating || editing;

  return (
    <div className="min-h-screen bg-night-900">
      <div className="mx-auto max-w-4xl px-5 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold text-gradient">Project Dashboard</h1>
          <div className="flex gap-3">
            {!showEditor && (
              <button onClick={() => setCreating(true)} className="btn-primary">
                <FiPlus /> New Project
              </button>
            )}
            <button
              onClick={() => {
                logout();
                setAuthed(false);
              }}
              className="btn-ghost"
            >
              <FiLogOut /> Logout
            </button>
          </div>
        </div>

        {showEditor ? (
          <ProjectEditor
            initial={editing}
            onSaved={() => {
              setEditing(null);
              setCreating(false);
              refresh();
            }}
            onCancel={() => {
              setEditing(null);
              setCreating(false);
            }}
          />
        ) : (
          <div className="space-y-3">
            {projects.length === 0 && (
              <p className="rounded-xl p-6 text-center text-slate-400 glass">
                No curated projects yet. Click “New Project” to add one — your public GitHub repos
                still show automatically on the site.
              </p>
            )}
            {projects.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl p-4 glass">
                <div>
                  <div className="font-medium text-slate-100">
                    {p.title} {p.featured && <span className="text-xs text-brand-400">★ featured</span>}
                  </div>
                  <div className="text-sm text-slate-400">{p.description}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(p)} className="rounded-lg p-2 text-slate-300 hover:text-brand-300">
                    <FiEdit2 />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="rounded-lg p-2 text-slate-300 hover:text-red-400">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
