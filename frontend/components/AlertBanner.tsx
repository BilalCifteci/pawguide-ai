interface Alert {
  severity: "info" | "warning" | "critical";
  category: string;
  message: string;
  recommendation: string;
}

const SEVERITY_STYLES = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  critical: "bg-red-50 border-red-200 text-red-800",
};

const SEVERITY_ICONS = {
  info: "ℹ️",
  warning: "⚠️",
  critical: "🚨",
};

export function AlertBanner({ alert }: { alert: Alert }) {
  return (
    <div
      className={`border rounded-lg p-4 ${SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.info}`}
    >
      <div className="flex gap-3">
        <span className="text-lg">{SEVERITY_ICONS[alert.severity]}</span>
        <div>
          <p className="font-medium">{alert.message}</p>
          <p className="text-sm mt-1 opacity-80">{alert.recommendation}</p>
        </div>
      </div>
    </div>
  );
}
