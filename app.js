const STAGES = [
  "Applied",
  "Got a call",
  "Remind recruiter",
  "Interviewed",
  "Waiting for offer",
  "Offered",
];

const DB_NAME = "job-tracker-db";
const STORE_NAME = "jobs";
const BACKUP_KEY = "job-tracker-backup";

const els = {
  activeMetric: document.querySelector("#activeMetric"),
  cancelButton: document.querySelector("#cancelButton"),
  closeModalButton: document.querySelector("#closeModalButton"),
  companyInput: document.querySelector("#companyInput"),
  dateInput: document.querySelector("#dateInput"),
  emptyAddButton: document.querySelector("#emptyAddButton"),
  emptyState: document.querySelector("#emptyState"),
  exportButton: document.querySelector("#exportButton"),
  jobsTableBody: document.querySelector("#jobsTableBody"),
  jobForm: document.querySelector("#jobForm"),
  modalBackdrop: document.querySelector("#modalBackdrop"),
  offerMetric: document.querySelector("#offerMetric"),
  openModalButton: document.querySelector("#openModalButton"),
  resetButton: document.querySelector("#resetButton"),
  salaryMetric: document.querySelector("#salaryMetric"),
  searchInput: document.querySelector("#searchInput"),
  stageInput: document.querySelector("#stageInput"),
  summaryText: document.querySelector("#summaryText"),
  table: document.querySelector("table"),
  tableCaption: document.querySelector("#tableCaption"),
  tableSection: document.querySelector(".table-section"),
  toast: document.querySelector("#toast"),
  totalMetric: document.querySelector("#totalMetric"),
};

let db;
let jobs = [];
let toastTimer;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transact(mode, callback) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const result = callback(store);

    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error);
  });
}

function getAllJobs() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveJob(job) {
  await transact("readwrite", (store) => store.put(job));
  await loadJobs();
}

async function deleteJob(id) {
  await transact("readwrite", (store) => store.delete(id));
  await loadJobs();
  showToast("Entry deleted");
}

async function replaceAllJobs(nextJobs) {
  await transact("readwrite", (store) => {
    store.clear();
    nextJobs.forEach((job) => store.put(job));
  });
  await loadJobs();
}

function currency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function readableDate(value) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function sanitizeJob(job) {
  return {
    id: String(job.id || crypto.randomUUID()),
    company: String(job.company || "").trim(),
    dateApplied: String(job.dateApplied || today()),
    stage: STAGES.includes(job.stage) ? job.stage : "Applied",
    salaryOffered: Math.max(0, Number(job.salaryOffered || 0)),
    updatedAt: job.updatedAt || new Date().toISOString(),
  };
}

function renderMetrics() {
  const total = jobs.length;
  const offers = jobs.filter((job) => job.stage === "Offered").length;
  const active = jobs.filter((job) => job.stage !== "Offered").length;
  const salaries = jobs.map((job) => Number(job.salaryOffered)).filter(Boolean);
  const average = salaries.length
    ? salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length
    : 0;

  els.totalMetric.textContent = total;
  els.activeMetric.textContent = active;
  els.offerMetric.textContent = offers;
  els.salaryMetric.textContent = currency(average);
  els.summaryText.textContent = total
    ? `${total} ${total === 1 ? "role" : "roles"} tracked across ${new Set(jobs.map((job) => job.stage)).size} stages.`
    : "Track every opportunity from application to offer.";
  els.tableCaption.textContent = total
    ? `${total} saved ${total === 1 ? "entry" : "entries"}. Click any table field to edit it.`
    : "No saved entries yet.";
}

function makeStageOptions(selectedStage) {
  return STAGES.map((stage) => {
    const option = document.createElement("option");
    option.value = stage;
    option.textContent = stage;
    option.selected = stage === selectedStage;
    return option;
  });
}

function stageClass(stage) {
  return `stage-${stage.toLowerCase().replaceAll(" ", "-")}`;
}

function updateJobField(id, field, value) {
  const job = jobs.find((item) => item.id === id);
  if (!job) return;

  const nextJob = sanitizeJob({
    ...job,
    [field]: field === "salaryOffered" ? Number(value || 0) : value,
    updatedAt: new Date().toISOString(),
  });

  if (!nextJob.company) {
    showToast("Company name is required");
    renderTable();
    return;
  }

  saveJob(nextJob);
}

function buildEditableInput(job, field, type = "text") {
  const input = document.createElement("input");
  input.type = type;
  input.value = job[field];
  if (type === "number") {
    input.min = "0";
    input.step = "1";
  }
  input.addEventListener("change", () => updateJobField(job.id, field, input.value));
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") input.blur();
  });
  return input;
}

function renderTable() {
  const query = els.searchInput.value.trim().toLowerCase();
  const visibleJobs = jobs
    .filter((job) => `${job.company} ${job.stage}`.toLowerCase().includes(query))
    .sort((a, b) => b.dateApplied.localeCompare(a.dateApplied));

  els.jobsTableBody.replaceChildren();
  els.emptyState.style.display = visibleJobs.length ? "none" : "block";

  visibleJobs.forEach((job) => {
    const row = document.createElement("tr");

    const companyCell = document.createElement("td");
    companyCell.append(buildEditableInput(job, "company"));

    const dateCell = document.createElement("td");
    dateCell.append(buildEditableInput(job, "dateApplied", "date"));

    const stageCell = document.createElement("td");
    const stageSelect = document.createElement("select");
    stageSelect.className = `stage-pill ${stageClass(job.stage)}`;
    makeStageOptions(job.stage).forEach((option) => stageSelect.append(option));
    stageSelect.addEventListener("change", () => {
      stageSelect.className = `stage-pill ${stageClass(stageSelect.value)}`;
      updateJobField(job.id, "stage", stageSelect.value);
    });
    stageCell.append(stageSelect);

    const salaryCell = document.createElement("td");
    salaryCell.append(buildEditableInput(job, "salaryOffered", "number"));

    const updatedCell = document.createElement("td");
    updatedCell.textContent = readableDate(job.updatedAt.slice(0, 10));

    const actionCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "row-actions";
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.title = `Delete ${job.company}`;
    deleteButton.setAttribute("aria-label", `Delete ${job.company}`);
    deleteButton.textContent = "×";
    deleteButton.addEventListener("click", () => deleteJob(job.id));
    actions.append(deleteButton);
    actionCell.append(actions);

    row.append(companyCell, dateCell, stageCell, salaryCell, updatedCell, actionCell);
    els.jobsTableBody.append(row);
  });
}

function render() {
  renderMetrics();
  renderTable();
}

async function loadJobs() {
  jobs = (await getAllJobs()).map(sanitizeJob);
  localStorage.setItem(BACKUP_KEY, JSON.stringify(jobs));
  render();
}

async function restoreBackupIfNeeded() {
  const savedJobs = await getAllJobs();
  if (savedJobs.length) return;

  try {
    const backup = JSON.parse(localStorage.getItem(BACKUP_KEY) || "[]");
    if (Array.isArray(backup) && backup.length) {
      await replaceAllJobs(backup.map(sanitizeJob));
    }
  } catch {
    localStorage.removeItem(BACKUP_KEY);
  }
}

function openModal() {
  els.jobForm.reset();
  els.dateInput.value = today();
  els.stageInput.value = "Applied";
  els.modalBackdrop.hidden = false;
  setTimeout(() => els.companyInput.focus(), 0);
}

function closeModal() {
  els.modalBackdrop.hidden = true;
}

function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => els.toast.classList.remove("is-visible"), 2200);
}

async function handleSubmit(event) {
  event.preventDefault();
  const formData = new FormData(els.jobForm);
  const job = sanitizeJob({
    id: crypto.randomUUID(),
    company: formData.get("company"),
    dateApplied: formData.get("dateApplied"),
    stage: formData.get("stage"),
    salaryOffered: formData.get("salaryOffered"),
    updatedAt: new Date().toISOString(),
  });

  await saveJob(job);
  closeModal();
  showToast("Application saved");
}

function downloadCanvas(canvas) {
  const link = document.createElement("a");
  link.download = `job-tracker-snapshot-${today()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function drawText(ctx, text, x, y, maxWidth, weight = "500", color = "#17211f") {
  ctx.font = `${weight} 16px Inter, Arial, sans-serif`;
  ctx.fillStyle = color;

  const words = String(text || "").split(" ");
  let line = "";
  let lineY = y;

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, lineY);
      line = word;
      lineY += 22;
      return;
    }
    line = testLine;
  });

  ctx.fillText(line, x, lineY);
}

function drawRoundedRect(ctx, x, y, width, height, radius, fill) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
}

function exportJobs() {
  if (!jobs.length) {
    showToast("Add at least one entry before exporting");
    return;
  }

  const visibleJobs = jobs
    .filter((job) => `${job.company} ${job.stage}`.toLowerCase().includes(els.searchInput.value.trim().toLowerCase()))
    .sort((a, b) => b.dateApplied.localeCompare(a.dateApplied));

  const scale = window.devicePixelRatio || 1;
  const width = 1280;
  const rowHeight = 72;
  const headerHeight = 156;
  const footerHeight = 44;
  const height = headerHeight + 58 + visibleJobs.length * rowHeight + footerHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.fillStyle = "#f8faf7";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#17211f";
  ctx.font = "800 48px Inter, Arial, sans-serif";
  ctx.fillText("Job Tracker", 44, 76);
  ctx.font = "600 18px Inter, Arial, sans-serif";
  ctx.fillStyle = "#64706d";
  ctx.fillText(`${visibleJobs.length} visible applications · Exported ${readableDate(today())}`, 46, 112);

  const cols = [
    { label: "Company", x: 46, width: 300 },
    { label: "Date applied", x: 360, width: 170 },
    { label: "Stage", x: 550, width: 245 },
    { label: "Salary offered", x: 820, width: 190 },
    { label: "Updated", x: 1030, width: 170 },
  ];

  drawRoundedRect(ctx, 32, 138, 1216, 54 + visibleJobs.length * rowHeight, 8, "#ffffff");
  ctx.strokeStyle = "#dde6df";
  ctx.strokeRect(32, 138, 1216, 54 + visibleJobs.length * rowHeight);

  ctx.fillStyle = "#eef5ef";
  ctx.fillRect(33, 139, 1214, 53);
  cols.forEach((col) => drawText(ctx, col.label.toUpperCase(), col.x, 172, col.width, "800", "#64706d"));

  const stageColors = {
    Applied: ["#e7f5ff", "#14539a"],
    "Got a call": ["#e6fcf5", "#087f5b"],
    "Remind recruiter": ["#fff4e6", "#9a5b13"],
    Interviewed: ["#f3f0ff", "#5f3dc4"],
    "Waiting for offer": ["#fff9db", "#8d6b00"],
    Offered: ["#d3f9d8", "#2b8a3e"],
  };

  visibleJobs.forEach((job, index) => {
    const y = 192 + index * rowHeight;
    ctx.fillStyle = index % 2 ? "#fbfdfb" : "#ffffff";
    ctx.fillRect(33, y, 1214, rowHeight);
    ctx.strokeStyle = "#dde6df";
    ctx.beginPath();
    ctx.moveTo(32, y + rowHeight);
    ctx.lineTo(1248, y + rowHeight);
    ctx.stroke();

    drawText(ctx, job.company, 46, y + 43, 300, "750");
    drawText(ctx, readableDate(job.dateApplied), 360, y + 43, 170, "550", "#17211f");

    const [stageBg, stageFg] = stageColors[job.stage] || stageColors.Applied;
    drawRoundedRect(ctx, 550, y + 19, 210, 34, 8, stageBg);
    drawText(ctx, job.stage, 566, y + 42, 180, "800", stageFg);

    drawText(ctx, currency(job.salaryOffered), 820, y + 43, 190, "700");
    drawText(ctx, readableDate(job.updatedAt.slice(0, 10)), 1030, y + 43, 170, "550", "#64706d");
  });

  downloadCanvas(canvas);
  showToast("PNG snapshot exported");
}

async function hardReset() {
  const confirmed = window.confirm("Hard reset will permanently clear every saved job entry.");
  if (!confirmed) return;

  await replaceAllJobs([]);
  localStorage.removeItem(BACKUP_KEY);
  showToast("All data cleared");
}

function bindEvents() {
  els.openModalButton.addEventListener("click", openModal);
  els.emptyAddButton.addEventListener("click", openModal);
  els.closeModalButton.addEventListener("click", closeModal);
  els.cancelButton?.addEventListener("click", closeModal);
  els.jobForm.addEventListener("submit", handleSubmit);
  els.searchInput.addEventListener("input", renderTable);
  els.exportButton.addEventListener("click", exportJobs);
  els.resetButton.addEventListener("click", hardReset);
  els.modalBackdrop.addEventListener("click", (event) => {
    if (event.target === els.modalBackdrop) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.modalBackdrop.hidden) closeModal();
  });
}

async function init() {
  try {
    db = await openDatabase();
    bindEvents();
    await restoreBackupIfNeeded();
    await loadJobs();
  } catch (error) {
    console.error(error);
    showToast("Storage could not start in this browser.");
  }
}

init();
