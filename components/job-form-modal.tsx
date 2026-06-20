"use client";

import { useEffect } from "react";
import type { JobFormState, JobStage } from "@/types/job";

const STAGES: JobStage[] = [
  "Applied",
  "Got a call",
  "Remind recruiter",
  "Interviewed",
  "Waiting for offer",
  "Offered",
];

interface JobFormModalProps {
  open: boolean;
  editing: boolean;
  form: JobFormState;
  onChange: (next: JobFormState) => void;
  onClose: () => void;
  onSubmit: () => void;
}

function updateField<K extends keyof JobFormState>(
  setter: (next: JobFormState) => void,
  form: JobFormState,
  key: K,
  value: JobFormState[K],
) {
  setter({ ...form, [key]: value });
}

export function JobFormModal({ open, editing, form, onChange, onClose, onSubmit }: JobFormModalProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && open) onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-[rgba(23,27,32,0.46)] px-3 py-3 backdrop-blur-[10px] sm:items-center sm:px-4"
      onClick={onClose}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalTitle"
        className="max-h-[92dvh] w-full max-w-2xl overflow-hidden rounded-xl border border-[#dde6df] bg-white shadow-[0_26px_70px_rgba(0,0,0,0.24)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#dde6df] px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#065f46]">New entry</p>
            <h2 id="modalTitle" className="mt-1 text-2xl font-semibold text-[#17211f]">
              {editing ? "Edit job application" : "Save job application"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dde6df] bg-white text-2xl leading-none text-[#17211f] hover:bg-[#f8faf7]"
          >
            ×
          </button>
        </div>

        <form
          className="grid gap-4 overflow-y-auto px-4 py-4 sm:max-h-[calc(92dvh-84px)] sm:px-6 sm:py-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 sm:col-span-1">
              <span className="text-sm font-medium text-[#64706d]">Name of the company</span>
              <input
                required
                value={form.company}
                onChange={(event) => updateField(onChange, form, "company", event.target.value)}
                className="h-12 rounded-xl border border-[#dde6df] bg-[#fbfcfa] px-4 text-[#17211f] placeholder:text-[#94a3b8]"
                placeholder="Example: OpenAI"
                type="text"
              />
            </label>

            <label className="grid gap-2 sm:col-span-1">
              <span className="text-sm font-medium text-[#64706d]">Date of apply</span>
              <input
                required
                value={form.dateApplied}
                onChange={(event) => updateField(onChange, form, "dateApplied", event.target.value)}
                className="h-12 rounded-xl border border-[#dde6df] bg-[#fbfcfa] px-4 text-[#17211f]"
                type="date"
              />
            </label>

            <label className="grid gap-2 sm:col-span-1">
              <span className="text-sm font-medium text-[#64706d]">Stage</span>
              <select
                required
                value={form.stage}
                onChange={(event) => updateField(onChange, form, "stage", event.target.value as JobStage)}
                className="h-12 rounded-xl border border-[#dde6df] bg-[#fbfcfa] px-4 text-[#17211f]"
              >
                {STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 sm:col-span-1">
              <span className="text-sm font-medium text-[#64706d]">Salary Offered</span>
              <input
                value={form.salaryOffered}
                onChange={(event) => updateField(onChange, form, "salaryOffered", event.target.value)}
                className="h-12 rounded-xl border border-[#dde6df] bg-[#fbfcfa] px-4 text-[#17211f] placeholder:text-[#94a3b8]"
                min={0}
                placeholder="120000"
                step="1"
                type="number"
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[#64706d]">Job Description</span>
            <textarea
              value={form.jobDescription}
              onChange={(event) => updateField(onChange, form, "jobDescription", event.target.value)}
              className="min-h-36 rounded-xl border border-[#dde6df] bg-[#fbfcfa] px-4 py-3 text-[#17211f] placeholder:text-[#94a3b8]"
              placeholder="Paste the key responsibilities, stack, or notes about this role..."
              rows={6}
            />
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-[#dde6df] pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-12 rounded-xl border border-[#dde6df] bg-white px-5 font-semibold text-[#17211f] hover:bg-[#f8faf7]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-12 rounded-xl bg-[#087f5b] px-5 font-semibold text-white shadow-[0_10px_24px_rgba(8,95,70,0.2)] hover:bg-[#065f46]"
            >
              Save
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
