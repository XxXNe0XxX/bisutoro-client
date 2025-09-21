import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDailyMenu, setDailyMenu, listMenuItems } from "../../lib/api";

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function DashboardDaily() {
  const [day, setDay] = useState(new Date().getDay());
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const dailyQuery = useQuery({
    queryKey: ["daily-menu", day],
    queryFn: () => getDailyMenu(day),
  });

  const allItemsQuery = useQuery({
    queryKey: ["menu-items"],
    queryFn: listMenuItems,
  });

  const itemsOnDay = useMemo(() => {
    const items = dailyQuery.data?.items || [];
    return items;
  }, [dailyQuery.data]);

  const addableItems = useMemo(() => {
    const all = allItemsQuery.data || [];
    const inDay = new Set(itemsOnDay.map((i) => i.id));
    const filtered = all
      .filter((i) => !inDay.has(i.id))
      .filter((i) => i.is_available !== false);
    if (!search.trim()) return filtered;
    const s = search.toLowerCase();
    return filtered.filter(
      (i) =>
        i.name.toLowerCase().includes(s) ||
        (i.description || "").toLowerCase().includes(s)
    );
  }, [allItemsQuery.data, itemsOnDay, search]);

  const mutation = useMutation({
    mutationFn: ({ nextIds }) => setDailyMenu(day, nextIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-menu", day] });
    },
  });

  function onAdd(item) {
    const nextIds = [...itemsOnDay.map((i) => i.id), item.id];
    mutation.mutate({ nextIds });
  }

  function onRemove(itemId) {
    const nextIds = itemsOnDay.filter((i) => i.id !== itemId).map((i) => i.id);
    mutation.mutate({ nextIds });
  }

  function onReorder(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    const next = [...itemsOnDay];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    mutation.mutate({ nextIds: next.map((i) => i.id) });
  }

  const isLoading = dailyQuery.isLoading || allItemsQuery.isLoading;

  return (
    <div className=" p-3 text-base-fg ">
      <h1 className="text-2xl font-semibold mb-3">Daily Specials</h1>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <label className="text-sm text-muted">Day:</label>
        <select
          className="p-1 rounded-2xl bg-secondary/10 outline-1 outline-offset-2 "
          value={day}
          onChange={(e) => setDay(Number(e.target.value))}
        >
          {dayNames.map((d, i) => (
            <option key={i} value={i} className="bg-background">
              {d}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-muted">Loading…</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <section className="rounded-2xl border border-secondary/40 p-3">
            <h2 className="font-medium mb-2">Items for {dayNames[day]}</h2>
            <ul className="divide-y divide-secondary/30">
              {itemsOnDay.map((it, idx) => (
                <li key={it.id} className="py-2 flex items-center gap-2">
                  <button
                    className="p-1 rounded hover:bg-secondary/20"
                    title="Move up"
                    disabled={idx === 0 || mutation.isPending}
                    onClick={() => onReorder(idx, idx - 1)}
                  >
                    ▲
                  </button>
                  <button
                    className="p-1 rounded hover:bg-secondary/20"
                    title="Move down"
                    disabled={
                      idx === itemsOnDay.length - 1 || mutation.isPending
                    }
                    onClick={() => onReorder(idx, idx + 1)}
                  >
                    ▼
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{it.name}</div>
                    <div className="text-sm text-muted truncate">
                      $ {Number(it.price).toFixed(2)}
                    </div>
                  </div>
                  <button
                    className="px-2 py-1 rounded-md bg-danger text-contrast border border-secondary/40 hover:bg-secondary/20"
                    onClick={() => onRemove(it.id)}
                    disabled={mutation.isPending}
                  >
                    Remove
                  </button>
                </li>
              ))}
              {itemsOnDay.length === 0 && (
                <li className="py-4 text-muted">No items yet.</li>
              )}
            </ul>
          </section>

          <section className="rounded-2xl border border-secondary/40 p-3">
            <h2 className="font-medium mb-2">Add items</h2>
            <input
              className="w-full mb-2 px-3 py-2 rounded-2xl bg-secondary/10 border border-secondary/40"
              placeholder="Search menu items…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <ul className="divide-y divide-secondary/30 max-h-[420px] overflow-y-auto px-2">
              {addableItems.map((it) => (
                <li key={it.id} className="py-2 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{it.name}</div>
                    <div className="text-sm text-muted truncate">
                      $ {Number(it.price).toFixed(2)}
                    </div>
                  </div>
                  <button
                    className="px-2 py-1 rounded-md bg-secondary text-contrast border border-secondary/40 hover:bg-secondary/20"
                    onClick={() => onAdd(it)}
                    disabled={mutation.isPending}
                  >
                    Add
                  </button>
                </li>
              ))}
              {!addableItems.length && (
                <li className="py-4 text-muted">No matches.</li>
              )}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
