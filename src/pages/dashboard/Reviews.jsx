import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listMenuItems, listItemReviews } from "../../lib/api";
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

export default function DashboardReviews() {
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [itemSearch, setItemSearch] = useState("");

  const itemsQ = useQuery({
    queryKey: ["menu-items-all"],
    queryFn: listMenuItems,
  });

  const reviewsQ = useQuery({
    queryKey: ["menu-item-reviews", selectedId],
    queryFn: () => listItemReviews(selectedId, { limit: 50, offset: 0 }),
    enabled: !!selectedId,
  });

  const items = useMemo(
    () => (Array.isArray(itemsQ.data) ? itemsQ.data : []),
    [itemsQ.data]
  );

  const filteredItems = useMemo(() => {
    const s = (itemSearch || "").trim().toLowerCase();
    if (!s) return items;
    return items.filter((it) => {
      const sel = String(it.id) === String(selectedId);
      const name = (it.name || "").toLowerCase();
      const desc = (it.description || "").toLowerCase();
      return sel || name.includes(s) || desc.includes(s);
    });
  }, [items, itemSearch, selectedId]);

  const filtered = useMemo(() => {
    const list = reviewsQ.data?.reviews || [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      const hay = [
        r.title,
        r.body,
        r.author_name,
        String(r.rating),
        new Date(r.created_at).toLocaleString(),
      ]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase());
      return hay.some((h) => h.includes(q));
    });
  }, [reviewsQ.data, query]);

  return (
    <section className="p-3 space-y-4 text-base-fg">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reviews</h1>
        {selectedId && (
          <Link
            className="text-sm text-primary underline"
            to={`/menu/${selectedId}`}
          >
            View item page
          </Link>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <label htmlFor="item" className="text-sm text-muted">
          Select item
        </label>
        {/* Item search for mobile/long lists with suggestions */}
        <div className="relative w-full md:w-64 z-20">
          <input
            type="text"
            placeholder="Search items…"
            value={itemSearch}
            onChange={(e) => setItemSearch(e.target.value)}
            className="w-full rounded-2xl p-3 border border-secondary/40 bg-background"
          />
          {itemSearch.trim() && (
            <div className="absolute z-20 left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-xl border border-secondary/40 bg-background shadow">
              {filteredItems.length > 0 ? (
                <ul className="py-1">
                  {filteredItems.slice(0, 30).map((it) => (
                    <li key={it.id}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-secondary/10"
                        onClick={() => {
                          setSelectedId(String(it.id));
                          setItemSearch("");
                        }}
                      >
                        {it.name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-3 py-2 text-xs text-muted">
                  No matching items
                </div>
              )}
            </div>
          )}
        </div>
        <select
          id="item"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="rounded-2xl p-3 border border-secondary/40 bg-background"
        >
          <option value="">— Choose an item —</option>
          {filteredItems.map((it) => (
            <option key={it.id} value={it.id}>
              {it.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search reviews (title, text, author, rating)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={!selectedId}
          className="flex-1 rounded-2xl p-3 border border-secondary/40 bg-background disabled:opacity-60"
        />
      </div>

      {reviewsQ.isLoading && selectedId && (
        <div className="text-muted">Loading…</div>
      )}
      {reviewsQ.isError && selectedId && (
        <div className="text-danger text-sm">
          {reviewsQ.error?.message || "Failed to load reviews"}
        </div>
      )}

      {selectedId && !reviewsQ.isLoading && !reviewsQ.isError && (
        <div className="space-y-2 !backdrop-blur-none">
          <div className="text-sm text-muted flex items-center justify-between">
            <span>
              Total: {reviewsQ.data?.summary?.count ?? 0}, Avg:{" "}
              {reviewsQ.data?.summary?.avg_rating?.toFixed?.(1) ?? "—"}
            </span>
            <span>
              Showing {filtered.length} of{" "}
              {(reviewsQ.data?.reviews || []).length}
            </span>
          </div>
          <ul className="space-y-2 ">
            {filtered.map((r) => (
              <li
                key={r.id}
                className="border border-secondary/40 rounded-2xl p-3"
              >
                <div className="flex items-center justify-between">
                  <Stars value={r.rating} />
                  <span className="text-xs text-muted">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>
                {r.title && <div className="font-medium">{r.title}</div>}
                {r.body && <div className="text-sm text-muted">{r.body}</div>}
                {r.author_name && (
                  <div className="text-xs text-muted mt-1">
                    — {r.author_name}
                  </div>
                )}
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="text-sm text-muted ">No reviews for this item.</li>
            )}
          </ul>
        </div>
      )}
    </section>
  );
}
