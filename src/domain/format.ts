export const formatRupees = (value: number) => {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatCompactRupees = (value: number) => {
  const sign = value < 0 ? "−" : "";
  const absolute = Math.abs(value);
  if (absolute >= 10_000_000) return `${sign}₹${(absolute / 10_000_000).toFixed(absolute % 10_000_000 ? 1 : 0)}Cr`;
  if (absolute >= 100_000) return `${sign}₹${(absolute / 100_000).toFixed(absolute % 100_000 ? 1 : 0)}L`;
  if (absolute >= 1_000) return `${sign}₹${(absolute / 1_000).toFixed(absolute % 1_000 ? 1 : 0)}k`;
  return formatRupees(value);
};

export const formatRange = (range: { min: number; max: number }, compact = false) => {
  const formatter = compact ? formatCompactRupees : formatRupees;
  if (Math.abs(range.max - range.min) < 1) return formatter(range.min);
  return `${formatter(range.min)}–${formatter(range.max)}`;
};

export const formatPercent = (value: number, digits = 1) => `${(value * 100).toFixed(digits)}%`;
