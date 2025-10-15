import { useQuery } from "@tanstack/react-query";
import { getDrinksMenu } from "../lib/api";
import { motion as Motion } from "motion/react";
import { FaSearchengin } from "react-icons/fa6";
import { useEffect, useMemo, useState, useRef } from "react";
import { ClipLoader } from "react-spinners";
import { animate, inView } from "motion";

function InViewReveal({
  as = "li",
  className,
  children,
  y = 20,
  delay = 0,
  threshold = 0.25,
  once = false,
  ...rest
}) {
  const ref = useRef(null);
  const Tag = as;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion preferences
    const mql = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (mql?.matches) {
      el.style.opacity = 1;
      el.style.transform = "none";
      return;
    }

    // Set initial state for enter animation
    el.style.opacity = 0;
    el.style.transform = `translateY(${y}px)`;

    const stop = inView(
      el,
      () => {
        // Enter
        animate(
          el,
          {
            opacity: [0, 1],
            transform: [`translateY(${y}px)`, "translateY(0px)"],
          },
          { duration: 0.5, delay, easing: "ease-out" }
        );
        // Return a callback for when it leaves the viewport
        return () => {
          animate(
            el,
            { opacity: 0, transform: `translateY(${Math.max(0, y * 0.3)}px)` },
            { duration: 0.35, easing: "ease-in" }
          );
        };
      },
      { amount: threshold, once }
    );
    return () => stop?.();
  }, [y, delay, threshold, once]);

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}
export default function DrinksPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["drinks"],
    queryFn: getDrinksMenu,
  });

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = (query || "").trim();
    if (!q) {
      setDebouncedQuery("");
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      setDebouncedQuery(q);
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const sections = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const filteredSections = useMemo(() => {
    const q = (debouncedQuery || "").toLowerCase();
    return (
      (sections || [])
        .map((sec) => ({
          ...sec,
          groups: (sec.groups || [])
            .map((g) => {
              const baseItems = Array.isArray(g.items) ? g.items : [];
              const items = q
                ? baseItems.filter((it) => {
                    const name = (it.name || "").toLowerCase();
                    const origin = (it.origin || "").toLowerCase();
                    const ingredients = Array.isArray(it.ingredients)
                      ? it.ingredients.join(" ").toLowerCase()
                      : "";
                    return (
                      name.includes(q) ||
                      origin.includes(q) ||
                      (ingredients && ingredients.includes(q))
                    );
                  })
                : baseItems;
              return { ...g, items };
            })
            // Always hide empty groups
            .filter((g) => (g.items || []).length > 0),
        }))
        // Always hide sections without groups
        .filter((sec) => (sec.groups || []).length > 0)
    );
  }, [sections, debouncedQuery]);

  return (
    <div className="*:pt-6 text-base-fg relative">
      {/* Fixed search bar (same style as MenuPage) */}
      <Motion.div
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex text-base-fg items-center max-w-[960px] gap-3 fixed shadow px-3 bg-background/40 border-b md:border-x border-secondary/40 w-full h-14 xl:rounded-b-2xl mx-auto md:top-0 backdrop-blur-2xl opacity-100 z-30 !pt-0"
      >
        <FaSearchengin className="w-auto h-6" />
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search for a drink"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border bg-background border-secondary text-base-fg p-2 pr-12 rounded-2xl placeholder:text-gray-500 w-full"
          />
          <div className="absolute inset-y-0 right-2 flex items-center">
            {searching ? (
              <ClipLoader size={18} color="var(--color-primary, #000)" />
            ) : (
              !!query.trim() && (
                <button
                  type="button"
                  aria-label="Clear search"
                  className="text-muted hover:text-base-fg text-sm"
                  onClick={() => setQuery("")}
                >
                  ✕
                </button>
              )
            )}
          </div>
        </div>
      </Motion.div>

      {!query.trim() ? (
        <Motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="max-w-[960px] mx-auto !pt-16 md:!pt-0 px-3"
        >
          <h1 className="text-3xl text-primary font-bold mb-2 md:pt-4">
            Drinks
          </h1>
          <p className="text-muted max-w-prose">
            A curated selection of handcrafted cocktails, sake, and specialty
            beverages that blend traditional Japanese flavors with modern
            mixology.
          </p>
        </Motion.header>
      ) : (
        <div className="h-10" />
      )}

      {isLoading && <div className="p-3 text-muted">Loading…</div>}
      {isError && !isLoading && (
        <div className="p-3 text-danger text-sm">
          {error?.message || "Failed to load drinks."}
          <button
            onClick={() => refetch()}
            className="ml-3 px-3 py-1 rounded border border-secondary/40 hover:bg-secondary/20"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="max-w-[960px] mx-auto space-y-8 px-3">
          {filteredSections.map((sec) => (
            <Motion.section
              key={sec.id}
              className="space-y-4"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.2, once: false }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <h2 className="text-xl font-bold uppercase tracking-wider bg-text text-contrast px-3 rounded-ee-2xl">
                {sec.name}
              </h2>
              <div className="space-y-6">
                {(sec.groups || []).map((g) => (
                  <div key={g.id} className="space-y-2">
                    <h3 className="text-lg font-semibold tracking-tighter text-contrast bg-primary px-3 rounded-se-2xl">
                      {g.name}
                    </h3>
                    <ul className="space-y-2 divide-y-[1px] divide-secondary/40 *:pb-1">
                      {(g.items || []).map((it) => (
                        <InViewReveal
                          as="li"
                          key={it.id}
                          className="flex items-start justify-between gap-3"
                        >
                          <div>
                            <div className="font-medium">{it.name}</div>
                            {Array.isArray(it.ingredients) &&
                              it.ingredients.length > 0 && (
                                <div className="text-xs text-muted line-clamp-2">
                                  {it.ingredients.join(" + ")}
                                </div>
                              )}
                            {it.origin && (
                              <div className="text-xs text-muted">
                                {it.origin}
                              </div>
                            )}
                          </div>
                          <div className="text-right text-sm min-w-[160px] flex flex-col gap-2">
                            {(it.amounts || []).map((a) => (
                              <div
                                key={a.id}
                                className="flex justify-end gap-2"
                              >
                                <span className="text-muted">{a.size}</span>
                                <span className="tabular-nums font-semibold">
                                  ${a.price.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </InViewReveal>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Motion.section>
          ))}
          {!debouncedQuery && sections.length === 0 && (
            <div className="text-muted">No drinks to show yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
