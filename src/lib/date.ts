const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return null;
  return dateFormatter.format(toDate(value));
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return null;
  return dateTimeFormatter.format(toDate(value));
}
