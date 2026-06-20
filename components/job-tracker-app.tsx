"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { clearJobs, readJobs, writeJobs } from "@/lib/storage";
import type { JobEntry, JobFormState, JobStage } from "@/types/job";
import { JobFormModal } from "@/components/job-form-modal";
import { JobMetrics } from "@/components/job-metrics";
import { JobTable } from "@/components/job-table";

const STAGES: JobStage[] = [
  "Applied",
  "Got a call",
  "Remind recruiter",
  "Interviewed",
  "Waiting for offer",
  "Offered",
];

const EMPTY_FORM: JobFormState = {
  company: "",
  dateApplied: "",
  stage: "Applied",
  salaryOffered: "",
  jobDescription: "",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function readableDate(value: string) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function sanitizeJob(payload: Partial<JobEntry> & { company?: string; jobDescription?: string }): JobEntry {
  const stage = STAGES.includes(payload.stage as JobStage) ? (payload.stage as JobStage) : "Applied";

  return {
    id: String(payload.id || crypto.randomUUID()),
    company: String(payload.company || "").trim(),
    dateApplied: String(payload.dateApplied || today()),
    stage,
    salaryOffered: Math.max(0, Number(payload.salaryOffered || 0)),
    jobDescription: String(payload.jobDescription || "").trim(),
    updatedAt: String(payload.updatedAt || new Date().toISOString()),
  };
}

export function JobTrackerApp() {
  const [hydrated, setHydrated] = useState(false);
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [form, setForm] = useState<JobFormState>(EMPTY_FORM);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    setJobs(readJobs());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeJobs(jobs);
  }, [jobs, hydrated]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...jobs]
      .filter((job) => {
        if (!normalizedQuery) return true;
        return [job.company, job.stage, job.jobDescription]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((a, b) => b.dateApplied.localeCompare(a.dateApplied));
  }, [jobs, query]);

  const metrics = useMemo(() => {
    const total = jobs.length;
    const offers = jobs.filter((job) => job.stage === "Offered").length;
    const active = total - offers;
    const salaries = jobs.map((job) => job.salaryOffered).filter((salary) => salary > 0);
    const averageSalary = salaries.length ? salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length : 0;

    return {
      total,
      active,
      offers,
      averageSalary: currency(averageSalary),
    };
  }, [jobs]);

  const summaryText = metrics.total
    ? `${metrics.total} ${metrics.total === 1 ? "role" : "roles"} tracked across ${new Set(jobs.map((job) => job.stage)).size} stages.`
    : "Track every opportunity from application to offer.";

  const tableCaption = metrics.total
    ? `${metrics.total} saved ${metrics.total === 1 ? "entry" : "entries"}.`
    : "No saved entries yet.";

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => setToast(""), 2200);
  }

  function openAddModal() {
    setEditingJobId(null);
    setForm({
      ...EMPTY_FORM,
      dateApplied: today(),
    });
    setIsModalOpen(true);
  }

  function openEditModal(job: JobEntry) {
    setEditingJobId(job.id);
    setForm({
      company: job.company,
      dateApplied: job.dateApplied,
      stage: job.stage,
      salaryOffered: String(job.salaryOffered || ""),
      jobDescription: job.jobDescription,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingJobId(null);
    setForm(EMPTY_FORM);
  }

  function saveJob(nextForm: JobFormState) {
    const nextJob = sanitizeJob({
      id: editingJobId || crypto.randomUUID(),
      company: nextForm.company,
      dateApplied: nextForm.dateApplied || today(),
      stage: nextForm.stage,
      salaryOffered: Number(nextForm.salaryOffered || 0),
      jobDescription: nextForm.jobDescription,
      updatedAt: new Date().toISOString(),
    });

    if (!nextJob.company) {
      showToast("Company name is required");
      return;
    }

    setJobs((current) => {
      const exists = current.some((job) => job.id === nextJob.id);
      return exists ? current.map((job) => (job.id === nextJob.id ? nextJob : job)) : [nextJob, ...current];
    });
    showToast(editingJobId ? "Application updated" : "Application saved");
    closeModal();
  }

  function deleteJob(id: string) {
    setJobs((current) => current.filter((job) => job.id !== id));
    showToast("Entry deleted");
  }

  function hardReset() {
    const confirmed = window.confirm("Hard reset will permanently clear every saved job entry.");
    if (!confirmed) return;
    clearJobs();
    setJobs([]);
    setQuery("");
    showToast("All data cleared");
  }

  function exportSnapshot() {
    if (!filteredJobs.length) {
      showToast("Add at least one entry before exporting");
      return;
    }

    const width = 1400;
    const rowHeight = 92;
    const headerHeight = 156;
    const footerHeight = 44;
    const height = headerHeight + 58 + filteredJobs.length * rowHeight + footerHeight;
    const scale = window.devicePixelRatio || 1;

    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);

    ctx.fillStyle = "#f8faf7";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#17211f";
    ctx.font = "800 48px Inter, system-ui, sans-serif";
    ctx.fillText("Job Tracker", 44, 76);
    ctx.font = "600 18px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#64706d";
    ctx.fillText(`${filteredJobs.length} visible applications · Exported ${readableDate(today())}`, 46, 112);

    const cols = [
      { label: "Company", x: 46, width: 240 },
      { label: "Date applied", x: 304, width: 150 },
      { label: "Stage", x: 474, width: 190 },
      { label: "Salary offered", x: 688, width: 160 },
      { label: "Description", x: 874, width: 320 },
      { label: "Updated", x: 1218, width: 122 },
    ];

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(32, 138, 1336, 54 + filteredJobs.length * rowHeight);
    ctx.strokeStyle = "#dde6df";
    ctx.strokeRect(32, 138, 1336, 54 + filteredJobs.length * rowHeight);

    ctx.fillStyle = "#eef5ef";
    ctx.fillRect(33, 139, 1334, 53);
    cols.forEach((col) => {
      ctx.fillStyle = "#64706d";
      ctx.font = "800 13px Inter, system-ui, sans-serif";
      ctx.fillText(col.label.toUpperCase(), col.x, 172);
    });

    const stageColors: Record<JobStage, [string, string]> = {
      Applied: ["#e7f5ff", "#14539a"],
      "Got a call": ["#e6fcf5", "#087f5b"],
      "Remind recruiter": ["#fff4e6", "#9a5b13"],
      Interviewed: ["#f3f0ff", "#5f3dc4"],
      "Waiting for offer": ["#fff9db", "#8d6b00"],
      Offered: ["#d3f9d8", "#2b8a3e"],
    };

    const drawText = (text: string, x: number, y: number, maxWidth: number, weight = "500", color = "#17211f") => {
      ctx.font = `${weight} 16px Inter, system-ui, sans-serif`;
      ctx.fillStyle = color;
      const words = String(text || "").split(" ");
      let line = "";
      let lineY = y;
      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        if (ctx.measureText(testLine).width > maxWidth && line) {
          ctx.fillText(line, x, lineY);
          line = word;
          lineY += 20;
        } else {
          line = testLine;
        }
      }
      if (line) ctx.fillText(line, x, lineY);
    };

    const drawRoundedRect = (x: number, y: number, widthValue: number, heightValue: number, radius: number, fill: string) => {
      ctx.beginPath();
      ctx.roundRect(x, y, widthValue, heightValue, radius);
      ctx.fillStyle = fill;
      ctx.fill();
    };

    filteredJobs.forEach((job, index) => {
      const y = 192 + index * rowHeight;
      ctx.fillStyle = index % 2 ? "#fbfdfb" : "#ffffff";
      ctx.fillRect(33, y, 1334, rowHeight);
      ctx.strokeStyle = "#dde6df";
      ctx.beginPath();
      ctx.moveTo(32, y + rowHeight);
      ctx.lineTo(1368, y + rowHeight);
      ctx.stroke();

      drawText(job.company, 46, y + 42, 230, "700");
      drawText(readableDate(job.dateApplied), 304, y + 42, 150, "500", "#64706d");

      const [stageBg, stageFg] = stageColors[job.stage];
      drawRoundedRect(474, y + 16, 168, 36, 12, stageBg);
      drawText(job.stage, 494, y + 40, 135, "800", stageFg);

      drawText(currency(job.salaryOffered), 688, y + 42, 160, "700");
      drawText(job.jobDescription || "No description", 874, y + 34, 308, "500", "#64706d");
      drawText(readableDate(job.updatedAt.slice(0, 10)), 1218, y + 42, 122, "500", "#64706d");
    });

    const link = document.createElement("a");
    link.download = `job-tracker-snapshot-${today()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    showToast("PNG snapshot exported");
  }

  if (!hydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#dde6df] border-t-[#087f5b]" />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-white/70 bg-[rgba(255,255,255,0.86)] shadow-[0_18px_50px_rgba(21,38,33,0.12)] backdrop-blur-md">
        <div className="border-b border-[#dde6df] px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <span className="inline-flex w-fit rounded-full border border-[#dff6ec] bg-[#dff6ec] px-3 py-1 text-xs font-semibold tracking-[0.2em] text-[#065f46] uppercase">
                Application desk
              </span>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-[#17211f] sm:text-5xl">Job Tracker</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64706d] sm:text-base">{summaryText}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
              <button
                type="button"
                onClick={exportSnapshot}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dde6df] bg-white px-4 py-3 text-sm font-semibold text-[#17211f] hover:bg-[#f8faf7]"
              >
                <span aria-hidden="true">↧</span>
                Export PNG
              </button>
              <button
                type="button"
                onClick={hardReset}
                className="inline-flex items-center justify-center rounded-xl border border-[#ffd7d2] bg-[#ffe5e1] px-4 py-3 text-sm font-semibold text-[#c2413d] hover:bg-[#ffdcd7]"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#087f5b] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(8,95,70,0.2)] hover:bg-[#065f46]"
              >
                <span aria-hidden="true">＋</span>
                Add job
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <JobMetrics
            total={metrics.total}
            active={metrics.active}
            offers={metrics.offers}
            averageSalary={metrics.averageSalary}
          />

          <section className="rounded-2xl border border-[#dde6df] bg-white p-4 shadow-[0_18px_50px_rgba(21,38,33,0.12)]">
            <div className="flex flex-col gap-4 border-b border-[#dde6df] pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#17211f]">Applications</h2>
                <p className="text-sm text-[#64706d]">{tableCaption}</p>
              </div>

              <div className="flex w-full items-center gap-2 rounded-xl border border-[#dde6df] bg-white px-3 py-2 sm:max-w-sm">
                <span aria-hidden="true" className="text-[#64706d]">
                  ⌕
                </span>
                <input
                  id="searchInput"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search company, stage, description"
                  autoComplete="off"
                  className="w-full border-0 bg-transparent text-sm text-[#17211f] placeholder:text-[#94a3b8] focus:outline-none"
                />
              </div>
            </div>

            <JobTable jobs={filteredJobs} onEdit={openEditModal} onDelete={deleteJob} />
          </section>
        </div>
      </section>

      <JobFormModal
        open={isModalOpen}
        editing={Boolean(editingJobId)}
        form={form}
        onChange={setForm}
        onClose={closeModal}
        onSubmit={() => saveJob(form)}
      />

      <div
        aria-live="polite"
        role="status"
        className={`pointer-events-none fixed bottom-4 right-4 z-50 max-w-[calc(100vw-2rem)] rounded-xl bg-[#17211f] px-4 py-3 text-sm text-white shadow-2xl shadow-black/30 transition-all duration-200 ${toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
      >
        {toast}
      </div>
    </main>
  );
}
