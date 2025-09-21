import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  setCategoryActive,
} from "../../lib/api";

export default function DashboardCategories() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["categories"],
    queryFn: listAllCategories,
  });

  const createMut = useMutation({
    mutationFn: (payload) => createCategory(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => updateCategory(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
  const deleteMut = useMutation({
    mutationFn: (id) => deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
  const activeMut = useMutation({
    mutationFn: ({ id, is_active }) => setCategoryActive(id, is_active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  const categories = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) =>
      [c.name, c.slug]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [categories, search]);

  return (
    <section className="p-2 text-base-fg space-y-4">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="rounded-2xl p-2 border border-secondary/40 bg-background text-base-fg w-52"
        />
      </header>

      <CreateCategoryForm
        onCreate={(payload, reset) =>
          createMut.mutate(payload, { onSuccess: reset })
        }
        isPending={createMut.isPending}
        error={createMut.isError ? createMut.error : null}
      />

      <section className="rounded-2xl border border-secondary/40 overflow-x-auto">
        {isLoading ? (
          <div className="p-4 text-muted">Loading…</div>
        ) : isError ? (
          <div className="p-4 text-danger text-sm">
            {error?.message || "Failed to load"}
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-secondary/10 text-muted">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Slug</th>
                <th className="text-left p-3">Sort</th>
                <th className="text-left p-3">Active</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <CategoryRow
                  key={c.id}
                  category={c}
                  onSave={(id, payload) => updateMut.mutate({ id, payload })}
                  onDelete={(id) => deleteMut.mutate(id)}
                  onToggleActive={(id, is_active) =>
                    activeMut.mutate({ id, is_active })
                  }
                  isSaving={updateMut.isPending}
                  isDeleting={deleteMut.isPending}
                />
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted">
                    No categories
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </section>
  );
}

function CreateCategoryForm({ onCreate, isPending, error }) {
  const [form, setForm] = useState({ name: "", slug: "", sort_order: 0 });
  const [submitted, setSubmitted] = useState(false);
  const nameError = submitted && !form.name.trim();
  const sortError = submitted && Number(form.sort_order) < 0;
  function submit(e) {
    e.preventDefault();
    setSubmitted(true);
    if (nameError || sortError) return;
    const payload = {
      name: form.name.trim(),
      slug: form.slug?.trim() || undefined,
      sort_order: Number(form.sort_order) || 0,
    };
    onCreate(payload, () => setForm({ name: "", slug: "", sort_order: 0 }));
  }
  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3">
      <div className="md:col-span-2">
        <label className="text-sm text-muted">Name</label>
        <input
          value={form.name}
          placeholder="e.g. nigiri_sashimi"
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className={`w-full rounded-2xl p-3 border bg-background text-base-fg ${
            nameError ? "border-danger" : "border-secondary/40"
          }`}
        />
        {nameError && (
          <div className="text-danger text-xs mt-1">Name is required</div>
        )}
      </div>
      <div className="md:col-span-2">
        <label className="text-sm text-muted">Slug</label>
        <input
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          className="w-full rounded-2xl p-3 border border-secondary/40 bg-background text-base-fg"
          placeholder="e.g. nigiri-sashimi"
        />
      </div>
      <div>
        <label className="text-sm text-muted">Sort order</label>
        <input
          type="number"
          min="0"
          value={form.sort_order}
          onChange={(e) =>
            setForm((f) => ({ ...f, sort_order: e.target.value }))
          }
          className={`w-full rounded-2xl p-3 border bg-background text-base-fg ${
            sortError ? "border-danger" : "border-secondary/40"
          }`}
        />
        {sortError && (
          <div className="text-danger text-xs mt-1">Sort must be ≥ 0</div>
        )}
      </div>
      <div className="md:col-span-1 flex items-end justify-end">
        <button
          type="submit"
          disabled={isPending || nameError || sortError}
          className="px-4 py-2 rounded bg-primary text-contrast disabled:opacity-60"
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
  );
}

function CategoryRow({
  category,
  onSave,
  onDelete,
  onToggleActive,
  isSaving,
  isDeleting,
}) {
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({
    name: category.name,
    slug: category.slug || "",
    sort_order: category.sort_order || 0,
  });
  const nameError = !edit.name.trim();
  const sortError = Number(edit.sort_order) < 0;
  function save() {
    if (nameError || sortError) return;
    onSave(category.id, {
      name: edit.name.trim(),
      slug: edit.slug?.trim() || undefined,
      sort_order: Number(edit.sort_order) || 0,
    });
    setEditing(false);
  }
  return (
    <tr className="border-t border-secondary/30">
      <td className="p-3 align-top">
        {editing ? (
          <input
            value={edit.name}
            onChange={(e) => setEdit((r) => ({ ...r, name: e.target.value }))}
            className={`w-full rounded-2xl px-2 border bg-background text-base-fg ${
              nameError ? "border-danger" : "border-secondary/40"
            }`}
          />
        ) : (
          <span className="font-medium">{category.name}</span>
        )}
      </td>
      <td className="p-3 align-top">
        {editing ? (
          <input
            value={edit.slug}
            onChange={(e) => setEdit((r) => ({ ...r, slug: e.target.value }))}
            className="w-full rounded-2xl px-2 border border-secondary/40 bg-background text-base-fg"
          />
        ) : (
          <span className="text-muted">{category.slug || "—"}</span>
        )}
      </td>
      <td className="p-3 align-top">
        {editing ? (
          <input
            type="number"
            min="0"
            value={edit.sort_order}
            onChange={(e) =>
              setEdit((r) => ({ ...r, sort_order: e.target.value }))
            }
            className={`w-24 rounded-2xl px-2 border bg-background text-base-fg ${
              sortError ? "border-danger" : "border-secondary/40"
            }`}
          />
        ) : (
          <span>{category.sort_order ?? 0}</span>
        )}
      </td>
      <td className="p-3 align-top">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!category.is_active}
            onChange={(e) => onToggleActive(category.id, e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <span className={category.is_active ? "text-success" : "text-muted"}>
            {category.is_active ? "Active" : "Inactive"}
          </span>
        </label>
      </td>
      <td className="p-3 align-top whitespace-nowrap">
        {editing ? (
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={isSaving || nameError || sortError}
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
              onClick={() => onDelete(category.id)}
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
