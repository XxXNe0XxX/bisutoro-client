import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAppSettings, updateAppSettings } from "../../lib/api";
import StructuredHoursEditor from "../../components/admin/StructuredHoursEditor";

export default function DashboardHours() {
  const qc = useQueryClient();
  const settingsQ = useQuery({
    queryKey: ["app-settings"],
    queryFn: getAppSettings,
  });
  const [hours, setHours] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (settingsQ.data) {
      setHours(settingsQ.data.hours_of_operation_structured || {});
      setDirty(false);
      setError("");
    }
  }, [settingsQ.data]);

  function validate(obj) {
    if (!obj) return true;
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    for (const d of days) {
      const v = obj[d];
      if (!v) continue;
      const ok = (s) => !s || s.toLowerCase() === "closed" || s.includes(" - ");
      if (!ok(v.morning) || !ok(v.evening)) return false;
    }
    return true;
  }

  const saveMut = useMutation({
    mutationFn: (patch) => updateAppSettings(patch),
    onSuccess: (data) => {
      qc.setQueryData(["app-settings"], data);
      setDirty(false);
    },
  });

  function save() {
    setError("");
    const obj = hours || {};
    if (!validate(obj)) {
      setError("Each segment must be 'closed' or a 'start - end' time range.");
      return;
    }
    // Prune empty days
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const pruned = {};
    let hasAny = false;
    for (const d of days) {
      const v = obj[d];
      if (!v) continue;
      const morning = (v.morning || "").trim();
      const evening = (v.evening || "").trim();
      if (morning || evening) {
        pruned[d] = {
          morning: morning || "closed",
          evening: evening || "closed",
        };
        hasAny = true;
      }
    }
    saveMut.mutate({ hours_of_operation_structured: hasAny ? pruned : null });
  }

  return (
    <section className="p-3 text-base-fg space-y-4 overflow-x-auto ">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Hours of Operation</h1>
        <div className="flex items-center gap-2">
          {error && <span className="text-danger text-sm">{error}</span>}
          {saveMut.isError && (
            <span className="text-danger text-sm">
              {saveMut.error?.message || "Save failed"}
            </span>
          )}
          <button
            onClick={save}
            disabled={saveMut.isPending || !dirty}
            className="px-4 py-2 rounded bg-primary text-contrast disabled:opacity-60"
          >
            {saveMut.isPending ? "Saving…" : dirty ? "Save changes" : "Saved"}
          </button>
        </div>
      </div>

      {settingsQ.isLoading ? (
        <div className="text-muted">Loading…</div>
      ) : settingsQ.isError ? (
        <div className="text-danger text-sm">
          {settingsQ.error?.message || "Failed to load"}
        </div>
      ) : (
        <div className="rounded-2xl shadow-inner shadow-black/30 border border-secondary/40 bg-surface p-4 space-y-4">
          <StructuredHoursEditor
            value={hours}
            onChange={(v) => {
              setHours(v);
              setDirty(true);
            }}
          />
        </div>
      )}
    </section>
  );
}
