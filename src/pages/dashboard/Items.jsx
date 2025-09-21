import { useMemo, useState } from "react";
import Modal from "../../components/ui/Modal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../../lib/api";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import CreateItemForm from "../../components/dashboard/CreateItemForm";
import ItemsTable from "../../components/dashboard/ItemsTable";

export default function DashboardItems() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["menu-items"],
    queryFn: listMenuItems,
  });

  const createMut = useMutation({
    mutationFn: async (payload) => createMenuItem(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => updateMenuItem(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => deleteMenuItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
  });

  const items = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const fields = [
        it.name,
        it.category,
        it.description,
        ...(Array.isArray(it.ingredients) ? it.ingredients : []),
      ]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase());
      return fields.some((f) => f.includes(q));
    });
  }, [items, search]);

  const handleCreate = (payload, reset) => {
    createMut.mutate(payload, {
      onSuccess: () => {
        reset?.();
      },
    });
  };

  const handleSave = (id, payload) => updateMut.mutate({ id, payload });
  const handleDelete = (id) => deleteMut.mutate(id);

  return (
    <div className="space-y-6 max-w-screen overflow-hidden p-3 text-base-fg">
      <DashboardHeader search={search} onSearchChange={setSearch} />

      <CreateItemForm
        onCreate={handleCreate}
        isPending={createMut.isPending}
        error={createMut.isError ? createMut.error : null}
      />

      {isLoading ? (
        <div className="p-4 text-muted">Loading items…</div>
      ) : isError ? (
        <div className="p-4 text-danger text-sm">
          {error?.message || "Failed to load items"}
        </div>
      ) : (
        <ItemsTable
          items={filtered}
          onSave={handleSave}
          onDelete={handleDelete}
          isSaving={updateMut.isPending}
          isDeleting={deleteMut.isPending}
        />
      )}

      {/* Success/Error notifications (lightweight modal) */}
      <Modal
        open={createMut.isSuccess}
        onClose={() => createMut.reset()}
        title="Item created"
        actions={[
          <button
            key="ok"
            onClick={() => createMut.reset()}
            className="px-3 py-1 rounded bg-primary text-contrast"
          >
            OK
          </button>,
        ]}
      >
        <p className="text-muted">The new item was created successfully.</p>
      </Modal>

      <Modal
        open={updateMut.isSuccess}
        onClose={() => updateMut.reset()}
        title="Item updated"
        actions={[
          <button
            key="ok"
            onClick={() => updateMut.reset()}
            className="px-3 py-1 rounded bg-primary text-contrast"
          >
            OK
          </button>,
        ]}
      >
        <p className="text-muted">Changes were saved.</p>
      </Modal>

      <Modal
        open={deleteMut.isSuccess}
        onClose={() => deleteMut.reset()}
        title="Item deleted"
        actions={[
          <button
            key="ok"
            onClick={() => deleteMut.reset()}
            className="px-3 py-1 rounded bg-primary text-contrast"
          >
            OK
          </button>,
        ]}
      >
        <p className="text-muted">The item was deleted.</p>
      </Modal>

      <Modal
        open={createMut.isError || updateMut.isError || deleteMut.isError}
        onClose={() => {
          if (createMut.isError) createMut.reset();
          if (updateMut.isError) updateMut.reset();
          if (deleteMut.isError) deleteMut.reset();
        }}
        title="Operation failed"
        actions={[
          <button
            key="close"
            onClick={() => {
              if (createMut.isError) createMut.reset();
              if (updateMut.isError) updateMut.reset();
              if (deleteMut.isError) deleteMut.reset();
            }}
            className="px-3 py-1 rounded bg-secondary text-contrast"
          >
            Close
          </button>,
        ]}
      >
        <p className="text-danger text-sm">
          {createMut.isError && (createMut.error?.message || "Create failed")}
          {updateMut.isError && (updateMut.error?.message || "Update failed")}
          {deleteMut.isError && (deleteMut.error?.message || "Delete failed")}
        </p>
      </Modal>
    </div>
  );
}
