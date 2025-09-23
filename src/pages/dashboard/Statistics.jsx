import { useMemo, useState } from "react";
import {
  FaInstagram,
  FaFacebookF,
  FaGoogle,
  FaGlobe,
  FaPhone,
  FaRegEnvelope,
  FaLocationDot,
} from "react-icons/fa6";
import { useQuery } from "@tanstack/react-query";
import {
  getVisitorTotals,
  getVisitorDaily,
  getTopClicked,
  getExternalTopClicked,
  getClicksDaily,
  listMenuItems,
} from "../../lib/api";

export default function DashboardStatistics() {
  const [range, setRange] = useState("30d");
  const { data: totals } = useQuery({
    queryKey: ["visitor-totals"],
    queryFn: getVisitorTotals,
  });
  const { from, to } = useMemo(() => computeRange(range), [range]);
  const dailyQ = useQuery({
    queryKey: ["visitor-daily", from, to],
    queryFn: () => getVisitorDaily({ from, to }),
  });

  const topClicksQ = useQuery({
    queryKey: ["clicks-top", from, to],
    queryFn: () => getTopClicked({ from, to, limit: 8 }),
  });
  const topExternalQ = useQuery({
    queryKey: ["external-top", from, to],
    queryFn: () => getExternalTopClicked({ from, to, limit: 8 }),
  });
  const clicksDailyQ = useQuery({
    queryKey: ["clicks-daily", from, to],
    queryFn: () => getClicksDaily({ from, to }),
  });
  const itemsQ = useQuery({
    queryKey: ["menu-items-for-names"],
    queryFn: listMenuItems,
  });
  const nameById = useMemo(() => {
    const map = new Map();
    const arr = Array.isArray(itemsQ.data) ? itemsQ.data : [];
    for (const it of arr) map.set(it.id, it.name);
    return map;
  }, [itemsQ.data]);

  const daily = useMemo(
    () => (Array.isArray(dailyQ.data) ? dailyQ.data : []),
    [dailyQ.data]
  );
  const max = useMemo(
    () => Math.max(1, ...daily.map((d) => d.uniques)),
    [daily]
  );

  return (
    <section className="p-3 text-base-fg space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Statistics</h1>
        <div className="flex items-center gap-2">
          <RangePicker value={range} onChange={setRange} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatCard
          label="Total visitors"
          value={(totals?.total_visitors ?? 0).toLocaleString()}
        />
        <StatCard
          label="Today's uniques"
          value={(totals?.today_uniques ?? 0).toLocaleString()}
        />
      </div>

      <div className="rounded-2xl border border-secondary/30 bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Daily unique visitors</h2>
          {dailyQ.isLoading && (
            <span className="text-sm text-muted">Loading…</span>
          )}
          {dailyQ.isError && (
            <button
              className="text-sm underline"
              onClick={() => dailyQ.refetch()}
            >
              Retry
            </button>
          )}
        </div>
        {!dailyQ.isLoading && !dailyQ.isError && (
          <div className="flex items-end gap-1 h-40">
            {daily.map((d) => {
              const h = Math.max(2, Math.round((d.uniques / max) * 140));
              return (
                <div key={d.date} className="flex flex-col items-center gap-1">
                  <div
                    className="w-3 bg-primary rounded-t"
                    style={{ height: `${h}px` }}
                    title={`${d.date.slice(5, 10)}: ${d.uniques}`}
                  />
                  <div className="text-[10px] text-muted rotate-45 origin-top-left ">
                    {d.date.slice(5, 10)}
                  </div>
                </div>
              );
            })}
            {daily.length === 0 && (
              <div className="text-sm text-muted">No data</div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <TopList
          title="Top clicked items"
          state={topClicksQ}
          renderRow={(row) => (
            <>
              <span className="truncate">
                {nameById.get(row.menu_item_id) || (
                  <span className="text-muted">#{row.menu_item_id}</span>
                )}
              </span>
              <span className="font-semibold">{row.total_clicks}</span>
            </>
          )}
          empty="No clicks yet"
        />
        <TopList
          title="Top external links"
          state={topExternalQ}
          renderRow={(row) => (
            <>
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
            </>
          )}
          empty="No external clicks yet"
        />
      </div>

      <DailyClicksChart state={clicksDailyQ} />
    </section>
  );
}

function computeRange(range) {
  const today = new Date();
  const to = today.toISOString().slice(0, 10);
  const n = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  const start = new Date(today);
  start.setDate(today.getDate() - (n - 1));
  const from = start.toISOString().slice(0, 10);
  return { from, to };
}

function RangePicker({ value, onChange }) {
  return (
    <div className="rounded-2xl border border-secondary/40 p-1 bg-background">
      <div className="flex">
        {[
          { v: "7d", label: "7d" },
          { v: "30d", label: "30d" },
          { v: "90d", label: "90d" },
        ].map((opt) => (
          <button
            key={opt.v}
            className={`px-2 py-1 rounded-2xl text-sm ${
              value === opt.v ? "bg-primary text-contrast" : ""
            }`}
            onClick={() => onChange(opt.v)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-secondary/30 bg-surface p-4">
      <div className="text-sm text-muted">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function TopList({ title, state, renderRow, empty }) {
  const items = Array.isArray(state.data) ? state.data : [];
  return (
    <div className="rounded-2xl border border-secondary/30 bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {state.isLoading && (
          <span className="text-sm text-muted">Loading…</span>
        )}
        {state.isError && (
          <button className="text-sm underline" onClick={() => state.refetch()}>
            Retry
          </button>
        )}
      </div>
      {!state.isLoading && !state.isError && (
        <div className="divide-y divide-secondary/20">
          {items.length === 0 && (
            <div className="text-sm text-muted">{empty}</div>
          )}
          {items.map((row, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 gap-3"
            >
              {renderRow(row)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DailyClicksChart({ state }) {
  const data = useMemo(
    () => (Array.isArray(state.data) ? state.data : []),
    [state.data]
  );
  // Aggregate clicks per date across items
  const perDate = useMemo(() => {
    const map = new Map();
    for (const r of data) {
      map.set(r.date, (map.get(r.date) || 0) + (r.clicks || 0));
    }
    return Array.from(map.entries())
      .map(([date, clicks]) => ({ date, clicks }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);
  const max = useMemo(
    () => Math.max(1, ...perDate.map((d) => d.clicks)),
    [perDate]
  );
  return (
    <div className="rounded-2xl border border-secondary/30 bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Daily item clicks</h2>
        {state.isLoading && (
          <span className="text-sm text-muted">Loading…</span>
        )}
        {state.isError && (
          <button className="text-sm underline" onClick={() => state.refetch()}>
            Retry
          </button>
        )}
      </div>
      {!state.isLoading && !state.isError && (
        <div className="flex items-end gap-1 h-40">
          {perDate.map((d) => {
            const h = Math.max(2, Math.round((d.clicks / max) * 140));
            return (
              <div key={d.date} className="flex flex-col items-center gap-1">
                <div
                  className="w-3 bg-primary rounded-t"
                  style={{ height: `${h}px` }}
                  title={`${d.date.slice(5, 10)}: ${d.clicks}`}
                />
                <div className="text-[10px] text-muted rotate-45 origin-top-left ">
                  {d.date.slice(5, 10)}
                </div>
              </div>
            );
          })}
          {perDate.length === 0 && (
            <div className="text-sm text-muted">No data</div>
          )}
        </div>
      )}
    </div>
  );
}

// domainLabel removed; using icon-only rendering

function externalIcon(url) {
  try {
    if (typeof url === "string" && url.startsWith("tel:")) {
      return <FaPhone className="text-primary" />;
    }
    if (typeof url === "string" && url.startsWith("mailto:")) {
      return <FaRegEnvelope className="text-primary" />;
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
    if (typeof url === "string" && url.startsWith("mailto:")) {
      return <FaRegEnvelope className="text-primary" />;
    }
    return <FaGlobe className="text-primary" />;
  }
}

function domainText(url) {
  try {
    if (typeof url === "string" && url.startsWith("tel:")) {
      return url.slice(4).replace(/[^\d+]/g, "") || "phone";
    }
    if (typeof url === "string" && url.startsWith("mailto:")) {
      const addr = url.slice(7).trim().toLowerCase();
      const domain = addr.split("@")[1] || "email";
      return domain || "email";
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
    if (typeof url === "string" && url.startsWith("mailto:")) {
      return "email";
    }
    return "external";
  }
}
