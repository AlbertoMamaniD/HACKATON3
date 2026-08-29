export const formatNumber = (value: number, fractionDigits = 1) =>
  new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: fractionDigits === 0 ? 0 : 1,
    maximumFractionDigits: fractionDigits,
  }).format(value);

export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("es-BO", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );

export const formatShortDate = (iso: string) =>
  new Intl.DateTimeFormat("es-BO", { weekday: "short", day: "2-digit" }).format(
    new Date(iso),
  );
