import { useState } from "react";
import MenuItemRow from "./MenuItemRow";
import ConfirmDialog from "../ui/ConfirmDialog";

export default function ItemsTable({
  items,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}) {
  const [pendingDelete, setPendingDelete] = useState(null);

  return (
    <section className="rounded-2xl border border-secondary/40 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-secondary/10 text-muted">
          <tr>
            <th className="text-left p-3">Name</th>
            <th className="text-left p-3">Category</th>
            <th className="text-left p-3">Price</th>
            <th className="text-left p-3">Available</th>
            <th className="text-left p-3">Vegan</th>
            <th className="text-left p-3">Gluten-free</th>
            <th className="text-left p-3">Ingredients</th>
            <th className="text-left p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <MenuItemRow
              key={it.id}
              item={it}
              onSave={onSave}
              onDelete={(id) => setPendingDelete(id)}
              isSaving={isSaving}
              isDeleting={isDeleting}
            />
          ))}
          {!items.length && (
            <tr>
              <td colSpan={8} className="p-6 text-center text-muted">
                No items found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <ConfirmDialog
        open={pendingDelete != null}
        danger
        title="Delete item"
        message="This action cannot be undone. Do you want to delete this item?"
        confirmText="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete != null) onDelete(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </section>
  );
}
