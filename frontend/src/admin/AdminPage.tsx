/**
 * AdminPage.
 *
 * Purpose: Protected dashboard where the owner logs in, views site analytics,
 *          syncs official data (GitHub / LeetCode) into DB+Redis, benchmarks
 *          cache latency, then lists / creates / edits / deletes curated projects.
 *
 * Route:   /admin
 */
import { useEffect, useState } from "react";
import { FiEdit2, FiLogOut, FiPlus, FiRefreshCw, FiTrash2, FiZap } from "react-icons/fi";

import AnalyticsPanel from "@/admin/AnalyticsPanel";
import LoginForm from "@/admin/LoginForm";
import ProjectEditor from "@/admin/ProjectEditor";
import {
  getSyncStatus,
  runCacheBenchmark,
  syncPortfolioData,
  type CacheBenchmarkResult,
  type SyncStatus,
} from "@/api/admin";
import { logout, verifyAuth } from "@/api/auth";
import { deleteProject, getCuratedProjects } from "@/api/projects";
import type { Project } from "@/types";

function formatSyncedAt(iso: string | null | undefined): string {
  if (!iso) return "Never synced";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Never synced";
  return date.toLocaleString();
}

function formatMs(ms: number | null | undefined): string {
  if (ms == null) return "—";
  return `${ms.toFixed(2)} ms`;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);
  const [creating, setCreating] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [benchLoading, setBenchLoading] = useState(false);
  const [benchmark, setBenchmark] = useState<CacheBenchmarkResult | null>(null);
  const [benchError, setBenchError] = useState<string | null>(null);

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

  /** Purpose: Time Redis vs Mongo on the server; also record client round-trip. */
  const handleBenchmark = async () => {
    setBenchLoading(true);
    setBenchError(null);
    try {
      const result = await runCacheBenchmark(5);
      setBenchmark(result);
    } catch {
      setBenchError("Benchmark failed. Sync data first and confirm Redis/Mongo are up.");
      setBenchmark(null);
    } finally {
      setBenchLoading(false);
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
                <button
                  onClick={handleBenchmark}
                  disabled={benchLoading}
                  className="btn-ghost"
                  title="Compare Redis vs MongoDB read latency"
                >
                  <FiZap className={benchLoading ? "animate-pulse" : ""} />
                  {benchLoading ? "Measuring…" : "Compare Cache"}
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
          <>
            <AnalyticsPanel />

            <div className="mb-6 rounded-xl p-4 glass">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-slate-200">Official data sync</p>
                  <p className="text-xs text-slate-400">
                    Last sync: {formatSyncedAt(syncStatus?.last_synced_at)}
                  </p>
                </div>
                <p className="max-w-md text-right text-xs text-slate-500">
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

              {(benchmark || benchError) && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="text-sm font-medium text-slate-200">Redis vs MongoDB</p>
                  {benchError && <p className="mt-2 text-sm text-amber-300">{benchError}</p>}
                  {benchmark && (
                    <>
                      <p className="mt-1 text-xs text-slate-500">{benchmark.summary.note}</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <div className="rounded-lg bg-white/5 px-3 py-2">
                          <p className="text-xs text-slate-400">Redis avg</p>
                          <p className="font-mono text-sm text-brand-300">
                            {formatMs(benchmark.summary.redis_avg_ms)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-white/5 px-3 py-2">
                          <p className="text-xs text-slate-400">MongoDB avg</p>
                          <p className="font-mono text-sm text-slate-200">
                            {formatMs(benchmark.summary.mongo_avg_ms)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-white/5 px-3 py-2">
                          <p className="text-xs text-slate-400">Speedup</p>
                          <p className="font-mono text-sm text-slate-200">
                            {benchmark.summary.speedup != null
                              ? `${benchmark.summary.speedup}×`
                              : "—"}
                          </p>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Client round-trip for this benchmark call:{" "}
                        <span className="font-mono text-slate-300">
                          {formatMs(benchmark.client_roundtrip_ms ?? null)}
                        </span>
                        {!benchmark.redis_configured && (
                          <span className="text-amber-300"> · Redis not connected</span>
                        )}
                      </p>
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-400">
                          <thead>
                            <tr className="border-b border-white/10 text-slate-500">
                              <th className="py-1 pr-3 font-medium">Key</th>
                              <th className="py-1 pr-3 font-medium">Redis</th>
                              <th className="py-1 pr-3 font-medium">Mongo</th>
                              <th className="py-1 font-medium">Speedup</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(benchmark.keys).map(([key, row]) => (
                              <tr key={key} className="border-b border-white/5">
                                <td className="py-1.5 pr-3 font-mono text-slate-300">{key}</td>
                                <td className="py-1.5 pr-3 font-mono">
                                  {formatMs(row.redis_avg_ms)}
                                  {!row.redis_hit && row.redis_avg_ms != null ? " (miss)" : ""}
                                </td>
                                <td className="py-1.5 pr-3 font-mono">
                                  {formatMs(row.mongo_avg_ms)}
                                  {!row.mongo_hit ? " (miss)" : ""}
                                </td>
                                <td className="py-1.5 font-mono">
                                  {row.speedup != null ? `${row.speedup}×` : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
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
