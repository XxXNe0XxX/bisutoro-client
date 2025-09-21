import { useEffect, useMemo, useState } from "react";
import { FaSearchengin } from "react-icons/fa6";
import {
  getMenu,
  getDailyMenu,
  listCategories,
  getPublicAppSettings,
} from "../lib/api";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa6";
import ReservationButton from "../components/ui/ReservationButton";

export default function MenuPage() {
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [showAllCats, setShowAllCats] = useState(false);
  const [filterVegan, setFilterVegan] = useState(false);
  const [filterGF, setFilterGF] = useState(false);
  const today = new Date().getDay();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["menu"],
    queryFn: async () => {
      const res = await getMenu();
      return Array.isArray(res) ? res : res?.categories || [];
    },
  });

  // Public app settings to gate specials and omakase
  const publicSettings = useQuery({
    queryKey: ["public-app-settings"],
    queryFn: getPublicAppSettings,
  });

  const daily = useQuery({
    queryKey: ["daily-menu", today],
    queryFn: () => getDailyMenu(today),
  });

  // Fetch categories metadata to respect server-defined sort order
  const categoriesMeta = useQuery({
    queryKey: ["categories-meta"],
    queryFn: () => listCategories(),
  });

  // Build an order map by category name (case-insensitive)
  const categoryOrder = useMemo(() => {
    const map = new Map();
    const list = Array.isArray(categoriesMeta.data) ? categoriesMeta.data : [];
    for (const c of list) {
      const name = String(c.name || c.title || "")
        .trim()
        .toLowerCase();
      const order = Number(c.sort_order);
      if (!name) continue;
      if (Number.isFinite(order)) {
        map.set(name, order);
      }
      // If sort_order is missing or invalid, omit from map to fall back to Infinity later
    }
    return map;
  }, [categoriesMeta.data]);

  // Stable, ordered categories list used for rendering
  const sortedCategories = useMemo(() => {
    const copy = Array.isArray(categories) ? [...categories] : [];
    copy.sort((a, b) => {
      const aKey = String(a.name || "")
        .trim()
        .toLowerCase();
      const bKey = String(b.name || "")
        .trim()
        .toLowerCase();
      const aoRaw = categoryOrder.get(aKey);
      const boRaw = categoryOrder.get(bKey);
      const ao = typeof aoRaw === "number" ? aoRaw : Number.POSITIVE_INFINITY;
      const bo = typeof boRaw === "number" ? boRaw : Number.POSITIVE_INFINITY;
      if (ao !== bo) return ao - bo;
      // fallback stable name sort
      return String(a.name).localeCompare(String(b.name));
    });
    return copy;
  }, [categories, categoryOrder]);

  useEffect(() => {
    if (data) setCategories(data);
  }, [data]);

  const specials = useMemo(() => {
    const items = daily.data?.items || [];
    // Only include available items
    const available = items.filter(
      (it) => it && (it.is_available === undefined || it.is_available === true)
    );
    // dietary filters
    const meetsDietary = (it) => {
      const vegan =
        it.vegan === true || it.vegan === 1 || String(it.vegan) === "1";
      const gf =
        it.gluten_free === true ||
        it.gluten_free === 1 ||
        String(it.gluten_free) === "1";
      if (filterVegan && !vegan) return false;
      if (filterGF && !gf) return false;
      return true;
    };
    const dietary = available.filter(meetsDietary);
    if (!query.trim()) return dietary;
    const q = query.toLowerCase();
    return dietary.filter(
      (it) =>
        it.name?.toLowerCase().includes(q) ||
        (it.description || "").toLowerCase().includes(q) ||
        (Array.isArray(it.ingredients) &&
          it.ingredients.join(" ").toLowerCase().includes(q))
    );
  }, [daily.data, query, filterVegan, filterGF]);

  // Specials list is derived via `specials` and rendered conditionally

  const filteredCategories = useMemo(() => {
    const base = sortedCategories.map((cat) => ({
      ...cat,
      // Include all items (including today's specials) in their categories
      items: (cat.items || []).filter((it) => {
        const vegan =
          it.vegan === true || it.vegan === 1 || String(it.vegan) === "1";
        const gf =
          it.gluten_free === true ||
          it.gluten_free === 1 ||
          String(it.gluten_free) === "1";
        if (filterVegan && !vegan) return false;
        if (filterGF && !gf) return false;
        return true;
      }),
    }));
    // Always hide empty categories
    const baseNonEmpty = base.filter((cat) => (cat.items || []).length > 0);
    // If a category is selected, limit to it
    const scoped = activeCategory
      ? baseNonEmpty.filter((c) => c.name === activeCategory)
      : baseNonEmpty;
    if (!query.trim()) return scoped;
    const q = query.toLowerCase();
    return scoped
      .map((cat) => ({
        ...cat,
        items: (cat.items || []).filter(
          (it) =>
            it.name?.toLowerCase().includes(q) ||
            it.description?.toLowerCase().includes(q) ||
            (Array.isArray(it.ingredients) &&
              it.ingredients.join(" ").toLowerCase().includes(q))
        ),
      }))
      .filter((cat) => (cat.items || []).length > 0);
  }, [sortedCategories, query, activeCategory, filterVegan, filterGF]);

  // Build category buttons: include categories that have items (post dietary filters)
  const categoryButtons = useMemo(() => {
    const list = sortedCategories.map((cat) => {
      const itemsAfterDiet = (cat.items || []).filter((it) => {
        const vegan =
          it.vegan === true || it.vegan === 1 || String(it.vegan) === "1";
        const gf =
          it.gluten_free === true ||
          it.gluten_free === 1 ||
          String(it.gluten_free) === "1";
        if (filterVegan && !vegan) return false;
        if (filterGF && !gf) return false;
        return true;
      });
      return { name: cat.name, count: itemsAfterDiet.length };
    });
    return list.filter((c) => c.count > 0);
  }, [sortedCategories, filterVegan, filterGF]);

  // Determine whether non-dietary filters are active (search or category)
  const nonDietaryFilterActive = useMemo(
    () => Boolean(activeCategory) || Boolean((query || "").trim()),
    [activeCategory, query]
  );

  return (
    <div className="space-y-6 relative  ">
      <div className="flex text-base-fg items-center max-w-[960px] gap-3 fixed  shadow px-3 bg-background/40  w-full h-14 md:rounded-b-2xl mx-auto   md:top-0 backdrop-blur-2xl">
        <FaSearchengin className="w-auto h-6"></FaSearchengin>
        <input
          type="text"
          id="item search"
          placeholder="Search for a plate"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className=" border border-secondary text-base-fg p-2  rounded-2xl placeholder:text-gray-500 w-full  "
        />
      </div>
      <header className=" px-3 md:pt-4 pt-16 w-full flex items-start gap-2 md:flex-nowrap flex-wrap  ">
        <div className="w-full">
          <h1 className="text-3xl text-primary font-bold mb-2 ">Menu</h1>
          <p className="text-muted max-w-prose">
            Dive in our selection of traditionally crafted recipes, each
            prepared with care and inspired by authentic culinary traditions.
          </p>
        </div>
        <ul className="md:w-auto w-full text-start  border border-secondary rounded-2xl p-3  text-sm md:text-nowrap space-y-1">
          <div className="flex justify-center pb-2 gap-2 *:w-full *:h-full items-center">
            {publicSettings.data?.show_omakase_section !== false && (
              <Link
                to="/omakase"
                className="bg-black md:w-full  inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-2xl border border-secondary/40 hover:scale-105 transition-transform text-contrast justify-center text-base-fg font-semibold"
              >
                <div className="bg-clip-text bg-gradient-to-br  from-yellow-400 to-yellow-50 flex items-center gap-2">
                  <span className=" text-transparent">Omakase</span>
                  <FaArrowRight className="text-white"></FaArrowRight>
                </div>
                <span
                  className="i-heroicons-arrow-right-20-solid"
                  aria-hidden
                />
              </Link>
            )}
            <ReservationButton></ReservationButton>
          </div>
          <li className=" max-w-prose text-base-fg">
            -- Gluten free dishes are marked with{" "}
            <span className=" bg-warning p-1 rounded-2xl text-xs">GF</span>
          </li>
          <li className=" max-w-prose text-base-fg">
            -- Veggie options marked with{" "}
            <span className=" bg-success p-1 rounded-2xl text-xs">VG</span>
          </li>
        </ul>
      </header>
      {isLoading && (
        <div className="space-y-4">
          <div className="h-6 w-40 rounded bg-primary-soft animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-primary-soft animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-primary-soft animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-primary-soft animate-pulse" />
          </div>
        </div>
      )}
      {isError && !isLoading && (
        <div className="text-danger flex items-center gap-3 p-3">
          <p>{error?.message || "Failed to load menu."}</p>
          <button
            onClick={() => refetch()}
            className="px-3 py-1 rounded border border-secondary/40 hover:bg-secondary/20"
          >
            Retry
          </button>
        </div>
      )}
      {!isLoading && !isError && (
        <>
          {categoryButtons.length > 0 && (
            <div className="px-3 flex items-center gap-2">
              <h1 className="text-primary text-lg font-semibold text-nowrap">
                Filter by:{" "}
              </h1>
              <div className="flex overflow-x-auto w-full  rounded-2xl gap-2 items-center justify-start shadow-inner border border-primary/40 md:p-1 h-12 overscroll-y-hidden">
                <div className="flex items-center gap-2 ml-2 ">
                  <button
                    type="button"
                    aria-pressed={filterVegan}
                    onClick={() => setFilterVegan((v) => !v)}
                    className={`px-2 py-1 border border-primary/40 rounded-2xl bg-success text-base-fg text-xs transition-shadow ${
                      filterVegan ? "ring-3  ring-primary " : ""
                    }`}
                    title="Filter vegetarian options"
                  >
                    VG
                  </button>
                  <button
                    type="button"
                    aria-pressed={filterGF}
                    onClick={() => setFilterGF((v) => !v)}
                    className={`px-2 py-1 border border-primary/40 rounded-2xl bg-warning text-base-fg text-xs transition-shadow ${
                      filterGF ? "ring-3  ring-primary " : ""
                    }`}
                    title="Filter gluten-free options"
                  >
                    GF
                  </button>
                  {(filterVegan || filterGF) && (
                    <button
                      onClick={() => {
                        setFilterVegan(false);
                        setFilterGF(false);
                      }}
                      className="ml-1 text-xs underline text-muted"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
                {(showAllCats
                  ? categoryButtons
                  : categoryButtons.slice(0, 3)
                ).map((c) => (
                  <button
                    key={c.name}
                    onClick={() => {
                      setActiveCategory((prev) =>
                        prev === c.name ? null : c.name
                      );
                    }}
                    className={`px-3 py-1 rounded-2xl border text-sm transition-colors items-center justify-center flex text-nowrap  text-base-fg ${
                      activeCategory === c.name
                        ? "bg-primary text-contrast border-primary"
                        : "border-secondary/40 hover:bg-secondary/20 "
                    }`}
                    aria-pressed={activeCategory === c.name}
                  >
                    {c.name}
                  </button>
                ))}

                {categoryButtons.length > 5 && (
                  <button
                    onClick={() => setShowAllCats((s) => !s)}
                    className="px-3 py-1 rounded-2xl underline hover:bg-secondary/20 text-sm text-muted"
                  >
                    {showAllCats ? "Show less..." : "Show more..."}
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="grid gap-8 md:grid-cols-2 grid-cols-1 px-3 ">
            {/* Today's Specials (hidden when non-dietary filters are active or disabled by settings) */}
            {!!specials.length &&
              !nonDietaryFilterActive &&
              publicSettings.data?.show_today_specials !== false && (
                <section className="md:col-span-2  space-y-4 text-base-fg">
                  <h2 className=" text-xl tracking-wider bg-primary text-contrast px-1 w-full rounded-ee-2xl uppercase font-bold inline-flex items-center">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="i-heroicons-sparkles-20-solid"
                        aria-hidden
                      />
                      Today's Specials
                    </span>
                  </h2>
                  <ul className="grid sm:grid-cols-2 grid-cols-1 gap-3">
                    {specials.map((item) => (
                      <li
                        key={item.id}
                        className="group rounded-2xl border-2 border-primary/60 bg-primary/5 p-3 hover:bg-primary/10 transition-colors"
                      >
                        <Link to={`/menu/${item.id}`} className="block">
                          <div className="flex justify-between gap-4">
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-primary mb-1">
                                Special
                              </div>
                              <p className="font-medium group-hover:underline truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-muted truncate">
                                {item.description}
                              </p>
                              {(item.vegan === true ||
                                item.vegan === 1 ||
                                String(item.vegan) === "1" ||
                                item.gluten_free === true ||
                                item.gluten_free === 1 ||
                                String(item.gluten_free) === "1") && (
                                <div className="mt-1 flex gap-2 text-[10px]">
                                  {(item.vegan === true ||
                                    item.vegan === 1 ||
                                    String(item.vegan) === "1") && (
                                    <span className="px-1.5 p-1 rounded-2xl bg-success text-base-fg">
                                      VG
                                    </span>
                                  )}
                                  {(item.gluten_free === true ||
                                    item.gluten_free === 1 ||
                                    String(item.gluten_free) === "1") && (
                                    <span className="px-1.5 p-1 rounded-2xl bg-warning text-base-fg">
                                      GF
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="font-semibold tabular-nums block">
                                ${item.price}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

            {filteredCategories.map((cat) => (
              <section key={cat.name} className=" space-y-4 text-base-fg">
                <h2 className="text-xl tracking-wider  border-b  bg-text text-contrast px-3 rounded-ee-2xl uppercase font-bold  ">
                  {cat.name}
                </h2>
                <ul className="space-y-3">
                  {(cat.items || []).map((item) => (
                    <li
                      key={item.id ?? item.name}
                      className="flex justify-between gap-4"
                    >
                      <Link to={`/menu/${item.id}`} className="group flex-1">
                        <div className="flex gap-2 items-center font-medium ">
                          <span className="group-active:underline group-hover:underline">
                            {item.name}
                          </span>
                          {(item.vegan === true ||
                            item.vegan === 1 ||
                            String(item.vegan) === "1" ||
                            item.gluten_free === true ||
                            item.gluten_free === 1 ||
                            String(item.gluten_free) === "1") && (
                            <div className="mt-1 flex gap-2 text-[10px]">
                              {(item.vegan === true ||
                                item.vegan === 1 ||
                                String(item.vegan) === "1") && (
                                <span className="px-1.5 py-0.5 rounded-2xl bg-success text-contrast">
                                  VG
                                </span>
                              )}
                              {(item.gluten_free === true ||
                                item.gluten_free === 1 ||
                                String(item.gluten_free) === "1") && (
                                <span className="px-1.5 py-0.5 rounded-2xl bg-warning text-contrast">
                                  GF
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-muted">{item.description}</p>

                        {Array.isArray(item.ingredients) &&
                          item.ingredients.length > 0 && (
                            <p className="mt-1 text-xs text-muted">
                              <span>Ingredients:</span>{" "}
                              {item.ingredients.join(" + ")}
                            </p>
                          )}
                      </Link>
                      <div className="text-right">
                        <span className="font-semibold tabular-nums block">
                          ${item.price}
                        </span>
                        {item.reviews?.avg_rating != null &&
                          publicSettings.data?.show_average_rating_on_items ===
                            true && (
                            <span className="text-xs text-muted">
                              ★ {item.reviews.avg_rating.toFixed(1)} (
                              {item.reviews.count})
                            </span>
                          )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
