/* =========================================================
   IPC Column Registry — static app
   Vanilla JS, hash routing, localStorage
   ========================================================= */

const STORAGE_KEY = "ipc-column-registry-v1";
const THEME_KEY = "ipc-column-registry-theme";
const YEAR_KEY = "ipc-column-registry-year";
const IPC_KEYWORD = "IPC";

const TYPES = [
  {
    code: "A",
    name: "Licospher C18",
    product: "LiChrospher 100 RP-18",
    phase: "C18",
    supplier: "Merck",
    dimensions: { length: 250, diameter: 4.6, particle: 5, pore: 100 }
  },
  {
    code: "B",
    name: "Licospher CN",
    product: "LiChrospher 100 CN",
    phase: "CN",
    supplier: "Merck",
    dimensions: { length: 250, diameter: 4.6, particle: 5, pore: 100 }
  },
  {
    code: "C",
    name: "Bondapack C18",
    product: "µBondapak C18",
    phase: "C18",
    supplier: "Waters",
    dimensions: { length: 300, diameter: 3.9, particle: 10, pore: 125 }
  },
  {
    code: "D",
    name: "Shodex C18",
    product: "Shodex Silica C18M 4E",
    phase: "C18",
    supplier: "Shodex",
    dimensions: { length: 250, diameter: 4.6, particle: 5, pore: 100 }
  },
  {
    code: "E",
    name: "Thermo CN",
    product: "Hypersil CN",
    phase: "CN",
    supplier: "Thermo Scientific",
    dimensions: { length: 250, diameter: 4.6, particle: 5, pore: 120 }
  },
  {
    code: "F",
    name: "Thermo ODS",
    product: "Hypersil ODS",
    phase: "C18",
    supplier: "Thermo Scientific",
    dimensions: { length: 250, diameter: 4.6, particle: 5, pore: 120 }
  },
  {
    code: "G",
    name: "Acclaim 4-Aminophenol",
    product: "Acclaim 120 C18",
    phase: "C18",
    supplier: "Thermo Scientific",
    dimensions: { length: 250, diameter: 4.6, particle: 5, pore: 120 }
  },
  {
    code: "H",
    name: "Phenomenex",
    product: "Luna C18(2)",
    phase: "C18",
    supplier: "Phenomenex",
    dimensions: { length: 250, diameter: 4.6, particle: 5, pore: 100 }
  },
  {
    code: "I",
    name: "Acclaim Mulvit Simultant",
    product: "Acclaim PolarAdvantage II (PA2)",
    phase: "C18 (polar-embedded)",
    supplier: "Thermo Scientific",
    dimensions: { length: 150, diameter: 4.6, particle: 3, pore: 120 }
  },
  {
    code: "J",
    name: "Bondclone",
    product: "Bondclone C18",
    phase: "C18",
    supplier: "Phenomenex",
    dimensions: { length: 300, diameter: 3.9, particle: 10, pore: 148 }
  }
];

const PURPOSES = [
  { id: "apap", label: "APAP" },
  { id: "aspirin", label: "Aspirin" },
  { id: "caffeine", label: "Caffeine" },
  { id: "ibuprofen", label: "Ibuprofen" },
  { id: "flumeth-ppa", label: "Flumeth PPA" },
  { id: "flumeth-pse", label: "Flumeth PSE" },
  { id: "flumeth-pe", label: "Flumeth PE" },
  { id: "mulvit-simultant", label: "Mulvit Simultant" },
  { id: "mulvit-usp", label: "Mulvit USP" },
  { id: "4-aminophenol", label: "4-Aminophenol" },
  { id: "dxm", label: "DXM" },
  { id: "flumeth-new-method", label: "Flumeth New Method" },
  { id: "iodine", label: "Iodine" },
  { id: "folic", label: "Folic" }
].sort((a, b) => a.label.localeCompare(b.label, "en", { sensitivity: "base" }));

const SEED_STOCK = { A: 4, B: 3, C: 3, D: 1, E: 0, F: 5, G: 4, H: 3, I: 0, J: 4 };

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const PAGES = [
  { label: "Overview", sub: "Stats, stock, and latest activations", href: "#/dashboard", icon: "grid" },
  { label: "Usage", sub: "Activation cadence and column service life", href: "#/usage", icon: "trend" },
  { label: "Column types", sub: "Ten column types, A–J", href: "#/types", icon: "layers" },
  { label: "Activations", sub: "All activated columns", href: "#/activations", icon: "activity" },
  { label: "History", sub: "Activations, purpose changes, and status changes", href: "#/history", icon: "history" },
  { label: "Stock", sub: "Physical stock not yet activated", href: "#/stock", icon: "archive" }
];

const ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

let db;
let ui;
let storageWarned = false;

/* =========================================================
   Helpers
   ========================================================= */

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ESC_MAP[char]);
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function unitWord(count, singular, pluralForm = `${singular}s`) {
  return Number(count) === 1 ? singular : pluralForm;
}

function columnStatus(column) {
  return column?.status === "inactive" ? "inactive" : "active";
}

function columnStatusLabel(column) {
  return columnStatus(column) === "active" ? "Active" : "Inactive";
}

function columnStatusBadge(column) {
  const status = columnStatus(column);
  const active = status === "active";
  return `<span class="status status--${status}"><span class="status-dot" aria-hidden="true"></span>${active ? "Active" : "Inactive"}</span>`;
}

function statusValueLabel(value) {
  return value === "inactive" ? "Inactive" : "Active";
}

function daysBetween(startIso, endIso) {
  const start = parseISO(startIso);
  const end = parseISO(endIso);
  if (!start || !end) return null;
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

function average(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function formatDays(value) {
  if (!Number.isFinite(value)) return "—";
  const days = Math.round(value);
  return `${days} ${unitWord(days, "day")}`;
}

function counterHTML(value, decimals = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  const formatted = decimals ? number.toFixed(decimals) : String(Math.round(number));
  return `<span data-countup="${formatted}"${decimals ? ` data-decimals="${decimals}"` : ""}>${formatted}</span>`;
}

function animateCounters() {
  const counters = [...document.querySelectorAll("[data-countup]")];
  if (!counters.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  counters.forEach((element) => {
    const target = Number(element.dataset.countup);
    const decimals = Number(element.dataset.decimals) || 0;
    if (!Number.isFinite(target)) return;

    const format = (value) => decimals ? value.toFixed(decimals) : String(Math.round(value));
    const duration = 550;
    const start = performance.now();
    element.textContent = format(0);

    const frame = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = format(target * eased);
      if (progress < 1) requestAnimationFrame(frame);
      else element.textContent = format(target);
    };

    requestAnimationFrame(frame);
  });
}

function uid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `col-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function icon(name) {
  return `<svg class="icon" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
}

function parseISO(iso) {
  if (!iso || typeof iso !== "string") return null;
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function formatDate(iso) {
  const date = parseISO(iso);
  if (!date || Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatShortDate(iso) {
  const date = parseISO(iso);
  if (!date || Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function currentYear() {
  return new Date().getFullYear();
}

function typeByCode(code) {
  return TYPES.find((type) => type.code === String(code || "").toUpperCase()) || null;
}

function purposeById(id) {
  return PURPOSES.find((purpose) => purpose.id === id) || null;
}

function purposeLabel(id) {
  return purposeById(id)?.label || String(id || "—");
}

function columnCode(column) {
  return `${column.type}-${pad2(column.seq)}/${IPC_KEYWORD}/${String(column.year).slice(-2)}`;
}

function findColumn(id) {
  return db.columns.find((column) => column.id === id) || null;
}

function stockStatus(stock) {
  if (stock <= 0) return { key: "out", label: "Out" };
  if (stock <= 2) return { key: "low", label: "Low" };
  return { key: "ok", label: "Available" };
}

function totalStock() {
  return TYPES.reduce((sum, type) => sum + (db.stock[type.code] || 0), 0);
}

function columnsForYear(year = ui.year) {
  return db.columns.filter((column) => column.year === year);
}

function columnsForType(typeCode, year = null) {
  return db.columns
    .filter((column) => column.type === typeCode && (year === null || column.year === year))
    .sort((a, b) => b.seq - a.seq);
}

function latestActivationForType(typeCode, year = null) {
  const columns = columnsForType(typeCode, year);
  if (!columns.length) return "";
  return columns
    .map((column) => column.activatedAt)
    .sort()
    .at(-1);
}

function typeDimensions(type) {
  const dimensions = type?.dimensions;
  if (!dimensions) return "—";
  return `${dimensions.length} × ${dimensions.diameter} mm · ${dimensions.particle} µm · ${dimensions.pore} Å`;
}

function typeDimensionsShort(type) {
  const dimensions = type?.dimensions;
  return dimensions ? `${dimensions.length} × ${dimensions.diameter} mm` : "—";
}

function typeDimensionsLines(type) {
  const dimensions = type?.dimensions;
  if (!dimensions) return "—";
  return `${dimensions.length} × ${dimensions.diameter} mm<br>${dimensions.particle} µm · ${dimensions.pore} Å`;
}

function addDaysISO(iso, days) {
  const date = parseISO(iso);
  if (!date || !Number.isFinite(days)) return "";
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatMonthYear(iso) {
  const date = parseISO(iso);
  if (!date || Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function formatSavedAt(iso) {
  const date = new Date(iso);
  if (!iso || Number.isNaN(date.getTime())) return "Not saved yet";
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const sameDay = date.toDateString() === new Date().toDateString();
  if (sameDay) return `Today ${time}`;
  return `${date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} ${time}`;
}

function formatDaysShort(value) {
  if (!Number.isFinite(value)) return "—";
  return `${Math.round(value)} d`;
}

function monthsElapsedForYear(year) {
  const now = new Date();
  if (year === now.getFullYear()) return Math.max(1, now.getMonth() + 1);
  if (year < now.getFullYear()) return 12;
  return 1;
}

function monthlyCountsForYear(year = ui.year) {
  const counts = Array.from({ length: 12 }, () => 0);
  columnsForYear(year).forEach((column) => {
    const date = parseISO(column.activatedAt);
    if (date) counts[date.getMonth()] += 1;
  });
  return counts;
}

function burnRateForType(typeCode, year = currentYear()) {
  const count = columnsForType(typeCode, year).length;
  return count / monthsElapsedForYear(year);
}

function stockCoverForType(typeCode, year = currentYear()) {
  const stock = db.stock[typeCode] || 0;
  const burn = burnRateForType(typeCode, year);

  if (stock <= 0) {
    return { months: 0, burn, projected: "", state: "out" };
  }
  if (!burn) {
    return { months: null, burn, projected: "", state: "idle" };
  }

  const months = stock / burn;
  const projected = addDaysISO(todayISO(), Math.round(months * 30.44));
  return {
    months,
    burn,
    projected,
    state: months < 2 ? "low" : months < 4 ? "watch" : "ok"
  };
}

function formatCover(cover) {
  if (!cover) return "—";
  if (cover.state === "out") return "Out";
  if (cover.months === null) return "—";
  if (cover.months >= 24) return "24+ mo";
  if (cover.months < 1) return "<1 mo";
  return `${cover.months.toFixed(1)} mo`;
}

function lastStockAdjustment(typeCode) {
  return [...(db.stockMovements || [])]
    .filter((movement) => movement.type === typeCode)
    .sort((a, b) => {
      const byDate = String(b.at).localeCompare(String(a.at));
      if (byDate !== 0) return byDate;
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    })[0] || null;
}

function serviceDays(column) {
  const end = columnStatus(column) === "inactive"
    ? (column.statusChangedAt || todayISO())
    : todayISO();
  if (!column.activatedAt || end < column.activatedAt) return 0;
  const days = daysBetween(column.activatedAt, end);
  return Number.isFinite(days) ? Math.max(0, Math.round(days)) : 0;
}

function inactiveLifeDays(column) {
  if (columnStatus(column) !== "inactive") return null;
  const days = daysBetween(column.activatedAt, column.statusChangedAt || column.activatedAt);
  return Number.isFinite(days) ? Math.max(0, Math.round(days)) : null;
}

function globalLifeBaseline() {
  const values = db.columns
    .map(inactiveLifeDays)
    .filter((days) => Number.isFinite(days) && days > 0);
  return {
    days: values.length >= 2 ? Math.round(average(values)) : null,
    sample: values.length
  };
}

function expectedLifeForType(typeCode) {
  const typeValues = db.columns
    .filter((column) => column.type === typeCode)
    .map(inactiveLifeDays)
    .filter((days) => Number.isFinite(days) && days > 0);

  if (typeValues.length >= 2) {
    return {
      days: Math.round(average(typeValues)),
      sample: typeValues.length,
      source: "type"
    };
  }

  const baseline = globalLifeBaseline();
  if (baseline.days !== null) {
    return {
      days: baseline.days,
      sample: baseline.sample,
      source: "all"
    };
  }

  return { days: null, sample: baseline.sample, source: "none" };
}

function lifecycleFor(column) {
  const expected = expectedLifeForType(column.type);
  const days = serviceDays(column);

  if (columnStatus(column) === "inactive") {
    return { days, expected, remaining: null, state: "retired" };
  }
  if (expected.days === null) {
    return { days, expected, remaining: null, state: "unknown" };
  }

  const remaining = expected.days - days;
  const ratio = days / expected.days;
  return {
    days,
    expected,
    remaining,
    state: remaining <= 0 ? "due" : ratio >= 0.85 ? "soon" : "ok"
  };
}

function lifeBadge(life) {
  if (life.state === "due") return `<span class="status status--out">${icon("alert")}Due</span>`;
  if (life.state === "soon") return `<span class="status status--low">${icon("alert")}Soon</span>`;
  if (life.state === "retired") return `<span class="status status--inactive">${icon("archive")}Retired</span>`;
  if (life.state === "unknown") return `<span class="status status--inactive">No estimate</span>`;
  return `<span class="status status--ok">${icon("check")}On track</span>`;
}

function lifeRemainingText(life) {
  if (life.state === "retired") return `${formatDaysShort(life.days)} life`;
  if (life.state === "unknown" || !Number.isFinite(life.remaining)) return "—";
  if (life.state === "due") return `${formatDaysShort(Math.abs(life.remaining))} over`;
  return `${formatDaysShort(life.remaining)} left`;
}

function expectedLifeLabel(typeCode) {
  const expected = expectedLifeForType(typeCode);
  if (!expected.days) return "—";
  return `~${expected.days} d`;
}

function activeLifeWarnings(year = ui.year) {
  return db.columns
    .filter((column) => column.year === year && columnStatus(column) === "active")
    .map((column) => ({ column, life: lifecycleFor(column) }))
    .filter((item) => item.life.state === "due" || item.life.state === "soon")
    .sort((a, b) => (a.life.remaining ?? Infinity) - (b.life.remaining ?? Infinity));
}

function niceChartMax(value) {
  return Math.max(4, Math.ceil(Math.max(1, value) / 4) * 4);
}

function nextSequence(typeCode, year) {
  const max = db.columns
    .filter((column) => column.type === typeCode && column.year === year)
    .reduce((highest, column) => Math.max(highest, column.seq), 0);
  return max + 1;
}

function nextCode(typeCode, year) {
  return `${typeCode}-${pad2(nextSequence(typeCode, year))}/${IPC_KEYWORD}/${String(year).slice(-2)}`;
}

function uniquePurposeCount(columns) {
  return new Set(columns.map((column) => column.purpose)).size;
}

function allHistoryEvents(year = null) {
  const events = [];
  for (const column of db.columns) {
    column.history.forEach((event, index) => {
      if (year !== null && Number(event.at.slice(0, 4)) !== year) return;
      events.push({
        ...event,
        column,
        eventKey: `${column.id}-${index}`
      });
    });
  }
  return events.sort((a, b) => {
    const byDate = String(b.at).localeCompare(String(a.at));
    if (byDate !== 0) return byDate;
    return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  });
}

function activationNote(column) {
  const activation = column.history.find((event) => event.kind === "activation");
  return activation?.note || "";
}

function getYears() {
  const years = new Set([currentYear(), ui?.year || currentYear()]);
  db.columns.forEach((column) => years.add(column.year));
  return [...years].filter((year) => Number.isFinite(year)).sort((a, b) => b - a);
}

function saveDb() {
  db.updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (error) {
    if (!storageWarned) {
      storageWarned = true;
      showToast("Browser storage is unavailable. Data will only last for this session.", "error");
    }
  }
  updateSaveStatus();
}

function updateSaveStatus() {
  document.querySelectorAll("[data-save-status]").forEach((element) => {
    element.textContent = formatSavedAt(db?.updatedAt);
  });
}

function saveYear() {
  try {
    localStorage.setItem(YEAR_KEY, String(ui.year));
  } catch (error) {
    // Year is a preference; failing to persist it is harmless.
  }
}

/* =========================================================
   Seed data
   ========================================================= */

function makeSeedColumn(type, seq, year, activatedAt, purpose, changes = [], activationNote = "") {
  let currentPurpose = purpose;
  const history = [
    {
      kind: "activation",
      at: activatedAt,
      purpose,
      note: activationNote,
      createdAt: `${activatedAt}T08:00:00.000Z`
    }
  ];

  changes.forEach((change, index) => {
    history.push({
      kind: "change",
      at: change.at,
      from: currentPurpose,
      to: change.to,
      note: change.note || "",
      createdAt: `${change.at}T${pad2(10 + index)}:00:00.000Z`
    });
    currentPurpose = change.to;
  });

  return {
    id: `seed-${type}-${year}-${pad2(seq)}`,
    type,
    seq,
    year,
    activatedAt,
    purpose: currentPurpose,
    purposeSince: history.at(-1).at,
    status: "active",
    statusChangedAt: activatedAt,
    createdAt: `${activatedAt}T08:00:00.000Z`,
    history
  };
}

function seedDb() {
  const columns = [
    // 2026 — current cycle
    makeSeedColumn("A", 1, 2026, "2026-01-06", "apap"),
    makeSeedColumn("B", 1, 2026, "2026-01-13", "flumeth-ppa"),
    makeSeedColumn("C", 1, 2026, "2026-01-21", "ibuprofen"),
    makeSeedColumn("D", 1, 2026, "2026-02-02", "mulvit-simultant", [
      { at: "2026-06-01", to: "mulvit-usp", note: "USP method validation" }
    ]),
    makeSeedColumn("A", 2, 2026, "2026-02-18", "aspirin"),
    makeSeedColumn("E", 1, 2026, "2026-02-26", "4-aminophenol"),
    makeSeedColumn("B", 2, 2026, "2026-03-04", "flumeth-pse", [
      { at: "2026-07-15", to: "flumeth-new-method", note: "Migrated to the new method" }
    ]),
    makeSeedColumn("F", 1, 2026, "2026-03-12", "iodine", [
      { at: "2026-09-20", to: "folic", note: "Analyst request" }
    ]),
    makeSeedColumn("G", 1, 2026, "2026-04-01", "4-aminophenol"),
    makeSeedColumn("C", 2, 2026, "2026-04-09", "dxm"),
    makeSeedColumn("H", 1, 2026, "2026-04-22", "apap", [
      { at: "2026-10-06", to: "dxm", note: "Routine method rotation" }
    ]),
    makeSeedColumn("I", 1, 2026, "2026-05-06", "mulvit-simultant"),
    makeSeedColumn("A", 3, 2026, "2026-05-11", "caffeine"),
    makeSeedColumn("J", 1, 2026, "2026-05-27", "caffeine"),
    makeSeedColumn("D", 2, 2026, "2026-06-17", "mulvit-usp"),
    makeSeedColumn("E", 2, 2026, "2026-07-08", "folic"),
    makeSeedColumn("F", 2, 2026, "2026-08-19", "flumeth-new-method"),
    makeSeedColumn("H", 2, 2026, "2026-09-03", "aspirin"),
    makeSeedColumn("J", 2, 2026, "2026-10-14", "ibuprofen"),
    makeSeedColumn("C", 3, 2026, "2026-11-05", "flumeth-pe"),
    makeSeedColumn("F", 3, 2026, "2026-11-18", "caffeine"),

    // 2025 — previous cycle, showing the yearly reset
    makeSeedColumn("A", 1, 2025, "2025-02-11", "apap"),
    makeSeedColumn("B", 1, 2025, "2025-03-19", "flumeth-ppa"),
    makeSeedColumn("C", 1, 2025, "2025-05-07", "ibuprofen"),
    makeSeedColumn("D", 1, 2025, "2025-08-14", "mulvit-usp"),
    makeSeedColumn("F", 1, 2025, "2025-10-02", "iodine")
  ];

  const inactiveSeed = [
    ["A", 2025, 1, "2025-12-31", "Retired at year end"],
    ["B", 2025, 1, "2025-12-31", "Retired at year end"],
    ["C", 2025, 1, "2025-12-31", "Retired at year end"],
    ["D", 2025, 1, "2025-12-31", "Retired at year end"],
    ["F", 2025, 1, "2025-12-31", "Retired at year end"],
    ["A", 2026, 1, "2026-09-30", "Performance degraded"],
    ["C", 2026, 1, "2026-06-30", "Peak shape degraded"],
    ["D", 2026, 1, "2026-08-31", "Backpressure"]
  ];

  for (const [type, year, seq, statusChangedAt, note] of inactiveSeed) {
    const column = columns.find((item) => item.type === type && item.year === year && item.seq === seq);
    if (!column) continue;
    column.status = "inactive";
    column.statusChangedAt = statusChangedAt;
    column.history.push({
      kind: "status",
      at: statusChangedAt,
      from: "active",
      to: "inactive",
      note,
      createdAt: `${statusChangedAt}T12:00:00.000Z`
    });
  }

  const stockMovements = [
    {
      id: "seed-stock-d",
      at: "2026-10-28",
      type: "D",
      delta: -1,
      before: 2,
      after: 1,
      note: "Borrowed by another division",
      createdAt: "2026-10-28T09:00:00.000Z"
    },
    {
      id: "seed-stock-f",
      at: "2026-11-12",
      type: "F",
      delta: 1,
      before: 4,
      after: 5,
      note: "New shipment from supplier",
      createdAt: "2026-11-12T09:00:00.000Z"
    },
    {
      id: "seed-stock-b",
      at: "2026-11-19",
      type: "B",
      delta: 1,
      before: 2,
      after: 3,
      note: "Restock from supplier",
      createdAt: "2026-11-19T09:00:00.000Z"
    }
  ];

  return {
    version: 1,
    stock: { ...SEED_STOCK },
    stockMovements,
    columns,
    updatedAt: new Date().toISOString()
  };
}

function loadDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        parsed.version === 1 &&
        parsed.stock &&
        typeof parsed.stock === "object" &&
        Array.isArray(parsed.columns)
      ) {
        if (!Array.isArray(parsed.stockMovements)) parsed.stockMovements = [];
        if (!parsed.updatedAt) parsed.updatedAt = new Date().toISOString();
        parsed.columns.forEach((column) => {
          if (column.status !== "active" && column.status !== "inactive") column.status = "active";
          if (!column.statusChangedAt) column.statusChangedAt = column.activatedAt;
          if (!Array.isArray(column.history)) column.history = [];
        });
        return parsed;
      }
    }
  } catch (error) {
    // Corrupt storage falls back to a clean demo dataset.
  }

  const seeded = seedDb();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  } catch (error) {
    // Storage may be unavailable; the app still runs in memory.
  }
  return seeded;
}

function loadYear() {
  try {
    const stored = Number(localStorage.getItem(YEAR_KEY));
    if (Number.isFinite(stored) && stored >= 2000 && stored <= 2100) return stored;
  } catch (error) {
    // Use the current year.
  }
  return currentYear();
}

/* =========================================================
   Theme and chrome
   ========================================================= */

function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", nextTheme === "dark" ? "#09090b" : "#f7f7f8");

  const toggle = document.querySelector('[data-action="toggle-theme"]');
  if (toggle) {
    toggle.setAttribute("aria-pressed", String(nextTheme === "dark"));
    const text = toggle.querySelector(".theme-toggle-text");
    if (text) text.textContent = nextTheme === "dark" ? "Light mode" : "Dark mode";
  }

  try {
    localStorage.setItem(THEME_KEY, nextTheme);
  } catch (error) {
    // Theme is a preference; ignore storage failures.
  }
}

function loadTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch (error) {
    // Default to light.
  }
  return "light";
}

function updateChrome() {
  const route = ui.route;
  const navKey = route.name === "type" ? "types" : route.name;
  const yearActivations = columnsForYear();
  const stockTotal = totalStock();

  document.querySelectorAll("[data-nav]").forEach((link) => {
    const isActive = link.dataset.nav === navKey;
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  const activationBadge = document.getElementById("navActivationCount");
  if (activationBadge) {
    activationBadge.textContent = String(yearActivations.length);
    activationBadge.hidden = yearActivations.length === 0;
  }

  const stockBadge = document.getElementById("navStockCount");
  if (stockBadge) stockBadge.textContent = String(stockTotal);

  const outCount = TYPES.filter((type) => (db.stock[type.code] || 0) === 0).length;
  const dueCount = activeLifeWarnings(ui.year).filter((item) => item.life.state === "due").length;
  const sideOut = document.getElementById("sideOut");
  const sideDue = document.getElementById("sideDue");
  const sideActive = document.getElementById("sideActive");
  if (sideOut) {
    sideOut.textContent = String(outCount);
    sideOut.classList.toggle("is-bad", outCount > 0);
  }
  if (sideDue) {
    sideDue.textContent = String(dueCount);
    sideDue.classList.toggle("is-bad", dueCount > 0);
  }
  if (sideActive) sideActive.textContent = String(yearActivations.filter((column) => columnStatus(column) === "active").length);

  const yearSelect = document.getElementById("yearSelect");
  if (yearSelect) {
    const options = getYears()
      .map((year) => `<option value="${year}"${year === ui.year ? " selected" : ""}>${year}</option>`)
      .join("");
    if (yearSelect.innerHTML !== options) yearSelect.innerHTML = options;
    yearSelect.value = String(ui.year);
  }

  const crumbs = document.getElementById("crumbs");
  if (crumbs) crumbs.innerHTML = crumbsHTML(route);

  const menuButton = document.querySelector('[data-action="open-sidebar"]');
  if (menuButton) menuButton.setAttribute("aria-expanded", String(document.body.classList.contains("sidebar-open")));

  document.title = documentTitle(route);
}

function crumbsHTML(route) {
  const items = [`<a href="#/dashboard">Registry</a>`];

  if (route.name === "dashboard") {
    items.push(icon("chevron-right"), "<span>Overview</span>");
  } else if (route.name === "usage") {
    items.push(icon("chevron-right"), "<span>Usage</span>");
  } else if (route.name === "types") {
    items.push(icon("chevron-right"), "<span>Column types</span>");
  } else if (route.name === "type") {
    items.push(
      icon("chevron-right"),
      `<a href="#/types">Column types</a>`,
      icon("chevron-right"),
      `<span>${esc(typeByCode(route.code)?.name || route.code || "Column type")}</span>`
    );
  } else if (route.name === "activations") {
    items.push(icon("chevron-right"), "<span>Activations</span>");
  } else if (route.name === "history") {
    items.push(icon("chevron-right"), "<span>History</span>");
  } else if (route.name === "stock") {
    items.push(icon("chevron-right"), "<span>Stock</span>");
  } else {
    items.push(icon("chevron-right"), "<span>Not found</span>");
  }

  return items.join("");
}

function documentTitle(route) {
  const suffix = "IPC Column Registry";
  if (route.name === "dashboard") return `Overview — ${suffix}`;
  if (route.name === "usage") return `Usage — ${suffix}`;
  if (route.name === "types") return `Column types — ${suffix}`;
  if (route.name === "type") {
    const type = typeByCode(route.code);
    return `${type?.name || "Column type"} — ${suffix}`;
  }
  if (route.name === "activations") return `Activations — ${suffix}`;
  if (route.name === "history") return `History — ${suffix}`;
  if (route.name === "stock") return `Stock — ${suffix}`;
  return `Not found — ${suffix}`;
}

/* =========================================================
   Routing
   ========================================================= */

function getRoute() {
  const raw = location.hash.replace(/^#\/?/, "");
  const path = raw.split("?")[0];
  const parts = path.split("/").filter(Boolean);

  if (!parts.length || parts[0] === "dashboard") return { name: "dashboard" };
  if (parts[0] === "types") {
    if (parts[1]) {
      const code = parts[1].toUpperCase();
      return typeByCode(code) ? { name: "type", code } : { name: "notfound" };
    }
    return { name: "types" };
  }
  if (parts[0] === "usage") return { name: "usage" };
  if (parts[0] === "activations") return { name: "activations" };
  if (parts[0] === "history") return { name: "history" };
  if (parts[0] === "stock") return { name: "stock" };
  return { name: "notfound" };
}

function navigate(path, force = false) {
  const target = `#/${String(path).replace(/^#?\/?/, "")}`;
  if (location.hash === target) {
    if (force) render();
    return;
  }
  location.hash = target;
}

function render() {
  ui.route = getRoute();
  updateChrome();

  const main = document.getElementById("main");
  if (!main) return;

  let view = "";
  if (ui.route.name === "dashboard") view = renderDashboard();
  else if (ui.route.name === "usage") view = renderUsage();
  else if (ui.route.name === "types") view = renderTypes();
  else if (ui.route.name === "type") view = renderTypeDetail(ui.route.code);
  else if (ui.route.name === "activations") view = renderActivations();
  else if (ui.route.name === "history") view = renderHistory();
  else if (ui.route.name === "stock") view = renderStock();
  else view = renderNotFound();

  main.innerHTML = view;

  document.querySelectorAll("[data-filter-scope]").forEach((scope) => applyFilters(scope));
  document.querySelectorAll("[data-sort-scope]").forEach((scope) => applySort(scope));
  animateCounters();
  updateSaveStatus();

  if (ui.pendingScroll && ui.stockFocus) {
    const row = document.querySelector(`.stock-row.is-focus`);
    if (row) {
      requestAnimationFrame(() => row.scrollIntoView({ block: "center", behavior: "smooth" }));
    }
  }
  ui.pendingScroll = false;
  ui.hasRendered = true;
}

/* =========================================================
   Shared view pieces
   ========================================================= */

function pageHead(eyebrow, title, subtitle, actions = "") {
  return `
    <div class="page-head">
      <div>
        <p class="eyebrow">${eyebrow}</p>
        <h1>${title}</h1>
        <p class="page-sub">${subtitle}</p>
      </div>
      ${actions ? `<div class="page-actions">${actions}</div>` : ""}
    </div>
  `;
}

function viewIntro(eyebrow, lede, chips = []) {
  const chipMarkup = chips.filter(Boolean).join("");
  return `
    <div class="view-intro">
      <p class="eyebrow">${eyebrow}</p>
      <p class="view-lede">${lede}</p>
      ${chipMarkup ? `<div class="view-chips">${chipMarkup}</div>` : ""}
    </div>
  `;
}

function contextChip(label, value, tone = "") {
  return `
    <span class="context-chip${tone ? ` context-chip--${tone}` : ""}">
      <span>${label}</span>
      <strong>${value}</strong>
    </span>
  `;
}

function historyEventSummary(event) {
  if (event.kind === "status") {
    return `Status ${statusValueLabel(event.from)} → ${statusValueLabel(event.to)}`;
  }
  if (event.kind === "change") {
    return `${purposeLabel(event.from)} → ${purposeLabel(event.to)}`;
  }
  return `Activated · ${purposeLabel(event.purpose)}`;
}

function statusLabel(stock) {
  const status = stockStatus(stock);
  const iconName = status.key === "ok" ? "check" : status.key === "low" ? "alert" : "close";
  return `<span class="status status--${status.key}">${icon(iconName)}${status.label}</span>`;
}

function typeCard(type) {
  const stock = db.stock[type.code] || 0;
  const status = stockStatus(stock);
  const typeYearColumns = columnsForType(type.code, ui.year);
  const activations = typeYearColumns.length;
  const activeCount = typeYearColumns.filter((column) => columnStatus(column) === "active").length;
  const last = latestActivationForType(type.code, ui.year);
  const cover = stockCoverForType(type.code);
  const expected = expectedLifeForType(type.code);
  const search = `${type.code} ${type.name} ${type.product} ${type.phase} ${typeDimensions(type)} ${status.label} ${activations} ${last}`;

  return `
    <a class="type-card"
       href="#/types/${type.code}"
       data-filter-row
       data-type="${type.code}"
       data-stock="${status.key}"
       data-stock-count="${stock}"
       data-activations="${activations}"
       data-cover="${cover.state === "out" ? 0 : cover.months ?? 999}"
       data-search="${esc(search)}">
      <div class="type-card-top">
        <span class="type-code">${type.code}</span>
        ${statusLabel(stock)}
      </div>

      <h3 class="type-name">${esc(type.name)}</h3>
      <p class="type-product">${esc(type.product)} · ${esc(type.phase)}</p>
      <p class="type-dims">${esc(typeDimensions(type))}</p>

      <div class="type-metrics">
        <div class="type-metric type-metric--stock">
          <span class="type-metric-value">${pad2(stock)}</span>
          <span class="type-metric-label">in stock</span>
        </div>
        <div class="type-metric">
          <span class="type-metric-value">${activeCount}<span class="type-metric-of">/${activations}</span></span>
          <span class="type-metric-label">active ${ui.year}</span>
        </div>
        <div class="type-metric">
          <span class="type-metric-value">${expected.days ? `~${expected.days}` : "—"}</span>
          <span class="type-metric-label">days est. life</span>
        </div>
      </div>

      <div class="type-card-foot">
        <span>${last ? `Last ${formatDate(last)}` : "No activations yet"}</span>
        <span class="type-cover">${formatCover(cover)} cover</span>
        ${icon("chevron-right")}
      </div>
    </a>
  `;
}

function purposeList(columns) {
  const counts = new Map();
  columns.forEach((column) => {
    counts.set(column.purpose, (counts.get(column.purpose) || 0) + 1);
  });
  const rows = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || purposeLabel(a[0]).localeCompare(purposeLabel(b[0])))
    .slice(0, 5);

  if (!rows.length) {
    return `<p class="section-note">No active purposes recorded for this year.</p>`;
  }

  const max = rows[0][1] || 1;
  return `
    <div class="purpose-list">
      ${rows.map(([purpose, count]) => `
        <div class="purpose-row">
          <span class="purpose-name">${esc(purposeLabel(purpose))}</span>
          <span class="purpose-count">${count}</span>
          <span class="purpose-track"><span class="purpose-fill" style="width:${Math.max(6, Math.round((count / max) * 100))}%"></span></span>
        </div>
      `).join("")}
    </div>
  `;
}

function emptyState(iconName, title, message, action = "") {
  return `
    <div class="empty-state">
      <span class="empty-icon">${icon(iconName)}</span>
      <h3>${title}</h3>
      <p>${message}</p>
      ${action}
    </div>
  `;
}

/* =========================================================
   Dashboard
   ========================================================= */

function renderDashboard() {
  const columns = columnsForYear();
  const activeColumns = columns.filter((column) => columnStatus(column) === "active");
  const inactiveCount = columns.length - activeColumns.length;
  const stockTotal = totalStock();
  const outTypes = TYPES.filter((type) => (db.stock[type.code] || 0) === 0);
  const lowTypes = TYPES.filter((type) => {
    const stock = db.stock[type.code] || 0;
    return stock > 0 && stock <= 2;
  });
  const warnings = activeLifeWarnings(ui.year);
  const due = warnings.filter((item) => item.life.state === "due");
  const soon = warnings.filter((item) => item.life.state === "soon");
  const purposeCount = uniquePurposeCount(activeColumns);

  const monthlyCounts = monthlyCountsForYear();
  const totalActivations = monthlyCounts.reduce((sum, count) => sum + count, 0);
  const averagePerMonth = totalActivations / 12;
  const peakCount = Math.max(...monthlyCounts);
  const peakIndex = monthlyCounts.indexOf(peakCount);
  const chartMax = niceChartMax(peakCount);
  const chartBars = monthlyCounts.map((count, index) => `
    <div class="chart-col${index === new Date().getMonth() && ui.year === currentYear() ? " is-current" : ""}" title="${MONTHS_SHORT[index]}: ${count} ${unitWord(count, "activation")}">
      <span class="chart-value">${count || ""}</span>
      <span class="chart-bar-wrap"><span class="chart-bar" style="height:${Math.max(count ? 5 : 1, Math.round((count / chartMax) * 100))}%;--i:${index}"></span></span>
    </div>
  `).join("");
  const yLabels = [1, 0.75, 0.5, 0.25, 0].map((ratio) => `<span>${Math.round(chartMax * ratio)}</span>`).join("");
  const monthlySummary = monthlyCounts.map((count, index) => `${MONTHS_SHORT[index]} ${count}`).join(", ");

  const now = new Date();
  const isCurrentYear = ui.year === currentYear();
  const thisMonth = isCurrentYear ? monthlyCounts[now.getMonth()] : 0;
  const previousMonthIndex = now.getMonth() - 1;
  const previousMonth = isCurrentYear && previousMonthIndex >= 0 ? monthlyCounts[previousMonthIndex] : null;
  const monthDelta = previousMonth === null ? null : thisMonth - previousMonth;

  const runway = TYPES.map((type) => ({
    type,
    stock: db.stock[type.code] || 0,
    cover: stockCoverForType(type.code),
    burn: burnRateForType(type.code),
    lastAdjustment: lastStockAdjustment(type.code)
  })).sort((a, b) => {
    const urgency = (item) => item.cover.state === "out" ? -1 : item.cover.months ?? 999;
    return urgency(a) - urgency(b) || a.type.code.localeCompare(b.type.code);
  });

  const recentEvents = allHistoryEvents(ui.year).slice(0, 6);
  const recentMovements = [...(db.stockMovements || [])]
    .sort((a, b) => String(b.at).localeCompare(String(a.at)) || String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .slice(0, 4);

  const ledeParts = [];
  ledeParts.push(outTypes.length
    ? `<strong>${outTypes.length} ${unitWord(outTypes.length, "type")} out of stock</strong>`
    : "All types are in stock");
  ledeParts.push(due.length
    ? `<strong>${due.length} active ${unitWord(due.length, "column")} past expected life</strong>`
    : "no active column is past expected life");
  const lede = `${ledeParts[0]}, and ${ledeParts[1]}.`;

  return `
    <div class="page">
      <h1 class="sr-only">HPLC column operations overview</h1>

      ${viewIntro("Operations", lede, [
        contextChip("As of", formatDate(todayISO())),
        contextChip("Cycle", String(ui.year)),
        contextChip("Stock", `${stockTotal} ${unitWord(stockTotal, "column")}`),
        ui.year > 2000 ? contextChip(`${ui.year - 1}`, `${columnsForYear(ui.year - 1).length} activations`) : ""
      ])}

      <div class="kpi-grid">
        <a class="kpi kpi--feature kpi--link" href="#/stock">
          <div class="kpi-top">
            <span class="kpi-label">Unactivated stock</span>
            <span class="kpi-icon" aria-hidden="true">${icon("archive")}</span>
          </div>
          <div>
            <div class="kpi-value">${counterHTML(stockTotal)}<span class="kpi-unit">${unitWord(stockTotal, "column")}</span></div>
            <p class="kpi-note"><span class="kpi-dot" aria-hidden="true"></span>${outTypes.length} out · ${lowTypes.length} low</p>
          </div>
          <svg class="kpi-trace" viewBox="0 0 220 80" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 67H28l7-10 8 10h17l8-31 9 31h18l9-20 8 20h24l8-44 9 44h21l7-13 8 13H220"/>
            <path d="M0 42H220"/>
          </svg>
        </a>

        <a class="kpi kpi--link" href="#/activations">
          <div class="kpi-top">
            <span class="kpi-label">Due for replacement</span>
            <span class="kpi-icon" aria-hidden="true">${icon("alert")}</span>
          </div>
          <div class="kpi-value">${counterHTML(due.length)}<span class="kpi-unit">${unitWord(due.length, "column")}</span></div>
          <p class="kpi-note">${soon.length} due soon · ${activeColumns.length} active</p>
        </a>

        <a class="kpi kpi--link" href="#/activations">
          <div class="kpi-top">
            <span class="kpi-label">${isCurrentYear ? "Activations this month" : `Peak month ${ui.year}`}</span>
            <span class="kpi-icon" aria-hidden="true">${icon("activity")}</span>
          </div>
          <div class="kpi-value">${counterHTML(isCurrentYear ? thisMonth : peakCount)}<span class="kpi-unit">${unitWord(isCurrentYear ? thisMonth : peakCount, "column")}</span></div>
          <p class="kpi-note">${isCurrentYear
            ? (monthDelta === null
              ? `Peak ${peakCount ? `${MONTHS_SHORT[peakIndex]} · ${peakCount}` : "none yet"}`
              : `${monthDelta >= 0 ? "+" : ""}${monthDelta} vs ${MONTHS_SHORT[previousMonthIndex]}`)
            : (peakCount ? `${MONTHS_SHORT[peakIndex]} · ${peakCount} of ${totalActivations}` : "No activations")}</p>
        </a>

        <a class="kpi kpi--link" href="#/activations">
          <div class="kpi-top">
            <span class="kpi-label">Columns in use</span>
            <span class="kpi-icon" aria-hidden="true">${icon("column")}</span>
          </div>
          <div class="kpi-value">${counterHTML(activeColumns.length)}<span class="kpi-unit">${unitWord(activeColumns.length, "column")}</span></div>
          <p class="kpi-note">${purposeCount} active purposes · ${inactiveCount} inactive</p>
        </a>
      </div>

      <div class="dashboard-grid">
        <section class="panel ops-span-7">
          <div class="panel-head">
            <div>
              <h2 class="panel-title">Stock runway</h2>
              <p class="panel-sub">Current stock against the current burn rate, most urgent first</p>
            </div>
            <a class="text-link" href="#/stock">Manage stock ${icon("chevron-right")}</a>
          </div>
          <div class="table-wrap">
            <table class="data-table data-table--responsive runway-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Stock</th>
                  <th>Burn / mo</th>
                  <th>Cover</th>
                  <th>Out by</th>
                  <th class="cell-actions"><span class="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                ${runway.map(({ type, stock, cover, burn }) => {
                  const tone = cover.state === "out" ? "out" : cover.months !== null && cover.months < 2 ? "low" : cover.months !== null && cover.months < 4 ? "watch" : "ok";
                  return `
                    <tr${cover.state === "out" ? ' class="is-critical"' : ""}>
                      <td data-label="Type">
                        <a class="stock-type-cell usage-type-link" href="#/types/${type.code}">
                          <span class="type-code">${type.code}</span>
                          <span><strong>${esc(type.name)}</strong><small>${esc(typeDimensionsShort(type))}</small></span>
                        </a>
                      </td>
                      <td data-label="Stock"><span class="stock-value">${pad2(stock)}</span></td>
                      <td data-label="Burn / mo"><span class="cell-date">${burn > 0 ? burn.toFixed(1) : "0"}</span></td>
                      <td data-label="Cover"><span class="cover-chip cover-chip--${tone}">${formatCover(cover)}</span></td>
                      <td data-label="Out by"><span class="cell-date">${cover.state === "out" ? "Out now" : cover.projected ? formatMonthYear(cover.projected) : "—"}</span></td>
                      <td class="cell-actions">
                        <button class="btn btn-secondary btn-sm" type="button" data-action="adjust-stock" data-type="${type.code}">Adjust</button>
                      </td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
          <div class="table-foot">
            <span>Cover = stock ÷ activations per month</span>
            <span>${outTypes.length} out · ${lowTypes.length} low</span>
          </div>
        </section>

        <section class="panel ops-span-5">
          <div class="panel-head">
            <div>
              <h2 class="panel-title">Replacement watch</h2>
              <p class="panel-sub">Active columns by remaining estimated life</p>
            </div>
            <span class="panel-badge">${warnings.length}</span>
          </div>
          <div class="panel-body panel-body--tight">
            ${warnings.length ? `
              <div class="watch-list">
                ${warnings.map(({ column, life }) => `
                  <button class="watch-row" type="button" data-action="open-column" data-id="${column.id}">
                    <span class="watch-main">
                      <span class="cell-code">${columnCode(column)}</span>
                      <span class="cell-sub">${esc(typeByCode(column.type)?.name || column.type)} · ${formatDaysShort(life.days)} in service · ~${life.expected.days} d expected</span>
                    </span>
                    ${lifeBadge(life)}
                  </button>
                `).join("")}
              </div>
              <div class="watch-foot">
                <span>${due.length} past life · ${soon.length} within 15%</span>
                <a class="text-link" href="#/activations">View all ${icon("chevron-right")}</a>
              </div>
            ` : `
              <div class="side-note"><strong>No active column needs replacement.</strong> All columns are within their estimated service life.</div>
            `}
          </div>
        </section>

        <section class="panel ops-span-7">
          <div class="panel-head">
            <div>
              <h2 class="panel-title">Activations per month</h2>
              <p class="panel-sub">Column openings across ${ui.year}</p>
            </div>
            <div class="panel-head-actions">
              <a class="text-link" href="#/usage">View usage ${icon("chevron-right")}</a>
              <span class="panel-badge">${totalActivations} total</span>
            </div>
          </div>
          <div class="panel-body">
            <div class="chart" role="img" aria-label="Activations per month in ${ui.year}: ${monthlySummary}">
              <div class="chart-y" aria-hidden="true">${yLabels}</div>
              <div class="chart-plot" aria-hidden="true">
                <div class="chart-grid-lines"><span></span><span></span><span></span><span></span><span></span></div>
                <div class="chart-avg" style="bottom:${Math.min(96, (averagePerMonth / chartMax) * 100)}%"><span>avg ${averagePerMonth.toFixed(1)}</span></div>
                <div class="chart-bars">${chartBars}</div>
              </div>
            </div>
            <div class="chart-months" aria-hidden="true">${MONTHS_SHORT.map((month) => `<span>${month}</span>`).join("")}</div>
            <div class="chart-foot">
              <span>Busiest month <strong>${peakCount ? `${MONTHS_SHORT[peakIndex]} · ${peakCount} ${unitWord(peakCount, "activation")}` : "none yet"}</strong></span>
              <span>Average <strong>${averagePerMonth.toFixed(1)}/mo</strong></span>
            </div>
          </div>
        </section>

        <section class="panel ops-span-5">
          <div class="panel-head">
            <div>
              <h2 class="panel-title">Recent activity</h2>
              <p class="panel-sub">Latest registry events in ${ui.year}</p>
            </div>
            <a class="text-link" href="#/history">History ${icon("chevron-right")}</a>
          </div>
          <div class="panel-body panel-body--tight">
            ${recentEvents.length ? `
              <div class="activity-list">
                ${recentEvents.map((event) => `
                  <button class="activity-row" type="button" data-action="open-column" data-id="${event.column.id}">
                    <span class="activity-dot activity-dot--${event.kind}" aria-hidden="true"></span>
                    <span class="activity-main">
                      <span class="cell-code">${columnCode(event.column)}</span>
                      <span class="cell-sub">${esc(historyEventSummary(event))}</span>
                    </span>
                    <span class="activity-date">${formatShortDate(event.at)}</span>
                  </button>
                `).join("")}
              </div>
            ` : `<div class="side-note">No activity recorded in ${ui.year} yet.</div>`}
          </div>
        </section>

        <section class="panel ops-span-5">
          <div class="panel-head">
            <div>
              <h2 class="panel-title">Top purposes</h2>
              <p class="panel-sub">Active columns by purpose in ${ui.year}</p>
            </div>
            <span class="panel-badge">${purposeCount}/${PURPOSES.length}</span>
          </div>
          <div class="panel-body">${purposeList(activeColumns)}</div>
        </section>

        <section class="panel ops-span-7">
          <div class="panel-head">
            <div>
              <h2 class="panel-title">Latest stock adjustments</h2>
              <p class="panel-sub">Manual changes with required remarks</p>
            </div>
            <a class="text-link" href="#/stock">Stock log ${icon("chevron-right")}</a>
          </div>
          <div class="panel-body panel-body--tight">
            ${recentMovements.length ? `
              <div class="movement-list">
                ${recentMovements.map((movement) => {
                  const type = typeByCode(movement.type);
                  return `
                    <button class="movement-row" type="button" data-action="adjust-stock" data-type="${movement.type}">
                      <span class="movement-delta ${movement.delta > 0 ? "is-add" : "is-reduce"}">${movement.delta > 0 ? "+" : ""}${movement.delta}</span>
                      <span class="movement-main">
                        <strong>${movement.type} · ${esc(type?.name || movement.type)}</strong>
                        <small>${esc(movement.note)}</small>
                      </span>
                      <span class="movement-date">${formatShortDate(movement.at)}</span>
                    </button>
                  `;
                }).join("")}
              </div>
            ` : `<div class="side-note">No manual stock adjustments recorded yet.</div>`}
          </div>
        </section>
      </div>
    </div>
  `;
}

/* =========================================================
   Types
   ========================================================= */

function renderTypes() {
  const stockTotal = totalStock();
  const low = TYPES.filter((type) => {
    const stock = db.stock[type.code] || 0;
    return stock > 0 && stock <= 2;
  }).length;
  const out = TYPES.filter((type) => (db.stock[type.code] || 0) === 0).length;
  const activations = columnsForYear().length;
  const active = columnsForYear().filter((column) => columnStatus(column) === "active").length;
  const due = activeLifeWarnings(ui.year).filter((item) => item.life.state === "due").length;

  return `
    <div class="page">
      <h1 class="sr-only">Column types</h1>

      ${viewIntro(
        "Inventory catalog",
        `${TYPES.length} column types, ${out} out of stock and ${low} low. ${due ? `<strong>${due} active ${unitWord(due, "column")} need replacement.</strong>` : "No active column is past expected life."}`,
        [
          contextChip("Dimensions", "Length × ID · particle · pore"),
          contextChip("Stock", `${stockTotal} ${unitWord(stockTotal, "column")}`),
          contextChip("In use", `${active} ${unitWord(active, "column")}`)
        ]
      )}

      <div data-filter-scope>
        <div class="toolbar">
          <label class="search-field">
            <span class="sr-only">Search column types</span>
            ${icon("search")}
            <input type="search" data-filter="search" placeholder="Search type, product, or dimension…" autocomplete="off">
          </label>
          <select class="select-control" data-filter="stock" aria-label="Filter by stock status">
            <option value="">All stock statuses</option>
            <option value="ok">Available</option>
            <option value="low">Low</option>
            <option value="out">Out</option>
          </select>
          <select class="select-control" data-sort aria-label="Sort column types">
            <option value="type">Type A–Z</option>
            <option value="stock-asc">Stock low to high</option>
            <option value="activations-desc">Most activations</option>
            <option value="cover-asc">Shortest cover</option>
          </select>
          <span class="spacer"></span>
          <a class="btn btn-secondary" href="#/stock">${icon("archive")}Manage stock</a>
          <span class="section-note"><strong data-filter-count>${TYPES.length}</strong> shown</span>
        </div>

        <div class="stock-summary" aria-label="Inventory summary">
          <span class="stock-summary-chip">${icon("archive")} Total stock <strong>${stockTotal}</strong></span>
          <span class="stock-summary-chip">${icon("activity")} Activations ${ui.year} <strong>${activations}</strong></span>
          <span class="stock-summary-chip">${icon("alert")} Due replacement <strong>${due}</strong></span>
          <span class="stock-summary-chip">${icon("close")} Out <strong>${out}</strong></span>
        </div>

        <h2 class="sr-only">Column type list</h2>
        <div class="type-grid" data-filter-table>
          ${TYPES.map((type) => typeCard(type)).join("")}
        </div>

        <div class="empty-state" data-filter-empty hidden>
          <span class="empty-icon">${icon("search")}</span>
          <h3>No matching types</h3>
          <p>Try another keyword or change the stock status filter.</p>
        </div>

        <p class="spec-note">
          ${icon("column")}
          <span>Dimensions are typical manufacturer specifications for each product line. Confirm length, internal diameter, particle size, and pore size against the label on the physical column before use.</span>
        </p>
      </div>
    </div>
  `;
}

/* =========================================================
   Type detail
   ========================================================= */

function renderTypeDetail(code) {
  const type = typeByCode(code);
  if (!type) return renderNotFound();

  const allColumns = columnsForType(type.code);
  const yearColumns = columnsForType(type.code, ui.year);
  const activeYearColumns = yearColumns.filter((column) => columnStatus(column) === "active");
  const inactiveYearCount = yearColumns.length - activeYearColumns.length;
  const stock = db.stock[type.code] || 0;
  const status = stockStatus(stock);
  const last = latestActivationForType(type.code, ui.year);
  const changes = yearColumns.reduce((sum, column) => sum + column.history.filter((event) => event.kind !== "activation").length, 0);
  const totalStockAllTypes = totalStock();
  const expected = expectedLifeForType(type.code);
  const cover = stockCoverForType(type.code);
  const warnings = activeYearColumns
    .map((column) => ({ column, life: lifecycleFor(column) }))
    .filter((item) => item.life.state === "due" || item.life.state === "soon");
  const dueCount = warnings.filter((item) => item.life.state === "due").length;
  const averageActiveAge = average(activeYearColumns.map(serviceDays));

  const rows = yearColumns.map((column) => {
    const life = lifecycleFor(column);
    const lastUpdate = [...column.history]
      .filter((event) => event.kind !== "activation")
      .sort((a, b) => {
        const byDate = String(b.at).localeCompare(String(a.at));
        if (byDate !== 0) return byDate;
        return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
      })[0];
    const updateText = lastUpdate
      ? (lastUpdate.kind === "status"
        ? `${statusValueLabel(lastUpdate.from)} ${statusValueLabel(lastUpdate.to)}`
        : `${purposeLabel(lastUpdate.from)} ${purposeLabel(lastUpdate.to)}`)
      : "";
    const search = `${columnCode(column)} ${type.name} ${type.product} ${purposeLabel(column.purpose)} ${column.activatedAt} ${columnStatusLabel(column)} ${updateText}`;

    return `
      <tr data-filter-row data-search="${esc(search)}" data-type="${column.type}" data-purpose="${column.purpose}" data-status="${columnStatus(column)}" data-life="${life.state}">
        <td data-label="Column code">
          <button class="link-button cell-code" type="button" data-action="open-column" data-id="${column.id}">${columnCode(column)}</button>
          <span class="cell-sub">Seq ${column.seq} · ${column.year}</span>
        </td>
        <td data-label="Purpose">
          <span class="purpose-badge">${esc(purposeLabel(column.purpose))}</span>
          ${lastUpdate ? `<span class="cell-sub">Updated ${formatDate(lastUpdate.at)}</span>` : ""}
        </td>
        <td data-label="Status">${columnStatusBadge(column)}</td>
        <td data-label="Activated">
          <span class="cell-date">${formatDate(column.activatedAt)}</span>
          <span class="cell-sub">${formatDaysShort(life.days)} in service</span>
        </td>
        <td data-label="Life">
          <span class="life-value${life.state === "due" ? " is-due" : life.state === "soon" ? " is-soon" : ""}">${lifeRemainingText(life)}</span>
          <span class="cell-sub">${life.state === "retired" ? `retired ${formatDate(column.statusChangedAt)}` : life.state === "unknown" ? "no estimate" : `of ~${life.expected.days} d`}</span>
        </td>
        <td class="cell-actions" data-label="Actions">
          <button class="btn btn-secondary btn-sm" type="button" data-action="change-purpose" data-id="${column.id}">Change</button>
          <button class="icon-btn" type="button" data-action="open-column" data-id="${column.id}" aria-label="Details for ${columnCode(column)}">${icon("chevron-right")}</button>
        </td>
      </tr>
    `;
  }).join("");

  return `
    <div class="page">
      <a class="back-link" href="#/types">${icon("arrow-left")}All column types</a>

      <section class="detail-hero">
        <div class="detail-code" aria-hidden="true">${type.code}</div>
        <div class="detail-title">
          <p class="eyebrow">Column type ${type.code} · ${esc(type.phase)}</p>
          <h1>${esc(type.name)}</h1>
          <p class="detail-product">${esc(type.product)} · ${esc(type.supplier)}</p>
          <div class="spec-inline">
            <span class="spec-pill">${type.dimensions.length} × ${type.dimensions.diameter} mm</span>
            <span class="spec-pill">${type.dimensions.particle} µm particle</span>
            <span class="spec-pill">${type.dimensions.pore} Å pore</span>
            <span class="spec-pill">${esc(type.phase)} phase</span>
          </div>
          <div class="detail-meta">
            <span>${allColumns.length} ${unitWord(allColumns.length, "column")} registered</span>
            <span>${yearColumns.length} ${unitWord(yearColumns.length, "activation")} in ${ui.year}</span>
            <span>${last ? `Last ${formatDate(last)}` : "No activations yet"}</span>
          </div>
        </div>
        <div class="detail-right">
          <div class="detail-stats">
            <div class="detail-stat">
              <span class="detail-stat-label">Stock</span>
              <span class="detail-stat-value${status.key === "out" ? " is-out" : status.key === "low" ? " is-low" : ""}">${pad2(stock)}</span>
            </div>
            <div class="detail-stat">
              <span class="detail-stat-label">Active</span>
              <span class="detail-stat-value">${activeYearColumns.length}</span>
            </div>
            <div class="detail-stat">
              <span class="detail-stat-label">Due</span>
              <span class="detail-stat-value${dueCount ? " is-out" : ""}">${dueCount}</span>
            </div>
            <div class="detail-stat">
              <span class="detail-stat-label">Avg. life</span>
              <span class="detail-stat-value">${expected.days ? `~${expected.days}` : "—"}</span>
            </div>
          </div>
          <div class="detail-actions">
            <button class="btn btn-secondary" type="button" data-action="focus-stock" data-type="${type.code}">${icon("archive")}Manage stock</button>
            <button class="btn btn-primary" type="button" data-action="add-column" data-type="${type.code}">${icon("plus")}Add activation</button>
          </div>
        </div>
      </section>

      <div class="detail-grid">
        <section class="panel" data-filter-scope>
          <div class="panel-head">
            <div>
              <h2 class="panel-title">Activated columns ${ui.year}</h2>
              <p class="panel-sub">Life remaining is estimated from retired columns of the same type, or all types when the sample is small</p>
            </div>
          </div>

          ${yearColumns.length ? `
            <div class="table-tabs" role="group" aria-label="Filter by column status">
              <button class="table-tab is-active" type="button" data-status-tab="" aria-pressed="true">All <span>${yearColumns.length}</span></button>
              <button class="table-tab" type="button" data-status-tab="active" aria-pressed="false">Active <span>${activeYearColumns.length}</span></button>
              <button class="table-tab" type="button" data-status-tab="inactive" aria-pressed="false">Inactive <span>${inactiveYearCount}</span></button>
              <span class="table-tabs-spacer"></span>
              <span class="table-tabs-note">${dueCount} due · ${warnings.length - dueCount} soon</span>
            </div>
            <input type="hidden" data-filter="status" value="">

            <div class="panel-body toolbar-row">
              <div class="toolbar">
                <label class="search-field">
                  <span class="sr-only">Search ${esc(type.name)} columns</span>
                  ${icon("search")}
                  <input type="search" data-filter="search" placeholder="Search code or purpose…" autocomplete="off">
                </label>
                <select class="select-control" data-filter="purpose" aria-label="Filter by purpose">
                  <option value="">All purposes</option>
                  ${PURPOSES.map((purpose) => `<option value="${purpose.id}">${esc(purpose.label)}</option>`).join("")}
                </select>
                <select class="select-control" data-filter="life" aria-label="Filter by life stage">
                  <option value="">All life stages</option>
                  <option value="due">Due for replacement</option>
                  <option value="soon">Due soon</option>
                  <option value="ok">On track</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>

            <div class="table-wrap" data-filter-table>
              <table class="data-table data-table--responsive type-detail-table">
                <thead>
                  <tr>
                    <th>Column code</th>
                    <th>Purpose</th>
                    <th>Status</th>
                    <th>Activated</th>
                    <th>Life</th>
                    <th class="cell-actions"><span class="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>

            <div class="table-foot">
              <span>Showing <strong data-filter-count>${yearColumns.length}</strong></span>
              <span>Stock for this type: <strong>${stock}</strong> · cover <strong>${formatCover(cover)}</strong></span>
            </div>

            <div data-filter-empty hidden>
              ${emptyState("search", "No matching columns", "Try another code, purpose, status, or life stage.")}
            </div>
          ` : emptyState(
            "column",
            `No activations in ${ui.year}`,
            `Columns of ${esc(type.name)} activated this year will appear here. Sequence numbers start at 01 each year.`,
            `<button class="btn btn-primary" type="button" data-action="add-column" data-type="${type.code}">${icon("plus")}Add activation</button>`
          )}

          <div class="side-note" style="margin:0 19px 18px">
            <strong>Next code:</strong> <span class="mono">${nextCode(type.code, ui.year)}</span> · ${stock > 0 ? `${stock} in stock` : "out of stock"} · total stock across all types ${totalStockAllTypes}
          </div>
        </section>

        <aside class="detail-side">
          <section class="panel">
            <div class="panel-head">
              <div>
                <h2 class="panel-title">Column specification</h2>
                <p class="panel-sub">Typical manufacturer data for this product line</p>
              </div>
            </div>
            <div class="panel-body">
              <dl class="spec-list">
                <div><dt>Product</dt><dd>${esc(type.product)}</dd></div>
                <div><dt>Supplier</dt><dd>${esc(type.supplier)}</dd></div>
                <div><dt>Length</dt><dd>${type.dimensions.length} mm</dd></div>
                <div><dt>Internal diameter</dt><dd>${type.dimensions.diameter} mm</dd></div>
                <div><dt>Particle size</dt><dd>${type.dimensions.particle} µm</dd></div>
                <div><dt>Pore size</dt><dd>${type.dimensions.pore} Å</dd></div>
                <div><dt>Phase</dt><dd>${esc(type.phase)}</dd></div>
                <div><dt>Expected life</dt><dd>${expected.days ? `~${expected.days} d` : "—"} <span class="spec-sample">n=${expected.sample}</span></dd></div>
              </dl>
              <p class="spec-note">${icon("column")} Confirm against the label on the physical column. “Expected life” is the mean service life of retired columns, not a manufacturer rating.</p>
            </div>
          </section>

          <section class="panel">
            <div class="panel-head">
              <div>
                <h2 class="panel-title">Type summary</h2>
                <p class="panel-sub">Stock, life, and change activity</p>
              </div>
            </div>
            <div class="panel-body" style="padding:13px">
              <div class="mini-stats">
                <div class="mini-stat">
                  <span class="mini-stat-label">Stock on hand</span>
                  <span class="mini-stat-value">${pad2(stock)} <small>${unitWord(stock, "column")}</small></span>
                </div>
                <div class="mini-stat">
                  <span class="mini-stat-label">Activations ${ui.year}</span>
                  <span class="mini-stat-value">${pad2(yearColumns.length)} <small>${unitWord(yearColumns.length, "column")}</small></span>
                </div>
                <div class="mini-stat">
                  <span class="mini-stat-label">Average active age</span>
                  <span class="mini-stat-value">${averageActiveAge === null ? "—" : formatDaysShort(averageActiveAge)}</span>
                </div>
                <div class="mini-stat">
                  <span class="mini-stat-label">Changes ${ui.year}</span>
                  <span class="mini-stat-value">${pad2(changes)} <small>${unitWord(changes, "event")}</small></span>
                </div>
              </div>
            </div>
          </section>

          <section class="panel">
            <div class="panel-head">
              <div>
                <h2 class="panel-title">Active purpose distribution</h2>
                <p class="panel-sub">${activeYearColumns.length} active ${unitWord(activeYearColumns.length, "column")} in ${ui.year}</p>
              </div>
            </div>
            <div class="panel-body">${purposeList(activeYearColumns)}</div>
          </section>

          <div class="side-note">
            <strong>Numbering rule.</strong> Sequence <span class="mono">01</span> only applies to the same type and year.
            For example, <span class="mono">B-01/IPC/${String(ui.year).slice(-2)}</span> and <span class="mono">A-01/IPC/${String(ui.year).slice(-2)}</span> can exist at the same time.
            In the next year, each type starts again at <span class="mono">01</span>.
          </div>
        </aside>
      </div>
    </div>
  `;
}

/* =========================================================
   Activations
   ========================================================= */

function renderActivations() {
  const columns = [...columnsForYear()].sort((a, b) => b.activatedAt.localeCompare(a.activatedAt) || b.seq - a.seq);
  const activeColumnCount = columns.filter((column) => columnStatus(column) === "active").length;
  const inactiveColumnCount = columns.length - activeColumnCount;
  const warnings = activeLifeWarnings(ui.year);
  const dueCount = warnings.filter((item) => item.life.state === "due").length;
  const soonCount = warnings.length - dueCount;
  const averageAge = average(columns.filter((column) => columnStatus(column) === "active").map(serviceDays));

  const rows = columns.map((column) => {
    const type = typeByCode(column.type);
    const life = lifecycleFor(column);
    const search = `${columnCode(column)} ${type?.name || ""} ${type?.product || ""} ${purposeLabel(column.purpose)} ${columnStatusLabel(column)} ${column.activatedAt} ${activationNote(column)}`;
    return `
      <tr data-filter-row
          data-search="${esc(search)}"
          data-type="${column.type}"
          data-purpose="${column.purpose}"
          data-status="${columnStatus(column)}"
          data-life="${life.state}"
          data-date="${column.activatedAt}"
          data-code="${columnCode(column)}"
          data-days="${life.days}">
        <td data-label="Column code">
          <button class="link-button cell-code" type="button" data-action="open-column" data-id="${column.id}">${columnCode(column)}</button>
          <span class="cell-sub">${esc(type?.name || column.type)} · ${esc(typeDimensionsShort(type))}</span>
        </td>
        <td data-label="Purpose"><span class="purpose-badge">${esc(purposeLabel(column.purpose))}</span></td>
        <td data-label="Status">${columnStatusBadge(column)}</td>
        <td data-label="Activation date"><span class="cell-date">${formatDate(column.activatedAt)}</span></td>
        <td data-label="In service">
          <span class="life-value">${formatDaysShort(life.days)}</span>
          <span class="cell-sub">${columnStatus(column) === "active" ? "to date" : "total life"}</span>
        </td>
        <td data-label="Life">
          <span class="life-value${life.state === "due" ? " is-due" : life.state === "soon" ? " is-soon" : ""}">${lifeRemainingText(life)}</span>
          <span class="cell-sub">${life.state === "retired" ? `retired ${formatDate(column.statusChangedAt)}` : life.state === "unknown" ? "no estimate" : `of ~${life.expected.days} d expected`}</span>
        </td>
        <td class="cell-actions" data-label="Actions">
          <button class="btn btn-secondary btn-sm" type="button" data-action="change-purpose" data-id="${column.id}">Change</button>
          <button class="icon-btn" type="button" data-action="open-column" data-id="${column.id}" aria-label="Details for ${columnCode(column)}">${icon("chevron-right")}</button>
        </td>
      </tr>
    `;
  }).join("");

  return `
    <div class="page">
      <h1 class="sr-only">Column activations</h1>

      ${viewIntro(
        "Activation register",
        `${columns.length} ${unitWord(columns.length, "column")} activated in ${ui.year}, ${activeColumnCount} still in use. <strong>${dueCount} ${unitWord(dueCount, "column")} past expected life.</strong>`,
        [
          contextChip("Active", String(activeColumnCount)),
          contextChip("Inactive", String(inactiveColumnCount)),
          contextChip("Avg. active age", averageAge === null ? "—" : formatDaysShort(averageAge)),
          contextChip("Due soon", String(soonCount), soonCount ? "warn" : "")
        ]
      )}

      <div class="info-banner">
        ${icon("flask")}
        <div class="info-banner-content">
          <p>
            Code format <span class="code-example">B-01/IPC/${String(ui.year).slice(-2)}</span> — the letter identifies the column type, the number is the sequence per type per year, <strong>IPC</strong> is a fixed keyword, and the last two digits are the year.
          </p>
          <div class="info-banner-legend">
            <span><b>B</b> Licospher CN</span>
            <span><b>01</b> sequence for ${ui.year}</span>
            <span><b>IPC</b> fixed keyword</span>
            <span><b>${String(ui.year).slice(-2)}</b> year ${ui.year}</span>
          </div>
        </div>
      </div>

      <div data-filter-scope>
        <div class="toolbar">
          <label class="search-field">
            <span class="sr-only">Search activations</span>
            ${icon("search")}
            <input type="search" data-filter="search" placeholder="Search code or purpose…" autocomplete="off">
          </label>
          <select class="select-control" data-filter="type" aria-label="Filter by column type">
            <option value="">All types</option>
            ${TYPES.map((type) => `<option value="${type.code}">${type.code} — ${esc(type.name)}</option>`).join("")}
          </select>
          <select class="select-control" data-filter="purpose" aria-label="Filter by purpose">
            <option value="">All purposes</option>
            ${PURPOSES.map((purpose) => `<option value="${purpose.id}">${esc(purpose.label)}</option>`).join("")}
          </select>
          <select class="select-control" data-filter="life" aria-label="Filter by life stage">
            <option value="">All life stages</option>
            <option value="due">Due for replacement</option>
            <option value="soon">Due soon</option>
            <option value="ok">On track</option>
            <option value="retired">Retired</option>
          </select>
          <select class="select-control" data-sort aria-label="Sort activations">
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="code-asc">Code A–Z</option>
            <option value="days-desc">Longest in service</option>
          </select>
          <span class="spacer"></span>
          <button class="btn btn-secondary" type="button" data-action="export-csv">${icon("download")}Export CSV</button>
        </div>

        <section class="panel">
          <div class="panel-head">
            <div>
              <h2 class="panel-title">Activated columns ${ui.year}</h2>
              <p class="panel-sub">Click a code to view purpose, status, lifecycle, and change history</p>
            </div>
          </div>

          ${columns.length ? `
            <div class="table-tabs" role="group" aria-label="Filter by column status">
              <button class="table-tab is-active" type="button" data-status-tab="" aria-pressed="true">All <span>${columns.length}</span></button>
              <button class="table-tab" type="button" data-status-tab="active" aria-pressed="false">Active <span>${activeColumnCount}</span></button>
              <button class="table-tab" type="button" data-status-tab="inactive" aria-pressed="false">Inactive <span>${inactiveColumnCount}</span></button>
              <span class="table-tabs-spacer"></span>
              <span class="table-tabs-note">${dueCount} due · ${soonCount} soon</span>
            </div>
            <input type="hidden" data-filter="status" value="">

            <div class="table-wrap" data-filter-table>
              <table class="data-table data-table--responsive">
                <thead>
                  <tr>
                    <th>Column code</th>
                    <th>Purpose</th>
                    <th>Status</th>
                    <th>Activated</th>
                    <th>In service</th>
                    <th>Life</th>
                    <th class="cell-actions"><span class="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
            <div class="table-foot">
              <span>Showing <strong data-filter-count>${columns.length}</strong></span>
              <span>${ui.year} cycle · life estimates use retired columns</span>
            </div>
            <div data-filter-empty hidden>
              ${emptyState("search", "No matching columns", "Try another keyword, purpose, status, or life stage.")}
            </div>
          ` : emptyState(
            "activity",
            `No activations in ${ui.year}`,
            "Add an activated column to start recording its purpose.",
            `<button class="btn btn-primary" type="button" data-action="add-column">${icon("plus")}Add activation</button>`
          )}
        </section>
      </div>
    </div>
  `;
}

/* =========================================================
   History
   ========================================================= */

function renderHistory() {
  const events = allHistoryEvents(ui.year);
  const activationCount = events.filter((event) => event.kind === "activation").length;
  const changeCount = events.filter((event) => event.kind === "change").length;
  const statusCount = events.filter((event) => event.kind === "status").length;
  const latest = events[0];

  return `
    <div class="page">
      <h1 class="sr-only">Column history</h1>

      ${viewIntro(
        "Audit trail",
        `${events.length} ${unitWord(events.length, "event")} in ${ui.year}: ${activationCount} activations, ${changeCount} purpose changes, ${statusCount} status changes.${latest ? ` <strong>Latest: ${columnCode(latest.column)} on ${formatDate(latest.at)}.</strong>` : ""}`,
        [
          contextChip("Activations", String(activationCount)),
          contextChip("Purpose changes", String(changeCount)),
          contextChip("Status changes", String(statusCount))
        ]
      )}

      <div data-filter-scope>
        <div class="toolbar toolbar--history">
          <label class="search-field">
            <span class="sr-only">Search history</span>
            ${icon("search")}
            <input type="search" data-filter="search" placeholder="Search history…" autocomplete="off">
          </label>
          <select class="select-control" data-filter="type" aria-label="Filter by column type">
            <option value="">All types</option>
            ${TYPES.map((type) => `<option value="${type.code}">${type.code} — ${esc(type.name)}</option>`).join("")}
          </select>
          <select class="select-control" data-filter="purpose" aria-label="Filter by purpose">
            <option value="">All purposes</option>
            ${PURPOSES.map((purpose) => `<option value="${purpose.id}">${esc(purpose.label)}</option>`).join("")}
          </select>
          <select class="select-control" data-filter="kind" aria-label="Filter by history type">
            <option value="">All history</option>
            <option value="activation">Activation</option>
            <option value="change">Purpose change</option>
            <option value="status">Status change</option>
          </select>
          <select class="select-control" data-sort aria-label="Sort history">
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
          </select>
          <label class="date-range">
            <span class="date-range-label">Date</span>
            <input class="input" type="date" data-filter="dateFrom" aria-label="History from date">
            <span class="date-range-sep" aria-hidden="true">–</span>
            <input class="input" type="date" data-filter="dateTo" aria-label="History to date">
          </label>
        </div>

        ${events.length ? `
          <section class="panel">
            <div class="panel-head">
              <div>
                <h2 class="panel-title">Activity log</h2>
                <p class="panel-sub">Newest first · ${events.length} ${unitWord(events.length, "event")} in ${ui.year}</p>
              </div>
              <div class="panel-head-actions">
                <button class="btn btn-secondary btn-sm" type="button" data-action="export-history">${icon("download")}Export history</button>
                <span class="panel-badge">${ui.year}</span>
              </div>
            </div>
            <div class="history-list" data-filter-table>
              ${events.map((event) => historyEventHTML(event, event.column, { filterable: true, interactiveCode: true })).join("")}
            </div>
            <div class="table-foot">
              <span>Showing <strong data-filter-count>${events.length}</strong></span>
              <span>Status changes and purpose changes keep their reason note</span>
            </div>
            <div data-filter-empty hidden>
              ${emptyState("search", "No matching history", "Try another keyword, type, purpose, kind, or date range.")}
            </div>
          </section>
        ` : emptyState(
          "history",
          `No history in ${ui.year}`,
          "Activations and purpose changes are recorded automatically here.",
          `<button class="btn btn-primary" type="button" data-action="add-column">${icon("plus")}Add activation</button>`
        )}
      </div>
    </div>
  `;
}

function historyEventHTML(event, column, { filterable = false, interactiveCode = false } = {}) {
  const type = typeByCode(column.type);
  const isChange = event.kind === "change";
  const isStatus = event.kind === "status";
  const statusSearch = isStatus ? `${statusValueLabel(event.from)} ${statusValueLabel(event.to)}` : "";
  const search = `${columnCode(column)} ${type?.name || ""} ${purposeLabel(event.purpose || event.to)} ${event.from ? purposeLabel(event.from) : ""} ${statusSearch} ${event.note || ""} ${event.at}`;
  const filterAttrs = filterable
    ? ` data-filter-row data-search="${esc(search)}" data-type="${column.type}" data-kind="${event.kind}" data-purpose="${esc(event.purpose || event.to || "")}" data-date="${event.at}"`
    : "";

  const codeMarkup = interactiveCode
    ? `<button class="link-button cell-code" type="button" data-action="open-column" data-id="${column.id}">${columnCode(column)}</button>`
    : `<span class="cell-code">${columnCode(column)}</span>`;

  const body = isStatus
    ? `Status changed from <strong>${statusValueLabel(event.from)}</strong> <span class="arrow-transition">${icon("chevron-right")}</span> <strong>${statusValueLabel(event.to)}</strong>.`
    : isChange
      ? `Purpose changed from <strong>${esc(purposeLabel(event.from))}</strong> <span class="arrow-transition">${icon("chevron-right")}</span> <strong>${esc(purposeLabel(event.to))}</strong>.`
      : `Activated for <strong>${esc(purposeLabel(event.purpose))}</strong>.`;

  return `
    <article class="history-row${isChange ? " history-row--change" : ""}${isStatus ? " history-row--status" : ""}"${filterAttrs}>
      <span class="history-date">${formatDate(event.at)}</span>
      <span class="history-code">${codeMarkup}<span class="cell-sub">${esc(type?.name || column.type)}</span></span>
      <span class="history-body">
        <span class="history-text">${body}</span>
        ${event.note ? `<span class="history-note">${esc(event.note)}</span>` : ""}
      </span>
      <span class="timeline-event-kind">${isStatus ? "Status" : isChange ? "Change" : "Activation"}</span>
    </article>
  `;
}

/* =========================================================
   Stock
   ========================================================= */

function renderStock() {
  const total = totalStock();
  const out = TYPES.filter((type) => (db.stock[type.code] || 0) === 0).length;
  const low = TYPES.filter((type) => {
    const stock = db.stock[type.code] || 0;
    return stock > 0 && stock <= 2;
  }).length;
  const due = activeLifeWarnings(ui.year).filter((item) => item.life.state === "due").length;
  const stockMovements = [...(db.stockMovements || [])].sort((a, b) => {
    const byDate = String(b.at).localeCompare(String(a.at));
    if (byDate !== 0) return byDate;
    return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  });
  const maxCover = Math.max(...TYPES.map((type) => stockCoverForType(type.code).months || 0), 1);
  const shortestCover = TYPES
    .filter((type) => (db.stock[type.code] || 0) > 0)
    .map((type) => ({ type, cover: stockCoverForType(type.code) }))
    .filter((item) => item.cover.months !== null)
    .sort((a, b) => a.cover.months - b.cover.months)[0] || null;
  const rows = TYPES.map((type) => {
    const stock = db.stock[type.code] || 0;
    const status = stockStatus(stock);
    const cover = stockCoverForType(type.code);
    const burn = burnRateForType(type.code);
    const lastAdjustment = lastStockAdjustment(type.code);
    const next = nextCode(type.code, ui.year);
    const isFocus = ui.stockFocus === type.code;
    const tone = cover.state === "out" ? "out" : cover.months !== null && cover.months < 2 ? "low" : cover.months !== null && cover.months < 4 ? "watch" : "ok";
    const meterWidth = cover.months === null ? 0 : Math.min(100, Math.round((cover.months / Math.max(6, Math.min(24, maxCover))) * 100));

    return `
      <tr class="stock-row${isFocus ? " is-focus" : ""}${cover.state === "out" ? " is-critical" : ""}"
          data-sort-row
          data-type="${type.code}"
          data-stock="${stock}"
          data-cover="${cover.state === "out" ? 0 : cover.months ?? 999}">
        <td data-label="Column type">
          <div class="stock-type-cell">
            <span class="type-code">${type.code}</span>
            <span>
              <strong>${esc(type.name)}</strong>
              <small>${esc(typeDimensions(type))}</small>
            </span>
          </div>
        </td>
        <td data-label="Current stock">
          <span class="stock-value">${pad2(stock)}</span>
          <span class="cell-sub">${lastAdjustment ? `Adjusted ${formatShortDate(lastAdjustment.at)}` : "No adjustment"}</span>
        </td>
        <td data-label="Burn / month">
          <span class="life-value">${burn > 0 ? burn.toFixed(1) : "0"}</span>
          <span class="cell-sub">${columnsForType(type.code, currentYear()).length} in ${currentYear()}</span>
        </td>
        <td data-label="Cover">
          <div class="cover-cell">
            <span class="cover-chip cover-chip--${tone}">${formatCover(cover)}</span>
            <span class="cover-meter"><span style="width:${meterWidth}%"></span></span>
          </div>
        </td>
        <td data-label="Out by">
          <span class="cell-date">${cover.state === "out" ? "Out now" : cover.projected ? formatMonthYear(cover.projected) : "—"}</span>
          <span class="cell-sub">${cover.state === "out" ? "no stock" : cover.months === null ? "no burn yet" : `${stock} ÷ ${burn.toFixed(1)}/mo`}</span>
        </td>
        <td data-label="Last adjustment">
          ${lastAdjustment ? `
            <span class="cell-date">${formatDate(lastAdjustment.at)}</span>
            <span class="cell-sub stock-note" title="${esc(lastAdjustment.note)}">${esc(lastAdjustment.note)}</span>
          ` : `<span class="cell-date">—</span>`}
        </td>
        <td class="cell-actions" data-label="Actions">
          <button class="btn btn-secondary btn-sm" type="button" data-action="adjust-stock" data-type="${type.code}">Adjust</button>
        </td>
      </tr>
    `;
  }).join("");

  const movementRows = stockMovements.map((movement) => {
    const type = typeByCode(movement.type);
    const deltaLabel = `${movement.delta > 0 ? "+" : ""}${movement.delta}`;
    return `
      <tr>
        <td data-label="Date"><span class="cell-date">${formatDate(movement.at)}</span></td>
        <td data-label="Column type">
          <div class="stock-type-cell">
            <span class="type-code">${movement.type}</span>
            <span><strong>${esc(type?.name || movement.type)}</strong><small>${esc(typeDimensionsShort(type))}</small></span>
          </div>
        </td>
        <td data-label="Change"><span class="movement-delta ${movement.delta > 0 ? "is-add" : "is-reduce"}">${deltaLabel}</span></td>
        <td data-label="Stock"><span class="cell-date">${movement.before} → ${movement.after}</span></td>
        <td data-label="Remarks"><span class="movement-note">${esc(movement.note)}</span></td>
      </tr>
    `;
  }).join("");

  return `
    <div class="page">
      <h1 class="sr-only">Unactivated stock</h1>

      ${viewIntro(
        "Stock operations",
        `${total} unactivated ${unitWord(total, "column")} across ${TYPES.length} types. <strong>${out} out of stock, ${low} low.</strong>${shortestCover ? ` ${shortestCover.type.code} has the shortest cover among in-stock types at ${formatCover(shortestCover.cover)}.` : ""}`,
        [
          contextChip("Out", String(out), out ? "bad" : ""),
          contextChip("Low", String(low), low ? "warn" : ""),
          contextChip("Due replacement", String(due)),
          contextChip("Saved", formatSavedAt(db.updatedAt))
        ]
      )}

      <div class="stock-summary" aria-label="Stock summary">
        <span class="stock-summary-chip">${icon("archive")} Total stock <strong>${total}</strong></span>
        <span class="stock-summary-chip">${icon("activity")} Activations ${ui.year} <strong>${columnsForYear().length}</strong></span>
        <span class="stock-summary-chip">${icon("alert")} Out <strong>${out}</strong></span>
      </div>

      <div class="info-banner">
        ${icon("archive")}
        <p><strong>Stock = physical columns not yet activated.</strong> Cover = stock ÷ activations per month for the selected year. Use <strong>Adjust</strong> to add or reduce stock; every adjustment requires a note and appears in the log below.</p>
      </div>

      <section class="panel" data-sort-scope>
        <div class="panel-head">
          <div>
            <h2 class="panel-title">Stock runway</h2>
            <p class="panel-sub">Stock, burn rate, and projected stockout for every type</p>
          </div>
          <div class="panel-head-actions">
            <select class="select-control select-control--compact" data-sort aria-label="Sort stock">
              <option value="urgency">Most urgent first</option>
              <option value="type">Type A–Z</option>
              <option value="stock-asc">Stock low to high</option>
              <option value="cover-desc">Longest cover</option>
            </select>
            <span class="panel-badge">${total} ${unitWord(total, "column")}</span>
          </div>
        </div>

        <div class="table-wrap">
          <table class="data-table data-table--responsive stock-table">
            <thead>
              <tr>
                <th>Column type</th>
                <th>Stock</th>
                <th>Burn / mo</th>
                <th>Cover</th>
                <th>Out by</th>
                <th>Last adjustment</th>
                <th class="cell-actions"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>

        <div class="table-foot">
          <span>Total <strong>${total}</strong> ${unitWord(total, "column")} not activated</span>
          <span>Cover uses ${columnsForYear(currentYear()).length} activations ÷ ${monthsElapsedForYear(currentYear())} months in ${currentYear()}</span>
        </div>
      </section>

      <section class="panel" style="margin-top:13px">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">Manual stock adjustments</h2>
            <p class="panel-sub">Newest first · ${stockMovements.length} ${unitWord(stockMovements.length, "record")}</p>
          </div>
          <div class="panel-head-actions">
            <button class="btn btn-secondary btn-sm" type="button" data-action="backup-json">${icon("download")}Backup JSON</button>
            <button class="btn btn-secondary btn-sm" type="button" data-action="restore-json">${icon("database")}Restore</button>
            <span class="panel-badge">${stockMovements.length}</span>
          </div>
        </div>
        ${stockMovements.length ? `
          <div class="table-wrap">
            <table class="data-table data-table--responsive">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Column type</th>
                  <th>Change</th>
                  <th>Stock</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>${movementRows}</tbody>
            </table>
          </div>
        ` : `
          <div class="panel-body">
            <p class="section-note">No manual stock adjustments yet. Use Adjust to record a stock change.</p>
          </div>
        `}
        <div class="table-foot">
          <span>Last saved <strong>${formatSavedAt(db.updatedAt)}</strong></span>
          <span>Backup downloads a JSON file you can restore later.</span>
        </div>
      </section>
    </div>
  `;
}

/* =========================================================
   Usage
   ========================================================= */

function renderUsage() {
  const columns = columnsForYear();
  const activeColumns = columns.filter((column) => columnStatus(column) === "active");
  const inactiveColumns = columns.filter((column) => columnStatus(column) === "inactive");
  const baseline = globalLifeBaseline();

  const perType = TYPES.map((type) => {
    const typeColumns = columns
      .filter((column) => column.type === type.code)
      .sort((a, b) => a.activatedAt.localeCompare(b.activatedAt) || a.seq - b.seq);
    const intervals = [];

    for (let index = 1; index < typeColumns.length; index += 1) {
      const days = daysBetween(typeColumns[index - 1].activatedAt, typeColumns[index].activatedAt);
      if (Number.isFinite(days) && days >= 0) {
        intervals.push({ from: typeColumns[index - 1], to: typeColumns[index], days });
      }
    }

    const lifeValues = typeColumns
      .map(inactiveLifeDays)
      .filter((days) => Number.isFinite(days) && days > 0);

    return {
      type,
      activations: typeColumns.length,
      active: typeColumns.filter((column) => columnStatus(column) === "active").length,
      inactive: typeColumns.filter((column) => columnStatus(column) === "inactive").length,
      intervals,
      avgInterval: average(intervals.map((interval) => interval.days)),
      avgLife: average(lifeValues),
      lifeSample: lifeValues.length,
      expected: expectedLifeForType(type.code),
      last: typeColumns.at(-1)?.activatedAt || ""
    };
  });

  const allIntervals = perType.flatMap((type) => type.intervals);
  const maxAvgInterval = Math.max(...perType.map((item) => item.avgInterval || 0), 1);
  const maxIntervalDays = Math.max(...allIntervals.map((interval) => interval.days), 1);
  const avgInterval = average(allIntervals.map((interval) => interval.days));
  const monthsElapsed = monthsElapsedForYear(ui.year);
  const activationsPerMonth = columns.length / Math.max(1, monthsElapsed);
  const avgIntervalDays = avgInterval === null ? null : Math.round(avgInterval);
  const oldestActive = activeColumns
    .map((column) => ({ column, life: lifecycleFor(column) }))
    .sort((a, b) => b.life.days - a.life.days)
    .slice(0, 6);

  const typeRows = perType.map((item) => `
    <tr>
      <td data-label="Column type">
        <a class="stock-type-cell usage-type-link" href="#/types/${item.type.code}">
          <span class="type-code">${item.type.code}</span>
          <span><strong>${esc(item.type.name)}</strong><small>${esc(typeDimensionsShort(item.type))}</small></span>
        </a>
      </td>
      <td data-label="Activations"><span class="cell-date">${item.activations}</span></td>
      <td data-label="Active"><span class="cell-date">${item.active}</span></td>
      <td data-label="Inactive"><span class="cell-date">${item.inactive}</span></td>
      <td data-label="Avg. interval">
        <div class="metric-cell">
          <div class="metric-cell-top"><span class="metric-value">${formatDays(item.avgInterval)}</span><span class="metric-sample">n=${item.intervals.length}</span></div>
          ${item.avgInterval === null ? "" : `<span class="metric-track"><span class="metric-fill" style="width:${Math.max(6, Math.round((item.avgInterval / maxAvgInterval) * 100))}%"></span></span>`}
        </div>
      </td>
      <td data-label="Avg. service life">
        <div class="metric-cell">
          <div class="metric-cell-top">
            <span class="metric-value">${item.avgLife === null ? "—" : formatDays(item.avgLife)}</span>
            <span class="metric-sample">n=${item.lifeSample}</span>
          </div>
          <span class="cell-sub">${item.avgLife === null && item.expected.days ? `est. ~${item.expected.days} d baseline` : item.avgLife === null ? "no retired columns" : "measured from retired columns"}</span>
        </div>
      </td>
      <td data-label="Last activation"><span class="cell-date">${item.last ? formatDate(item.last) : "—"}</span></td>
    </tr>
  `).join("");

  const intervalRows = allIntervals.map((interval) => {
    const type = typeByCode(interval.from.type);
    return `
      <tr>
        <td data-label="Type">
          <span class="cell-code">${interval.from.type}</span>
          <span class="cell-sub">${esc(type?.name || interval.from.type)}</span>
        </td>
        <td data-label="From">
          <button class="link-button cell-code" type="button" data-action="open-column" data-id="${interval.from.id}">${columnCode(interval.from)}</button>
          <span class="cell-sub">${formatDate(interval.from.activatedAt)}</span>
        </td>
        <td data-label="To">
          <button class="link-button cell-code" type="button" data-action="open-column" data-id="${interval.to.id}">${columnCode(interval.to)}</button>
          <span class="cell-sub">${formatDate(interval.to.activatedAt)}</span>
        </td>
        <td data-label="Days">
          <div class="metric-cell">
            <div class="metric-cell-top"><span class="metric-value">${interval.days} ${unitWord(interval.days, "day")}</span></div>
            <span class="metric-track"><span class="metric-fill" style="width:${Math.max(6, Math.round((interval.days / maxIntervalDays) * 100))}%"></span></span>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  return `
    <div class="page">
      <h1 class="sr-only">Column usage</h1>

      ${viewIntro(
        "Usage analytics",
        `Average activation interval is <strong>${avgIntervalDays === null ? "not available" : `${avgIntervalDays} days`}</strong> across ${allIntervals.length} intervals. Service-life estimates use ${baseline.sample} retired columns.`,
        [
          contextChip("Intervals", String(allIntervals.length)),
          contextChip("Retired sample", String(baseline.sample)),
          contextChip("Baseline life", baseline.days ? `~${baseline.days} d` : "—")
        ]
      )}

      <div class="kpi-grid">
        <div class="kpi">
          <div class="kpi-top">
            <span class="kpi-label">Avg. activation interval</span>
            <span class="kpi-icon" aria-hidden="true">${icon("trend")}</span>
          </div>
          <div class="kpi-value">${avgIntervalDays === null ? "—" : `${counterHTML(avgIntervalDays)}<span class="kpi-unit">${unitWord(avgIntervalDays, "day")}</span>`}</div>
          <p class="kpi-note">${allIntervals.length ? `Across ${allIntervals.length} ${unitWord(allIntervals.length, "interval")} in ${ui.year}` : "Not enough intervals yet"}</p>
        </div>

        <div class="kpi">
          <div class="kpi-top">
            <span class="kpi-label">Activations per month</span>
            <span class="kpi-icon" aria-hidden="true">${icon("activity")}</span>
          </div>
          <div class="kpi-value">${counterHTML(activationsPerMonth, 1)}<span class="kpi-unit">per month</span></div>
          <p class="kpi-note">${columns.length} ${unitWord(columns.length, "activation")} across ${monthsElapsed} ${unitWord(monthsElapsed, "month")}</p>
        </div>

        <div class="kpi">
          <div class="kpi-top">
            <span class="kpi-label">Service-life baseline</span>
            <span class="kpi-icon" aria-hidden="true">${icon("history")}</span>
          </div>
          <div class="kpi-value">${baseline.days === null ? "—" : `${counterHTML(baseline.days)}<span class="kpi-unit">${unitWord(baseline.days, "day")}</span>`}</div>
          <p class="kpi-note">${baseline.sample ? `Mean of ${baseline.sample} retired ${unitWord(baseline.sample, "column")}` : "No retired columns yet"}</p>
        </div>

        <div class="kpi">
          <div class="kpi-top">
            <span class="kpi-label">Columns in use</span>
            <span class="kpi-icon" aria-hidden="true">${icon("column")}</span>
          </div>
          <div class="kpi-value">${counterHTML(activeColumns.length)}<span class="kpi-unit">${unitWord(activeColumns.length, "column")}</span></div>
          <p class="kpi-note">${inactiveColumns.length} inactive · ${uniquePurposeCount(activeColumns)} purposes</p>
        </div>
      </div>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">Per column type</h2>
            <p class="panel-sub">Activation cadence, sample size, and service life in ${ui.year}</p>
          </div>
          <span class="panel-badge">${TYPES.length} types</span>
        </div>
        <div class="table-wrap">
          <table class="data-table data-table--responsive">
            <thead>
              <tr>
                <th>Column type</th>
                <th>Activations</th>
                <th>Active</th>
                <th>Inactive</th>
                <th>Avg. interval</th>
                <th>Avg. service life</th>
                <th>Last activation</th>
              </tr>
            </thead>
            <tbody>${typeRows}</tbody>
          </table>
        </div>
        <div class="table-foot">
          <span>Interval = days between consecutive activations of the same type</span>
          <span>Service life = activation to inactive date; n = sample size</span>
        </div>
      </section>

      <section class="panel" style="margin-top:13px">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">Longest-serving active columns</h2>
            <p class="panel-sub">Oldest active columns first · compare age with expected life</p>
          </div>
          <a class="text-link" href="#/activations">Open register ${icon("chevron-right")}</a>
        </div>
        ${oldestActive.length ? `
          <div class="panel-body panel-body--tight">
            <div class="watch-list">
              ${oldestActive.map(({ column, life }) => `
                <button class="watch-row" type="button" data-action="open-column" data-id="${column.id}">
                  <span class="watch-main">
                    <span class="cell-code">${columnCode(column)}</span>
                    <span class="cell-sub">${esc(typeByCode(column.type)?.name || column.type)} · ${formatDaysShort(life.days)} in service · ~${life.expected.days} d expected</span>
                  </span>
                  ${lifeBadge(life)}
                </button>
              `).join("")}
            </div>
          </div>
        ` : `<div class="panel-body"><p class="section-note">No active columns in ${ui.year}.</p></div>`}
      </section>

      <section class="panel" style="margin-top:13px">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">Activation intervals</h2>
            <p class="panel-sub">Consecutive activations of the same type in ${ui.year}</p>
          </div>
          <span class="panel-badge">${allIntervals.length} ${unitWord(allIntervals.length, "interval")}</span>
        </div>
        ${allIntervals.length ? `
          <div class="table-wrap">
            <table class="data-table data-table--responsive">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                </tr>
              </thead>
              <tbody>${intervalRows}</tbody>
            </table>
          </div>
        ` : `
          <div style="padding:16px 19px">
            ${emptyState(
              "trend",
              "Not enough data for intervals",
              `Add at least two activations of the same column type in ${ui.year} to calculate an interval.`,
              `<button class="btn btn-primary" type="button" data-action="add-column">${icon("plus")}Add activation</button>`
            )}
          </div>
        `}
      </section>

      <div class="side-note" style="margin-top:13px">
        <strong>How this is calculated.</strong> Activation interval is the number of days between two consecutive activations of the same column type.
        Service life is the number of days from activation to the date a column was marked inactive. The service-life baseline uses every retired column in the registry, across years.
        Life remaining on other pages uses a type-specific baseline only when at least two retired columns of that type exist; otherwise it falls back to this global baseline.
      </div>
    </div>
  `;
}

/* =========================================================
   Not found
   ========================================================= */

function renderNotFound() {
  return `
    <div class="page">
      ${pageHead("Registry", "Page not found", "The link you opened is unavailable or the column type is unknown.")}
      ${emptyState("search", "404 — not found", "Return to the overview to see stock and column activations.", `<a class="btn btn-primary" href="#/dashboard">${icon("grid")}Back to overview</a>`)}
    </div>
  `;
}

/* =========================================================
   Filtering
   ========================================================= */

function applyFilters(scope) {
  if (!scope) return;

  const search = (scope.querySelector('[data-filter="search"]')?.value || "").trim().toLocaleLowerCase("en");
  const type = scope.querySelector('[data-filter="type"]')?.value || "";
  const purpose = scope.querySelector('[data-filter="purpose"]')?.value || "";
  const kind = scope.querySelector('[data-filter="kind"]')?.value || "";
  const stock = scope.querySelector('[data-filter="stock"]')?.value || "";
  const status = scope.querySelector('[data-filter="status"]')?.value || "";
  const life = scope.querySelector('[data-filter="life"]')?.value || "";
  const dateFrom = scope.querySelector('[data-filter="dateFrom"]')?.value || "";
  const dateTo = scope.querySelector('[data-filter="dateTo"]')?.value || "";
  const rows = [...scope.querySelectorAll("[data-filter-row]")];
  let visible = 0;

  rows.forEach((row) => {
    const haystack = (row.dataset.search || row.textContent || "").toLocaleLowerCase("en");
    let match = !search || haystack.includes(search);

    if (match && type && row.dataset.type !== type) match = false;
    if (match && purpose && row.dataset.purpose !== purpose) match = false;
    if (match && kind && row.dataset.kind !== kind) match = false;
    if (match && stock && row.dataset.stock !== stock) match = false;
    if (match && status && row.dataset.status !== status) match = false;
    if (match && life && row.dataset.life !== life) match = false;
    if (match && dateFrom && (row.dataset.date || "") < dateFrom) match = false;
    if (match && dateTo && (row.dataset.date || "") > dateTo) match = false;

    row.hidden = !match;
    if (match) visible += 1;
  });

  scope.querySelectorAll("[data-filter-count]").forEach((element) => {
    element.textContent = String(visible);
  });

  const table = scope.querySelector("[data-filter-table]");
  if (table) table.hidden = visible === 0;

  const empty = scope.querySelector("[data-filter-empty]");
  if (empty) empty.hidden = visible !== 0;

  applySort(scope);
}

function applySort(scope) {
  if (!scope) return;

  const select = scope.querySelector("[data-sort]");
  if (!select) return;

  const container = scope.querySelector("tbody") || scope.querySelector("[data-filter-table]");
  if (!container) return;

  const rows = [...container.children].filter((row) => row.matches("[data-filter-row], [data-sort-row]"));
  if (rows.length < 2) return;

  const key = select.value;
  const textOf = (row, name) => String(row.dataset[name] || row.textContent || "").trim();
  const numberOf = (row, name) => Number(row.dataset[name]) || 0;

  const compare = (a, b) => {
    if (key === "type" || key === "code-asc") {
      return textOf(a, "type").localeCompare(textOf(b, "type")) || textOf(a, "code").localeCompare(textOf(b, "code"));
    }
    if (key === "stock-asc") {
      const stockOf = (row) => Number(row.dataset.stockCount ?? row.dataset.stock) || 0;
      return stockOf(a) - stockOf(b);
    }
    if (key === "activations-desc") return numberOf(b, "activations") - numberOf(a, "activations");
    if (key === "cover-asc" || key === "urgency") return numberOf(a, "cover") - numberOf(b, "cover");
    if (key === "cover-desc") return numberOf(b, "cover") - numberOf(a, "cover");
    if (key === "date-desc") return String(b.dataset.date || "").localeCompare(String(a.dataset.date || ""));
    if (key === "date-asc") return String(a.dataset.date || "").localeCompare(String(b.dataset.date || ""));
    if (key === "days-desc") return numberOf(b, "days") - numberOf(a, "days");
    return 0;
  };

  rows.sort(compare).forEach((row) => container.appendChild(row));
}

/* =========================================================
   Add activation
   ========================================================= */

function typeOptions(selectedCode = "") {
  return TYPES.map((type) => {
    const stock = db.stock[type.code] || 0;
    const suffix = stock === 0 ? " — out of stock" : ` — ${stock} in stock`;
    return `<option value="${type.code}"${type.code === selectedCode ? " selected" : ""}>${type.code} — ${esc(type.name)}${suffix}</option>`;
  }).join("");
}

function purposeCombobox(selectedId = "", inputId = "addPurpose", placeholder = "Search 14 purposes…") {
  const selected = purposeById(selectedId);
  return `
    <div class="combo" data-combo>
      <input class="input combo-input"
             id="${inputId}"
             type="text"
             role="combobox"
             aria-expanded="false"
             aria-controls="${inputId}List"
             aria-autocomplete="list"
             autocomplete="off"
             placeholder="${esc(placeholder)}"
             value="${selected ? esc(selected.label) : ""}"
             data-combo-input>
      <input type="hidden" name="purpose" value="${selected ? selected.id : ""}" data-combo-value>
      <svg class="icon combo-chevron" aria-hidden="true"><use href="#i-chevron-right"></use></svg>
      <div class="combo-list" id="${inputId}List" role="listbox" hidden>
        ${PURPOSES.map((purpose) => `
          <button class="combo-option" type="button" role="option" data-combo-option data-value="${purpose.id}" data-label="${esc(purpose.label)}" aria-selected="${purpose.id === selectedId}">
            ${esc(purpose.label)}
            ${icon("check")}
          </button>
        `).join("")}
        <p class="combo-empty" hidden>No matching purpose.</p>
      </div>
    </div>
  `;
}

function comboParts(combo) {
  return {
    input: combo?.querySelector("[data-combo-input]"),
    value: combo?.querySelector("[data-combo-value]"),
    list: combo?.querySelector(".combo-list"),
    options: [...(combo?.querySelectorAll("[data-combo-option]") || [])]
  };
}

function closeAllCombos(except = null) {
  document.querySelectorAll("[data-combo].is-open").forEach((combo) => {
    if (combo !== except) closeCombo(combo);
  });
}

function openCombo(combo) {
  if (!combo) return;
  closeAllCombos(combo);
  const { input, value, list, options } = comboParts(combo);
  if (!input || !list) return;

  if (value?.value && input.value.trim() === purposeLabel(value.value)) {
    options.forEach((option) => {
      option.hidden = false;
    });
  }

  list.hidden = false;
  combo.classList.add("is-open");
  input.setAttribute("aria-expanded", "true");
  options.forEach((option) => option.classList.remove("is-active"));
}

function closeCombo(combo) {
  if (!combo) return;
  const { input, list } = comboParts(combo);
  if (list) list.hidden = true;
  combo.classList.remove("is-open");
  if (input) input.setAttribute("aria-expanded", "false");
}

function filterCombo(combo) {
  const { input, value, options, list } = comboParts(combo);
  if (!input || !list) return;
  const query = input.value.trim().toLocaleLowerCase("en");
  let visible = 0;

  options.forEach((option) => {
    const match = !query || option.dataset.label.toLocaleLowerCase("en").includes(query);
    option.hidden = !match;
    option.classList.remove("is-active");
    if (match) visible += 1;
  });

  if (value && value.value && input.value.trim() !== purposeLabel(value.value)) {
    value.value = "";
  }

  const empty = combo.querySelector(".combo-empty");
  if (empty) empty.hidden = visible > 0;
  openCombo(combo);
}

function chooseComboOption(combo, option) {
  if (!combo || !option) return;
  const { input, value } = comboParts(combo);
  if (input) input.value = option.dataset.label;
  if (value) value.value = option.dataset.value;
  combo.querySelectorAll("[data-combo-option]").forEach((item) => {
    item.setAttribute("aria-selected", String(item === option));
    item.classList.remove("is-active");
  });
  closeCombo(combo);
  if (combo.closest("#addColumnForm")) updateAddPreview();
  if (combo.closest("#changePurposeForm")) setFormError(combo.closest("form"), "");
}

function moveComboSelection(combo, direction) {
  const options = [...combo.querySelectorAll("[data-combo-option]:not([hidden])")];
  if (!options.length) return;
  let index = options.findIndex((option) => option.classList.contains("is-active"));
  index = index === -1 ? (direction > 0 ? 0 : options.length - 1) : (index + direction + options.length) % options.length;
  options.forEach((option, optionIndex) => option.classList.toggle("is-active", optionIndex === index));
  options[index].scrollIntoView({ block: "nearest" });
}

function openAddModal(preselectedType = "") {
  if (ui.overlay) hideOverlay(false);

  const preselected = typeByCode(preselectedType);
  const typeCode = preselected?.code || TYPES.find((type) => (db.stock[type.code] || 0) > 0)?.code || TYPES[0].code;
  const type = typeByCode(typeCode);
  const stock = db.stock[typeCode] || 0;
  const today = todayISO();

  const html = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal-head">
        <div>
          <p class="eyebrow">New activation</p>
          <h2 id="modalTitle">Add activation</h2>
          <p>Choose a type and purpose. The column code is calculated automatically.</p>
        </div>
        <button class="icon-btn" type="button" data-action="close-modal" aria-label="Close dialog">${icon("close")}</button>
      </div>

      <form id="addColumnForm" novalidate>
        <div class="modal-body">
          <div class="add-layout">
            <div>
              <div class="field">
                <label for="addType"><span>Column type <span class="required" aria-hidden="true">*</span></span></label>
                <select class="select" id="addType" name="type" required>${typeOptions(typeCode)}</select>
                <p class="field-hint" id="addTypeHint">Code ${typeCode} · ${esc(type.name)} · ${stock} in stock</p>
              </div>

              <div class="field">
                <label for="addPurpose"><span>Purpose <span class="required" aria-hidden="true">*</span></span></label>
                ${purposeCombobox("", "addPurpose")}
                <p class="field-hint">Type to filter the 14 registered purposes.</p>
              </div>

              <div class="field">
                <label for="addDate"><span>Activation date <span class="required" aria-hidden="true">*</span></span></label>
                <input class="input" id="addDate" name="date" type="date" value="${today}" max="${today}" required>
                <p class="field-hint">The year in the code follows this date.</p>
              </div>

              <div class="field">
                <label for="addNote"><span>Notes</span><span class="optional">optional</span></label>
                <textarea class="textarea" id="addNote" name="note" maxlength="160" placeholder="E.g. new batch, method validation, or another note"></textarea>
              </div>

              <p class="form-error" data-form-error role="alert" hidden></p>
            </div>

            <aside class="code-preview" aria-label="Column code preview">
              <p class="preview-label">Automatic column code</p>
              <div class="preview-code" id="previewCode">${nextCode(typeCode, currentYear())}</div>
              <div class="preview-rule"></div>
              <dl class="preview-list">
                <div><dt>Type</dt><dd id="previewType">${typeCode} · ${esc(type.name)}</dd></div>
                <div><dt>Dimensions</dt><dd id="previewDimensions">${typeDimensionsLines(type)}</dd></div>
                <div><dt>Purpose</dt><dd id="previewPurpose">Not selected</dd></div>
                <div><dt>Sequence</dt><dd id="previewSeq">${pad2(nextSequence(typeCode, currentYear()))}</dd></div>
                <div><dt>Current stock</dt><dd id="previewStock">${stock}</dd></div>
                <div><dt>Est. life</dt><dd id="previewLife">${expectedLifeLabel(typeCode)}</dd></div>
              </dl>
              <p class="preview-note" id="previewNote">Sequence is automatic per type per year. The year follows the activation date.</p>
            </aside>
          </div>
        </div>

        <div class="modal-foot">
          <span class="modal-foot-note">Stock decreases automatically after saving.</span>
          <button class="btn btn-ghost" type="button" data-action="close-modal">Cancel</button>
          <button class="btn btn-primary" type="submit">${icon("check")}Save activation</button>
        </div>
      </form>
    </div>
  `;

  showOverlay(html, { type: "modal" });
  const select = document.getElementById("addType");
  if (select) {
    select.setAttribute("data-autofocus", "true");
    select.focus();
  }
  updateAddPreview();
}

function updateAddPreview() {
  const form = document.getElementById("addColumnForm");
  if (!form) return;

  const typeCode = form.elements.type?.value || TYPES[0].code;
  const type = typeByCode(typeCode) || TYPES[0];
  const date = form.elements.date?.value || todayISO();
  const year = Number(String(date).slice(0, 4)) || ui.year;
  const seq = nextSequence(typeCode, year);
  const stock = db.stock[typeCode] || 0;
  const purpose = form.elements.purpose?.value || "";

  const previewCode = document.getElementById("previewCode");
  const previewType = document.getElementById("previewType");
  const previewDimensions = document.getElementById("previewDimensions");
  const previewPurpose = document.getElementById("previewPurpose");
  const previewSeq = document.getElementById("previewSeq");
  const previewStock = document.getElementById("previewStock");
  const previewLife = document.getElementById("previewLife");
  const previewNote = document.getElementById("previewNote");
  const typeHint = document.getElementById("addTypeHint");

  if (previewCode) previewCode.textContent = `${typeCode}-${pad2(seq)}/${IPC_KEYWORD}/${String(year).slice(-2)}`;
  if (previewType) previewType.textContent = `${typeCode} · ${type.name}`;
  if (previewDimensions) previewDimensions.innerHTML = typeDimensionsLines(type);
  if (previewPurpose) previewPurpose.textContent = purpose ? purposeLabel(purpose) : "Not selected";
  if (previewSeq) previewSeq.textContent = pad2(seq);
  if (previewStock) {
    previewStock.textContent = stock > 0 ? String(stock) : "0 — out";
    previewStock.classList.toggle("is-out", stock <= 0);
  }
  if (previewLife) previewLife.textContent = expectedLifeLabel(typeCode);
  if (typeHint) typeHint.textContent = `Code ${typeCode} · ${type.name} · ${typeDimensionsShort(type)} · ${stock} in stock`;

  if (previewNote) {
    if (stock <= 0) {
      previewNote.innerHTML = `<strong>Out of stock.</strong> Add stock for this type before recording an activation.`;
    } else if (year !== ui.year) {
      previewNote.innerHTML = `This activation will be recorded in <strong>${year}</strong>, not the displayed year ${ui.year}. The sequence restarts for that year.`;
    } else {
      previewNote.innerHTML = `Sequence is automatic per type per year. The year follows the activation date.`;
    }
  }
}

function setFormError(form, message) {
  const error = form.querySelector("[data-form-error]");
  if (!error) return;
  if (!message) {
    error.hidden = true;
    error.innerHTML = "";
    return;
  }
  error.hidden = false;
  error.innerHTML = `${icon("alert")}<span>${esc(message)}</span>`;
}

function submitAddColumn(form) {
  if (!form) return;

  const typeCode = form.elements.type?.value || "";
  const purpose = form.elements.purpose?.value || "";
  const date = form.elements.date?.value || "";
  const note = (form.elements.note?.value || "").trim().slice(0, 160);
  const type = typeByCode(typeCode);
  const stock = db.stock[typeCode] || 0;

  if (!type) {
    setFormError(form, "Select a valid column type.");
    return;
  }
  if (!purposeById(purpose)) {
    setFormError(form, "Select a purpose first.");
    document.getElementById("addPurpose")?.focus();
    return;
  }
  if (!date) {
    setFormError(form, "Activation date is required.");
    document.getElementById("addDate")?.focus();
    return;
  }
  if (date > todayISO()) {
    setFormError(form, "Activation date cannot be in the future.");
    document.getElementById("addDate")?.focus();
    return;
  }
  if (stock <= 0) {
    setFormError(form, `${type.name} is out of stock. Add stock on the Stock page first.`);
    return;
  }

  const year = Number(date.slice(0, 4));
  if (!Number.isFinite(year) || year < 2000) {
    setFormError(form, "Activation year is invalid.");
    return;
  }

  const seq = nextSequence(typeCode, year);
  const now = new Date().toISOString();
  const column = {
    id: uid(),
    type: typeCode,
    seq,
    year,
    activatedAt: date,
    purpose,
    purposeSince: date,
    status: "active",
    statusChangedAt: date,
    createdAt: now,
    history: [
      {
        kind: "activation",
        at: date,
        purpose,
        note,
        createdAt: now
      }
    ]
  };

  db.stock[typeCode] = stock - 1;
  db.columns.push(column);
  saveDb();
  hideOverlay(false);

  ui.year = year;
  saveYear();
  ui.stockFocus = null;
  navigate(`types/${typeCode}`, true);
  showToast(`Column ${columnCode(column)} activated.`, "success");
}

/* =========================================================
   Change purpose
   ========================================================= */

function openChangePurposeModal(columnId) {
  const column = findColumn(columnId);
  if (!column) return;

  if (ui.overlay) hideOverlay(false);

  const type = typeByCode(column.type);
  const today = todayISO();
  const changeFloor = column.purposeSince || column.activatedAt;
  const floorLabel = changeFloor === column.activatedAt
    ? `the activation date (${formatDate(column.activatedAt)})`
    : `the last change (${formatDate(changeFloor)})`;

  const html = `
    <div class="modal modal--sm" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal-head">
        <div>
          <p class="eyebrow">Purpose change</p>
          <h2 id="modalTitle">Change purpose</h2>
          <p>${columnCode(column)} · ${esc(type?.name || column.type)}</p>
        </div>
        <button class="icon-btn" type="button" data-action="close-modal" aria-label="Close dialog">${icon("close")}</button>
      </div>

      <form id="changePurposeForm" data-id="${column.id}" novalidate>
        <div class="modal-body">
          <div class="current-purpose">
            <span>Current purpose</span>
            <span class="purpose-badge">${esc(purposeLabel(column.purpose))}</span>
          </div>

          <div class="field">
            <label for="changePurpose"><span>New purpose <span class="required" aria-hidden="true">*</span></span></label>
            ${purposeCombobox("", "changePurpose", "Search a new purpose…")}
            <p class="field-hint">Type to filter. Current purpose is ${esc(purposeLabel(column.purpose))}.</p>
          </div>

          <div class="field">
            <label for="changeDate"><span>Change date <span class="required" aria-hidden="true">*</span></span></label>
            <input class="input" id="changeDate" name="date" type="date" value="${today}" min="${changeFloor}" max="${today}" required>
            <p class="field-hint">Must be on or after ${floorLabel}.</p>
          </div>

          <div class="field">
            <label for="changeNote"><span>Notes</span><span class="optional">optional</span></label>
            <textarea class="textarea" id="changeNote" name="note" maxlength="160" placeholder="Reason for changing the purpose"></textarea>
          </div>

          <p class="form-error" data-form-error role="alert" hidden></p>
        </div>

        <div class="modal-foot">
          <button class="btn btn-ghost" type="button" data-action="close-modal">Cancel</button>
          <button class="btn btn-primary" type="submit">${icon("check")}Save change</button>
        </div>
      </form>
    </div>
  `;

  showOverlay(html, { type: "modal" });
  const select = document.getElementById("changePurpose");
  if (select) {
    select.setAttribute("data-autofocus", "true");
    select.focus();
  }
}

function submitChangePurpose(form) {
  if (!form) return;

  const column = findColumn(form.dataset.id);
  if (!column) return;

  const newPurpose = form.elements.purpose?.value || "";
  const date = form.elements.date?.value || "";
  const note = (form.elements.note?.value || "").trim().slice(0, 160);

  if (!purposeById(newPurpose)) {
    setFormError(form, "Select a new purpose first.");
    return;
  }
  if (newPurpose === column.purpose) {
    setFormError(form, "The new purpose is the same as the current purpose.");
    return;
  }
  if (!date) {
    setFormError(form, "Change date is required.");
    return;
  }
  const changeFloor = column.purposeSince || column.activatedAt;
  if (date < changeFloor) {
    setFormError(form, `Change date cannot be earlier than ${formatDate(changeFloor)}.`);
    return;
  }
  if (date > todayISO()) {
    setFormError(form, "Change date cannot be in the future.");
    return;
  }

  const oldPurpose = column.purpose;
  const now = new Date().toISOString();
  column.purpose = newPurpose;
  column.purposeSince = date;
  column.history.push({
    kind: "change",
    at: date,
    from: oldPurpose,
    to: newPurpose,
    note,
    createdAt: now
  });

  saveDb();
  hideOverlay(false);
  render();
  requestAnimationFrame(() => {
    const target = document.querySelector(`[data-action="change-purpose"][data-id="${column.id}"]`) || document.getElementById("main");
    target?.focus({ preventScroll: true });
  });
  showToast(`Purpose for ${columnCode(column)} changed to ${purposeLabel(newPurpose)}.`, "success");
}

/* =========================================================
   Column status
   ========================================================= */

function openStatusModal(columnId) {
  const column = findColumn(columnId);
  if (!column) return;

  if (ui.overlay) hideOverlay(false);

  const type = typeByCode(column.type);
  const currentStatus = columnStatus(column);
  const nextStatus = currentStatus === "active" ? "inactive" : "active";
  const today = todayISO();
  const statusFloor = column.statusChangedAt || column.activatedAt;
  const floorLabel = statusFloor === column.activatedAt
    ? `the activation date (${formatDate(column.activatedAt)})`
    : `the current status date (${formatDate(statusFloor)})`;

  const html = `
    <div class="modal modal--sm" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal-head">
        <div>
          <p class="eyebrow">Status change</p>
          <h2 id="modalTitle">${nextStatus === "inactive" ? "Mark column inactive?" : "Reactivate column?"}</h2>
          <p>${columnCode(column)} · ${esc(type?.name || column.type)}</p>
        </div>
        <button class="icon-btn" type="button" data-action="close-modal" aria-label="Close dialog">${icon("close")}</button>
      </div>

      <form id="statusForm" data-id="${column.id}" data-next-status="${nextStatus}" novalidate>
        <div class="modal-body">
          <div class="current-purpose">
            <span>Current status</span>
            ${columnStatusBadge(column)}
          </div>

          <p class="side-note" style="margin-bottom:14px">
            ${nextStatus === "inactive"
              ? "Inactive columns stay in the registry and history but no longer count as in use. Service life is calculated from activation to this date."
              : "Reactivating makes this column count as in use again. The status history is kept."}
          </p>

          <div class="field">
            <label for="statusDate"><span>Status date <span class="required" aria-hidden="true">*</span></span></label>
            <input class="input" id="statusDate" name="date" type="date" value="${today}" min="${statusFloor}" max="${today}" required data-autofocus>
            <p class="field-hint">Must be on or after ${floorLabel}.</p>
          </div>

          <div class="field">
            <label for="statusNote"><span>Notes</span><span class="optional">optional</span></label>
            <textarea class="textarea" id="statusNote" name="note" maxlength="160" placeholder="Reason, e.g. degraded peak shape or backpressure"></textarea>
          </div>

          <p class="form-error" data-form-error role="alert" hidden></p>
        </div>

        <div class="modal-foot">
          <button class="btn btn-ghost" type="button" data-action="close-modal">Cancel</button>
          <button class="btn ${nextStatus === "inactive" ? "btn-danger" : "btn-primary"}" type="submit">
            ${icon(nextStatus === "inactive" ? "alert" : "check")}${nextStatus === "inactive" ? "Mark inactive" : "Reactivate"}
          </button>
        </div>
      </form>
    </div>
  `;

  showOverlay(html, { type: "modal" });
  document.getElementById("statusDate")?.focus();
}

function submitStatusChange(form) {
  if (!form) return;

  const column = findColumn(form.dataset.id);
  if (!column) return;

  const nextStatus = form.dataset.nextStatus;
  const oldStatus = columnStatus(column);
  const date = form.elements.date?.value || "";
  const note = (form.elements.note?.value || "").trim().slice(0, 160);

  if (nextStatus !== "active" && nextStatus !== "inactive") {
    setFormError(form, "Invalid status.");
    return;
  }
  if (nextStatus === oldStatus) {
    setFormError(form, "The column already has this status.");
    return;
  }
  if (!date) {
    setFormError(form, "Status date is required.");
    return;
  }

  const statusFloor = column.statusChangedAt || column.activatedAt;
  if (date < statusFloor) {
    setFormError(form, `Status date cannot be earlier than ${formatDate(statusFloor)}.`);
    return;
  }
  if (date > todayISO()) {
    setFormError(form, "Status date cannot be in the future.");
    return;
  }

  const now = new Date().toISOString();
  column.status = nextStatus;
  column.statusChangedAt = date;
  column.history.push({
    kind: "status",
    at: date,
    from: oldStatus,
    to: nextStatus,
    note,
    createdAt: now
  });

  saveDb();
  hideOverlay(false);
  render();
  requestAnimationFrame(() => {
    const target = document.querySelector(`[data-action="open-column"][data-id="${column.id}"]`) || document.getElementById("main");
    target?.focus({ preventScroll: true });
  });
  showToast(
    `Column ${columnCode(column)} ${nextStatus === "inactive" ? "marked inactive" : "reactivated"}.`,
    "success"
  );
}

/* =========================================================
   Stock adjustment
   ========================================================= */

function openStockAdjustModal(typeCode) {
  const type = typeByCode(typeCode);
  if (!type) return;

  if (ui.overlay) hideOverlay(false);

  const stock = db.stock[type.code] || 0;
  const today = todayISO();

  const html = `
    <div class="modal modal--sm" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal-head">
        <div>
          <p class="eyebrow">Stock adjustment</p>
          <h2 id="modalTitle">Adjust stock</h2>
          <p>${type.code} · ${esc(type.name)} · ${esc(typeDimensionsShort(type))}</p>
        </div>
        <button class="icon-btn" type="button" data-action="close-modal" aria-label="Close dialog">${icon("close")}</button>
      </div>

      <form id="stockAdjustForm" data-type="${type.code}" novalidate>
        <div class="modal-body">
          <div class="current-purpose">
            <span>Current stock</span>
            <span class="current-stock-meta">
              <strong class="stock-value">${pad2(stock)}</strong>
              <small>${formatCover(stockCoverForType(type.code))} cover · ${burnRateForType(type.code).toFixed(1)}/mo burn</small>
            </span>
          </div>

          <div class="field">
            <span class="field-legend" id="stockDirectionLabel">Adjustment type</span>
            <div class="segmented" role="group" aria-labelledby="stockDirectionLabel">
              <label><input type="radio" name="direction" value="add" checked><span>${icon("plus")}Add</span></label>
              <label><input type="radio" name="direction" value="reduce"><span>${icon("minus")}Reduce</span></label>
            </div>
          </div>

          <div class="field">
            <label for="stockQuantity"><span>Quantity <span class="required" aria-hidden="true">*</span></span></label>
            <input class="input" id="stockQuantity" name="quantity" type="number" min="1" max="999" value="1" inputmode="numeric" required data-autofocus>
          </div>

          <div class="field">
            <label for="stockDate"><span>Adjustment date <span class="required" aria-hidden="true">*</span></span></label>
            <input class="input" id="stockDate" name="date" type="date" value="${today}" max="${today}" required>
            <p class="field-hint">Stock updates immediately; this date is used in the log.</p>
          </div>

          <div class="field">
            <label for="stockNote"><span>Remarks <span class="required" aria-hidden="true">*</span></span></label>
            <textarea class="textarea" id="stockNote" name="note" maxlength="160" placeholder="E.g. borrowed by another division or new shipment from supplier" required></textarea>
            <p class="field-hint">Required for the manual adjustment log.</p>
          </div>

          <div class="stock-preview" aria-live="polite">
            <div>
              <span class="stock-preview-label">Current</span>
              <strong id="stockPreviewCurrent">${pad2(stock)}</strong>
            </div>
            <span class="stock-preview-arrow" aria-hidden="true">→</span>
            <div>
              <span class="stock-preview-label">New stock</span>
              <strong id="stockPreviewValue">${pad2(stock + 1)}</strong>
            </div>
          </div>
          <p class="field-hint" id="stockPreviewNote">Stock will change from ${stock} to ${stock + 1}.</p>

          <p class="form-error" data-form-error role="alert" hidden></p>
        </div>

        <div class="modal-foot">
          <button class="btn btn-ghost" type="button" data-action="close-modal">Cancel</button>
          <button class="btn btn-primary" type="submit">${icon("check")}Save adjustment</button>
        </div>
      </form>
    </div>
  `;

  showOverlay(html, { type: "modal" });
  updateStockPreview();
}

function updateStockPreview() {
  const form = document.getElementById("stockAdjustForm");
  if (!form) return;

  const type = typeByCode(form.dataset.type);
  if (!type) return;

  const current = db.stock[type.code] || 0;
  const direction = form.elements.direction?.value || "add";
  const quantity = Math.max(0, Number(form.elements.quantity?.value) || 0);
  const next = current + (direction === "reduce" ? -quantity : quantity);
  const currentEl = document.getElementById("stockPreviewCurrent");
  const valueEl = document.getElementById("stockPreviewValue");
  const noteEl = document.getElementById("stockPreviewNote");

  if (currentEl) currentEl.textContent = pad2(current);
  if (valueEl) {
    valueEl.textContent = pad2(Math.max(0, next));
    valueEl.classList.toggle("is-invalid", next < 0);
  }

  if (noteEl) {
    if (direction === "reduce" && quantity > current) {
      noteEl.textContent = `Only ${current} in stock. Reduce the quantity or switch to Add.`;
      noteEl.classList.add("is-error");
    } else {
      const burn = burnRateForType(type.code);
      const cover = next > 0 && burn > 0 ? ` Cover becomes ${(next / burn).toFixed(1)} months at ${burn.toFixed(1)}/mo.` : "";
      noteEl.textContent = `Stock will change from ${current} to ${next}.${cover}`;
      noteEl.classList.remove("is-error");
    }
  }
}

function submitStockAdjustment(form) {
  if (!form) return;

  const type = typeByCode(form.dataset.type);
  if (!type) return;

  const direction = form.elements.direction?.value || "";
  const quantity = Number(form.elements.quantity?.value);
  const date = form.elements.date?.value || "";
  const note = (form.elements.note?.value || "").trim().slice(0, 160);
  const current = db.stock[type.code] || 0;

  if (direction !== "add" && direction !== "reduce") {
    setFormError(form, "Select Add or Reduce.");
    return;
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
    setFormError(form, "Quantity must be a whole number between 1 and 999.");
    return;
  }
  if (direction === "reduce" && quantity > current) {
    setFormError(form, `Cannot reduce by ${quantity}. Only ${current} ${unitWord(current, "column")} in stock.`);
    return;
  }
  if (!date) {
    setFormError(form, "Adjustment date is required.");
    return;
  }
  if (date > todayISO()) {
    setFormError(form, "Adjustment date cannot be in the future.");
    return;
  }
  if (!note) {
    setFormError(form, "Remarks are required for every stock adjustment.");
    document.getElementById("stockNote")?.focus();
    return;
  }

  const delta = direction === "add" ? quantity : -quantity;
  const after = current + delta;
  const now = new Date().toISOString();

  db.stock[type.code] = after;
  db.stockMovements.push({
    id: uid(),
    at: date,
    type: type.code,
    delta,
    before: current,
    after,
    note,
    createdAt: now
  });

  saveDb();
  hideOverlay(false);
  ui.stockFocus = type.code;
  render();
  requestAnimationFrame(() => {
    const target = document.querySelector(`[data-action="adjust-stock"][data-type="${type.code}"]`) || document.getElementById("main");
    target?.focus({ preventScroll: true });
  });
  showToast(
    `Stock for ${type.code} ${type.name} ${delta > 0 ? "increased" : "reduced"} by ${quantity}: ${current} → ${after}.`,
    "success"
  );
}

/* =========================================================
   Column drawer
   ========================================================= */

function openColumnDrawer(columnId) {
  const column = findColumn(columnId);
  if (!column) return;

  if (ui.overlay) hideOverlay(false);

  const type = typeByCode(column.type);
  const stock = db.stock[column.type] || 0;
  const cover = stockCoverForType(column.type);
  const life = lifecycleFor(column);
  const history = [...column.history].sort((a, b) => {
    const byDate = String(b.at).localeCompare(String(a.at));
    if (byDate !== 0) return byDate;
    return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  });
  const replacement = columnStatus(column) === "active" && Number.isFinite(life.remaining)
    ? (life.remaining <= 0 ? "Overdue" : formatMonthYear(addDaysISO(todayISO(), life.remaining)))
    : "—";
  const remainingLabel = columnStatus(column) === "active" ? lifeRemainingText(life) : "—";

  const html = `
    <div class="drawer" role="dialog" aria-modal="true" aria-labelledby="drawerTitle">
      <div class="drawer-head">
        <div>
          <p class="eyebrow">Column detail</p>
          <h2 class="drawer-code" id="drawerTitle">${columnCode(column)}</h2>
          <p class="drawer-sub">${esc(type?.name || column.type)} · ${esc(typeDimensionsShort(type))} · ${esc(type?.phase || "")}</p>
        </div>
        <button class="icon-btn" type="button" data-action="close-modal" aria-label="Close details">${icon("close")}</button>
      </div>

      <div class="drawer-body">
        <div class="drawer-section drawer-section--split">
          <div class="drawer-purpose">
            <span class="drawer-purpose-label">Active purpose</span>
            <strong>${esc(purposeLabel(column.purpose))}</strong>
            <span class="cell-sub">Since ${formatDate(column.purposeSince || column.activatedAt)}</span>
          </div>
          <div class="drawer-status">
            <div>
              <span class="drawer-purpose-label">Status</span>
              <strong>${columnStatusBadge(column)}</strong>
              <span class="cell-sub">Since ${formatDate(column.statusChangedAt || column.activatedAt)}</span>
            </div>
          </div>
        </div>

        <div class="drawer-section">
          <div class="drawer-section-head">
            <h3 class="drawer-section-title">Lifecycle</h3>
            ${lifeBadge(life)}
          </div>
          <div class="lifecycle-grid">
            <div class="lifecycle-cell">
              <span>In service</span>
              <strong>${formatDaysShort(life.days)}</strong>
            </div>
            <div class="lifecycle-cell">
              <span>Expected life</span>
              <strong>${life.expected.days ? `~${life.expected.days} d` : "—"}</strong>
              <small>n=${life.expected.sample}${life.expected.source === "all" ? " · all types" : ""}</small>
            </div>
            <div class="lifecycle-cell">
              <span>Remaining</span>
              <strong class="${life.state === "due" ? "is-due" : life.state === "soon" ? "is-soon" : ""}">${remainingLabel}</strong>
            </div>
            <div class="lifecycle-cell">
              <span>Est. replacement</span>
              <strong>${replacement}</strong>
            </div>
          </div>
          <p class="field-hint">Expected life is the mean service life of retired columns. It is a planning estimate, not a manufacturer rating.</p>
        </div>

        <div class="drawer-section">
          <h3 class="drawer-section-title">Column specification</h3>
          <dl class="detail-pairs">
            <div class="detail-pair"><dt>Product</dt><dd>${esc(type?.product || "—")}</dd></div>
            <div class="detail-pair"><dt>Supplier</dt><dd>${esc(type?.supplier || "—")}</dd></div>
            <div class="detail-pair"><dt>Dimensions</dt><dd>${esc(typeDimensions(type))}</dd></div>
            <div class="detail-pair"><dt>Phase</dt><dd>${esc(type?.phase || "—")}</dd></div>
          </dl>
        </div>

        <div class="drawer-section">
          <h3 class="drawer-section-title">Registry information</h3>
          <dl class="detail-pairs">
            <div class="detail-pair"><dt>Type</dt><dd>${column.type} · ${esc(type?.name || column.type)}</dd></div>
            <div class="detail-pair"><dt>Year</dt><dd>${column.year}</dd></div>
            <div class="detail-pair"><dt>Sequence</dt><dd>#${column.seq}</dd></div>
            <div class="detail-pair"><dt>Activated</dt><dd>${formatDate(column.activatedAt)}</dd></div>
            <div class="detail-pair"><dt>Type stock</dt><dd>${stock} ${unitWord(stock, "column")} · ${formatCover(cover)} cover</dd></div>
            <div class="detail-pair"><dt>Changes</dt><dd>${Math.max(0, history.length - 1)} ${unitWord(Math.max(0, history.length - 1), "time")}</dd></div>
          </dl>
        </div>

        <div class="drawer-section">
          <h3 class="drawer-section-title">Change history</h3>
          <div class="timeline">
            ${history.map((event) => historyEventHTML(event, column, { interactiveCode: false })).join("")}
          </div>
        </div>
      </div>

      <div class="drawer-foot">
        <button class="btn btn-secondary" type="button" data-action="copy-code" data-code="${columnCode(column)}">${icon("copy")}Copy code</button>
        <button class="btn btn-secondary" type="button" data-action="change-status" data-id="${column.id}">
          ${columnStatus(column) === "active" ? "Mark inactive" : "Reactivate"}
        </button>
        <button class="btn btn-primary" type="button" data-action="change-purpose" data-id="${column.id}">${icon("refresh")}Change purpose</button>
      </div>
    </div>
  `;

  showOverlay(html, { type: "drawer", variant: "overlay--drawer" });
}

/* =========================================================
   Export
   ========================================================= */

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportCsv() {
  const columns = [...columnsForYear()].sort((a, b) => a.activatedAt.localeCompare(b.activatedAt) || a.seq - b.seq);
  const rows = [
    [
      "Column Code",
      "Column Type",
      "Product",
      "Length (mm)",
      "ID (mm)",
      "Particle (um)",
      "Pore (A)",
      "Phase",
      "Purpose",
      "Status",
      "Activated",
      "In Service (days)",
      "Expected Life (days)",
      "Remaining (days)",
      "Status Changed",
      "Activation Notes"
    ],
    ...columns.map((column) => {
      const type = typeByCode(column.type);
      const life = lifecycleFor(column);
      return [
        columnCode(column),
        type?.name || column.type,
        type?.product || "",
        type?.dimensions?.length ?? "",
        type?.dimensions?.diameter ?? "",
        type?.dimensions?.particle ?? "",
        type?.dimensions?.pore ?? "",
        type?.phase || "",
        purposeLabel(column.purpose),
        columnStatusLabel(column),
        column.activatedAt,
        life.days,
        life.expected.days ?? "",
        Number.isFinite(life.remaining) ? life.remaining : "",
        column.statusChangedAt || column.activatedAt,
        activationNote(column)
      ];
    })
  ];

  const csv = "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  downloadFile(`ipc-columns-${ui.year}.csv`, csv, "text/csv;charset=utf-8;");
  showToast(`CSV for ${ui.year} downloaded.`, "success");
}

function exportHistoryCsv() {
  const events = allHistoryEvents(ui.year);
  const rows = [
    ["Date", "Column Code", "Column Type", "Product", "Event", "From", "To", "Purpose", "Note"],
    ...events.map((event) => {
      const type = typeByCode(event.column.type);
      return [
        event.at,
        columnCode(event.column),
        type?.name || event.column.type,
        type?.product || "",
        event.kind === "change" ? "Purpose change" : event.kind === "status" ? "Status change" : "Activation",
        event.from ? (event.kind === "status" ? statusValueLabel(event.from) : purposeLabel(event.from)) : "",
        event.to ? (event.kind === "status" ? statusValueLabel(event.to) : purposeLabel(event.to)) : "",
        event.purpose ? purposeLabel(event.purpose) : "",
        event.note || ""
      ];
    })
  ];

  const csv = "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  downloadFile(`ipc-history-${ui.year}.csv`, csv, "text/csv;charset=utf-8;");
  showToast(`History CSV for ${ui.year} downloaded.`, "success");
}

function exportBackup() {
  const payload = {
    app: "ipc-column-registry",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: db
  };
  downloadFile(
    `ipc-column-registry-backup-${todayISO()}.json`,
    JSON.stringify(payload, null, 2),
    "application/json"
  );
  showToast("Backup JSON downloaded.", "success");
}

function openRestoreModal() {
  if (ui.overlay) hideOverlay(false);

  const html = `
    <div class="modal modal--sm" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal-head">
        <div>
          <p class="eyebrow">Local data</p>
          <h2 id="modalTitle">Restore from backup</h2>
          <p>Import a JSON backup created by this app.</p>
        </div>
        <button class="icon-btn" type="button" data-action="close-modal" aria-label="Close dialog">${icon("close")}</button>
      </div>

      <form id="restoreForm" novalidate>
        <div class="modal-body">
          <div class="restore-warning">
            ${icon("alert")}
            <p>The current stock, columns, and history in this browser will be replaced by the backup. Export the current data first if you need to keep it.</p>
          </div>

          <div class="field">
            <label for="restoreFile"><span>Backup file <span class="required" aria-hidden="true">*</span></span></label>
            <input class="input file-input" id="restoreFile" name="backup" type="file" accept=".json,application/json" required data-autofocus>
            <p class="field-hint">Only backups exported from this registry are accepted.</p>
          </div>

          <p class="form-error" data-form-error role="alert" hidden></p>
        </div>

        <div class="modal-foot">
          <button class="btn btn-ghost" type="button" data-action="close-modal">Cancel</button>
          <button class="btn btn-primary" type="submit">${icon("database")}Restore backup</button>
        </div>
      </form>
    </div>
  `;

  showOverlay(html, { type: "modal" });
}

async function submitRestore(form) {
  if (!form) return;
  const file = form.elements.backup?.files?.[0];

  if (!file) {
    setFormError(form, "Choose a JSON backup file first.");
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const data = parsed?.data && parsed.data.stock ? parsed.data : parsed;

    if (!data || data.version !== 1 || typeof data.stock !== "object" || !Array.isArray(data.columns)) {
      setFormError(form, "This file is not a valid IPC Column Registry backup.");
      return;
    }

    const columns = data.columns
      .filter((column) => (
        column &&
        typeof column.id === "string" &&
        typeByCode(column.type) &&
        typeof column.activatedAt === "string"
      ))
      .map((column) => {
        const type = typeByCode(column.type);
        const year = Number(column.year) || Number(column.activatedAt.slice(0, 4)) || currentYear();
        const seq = Number(column.seq) || 1;
        const purpose = purposeById(column.purpose)?.id || "apap";
        const history = Array.isArray(column.history) ? column.history : [];

        if (!history.some((event) => event?.kind === "activation")) {
          history.unshift({
            kind: "activation",
            at: column.activatedAt,
            purpose,
            note: "",
            createdAt: `${column.activatedAt}T00:00:00.000Z`
          });
        }

        return {
          id: column.id,
          type: type.code,
          seq,
          year,
          activatedAt: column.activatedAt,
          purpose,
          purposeSince: column.purposeSince || column.activatedAt,
          status: column.status === "inactive" ? "inactive" : "active",
          statusChangedAt: column.statusChangedAt || column.activatedAt,
          createdAt: column.createdAt || `${column.activatedAt}T00:00:00.000Z`,
          history
        };
      });

    if (!columns.length && data.columns.length) {
      setFormError(form, "The backup contains columns, but none are valid for the current type list.");
      return;
    }

    const stock = {};
    TYPES.forEach((type) => {
      const value = Number(data.stock[type.code]);
      stock[type.code] = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
    });

    const stockMovements = Array.isArray(data.stockMovements)
      ? data.stockMovements
        .filter((movement) => movement && typeByCode(movement.type) && typeof movement.at === "string")
        .map((movement) => ({
          id: typeof movement.id === "string" ? movement.id : uid(),
          at: movement.at,
          type: typeByCode(movement.type).code,
          delta: Number(movement.delta) || 0,
          before: Number(movement.before) || 0,
          after: Number(movement.after) || 0,
          note: String(movement.note || ""),
          createdAt: movement.createdAt || `${movement.at}T00:00:00.000Z`
        }))
      : [];

    db = {
      version: 1,
      stock,
      columns,
      stockMovements,
      updatedAt: new Date().toISOString()
    };

    const latestYear = Math.max(...columns.map((column) => column.year));
    if (Number.isFinite(latestYear)) {
      ui.year = latestYear;
      saveYear();
    }
    ui.stockFocus = null;
    ui.pendingScroll = false;

    saveDb();
    hideOverlay(false);
    render();
    showToast(`Backup restored: ${columns.length} columns and ${totalStock()} stock.`, "success");
  } catch (error) {
    setFormError(form, "The file could not be read. Choose a valid JSON backup.");
  }
}

/* =========================================================
   Overlay manager
   ========================================================= */

function showOverlay(html, { type = "modal", variant = "" } = {}) {
  const root = document.getElementById("modalRoot");
  if (!root) return;

  ui.lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  ui.overlay = type;
  ui.searchIndex = 0;

  root.innerHTML = `<div class="overlay ${variant}" data-close-overlay="true">${html}</div>`;
  document.body.classList.add("overlay-open");

  requestAnimationFrame(() => {
    const autofocus = root.querySelector("[data-autofocus]");
    const fallback = root.querySelector("input, select, textarea, button, a[href]");
    (autofocus || fallback)?.focus();
  });
}

function hideOverlay(restoreFocus = true) {
  const root = document.getElementById("modalRoot");
  if (root) root.innerHTML = "";
  document.body.classList.remove("overlay-open");
  ui.overlay = null;

  if (restoreFocus && ui.lastFocus && document.contains(ui.lastFocus)) {
    try {
      ui.lastFocus.focus();
    } catch (error) {
      // Focus restoration is best effort.
    }
  }
  ui.lastFocus = null;
}

function openSearch() {
  if (ui.overlay) return;

  const html = `
    <div class="search-modal" role="dialog" aria-modal="true" aria-labelledby="searchTitle">
      <h2 id="searchTitle" class="sr-only">Search IPC Column Registry</h2>
      <div class="search-box">
        ${icon("search")}
        <input id="searchInput" type="search" placeholder="Search code, type, or purpose…" autocomplete="off" data-autofocus aria-controls="searchResults">
        <span class="search-esc">Esc</span>
      </div>
      <div class="search-results" id="searchResults"></div>
      <div class="search-foot">
        <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
        <span><kbd>Enter</kbd> open</span>
        <span><kbd>Esc</kbd> close</span>
      </div>
    </div>
  `;

  showOverlay(html, { type: "search", variant: "overlay--search" });
  renderSearchResults("");
}

function renderSearchResults(rawQuery) {
  const container = document.getElementById("searchResults");
  if (!container) return;

  const query = String(rawQuery || "").trim().toLocaleLowerCase("en");
  const columnResults = [];
  const typeResults = [];
  const pageResults = [];

  if (query) {
    const sortedColumns = [...db.columns].sort((a, b) => b.year - a.year || b.activatedAt.localeCompare(a.activatedAt));
    for (const column of sortedColumns) {
      const type = typeByCode(column.type);
      const haystack = `${columnCode(column)} ${type?.name || ""} ${purposeLabel(column.purpose)} ${column.year}`.toLocaleLowerCase("en");
      if (haystack.includes(query)) columnResults.push(column);
      if (columnResults.length >= 8) break;
    }

    for (const type of TYPES) {
      const haystack = `${type.code} ${type.name} ${type.product} ${type.phase} ${typeDimensions(type)}`.toLocaleLowerCase("en");
      if (haystack.includes(query)) typeResults.push(type);
    }

    for (const page of PAGES) {
      if (`${page.label} ${page.sub}`.toLocaleLowerCase("en").includes(query)) pageResults.push(page);
    }
  }

  const blocks = [];

  if (!query) {
    blocks.push(`<p class="search-group-label">Quick access</p>`);
    blocks.push(PAGES.map(searchPageHTML).join(""));
    blocks.push(`<p class="search-group-label">Column types</p>`);
    blocks.push(TYPES.slice(0, 5).map(searchTypeHTML).join(""));
  } else {
    if (columnResults.length) {
      blocks.push(`<p class="search-group-label">Columns</p>`);
      blocks.push(columnResults.map(searchColumnHTML).join(""));
    }
    if (typeResults.length) {
      blocks.push(`<p class="search-group-label">Column types</p>`);
      blocks.push(typeResults.map(searchTypeHTML).join(""));
    }
    if (pageResults.length) {
      blocks.push(`<p class="search-group-label">Pages</p>`);
      blocks.push(pageResults.map(searchPageHTML).join(""));
    }
    if (!blocks.length) {
      blocks.push(`<p class="search-empty">No results for “${esc(rawQuery)}”.</p>`);
    }
  }

  container.innerHTML = blocks.join("");
  ui.searchIndex = 0;
  container.querySelectorAll(".search-result").forEach((result, index) => {
    result.classList.toggle("is-selected", index === 0);
  });
}

function searchColumnHTML(column) {
  const type = typeByCode(column.type);
  return `
    <button class="search-result" type="button" data-action="search-column" data-id="${column.id}">
      <span class="search-result-icon">${icon("column")}</span>
      <span class="search-result-main">
        <strong>${columnCode(column)}</strong>
        <small>${esc(type?.name || column.type)} · ${esc(purposeLabel(column.purpose))}</small>
      </span>
      ${columnStatusBadge(column)}
      <svg class="icon chevron" aria-hidden="true"><use href="#i-chevron-right"></use></svg>
    </button>
  `;
}

function searchTypeHTML(type) {
  return `
    <button class="search-result" type="button" data-action="search-href" data-href="#/types/${type.code}">
      <span class="search-result-icon">${icon("layers")}</span>
      <span class="search-result-main">
        <strong>${esc(type.name)}</strong>
        <small>Code ${type.code} · ${esc(typeDimensionsShort(type))} · ${db.stock[type.code] || 0} in stock</small>
      </span>
      <svg class="icon chevron" aria-hidden="true"><use href="#i-chevron-right"></use></svg>
    </button>
  `;
}

function searchPageHTML(page) {
  return `
    <button class="search-result" type="button" data-action="search-href" data-href="${page.href}">
      <span class="search-result-icon">${icon(page.icon)}</span>
      <span class="search-result-main">
        <strong>${esc(page.label)}</strong>
        <small>${esc(page.sub)}</small>
      </span>
      <svg class="icon chevron" aria-hidden="true"><use href="#i-chevron-right"></use></svg>
    </button>
  `;
}

function moveSearchSelection(direction) {
  const results = [...document.querySelectorAll(".search-result")];
  if (!results.length) return;

  let index = results.findIndex((result) => result.classList.contains("is-selected"));
  if (index === -1) index = 0;
  index = (index + direction + results.length) % results.length;

  results.forEach((result, resultIndex) => {
    result.classList.toggle("is-selected", resultIndex === index);
  });
  ui.searchIndex = index;
  results[index].scrollIntoView({ block: "nearest" });
}

/* =========================================================
   Toasts
   ========================================================= */

function showToast(message, tone = "success") {
  const root = document.getElementById("toastRoot");
  if (!root) return;

  const toast = document.createElement("div");
  toast.className = `toast${tone === "error" ? " toast--error" : tone === "info" ? " toast--info" : ""}`;
  toast.innerHTML = `${icon(tone === "error" ? "alert" : tone === "info" ? "database" : "check")}<span>${esc(message)}</span>`;
  root.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add("is-leaving");
    window.setTimeout(() => toast.remove(), 220);
  }, 3200);
}

/* =========================================================
   Sidebar / reset / stock actions
   ========================================================= */

function syncSidebarInert() {
  const sidebar = document.getElementById("sidebar");
  const workspace = document.querySelector(".workspace");
  const isMobile = window.innerWidth <= 900;
  const isOpen = document.body.classList.contains("sidebar-open");

  if (sidebar) sidebar.inert = isMobile && !isOpen;
  if (workspace) workspace.inert = isMobile && isOpen;
}

function openSidebar() {
  document.body.classList.add("sidebar-open");
  const button = document.querySelector('[data-action="open-sidebar"]');
  if (button) button.setAttribute("aria-expanded", "true");
  syncSidebarInert();

  requestAnimationFrame(() => {
    const target = document.querySelector(".sidebar .nav-link.active") || document.querySelector(".sidebar .nav-link");
    target?.focus();
  });
}

function closeSidebar(returnFocus = false) {
  const wasOpen = document.body.classList.contains("sidebar-open");
  document.body.classList.remove("sidebar-open");
  const button = document.querySelector('[data-action="open-sidebar"]');
  if (button) button.setAttribute("aria-expanded", "false");
  syncSidebarInert();

  if (wasOpen && returnFocus && window.innerWidth <= 900) {
    button?.focus();
  }
}

function openResetModal() {
  if (ui.overlay) hideOverlay(false);

  const html = `
    <div class="modal modal--sm" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal-head">
        <div>
          <p class="eyebrow">Local data</p>
          <h2 id="modalTitle">Reset demo data?</h2>
          <p>All changes in this browser will be replaced.</p>
        </div>
        <button class="icon-btn" type="button" data-action="close-modal" aria-label="Close dialog">${icon("close")}</button>
      </div>
      <div class="modal-body">
        <p class="page-sub" style="max-width:none">
          Stock, activations, and history you created will be deleted and replaced with the initial demo data.
          This cannot be undone.
        </p>
      </div>
      <div class="modal-foot">
        <button class="btn btn-secondary" type="button" data-action="close-modal" data-autofocus>Cancel</button>
        <button class="btn btn-danger" type="button" data-action="confirm-reset">${icon("refresh")}Reset data</button>
      </div>
    </div>
  `;

  showOverlay(html, { type: "modal" });
}

function resetDemo() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // In-memory reset still works.
  }
  db = seedDb();
  saveDb();
  const latestSeedYear = Math.max(...db.columns.map((column) => column.year));
  ui.year = Number.isFinite(latestSeedYear) ? latestSeedYear : currentYear();
  saveYear();
  ui.stockFocus = null;
  ui.pendingScroll = false;
  hideOverlay(false);
  render();
  requestAnimationFrame(() => document.getElementById("main")?.focus({ preventScroll: true }));
  showToast("Demo data reset.", "success");
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(`Code ${text} copied.`, "success");
    return;
  } catch (error) {
    // Fall back to a temporary textarea.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    showToast(`Code ${text} copied.`, "success");
  } catch (error) {
    showToast("Could not copy the code. Copy it manually from the column detail.", "error");
  }
}

/* =========================================================
   Events
   ========================================================= */

function bindEvents() {
  document.addEventListener("click", (event) => {
    const comboOption = event.target.closest("[data-combo-option]");
    if (comboOption) {
      chooseComboOption(comboOption.closest("[data-combo]"), comboOption);
      return;
    }

    const comboInput = event.target.closest("[data-combo-input]");
    if (comboInput) {
      openCombo(comboInput.closest("[data-combo]"));
      return;
    }

    const statusTab = event.target.closest("[data-status-tab]");
    if (statusTab) {
      const scope = statusTab.closest("[data-filter-scope]");
      const hiddenStatus = scope?.querySelector('[data-filter="status"]');
      if (scope && hiddenStatus) {
        hiddenStatus.value = statusTab.dataset.statusTab || "";
        scope.querySelectorAll("[data-status-tab]").forEach((tab) => {
          const active = tab === statusTab;
          tab.classList.toggle("is-active", active);
          tab.setAttribute("aria-pressed", String(active));
        });
        applyFilters(scope);
      }
      return;
    }

    const actionElement = event.target.closest("[data-action]");

    if (actionElement) {
      const action = actionElement.dataset.action;

      if (action === "toggle-theme") {
        const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        applyTheme(next);
        return;
      }

      if (action === "open-sidebar") {
        openSidebar();
        return;
      }

      if (action === "close-sidebar") {
        closeSidebar(true);
        return;
      }

      if (action === "add-column") {
        openAddModal(actionElement.dataset.type || "");
        return;
      }

      if (action === "open-column") {
        openColumnDrawer(actionElement.dataset.id);
        return;
      }

      if (action === "change-purpose") {
        openChangePurposeModal(actionElement.dataset.id);
        return;
      }

      if (action === "change-status") {
        openStatusModal(actionElement.dataset.id);
        return;
      }

      if (action === "adjust-stock") {
        openStockAdjustModal(actionElement.dataset.type);
        return;
      }

      if (action === "close-modal") {
        hideOverlay();
        return;
      }

      if (action === "open-search") {
        openSearch();
        return;
      }

      if (action === "search-column") {
        const id = actionElement.dataset.id;
        hideOverlay(false);
        openColumnDrawer(id);
        return;
      }

      if (action === "search-href") {
        const href = actionElement.dataset.href || "#/dashboard";
        hideOverlay(false);
        navigate(href, true);
        return;
      }

      if (action === "export-csv") {
        exportCsv();
        return;
      }

      if (action === "export-history") {
        exportHistoryCsv();
        return;
      }

      if (action === "backup-json") {
        exportBackup();
        return;
      }

      if (action === "restore-json") {
        openRestoreModal();
        return;
      }

      if (action === "reset-demo") {
        openResetModal();
        return;
      }

      if (action === "confirm-reset") {
        resetDemo();
        return;
      }

      if (action === "focus-stock") {
        ui.stockFocus = actionElement.dataset.type || null;
        ui.pendingScroll = true;
        event.preventDefault();
        navigate("stock", true);
        return;
      }

      if (action === "copy-code") {
        copyText(actionElement.dataset.code || "");
        return;
      }
    }

    closeAllCombos();

    const overlay = event.target.closest(".overlay");
    if (overlay && event.target === overlay) {
      hideOverlay();
    }
  });

  document.addEventListener("input", (event) => {
    const target = event.target;

    if (target.matches("[data-combo-input]")) {
      filterCombo(target.closest("[data-combo]"));
    }

    if (target.matches('[data-filter="search"]')) {
      applyFilters(target.closest("[data-filter-scope]"));
      return;
    }

    if (target.id === "searchInput") {
      renderSearchResults(target.value);
      return;
    }

    const addForm = target.closest("#addColumnForm");
    if (addForm) {
      setFormError(addForm, "");
      updateAddPreview();
    }

    const changeForm = target.closest("#changePurposeForm");
    if (changeForm) setFormError(changeForm, "");

    const statusForm = target.closest("#statusForm");
    if (statusForm) setFormError(statusForm, "");

    const stockForm = target.closest("#stockAdjustForm");
    if (stockForm) {
      setFormError(stockForm, "");
      updateStockPreview();
    }
  });

  document.addEventListener("change", (event) => {
    const target = event.target;

    if (target.id === "yearSelect") {
      ui.year = Number(target.value) || currentYear();
      saveYear();
      ui.stockFocus = null;
      render();
      return;
    }

    if (target.matches("[data-sort]")) {
      applySort(target.closest("[data-sort-scope]") || target.closest("[data-filter-scope]"));
      return;
    }

    if (target.matches("[data-filter]") && target.dataset.filter !== "search") {
      applyFilters(target.closest("[data-filter-scope]"));
      return;
    }

    if (target.closest("#restoreForm")) {
      setFormError(target.closest("form"), "");
    }

    const addForm = target.closest("#addColumnForm");
    if (addForm) {
      setFormError(addForm, "");
      updateAddPreview();
    }

    const changeForm = target.closest("#changePurposeForm");
    if (changeForm) setFormError(changeForm, "");

    const statusForm = target.closest("#statusForm");
    if (statusForm) setFormError(statusForm, "");

    const stockForm = target.closest("#stockAdjustForm");
    if (stockForm) {
      setFormError(stockForm, "");
      updateStockPreview();
    }
  });

  document.addEventListener("submit", (event) => {
    if (event.target.id === "addColumnForm") {
      event.preventDefault();
      submitAddColumn(event.target);
      return;
    }

    if (event.target.id === "changePurposeForm") {
      event.preventDefault();
      submitChangePurpose(event.target);
      return;
    }

    if (event.target.id === "statusForm") {
      event.preventDefault();
      submitStatusChange(event.target);
      return;
    }

    if (event.target.id === "stockAdjustForm") {
      event.preventDefault();
      submitStockAdjustment(event.target);
      return;
    }

    if (event.target.id === "restoreForm") {
      event.preventDefault();
      submitRestore(event.target);
    }
  });

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (!ui.overlay) openSearch();
      return;
    }

    const comboInput = event.target.closest("[data-combo-input]");
    if (comboInput) {
      const combo = comboInput.closest("[data-combo]");
      const list = combo?.querySelector(".combo-list");

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (list?.hidden) openCombo(combo);
        moveComboSelection(combo, event.key === "ArrowDown" ? 1 : -1);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        if (list?.hidden) {
          openCombo(combo);
          return;
        }
        const active = combo.querySelector(".combo-option.is-active:not([hidden])");
        const exact = [...combo.querySelectorAll(".combo-option:not([hidden])")]
          .find((option) => option.dataset.label.toLocaleLowerCase("en") === comboInput.value.trim().toLocaleLowerCase("en"));
        const fallback = combo.querySelector(".combo-option:not([hidden])");
        const choice = active || exact || fallback;
        if (choice) chooseComboOption(combo, choice);
        return;
      }

      if (event.key === "Escape" && !list?.hidden) {
        event.preventDefault();
        closeCombo(combo);
        return;
      }

      if (event.key === "Tab") {
        closeCombo(combo);
      }
    }

    if (event.key === "Escape") {
      if (ui.overlay) {
        hideOverlay();
        return;
      }
      if (document.body.classList.contains("sidebar-open")) {
        closeSidebar(true);
        return;
      }
    }

    if (!ui.overlay) return;

    if (ui.overlay === "search") {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveSearchSelection(1);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveSearchSelection(-1);
        return;
      }
      if (event.key === "Enter") {
        const selected = document.querySelector(".search-result.is-selected") || document.querySelector(".search-result");
        if (selected) {
          event.preventDefault();
          selected.click();
        }
        return;
      }
    }

    if (event.key === "Tab") {
      const focusables = [
        ...document.querySelectorAll(
          '#modalRoot a[href], #modalRoot button:not([disabled]), #modalRoot input:not([disabled]), #modalRoot select:not([disabled]), #modalRoot textarea:not([disabled]), #modalRoot [tabindex]:not([tabindex="-1"])'
        )
      ].filter((element) => element.offsetParent !== null);

      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables.at(-1);

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  window.addEventListener("hashchange", () => {
    if (ui.overlay) hideOverlay(false);
    closeSidebar();
    render();
    if (ui.hasRendered) {
      document.getElementById("main")?.focus({ preventScroll: true });
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      closeSidebar();
    } else {
      syncSidebarInert();
    }
  });
}

/* =========================================================
   Boot
   ========================================================= */

function boot() {
  try {
    const params = new URLSearchParams(location.search);
    let changed = false;

    if (params.get("theme") === "dark" || params.get("theme") === "light") {
      localStorage.setItem(THEME_KEY, params.get("theme"));
      changed = true;
    }
    if (params.get("reset") === "1") {
      localStorage.removeItem(STORAGE_KEY);
      changed = true;
    }
    if (changed) {
      history.replaceState(null, "", `${location.pathname}${location.hash}`);
    }
  } catch (error) {
    // Query parameters are optional.
  }

  db = loadDb();
  ui = {
    route: { name: "dashboard" },
    year: loadYear(),
    overlay: null,
    lastFocus: null,
    searchIndex: 0,
    stockFocus: null,
    pendingScroll: false,
    hasRendered: false
  };

  if (!location.hash) {
    try {
      history.replaceState(null, "", "#/dashboard");
    } catch (error) {
      // The app still renders the dashboard when the hash cannot be set.
    }
  }

  applyTheme(loadTheme());
  bindEvents();
  syncSidebarInert();
  updateSaveStatus();
  render();
}

boot();
