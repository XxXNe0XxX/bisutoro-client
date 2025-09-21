import { useState, useMemo } from "react";

function toCurrency(n) {
  const val = Number(n ?? 0);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(val);
}

export default function MenuItemRow({
  item,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}) {
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState(() => ({
    name: item.name ?? "",
    price: item.price ?? 0,
    category: item.category ?? "",
    description: item.description ?? "",
    ingredients: (item.ingredients || []).join(", "),
    is_available: item.is_available == null ? true : !!item.is_available,
    vegan:
      item.vegan === true || item.vegan === 1 || String(item.vegan) === "1",
    gluten_free:
      item.gluten_free === true ||
      item.gluten_free === 1 ||
      String(item.gluten_free) === "1",
  }));

  const errors = useMemo(() => {
    const errs = {};
    if (!edit.name.trim()) errs.name = "Name is required";
    const priceNum = Number(edit.price);
    if (!Number.isFinite(priceNum) || priceNum < 0)
      errs.price = "Price must be a non-negative number";
    return errs;
  }, [edit.name, edit.price]);

  const canSave = Object.keys(errors).length === 0;

  function handleSave() {
    if (!canSave) return;
    const priceNum = Number(edit.price);
    const payload = {
      name: edit.name.trim(),
      price: Number.isFinite(priceNum) ? priceNum : 0,
      category: edit.category?.trim?.() || null,
      description: edit.description?.trim?.() || null,
      ingredients: (() => {
        const arr = String(edit.ingredients || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        return arr.length ? arr : null;
      })(),
      is_available: !!edit.is_available,
      vegan: !!edit.vegan,
      gluten_free: !!edit.gluten_free,
    };
    onSave(item.id, payload);
    setEditing(false);
  }

  return (
    <tr className="border-t border-secondary/30">
      <td className="p-3 align-top">
        {editing ? (
          <>
            <input
              value={edit.name}
              onChange={(e) => setEdit((r) => ({ ...r, name: e.target.value }))}
              className={`w-full rounded-2xl px-2 border bg-background text-base-fg ${
                errors.name ? "border-danger" : "border-secondary/40"
              }`}
            />
            {errors.name && (
              <div className="text-danger text-xs mt-1">{errors.name}</div>
            )}
            <textarea
              rows={2}
              value={edit.description}
              onChange={(e) =>
                setEdit((r) => ({ ...r, description: e.target.value }))
              }
              className="mt-2 w-full rounded-2xl px-2 border border-secondary/40 bg-background text-base-fg"
            />
          </>
        ) : (
          <>
            <div className="font-medium">{item.name}</div>
            <div className="text-muted mt-1 max-w-prose line-clamp-2">
              {item.description}
            </div>
          </>
        )}
      </td>
      <td className="p-3 align-top">
        {editing ? (
          <input
            value={edit.category}
            onChange={(e) =>
              setEdit((r) => ({ ...r, category: e.target.value }))
            }
            className="w-full rounded-2xl px-2 border border-secondary/40 bg-background text-base-fg"
          />
        ) : (
          <span>{item.category || "—"}</span>
        )}
      </td>
      <td className="p-3 align-top whitespace-nowrap">
        {editing ? (
          <div>
            <input
              type="number"
              step="0.01"
              min="0"
              value={edit.price}
              onChange={(e) =>
                setEdit((r) => ({ ...r, price: e.target.value }))
              }
              className={`w-28 rounded-2xl px-2 border bg-background text-base-fg ${
                errors.price ? "border-danger" : "border-secondary/40"
              }`}
            />
            {errors.price && (
              <div className="text-danger text-xs mt-1">{errors.price}</div>
            )}
          </div>
        ) : (
          <span>{toCurrency(item.price)}</span>
        )}
      </td>
      <td className="p-3 align-top">
        {editing ? (
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!edit.is_available}
              onChange={(e) =>
                setEdit((r) => ({ ...r, is_available: e.target.checked }))
              }
              className="h-4 w-4 accent-primary"
            />
            <span className="text-muted">Available</span>
          </label>
        ) : (
          <span className={item.is_available ? "text-success" : "text-danger"}>
            {item.is_available ? "Yes" : "No"}
          </span>
        )}
      </td>

      {/* Vegan column */}
      <td className="p-3 align-top">
        {editing ? (
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!edit.vegan}
              onChange={(e) =>
                setEdit((r) => ({ ...r, vegan: e.target.checked }))
              }
              className="h-4 w-4 accent-success"
            />
            <span className="text-muted">Vegan</span>
          </label>
        ) : item.vegan === true ||
          item.vegan === 1 ||
          String(item.vegan) === "1" ? (
          <span className="px-1.5 py-0.5 rounded-2xl bg-success text-base-fg text-xs">
            VG
          </span>
        ) : (
          <span className="text-muted">—</span>
        )}
      </td>

      {/* Gluten-free column */}
      <td className="p-3 align-top">
        {editing ? (
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!edit.gluten_free}
              onChange={(e) =>
                setEdit((r) => ({ ...r, gluten_free: e.target.checked }))
              }
              className="h-4 w-4 accent-warning"
            />
            <span className="text-muted">Gluten-free</span>
          </label>
        ) : item.gluten_free === true ||
          item.gluten_free === 1 ||
          String(item.gluten_free) === "1" ? (
          <span className="px-1.5 py-0.5 rounded-2xl bg-warning text-base-fg text-xs">
            GF
          </span>
        ) : (
          <span className="text-muted">—</span>
        )}
      </td>
      <td className="p-3 align-top">
        {editing ? (
          <input
            value={edit.ingredients}
            onChange={(e) =>
              setEdit((r) => ({ ...r, ingredients: e.target.value }))
            }
            className="w-full rounded-2xl px-2 border border-secondary/40 bg-background text-base-fg"
          />
        ) : (
          <div className="text-muted max-w-prose line-clamp-3">
            {(item.ingredients || []).join(", ") || "—"}
          </div>
        )}
      </td>
      <td className="p-3 align-top whitespace-nowrap">
        {editing ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={!canSave || isSaving}
              className="px-3 py-1 rounded bg-primary text-contrast disabled:opacity-60"
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1 rounded bg-secondary text-contrast"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1 rounded bg-secondary text-contrast"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(item.id)}
              disabled={isDeleting}
              className="px-3 py-1 rounded bg-danger text-contrast disabled:opacity-60"
            >
              Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
