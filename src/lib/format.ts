const dateFormat = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeZone: "Asia/Seoul",
});

const dateTimeFormat = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Seoul",
});

export function formatDate(value: string | null) {
  return value ? dateFormat.format(new Date(value)) : "";
}

export function formatDateTime(value: string) {
  return dateTimeFormat.format(new Date(value));
}

export function formatCount(n: number) {
  return new Intl.NumberFormat("ko-KR", { notation: "compact" }).format(n);
}
