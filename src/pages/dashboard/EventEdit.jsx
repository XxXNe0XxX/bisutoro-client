import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  getEventPublic,
  updateEvent,
  deleteEvent,
  request,
  getStoredToken,
  listMenuItems,
  listEventOverrides,
  upsertEventOverride,
  deleteEventOverride,
} from "../../lib/api";
import imageCompression from "browser-image-compression";
import ClipLoader from "react-spinners/ClipLoader";
import Modal from "../../components/ui/Modal";

function toLocalInputValue(s) {
  if (!s) return "";
  try {
    const normalized = typeof s === "string" ? s.replace(" ", "T") : s;
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  } catch {
    return "";
  }
}

function EventForm({ initial, onSubmit, submitting }) {
  const [form, setForm] = useState(() => ({
    title: initial?.title || "",
    description: initial?.description || "",
    starts_at: initial?.starts_at ? toLocalInputValue(initial.starts_at) : "",
    ends_at: initial?.ends_at ? toLocalInputValue(initial.ends_at) : "",
    image_url: initial?.image_url || "",
    priority: initial?.priority ?? 100,
    is_active: initial?.is_active ?? true,
  }));
  const [uploading, setUploading] = useState(false);
  const [thumbLoading, setThumbLoading] = useState(false);

  useEffect(() => {
    setThumbLoading(Boolean(form.image_url));
  }, [form.image_url]);

  useEffect(() => {
    // update form when initial changes (after fetch)
    if (initial) {
      setForm({
        title: initial?.title || "",
        description: initial?.description || "",
        starts_at: initial?.starts_at
          ? toLocalInputValue(initial.starts_at)
          : "",
        ends_at: initial?.ends_at ? toLocalInputValue(initial.ends_at) : "",
        image_url: initial?.image_url || "",
        priority: initial?.priority ?? 100,
        is_active: initial?.is_active ?? true,
      });
    }
  }, [initial]);

  const errors = useMemo(() => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.description.trim()) errs.description = "Description is required";
    if (!form.starts_at) errs.starts_at = "Start date/time is required";
    if (!form.ends_at) errs.ends_at = "End date/time is required";
    if (form.starts_at && form.ends_at) {
      const s = new Date(form.starts_at);
      const e = new Date(form.ends_at);
      if (!(s < e)) errs.ends_at = "End must be after start";
    }
    return errs;
  }, [form]);

  const canSubmit =
    Object.keys(errors).length === 0 && !uploading && !submitting;

  const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
  const urlEndpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;
  const configuredAuthEndpoint = import.meta.env.VITE_IMAGEKIT_AUTH_ENDPOINT;
  const enabledUpload = publicKey && urlEndpoint;

  const getIKAuth = async () => {
    if (!enabledUpload) return null;
    if (!configuredAuthEndpoint || configuredAuthEndpoint.startsWith("/")) {
      return await request("/api/imagekit/auth", { method: "POST" });
    }
    const { token } = getStoredToken();
    const res = await fetch(configuredAuthEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Auth failed ${res.status}`);
    return await res.json();
  };

  async function handleFilePick(ev) {
    try {
      const file = ev.target.files?.[0];
      if (!file) return;
      if (file.size > 20 * 1024 * 1024) {
        alert("Selected file is too large. Please choose a smaller image.");
        return;
      }
      setUploading(true);
      const compressed = await imageCompression(file, {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        initialQuality: 0.75,
      });
      const auth = await getIKAuth();
      if (!auth) throw new Error("Image upload is not configured.");
      const baseName = (form.title || "event-image").replace(/\s+/g, "-");
      const fileName = baseName + ".jpg";
      const fd = new FormData();
      fd.append("file", compressed, fileName);
      fd.append("fileName", fileName);
      fd.append("publicKey", publicKey);
      fd.append("signature", auth.signature);
      fd.append("token", auth.token);
      fd.append("expire", String(auth.expire));
      const res = await fetch(
        "https://upload.imagekit.io/api/v1/files/upload",
        {
          method: "POST",
          body: fd,
        }
      );
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Upload failed (${res.status})`);
      }
      const data = await res.json();
      setForm((f) => ({ ...f, image_url: data?.url || "" }));
    } catch (e) {
      console.error("Image upload failed", e);
      alert(e?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (ev?.target) ev.target.value = "";
    }
  }

  function submit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: new Date(form.ends_at).toISOString(),
      image_url: form.image_url?.trim() || undefined,
      priority: Number(form.priority) || 100,
      is_active: !!form.is_active,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-sm text-muted">Title</span>
          <input
            className="w-full rounded-md border border-secondary/40 bg-background p-2"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          {errors.title && (
            <div className="text-xs text-danger">{errors.title}</div>
          )}
        </label>
        <label className="space-y-1">
          <span className="text-sm text-muted">Priority</span>
          <input
            type="number"
            className="w-full rounded-md border border-secondary/40 bg-background p-2"
            value={form.priority}
            onChange={(e) =>
              setForm((f) => ({ ...f, priority: e.target.value }))
            }
          />
        </label>
      </div>
      <label className="space-y-1 block">
        <span className="text-sm text-muted">Description</span>
        <textarea
          className="w-full rounded-md border border-secondary/40 bg-background p-2"
          rows={4}
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
        />
        {errors.description && (
          <div className="text-xs text-danger">{errors.description}</div>
        )}
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-sm text-muted">Starts at</span>
          <input
            type="datetime-local"
            className="w-full rounded-md border border-secondary/40 bg-background p-2"
            value={form.starts_at}
            onChange={(e) =>
              setForm((f) => ({ ...f, starts_at: e.target.value }))
            }
          />
          {errors.starts_at && (
            <div className="text-xs text-danger">{errors.starts_at}</div>
          )}
        </label>
        <label className="space-y-1">
          <span className="text-sm text-muted">Ends at</span>
          <input
            type="datetime-local"
            className="w-full rounded-md border border-secondary/40 bg-background p-2"
            value={form.ends_at}
            onChange={(e) =>
              setForm((f) => ({ ...f, ends_at: e.target.value }))
            }
          />
          {errors.ends_at && (
            <div className="text-xs text-danger">{errors.ends_at}</div>
          )}
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
        <label className="space-y-1 block">
          <span className="text-sm text-muted">Image URL</span>
          <input
            className="w-full rounded-md border border-secondary/40 bg-background p-2"
            value={form.image_url}
            onChange={(e) =>
              setForm((f) => ({ ...f, image_url: e.target.value }))
            }
            placeholder="https://..."
          />
          <div className="text-xs text-muted">Or upload below</div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="bg-secondary p-2 rounded-md w-full text-contrast"
              onChange={handleFilePick}
              disabled={!enabledUpload || uploading}
            />
            {uploading && <ClipLoader size={18} />}
          </div>
        </label>
        <div className="border rounded-md overflow-hidden border-secondary/40 bg-background min-h-32 flex items-center justify-center">
          {form.image_url ? (
            <img
              src={form.image_url}
              alt="Preview"
              className={`block w-full h-full object-cover ${
                thumbLoading ? "opacity-70" : "opacity-100"
              }`}
              onLoad={() => setThumbLoading(false)}
              onError={() => setThumbLoading(false)}
            />
          ) : (
            <div className="text-sm text-muted p-3">No image selected</div>
          )}
        </div>
      </div>
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!form.is_active}
          onChange={(e) =>
            setForm((f) => ({ ...f, is_active: e.target.checked }))
          }
        />
        <span>Active</span>
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-3 py-1 rounded-md border border-secondary/40 hover:bg-secondary/20 disabled:opacity-60 bg-primary text-contrast"
        >
          {submitting ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

function OverridesEditor({ eventId }) {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successText, setSuccessText] = useState("");
  const nav = useNavigate();

  const itemsQ = useQuery({
    queryKey: ["menu-items-for-overrides"],
    queryFn: listMenuItems,
  });

  const overridesQ = useQuery({
    queryKey: ["event-overrides", eventId],
    queryFn: () => listEventOverrides(eventId),
    enabled: !!eventId,
  });

  const upsertMut = useMutation({
    mutationFn: ({ itemId, payload }) =>
      upsertEventOverride(eventId, itemId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event-overrides", eventId] });
      setSuccessText("Override saved");
      setSuccessOpen(true);
    },
  });
  const deleteMut = useMutation({
    mutationFn: (itemId) => deleteEventOverride(eventId, itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event-overrides", eventId] });
      setSuccessText("Override removed");
      setSuccessOpen(true);
    },
  });

  const items = useMemo(
    () => (Array.isArray(itemsQ.data) ? itemsQ.data : []),
    [itemsQ.data]
  );
  const overrides = useMemo(
    () => (Array.isArray(overridesQ.data) ? overridesQ.data : []),
    [overridesQ.data]
  );
  const overridesMap = useMemo(() => {
    const m = new Map();
    for (const ov of overrides) {
      if (ov && ov.menu_item_id != null) {
        const key = Number(ov.menu_item_id);
        if (Number.isFinite(key)) m.set(key, ov);
      }
    }
    return m;
  }, [overrides]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      String(it.name || "")
        .toLowerCase()
        .includes(q)
    );
  }, [items, query]);

  const selectedItem = useMemo(
    () => items.find((it) => Number(it.id) === Number(selectedId)) || null,
    [items, selectedId]
  );

  const selOverride = selectedItem
    ? overridesMap.get(Number(selectedItem.id)) || null
    : null;
  const [priceOverride, setPriceOverride] = useState("");
  const [priceDelta, setPriceDelta] = useState("");
  const [piecesOverride, setPiecesOverride] = useState("");

  useEffect(() => {
    if (!selectedItem) {
      setPriceOverride("");
      setPriceDelta("");
      setPiecesOverride("");
      return;
    }
    setPriceOverride(
      selOverride?.price_override != null
        ? String(selOverride.price_override)
        : ""
    );
    setPriceDelta(
      selOverride?.price_delta != null ? String(selOverride.price_delta) : ""
    );
    setPiecesOverride(
      selOverride?.pieces_per_order_override != null
        ? String(selOverride.pieces_per_order_override)
        : ""
    );
  }, [selectedItem, selOverride]);

  function parseNumberOrNull(v) {
    const s = String(v ?? "").trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function handleSave() {
    if (!selectedItem) return;
    const payload = {};
    const po = parseNumberOrNull(priceOverride);
    const pd = parseNumberOrNull(priceDelta);
    const ppo = parseNumberOrNull(piecesOverride);
    if (po != null) payload.price_override = po;
    if (pd != null) payload.price_delta = pd;
    if (ppo != null) payload.pieces_per_order_override = Math.trunc(ppo);
    if (Object.keys(payload).length === 0) {
      alert("Enter at least one override value or use Remove to delete.");
      return;
    }
    upsertMut.mutate({ itemId: selectedItem.id, payload });
  }

  function handleRemove() {
    if (!selectedItem) return;
    if (!selOverride) return;
    if (!confirm("Remove override for this item?")) return;
    deleteMut.mutate(selectedItem.id);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Overrides</h2>
        <div className="text-xs text-muted">
          Manage per-item promo pricing/quantities for this event
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="block">
            <span className="text-sm text-muted">Search menu items</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-md border border-secondary/40 bg-background p-2"
              placeholder="Type to search…"
            />
          </label>
          {itemsQ.isLoading ? (
            <div className="text-muted text-sm">Loading items…</div>
          ) : itemsQ.isError ? (
            <div className="text-danger text-sm">Failed to load items</div>
          ) : (
            <ul className="max-h-64 overflow-auto rounded-md border border-secondary/40 divide-y">
              {filtered.map((it) => {
                const ov = overridesMap.get(Number(it.id));
                const has = !!(
                  ov &&
                  (ov.price_override != null ||
                    ov.price_delta != null ||
                    ov.pieces_per_order_override != null)
                );
                return (
                  <li
                    key={it.id}
                    className={`p-2 flex items-center justify-between cursor-pointer hover:bg-secondary/10 ${
                      Number(selectedId) === Number(it.id)
                        ? "bg-secondary/20"
                        : ""
                    }`}
                    onClick={() => setSelectedId(Number(it.id))}
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{it.name}</div>
                      <div className="text-xs text-muted truncate">
                        ${it.price}{" "}
                        {Number(it.pieces_per_order) > 0
                          ? `· ${it.pieces_per_order} pcs`
                          : ""}
                      </div>
                    </div>
                    {has ? (
                      <span className="text-[10px] px-1.5 py-0.5 text-primary rounded bg-accent/15 text-accent flex-shrink-0">
                        Has override
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/20 flex-shrink-0">
                        None
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="space-y-2">
          <div className="text-sm text-muted">Selected item</div>
          {!selectedItem ? (
            <div className="text-sm">Pick an item to edit its override</div>
          ) : (
            <div className="rounded-md border border-secondary/40 p-3 space-y-2">
              <div className="font-semibold">{selectedItem.name}</div>
              <div className="text-xs text-muted">
                Base: ${selectedItem.base_price ?? selectedItem.price}
                {Number(
                  selectedItem.base_pieces_per_order ??
                    selectedItem.pieces_per_order
                ) > 0 && (
                  <>
                    {" "}
                    ·{" "}
                    {Number(
                      selectedItem.base_pieces_per_order ??
                        selectedItem.pieces_per_order
                    )}{" "}
                    {Number(
                      selectedItem.base_pieces_per_order ??
                        selectedItem.pieces_per_order
                    ) > 1
                      ? "pcs"
                      : "pc"}
                  </>
                )}
              </div>
              {selOverride ? (
                <div className="text-xs">
                  Current override:
                  <ul className="list-disc list-inside">
                    {selOverride.price_override != null && (
                      <li>price_override: ${selOverride.price_override}</li>
                    )}
                    {selOverride.price_delta != null && (
                      <li>
                        price_delta: {selOverride.price_delta > 0 ? "+" : ""}
                        {selOverride.price_delta}
                      </li>
                    )}
                    {selOverride.pieces_per_order_override != null && (
                      <li>
                        pieces_per_order:{" "}
                        {selOverride.pieces_per_order_override}
                      </li>
                    )}
                  </ul>
                </div>
              ) : (
                <div className="text-xs text-muted">No override yet</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className="space-y-1">
                  <span className="text-xs text-muted">Price override</span>
                  <input
                    type="number"
                    step="0.01"
                    value={priceOverride}
                    onChange={(e) => setPriceOverride(e.target.value)}
                    className="w-full rounded-md border border-secondary/40 bg-background p-2"
                    placeholder="e.g. 12.50"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-muted">Price delta</span>
                  <input
                    type="number"
                    step="0.01"
                    value={priceDelta}
                    onChange={(e) => setPriceDelta(e.target.value)}
                    className="w-full rounded-md border border-secondary/40 bg-background p-2"
                    placeholder="e.g. -1.00 or 2.00"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-muted">Pieces per order</span>
                  <input
                    type="number"
                    step="1"
                    value={piecesOverride}
                    onChange={(e) => setPiecesOverride(e.target.value)}
                    className="w-full rounded-md border border-secondary/40 bg-background p-2"
                    placeholder="e.g. 2"
                  />
                </label>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  onClick={handleSave}
                  disabled={upsertMut.isPending}
                  className="px-3 py-1 rounded-md border text-contrast bg-primary border-secondary/40 hover:bg-secondary/20"
                >
                  {upsertMut.isPending ? "Saving…" : "Save override"}
                </button>
                <button
                  onClick={handleRemove}
                  disabled={!selOverride || deleteMut.isPending}
                  className="px-3 py-1 rounded-md border border-secondary/40 hover:bg-secondary/20 bg-danger text-contrast disabled:opacity-60"
                >
                  {deleteMut.isPending ? "Removing…" : "Remove"}
                </button>
              </div>
              <div className="text-[10px] text-muted">
                Tip: Use price_override to set an absolute promo price, or
                price_delta to adjust from base. You can set both; the server
                will apply overrides per its rules.
              </div>
            </div>
          )}
        </div>
        <Modal
          open={successOpen}
          onClose={() => setSuccessOpen(false)}
          title="Success"
        >
          <div className="p-2 space-y-3">
            <div>{successText || "Saved successfully."}</div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSuccessOpen(false)}
                className="px-3 py-1 rounded-md border border-secondary/40 hover:bg-secondary/20"
              >
                Close
              </button>
              <button
                onClick={() => nav("/dashboard/events")}
                className="px-3 py-1 rounded-md border border-secondary/40 hover:bg-secondary/20 bg-primary text-contrast"
              >
                Back to Events
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default function DashboardEventEdit() {
  const [successOpen, setSuccessOpen] = useState(false);
  const [successText, setSuccessText] = useState("");
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();

  const evQ = useQuery({
    queryKey: ["event-public", id],
    queryFn: () => getEventPublic(id),
    enabled: !!id,
  });

  const updateMut = useMutation({
    mutationFn: (patch) => updateEvent(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events-all"] });
      qc.invalidateQueries({ queryKey: ["event-public", id] });
      setSuccessText("Event saved");
      setSuccessOpen(true);
    },
  });
  const deleteMut = useMutation({
    mutationFn: () => deleteEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events-all"] });
      nav("/dashboard/events");
    },
  });

  return (
    <div className="p-3 space-y-4 text-base-fg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Edit Event</h1>
        </div>
        <button
          onClick={() => {
            if (confirm("Delete this event?")) deleteMut.mutate();
          }}
          className="px-3 py-1 rounded-md border border-secondary/40 hover:bg-secondary/20 bg-danger text-contrast"
        >
          {deleteMut.isPending ? "Deleting…" : "Delete"}
        </button>
      </div>
      <Link
        to="/dashboard/events"
        className="text-sm underline flex justify-end w-full "
      >
        ← Back to Events
      </Link>

      {evQ.isLoading && <div className="text-muted">Loading…</div>}
      {evQ.isError && <div className="text-danger">Failed to load event</div>}
      {evQ.data && (
        <div className="space-y-6">
          <EventForm
            initial={evQ.data}
            onSubmit={(patch) => updateMut.mutate(patch)}
            submitting={updateMut.isPending}
          />
          <div className="border-t border-secondary/40 pt-3">
            <OverridesEditor eventId={id} />
          </div>
        </div>
      )}
      <Modal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        title="Success"
      >
        <div className="p-2 space-y-3">
          <div>{successText || "Saved successfully."}</div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setSuccessOpen(false)}
              className="px-3 py-1 rounded-md border border-secondary/40 hover:bg-secondary/20"
            >
              Close
            </button>
            <button
              onClick={() => nav("/dashboard/events")}
              className="px-3 py-1 rounded-md border border-secondary/40 hover:bg-secondary/20 bg-primary text-contrast"
            >
              Back to Events
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
