const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function toDate(value: string | Date) {
  if (value instanceof Date) {
    return value;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00`);
  }

  return new Date(value);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return null;
  return dateFormatter.format(toDate(value));
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return null;
  return dateTimeFormatter.format(toDate(value));
}
