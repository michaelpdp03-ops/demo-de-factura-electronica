import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({ icon: Icon, label, value, change, changeType = 'up', tone = 'neutral', delay = 0 }) {
  const toneRing = {
    neutral: 'text-text-secondary bg-bg-elevated',
    accent: 'text-accent bg-accent-soft',
    danger: 'text-rose-400 bg-rose-500/10',
    blue: 'text-sky-400 bg-sky-500/10'
  }[tone]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="group relative p-5 rounded-xl bg-bg-card border border-border-subtle hover:border-border transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${toneRing}`}>
          <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-[11.5px] font-semibold px-2 py-0.5 rounded-md
            ${changeType === 'up' ? 'text-accent bg-accent-soft' : 'text-rose-400 bg-rose-500/10'}`}>
            {changeType === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change}
          </div>
        )}
      </div>
      <div className="text-[12.5px] text-text-secondary mb-1.5 font-medium">{label}</div>
      <div className="text-2xl font-bold tracking-tight text-text-primary tabular-nums">{value}</div>
    </motion.div>
  )
}
