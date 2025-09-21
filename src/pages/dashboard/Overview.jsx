import { useMemo } from "react";
import {
  FaInstagram,
  FaFacebookF,
  FaGoogle,
  FaGlobe,
  FaPhone,
  FaLocationDot,
} from "react-icons/fa6";
import { useQuery } from "@tanstack/react-query";
import {
  listLatestReviews,
  getVisitorTotals,
  listMenuItems,
  getTopClicked,
  getExternalTopClicked,
} from "../../lib/api";
import { Link } from "react-router-dom";

function Stars({ value }) {
  const v = Math.round((Number(value) || 0) * 2) / 2;
  return (
    <span className="text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < Math.floor(v) ? "★" : i < v ? "☆" : "☆"}</span>
      ))}
    </span>
  );
}

export default function DashboardOverview() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["latest-reviews"],
    queryFn: () => listLatestReviews({ limit: 10 }),
  });

  const totalsQ = useQuery({
    queryKey: ["visitor-totals"],
    queryFn: getVisitorTotals,
  });

  // Engagement glance: last 7 days
  const { from, to } = useMemo(() => computeRange(7), []);
  const itemsQ = useQuery({
    queryKey: ["menu-items-for-names"],
    queryFn: listMenuItems,
  });
  const topItemsQ = useQuery({
    queryKey: ["top-clicks", from, to],
    queryFn: () => getTopClicked({ from, to, limit: 5 }),
  });
  const topExternalQ = useQuery({
    queryKey: ["top-external", from, to],
    queryFn: () => getExternalTopClicked({ from, to, limit: 5 }),
  });

  const nameById = useMemo(() => {
    const map = new Map();
    const arr = Array.isArray(itemsQ.data) ? itemsQ.data : [];
    for (const it of arr) map.set(it.id, it.name);
    return map;
  }, [itemsQ.data]);

  const todayLabel = useMemo(() => {
    try {
      return new Date().toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  }, []);

  const reviews = Array.isArray(data?.reviews) ? data.reviews : [];

  return (
    <section className="p-2 text-base-fg space-y-4">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Dashboard Overview</h1>
        <p className="text-muted">
          Welcome to your dashboard. Quick stats and summaries will appear here.
        </p>
      </div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Quick stats
          <span className="ml-2 text-sm text-muted">{todayLabel}</span>
        </h2>
        <Link
          to="/dashboard/reviews"
          className="text-sm text-primary underline"
        >
          View stats
        </Link>
      </div>
      {/* Totals cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatCard
          label="Total visitors"
          value={
            totalsQ.isLoading
              ? "…"
              : totalsQ.isError
              ? "—"
              : (totalsQ.data?.total_visitors ?? 0).toLocaleString()
          }
        />
        <StatCard
          label="Today's uniques"
          value={
            totalsQ.isLoading
              ? "…"
              : totalsQ.isError
              ? "—"
              : (totalsQ.data?.today_uniques ?? 0).toLocaleString()
          }
        />
      </div>

      {/* Simple daily uniques sparkline/bar chart */}

      {/* Engagement at a glance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-secondary/30 bg-surface p-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Top clicked items (7d)</h2>
            {topItemsQ.isLoading && (
              <span className="text-sm text-muted">Loading…</span>
            )}
            {topItemsQ.isError && (
              <button
                className="text-sm underline"
                onClick={() => topItemsQ.refetch()}
              >
                Retry
              </button>
            )}
          </div>
          {!topItemsQ.isLoading && !topItemsQ.isError && (
            <ul className="divide-y divide-secondary/20">
              {(Array.isArray(topItemsQ.data) ? topItemsQ.data : []).map(
                (row, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between py-2 gap-3"
                  >
                    <span className="truncate">
                      {nameById.get(row.menu_item_id) || (
                        <span className="text-muted">#{row.menu_item_id}</span>
                      )}
                    </span>
                    <span className="font-semibold">{row.total_clicks}</span>
                  </li>
                )
              )}
              {(Array.isArray(topItemsQ.data) ? topItemsQ.data : []).length ===
                0 && <li className="text-sm text-muted">No clicks yet</li>}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-secondary/30 bg-surface p-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Top external domains (7d)</h2>
            {topExternalQ.isLoading && (
              <span className="text-sm text-muted">Loading…</span>
            )}
            {topExternalQ.isError && (
              <button
                className="text-sm underline"
                onClick={() => topExternalQ.refetch()}
              >
                Retry
              </button>
            )}
          </div>
          {!topExternalQ.isLoading && !topExternalQ.isError && (
            <ul className="divide-y divide-secondary/20">
              {(Array.isArray(topExternalQ.data) ? topExternalQ.data : []).map(
                (row, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between py-2 gap-3"
                  >
                    <span
                      className="inline-flex items-center gap-2 min-w-0"
                      title={row.last_url}
                    >
                      {externalIcon(row.last_url)}
                      <span className="truncate text-sm">
                        {domainText(row.last_url)}
                      </span>
                    </span>
                    <span className="font-semibold">{row.total_clicks}</span>
                  </li>
                )
              )}
              {(Array.isArray(topExternalQ.data) ? topExternalQ.data : [])
                .length === 0 && (
                <li className="text-sm text-muted">No external clicks yet</li>
              )}
            </ul>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Latest reviews</h2>
          <Link
            to="/dashboard/reviews"
            className="text-sm text-primary underline"
          >
            View reviews
          </Link>
        </div>
        {isLoading && <div className="text-muted">Loading…</div>}
        {isError && !isLoading && (
          <div className="text-danger text-sm flex items-center gap-2">
            <span>{error?.message || "Failed to load reviews"}</span>
            <button className="underline" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}
        {!isLoading && !isError && (
          <ul className="divide-y divide-secondary/30 rounded-2xl border border-secondary/30 bg-surface">
            {reviews.map((r) => (
              <li key={r.id} className="p-3 flex items-start justify-between ">
                <div>
                  <div className="flex items-center gap-2">
                    <Stars value={r.rating} />
                    <span className="text-xs text-muted">
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>
                  {r.title && <div className="font-medium">{r.title}</div>}
                  {r.body && (
                    <div className="text-sm text-muted line-clamp-2">
                      {r.body}
                    </div>
                  )}
                  {r.author_name && (
                    <div className="text-xs text-muted mt-1">
                      — {r.author_name}
                    </div>
                  )}
                </div>
                <div className="text-right p-3">
                  <div className="text-sm text-muted">Item</div>
                  <Link
                    to={`/menu/${r.menu_item_id}`}
                    className="font-medium hover:underline"
                  >
                    {r.item_name || `#${r.menu_item_id}`}
                  </Link>
                </div>
              </li>
            ))}
            {reviews.length === 0 && (
              <li className="p-3 text-sm text-muted">No reviews yet.</li>
            )}
          </ul>
        )}
      </div>
    </section>
  );
}

function computeRange(nDays) {
  const today = new Date();
  const to = today.toISOString().slice(0, 10);
  const start = new Date(today);
  start.setDate(today.getDate() - (nDays - 1));
  const from = start.toISOString().slice(0, 10);
  return { from, to };
}

function externalIcon(url) {
  try {
    if (typeof url === "string" && url.startsWith("tel:")) {
      return <FaPhone className="text-primary" />;
    }
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase();
    if (host.includes("instagram"))
      return <FaInstagram className="text-primary" />;
    if (host.includes("facebook"))
      return <FaFacebookF className="text-primary" />;
    if (
      host.includes("google") &&
      (path.startsWith("/maps") ||
        url.toLowerCase().includes("google.com/maps"))
    ) {
      return <FaLocationDot className="text-primary" />; // Google Maps
    }
    if (host.includes("google")) return <FaGoogle className="text-primary" />;
    return <FaGlobe className="text-primary" />;
  } catch {
    if (typeof url === "string" && url.startsWith("tel:")) {
      return <FaPhone className="text-primary" />;
    }
    return <FaGlobe className="text-primary" />;
  }
}

function domainText(url) {
  try {
    if (typeof url === "string" && url.startsWith("tel:")) {
      return url.slice(4).replace(/[^\d+]/g, "") || "phone";
    }
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase();
    const stripWww = (h) => (h.startsWith("www.") ? h.slice(4) : h);
    const h = stripWww(host);
    if (h.endsWith("instagram.com")) return "instagram";
    if (h.endsWith("facebook.com")) return "facebook";
    if (h.endsWith("google.com")) {
      if (
        path.startsWith("/maps") ||
        url.toLowerCase().includes("google.com/maps")
      )
        return "Google Maps";
      return "google";
    }
    return h;
  } catch {
    if (typeof url === "string" && url.startsWith("tel:")) {
      return url.slice(4).replace(/[^\d+]/g, "") || "phone";
    }
    return "external";
  }
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-secondary/30 bg-surface p-4">
      <div className="text-sm text-muted">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function MiniBars({ data }) {
  // data: [{ date: 'YYYY-MM-DD', uniques: number }]
  const values = data.map((d) => d.uniques);
  const max = Math.max(1, ...values);
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d) => {
        const h = Math.max(2, Math.round((d.uniques / max) * 88));
        return (
          <div key={d.date} className="flex flex-col items-center gap-1">
            <div
              className="w-2 bg-primary rounded-t"
              style={{ height: `${h}%` }}
              title={`${d.date}: ${d.uniques}`}
            />
          </div>
        );
      })}
      {data.length === 0 && <div className="text-sm text-muted">No data</div>}
    </div>
  );
}
