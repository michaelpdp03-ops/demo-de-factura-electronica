const tones = {
  aprobada: 'bg-accent-soft text-accent ring-1 ring-inset ring-accent/20',
  pendiente: 'bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20',
  rechazada: 'bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-500/20',
  ingreso: 'bg-accent-soft text-accent ring-1 ring-inset ring-accent/20',
  gasto: 'bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-500/20',
  corporativo: 'bg-sky-500/10 text-sky-400 ring-1 ring-inset ring-sky-500/20',
  particular: 'bg-violet-500/10 text-violet-400 ring-1 ring-inset ring-violet-500/20'
}

const labels = {
  aprobada: 'Aprobada',
  pendiente: 'Pendiente',
  rechazada: 'Rechazada',
  ingreso: 'Ingreso',
  gasto: 'Gasto',
  corporativo: 'Corporativo',
  particular: 'Particular'
}

export default function Badge({ value }) {
  const tone = tones[value] || 'bg-bg-elevated text-text-secondary ring-1 ring-inset ring-border-subtle'
  const label = labels[value] || value
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11.5px] font-semibold ${tone}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  )
}
