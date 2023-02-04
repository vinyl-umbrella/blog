export function formatDate(pubDate: Date) {
  const d = new Date(pubDate);
  return `${d.getFullYear()} /
          ${(d.getMonth() + 1).toString().padStart(2, '0')} /
          ${d.getDate().toString().padStart(2, '0')}`;
}
