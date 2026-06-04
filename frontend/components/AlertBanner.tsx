interface Alert {
  severity: "info" | "warning" | "critical";
  category: string;
  message: string;
  recommendation: string;
}

const SEVERITY_CONFIG = {
  info: {
    bg: "bg-blue-50 border-blue-100",
    icon: "ℹ️",
    title: "text-blue-800",
    body: "text-blue-600",
    dot: "bg-blue-400",
  },
  warning: {
    bg: "bg-amber-50 border-amber-100",
    icon: "⚠️",
    title: "text-amber-800",
    body: "text-amber-600",
    dot: "bg-amber-400",
  },
  critical: {
    bg: "bg-red-50 border-red-100",
    icon: "🚨",
    title: "text-red-800",
    body: "text-red-600",
    dot: "bg-red-400",
  },
};

export function AlertBanner({ alert }: { alert: Alert }) {
  const cfg = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.info;

  return (
    <div className={`border rounded-2xl p-4 ${cfg.bg}`}>
      <div className="flex gap-3 items-start">
        <span className="text-xl mt-0.5">{cfg.icon}</span>
        <div className="flex-1">
          <p className={`font-semibold text-sm ${cfg.title}`}>{alert.message}</p>
          <p className={`text-xs mt-1 ${cfg.body}`}>{alert.recommendation}</p>
          <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-white/60 ${cfg.title} font-medium`}>
            {alert.category}
          </span>
        </div>
      </div>
    </div>
  );
}
