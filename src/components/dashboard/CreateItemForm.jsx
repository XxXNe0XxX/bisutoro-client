import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listCategories } from "../../lib/api";
import { FaPlus } from "react-icons/fa6";

const NAME_MAX = 100;
const DESC_MAX = 500;
const PRICE_MIN = 0.01;
const PRICE_MAX = 999.99;

export default function CreateItemForm({ onCreate, isPending, error }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    ingredients: [],
    is_available: true,
    vegan: false,
    gluten_free: false,
    pieces_per_order: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [ingredientInput, setIngredientInput] = useState("");

  const location = useLocation();

  const {
    data: activeCategories,
    isLoading: catsLoading,
    isError: catsError,
  } = useQuery({ queryKey: ["active-categories"], queryFn: listCategories });

  const errors = useMemo(() => {
    const errs = {};
    const name = String(form.name);
    if (!name.trim()) errs.name = "Name is required";
    if (name.length > NAME_MAX) errs.name = `Max ${NAME_MAX} characters`;
    const priceNum = Number(form.price);
    if (
      !Number.isFinite(priceNum) ||
      priceNum < PRICE_MIN ||
      priceNum > PRICE_MAX
    )
      errs.price = `Price must be between ${PRICE_MIN} and ${PRICE_MAX}`;
    if (!form.category) errs.category = "Category is required";
    const desc = String(form.description || "");
    if (!desc.trim()) errs.description = "Description is required";
    if (desc.length > DESC_MAX) errs.description = `Max ${DESC_MAX} characters`;
    if (!Array.isArray(form.ingredients) || form.ingredients.length < 1)
      errs.ingredients = "Add at least one ingredient";
    if (String(form.pieces_per_order || "").trim()) {
      const n = Number(form.pieces_per_order);
      if (!Number.isInteger(n) || n <= 0)
        errs.pieces_per_order = "Must be a positive integer";
    }
    return errs;
  }, [form]);

  const canSubmit = Object.keys(errors).length === 0;

  function submit(e) {
    e.preventDefault();
    setSubmitted(true);
    if (!canSubmit) return;
    const priceNum = Number(form.price);
    const payload = {
      name: form.name.trim(),
      price: priceNum,
      category: form.category || null,
      description: form.description?.trim() || null,
      ingredients: form.ingredients,
      is_available: !!form.is_available,
      vegan: !!form.vegan,
      gluten_free: !!form.gluten_free,
      pieces_per_order: (() => {
        const raw = String(form.pieces_per_order || "").trim();
        if (!raw) return undefined;
        const n = Number(raw);
        return Number.isInteger(n) && n > 0 ? n : undefined;
      })(),
    };
    onCreate(payload, () =>
      setForm({
        name: "",
        price: "",
        category: "",
        description: "",
        ingredients: [],
        is_available: true,
        vegan: false,
        gluten_free: false,
        pieces_per_order: "",
      })
    );
  }

  function addIngredient() {
    const val = String(ingredientInput).trim();
    if (!val) return;
    const exists = form.ingredients.some(
      (x) => x.toLowerCase() === val.toLowerCase()
    );
    if (exists) return setIngredientInput("");
    setForm((f) => ({ ...f, ingredients: [...f.ingredients, val] }));
    setIngredientInput("");
  }

  function removeIngredient(idx) {
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.filter((_, i) => i !== idx),
    }));
  }
  useEffect(() => {
    location.pathname.includes("/items/new") ? setOpen(true) : "";
    return () => {};
  }, [location]);

  return (
    <section className="rounded-2xl border border-secondary/40 p-4 bg-surface space-y-4">
      <header className="flex items-center justify-between">
        <div className="font-semibold flex items-center">
          <h1 className="px-2">Create new item</h1>
          {location.pathname.includes("items/new") ? (
            ""
          ) : (
            <button className="bg-secondary rounded-2xl p-1 px-3   ">
              <a href="/dashboard/items/new" className="text-sm text-contrast ">
                Open full page form
              </a>
            </button>
          )}
        </div>
        {!location.pathname.includes("/items/new") && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-sm text-primary p-3"
          >
            {open ? "Hide" : "Show"}
          </button>
        )}
      </header>
      {open && (
        <form
          onSubmit={submit}
          className="grid grid-cols-1 md:grid-cols-6 gap-3"
        >
          <div className="md:col-span-1">
            <label className="text-sm text-muted">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={NAME_MAX}
              className={`w-full rounded-2xl p-1 px-2 border bg-background text-base-fg ${
                submitted && errors.name
                  ? "border-danger"
                  : "border-secondary/40"
              }`}
            />
            {submitted && errors.name && (
              <div className="text-danger text-xs mt-1">{errors.name}</div>
            )}
            <div className="text-xs text-muted mt-1">
              {form.name.length}/{NAME_MAX}
            </div>
          </div>

          <div className="md:col-span-1">
            <label className="text-sm text-muted">Price</label>
            <input
              type="number"
              step="0.01"
              min={PRICE_MIN}
              max={PRICE_MAX}
              required
              value={form.price}
              onChange={(e) =>
                setForm((f) => ({ ...f, price: e.target.value }))
              }
              className={`w-full rounded-2xl p-1 px-2 border bg-background text-base-fg ${
                submitted && errors.price
                  ? "border-danger"
                  : "border-secondary/40"
              }`}
            />
            {submitted && errors.price && (
              <div className="text-danger text-xs mt-1">{errors.price}</div>
            )}
          </div>

          <div className="md:col-span-1">
            <label className="text-sm text-muted">Pieces per order</label>
            <input
              type="number"
              min={1}
              step={1}
              value={form.pieces_per_order}
              onChange={(e) =>
                setForm((f) => ({ ...f, pieces_per_order: e.target.value }))
              }
              placeholder="e.g. 6"
              className={`w-full rounded-2xl p-1 px-2 border bg-background text-base-fg ${
                submitted && errors.pieces_per_order
                  ? "border-danger"
                  : "border-secondary/40"
              }`}
            />
            {submitted && errors.pieces_per_order && (
              <div className="text-danger text-xs mt-1">
                {errors.pieces_per_order}
              </div>
            )}
          </div>

          <div className="md:col-span-1">
            <label className="text-sm text-muted">Category</label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
              className={`w-full rounded-2xl p-1.5 px-2 border bg-background text-base-fg ${
                submitted && errors.category
                  ? "border-danger"
                  : "border-secondary/40"
              }`}
              disabled={catsLoading || catsError}
            >
              <option value="">
                {catsLoading ? "Loading..." : "Select... "}
              </option>
              {(Array.isArray(activeCategories) ? activeCategories : []).map(
                (c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                )
              )}
            </select>
            {submitted && errors.category && (
              <div className="text-danger text-xs mt-1">{errors.category}</div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-muted">Ingredients</label>
            <div className="flex gap-2">
              <input
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                className="flex-1 rounded-2xl p-1 px-2 border border-secondary/40 bg-background text-base-fg max-w-full"
                placeholder="Add an ingredient "
              />
              <button
                type="button"
                onClick={addIngredient}
                className="px-3 py-2 rounded bg-secondary text-contrast"
              >
                <FaPlus />
              </button>
            </div>
            {submitted && errors.ingredients && (
              <div className="text-danger text-xs mt-1">
                {errors.ingredients}
              </div>
            )}
            <ul className="mt-2 flex flex-wrap gap-2">
              {(form.ingredients || []).map((ing, idx) => (
                <li
                  key={idx}
                  className="px-2 py-1 rounded-full border border-secondary/40 text-sm flex items-center gap-2"
                >
                  <span>{ing}</span>
                  <button
                    type="button"
                    onClick={() => removeIngredient(idx)}
                    className="text-danger"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-6">
            <label className="text-sm text-muted">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              maxLength={DESC_MAX}
              className={`w-full rounded-2xl p-1 px-2 border bg-background text-base-fg ${
                submitted && errors.description
                  ? "border-danger"
                  : "border-secondary/40"
              }`}
            />
            {submitted && errors.description && (
              <div className="text-danger text-xs mt-1">
                {errors.description}
              </div>
            )}
            <div className="text-xs text-muted mt-1">
              {(form.description || "").length}/{DESC_MAX}
            </div>
          </div>

          <div className="flex items-center gap-2 md:col-span-5">
            <input
              id="available"
              type="checkbox"
              checked={form.is_available}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_available: e.target.checked }))
              }
              className="h-4 w-4 accent-primary"
            />
            <label htmlFor="available" className="text-sm text-muted">
              Available
            </label>
          </div>

          <div className="flex items-center gap-4 md:col-span-5">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!form.vegan}
                onChange={(e) =>
                  setForm((f) => ({ ...f, vegan: e.target.checked }))
                }
                className="h-4 w-4 accent-success"
              />
              <span className="text-muted">Vegan (VG)</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!form.gluten_free}
                onChange={(e) =>
                  setForm((f) => ({ ...f, gluten_free: e.target.checked }))
                }
                className="h-4 w-4 accent-warning"
              />
              <span className="text-muted">Gluten-free (GF)</span>
            </label>
          </div>

          <div className="md:col-span-1 flex items-end justify-end">
            <button
              type="submit"
              disabled={isPending || !canSubmit}
              className="px-4 py-2 rounded bg-primary text-contrast disabled:opacity-30"
            >
              {isPending ? "Creating…" : "Create"}
            </button>
          </div>

          {error && (
            <div className="md:col-span-6 text-danger text-sm">
              {error?.message || "Create failed"}
            </div>
          )}
        </form>
      )}
    </section>
  );
}
