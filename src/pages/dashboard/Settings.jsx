import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAppSettings, updateAppSettings } from "../../lib/api";
import StructuredHoursEditor from "../../components/admin/StructuredHoursEditor";
import { Link } from "react-router-dom";

export default function DashboardSettings() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    show_reviews_on_items: false,
    show_today_specials: true,
    show_omakase_section: false,
    show_average_rating_on_items: true,
    // About page fields
    phone_number: "",
    location: "",
    contact_email: "",
    hours_of_operation: "",
    // Structured hours
    hours_of_operation_structured: null, // { monday: {morning, evening}, ... }
    use_structured_hours: true,
    // Social links as friendly list
    social_links_list: [], // [{name, url}]
  });
  const [dirty, setDirty] = useState(false);
  const [socialLinksError, setSocialLinksError] = useState("");
  const [hoursError, setHoursError] = useState("");

  const settingsQ = useQuery({
    queryKey: ["app-settings"],
    queryFn: getAppSettings,
  });

  useEffect(() => {
    if (settingsQ.data) {
      const sl = Array.isArray(settingsQ.data.social_links)
        ? settingsQ.data.social_links
        : settingsQ.data.social_links &&
          typeof settingsQ.data.social_links === "object"
        ? Object.entries(settingsQ.data.social_links).map(([name, url]) => ({
            name,
            url,
          }))
        : [];
      const hrs = settingsQ.data.hours_of_operation_structured || null;
      setForm({
        show_reviews_on_items: !!settingsQ.data.show_reviews_on_items,
        show_today_specials: !!settingsQ.data.show_today_specials,
        show_omakase_section: !!settingsQ.data.show_omakase_section,
        show_average_rating_on_items:
          settingsQ.data.show_average_rating_on_items !== false,
        phone_number: settingsQ.data.phone_number || "",
        location: settingsQ.data.location || "",
        contact_email: settingsQ.data.contact_email || "",
        hours_of_operation: settingsQ.data.hours_of_operation || "",
        hours_of_operation_structured: hrs,
        use_structured_hours: true,
        social_links_list: sl,
      });
      setDirty(false);
      setSocialLinksError("");
      setHoursError("");
    }
  }, [settingsQ.data]);

  const saveMut = useMutation({
    mutationFn: (patch) => updateAppSettings(patch),
    onSuccess: (data) => {
      qc.setQueryData(["app-settings"], data);
      setDirty(false);
    },
  });

  function toggle(key) {
    setForm((f) => {
      const next = { ...f, [key]: !f[key] };
      setDirty(true);
      return next;
    });
  }

  function validateStructuredHours(obj) {
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
      const { morning = "", evening = "" } = v;
      const okSeg = (s) =>
        !s ||
        s.toLowerCase() === "closed" ||
        (typeof s === "string" && s.includes("-"));
      if (!okSeg(morning) || !okSeg(evening)) return false;
    }
    return true;
  }

  function save() {
    const patch = {
      show_reviews_on_items: form.show_reviews_on_items,
      show_today_specials: form.show_today_specials,
      show_omakase_section: form.show_omakase_section,
      show_average_rating_on_items: form.show_average_rating_on_items,
      phone_number: form.phone_number || null,
      location: form.location || null,
      contact_email: form.contact_email || null,
      hours_of_operation: form.hours_of_operation || null,
    };

    // Social links list
    setSocialLinksError("");
    const cleanedLinks = (form.social_links_list || [])
      .map((l) => ({ name: (l.name || "").trim(), url: (l.url || "").trim() }))
      .filter((l) => l.name || l.url);
    // Basic validation
    for (const l of cleanedLinks) {
      if (!l.name || !l.url) {
        setSocialLinksError(
          "Each social link needs both a name and a valid URL"
        );
        return;
      }
      try {
        // URL constructor throws on invalid
        // Normalize to keep original string
        new URL(l.url);
      } catch {
        setSocialLinksError(`Invalid URL: ${l.url}`);
        return;
      }
    }
    patch.social_links = cleanedLinks.length ? cleanedLinks.slice(0, 10) : null;

    // Structured hours
    setHoursError("");
    let structured = null;
    if (form.use_structured_hours) {
      const obj = form.hours_of_operation_structured || {};
      if (!validateStructuredHours(obj)) {
        setHoursError(
          "Hours must be 'closed' or a 'start - end' time (e.g., 12:00pm - 3:00pm)"
        );
        return;
      }
      // Only include days with any value
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
      structured = hasAny ? pruned : null;
    }
    patch.hours_of_operation_structured = structured;
    saveMut.mutate(patch);
  }

  return (
    <section className="p-3 text-base-fg space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <div className="flex items-center gap-2">
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
        <div className="text-muted">Loading settings…</div>
      ) : settingsQ.isError ? (
        <div className="text-danger text-sm">
          {settingsQ.error?.message || "Failed to load settings"}
        </div>
      ) : (
        <div className="rounded-2xl border border-secondary/40 bg-surface p-4 space-y-4 max-w-3xl">
          <SettingRow
            label="Show reviews on item pages"
            description="Display the average rating and reviews summary on each item page."
            checked={!!form.show_reviews_on_items}
            onChange={() => toggle("show_reviews_on_items")}
          />
          <SettingRow
            label="Show average rating badges"
            description="Display average ratings for items on the Menu and Item pages."
            checked={!!form.show_average_rating_on_items}
            onChange={() => toggle("show_average_rating_on_items")}
          />
          <SettingRow
            label="Show Today's Specials section"
            description="Show the Today's Specials highlight on the public Menu page."
            checked={!!form.show_today_specials}
            onChange={() => toggle("show_today_specials")}
          />
          <SettingRow
            label="Show Omakase section"
            description="Enable a dedicated Omakase section on the public Menu page."
            checked={!!form.show_omakase_section}
            onChange={() => toggle("show_omakase_section")}
          />

          <h2 className="text-xl font-semibold py-2 pt-4 underline">
            About page settings
          </h2>
          <SettingInputRow
            label="Phone number"
            placeholder="(555) 123-4567"
            value={form.phone_number}
            onChange={(v) => {
              setForm((f) => ({ ...f, phone_number: v }));
              setDirty(true);
            }}
          />
          <SettingInputRow
            label="Location"
            placeholder="1581 Magazine St, New Orleans, LA 70130"
            value={form.location}
            onChange={(v) => {
              setForm((f) => ({ ...f, location: v }));
              setDirty(true);
            }}
          />
          <SettingInputRow
            label="Contact email"
            type="email"
            placeholder="info@example.com"
            value={form.contact_email}
            onChange={(v) => {
              setForm((f) => ({ ...f, contact_email: v }));
              setDirty(true);
            }}
          />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Hours of operation</div>
                <p className="text-muted text-xs">
                  Open the hours of operation menu for editing the hours
                </p>
              </div>
              <Link
                to="/dashboard/hours"
                className="px-3 py-2 rounded-2xl border bg-secondary text-contrast font-semibold border-secondary/40 text-sm"
              >
                Open
              </Link>
            </div>
            {hoursError && (
              <div className="text-danger text-sm">{hoursError}</div>
            )}
          </div>
          <div className="space-y-2">
            <div className="font-medium">Social links</div>
            <div className="text-sm text-muted">
              Add up to 10 links (e.g., Instagram, Facebook). Each needs a name
              and URL.
            </div>
            {socialLinksError && (
              <div className="text-danger text-sm">{socialLinksError}</div>
            )}
            <SocialLinksEditor
              value={form.social_links_list}
              onChange={(v) => {
                setForm((f) => ({ ...f, social_links_list: v }));
                setDirty(true);
                setSocialLinksError("");
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}

function SettingRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-sm text-muted max-w-prose">{description}</div>
      </div>
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!checked}
          onChange={onChange}
          className="h-5 w-5 accent-primary"
        />
        <span className="text-sm text-muted">{checked ? "On" : "Off"}</span>
      </label>
    </div>
  );
}

function SettingInputRow({
  label,
  description,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="font-medium">{label}</div>
        {description && (
          <div className="text-sm text-muted max-w-prose">{description}</div>
        )}
      </div>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full max-w-lg rounded-2xl p-3 border border-secondary/40 bg-background text-base-fg"
      />
    </div>
  );
}

function SettingTextareaRow({
  label,
  description,
  value,
  onChange,
  placeholder,
  rows = 4,
  error,
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="font-medium">{label}</div>
        {description && (
          <div className="text-sm text-muted max-w-prose">{description}</div>
        )}
        {error && <div className="text-danger text-sm mt-1">{error}</div>}
      </div>
      <textarea
        rows={rows}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full max-w-lg rounded-2xl p-3 border border-secondary/40 bg-background text-base-fg"
      />
    </div>
  );
}

// Note: SocialLinksEditor moved to this file scope earlier; kept here inline as a light editor
function SocialLinksEditor({ value, onChange }) {
  const list = Array.isArray(value) ? value : [];
  function update(idx, patch) {
    const next = list.map((row, i) => (i === idx ? { ...row, ...patch } : row));
    onChange(next);
  }
  function remove(idx) {
    const next = list.filter((_, i) => i !== idx);
    onChange(next);
  }
  function add() {
    if (list.length >= 10) return;
    onChange([...list, { name: "", url: "" }]);
  }
  return (
    <div className="space-y-2 overflow-x-auto">
      {list.map((row, i) => (
        <div
          key={i}
          className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
        >
          <input
            className="w-full sm:w-34 rounded-2xl p-2 border border-secondary/40 bg-background"
            placeholder="Platform (e.g., Instagram)"
            value={row.name}
            onChange={(e) => update(i, { name: e.target.value })}
          />
          <input
            className="flex-1 rounded-2xl p-2 border border-secondary/40 bg-background"
            placeholder="https://example.com/your-page"
            value={row.url}
            onChange={(e) => update(i, { url: e.target.value })}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="px-3 text-contrast py-2 bg-danger rounded-2xl border border-secondary/40 text-sm"
          >
            Remove
          </button>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={add}
          disabled={list.length >= 10}
          className="px-4 py-2 rounded bg-primary text-contrast disabled:opacity-60"
        >
          Add link
        </button>
        <div className="text-xs text-muted">{list.length}/10</div>
      </div>
    </div>
  );
}
