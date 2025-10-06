import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllEventsPublic } from "../lib/api";
import { motion as Motion } from "motion/react";
import { Link } from "react-router-dom";

function groupEvents(events) {
  const now = Date.now();
  const current = [];
  const upcoming = [];
  const past = [];
  for (const ev of events || []) {
    const start = new Date(ev.starts_at).getTime();
    const end = new Date(ev.ends_at).getTime();
    if (isNaN(start) || isNaN(end)) continue;
    if (start <= now && end > now) current.push(ev);
    else if (start > now) upcoming.push(ev);
    else past.push(ev);
  }
  // Sort groups: upcoming by start asc, current by priority asc then start asc, past by end desc
  upcoming.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  current.sort(
    (a, b) =>
      (a.priority ?? 0) - (b.priority ?? 0) ||
      new Date(a.starts_at) - new Date(b.starts_at)
  );
  past.sort((a, b) => new Date(b.ends_at) - new Date(a.ends_at));
  return { current, upcoming, past };
}

function EventCard({ ev }) {
  return (
    <Link
      to={`/events/${ev.id}`}
      className="rounded-2xl border border-secondary/40 overflow-hidden bg-background/60 w-full block hover:border-primary/60 transition-colors"
    >
      {ev.image_url && (
        <img
          src={ev.image_url}
          alt={ev.title}
          loading="lazy"
          className="w-full min-h-48  object-contain"
        />
      )}
    </Link>
  );
}

export default function EventsPage() {
  const q = useQuery({
    queryKey: ["events-all-public"],
    queryFn: getAllEventsPublic,
    staleTime: 60_000,
  });

  const groups = useMemo(
    () => groupEvents(Array.isArray(q.data) ? q.data : []),
    [q.data]
  );

  return (
    <div className="space-y-6 text-base-fg  ">
      <Motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="px-3 pt-2 "
      >
        <h1 className="text-3xl text-primary font-bold mb-2">Events</h1>
        <p className="text-muted max-w-prose">
          Explore our past, current, and upcoming events.
        </p>
      </Motion.header>

      {q.isLoading && <div className="px-3 text-muted">Loading events…</div>}
      {q.isError && !q.isLoading && (
        <div className="px-3 text-danger text-sm">Failed to load events.</div>
      )}

      {!q.isLoading && !q.isError && (
        <div className="px-3 col-span-2 grid grid-cols-2 gap-10">
          {groups.current.length > 0 && (
            <section className="space-y-3 md:col-span-1 col-span-2 w-full">
              <h2 className="text-xl tracking-wider bg-primary text-contrast px-2 rounded-ee-2xl uppercase font-bold inline-flex items-center">
                Current
              </h2>
              <div className=" w-full">
                {groups.current.map((ev) => (
                  <EventCard key={ev.id} ev={ev} />
                ))}
              </div>
            </section>
          )}
          {groups.upcoming.length > 0 && (
            <section className="space-y-3 md:col-span-1 col-span-2 w-full">
              <h2 className="text-xl tracking-wider bg-text text-contrast px-2 rounded-ee-2xl uppercase font-bold inline-flex items-center">
                Upcoming
              </h2>
              <div className=" w-full">
                {groups.upcoming.map((ev) => (
                  <EventCard key={ev.id} ev={ev} />
                ))}
              </div>
            </section>
          )}
          {groups.past.length > 0 && (
            <section className="space-y-3 md:col-span-1 col-span-2 w-full opacity-50">
              <h2 className="text-xl tracking-wider bg-secondary text-contrast px-2 rounded-ee-2xl uppercase font-bold inline-flex items-center">
                Past
              </h2>
              <div className="w-full">
                {groups.past.map((ev) => (
                  <EventCard key={ev.id} ev={ev} />
                ))}
              </div>
            </section>
          )}
          {groups.current.length +
            groups.upcoming.length +
            groups.past.length ===
            0 && <div className="text-muted">No events to show yet.</div>}
        </div>
      )}
    </div>
  );
}
