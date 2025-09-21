import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createMenuItem } from "../../lib/api";
import CreateItemForm from "../../components/dashboard/CreateItemForm";

export default function DashboardItemNew() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const createMut = useMutation({
    mutationFn: (payload) => createMenuItem(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menu-items"] });
      navigate("/dashboard/items");
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
    </div>
  );
}
