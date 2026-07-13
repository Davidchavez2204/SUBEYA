function colorForScore(score: number) {
  if (score >= 75) return "#34d399"; // emerald-400
  if (score >= 45) return "#facc15"; // yellow-400
  return "#f87171"; // red-400
}

export function MatchRing({ score, size = 56, strokeWidth = 5, label = "match" }: { score: number; size?: number; strokeWidth?: number; label?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
  const color = colorForScore(score);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-extrabold leading-none" style={{ color, fontSize: size * 0.28 }}>
          {Math.round(score)}%
        </span>
        {label && size >= 56 && <span className="text-[9px] text-muted-foreground uppercase tracking-wide mt-0.5">{label}</span>}
      </div>
    </div>
  );
}
