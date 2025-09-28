import { useEffect, useMemo, useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IKContext } from "imagekitio-react";
import imageCompression from "browser-image-compression";
import Modal from "../../components/ui/Modal";
import {
  getMenuItem,
  listCategories,
  updateMenuItem,
  request,
  getStoredToken,
} from "../../lib/api";

const NAME_MAX = 100;
const DESC_MAX = 500;
const PRICE_MIN = 0.01;
const PRICE_MAX = 999.99;

export default function DashboardItemEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const itemQ = useQuery({
    queryKey: ["menu-item", id],
    queryFn: () => getMenuItem(id, { withReviews: false }),
    enabled: !!id,
  });

  const catsQ = useQuery({
    queryKey: ["active-categories"],
    queryFn: listCategories,
  });

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
    url: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [ingredientInput, setIngredientInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [thumbLoading, setThumbLoading] = useState(false);

  useEffect(() => {
    const it = itemQ.data;
    if (!it) return;
    setForm({
      name: it.name || "",
      price: String(it.price ?? ""),
      category: it.category || "",
      description: it.description || "",
      ingredients: Array.isArray(it.ingredients)
        ? it.ingredients
        : String(it.ingredients || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
      is_available: it.is_available == null ? true : !!it.is_available,
      vegan: it.vegan === true || it.vegan === 1 || String(it.vegan) === "1",
      gluten_free:
        it.gluten_free === true ||
        it.gluten_free === 1 ||
        String(it.gluten_free) === "1",
      pieces_per_order:
        Number.isInteger(Number(it.pieces_per_order)) &&
        Number(it.pieces_per_order) > 0
          ? String(it.pieces_per_order)
          : "",
      url: it.url || it.image_url || it.imageUrl || it.image || "",
    });
  }, [itemQ.data]);

  // When URL changes to a non-empty value, show preview spinner until it loads
  useEffect(() => {
    if (form.url) setThumbLoading(true);
    else setThumbLoading(false);
  }, [form.url]);

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

  const updateMut = useMutation({
    mutationFn: (payload) => updateMenuItem(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menu-items"] });
      qc.invalidateQueries({ queryKey: ["menu-item", id] });
    },
  });

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
      url: (() => {
        const raw = String(form.url || "").trim();
        // Send null to clear the image when field is empty.
        return raw ? raw : null;
      })(),
    };
    updateMut.mutate(payload);
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

  const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
  const urlEndpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;
  const configuredAuthEndpoint = import.meta.env.VITE_IMAGEKIT_AUTH_ENDPOINT;
  const enabledUpload = publicKey && urlEndpoint;
  const authenticator = async () => {
    if (!enabledUpload) return null;
    try {
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
    } catch (e) {
      console.error("ImageKit authenticator error", e);
      throw e;
    }
  };

  // Reuse authenticator for direct upload
  const getIKAuth = authenticator;

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
      const baseName = (form.name || "item-image").replace(/\s+/g, "-");
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
      setForm((f) => ({ ...f, url: data?.url || "" }));
    } catch (e) {
      console.error("Image upload failed", e);
      alert(e?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (ev?.target) ev.target.value = "";
    }
  }

  return (
    <div className="p-3 space-y-4 text-base-fg">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Edit item</h1>
        <Link to="/dashboard/items" className="text-primary underline">
          Back to items
        </Link>
      </div>

      {itemQ.isLoading ? (
        <div className="text-muted">Loading item…</div>
      ) : itemQ.isError ? (
        <div className="text-danger text-sm">
          {itemQ.error?.message || "Failed to load item"}
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="grid grid-cols-1 md:grid-cols-6 gap-3"
        >
          <div className="md:col-span-2">
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
            <label className="text-sm text-muted">Pieces</label>
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

          <div className="md:col-span-2">
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
              disabled={catsQ.isLoading || catsQ.isError}
            >
              <option value="">
                {catsQ.isLoading ? "Loading..." : "Select... "}
              </option>
              {(Array.isArray(catsQ.data) ? catsQ.data : []).map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            {submitted && errors.category && (
              <div className="text-danger text-xs mt-1">{errors.category}</div>
            )}
          </div>

          <div className="md:col-span-3">
            <label className="text-sm text-muted">Ingredients</label>
            <div className="flex gap-2 ">
              <input
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                className="flex-1 rounded-2xl md:max-w-44 p-1 px-2 border border-secondary/40 bg-background text-base-fg max-w-full"
                placeholder="Add an ingredient "
              />
              <button
                type="button"
                onClick={addIngredient}
                className="px-3 py-2 rounded bg-secondary text-contrast"
              >
                Add
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

          {/* Image upload (ImageKit) + manual URL fallback */}
          <div className="md:col-span-3">
            <label className="text-sm text-muted">Image (optional)</label>
            <div className="space-y-2">
              <input
                type="url"
                inputMode="url"
                placeholder="Paste an image URL or upload below"
                value={form.url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, url: e.target.value }))
                }
                className="w-full rounded-2xl p-1 px-2 border border-secondary/40 bg-background text-base-fg"
              />
              {/* Uploading spinner */}
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <ClipLoader size={18} color="var(--color-primary, #000)" />
                  <span>Uploading image…</span>
                </div>
              )}
              {enabledUpload ? (
                <>
                  <IKContext publicKey={publicKey} urlEndpoint={urlEndpoint}>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFilePick}
                    />
                  </IKContext>
                  <div className="text-xs text-muted mt-1">
                    Images are compressed (~1.5MB, max 1600px) before uploading
                    to ImageKit.
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted">
                  To enable uploads, set VITE_IMAGEKIT_PUBLIC_KEY and
                  VITE_IMAGEKIT_URL_ENDPOINT.
                </div>
              )}

              {form.url ? (
                <div className="mt-2 flex items-start gap-3">
                  <img
                    src={form.url}
                    alt="Preview"
                    className="h-24 w-24 object-cover rounded-xl border border-secondary/40"
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setThumbLoading(false)}
                    onError={() => setThumbLoading(false)}
                  />
                  {thumbLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <ClipLoader
                        size={18}
                        color="var(--color-primary, #000)"
                      />
                      <span>Loading preview…</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, url: "" }))}
                    className="px-3 py-2 rounded bg-danger text-contrast"
                  >
                    Remove image
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="md:col-span-6">
            <label className="text-sm text-muted">Description</label>
            <textarea
              rows={3}
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

          <div className="md:col-span-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded bg-secondary text-contrast"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                updateMut.isPending || !canSubmit || uploading || thumbLoading
              }
              className="px-4 py-2 rounded bg-primary text-contrast disabled:opacity-30"
            >
              {updateMut.isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      )}
      {/* Success modal */}
      <Modal
        open={updateMut.isSuccess}
        onClose={() => {
          updateMut.reset();
          navigate("/dashboard/items");
        }}
        title="Item updated"
        actions={[
          <button
            key="ok"
            onClick={() => {
              updateMut.reset();
              navigate("/dashboard/items");
            }}
            className="px-3 py-1 rounded bg-primary text-contrast"
          >
            OK
          </button>,
        ]}
      >
        <p className="text-muted">Changes were saved.</p>
      </Modal>
    </div>
  );
}
