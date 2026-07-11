function StatCard({ label, value, icon: Icon, trend, trendUp, accent = 'primary', className = '' }) {
  const accentStyles = {
    primary: {
      iconBg: 'bg-primary-500/10',
      iconColor: 'text-primary-400',
      trendColor: trendUp ? 'text-primary-400' : 'text-danger-400',
    },
    warning: {
      iconBg: 'bg-warning-500/10',
      iconColor: 'text-warning-400',
      trendColor: trendUp ? 'text-primary-400' : 'text-danger-400',
    },
    danger: {
      iconBg: 'bg-danger-500/10',
      iconColor: 'text-danger-400',
      trendColor: trendUp ? 'text-primary-400' : 'text-danger-400',
    },
    info: {
      iconBg: 'bg-info-500/10',
      iconColor: 'text-info-400',
      trendColor: trendUp ? 'text-primary-400' : 'text-danger-400',
    },
  }

  const styles = accentStyles[accent] || accentStyles.primary

  return (
    <div className={`glass-card-hover p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-surface-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-surface-50">{value}</p>
          {trend && (
            <p className={`text-xs font-medium ${styles.trendColor}`}>{trend}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${styles.iconBg}`}>
            <Icon className={`w-5 h-5 ${styles.iconColor}`} />
          </div>
        )}
      </div>
    </div>
  )
}

export default StatCard
