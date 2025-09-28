import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createMenuItem } from "../../lib/api";
import CreateItemForm from "../../components/dashboard/CreateItemForm";
import Modal from "../../components/ui/Modal";

export default function DashboardItemNew() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const createMut = useMutation({
    mutationFn: (payload) => createMenuItem(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menu-items"] });
    },
  });

  return (
    <div className="space-y-6 p-3 text-base-fg">
      <div className="flex items-center justify-end">
        <a href="/dashboard/items" className="text-sm text-primary underline">
          Back to items
        </a>
      </div>
      <CreateItemForm
        onCreate={(payload) => createMut.mutate(payload)}
        isPending={createMut.isPending}
        error={createMut.isError ? createMut.error : null}
      />
      <Modal
        open={createMut.isSuccess}
        onClose={() => {
          createMut.reset();
          navigate("/dashboard/items");
        }}
        title="Item created"
        actions={[
          <button
            key="ok"
            onClick={() => {
              createMut.reset();
              navigate("/dashboard/items");
            }}
            className="px-3 py-1 rounded bg-primary text-contrast"
          >
            OK
          </button>,
        ]}
      >
        <p className="text-muted">The new item was created successfully.</p>
      </Modal>
    </div>
  );
}
