export const formatRupees = (value: number) => {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, value));
};

export const formatCompactRupees = (value: number) => {
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(value % 10_000_000 ? 1 : 0)}Cr`;
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(value % 100_000 ? 1 : 0)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(value % 1_000 ? 1 : 0)}k`;
  return formatRupees(value);
};

export const formatRange = (range: { min: number; max: number }, compact = false) => {
  const formatter = compact ? formatCompactRupees : formatRupees;
  if (Math.abs(range.max - range.min) < 1) return formatter(range.min);
  return `${formatter(range.min)}–${formatter(range.max)}`;
};

export const formatPercent = (value: number, digits = 1) => `${(value * 100).toFixed(digits)}%`;

