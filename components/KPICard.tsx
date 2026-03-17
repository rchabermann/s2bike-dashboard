"use client";

interface KPICardProps {
  label: string;
  value: string;
  subvalue?: string;
  icon: string;
  accentColor: string;
  stagger?: number;
}

export function KPICard({
  label,
  value,
  subvalue,
  icon,
  accentColor,
  stagger = 1,
}: KPICardProps) {
  return (
    <div
      className={`card p-5 animate-in stagger-${stagger} relative overflow-hidden`}
    >
      {/* Glow */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10 blur-2xl"
        style={{ backgroundColor: accentColor }}
      />

      <div className="flex items-start justify-between mb-3">
        <span
          className="text-xl"
          role="img"
          aria-label={label}
        >
          {icon}
        </span>
        <div
          className="w-2 h-2 rounded-full mt-1"
          style={{ backgroundColor: accentColor }}
        />
      </div>

      <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "var(--text-secondary)" }}>
        {label}
      </p>

      <p
        className="mono text-2xl font-medium"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </p>

      {subvalue && (
        <p className="mono text-xs mt-1" style={{ color: accentColor }}>
          {subvalue}
        </p>
      )}
    </div>
  );
}
