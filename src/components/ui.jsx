export const inputBase =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-sky-300";
export const selectBase =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-sky-300";
export const checkboxBase =
  "h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500";

export function Page({ children }) {
  return <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>;
}

export function SectionCard({ title, tone="sky", children }) {
  const bg =
    tone === "emerald" ? "from-emerald-50" :
    tone === "lavender" ? "from-indigo-50" : "from-sky-50";
  return (
    <section className="mb-6">
      {title && <h2 className="mb-3 text-lg font-semibold text-slate-800">{title}</h2>}
      <div className={`rounded-2xl border border-slate-200 bg-gradient-to-b ${bg} to-white p-4 shadow-sm`}>
        {children}
      </div>
    </section>
  );
}

export function Field({ label, children, className="" }) {
  return (
    <label className={`block ${className}`}>
      <div className="mb-1 text-xs font-semibold text-slate-600">{label}</div>
      {children}
    </label>
  );
}
