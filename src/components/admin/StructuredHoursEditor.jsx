import { FaRegSun, FaMoon } from "react-icons/fa6";
function to12h(hhmm) {
  if (!hhmm) return "";
  const [hStr, mStr] = hhmm.split(":");
  let h = Number(hStr);
  const m = Number(mStr || 0);
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12;
  if (h === 0) h = 12;
  const mm = String(m).padStart(2, "0");
  return `${h}:${mm}${ampm}`;
}

function from12h(str) {
  // Best-effort parse of strings like "5:00pm", "5pm", "17:00"
  if (!str) return "";
  const s = String(str).trim().toLowerCase();
  // If already HH:MM
  if (/^\d{1,2}:\d{2}$/.test(s)) return s.length === 4 ? `0${s}` : s;
  const match = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return "";
  let h = Number(match[1]);
  const m = Number(match[2] || 0);
  const ap = match[3];
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm}`;
}

function TimeRangePicker({ label, value, onChange }) {
  // value is a string like "5:00pm - 9:30pm" or "closed"
  const isClosed =
    String(value || "")
      .trim()
      .toLowerCase() === "closed";
  const [startStr, endStr] = isClosed
    ? ["", ""]
    : String(value || "")
        .split("-")
        .map((s) => s.trim());
  const start = from12h(startStr);
  const end = from12h(endStr);

  function setRange(s, e) {
    if (!s && !e) onChange("");
    else onChange(`${to12h(s)} - ${to12h(e)}`);
  }

  return (
    <div className="flex flex-col gap-1">
      {label && <div className="text-xs text-muted">{label}</div>}
      <div className="flex items-center gap-2">
        <input
          type="time"
          value={start}
          onChange={(e) => setRange(e.target.value, end)}
          className="rounded-2xl  p-2 border border-secondary/40  bg-black text-white"
          disabled={isClosed}
        />
        <span className="text-muted">to</span>
        <input
          type="time"
          value={end}
          onChange={(e) => setRange(start, e.target.value)}
          className="rounded-2xl  p-2 border border-secondary/40  bg-black text-white"
          disabled={isClosed}
        />
        <button
          type="button"
          className={`${
            value === "closed" && "bg-primary text-contrast"
          } px-3 py-2  rounded-2xl border transition-colors border-secondary/40 text-sm`}
          onClick={() => onChange("closed")}
          title="Set closed"
        >
          Closed
        </button>
        <button
          type="button"
          className="
            
           px-3 py-2 rounded-2xl border border-secondary/40 text-sm"
          onClick={() => onChange("")}
          title="Clear"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

export default function StructuredHoursEditor({ value, onChange }) {
  const days = [
    ["monday", "Monday"],
    ["tuesday", "Tuesday"],
    ["wednesday", "Wednesday"],
    ["thursday", "Thursday"],
    ["friday", "Friday"],
    ["saturday", "Saturday"],
    ["sunday", "Sunday"],
  ];
  const v = value || {};
  function updateDay(day, patch) {
    const next = { ...v, [day]: { ...(v[day] || {}), ...patch } };
    onChange(next);
  }
  function setClosed(day) {
    updateDay(day, { morning: "closed", evening: "closed" });
  }
  function clearDay(day) {
    const next = { ...v };
    delete next[day];
    onChange(next);
  }
  return (
    <div className=" space-y-3 overflow-x-auto w-full ">
      {days.map(([key, label]) => (
        <div>
          <h1 className="font-medium pb-2">{label}</h1>
          <div key={key} className=" flex justify-between gap-3 ">
            <div className=" flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <p className="text-muted text-xs block">
                  <FaRegSun className="h-4 w-auto" />
                </p>
                <TimeRangePicker
                  label={null}
                  value={v[key]?.morning || ""}
                  onChange={(val) => updateDay(key, { morning: val })}
                />
              </div>
              <div className="flex items-center gap-3">
                <p className="text-muted text-xs block">
                  <FaMoon className="h-4 w-auto" />
                </p>
                <TimeRangePicker
                  label={null}
                  value={v[key]?.evening || ""}
                  onChange={(val) => updateDay(key, { evening: val })}
                />
              </div>
            </div>
            <div className=" flex gap-2 ">
              <button
                type="button"
                onClick={() => setClosed(key)}
                className="px-3 hover:opacity-75 transition-opacity py-2 rounded-2xl border border-secondary/40 text-sm bg-danger text-contrast"
                title="Set closed all day"
              >
                Closed all day
              </button>
              <button
                type="button"
                onClick={() => clearDay(key)}
                className="px-3 hover:opacity-75 transition-opacity py-2 rounded-2xl border border-secondary/40 text-sm"
                title="Clear day"
              >
                Clear day
              </button>
            </div>
          </div>
        </div>
      ))}
      <div className="text-xs text-muted">
        Tip: Leave a day blank to omit it. Accepted values become 'closed' or
        formatted ranges like '5:00pm - 9:30pm'.
      </div>
    </div>
  );
}

export { TimeRangePicker };
