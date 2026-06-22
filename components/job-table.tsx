"use client";

import { useMemo, useState } from "react";
import type { JobEntry } from "@/types/job";

interface JobTableProps {
  jobs: JobEntry[];
  onEdit: (job: JobEntry) => void;
  onDelete: (id: string) => void;
}

function stageStyles(stage: JobEntry["stage"]) {
  switch (stage) {
    case "Applied":
      return "border-[#a5d8ff] bg-[#e7f5ff] text-[#14539a]";
    case "Got a call":
      return "border-[#96f2d7] bg-[#e6fcf5] text-[#087f5b]";
    case "Remind recruiter":
      return "border-[#ffd8a8] bg-[#fff4e6] text-[#9a5b13]";
    case "Interviewed":
      return "border-[#d0bfff] bg-[#f3f0ff] text-[#5f3dc4]";
    case "Interview going on":
      return "border-[#91caff] bg-[#e0f2fe] text-[#0369a1]";
    case "Waiting for offer":
      return "border-[#ffec99] bg-[#fff9db] text-[#8d6b00]";
    case "Rejected":
      return "border-[#ffc9c9] bg-[#ffe5e1] text-[#c2413d]";
    case "Offered":
      return "border-[#8ce99a] bg-[#d3f9d8] text-[#2b8a3e]";
    default:
      return "border-[#dde6df] bg-white text-[#17211f]";
  }
}

function formatDate(value: string) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function JobTable({ jobs, onEdit, onDelete }: JobTableProps) {
  const [activeDescriptionId, setActiveDescriptionId] = useState<string | null>(null);

  const activeJob = useMemo(
    () => jobs.find((job) => job.id === activeDescriptionId) || null,
    [activeDescriptionId, jobs],
  );

  if (!jobs.length) {
    return (
      <div className="grid place-items-center rounded-xl border border-dashed border-[#dde6df] bg-white px-6 py-16 text-center shadow-[0_18px_50px_rgba(21,38,33,0.12)]">
        <div className="max-w-sm">
          <strong className="block text-lg font-semibold text-[#17211f]">No applications saved</strong>
          <p className="mt-2 text-sm leading-6 text-[#64706d]">Add your first company to start tracking the pipeline.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="hidden overflow-x-auto rounded-xl border border-[#dde6df] bg-white shadow-[0_18px_50px_rgba(21,38,33,0.12)] md:block">
        <div className="relative">
          <div
            className={`pointer-events-none absolute left-1/2 top-4 z-20 w-[min(56rem,calc(100%-2rem))] -translate-x-1/2 transition-all duration-200 ${
              activeJob ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
            }`}
            aria-hidden={!activeJob}
          >
            {activeJob ? (
              <div className="rounded-2xl border border-[#d8e4dc] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,247,0.96))] p-5 shadow-[0_24px_60px_rgba(21,38,33,0.16)] backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4 border-b border-[#dde6df] pb-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#087f5b]">Job Description</p>
                    <h3 className="mt-1 text-xl font-semibold text-[#17211f]">{activeJob.company}</h3>
                  </div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${stageStyles(activeJob.stage)}`}>
                    {activeJob.stage}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3 text-xs text-[#64706d]">
                  <span className="rounded-full bg-[#dff6ec] px-3 py-1 font-semibold text-[#065f46]">
                    Applied {formatDate(activeJob.dateApplied)}
                  </span>
                  <span className="rounded-full bg-[#eef5ef] px-3 py-1 font-semibold text-[#64706d]">
                    Updated {formatDate(activeJob.updatedAt.slice(0, 10))}
                  </span>
                </div>

                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-[#17211f]">
                  {activeJob.jobDescription || "No description added."}
                </p>
              </div>
            ) : null}
          </div>

          <table className="min-w-[1120px] w-full border-collapse">
            <thead className="bg-[#eef5ef] text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#64706d]">
              <tr>
                <th scope="col" className="px-4 py-4">
                  Company
                </th>
                <th scope="col" className="px-4 py-4">
                  Date applied
                </th>
                <th scope="col" className="px-4 py-4">
                  Stage
                </th>
                <th scope="col" className="px-4 py-4">
                  Salary offered
                </th>
                <th scope="col" className="px-4 py-4">
                  Job Description
                </th>
                <th scope="col" className="px-4 py-4">
                  Updated
                </th>
                <th scope="col" className="px-4 py-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  className="border-t border-[#dde6df] text-sm text-[#17211f] transition-colors hover:bg-[#fbfdfb]"
                >
                  <td className="px-4 py-4 font-medium text-[#17211f]">{job.company}</td>
                  <td className="px-4 py-4 text-[#64706d]">{formatDate(job.dateApplied)}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${stageStyles(job.stage)}`}>
                      {job.stage}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[#17211f]">{currency(job.salaryOffered)}</td>
                  <td className="px-4 py-4 text-[#64706d]">
                    <button
                      type="button"
                      onMouseEnter={() => setActiveDescriptionId(job.id)}
                      onMouseLeave={() => setActiveDescriptionId((current) => (current === job.id ? null : current))}
                      onFocus={() => setActiveDescriptionId(job.id)}
                      onBlur={() => setActiveDescriptionId((current) => (current === job.id ? null : current))}
                      onClick={() => setActiveDescriptionId((current) => (current === job.id ? null : job.id))}
                      className="group max-w-[28rem] rounded-lg border border-transparent px-0 py-0 text-left outline-none"
                      aria-label={`Preview full job description for ${job.company}`}
                    >
                      <span className="line-clamp-2 transition-colors group-hover:text-[#087f5b]">
                        {job.jobDescription || "No description added."}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-4 text-[#64706d]">{formatDate(job.updatedAt.slice(0, 10))}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(job)}
                        className="rounded-lg border border-[#dde6df] bg-white px-3 py-2 text-xs font-semibold text-[#17211f] hover:bg-[#f8faf7]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(job.id)}
                        className="rounded-lg border border-[#ffd7d2] bg-[#ffe5e1] px-3 py-2 text-xs font-semibold text-[#c2413d] hover:bg-[#ffdcd7]"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        {jobs.map((job) => {
          const isOpen = activeDescriptionId === job.id;

          return (
            <article
              key={job.id}
              className="rounded-xl border border-[#dde6df] bg-white p-4 shadow-[0_18px_50px_rgba(21,38,33,0.12)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#17211f]">{job.company}</h3>
                  <p className="mt-1 text-xs text-[#64706d]">{formatDate(job.dateApplied)}</p>
                </div>
                <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${stageStyles(job.stage)}`}>
                  {job.stage}
                </span>
              </div>

              <dl className="mt-4 grid gap-3 text-sm">
                <div className="grid gap-1">
                  <dt className="text-[#64706d]">Salary offered</dt>
                  <dd className="font-medium text-[#17211f]">{currency(job.salaryOffered)}</dd>
                </div>
                <div className="grid gap-1">
                  <dt className="text-[#64706d]">Job Description</dt>
                  <dd className="text-[#17211f]">
                    <button
                      type="button"
                      onClick={() => setActiveDescriptionId((current) => (current === job.id ? null : job.id))}
                      className="w-full rounded-xl border border-[#dde6df] bg-[#f8faf7] px-3 py-3 text-left text-sm leading-6 text-[#17211f]"
                      aria-label={`Toggle full job description for ${job.company}`}
                    >
                      <span className="line-clamp-2">{job.jobDescription || "No description added."}</span>
                    </button>
                    <div
                      className={`mt-2 rounded-2xl border border-[#d8e4dc] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,247,0.96))] px-4 py-4 text-sm leading-7 text-[#17211f] shadow-[0_24px_60px_rgba(21,38,33,0.16)] transition-all duration-200 ${
                        isOpen ? "block" : "hidden"
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words">{job.jobDescription || "No description added."}</div>
                    </div>
                  </dd>
                </div>
                <div className="grid gap-1">
                  <dt className="text-[#64706d]">Updated</dt>
                  <dd className="text-[#17211f]">{formatDate(job.updatedAt.slice(0, 10))}</dd>
                </div>
              </dl>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(job)}
                  className="flex-1 rounded-xl border border-[#dde6df] bg-white px-3 py-2 text-sm font-semibold text-[#17211f] hover:bg-[#f8faf7]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(job.id)}
                  className="flex-1 rounded-xl border border-[#ffd7d2] bg-[#ffe5e1] px-3 py-2 text-sm font-semibold text-[#c2413d] hover:bg-[#ffdcd7]"
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
