import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Quantity from "../components/ui/Quantity";
import {
  getMenuItem,
  createItemReview,
  getPublicAppSettings,
  listItemReviews,
} from "../lib/api";
import Modal from "../components/ui/Modal";
import { useState } from "react";

function Stars({ value }) {
  const v = Math.round((Number(value) || 0) * 2) / 2; // half steps
  return (
    <span aria-label={`Rating ${v} out of 5`} className="text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < Math.floor(v) ? "★" : i < v ? "☆" : "☆"}</span>
      ))}
    </span>
  );
}

export default function ItemPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [form, setForm] = useState({
    rating: 5,
    title: "",
    body: "",
    author_name: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const {
    data: item,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["menu-item", id],
    queryFn: () => getMenuItem(id, { withReviews: true }),
    enabled: !!id,
  });

  // Public app settings to control visibility of reviews on item pages
  const publicSettings = useQuery({
    queryKey: ["public-app-settings"],
    queryFn: getPublicAppSettings,
  });

  // Latest 10 reviews for this item (only when setting is enabled)
  const reviewsQ = useQuery({
    queryKey: ["menu-item-reviews", id, 10],
    queryFn: () => listItemReviews(id, { limit: 10, offset: 0 }),
    enabled: Boolean(id) && publicSettings.data?.show_reviews_on_items === true,
  });

  const createReview = useMutation({
    mutationFn: (payload) => createItemReview(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menu-item", id] });
      setReviewOpen(false);
      setForm({ rating: 5, title: "", body: "", author_name: "" });
      setSubmitted(false);
    },
  });

  const summary = item?.reviews || { count: 0, avg_rating: null };

  const errors = {};
  const r = Number(form.rating);
  if (!Number.isInteger(r) || r < 1 || r > 5)
    errors.rating = "Rating must be 1-5";
  if (form.title && form.title.length > 120) errors.title = "Title too long";
  if (form.body && form.body.length > 2000) errors.body = "Review too long";
  if (form.author_name && form.author_name.length > 80)
    errors.author_name = "Name too long";

  function submitReview(e) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) return;
    createReview.mutate({
      rating: r,
      title: form.title || undefined,
      body: form.body || undefined,
      author_name: form.author_name || undefined,
    });
  }

  return (
    <div className="p-3 space-y-6 text-base-fg">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          {item?.name || "Item"}
          <div className="flex gap-2">
            {(item?.vegan === true ||
              item?.vegan === 1 ||
              String(item?.vegan) === "1") && (
              <span className="text-xs px-2 py-0.5 rounded-2xl bg-success text-base-fg">
                VG
              </span>
            )}
            {(item?.gluten_free === true ||
              item?.gluten_free === 1 ||
              String(item?.gluten_free) === "1") && (
              <span className="text-xs px-2 py-0.5 rounded-2xl bg-warning text-base-fg">
                GF
              </span>
            )}
          </div>
        </h1>
        <Link className="text-sm text-primary underline" to={"/menu"}>
          Back to menu
        </Link>
      </div>

      {isLoading && <div className="text-muted">Loading…</div>}
      {isError && !isLoading && (
        <div className="text-danger text-sm">
          {error?.message || "Failed to load item"}
        </div>
      )}

      {item && (
        <div className="space-y-4 ">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-muted max-w-prose">{item.description}</p>
              {Array.isArray(item.ingredients) &&
                item.ingredients.length > 0 && (
                  <p className="text-sm text-muted">
                    Ingredients: {item.ingredients.join(" + ")}
                  </p>
                )}
            </div>
            <div className="text-right">
              <span className="font-semibold text-2xl tabular-nums flex flex-row-reverse items-center gap-2">
                ${item.price}
                {Number.isFinite(Number(item.pieces_per_order)) &&
                  Number(item.pieces_per_order) > 0 && (
                    <Quantity>
                      {Number(item.pieces_per_order)}{" "}
                      {item.pieces_per_order > 1 ? "pcs" : "pc"}
                    </Quantity>
                  )}
              </span>
              <div className="text-sm text-muted">{item.category}</div>
            </div>
          </div>

          <>
            {publicSettings.data?.show_average_rating_on_items === true && (
              <div className="flex items-center gap-2">
                <Stars value={summary?.avg_rating} />
                <span className="text-sm text-muted">
                  {summary?.avg_rating
                    ? summary.avg_rating.toFixed(1)
                    : "No ratings"}{" "}
                  ({summary?.count || 0})
                </span>
              </div>
            )}

            <div>
              <button
                onClick={() => setReviewOpen(true)}
                className="px-4 py-2 rounded bg-primary text-contrast font-semibold"
              >
                Leave a review
              </button>
            </div>
          </>

          {/* Recent reviews intentionally omitted for now */}
        </div>
      )}
      {publicSettings.data?.show_reviews_on_items === true && (
        <section className="mt-4 space-y-2">
          <h2 className="text-lg font-semibold">Recent reviews</h2>
          {reviewsQ.isLoading && (
            <div className="text-sm text-muted">Loading reviews…</div>
          )}
          {reviewsQ.isError && !reviewsQ.isLoading && (
            <div className="text-sm text-danger">
              {reviewsQ.error?.message || "Failed to load reviews"}
            </div>
          )}
          {reviewsQ.data && (
            <ul className="space-y-3">
              {(reviewsQ.data.reviews || []).length === 0 && (
                <li className="text-sm text-muted">No reviews yet.</li>
              )}
              {(reviewsQ.data.reviews || []).map((r) => (
                <li
                  key={r.id}
                  className="rounded-2xl border border-secondary/40 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Stars value={r.rating} />
                        {r.title && (
                          <span className="font-medium truncate">
                            {r.title}
                          </span>
                        )}
                      </div>
                      {r.body && (
                        <p className="mt-1 text-sm text-base-fg whitespace-pre-wrap break-words">
                          {r.body}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 p-1 text-right text-xs text-muted">
                      <div>{new Date(r.created_at).toLocaleString()}</div>
                      {r.author_name && <div>— {r.author_name}</div>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      <Modal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title={`Leave a review`}
        actions={[
          <button
            key="cancel"
            onClick={() => setReviewOpen(false)}
            className="px-3 py-1 rounded bg-secondary text-contrast"
          >
            Cancel
          </button>,
          <button
            key="submit"
            onClick={submitReview}
            disabled={createReview.isPending}
            className="px-3 py-1 rounded bg-primary text-contrast disabled:opacity-60"
          >
            {createReview.isPending ? "Submitting…" : "Submit"}
          </button>,
        ]}
      >
        <form onSubmit={submitReview} className="space-y-3">
          <div>
            <label className="text-sm text-muted">Rating</label>
            <select
              value={form.rating}
              onChange={(e) =>
                setForm({ ...form, rating: Number(e.target.value) })
              }
              className={`w-full rounded-2xl p-3 border ${
                submitted && errors.rating
                  ? "border-danger"
                  : "border-secondary/40"
              }`}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option
                  key={n}
                  value={n}
                  className="text-base-fg bg-background "
                >
                  {n}
                </option>
              ))}
            </select>
            {submitted && errors.rating && (
              <div className="text-danger text-xs mt-1">{errors.rating}</div>
            )}
          </div>
          <div>
            <label className="text-sm text-muted">Title (optional)</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-2xl p-3 border border-secondary/40"
              maxLength={120}
            />
          </div>
          <div>
            <label className="text-sm text-muted">Review (optional)</label>
            <textarea
              rows={4}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="w-full rounded-2xl p-3 border border-secondary/40"
              maxLength={2000}
            />
          </div>
          <div>
            <label className="text-sm text-muted">Your name (optional)</label>
            <input
              value={form.author_name}
              onChange={(e) =>
                setForm({ ...form, author_name: e.target.value })
              }
              className="w-full rounded-2xl p-3 border border-secondary/40"
              maxLength={80}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
