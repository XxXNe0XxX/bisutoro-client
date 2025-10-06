import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  request,
  getStoredToken,
} from "../../lib/api";
import imageCompression from "browser-image-compression";
import Modal from "../../components/ui/Modal";
import ClipLoader from "react-spinners/ClipLoader";

function toLocalInputValue(s) {
  if (!s) return "";
  try {
    // If string lacks 'T', replace first space with 'T' to help Date parse consistently
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
    <form
      onSubmit={submit}
      className="space-y-3 max-h-[80dvh] overflow-y-auto overflow-x-hidden"
    >
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
          className="px-3 py-1 rounded-md border border-secondary/40 hover:bg-secondary/20 disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

export default function DashboardEvents() {
  const qc = useQueryClient();
  const eventsQ = useQuery({
    queryKey: ["events-all"],
    queryFn: listAllEvents,
  });

  const createMut = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events-all"] });
    },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, patch }) => updateEvent(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events-all"] }),
  });
  const deleteMut = useMutation({
    mutationFn: (id) => deleteEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events-all"] }),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(ev) {
    setEditing(ev);
    setOpen(true);
  }

  function handleSubmit(data) {
    if (editing) {
      updateMut.mutate({ id: editing.id, patch: data });
    } else {
      createMut.mutate(data);
    }
    setOpen(false);
  }

  return (
    <div className="p-3 space-y-3 text-base-fg">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Events</h1>
        <button
          onClick={openCreate}
          className="px-3 py-1 rounded-md border border-secondary/40 hover:bg-secondary/20 bg-primary text-contrast"
        >
          New Event
        </button>
      </div>
      {eventsQ.isLoading && <div className="text-muted">Loading…</div>}
      {eventsQ.isError && (
        <div className="text-danger">
          Failed to load: {String(eventsQ.error?.message || "")}
        </div>
      )}
      {Array.isArray(eventsQ.data) && eventsQ.data.length === 0 && (
        <div className="text-muted">No events yet.</div>
      )}
      <ul className="space-y-2">
        {(eventsQ.data || []).map((ev) => (
          <li
            key={ev.id}
            className="rounded-md border border-secondary/40 bg-background p-3 flex flex-wrap gap-3 items-center overflow-hidden"
          >
            {ev.image_url ? (
              <img
                src={ev.image_url}
                alt=""
                className="w-auto h-auto md:max-h-64 sm:max-h-32 object-cover rounded"
              />
            ) : (
              <div className="w-20 h-16 bg-secondary/20 rounded" />
            )}
            <div className="flex-1 ">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{ev.title}</h3>
                {ev.is_active ? (
                  <span className="text-xs px-2 py-0.5 rounded bg-success text-base-fg">
                    Active
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded bg-secondary/30">
                    Inactive
                  </span>
                )}
              </div>
              <div className="text-xs text-muted truncate">
                {new Date(ev.starts_at).toLocaleString().slice(0, 9)} →{" "}
                {new Date(ev.ends_at).toLocaleString().slice(0, 9)}
              </div>
              <div className="text-sm line-clamp-2">{ev.description}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openEdit(ev)}
                className="px-3 py-1 rounded-md border border-secondary/40 hover:bg-secondary/20 bg-secondary text-contrast"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm("Delete this event?")) deleteMut.mutate(ev.id);
                }}
                className="px-3 py-1 rounded-md border border-secondary/40 hover:bg-secondary/20  bg-danger text-contrast"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit event" : "New event"}
      >
        <EventForm
          initial={editing}
          onSubmit={handleSubmit}
          submitting={createMut.isPending || updateMut.isPending}
        />
      </Modal>
    </div>
  );
}
