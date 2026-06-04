"use client";

import { useEffect, useState } from "react";

interface PasswordStrengthResult {
  score: number;
  label: string;
  color: string;
  issues: string[];
  passed: boolean;
}

const COLOR_MAP: Record<string, { bar: string; text: string }> = {
  red:     { bar: "bg-red-400",    text: "text-red-500" },
  orange:  { bar: "bg-orange-400", text: "text-orange-500" },
  yellow:  { bar: "bg-yellow-400", text: "text-yellow-600" },
  green:   { bar: "bg-green-400",  text: "text-green-600" },
  emerald: { bar: "bg-emerald-500",text: "text-emerald-600" },
};

const RULES = [
  { label: "En az 8 karakter", pattern: /^.{8,}$/ },
  { label: "Buyuk harf (A-Z)", pattern: /[A-Z]/ },
  { label: "Kucuk harf (a-z)", pattern: /[a-z]/ },
  { label: "Rakam (0-9)",      pattern: /[0-9]/ },
  { label: "Ozel karakter (!@#...)", pattern: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\/\\]/ },
];

export function PasswordStrength({ password }: { password: string }) {
  const [result, setResult] = useState<PasswordStrengthResult | null>(null);

  useEffect(() => {
    if (!password) { setResult(null); return; }

    // Client-side calculation (mirrors backend)
    const COMMON = new Set(["password","123456","12345678","qwerty","abc123","admin","test"]);
    if (COMMON.has(password.toLowerCase())) {
      setResult({ score: 0, label: "Cok Zayif", color: "red", issues: ["Cok yaygin sifre"], passed: false });
      return;
    }

    const issues: string[] = [];
    RULES.forEach(r => { if (!r.pattern.test(password)) issues.push(r.label); });
    const score = RULES.length - issues.length;

    const scoreMap = [
      { label: "Cok Zayif", color: "red" },
      { label: "Zayif",     color: "orange" },
      { label: "Orta",      color: "yellow" },
      { label: "Guclu",     color: "green" },
      { label: "Cok Guclu", color: "emerald" },
    ];
    const s = scoreMap[Math.min(score, 4)];
    setResult({ score, label: s.label, color: s.color, issues, passed: issues.length === 0 });
  }, [password]);

  if (!password || !result) return null;

  const colors = COLOR_MAP[result.color] ?? COLOR_MAP.red;
  const barWidth = `${(result.score / 5) * 100}%`;

  return (
    <div className="mt-2 space-y-2">
      {/* Bar + label */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-300 ${colors.bar}`}
            style={{ width: barWidth }} />
        </div>
        <span className={`text-xs font-semibold ${colors.text} w-20 text-right`}>
          {result.label}
        </span>
      </div>

      {/* Rule checklist */}
      <div className="grid grid-cols-1 gap-1">
        {RULES.map((rule) => {
          const ok = rule.pattern.test(password);
          return (
            <div key={rule.label} className={`flex items-center gap-1.5 text-xs ${ok ? "text-green-600" : "text-gray-400"}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${ok ? "bg-green-100 text-green-600" : "bg-gray-100"}`}>
                {ok ? "✓" : "·"}
              </span>
              {rule.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
