/**
 * AnalyticsPanel (admin).
 *
 * Purpose: Date-filtered analytics — period presets / custom range, summary
 *          cards, bar chart, location/path breakdown, and daily detail table.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiDownload,
  FiEye,
  FiRefreshCw,
  FiUsers,
} from "react-icons/fi";

import {
  getAnalyticsReport,
  type AnalyticsPeriod,
  type AnalyticsReport,
  type SeriesPoint,
} from "@/api/analytics";

function formatCount(n: number | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString();
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function AnalyticsChart({ series }: { series: SeriesPoint[] }) {
  const max = useMemo(() => {
    let m = 1;
    for (const p of series) {
      m = Math.max(m, p.page_views, p.resume_downloads, p.unique_sessions);
    }
    return m;
  }, [series]);

  if (series.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl bg-white/5 text-sm text-slate-500">
        No data in this range
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white/5 p-4">
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand-400" /> Page views
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Sessions
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Resume downloads
        </span>
      </div>
      <div
        className="flex h-48 min-w-full items-end gap-2"
        style={{ minWidth: `${Math.max(series.length * 48, 280)}px` }}
      >
        {series.map((p) => (
          <div key={p.date + p.label} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-40 w-full items-end justify-center gap-0.5">
              <div
                className="w-[28%] max-w-[14px] rounded-t bg-brand-400/90"
                style={{ height: `${Math.max((p.page_views / max) * 100, p.page_views ? 4 : 0)}%` }}
                title={`Views: ${p.page_views}`}
              />
              <div
                className="w-[28%] max-w-[14px] rounded-t bg-emerald-400/90"
                style={{
                  height: `${Math.max((p.unique_sessions / max) * 100, p.unique_sessions ? 4 : 0)}%`,
                }}
                title={`Sessions: ${p.unique_sessions}`}
              />
              <div
                className="w-[28%] max-w-[14px] rounded-t bg-amber-400/90"
                style={{
                  height: `${Math.max((p.resume_downloads / max) * 100, p.resume_downloads ? 4 : 0)}%`,
                }}
                title={`Downloads: ${p.resume_downloads}`}
              />
            </div>
            <span className="max-w-[4.5rem] truncate text-center text-[10px] text-slate-500">
              {p.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BreakdownTable({
  title,
  nameHeader,
  rows,
  empty = "No data",
}: {
  title: string;
  nameHeader: string;
  rows: { name: string; count: number }[];
  empty?: string;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium uppercase tracking-widest text-slate-500">
        {title}
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2 font-medium">{nameHeader}</th>
              <th className="px-3 py-2 text-right font-medium">Count</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-3 py-4 text-center text-slate-500">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.name} className="border-b border-white/5 text-slate-300">
                  <td className="px-3 py-2 text-slate-200">{row.name}</td>
                  <td className="px-3 py-2 text-right font-mono text-brand-300">
                    {formatCount(row.count)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const PERIODS: { id: AnalyticsPeriod; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "custom", label: "Custom" },
];

export default function AnalyticsPanel() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("daily");
  const [start, setStart] = useState(daysAgoISO(6));
  const [end, setEnd] = useState(todayISO());
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAnalyticsReport({
        period,
        start: period === "custom" ? start : undefined,
        end: period === "custom" ? end : undefined,
      });
      setReport(data);
    } catch {
      setReport(null);
      setError("Could not load analytics.");
    } finally {
      setLoading(false);
    }
  }, [period, start, end]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = report?.summary;

  return (
    <div className="mb-6 rounded-xl p-4 glass">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-200">Site analytics</p>
          <p className="text-xs text-slate-400">
            Summary, chart, breakdown &amp; daily details
            {report ? (
              <>
                {" "}
                · {new Date(report.start).toLocaleDateString()} –{" "}
                {new Date(report.end).toLocaleDateString()}
              </>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-lg p-2 text-slate-400 transition hover:text-brand-300 disabled:opacity-50"
          title="Refresh analytics"
          aria-label="Refresh analytics"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Period filters */}
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <div className="flex flex-wrap gap-1 rounded-full border border-white/10 bg-white/5 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                period === p.id
                  ? "bg-brand-500 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {period === "custom" && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-slate-400">
              From
              <input
                type="date"
                value={start}
                max={end}
                onChange={(e) => setStart(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-brand-400"
              />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-400">
              To
              <input
                type="date"
                value={end}
                min={start}
                max={todayISO()}
                onChange={(e) => setEnd(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-brand-400"
              />
            </label>
            <button type="button" onClick={() => void load()} className="btn-ghost px-3 py-1.5 text-xs">
              Apply
            </button>
          </div>
        )}
      </div>

      {error && <p className="mb-3 text-sm text-amber-300">{error}</p>}

      {/* Summary */}
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-slate-500">Summary</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-white/5 px-3 py-3">
          <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
            <FiEye className="text-brand-400" /> Page views
          </div>
          <p className="font-mono text-2xl font-semibold text-slate-100">
            {formatCount(summary?.page_views)}
          </p>
        </div>
        <div className="rounded-lg bg-white/5 px-3 py-3">
          <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
            <FiUsers className="text-brand-400" /> Unique sessions
          </div>
          <p className="font-mono text-2xl font-semibold text-slate-100">
            {formatCount(summary?.unique_sessions)}
          </p>
        </div>
        <div className="rounded-lg bg-white/5 px-3 py-3">
          <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
            <FiDownload className="text-brand-400" /> Resume downloads
          </div>
          <p className="font-mono text-2xl font-semibold text-slate-100">
            {formatCount(summary?.resume_downloads)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-widest text-slate-500">
        Chart
      </p>
      <AnalyticsChart series={report?.series ?? []} />

      {/* Breakdown */}
      <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-widest text-slate-500">
        Breakdown
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <BreakdownTable
          title="Countries"
          nameHeader="Country"
          rows={report?.top_countries ?? []}
          empty="No location data"
        />
        <BreakdownTable
          title="Cities"
          nameHeader="City"
          rows={report?.top_cities ?? []}
          empty="No location data"
        />
        <BreakdownTable
          title="Pages"
          nameHeader="Path"
          rows={report?.top_paths ?? []}
          empty="No page data"
        />
        <BreakdownTable
          title="Resume sources"
          nameHeader="Source"
          rows={report?.top_sources ?? []}
          empty="No downloads yet"
        />
      </div>

      {/* Details */}
      <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-widest text-slate-500">
        Daily details
      </p>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Views</th>
              <th className="px-3 py-2 font-medium">Sessions</th>
              <th className="px-3 py-2 font-medium">Downloads</th>
              <th className="px-3 py-2 font-medium">Top country</th>
              <th className="px-3 py-2 font-medium">Top city</th>
            </tr>
          </thead>
          <tbody>
            {(report?.details?.length ?? 0) === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                  No rows for this range
                </td>
              </tr>
            ) : (
              report!.details.map((row) => (
                <tr key={row.date} className="border-b border-white/5 text-slate-300">
                  <td className="px-3 py-2 font-mono text-slate-200">{row.date}</td>
                  <td className="px-3 py-2 font-mono">{formatCount(row.page_views)}</td>
                  <td className="px-3 py-2 font-mono">{formatCount(row.unique_sessions)}</td>
                  <td className="px-3 py-2 font-mono">{formatCount(row.resume_downloads)}</td>
                  <td className="px-3 py-2">{row.top_country ?? "—"}</td>
                  <td className="px-3 py-2">{row.top_city ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Locations are approximate (from IP / geojs). Raw IPs are not stored. Geo is optional and
        never blocks the public site.
      </p>
    </div>
  );
}
