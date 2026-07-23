/**
 * AdminPage.
 *
 * Purpose: Protected dashboard where the owner logs in, syncs official data
 *          (GitHub / LeetCode) into DB+Redis, then lists / creates / edits /
 *          deletes curated projects.
 *
 * Route:   /admin
 */
import { useEffect, useState } from "react";
import { FiEdit2, FiLogOut, FiPlus, FiRefreshCw, FiTrash2 } from "react-icons/fi";

import LoginForm from "@/admin/LoginForm";
import ProjectEditor from "@/admin/ProjectEditor";
import { getSyncStatus, syncPortfolioData, type SyncStatus } from "@/api/admin";
import { logout, verifyAuth } from "@/api/auth";
import { deleteProject, getCuratedProjects } from "@/api/projects";
import type { Project } from "@/types";

function formatSyncedAt(iso: string | null | undefined): string {
  if (!iso) return "Never synced";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Never synced";
  return date.toLocaleString();
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);
  const [creating, setCreating] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Check the stored token on mount.
  useEffect(() => {
    verifyAuth().then(setAuthed);
  }, []);

  /** Purpose: (Re)load the admin's curated projects. */
  const refresh = () => {
    getCuratedProjects().then(setProjects).catch(() => setProjects([]));
  };

  const loadSyncStatus = () => {
    getSyncStatus()
      .then(setSyncStatus)
      .catch(() => setSyncStatus({ last_synced_at: null }));
  };

  useEffect(() => {
    if (authed) {
      refresh();
      loadSyncStatus();
    }
  }, [authed]);

  /** Purpose: Live-fetch GitHub + LeetCode and warm Mongo/Redis caches. */
  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await syncPortfolioData();
      setSyncStatus({
        last_synced_at: result.synced_at,
        ok: result.ok,
        sources: result.sources,
      });
      const repos = result.sources.github_repos?.count ?? 0;
      const projectsCount = result.sources.merged_projects?.count ?? 0;
      const readmes = result.sources.github_readmes?.synced ?? 0;
      setSyncMessage(
        result.ok
          ? `Synced ${repos} GitHub repos, ${readmes} READMEs, ${projectsCount} public projects, and LeetCode stats.`
          : "Sync finished with some errors — check details below.",
      );
      refresh();
    } catch {
      setSyncMessage("Sync failed. Check your login session and API connection.");
    } finally {
      setSyncing(false);
    }
  };

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
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-2xl font-bold text-gradient">Project Dashboard</h1>
          <div className="flex flex-wrap gap-3">
            {!showEditor && (
              <>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="btn-primary"
                  title="Fetch live GitHub + LeetCode into DB/Redis"
                >
                  <FiRefreshCw className={syncing ? "animate-spin" : ""} />
                  {syncing ? "Syncing…" : "Sync Data"}
                </button>
                <button onClick={() => setCreating(true)} className="btn-primary">
                  <FiPlus /> New Project
                </button>
              </>
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

        {!showEditor && (
          <div className="mb-6 rounded-xl p-4 glass">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-slate-200">Official data sync</p>
                <p className="text-xs text-slate-400">
                  Last sync: {formatSyncedAt(syncStatus?.last_synced_at)}
                </p>
              </div>
              <p className="text-xs text-slate-500 max-w-md text-right">
                Public visitors only see data from your last sync (MongoDB + Redis). External APIs
                are not called until you sync again.
              </p>
            </div>
            {syncMessage && (
              <p
                className={`mt-3 text-sm ${
                  syncMessage.startsWith("Sync failed") || syncMessage.includes("errors")
                    ? "text-amber-300"
                    : "text-brand-300"
                }`}
              >
                {syncMessage}
              </p>
            )}
          </div>
        )}

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
                No curated projects yet. Click “New Project” to add one — after Sync Data, your public
                GitHub repos still show automatically on the site.
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
