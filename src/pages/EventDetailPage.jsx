import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { getEventPublic } from "../lib/api";
import { motion as Motion } from "motion/react";

export default function EventDetailPage() {
  const { id } = useParams();
  const q = useQuery({
    queryKey: ["event-public", id],
    queryFn: () => getEventPublic(id),
    enabled: !!id,
  });

  const ev = q.data;
  const start = ev ? new Date(ev.starts_at) : null;
  const end = ev ? new Date(ev.ends_at) : null;
  const dateStr =
    ev && start && end
      ? `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
      : "";

  return (
    <div className="space-y-4 text-base-fg">
      <Motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="px-3 pt-2 flex items-center justify-between"
      >
        <h1 className="text-3xl text-primary font-bold">Event</h1>
        <Link
          to="/events"
          className="text-sm underline text-muted hover:text-base-fg"
        >
          All events
        </Link>
      </Motion.header>

      {q.isLoading && <div className="px-3 text-muted">Loading…</div>}
      {q.isError && !q.isLoading && (
        <div className="px-3 text-danger text-sm">Failed to load event.</div>
      )}

      {!q.isLoading && !q.isError && ev && (
        <div className="px-3 space-y-3">
          <h2 className="text-2xl font-semibold">{ev.title}</h2>
          {dateStr && <div className="text-sm text-muted">{dateStr}</div>}
          {ev.image_url && (
            <img
              src={ev.image_url}
              alt={ev.title}
              className="w-full max-h-[420px] object-contain rounded-2xl border border-secondary/40"
              loading="lazy"
            />
          )}
          <p className="whitespace-pre-wrap text-base-fg/90">
            {ev.description}
          </p>
        </div>
      )}
    </div>
  );
}
