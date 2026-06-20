interface JobMetricsProps {
  total: number;
  active: number;
  offers: number;
  averageSalary: string;
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <article className="rounded-xl border border-white/70 bg-[rgba(255,255,255,0.86)] p-4 shadow-[0_18px_50px_rgba(21,38,33,0.12)] backdrop-blur-md">
      <span className="block text-sm font-medium text-[#64706d]">{label}</span>
      <strong className={`mt-3 block text-3xl font-semibold ${accent}`}>{value}</strong>
    </article>
  );
}

export function JobMetrics({ total, active, offers, averageSalary }: JobMetricsProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Total" value={total} accent="text-[#17211f]" />
      <MetricCard label="Active" value={active} accent="text-[#2563eb]" />
      <MetricCard label="Offers" value={offers} accent="text-[#087f5b]" />
      <MetricCard label="Avg salary" value={averageSalary} accent="text-[#b7791f]" />
    </section>
  );
}
